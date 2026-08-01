use clap::Parser;
use scarecrow::handle_duress_login;
use scarecrow::init_scarecrow;
use scarecrow::set_duress_device;
use scarecrow::set_pin;
use scarecrow::PinSlot;
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

    /// Read the password from stdin and act on it, for stock `pam_exec.so`.
    ///
    /// This is how the PINs actually get reached from a real login. Install as:
    ///   auth [success=done default=ignore] pam_exec.so expose_authtok quiet \
    ///        /usr/bin/scarecrow --pam-gate
    /// Not meant to be run by hand.
    #[arg(long)]
    pam_gate: bool,

    /// Set or change the duress PIN — erases the LUKS header, silently
    #[arg(long)]
    set_duress_pin: bool,

    /// Set or change the decoy PIN — a plausible session, erases nothing
    #[arg(long)]
    set_decoy_pin: bool,

    /// Set or change the combined PIN — erases the header AND opens the decoy
    #[arg(long)]
    set_duress_decoy_pin: bool,

    /// The block device a duress PIN erases, e.g. /dev/nvme0n1p2. Nothing is
    /// erased until this is set: guessing which disk to destroy is not a
    /// decision this tool will make for you.
    #[arg(long, value_name = "DEVICE")]
    set_duress_device: Option<String>,

    /// Double-enter the password at the duress prompt. Off by default: a
    /// confirmation step is itself a tell that something unusual is happening,
    /// which works against plausible deniability.
    #[arg(long, default_value_t = false)]
    confirm: bool,
}

fn main() -> ExitCode {
    let args = Args::parse();

    // All three PINs are optional and independent. Set none, one, or all.
    if args.set_duress_pin {
        return ExitCode::from(set_pin(PinSlot::Duress) as u8);
    }
    if args.set_decoy_pin {
        return ExitCode::from(set_pin(PinSlot::Decoy) as u8);
    }
    if args.set_duress_decoy_pin {
        return ExitCode::from(set_pin(PinSlot::Both) as u8);
    }
    if let Some(dev) = args.set_duress_device.as_deref() {
        return ExitCode::from(set_duress_device(dev) as u8);
    }

    if args.interactive {
        if let Err(e) = start_gui() {
            eprintln!("Failed to start the Scarecrow GUI: {e}");
            return ExitCode::from(1);
        }
        return ExitCode::SUCCESS;
    }

    // Before --login and --interactive: this is invoked by PAM on every
    // authentication, and it must never fall through to anything that prints.
    if args.pam_gate {
        return ExitCode::from(scarecrow::pam_gate() as u8);
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
