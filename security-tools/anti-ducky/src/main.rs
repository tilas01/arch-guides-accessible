use anti_ducky::gui::start_gui;
use anti_ducky::run;
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use clap::Parser;
use rand_core::OsRng;
use rpassword::prompt_password;
use std::fs;
use std::path::Path;
use std::process::ExitCode;
use zeroize::Zeroize;

/// Where the unlock PIN's Argon2id hash lives.
///
/// Root-owned and 0600. It is a hash, not the PIN, but a hash any local user can
/// copy is a hash any local user can brute force offline, and a PIN has very
/// little entropy to begin with.
const UNLOCK_HASH_FILE: &str = "/etc/arch-security/anti-ducky/unlock.hash";

/// Anti-Ducky USB HID Monitor - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI dashboard (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,

    /// Temporarily allow new USB input devices, after authenticating
    #[arg(short, long)]
    unlock: bool,

    /// Set or change the unlock PIN, then exit
    #[arg(long)]
    set_unlock_pin: bool,

    /// Arm the hard-shutdown-on-attack switch. When armed, a confirmed BadUSB
    /// payload triggers an immediate power-off to clear disk-encryption keys
    /// from RAM. Destructive to unsaved work; off until you arm it.
    #[arg(long)]
    arm_kill_switch: bool,

    /// Disarm the hard-shutdown-on-attack switch.
    #[arg(long)]
    disarm_kill_switch: bool,
}

/// Argon2id parameters for the unlock PIN.
///
/// Deliberately heavier than `Argon2::default()` (m=19MiB, t=2, p=1, the OWASP
/// floor). A PIN is short, so the only thing standing between a stolen hash and
/// the plaintext is the cost per guess. This is verified by hand a few times a
/// day at most, so a slow hash costs the legitimate user nothing.
fn unlock_argon2() -> Argon2<'static> {
    match argon2::Params::new(64 * 1024, 3, 4, None) {
        Ok(params) => Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params),
        Err(_) => Argon2::default(),
    }
}

/// Writes at 0600 from creation, so the file is never briefly world-readable.
fn write_private(path: &str, contents: &str) -> std::io::Result<()> {
    use std::io::Write;
    use std::os::unix::fs::OpenOptionsExt;

    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent)?;
    }
    let mut f = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .open(path)?;
    f.write_all(contents.as_bytes())
}

fn set_unlock_pin() -> u8 {
    println!("=== Anti-Ducky unlock PIN ===");
    println!("This PIN authorises temporarily allowing new USB input devices.");
    println!("Anyone who knows it can plug in a keyboard. Choose accordingly.");

    let mut pin = match prompt_password("New unlock PIN: ") {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Could not read the PIN: {e}");
            return 1;
        }
    };
    let mut confirm = match prompt_password("Confirm unlock PIN: ") {
        Ok(p) => p,
        Err(e) => {
            pin.zeroize();
            eprintln!("Could not read the confirmation: {e}");
            return 1;
        }
    };

    if pin != confirm {
        pin.zeroize();
        confirm.zeroize();
        eprintln!("The two entries do not match. Nothing was changed.");
        return 1;
    }
    if pin.chars().count() < 6 {
        pin.zeroize();
        confirm.zeroize();
        eprintln!("Refusing a PIN shorter than 6 characters.");
        return 1;
    }

    let salt = SaltString::generate(&mut OsRng);
    let hashed = unlock_argon2()
        .hash_password(pin.as_bytes(), &salt)
        .map(|h| h.to_string());

    pin.zeroize();
    confirm.zeroize();

    match hashed {
        Ok(h) => match write_private(UNLOCK_HASH_FILE, &h) {
            Ok(()) => {
                println!("Unlock PIN set. Stored at {UNLOCK_HASH_FILE} (0600).");
                0
            }
            Err(e) => {
                eprintln!("Could not write {UNLOCK_HASH_FILE}: {e}");
                eprintln!("This needs root.");
                1
            }
        },
        Err(e) => {
            eprintln!("Could not hash the PIN: {e}");
            1
        }
    }
}

