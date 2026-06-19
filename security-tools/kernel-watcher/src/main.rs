use clap::Parser;
use kernel_watcher::gui::start_gui;
use kernel_watcher::start_watcher;
use std::process;

/// Kernel Watcher (EDR) - Arch Security Suite Standalone
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
            eprintln!("Failed to start Kernel Watcher (EDR) GUI: {}", e);
            process::exit(1);
        }
    } else {
        println!("Starting daemon mode for Kernel Watcher (EDR). Use --interactive for GUI.");
        start_watcher();
    }
}
