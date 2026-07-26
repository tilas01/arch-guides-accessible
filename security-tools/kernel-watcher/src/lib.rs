#![allow(clippy::collapsible_if)]
pub mod connection_monitor;
pub mod gui;
pub mod process_monitor;
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
#[cfg(target_os = "linux")]
use aya::Bpf;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use rand_core::OsRng;
use rpassword::prompt_password;
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::mpsc::channel;
use std::thread;
use std::time::Duration;
use walkdir::WalkDir;
use zeroize::Zeroize;

// State lives under the directory the suite installer provisions — CONFIG_DIR
// in scripts/install-security-suite.sh, which is /etc/arch-security — with one
// subdirectory per tool, matching anti-ducky's /etc/arch-security/anti-ducky/.
//
// Earlier builds wrote to /etc/arch-rusty-security-suite/, which the installer
// never created and which the systemd unit's ReadWritePaths does not cover, so
// the installer provisioned one directory and the tool used another.
const TAMPER_HASH_FILE: &str = "/etc/arch-security/kernel-watcher/tamper.hash";
const EVIL_MAID_HASH_FILE: &str = "/etc/arch-security/kernel-watcher/evil_maid.hash";
const NTFY_TOPIC_FILE: &str = "/etc/arch-security/kernel-watcher/ntfy_topic.conf";

// Pre-move locations. Read-only fallbacks: an install made before the move keeps
// verifying against its existing baseline instead of failing closed on the next
// upgrade, which for check_evil_maid_hash would look exactly like tampering.
const LEGACY_TAMPER_HASH_FILE: &str = "/etc/arch-rusty-security-suite/tamper.hash";
const LEGACY_EVIL_MAID_HASH_FILE: &str = "/etc/arch-rusty-security-suite/evil_maid.hash";
const LEGACY_NTFY_TOPIC_FILE: &str = "/etc/arch-rusty-security-suite/ntfy_topic.conf";

const QUARANTINE_DIR: &str = "/var/quarantine/arss";

/// Reads a state file, falling back to the pre-move location.
///
/// Nothing ever *writes* to the legacy path: a setup run always lands in
/// /etc/arch-security, so the fallback drains as installs are re-baselined. The
/// notice is deliberate — state being read from a path neither the installer nor
/// the unit's ReadWritePaths manages is worth surfacing rather than papering
/// over, since the next `--setup` will silently stop consulting it.
fn read_state(path: &str, legacy: &str) -> std::io::Result<String> {
    match fs::read_to_string(path) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            let contents = fs::read_to_string(legacy)?;
            eprintln!("note: read {legacy} (pre-1.0 location). Re-run setup to move it to {path}.");
            Ok(contents)
        }
        other => other,
    }
}

/// Points at the old copy of a file once the new one has been written, so the
/// user can retire it deliberately rather than leaving a stale hash on disk.
fn note_legacy_leftover(legacy: &str) {
    if Path::new(legacy).exists() {
        println!();
        println!("A copy from the previous location is still on disk. Once you have");
        println!("confirmed the new one works, remove it:");
        println!("  rm {legacy}");
    }
}

pub fn run_setup() {
    println!("=== Kernel Watcher Tamper Protection Setup ===");
    let mut password = prompt_password("Enter a new master password for Tamper Protection: ")
        .expect("Failed to read password");
    let mut confirm =
        prompt_password("Confirm master password: ").expect("Failed to read password");

    if password != confirm {
        password.zeroize();
        confirm.zeroize();
        eprintln!("Passwords do not match. Aborting setup.");
        std::process::exit(1);
    }

    let salt = SaltString::generate(&mut OsRng);
    let password_hash = tamper_argon2()
        .hash_password(password.as_bytes(), &salt)
        .expect("Failed to hash password")
        .to_string();

    password.zeroize();
    confirm.zeroize();

    // 0600, not the umask default. This is a hash of the master password: at
    // 0644 any local user could copy it and brute force offline, which defeats
    // the point of using Argon2 in the first place.
    write_private(TAMPER_HASH_FILE, &password_hash)
        .expect("Failed to write tamper protection hash. Are you root?");
    println!("Tamper Protection password successfully set!");
    note_legacy_leftover(LEGACY_TAMPER_HASH_FILE);
}

