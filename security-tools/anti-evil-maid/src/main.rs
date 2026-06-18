use anti_evil_maid::gui::start_gui;
use anti_evil_maid::start_monitor;
use clap::Parser;
use std::process;

/// Anti-Evil Maid Boot Integrity - Arch Security Suite Standalone
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
            eprintln!("Failed to start Anti-Evil Maid Boot Integrity GUI: {}", e);
            process::exit(1);
        }
    } else {
        println!(
            "Starting daemon mode for Anti-Evil Maid Boot Integrity. Use --interactive for GUI."
        );
        start_monitor();
    }
}
