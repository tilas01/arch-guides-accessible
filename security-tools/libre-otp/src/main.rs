use totp_rs::{Algorithm, TOTP, Secret};
use std::env;
use std::fs;
use rpassword::read_password;

// Minimal PAM compatible OTP verifier
// Usually the secret would be stored securely in /etc/libre-otp/ or ~/.config/
fn main() {
    let args: Vec<String> = env::args().collect();
    let config_path = "/etc/libre-otp/secret.txt";
    
    // Command to set up the secret
    if args.len() > 1 && args[1] == "--setup" {
        println!("Setting up new Libre-OTP secret...");
        let secret = Secret::generate_secret();
        let _ = fs::create_dir_all("/etc/libre-otp");
        fs::write(config_path, secret.to_bytes().unwrap()).expect("Failed to save secret");
        println!("Secret generated and saved securely.");
        
        let totp = TOTP::new(
            Algorithm::SHA1,
            6,
            1,
            30,
            secret.to_bytes().unwrap(),
        ).unwrap();
        
        println!("Your OTP Secret (Base32): {}", secret.to_base32());
        return;
    }

    // Verify OTP
    let secret_bytes = match fs::read(config_path) {
        Ok(s) => s,
        Err(_) => {
            println!("No secret found. Run with --setup as root first.");
            std::process::exit(1);
        }
    };

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
    ).unwrap();

    print!("Enter OTP Code: ");
    std::io::Write::flush(&mut std::io::stdout()).unwrap();
    
    let user_input = read_password().unwrap();
    let current_time = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();

    if totp.check(&user_input, current_time) {
        // Success
        std::process::exit(0);
    } else {
        println!("Invalid OTP code.");
        std::process::exit(1);
    }
}