/// Argon2id parameters for the tamper-protection master password.
///
/// Argon2::default() is m=19MiB, t=2, p=1 — the OWASP *minimum*. This password
/// guards the controls that decide whether a tampered machine keeps booting, and
/// it is verified interactively at most a few times a day, so spending
/// noticeably more work per attempt is close to free for the legitimate user and
/// expensive for anyone brute forcing a stolen hash.
///
/// m=64MiB, t=3, p=4. Falls back to the library default if the parameters are
/// ever rejected, so a bad constant cannot render the tool unusable.
fn tamper_argon2() -> Argon2<'static> {
    match argon2::Params::new(64 * 1024, 3, 4, None) {
        Ok(params) => Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params),
        Err(_) => Argon2::default(),
    }
}

pub fn verify_tamper_password() -> bool {
    let hash_str = read_state(TAMPER_HASH_FILE, LEGACY_TAMPER_HASH_FILE).unwrap_or_else(|_| {
        eprintln!("Tamper Protection hash not found at {TAMPER_HASH_FILE}. Did you run setup?");
        std::process::exit(1);
    });

    let mut password = prompt_password("Enter Master Password to authorize this action: ")
        .expect("Failed to read password");

    let parsed_hash = PasswordHash::new(hash_str.trim()).expect("Invalid hash format in file");

    // Argon2::default() is correct here and must not be "fixed" to match
    // tamper_argon2(). verify_password reads m, t and p from the PHC string in
    // the stored hash, not from this instance, which is also what keeps hashes
    // written by an earlier parameter set verifying after an upgrade.
    let is_valid = Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();
    password.zeroize();
    is_valid
}

/// Hashes /boot deterministically.
///
/// Three things matter here and the previous version got all three wrong:
///
///  1. **Order.** `WalkDir` iteration order is filesystem-dependent and is not
///     guaranteed stable between runs. Hashing in traversal order meant the
///     baseline could differ from the check on an unchanged /boot, producing
///     false RED ALERTs — which is worse than no alert, because it teaches the
///     user to ignore the one that matters. Entries are now sorted by path.
///  2. **Paths.** Only file *contents* were hashed, so renaming a file, or
///     removing one and adding another with the same bytes, was invisible. The
///     path is now hashed alongside the content.
///  3. **Boundaries.** Concatenating contents with no length prefix means two
///     different file layouts can produce the same byte stream. Each entry now
///     contributes its length explicitly.
fn hash_boot_partition() -> String {
    let mut entries: Vec<_> = WalkDir::new("/boot")
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .collect();

    // Stable, locale-independent ordering.
    entries.sort_by(|a, b| a.path().cmp(b.path()));

    let mut hasher = Sha256::new();
    for entry in entries {
        let path_bytes = entry.path().to_string_lossy().into_owned().into_bytes();
        hasher.update((path_bytes.len() as u64).to_le_bytes());
        hasher.update(&path_bytes);

        match fs::read(entry.path()) {
            Ok(content) => {
                hasher.update((content.len() as u64).to_le_bytes());
                hasher.update(&content);
            }
            Err(_) => {
                // An unreadable file must still affect the hash, or it becomes a
                // blind spot an attacker can hide a payload in.
                hasher.update(u64::MAX.to_le_bytes());
            }
        }
    }
    hex::encode(hasher.finalize())
}

/// Writes a file that only root may read.
///
/// `fs::write` creates with the process umask, typically 0644. For anything
/// deriving from a password that means any local user can copy it and brute
/// force offline at their leisure.
fn write_private(path: &str, contents: &str) -> std::io::Result<()> {
    use std::io::Write;
    use std::os::unix::fs::OpenOptionsExt;

    // 0700 on any directory this creates, for the same reason the file is 0600.
    // recursive() leaves an existing /etc/arch-security alone, so this only
    // tightens the per-tool subdirectory the installer may not have made yet.
    if let Some(parent) = Path::new(path).parent() {
        use std::os::unix::fs::DirBuilderExt;
        fs::DirBuilder::new()
            .recursive(true)
            .mode(0o700)
            .create(parent)?;
    }
    // mode() on create means the file is never briefly world-readable.
    let mut f = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .open(path)?;
    f.write_all(contents.as_bytes())
}

pub fn setup_evil_maid_hash() {
    println!("=== Anti-Evil-Maid Hash Setup ===");
    println!("Hashing /boot partition. This may take a moment...");

    let hash = hash_boot_partition();

    // 0600: the baseline is not secret, but it is integrity-critical, and there
    // is no reason for it to be readable beyond root.
    write_private(EVIL_MAID_HASH_FILE, &hash).expect("Failed to write Evil Maid hash");

    println!(
        "Anti-Evil-Maid baseline hash stored successfully: {}",
        &hash[..16.min(hash.len())]
    );
    note_legacy_leftover(LEGACY_EVIL_MAID_HASH_FILE);
}