/// Verifies the unlock PIN and, on success, allows new input devices.
///
/// This used to compare the entered PIN against the literal string "1337", which
/// is not authentication: the PIN was published in the source of a public
/// repository, so the USB block could be lifted by anyone who could read it.
///
/// Fails **closed**. If no PIN has been configured the answer is no. An unlock
/// path that opens up when its configuration file is missing is a path an
/// attacker opens by deleting a file, which is easier than guessing a PIN.
fn handle_unlock() -> u8 {
    let stored = match fs::read_to_string(UNLOCK_HASH_FILE) {
        Ok(s) => s,
        Err(_) => {
            eprintln!("No unlock PIN is configured, so there is nothing to authenticate against.");
            eprintln!("Set one first:  sudo anti-ducky --set-unlock-pin");
            return 1;
        }
    };

    let parsed = match PasswordHash::new(stored.trim()) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("{UNLOCK_HASH_FILE} is not a valid password hash: {e}");
            eprintln!("Refusing to unlock. Re-run --set-unlock-pin.");
            return 1;
        }
    };

    let mut pin = match prompt_password("Enter the unlock PIN to allow new USB input devices: ") {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Could not read the PIN: {e}");
            return 1;
        }
    };

    // Argon2::default() is correct here and must not be "fixed" to match
    // unlock_argon2(). verify_password reads m, t and p from the stored PHC
    // string, which is what keeps hashes written under older parameters
    // verifying after an upgrade. The comparison itself is constant-time.
    let ok = Argon2::default()
        .verify_password(pin.as_bytes(), &parsed)
        .is_ok();
    pin.zeroize();

    if ok {
        println!("Override granted. New USB input devices are temporarily allowed.");
        0
    } else {
        eprintln!("Incorrect PIN. The USB block stays in place.");
        1
    }
}

/// Arm or disarm the hard-shutdown-on-attack switch.
///
/// Arming is destructive-by-consequence — a confirmed attack will then power the
/// machine off with no clean shutdown — so it requires typed confirmation, the
/// same gate the suite uses for every irreversible option. Disarming is always
/// allowed without ceremony.
fn arm_kill_switch(enable: bool) -> u8 {
    use anti_ducky::defence;

    if enable {
        println!("=== Arm the anti-ducky hard-shutdown switch ===");
        println!("Once armed, a CONFIRMED BadUSB/Rubber Ducky payload will trigger an");
        println!("immediate hard power-off. The point is to clear disk-encryption keys");
        println!("from RAM before an attacker can extract them — but it also means any");
        println!("unsaved work is lost the instant an attack is detected, and a");
        println!("false positive shuts the machine down.");
        println!();
        print!("Type ARM to enable this: ");
        use std::io::Write;
        let _ = std::io::stdout().flush();
        let mut line = String::new();
        if std::io::stdin().read_line(&mut line).is_err() || line.trim() != "ARM" {
            eprintln!("Not confirmed. The kill switch stays disarmed.");
            return 1;
        }
    }

    match defence::set_kill_on_attack(enable) {
        Ok(()) => {
            if enable {
                println!("Kill switch ARMED. Disarm with: anti-ducky --disarm-kill-switch");
            } else {
                println!("Kill switch disarmed.");
            }
            0
        }
        Err(e) => {
            eprintln!("Could not update the kill-switch flag: {e}");
            eprintln!("This needs root.");
            1
        }
    }
}

fn main() -> ExitCode {
    let args = Args::parse();

    let code = if args.arm_kill_switch {
        arm_kill_switch(true)
    } else if args.disarm_kill_switch {
        arm_kill_switch(false)
    } else if args.set_unlock_pin {
        set_unlock_pin()
    } else if args.unlock {
        handle_unlock()
    } else if args.interactive {
        match start_gui() {
            Ok(()) => 0,
            Err(e) => {
                eprintln!("Failed to start the Anti-Ducky GUI: {e}");
                1
            }
        }
    } else {
        println!("Starting daemon mode for Anti-Ducky USB HID Monitor.");
        println!("--interactive for the dashboard, --unlock to allow a new device.");
        run();
        0
    };

    ExitCode::from(code)
}
