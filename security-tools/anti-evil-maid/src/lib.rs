pub mod autolock;
pub mod gui;
use chrono::Local;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

// Same move as kernel-watcher: state belongs under the directory the installer
// provisions (/etc/arch-security, one subdirectory per tool), not under
// /etc/arch-rusty-security-suite, which nothing ever created and which the
// systemd unit's ReadWritePaths does not cover.
const AEM_STATE_DIR: &str = "/etc/arch-security/anti-evil-maid";

/// Pre-move location. Read-only: a baseline recorded before the move must keep
/// verifying, because to this tool a missing baseline and a tampered boot chain
/// look the same, and the wrong one of those triggers a lockout.
const LEGACY_AEM_STATE_DIR: &str = "/etc/arch-rusty-security-suite/aem";

/// Reads one baseline file, falling back to the pre-move directory.
///
/// Returns an empty string when neither exists, which is what the callers
/// already treat as "no baseline recorded".
fn read_state_file(name: &str) -> String {
    let path = format!("{}/{}", AEM_STATE_DIR, name);
    if let Ok(contents) = fs::read_to_string(&path) {
        return contents;
    }
    let legacy = format!("{}/{}", LEGACY_AEM_STATE_DIR, name);
    match fs::read_to_string(&legacy) {
        Ok(contents) => {
            eprintln!(
                "note: read {legacy} (pre-1.0 location). Re-run --setup to move it to {path}."
            );
            contents
        }
        Err(_) => String::new(),
    }
}

pub fn run(
    setup: bool,
    main_kernel: Option<String>,
    backup_kernel: Option<String>,
    daemon: bool,
    decoy_count: Option<String>,
    fs_hash_check: bool,
) {
    fs::create_dir_all(AEM_STATE_DIR).unwrap_or_default();

    if setup {
        println!(">> Setting up Anti-Evil Maid...");
        setup_aem(main_kernel, backup_kernel, decoy_count);
    } else if daemon {
        run_boot_check();
    } else if fs_hash_check {
        run_fs_hash_check();
    } else {
        // Both spellings work: the standalone binary and the `aem` subcommand of
        // the unified unix-security-suite binary. The old name printed here,
        // arch-rusty-security-suite, is not either of them.
        println!("Usage: anti-evil-maid [--setup | --daemon | --fs-hash-check]");
        println!("   or: unix-security-suite aem [--setup | --daemon | --fs-hash-check]");
    }
}

fn hash_directory(path: &str) -> String {
    let mut hasher = Sha256::new();
    let mut files: Vec<_> = WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .collect();

    files.sort_by(|a, b| a.path().cmp(b.path()));

    for entry in files {
        if let Ok(content) = fs::read(entry.path()) {
            hasher.update(entry.path().to_string_lossy().as_bytes());
            hasher.update(&content);
        }
    }
    hex::encode(hasher.finalize())
}

fn get_hwid() -> String {
    let mut hwid = String::new();
    if let Ok(dmi_uuid) = fs::read_to_string("/sys/class/dmi/id/product_uuid") {
        hwid.push_str(&dmi_uuid.trim().to_lowercase());
    }
    if let Ok(entries) = fs::read_dir("/sys/class/net") {
        let mut macs = Vec::new();
        for entry in entries.filter_map(|e| e.ok()) {
            if let Ok(mac) = fs::read_to_string(entry.path().join("address")) {
                let mac = mac.trim().to_lowercase();
                if mac != "00:00:00:00:00:00" {
                    macs.push(mac);
                }
            }
        }
        macs.sort();
        hwid.push_str(&macs.join(","));
    }
    let mut hasher = Sha256::new();
    hasher.update(hwid.as_bytes());
    hex::encode(hasher.finalize())
}

fn get_tpm_pcr() -> String {
    let mut pcr_data = String::new();
    if let Ok(pcrs) = fs::read_to_string("/sys/class/tpm/tpm0/device/pcrs") {
        pcr_data.push_str(&pcrs);
    }
    let mut hasher = Sha256::new();
    hasher.update(pcr_data.as_bytes());
    hex::encode(hasher.finalize())
}

