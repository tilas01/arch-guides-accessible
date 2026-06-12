use kernel_watcher::start_watcher;
use kernel_watcher::gui::start_gui;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.iter().any(|a| a == "-i" || a == "--interactive") {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start kernel-watcher GUI: {}", e);
        }
    } else if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("Usage:");
        println!("  kernel-watcher                     Run as daemon");
        println!("  kernel-watcher -i, --interactive   Launch the GUI Dashboard (Wayland/Xorg)");
        println!("  kernel-watcher -h, --help          Show this help message");
    } else {
        println!("Starting standalone kernel-watcher daemon...");
        start_watcher();
    }
}
