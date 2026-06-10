use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use rpassword::prompt_password;
use std::fs;
use std::path::Path;
use std::sync::mpsc::channel;

const TAMPER_HASH_FILE: &str = "/etc/arch-rusty-security-suite/tamper.hash";

pub fn run_setup() {
    println!("=== Kernel Watcher Tamper Protection Setup ===");
    let password = prompt_password("Enter a new master password for Tamper Protection: ")
        .expect("Failed to read password");
    let confirm = prompt_password("Confirm master password: ")
        .expect("Failed to read password");

    if password != confirm {
        eprintln!("Passwords do not match. Aborting setup.");
        std::process::exit(1);
    }

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .expect("Failed to hash password")
        .to_string();

    // Ensure directory exists
    if let Some(parent) = Path::new(TAMPER_HASH_FILE).parent() {
        fs::create_dir_all(parent).unwrap_or_default();
    }

    fs::write(TAMPER_HASH_FILE, password_hash)
        .expect("Failed to write tamper protection hash. Are you root?");
    println!("Tamper Protection password successfully set!");
}

pub fn verify_tamper_password() -> bool {
    let hash_str = fs::read_to_string(TAMPER_HASH_FILE)
        .unwrap_or_else(|_| {
            eprintln!("Tamper Protection hash not found. Did you run setup?");
            std::process::exit(1);
        });

    let password = prompt_password("Enter Master Password to authorize this action: ")
        .expect("Failed to read password");

    let parsed_hash = PasswordHash::new(hash_str.trim()).expect("Invalid hash format in file");
    let argon2 = Argon2::default();
    
    argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok()
}

pub fn start_watcher() {
    println!("Starting Kernel Watcher (Semi-EDR File Monitor)...");
    
    let (tx, rx) = channel();

    // Setup the RecommendedWatcher (uses inotify on Linux)
    let mut watcher = RecommendedWatcher::new(tx, Config::default())
        .expect("Failed to create file watcher");

    // Add sensitive paths to monitor
    let sensitive_paths = vec![
        "/etc/shadow",
        "/etc/passwd",
        // Additional paths would be dynamically configured per user
    ];

    for path in sensitive_paths {
        if Path::new(path).exists() {
            watcher.watch(Path::new(path), RecursiveMode::Recursive).unwrap_or_else(|e| {
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
    // For this semi-EDR file watcher, we just log suspicious file mutations.
    if event.kind.is_modify() || event.kind.is_remove() {
        println!("[ALERT] Suspicious activity detected on monitored paths:");
        for path in event.paths {
            println!("  -> {:?}", path);
        }
    }
}