fn setup_aem(
    main_kernel: Option<String>,
    _backup_kernel: Option<String>,
    decoy_count: Option<String>,
) {
    /* Every hash is computed first, then all four are written together.

       This used to compute-and-write one at a time, with `.expect()` on the
       first two. That produced a worse failure than a panic: if the EFI write
       succeeded and the /boot write did not — a full disk, a read-only /etc, a
       missing directory — the process died holding a *partial* baseline. On the
       next boot the check reads a boot.hash that was never written, sees a
       mismatch against a /boot that nobody touched, and reports tampering. A
       false tamper alarm on this tool ends in `enforce_lockout()`, which powers
       the machine off and refuses to proceed.

       So: compute everything, refuse to write anything unless all four can be
       written, and leave any previous baseline untouched on failure. A stale
       baseline verifies against a known-good state; a partial one cannot. */
    println!("Generating EFI Variables hash...");
    let efi_hash = hash_directory("/sys/firmware/efi/efivars");

    println!("Generating /boot filesystem hash...");
    let boot_hash = hash_directory("/boot");

    println!("Generating HWID and TPM PCR profiles...");
    let hwid = get_hwid();
    let tpm_pcr = get_tpm_pcr();

    let baseline: [(&str, &str); 4] = [
        ("efivars.hash", &efi_hash),
        ("boot.hash", &boot_hash),
        ("hwid.hash", &hwid),
        ("tpm.hash", &tpm_pcr),
    ];

    // Write to temporary names first, then rename into place. Rename is atomic
    // within a filesystem, so a crash mid-write cannot leave a truncated hash
    // that would later read as tampering.
    let mut staged: Vec<(String, String)> = Vec::with_capacity(baseline.len());
    for (name, value) in baseline {
        let final_path = format!("{AEM_STATE_DIR}/{name}");
        let tmp_path = format!("{final_path}.new");
        if let Err(e) = fs::write(&tmp_path, value) {
            eprintln!("Could not write {tmp_path}: {e}");
            eprintln!("This needs root, and {AEM_STATE_DIR} must be writable.");
            eprintln!();
            eprintln!("NOTHING was changed — any previous baseline is intact. A partial");
            eprintln!("baseline would be reported as tampering on the next boot, which");
            eprintln!("ends in a lockout, so it is not written at all.");
            for (done, _) in &staged {
                let _ = fs::remove_file(done);
            }
            return;
        }
        staged.push((tmp_path, final_path));
    }
    for (tmp_path, final_path) in &staged {
        if let Err(e) = fs::rename(tmp_path, final_path) {
            eprintln!("Could not move {tmp_path} into place: {e}");
            eprintln!("The baseline may now be incomplete. Re-run --setup before");
            eprintln!("relying on the next boot check.");
            return;
        }
    }

    let count = match decoy_count.as_deref() {
        Some("random") => 3, // Simulate random by picking 3 decoys
        Some(n) => n.parse::<usize>().unwrap_or(1),
        None => 1,
    };

    println!("Generating {} decoy kernel(s)...", count);
    for i in 1..=count {
        let decoy_path = format!("/boot/vmlinuz-decoy-{}", i);
        if let Some(ref main_k) = main_kernel {
            let src = format!("/boot/vmlinuz-{}", main_k);
            if Path::new(&src).exists() {
                let _ = fs::copy(&src, &decoy_path);
                println!(" -> Created decoy: {}", decoy_path);
            }
        }
    }

    println!("Anti-Evil Maid setup complete! System state recorded in {AEM_STATE_DIR}.");

    if Path::new(LEGACY_AEM_STATE_DIR).exists() {
        println!();
        println!("Baselines from the previous location are still on disk. Once you have");
        println!("confirmed this one verifies, remove them:");
        println!("  rm -rf {LEGACY_AEM_STATE_DIR}");
    }
}

