use totp_rs::{Algorithm, TOTP, Secret};
use std::env;
use std::fs;
use rpassword::read_password;
use zeroize::Zeroize;

/// Simple base32 encoder (RFC 4648) — no external dependency needed
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
    // Pad to multiple of 8
    while result.len() % 8 != 0 {
        result.push('=');
    }
    result
}

/// Libre-OTP — Native Rust OTP authenticator for PAM integration.
///
/// Runs the OTP tool as a subcommand. Accepts optional args:
///   --setup           Generate and save a new TOTP secret
///   --algo=SHA256     Choose algorithm (SHA1, SHA256, SHA512)
///   (default)         Prompt for an OTP code and verify it
pub fn run() {
    let args: Vec<String> = env::args().collect();
    let config_path = "/etc/libre-otp/secret.txt";

    // Detect algorithm from env or args
    let algo_str = args.iter()
        .find(|a| a.starts_with("--algo="))
        .map(|a| a.trim_start_matches("--algo=").to_uppercase())
        .unwrap_or_else(|| env::var("OTP_ALGO").unwrap_or_else(|_| "SHA1".to_string()));

    let algo = match algo_str.as_str() {
        "SHA256" => Algorithm::SHA256,
        "SHA512" => Algorithm::SHA512,
        _ => Algorithm::SHA1,
    };

    // Command to set up the secret
    if args.iter().any(|a| a == "--setup") {
        println!("Setting up new Libre-OTP secret...");
        let secret = Secret::generate_secret();
        let _ = fs::create_dir_all("/etc/libre-otp");
        let mut secret_bytes = secret.to_bytes().unwrap();
        fs::write(config_path, &secret_bytes).expect("Failed to save secret");
        println!("Secret generated and saved securely.");
        println!("Your OTP Secret (Base32): {}", base32_encode(&secret_bytes));
        println!("Algorithm: {}", algo_str);
        println!("Add this to your TOTP authenticator app.");

        secret_bytes.zeroize();
        return;
    }

    // Verify OTP
    let mut secret_bytes = match fs::read(config_path) {
        Ok(s) => s,
        Err(_) => {
            println!("No secret found. Run with --setup as root first.");
            std::process::exit(1);
        }
    };

    let totp = TOTP::new(
        algo,
        6,
        1,
        30,
        secret_bytes.clone(),
    ).unwrap();

    print!("Enter OTP Code: ");
    std::io::Write::flush(&mut std::io::stdout()).unwrap();

    let mut user_input = read_password().unwrap();
    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let success = totp.check(&user_input, current_time);

    // ZEROIZE SENSITIVE MEMORY!
    user_input.zeroize();
    secret_bytes.zeroize();

    if success {
        std::process::exit(0);
    } else {
        println!("Invalid OTP code.");
        std::process::exit(1);
    }
}
