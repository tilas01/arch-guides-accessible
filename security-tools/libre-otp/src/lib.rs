use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::Rng;
use rand_core::OsRng;
use rpassword::{prompt_password, read_password};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::os::unix::fs::PermissionsExt;
use std::time::{SystemTime, UNIX_EPOCH};
use totp_rs::{Algorithm, Secret, TOTP};
use zeroize::Zeroize;

const CONFIG_PATH: &str = "/etc/libre-otp/secret.json";
const MAX_ATTEMPTS: u32 = 3;

#[derive(Serialize, Deserialize)]
struct OtpState {
    secret_bytes: Vec<u8>,
    algorithm: String,
    recovery_codes: Vec<String>,
    failed_attempts: u32,
    lockout_until: u64,
    lockout_duration_mins: u64,
    bypass_hash: Option<String>,
    bypass_uses_left: u32,
    enforcement_mode: String,
}

/// Simple base32 encoder (RFC 4648)
fn base32_encode(data: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let mut result = String::new();
    let mut bits: u64 = 0;
    let mut num_bits: u32 = 0;

    for &byte in data {
        bits = (bits << 8) | byte as u64;
        num_bits += 8;
        while num_bits >= 5 {
            num_bits -= 5;
            let idx = ((bits >> num_bits) & 0x1F) as usize;
            result.push(ALPHABET[idx] as char);
        }
    }
    if num_bits > 0 {
        let idx = ((bits << (5 - num_bits)) & 0x1F) as usize;
        result.push(ALPHABET[idx] as char);
    }
    while !result.len().is_multiple_of(8) {
        result.push('=');
    }
    result
}

fn generate_recovery_codes(count: usize, length: usize) -> Vec<String> {
    let mut rng = rand::thread_rng();
    let mut codes = Vec::with_capacity(count);
    for _ in 0..count {
        let code: String = (0..length)
            .map(|_| {
                let idx = rng.gen_range(0..36);
                if idx < 10 {
                    (b'0' + idx) as char
                } else {
                    (b'A' + (idx - 10)) as char
                }
            })
            .collect();
        codes.push(code);
    }
    codes
}

fn save_state(state: &OtpState) {
    let json = serde_json::to_string(state).expect("Failed to serialize state");
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(CONFIG_PATH)
        .expect("Failed to open secret file for writing");

    // Enforce strict permissions
    let mut perms = file.metadata().unwrap().permissions();
    perms.set_mode(0o600);
    file.set_permissions(perms).unwrap();

    file.write_all(json.as_bytes())
        .expect("Failed to write state");
}

fn load_state() -> OtpState {
    let data = fs::read_to_string(CONFIG_PATH).unwrap_or_else(|_| {
        println!("No secret found. Run with --setup as root first.");
        std::process::exit(1);
    });
    serde_json::from_str(&data).unwrap_or_else(|_| {
        println!("Failed to parse secret state. File may be corrupted.");
        std::process::exit(1);
    })
}

