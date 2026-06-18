use clap::Parser;
use std::process;
use scarecrow::start_gui;
use scarecrow::init_scarecrow;
use scarecrow::handle_duress_login;

/// Scarecrow Decoy System - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI Dashboard (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,

    /// Trigger duress/decoy login
    #[arg(short, long)]
    login: bool,

    /// Require confirmation [y/N] before wiping system in duress mode
    #[arg(short, long, default_value_t = true)]
    confirm_wipe: bool,
}

fn main() {
    let args = Args::parse();
    
    if args.interactive {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start Scarecrow Decoy System GUI: {}", e);
            process::exit(1);
        }
    } else if args.login {
        handle_duress_login(args.confirm_wipe);
    } else {
        println!("Starting daemon mode for Scarecrow Decoy System. Use --interactive for GUI or --login for Duress.");
        init_scarecrow();
    }
}
