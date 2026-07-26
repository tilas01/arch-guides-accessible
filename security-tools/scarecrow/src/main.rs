use clap::Parser;
use scarecrow::handle_duress_login;
use scarecrow::init_scarecrow;
use scarecrow::set_duress_password;
use scarecrow::start_gui;
use std::process::ExitCode;

/// Scarecrow Decoy System - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI dashboard (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,

    /// Present the duress/decoy login prompt
    #[arg(short, long)]
    login: bool,

    /// Set or change the duress password, then exit
    #[arg(long)]
    set_duress_password: bool,

    /// Double-enter the password at the duress prompt. Off by default: a
    /// confirmation step is itself a tell that something unusual is happening,
    /// which works against plausible deniability.
    #[arg(long, default_value_t = false)]
    confirm: bool,
}

fn main() -> ExitCode {
    let args = Args::parse();

    if args.set_duress_password {
        return ExitCode::from(set_duress_password() as u8);
    }

    if args.interactive {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start the Scarecrow GUI: {e}");
            return ExitCode::from(1);
        }
        return ExitCode::SUCCESS;
    }

    if args.login {
        handle_duress_login(args.confirm);
        return ExitCode::SUCCESS;
    }

    println!("Starting daemon mode for Scarecrow Decoy System.");
    println!("--interactive for the GUI, --login for the duress prompt, \
              --set-duress-password to configure it.");
    init_scarecrow();
    ExitCode::SUCCESS
}
