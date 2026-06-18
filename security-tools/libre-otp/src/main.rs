use clap::Parser;
use libre_otp::run;
use libre_otp::start_gui;
use std::process;

/// Libre OTP Authenticator - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI Dashboard (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,
}

fn main() {
    let args = Args::parse();

    if args.interactive {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start Libre OTP Authenticator GUI: {}", e);
            process::exit(1);
        }
    } else {
        println!("Starting daemon mode for Libre OTP Authenticator. Use --interactive for GUI.");
        run();
    }
}
