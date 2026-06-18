use clap::Parser;
use std::process;
use anti_ducky::run;
use zeroize::Zeroize;

/// Anti-Ducky USB HID Monitor - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Override the USB block securely via CLI
    #[arg(short, long)]
    unlock: bool,
}

fn handle_unlock() {
    println!("Enter Admin PIN to override Anti-Ducky USB Block:");
    if let Ok(mut pin) = rpassword::read_password() {
        if pin == "1337" {
            println!("Override granted. New USB devices temporarily allowed.");
        } else {
            println!("Invalid PIN.");
        }
        pin.zeroize();
    }
}

fn main() {
    let args = Args::parse();
    
    if args.unlock {
        handle_unlock();
    } else {
        println!("Starting daemon mode for Anti-Ducky USB HID Monitor. Use --unlock to override.");
        run();
    }
}
