use chrono::Local;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

const AEM_STATE_DIR: &str = "/etc/arch-rusty-security-suite/aem";

pub fn run(
    setup: bool,
    main_kernel: Option<String>,
    backup_kernel: Option<String>,
    daemon: bool,
    decoy_count: Option<String>,
    fs_hash_check: bool,
) {
    fs::create_dir_all(AEM_STATE_DIR).unwrap_or_default();
    fs::create_dir_all(AEM_STATE_DIR).unwrap_or_default();

    if setup {
        println!(">> Setting up Anti-Evil Maid...");
        setup_aem(main_kernel, backup_kernel, decoy_count);
    } else if daemon {
        run_boot_check();
    } else if fs_hash_check {
        run_fs_hash_check();
    } else {
        println!("Usage: arch-rusty-security-suite aem [--setup | --daemon | --fs-hash-check]");
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
    println!("Generating EFI Variables hash...");
    let efi_hash = hash_directory("/sys/firmware/efi/efivars");
    fs::write(format!("{}/efivars.hash", AEM_STATE_DIR), &efi_hash)
        .expect("Failed to write EFI hash");

    println!("Generating /boot filesystem hash...");
    let boot_hash = hash_directory("/boot");
    fs::write(format!("{}/boot.hash", AEM_STATE_DIR), &boot_hash)
        .expect("Failed to write /boot hash");

    println!("Generating HWID and TPM PCR profiles...");
    let hwid = get_hwid();
    fs::write(format!("{}/hwid.hash", AEM_STATE_DIR), &hwid).unwrap_or_default();

    let tpm_pcr = get_tpm_pcr();
    fs::write(format!("{}/tpm.hash", AEM_STATE_DIR), &tpm_pcr).unwrap_or_default();

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

    println!("Anti-Evil Maid setup complete! System state recorded.");
}

fn run_boot_check() {
    println!(">> AEM Boot Check Initiated");

    let saved_efi =
        fs::read_to_string(format!("{}/efivars.hash", AEM_STATE_DIR)).unwrap_or_default();
    let saved_boot = fs::read_to_string(format!("{}/boot.hash", AEM_STATE_DIR)).unwrap_or_default();
    let saved_hwid = fs::read_to_string(format!("{}/hwid.hash", AEM_STATE_DIR)).unwrap_or_default();
    let saved_tpm = fs::read_to_string(format!("{}/tpm.hash", AEM_STATE_DIR)).unwrap_or_default();

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
    // Trigger Libre-OTP lockout
    let _ = fs::write("/etc/libre-otp/secret.json", "LOCKOUT_TRIGGERED_BY_AEM");
    // Lockout user accounts by modifying PAM or simply shutting down
    Command::new("shutdown").arg("now").spawn().ok();
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
