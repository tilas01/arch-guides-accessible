use libre_otp::run;
use libre_otp::gui::start_gui;
use std::env;

/// Post-Quantum Cryptographic MFA Implementation
/// Zeroizes sensitive memory arrays post-use
/// Stores configuration in root-protected /etc/libre-otp/
fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.iter().any(|a| a == "-i" || a == "--interactive") {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start libre-otp GUI: {}", e);
        }
    } else if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("Usage:");
        println!("  libre-otp                     Run as daemon");
        println!("  libre-otp -i, --interactive   Launch the GUI Dashboard (Wayland/Xorg)");
        println!("  libre-otp -h, --help          Show this help message");
    } else {
        println!("Starting standalone libre-otp daemon (Post-Quantum Mode)...");
        run();
    }
}