pub fn run() {
    let args: Vec<String> = env::args().collect();

    if args.iter().any(|a| a == "--setup") {
        println!("Setting up new Libre-OTP secret...");
        let _ = fs::create_dir_all("/etc/libre-otp");

        let algo_str = args
            .iter()
            .find(|a| a.starts_with("--hash="))
            .map(|a| a.trim_start_matches("--hash=").to_uppercase())
            .unwrap_or_else(|| "SHA256".to_string());

        let num_recovery: usize = args
            .iter()
            .find(|a| a.starts_with("--recovery-codes="))
            .map(|a| {
                a.trim_start_matches("--recovery-codes=")
                    .parse()
                    .unwrap_or(5)
            })
            .unwrap_or(5)
            .min(20);

        let rec_len: usize = args
            .iter()
            .find(|a| a.starts_with("--recovery-len="))
            .map(|a| a.trim_start_matches("--recovery-len=").parse().unwrap_or(10))
            .unwrap_or(10)
            .max(8).min(64);

        let enforcement_mode = args
            .iter()
            .find(|a| a.starts_with("--mode="))
            .map(|a| a.trim_start_matches("--mode=").to_string())
            .unwrap_or_else(|| "both".to_string());

        let bypass_uses: u32 = args
            .iter()
            .find(|a| a.starts_with("--bypass-uses="))
            .map(|a| a.trim_start_matches("--bypass-uses=").parse().unwrap_or(0))
            .unwrap_or(0)
            .min(10);

        let mut bypass_hash = None;
        if bypass_uses > 0 {
            println!(
                "You have enabled a bypass password (up to {} uses).",
                bypass_uses
            );
            let mut pw = prompt_password("Enter new bypass password: ").unwrap();
            let mut pw2 = prompt_password("Confirm bypass password: ").unwrap();
            if pw != pw2 {
                println!("Passwords do not match. Aborting setup.");
                std::process::exit(1);
            }
            let salt = SaltString::generate(&mut OsRng);
            let argon2 = Argon2::default();
            
            // Uniqueness check against Tamper Hash if exists
            if let Ok(tamper_hash_str) = fs::read_to_string("/etc/arch-rusty-security-suite/tamper.hash") {
                if let Ok(parsed_tamper) = PasswordHash::new(tamper_hash_str.trim()) {
                    if argon2.verify_password(pw.as_bytes(), &parsed_tamper).is_ok() {
                        println!("ERROR: Bypass password MUST NOT be the same as the Tamper password!");
                        std::process::exit(1);
                    }
                }
            }

            bypass_hash = Some(
                argon2
                    .hash_password(pw.as_bytes(), &salt)
                    .unwrap()
                    .to_string(),
            );
            pw.zeroize();
            pw2.zeroize();
        }

        let secret = Secret::generate_secret();
        let mut secret_bytes = secret.to_bytes().unwrap();
        let recovery_codes = generate_recovery_codes(num_recovery, rec_len);

        let state = OtpState {
            secret_bytes: secret_bytes.clone(),
            algorithm: algo_str.clone(),
            recovery_codes: recovery_codes.clone(),
            failed_attempts: 0,
            lockout_until: 0,
            lockout_duration_mins: 30, // Start at 30 mins
            bypass_hash,
            bypass_uses_left: bypass_uses,
            enforcement_mode,
        };

        save_state(&state);

        println!("Secret generated and saved securely.");
        let base32_sec = base32_encode(&secret_bytes);
        println!("Your OTP Secret (Base32): {}", base32_sec);
        println!("Algorithm: {}", algo_str);
        if algo_str == "SHA512" {
            println!("  -> Note: Apps like 2FAS support SHA512. Google Authenticator may only support SHA1.");
        } else if algo_str == "SHA256" {
            println!("  -> Note: Many modern apps support SHA256, Google Authenticator may only support SHA1.");
        }
        println!("Add this to your TOTP authenticator app.\n");
        println!("WARNING: Save these recovery codes offline! They are your only fallback.");
        for code in &recovery_codes {
            println!("  - {}", code);
        }

        // KeePassXC Integration CSV
        let csv_path = "/etc/libre-otp/keepass_import.csv";
        let mut csv_content = String::from("Group,Title,Username,Password,URL,Notes,TOTP,Icon\n");
        csv_content.push_str(&format!("ARSS,Libre-OTP Root,,{},,,{},0\n", recovery_codes.join(" "), base32_sec));
        fs::write(csv_path, csv_content).unwrap();
        
        let mut perms = fs::metadata(csv_path).unwrap().permissions();
        perms.set_mode(0o600);
        fs::set_permissions(csv_path, perms).unwrap();

        println!("\n[KeePassXC Integration]");
        println!("An importable CSV has been securely generated at: {}", csv_path);
        println!("It contains your TOTP seed and all recovery codes.");
        println!("Import it using KeepassXC GUI or via CLI:");
        println!("  keepassxc-cli import {} ~/.keepassxc/arss.kdbx", csv_path);
        println!("NOTE: The kernel-watcher module will monitor ~/.keepassxc/arss.kdbx to protect it from infostealers once imported.");

        secret_bytes.zeroize();
        return;
    }

    // Verify OTP
    let mut state = load_state();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    if now < state.lockout_until {
        let mins_left = (state.lockout_until - now) / 60;
        println!(
            "System locked due to too many failed attempts. Try again in {} minutes.",
            mins_left
        );
        println!("Only a valid lockout recovery bypass code can override this.");
        print!("Enter Bypass Code: ");
        std::io::Write::flush(&mut std::io::stdout()).unwrap();

        let mut user_input = read_password().unwrap();
        let mut bypassed = false;

        if let Some(ref bh) = state.bypass_hash {
            if state.bypass_uses_left > 0 {
                if let Ok(parsed_hash) = PasswordHash::new(bh.trim()) {
                    let argon2 = Argon2::default();
                    if argon2.verify_password(user_input.as_bytes(), &parsed_hash).is_ok() {
                        bypassed = true;
                        state.bypass_uses_left -= 1;
                        println!("Bypass accepted. {} uses remaining.", state.bypass_uses_left);
                    }
                }
            }
        }

        if !bypassed {
            println!("Invalid bypass code. System remains locked.");
            std::process::exit(1);
        } else {
            state.lockout_until = 0;
            state.failed_attempts = 0;
            state.lockout_duration_mins = 30;
            save_state(&state);
            state.secret_bytes.zeroize();
            std::process::exit(0);
        }
    }

    let algo = match state.algorithm.as_str() {
        "SHA256" => Algorithm::SHA256,
        "SHA512" => Algorithm::SHA512,
        _ => Algorithm::SHA1,
    };

    let totp = TOTP::new(algo, 6, 1, 30, state.secret_bytes.clone()).unwrap();

    print!("Enter OTP or Recovery Code: ");
    std::io::Write::flush(&mut std::io::stdout()).unwrap();

    let mut user_input = read_password().unwrap();
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Check if input is a valid OTP
    let mut success = totp.check(&user_input, current_time);

    // If not, check if it's a valid recovery code
    let mut is_bypass = false;
    if !success {
        if let Some(idx) = state.recovery_codes.iter().position(|c| c == &user_input) {
            success = true;
            is_bypass = true;
            state.recovery_codes.remove(idx); // Consume the code
            println!(
                "Recovery code accepted and consumed. {} codes remaining.",
                state.recovery_codes.len()
            );
        } else if let Some(ref bh) = state.bypass_hash {
            if state.bypass_uses_left > 0 {
                if let Ok(parsed_hash) = PasswordHash::new(bh.trim()) {
                let argon2 = Argon2::default();
                if argon2
                    .verify_password(user_input.as_bytes(), &parsed_hash)
                    .is_ok()
                {
                    success = true;
                    is_bypass = true;
                    state.bypass_uses_left -= 1;
                    println!(
                        "Bypass password accepted. {} uses remaining.",
                        state.bypass_uses_left
                    );
                }
            }
        }
    }
}



    user_input.zeroize();

    if success {
        state.failed_attempts = 0;
        state.lockout_duration_mins = 30; // Reset penalty
        save_state(&state);
        state.secret_bytes.zeroize();
        std::process::exit(0);
    } else {
        state.failed_attempts += 1;
        if state.failed_attempts >= MAX_ATTEMPTS {
            state.lockout_until = now + (state.lockout_duration_mins * 60);
            println!(
                "Too many failed attempts. Locked out for {} minutes.",
                state.lockout_duration_mins
            );

            // Add 30 mins to penalty up to 24 hours (1440 mins)
            state.lockout_duration_mins = (state.lockout_duration_mins + 30).min(1440);
            state.failed_attempts = 0; // Reset attempt counter to wait for lockout
        } else {
            println!(
                "Invalid OTP code. Attempt {}/{}",
                state.failed_attempts, MAX_ATTEMPTS
            );
        }

        save_state(&state);
        state.secret_bytes.zeroize();
        std::process::exit(1);
    }
}
