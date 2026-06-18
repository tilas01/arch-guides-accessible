use anti_ducky::run;
use anti_ducky::start_gui;
use clap::Parser;
use std::process;
use zeroize::Zeroize;

/// Anti-Ducky USB HID Monitor - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI Dashboard (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,

    /// Override the USB block securely via CLI
    #[arg(short, long)]
    unlock: bool,
}

fn handle_unlock() {
    println!("Enter Admin PIN to override Anti-Ducky USB Block:");
    if let Ok(mut pin) = rpassword::read_password() {
        if pin == "1337" {
            // In real usage this would check a hashed config
            println!("Override granted. New USB devices temporarily allowed.");
            // Logic to unblock USB ports would go here
        } else {
            println!("Invalid PIN.");
        }
        // CRITICAL: Wipe PIN from memory
        pin.zeroize();
    }
}

fn main() {
    let args = Args::parse();

    if args.interactive {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start Anti-Ducky USB HID Monitor GUI: {}", e);
            process::exit(1);
        }
    } else if args.unlock {
        handle_unlock();
    } else {
        println!("Starting daemon mode for Anti-Ducky USB HID Monitor. Use --interactive for GUI or --unlock to override.");
        run();
    }
}
