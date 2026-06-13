// ─────────────────────────────────────────────────────────────────────────────
// Arch Rusty Security Suite by tilas01
// ─────────────────────────────────────────────────────────────────────────────
//
// A unified security toolkit for Arch Linux combining:
//   • OTP        — Native Rust TOTP/OTP 2FA for PAM integration
//   • InputGuard — USB HID input protection (RubberDucky/BadUSB detector)
//   • VerifyISO  — Arch Linux ISO integrity verification
//   • VerifyRelease — Check SHA-256 of a downloaded release binary
//
// Usage:
//   arch-rusty-security-suite <COMMAND>
//
// Commands:
//   otp             Run the Libre-OTP authenticator
//   input-guard     Run the anti-ducky USB HID input guard
//   verify-iso      Verify an Arch Linux ISO against SHA-256 checksums
//   verify-release  Verify a downloaded release binary against its SHA-256
// ─────────────────────────────────────────────────────────────────────────────

use clap::{Parser, Subcommand};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{self, BufRead, BufReader, Read};

/// Arch Rusty Security Suite by tilas01
///
/// A unified security toolkit for Arch Linux.
#[derive(Parser)]
#[command(
    name = "arch-rusty-security-suite",
    version,
    about = "Arch Rusty Security Suite by tilas01 — a unified security toolkit for Arch Linux",
    long_about = "Arch Rusty Security Suite by tilas01\n\n\
        A unified security toolkit combining USB HID input protection,\n\
        TOTP/OTP 2FA, ISO verification, and release integrity checking.\n\n\
        https://github.com/tilas01/arch-guides-dynamic"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run the Libre-OTP authenticator (TOTP/OTP 2FA for PAM)
    #[command(name = "otp")]
    Otp,

    /// Run the anti-ducky USB HID Input Guard daemon
    #[command(name = "input-guard")]
    InputGuard,

    /// Verify an Arch Linux ISO against SHA-256 checksums
    #[command(name = "verify-iso")]
    VerifyIso,

    /// Verify a downloaded release binary against its .sha256 file
    #[command(name = "verify-release")]
    VerifyRelease {
        /// Path to the binary file to verify
        file: String,

        /// Path to the .sha256 checksum file (format: "<hash>  <filename>" or just a raw hash)
        sha256_file: String,
    },

    /// Manage the Malicious Kernel Behavior Watcher (Semi-EDR)
    #[command(name = "kernel-watcher")]
    KernelWatcher {
        /// Setup the Master Tamper Protection Password
        #[arg(long)]
        setup: bool,

        /// Start the Kernel Watcher background daemon
        #[arg(long)]
        start: bool,
    },

    /// Run the Libre-Cyber-ScareCrow Fake VM/Analysis Environment daemon
    #[command(name = "scarecrow")]
    ScareCrow,

    /// Manage the Anti-Evil Maid protection
    #[command(name = "aem")]
    Aem {
        /// Setup AEM
        #[arg(long)]
        setup: bool,

        /// Specify the main kernel
        #[arg(long)]
        main_kernel: Option<String>,

        /// Specify the backup kernel
        #[arg(long)]
        backup_kernel: Option<String>,

        /// Run the AEM daemon
        #[arg(long)]
        daemon: bool,

        /// Number of decoy kernels (or "random")
        #[arg(long)]
        decoy_count: Option<String>,

        /// Run a filesystem hash check
        #[arg(long)]
        fs_hash_check: bool,
    },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Otp => {
            libre_otp::run();
        }
        Commands::InputGuard => {
            anti_ducky::run();
        }
        Commands::VerifyIso => {
            arch_iso_verifier::run();
        }
        Commands::VerifyRelease { file, sha256_file } => {
            verify_release(&file, &sha256_file);
        }
        Commands::KernelWatcher { setup, start } => {
            if setup {
                println!(">> Kernel Watcher setup initiated...");
                kernel_watcher::run_setup();
            } else if start {
                if kernel_watcher::verify_tamper_password() {
                    println!(">> Kernel Watcher daemon starting...");
                    kernel_watcher::start_watcher();
                } else {
                    eprintln!("Authentication failed. Tamper protection activated.");
                    std::process::exit(1);
                }
            } else {
                println!("Usage: arch-rusty-security-suite kernel-watcher --setup OR --start");
            }
        }
        Commands::ScareCrow => {
            scarecrow::init_scarecrow();
        }
        Commands::Aem {
            setup,
            main_kernel,
            backup_kernel,
            daemon,
            decoy_count,
            fs_hash_check,
        } => {
            anti_evil_maid::run(
                setup,
                main_kernel.clone(),
                backup_kernel.clone(),
                daemon,
                decoy_count.clone(),
                fs_hash_check,
            );
        }
    }
}

// ─── verify-release implementation ───────────────────────────────────────────

/// Verify a downloaded release binary against its SHA-256 checksum file.
///
/// Supports two formats for the .sha256 file:
///   1. GNU coreutils: `<hash>  <filename>`
///   2. Raw hash only: `<hash>`
fn verify_release(binary_path: &str, sha256_path: &str) {
    println!("Arch Rusty Security Suite by tilas01 — Release Verifier");
    println!("───────────────────────────────────────────────────────");
    println!();

    // Read expected hash from .sha256 file
    let expected = match read_expected_hash(sha256_path) {
        Ok(h) => h,
        Err(e) => {
            eprintln!("Error reading checksum file '{}': {}", sha256_path, e);
            std::process::exit(1);
        }
    };

    // Compute SHA-256 of binary
    println!("Computing SHA-256 of '{}'...", binary_path);
    let computed = match sha256_file(binary_path) {
        Ok(h) => h,
        Err(e) => {
            eprintln!("Error reading binary file '{}': {}", binary_path, e);
            std::process::exit(1);
        }
    };

    println!("  Computed: {}", computed);
    println!("  Expected: {}", expected);
    println!();

    if computed == expected {
        println!("✓ MATCH — Release binary integrity verified.");
        println!("  The binary has not been tampered with.");
    } else {
        println!("✗ MISMATCH — Release binary integrity check FAILED!");
        println!();
        println!("  WARNING: This binary may have been tampered with.");
        println!("  Download it again from the official GitHub Releases page.");
        std::process::exit(1);
    }
}

/// Read the expected SHA-256 hash from a checksum file.
fn read_expected_hash(path: &str) -> io::Result<String> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line?;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        // Try GNU coreutils format: "<hash>  <filename>"
        if let Some(hash_part) = trimmed.split_whitespace().next() {
            // Validate it looks like a hex hash (64 hex chars for SHA-256)
            let candidate = hash_part.to_lowercase();
            if candidate.len() == 64 && candidate.chars().all(|c| c.is_ascii_hexdigit()) {
                return Ok(candidate);
            }
        }
        // Try raw hash format
        let candidate = trimmed.to_lowercase();
        if candidate.len() == 64 && candidate.chars().all(|c| c.is_ascii_hexdigit()) {
            return Ok(candidate);
        }
    }

    Err(io::Error::new(
        io::ErrorKind::InvalidData,
        "No valid SHA-256 hash found in checksum file",
    ))
}

/// Compute the SHA-256 hash of a file, reading in 8 KiB chunks.
fn sha256_file(path: &str) -> io::Result<String> {
    let file = File::open(path)?;
    let mut reader = BufReader::with_capacity(8192, file);
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];

    loop {
        let n = reader.read(&mut buf)?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}
