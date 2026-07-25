use clap::Parser;
use libre_otp::gui::start_gui;
use libre_otp::run;
use std::process::ExitCode;

/// Libre OTP Authenticator - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI dashboard (Wayland/Xorg)
    ///
    /// The dashboard was fully implemented in `gui.rs` but nothing ever called
    /// it: `Args` was empty, so clap rejected `--interactive` as an unknown
    /// argument even though the README documented it.
    #[arg(short, long)]
    interactive: bool,
}

fn main() -> ExitCode {
    let args = Args::parse();

    if args.interactive {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start the Libre OTP GUI: {e}");
            return ExitCode::from(1);
        }
        return ExitCode::SUCCESS;
    }

    println!("Starting Libre OTP CLI. Use --interactive for the dashboard.");
    run();
    ExitCode::SUCCESS
}
