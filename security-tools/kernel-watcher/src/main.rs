use clap::Parser;
// start_gui lives in the `gui` module and is not re-exported at the crate root,
// so it has to be addressed through its module path.
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
    // First statement in main, before even argument parsing: a crash any
    // time before this call still dumps the whole address space, and the
    // PIN prompts below read secrets into it. Best-effort by design — a
    // tool that refuses to start because it could not raise a memory-lock
    // limit is a tool that gets uninstalled.
    let _hardening = suite_hardening::harden_process();

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
