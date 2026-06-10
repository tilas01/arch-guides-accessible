use totp_rs::{Algorithm, TOTP, Secret};
use std::env;
use std::fs;
use rpassword::read_password;
use zeroize::Zeroize;

/// Libre-OTP — Native Rust OTP authenticator for PAM integration.
///
/// Runs the OTP tool as a subcommand. Accepts optional args:
///   --setup    Generate and save a new TOTP secret
///   (default)  Prompt for an OTP code and verify it
pub fn run() {
    let args: Vec<String> = env::args().collect();
    let config_path = "/etc/libre-otp/secret.txt";

    // Command to set up the secret
    if args.iter().any(|a| a == "--setup") {
        println!("Setting up new Libre-OTP secret...");
        let secret = Secret::generate_secret();
        let _ = fs::create_dir_all("/etc/libre-otp");
        let mut secret_bytes = secret.to_bytes().unwrap();
        fs::write(config_path, &secret_bytes).expect("Failed to save secret");
        println!("Secret generated and saved securely.");

        let _totp = TOTP::new(
            Algorithm::SHA1,
            6,
            1,
            30,
            secret_bytes.clone(),
        ).unwrap();

        println!("Your OTP Secret (Base32): {}", secret.to_base32());
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

    let algo = match env::var("OTP_ALGO").unwrap_or_else(|_| "SHA1".to_string()).as_str() {
        "SHA256" => Algorithm::SHA256,
        "SHA512" => Algorithm::SHA512,
        _ => Algorithm::SHA1,
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
    let current_time = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();

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