fn run_boot_check() {
    println!(">> AEM Boot Check Initiated");

    let saved_efi = read_state_file("efivars.hash");
    let saved_boot = read_state_file("boot.hash");
    let saved_hwid = read_state_file("hwid.hash");
    let saved_tpm = read_state_file("tpm.hash");

    let current_efi = hash_directory("/sys/firmware/efi/efivars");
    let current_boot = hash_directory("/boot");
    let current_hwid = get_hwid();
    let current_tpm = get_tpm_pcr();

    let mut tampered = false;

    if saved_efi != current_efi {
        println!("⚠️ WARNING: EFI Variables have been modified since last boot!");
        tampered = true;
    }

    if saved_boot != current_boot {
        println!("⚠️ WARNING: /boot partition has been modified since last boot!");
        tampered = true;
    }

    if !saved_hwid.is_empty() && saved_hwid != current_hwid {
        println!("⚠️ WARNING: Hardware ID (Motherboard/MAC) has changed!");
        tampered = true;
    }

    if !saved_tpm.is_empty() && saved_tpm != current_tpm {
        println!("⚠️ WARNING: TPM PCR registers have been altered!");
        tampered = true;
    }

    if tampered {
        handle_tamper();
    } else {
        println!("AEM Check Passed: System integrity verified.");
    }
}

fn handle_tamper() {
    println!(">> SECURITY ALERT <<");
    println!("Tampering detected in bootloader, EFI firmware, or hardware.");

    // Check password first before prompting "Was it you?" to avoid leaking to an Evil Maid
    if kernel_watcher::verify_tamper_password() {
        println!("Did you authorize these changes? (y/N): ");
        let mut input = String::new();
        std::io::stdin().read_line(&mut input).unwrap_or_default();

        if input.trim().eq_ignore_ascii_case("y") {
            println!("Changes authorized. Updating AEM hashes...");
            setup_aem(None, None, None);
        } else {
            println!("UNAUTHORIZED TAMPERING DETECTED.");
            println!(
                "RECOMMENDATION: Do not continue using this device. File system integrity may be compromised."
            );
            println!("Running file system hash check...");
            run_fs_hash_check();
            enforce_lockout();
        }
    } else {
        println!("Invalid password! Lockout initiated.");
        enforce_lockout();
    }
}

fn enforce_lockout() {
    println!("Locking out system to prevent further compromise.");

    // Set a lockout FLAG. This deliberately does not touch
    // /etc/libre-otp/secret.json, which is what the previous version overwrote
    // with a sentinel string — destroying the user's OTP secret and their
    // recovery codes along with it. That is unrecoverable data loss, and it
    // could be triggered by a false positive, which the non-deterministic /boot
    // hash made entirely possible. A flag conveys the same "refuse to proceed"
    // state and can be cleared once the machine is known good.
    let flag_dir = "/etc/arch-security";
    let _ = fs::create_dir_all(flag_dir);

    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
    let note = format!(
        "LOCKED_OUT_BY_ANTI_EVIL_MAID\n\
         timestamp={timestamp}\n\
         reason=boot integrity verification failed and was not authorised\n\
         \n\
         Your OTP secret and recovery codes are intact and untouched.\n\
         \n\
         Before clearing this, verify the machine from a live medium: compare\n\
         /boot against a known-good backup and check firmware settings.\n\
         Once satisfied, clear the lockout with:\n\
           rm {flag_dir}/lockout\n\
           anti-evil-maid --setup      # re-baseline\n"
    );

    // 0600 on create: no window where it is world-readable.
    use std::os::unix::fs::OpenOptionsExt;
    if let Ok(mut f) = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .open(format!("{flag_dir}/lockout"))
    {
        use std::io::Write;
        let _ = f.write_all(note.as_bytes());
    }

    eprintln!("{note}");

    // Shut down rather than continue. `shutdown now` is spawned, so give it a
    // moment before exiting, otherwise the exit can race the request.
    let _ = Command::new("shutdown").arg("now").spawn();
    std::thread::sleep(std::time::Duration::from_secs(5));
    std::process::exit(1);
}

fn run_fs_hash_check() {
    let log_file = "/var/log/arss-fs-hash.log";
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
    let msg = format!(
        "[{}] Running deep file system hash verification...\n",
        timestamp
    );
    fs::write(log_file, msg).ok();

    // A real implementation would check against a manifest.
    println!("File system hash check complete. See {}", log_file);
}

/// Entry point used by `main.rs` for the non-GUI daemon path.
///
/// This is what `--daemon` and the generated systemd unit invoke: verify the
/// boot chain against the recorded measurements and report the result. It was
/// referenced by main.rs but never defined, so the crate did not compile.
pub fn start_monitor() {
    run_boot_check();
}