pub fn check_evil_maid_hash() -> bool {
    let stored_hash =
        read_state(EVIL_MAID_HASH_FILE, LEGACY_EVIL_MAID_HASH_FILE).unwrap_or_default();

    // Fail CLOSED. This previously returned true ("integrity fine") whenever the
    // baseline was missing or empty, so deleting one file silently disabled the
    // entire check — trivial for exactly the attacker this defends against, who
    // by definition has offline access to the disk.
    if stored_hash.trim().is_empty() {
        eprintln!("\n=======================================================");
        eprintln!("            [ANTI-EVIL-MAID: NO BASELINE]              ");
        eprintln!("=======================================================");
        eprintln!("No integrity baseline was found at {EVIL_MAID_HASH_FILE}");
        eprintln!("(nor at the pre-1.0 location {LEGACY_EVIL_MAID_HASH_FILE}).");
        eprintln!();
        eprintln!("Either this has never been set up, or the baseline was deleted.");
        eprintln!("A missing baseline is NOT treated as a pass: an attacker who can");
        eprintln!("modify /boot can also delete this file.");
        eprintln!();
        eprintln!("If you have not set it up yet, run:  kernel-watcher --setup");
        eprintln!("If you HAVE set it up, treat this as tampering.");
        eprintln!("=======================================================\n");
        return false;
    }

    let current_hash = hash_boot_partition();

    // Note on comparison: this is a plain !=, not a constant-time compare. That
    // is deliberate. The /boot hash is not a secret — an attacker with the disk
    // can compute it themselves — so there is no timing signal worth hiding.
    // Constant-time comparison matters for the password path, which uses
    // argon2's verify_password and is already constant-time.
    if current_hash != stored_hash.trim() {
        eprintln!("\n=======================================================");
        eprintln!("                  [RED ALERT]                          ");
        eprintln!(" ANTI-EVIL-MAID INTEGRITY CHECK FAILED                 ");
        eprintln!("=======================================================");
        eprintln!("The cryptographic hash of the /boot partition DOES NOT MATCH the baseline.");
        eprintln!(
            "This indicates a highly probable EVIL MAID attack (e.g. initramfs/kernel tampering)."
        );
        eprintln!("Do NOT enter your LUKS decryption password.");
        eprintln!("Recommendation: Restore /boot from a trusted backup immediately.");
        eprintln!("=======================================================\n");
        return false;
    }

    println!("Anti-Evil-Maid integrity check passed.");
    true
}

pub fn start_watcher() {
    println!("Starting Kernel Watcher (Semi-EDR File Monitor)...");
    process_monitor::start_process_monitor();

    // Outbound connection monitor. The TTY prompter works on a bare console and
    // over SSH; the GUI supplies its own prompter when launched with -i.
    connection_monitor::start_connection_monitor(Box::new(connection_monitor::TtyPrompter));

    // Start background rootkit scanner
    thread::spawn(|| {
        loop {
            scan_for_rootkits();
            thread::sleep(Duration::from_secs(60));
        }
    });

    let (tx, rx) = channel();

    // Setup the RecommendedWatcher (uses inotify on Linux)
    let mut watcher =
        RecommendedWatcher::new(tx, Config::default()).expect("Failed to create file watcher");

    // Add sensitive paths to monitor for Infostealers, Keyloggers, and Exploits
    let sensitive_paths = vec![
        // System Integrity & Rootkit/Exploit drops
        "/etc/shadow",
        "/etc/passwd",
        "/etc/ld.so.preload", // Common userland rootkit injection
        "/boot",              // Kernel image tampering (Anti-Evil-Maid)
        "/var/spool/cron",    // Cron persistence
        // Infostealer targets (Browsers, SSH, Crypto wallets)
        // Note: In a real deployment, ~ would expand to the user's home dir.
        // For system-wide daemon, we watch common locations.
        "/home/*/.ssh",
        "/home/*/.config/google-chrome/Default/Login Data",
        "/home/*/.mozilla/firefox",
        "/home/*/.aws/credentials",
        "/home/*/.gnupg",
        "/root/.ssh",
        // Software Keyloggers & Input tampers
        "/dev/input", // Unauthorized raw input access
    ];

    for path in sensitive_paths {
        if Path::new(path).exists() {
            watcher
                .watch(Path::new(path), RecursiveMode::Recursive)
                .unwrap_or_else(|e| {
                    eprintln!("Warning: Failed to watch {}: {}", path, e);
                });
            println!("Watching: {}", path);
        }
    }

    println!("Kernel Watcher active. Monitoring for unauthorized access...");

    // Watch loop
    for res in rx {
        match res {
            Ok(event) => handle_event(event),
            Err(e) => eprintln!("watch error: {:?}", e),
        }
    }
}

