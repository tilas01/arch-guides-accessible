use scarecrow::init_scarecrow;
use scarecrow::gui::start_gui;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.iter().any(|a| a == "-i" || a == "--interactive") {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start scarecrow GUI: {}", e);
        }
    } else if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("Usage:");
        println!("  scarecrow                     Run as daemon");
        println!("  scarecrow -i, --interactive   Launch the GUI Dashboard (Wayland/Xorg)");
        println!("  scarecrow -h, --help          Show this help message");
    } else {
        println!("Starting standalone scarecrow daemon...");
        init_scarecrow();
    }
}
