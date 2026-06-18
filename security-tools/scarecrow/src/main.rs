use clap::Parser;
use std::process;
use scarecrow::start_gui;
use scarecrow::start_decoy;

/// Scarecrow Decoy System - Arch Security Suite Standalone
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
            eprintln!("Failed to start Scarecrow Decoy System GUI: {}", e);
            process::exit(1);
        }
    } else {
        println!("Starting daemon mode for Scarecrow Decoy System. Use --interactive for GUI.");
        start_decoy();
    }
}