fn handle_event(event: Event) {
    // In a full EDR, we would analyze the PID that caused the event via auditd or eBPF.
    // For this semi-EDR file watcher, we analyze the path and event type to detect
    // Infostealers, Exploits, and Rootkits.
    if event.kind.is_modify()
        || event.kind.is_remove()
        || event.kind.is_create()
        || event.kind.is_access()
    {
        let mut alert_msg =
            String::from("Arch Rusty Security Suite [ALERT]: Malicious Behavior Detected!\n\n");
        let mut threat_detected = false;

        for path in event.paths {
            let path_str = path.to_string_lossy().to_string();

            // Heuristic Categorization
            if path_str.contains("arss.kdbx") || path_str.contains("keepass_import.csv") {
                alert_msg.push_str(&format!(
                    "[KEEPASSXC INFOSTEALER ALERT] Unauthorized access to ARSS Database!\n  -> {}\n",
                    path_str
                ));
                threat_detected = true;
            } else if path_str.contains(".ssh")
                || path_str.contains("Login Data")
                || path_str.contains(".aws")
            {
                alert_msg.push_str(&format!(
                    "[INFOSTEALER WARNING] Sensitive data accessed:\n  -> {}\n",
                    path_str
                ));
                threat_detected = true;
            } else if path_str.contains("ld.so.preload")
                || path_str.contains("cron")
                || path_str.contains("/boot")
            {
                alert_msg.push_str(&format!(
                    "[ROOTKIT/EXPLOIT WARNING] Critical system path modified:\n  -> {}\n",
                    path_str
                ));
                threat_detected = true;
                quarantine_file(&path_str);
            } else if path_str.contains("/dev/input") {
                alert_msg.push_str(&format!(
                    "[KEYLOGGER WARNING] Unauthorized raw input device manipulation:\n  -> {}\n",
                    path_str
                ));
                threat_detected = true;
            } else {
                alert_msg.push_str(&format!("[SUSPICIOUS] File altered:\n  -> {}\n", path_str));
                threat_detected = true;
            }
        }

        if threat_detected {
            println!("{}", alert_msg.trim());
            send_ntfy_alert(&alert_msg);
        }
    }
}

fn send_ntfy_alert(message: &str) {
    let topic = read_state(NTFY_TOPIC_FILE, LEGACY_NTFY_TOPIC_FILE)
        .unwrap_or_else(|_| String::from("arch_rusty_security_alerts_default"));

    let topic = topic.trim();
    if topic.is_empty() {
        return;
    }

    let url = format!("https://ntfy.sh/{}", topic);
    let _ = Command::new("curl")
        .arg("-d")
        .arg(message)
        .arg(&url)
        .output();
}

fn scan_for_rootkits() {
    // 1. Check for hidden kernel modules by comparing /sys/module to /proc/modules
    let mut sys_modules = HashSet::new();
    if let Ok(entries) = fs::read_dir("/sys/module") {
        for entry in entries.filter_map(|e| e.ok()) {
            if let Ok(name) = entry.file_name().into_string() {
                sys_modules.insert(name);
            }
        }
    }

    if let Ok(proc_modules) = fs::read_to_string("/proc/modules") {
        for line in proc_modules.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if !parts.is_empty() {
                let mod_name = parts[0];
                if !sys_modules.contains(mod_name) {
                    eprintln!(
                        "[ROOTKIT ALERT] Module {} is in /proc/modules but hidden from /sys/module!",
                        mod_name
                    );
                }
            }
        }
    }

    // 2. Memory Integrity - check if kcore is readable and kallsyms isn't hijacked
    // (Simulated advanced check)
    if let Ok(kallsyms) = fs::read_to_string("/proc/kallsyms") {
        if kallsyms.contains("sys_call_table") {
            // A basic integrity check could analyze sys_call_table address
        }
    }
}

fn quarantine_file(path: &str) {
    let _ = fs::create_dir_all(QUARANTINE_DIR);
    let filename = Path::new(path).file_name().unwrap_or_default();
    let dest = format!("{}/{}", QUARANTINE_DIR, filename.to_string_lossy());
    if fs::rename(path, &dest).is_ok() {
        println!(
            "[AUTO-CLEANUP] Malicious artifact {} quarantined to {}",
            path, dest
        );
    } else {
        // Fallback to remove if we can't move
        let _ = fs::remove_file(path);
        println!("[AUTO-CLEANUP] Malicious artifact {} deleted", path);
    }
}
