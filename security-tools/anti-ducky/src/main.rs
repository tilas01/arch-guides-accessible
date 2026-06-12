use anti_ducky::run;
use anti_ducky::gui::start_gui;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.iter().any(|a| a == "-i" || a == "--interactive") {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start Anti-Ducky GUI: {}", e);
        }
    } else if args.iter().any(|a| a == "--help" || a == "-h") {
        println!("Usage:");
        println!("  anti-ducky                     Run as daemon");
        println!("  anti-ducky -i, --interactive   Launch the GUI Dashboard (Wayland/Xorg)");
        println!("  anti-ducky -h, --help          Show this help message");
    } else {
        run();
    }
}
