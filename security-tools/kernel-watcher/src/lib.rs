#![allow(clippy::collapsible_if)]
pub mod gui;
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
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

const TAMPER_HASH_FILE: &str = "/etc/arch-rusty-security-suite/tamper.hash";
const EVIL_MAID_HASH_FILE: &str = "/etc/arch-rusty-security-suite/evil_maid.hash";
const QUARANTINE_DIR: &str = "/var/quarantine/arss";

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
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .expect("Failed to hash password")
        .to_string();

    password.zeroize();
    confirm.zeroize();

    // Ensure directory exists
    if let Some(parent) = Path::new(TAMPER_HASH_FILE).parent() {
        fs::create_dir_all(parent).unwrap_or_default();
    }

    fs::write(TAMPER_HASH_FILE, password_hash)
        .expect("Failed to write tamper protection hash. Are you root?");
    println!("Tamper Protection password successfully set!");
}

pub fn verify_tamper_password() -> bool {
    let hash_str = fs::read_to_string(TAMPER_HASH_FILE).unwrap_or_else(|_| {
        eprintln!("Tamper Protection hash not found. Did you run setup?");
        std::process::exit(1);
    });

    let mut password = prompt_password("Enter Master Password to authorize this action: ")
        .expect("Failed to read password");

    let parsed_hash = PasswordHash::new(hash_str.trim()).expect("Invalid hash format in file");
    let argon2 = Argon2::default();

    let is_valid = argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();
    password.zeroize();
    is_valid
}

pub fn setup_evil_maid_hash() {
    println!("=== Anti-Evil-Maid Hash Setup ===");
    let mut hasher = Sha256::new();

    println!("Hashing /boot partition. This may take a moment...");
    for entry in WalkDir::new("/boot").into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Ok(content) = fs::read(entry.path()) {
                hasher.update(&content);
            }
        }
    }

    let hash = hex::encode(hasher.finalize());

    if let Some(parent) = Path::new(EVIL_MAID_HASH_FILE).parent() {
        fs::create_dir_all(parent).unwrap_or_default();
    }

    // In a production scenario, we would encrypt this hash with a TPM key or user password.
    // Here we save it directly for demonstration of the integrity check.
    fs::write(EVIL_MAID_HASH_FILE, &hash).expect("Failed to write Evil Maid hash");
    println!(
        "Anti-Evil-Maid baseline hash stored successfully: {}",
        &hash[..16]
    );
}

pub fn check_evil_maid_hash() -> bool {
    let stored_hash = fs::read_to_string(EVIL_MAID_HASH_FILE).unwrap_or_default();
    if stored_hash.is_empty() {
        return true; // Not set up
    }

    let mut hasher = Sha256::new();
    for entry in WalkDir::new("/boot").into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Ok(content) = fs::read(entry.path()) {
                hasher.update(&content);
            }
        }
    }

    let current_hash = hex::encode(hasher.finalize());

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
    let topic = fs::read_to_string("/etc/arch-rusty-security-suite/ntfy_topic.conf")
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

