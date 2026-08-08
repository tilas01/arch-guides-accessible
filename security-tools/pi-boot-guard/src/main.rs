//! `pi-boot-guard` — report Raspberry Pi boot integrity, and notice changes.
//!
//! Every flag below is handled. That is not a boast; it is the thing this
//! repository has got wrong most often, and the build fails if a documented
//! invocation reaches no crate.

use clap::Parser;
use pi_boot_guard::{
    compare, detect_board, find_boot_root, read_baseline, scan, secure_boot_summary,
    write_baseline, Board, EepromConfig, Report,
};
use std::process::{Command, ExitCode};

#[derive(Parser, Debug)]
#[command(
    name = "pi-boot-guard",
    version,
    about = "Reports Raspberry Pi secure-boot state and checks the boot partition against a baseline.",
    long_about = "Reads and compares. It never writes to the EEPROM and never fuses the \
                  one-time-programmable key hash: that step is irreversible on real \
                  hardware, and a wrong key means a board that can never boot an image \
                  you are able to sign. --how prints the commands to do it deliberately."
)]
struct Cli {
    /// Report the current state and stop.
    #[arg(long)]
    check: bool,

    /// Record the boot partition as it stands now, to compare against later.
    #[arg(long)]
    setup: bool,

    /// Compare the boot partition against the recorded baseline.
    #[arg(long)]
    verify: bool,

    /// Print the commands that enable signed boot, and what they cost.
    #[arg(long)]
    how: bool,

    /// Machine-readable output.
    #[arg(long)]
    json: bool,

    /// Report on this directory rather than looking for the boot partition.
    ///
    /// For checking an image mounted somewhere else, and for testing on a
    /// machine that is not a Pi.
    #[arg(long, value_name = "DIR")]
    boot_dir: Option<String>,

    /// Skip the "is this a Raspberry Pi" check.
    ///
    /// Only sensible alongside --boot-dir, when inspecting a card from another
    /// machine. The report says it was used, so a saved report cannot be
    /// mistaken for one taken on the board itself.
    #[arg(long)]
    assume_pi: bool,
}

/// Ask the firmware tooling for the current bootloader configuration.
///
/// Absent tooling is not an error: a Pi 3, or a board where `rpi-eeprom` is not
/// installed, simply has nothing to report here, and an empty configuration
/// reads as "signed boot off" — which is the truth about such a board.
fn read_eeprom_config() -> EepromConfig {
    Command::new("rpi-eeprom-config")
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| EepromConfig::parse(&String::from_utf8_lossy(&o.stdout)))
        .unwrap_or_default()
}

fn build_report(cli: &Cli, board: Board) -> Result<Report, Box<dyn std::error::Error>> {
    let cfg = read_eeprom_config();
    let root = match &cli.boot_dir {
        Some(d) => std::path::PathBuf::from(d),
        None => find_boot_root()?,
    };
    let baseline = scan(&root, Some(board.clone()), cfg.signed_boot())?;
    Ok(Report {
        board,
        signed_boot: cfg.signed_boot(),
        boot_order: cfg.boot_order().map(str::to_string),
        boot_root: root.to_string_lossy().to_string(),
        files: baseline.entries.len(),
        boot_img_present: baseline.entries.iter().any(|e| e.path.ends_with("boot.img")),
        boot_sig_present: baseline.entries.iter().any(|e| e.path.ends_with("boot.sig")),
    })
}

fn print_how() {
    println!("Enabling signed boot on a Raspberry Pi 4 or 5");
    println!("---------------------------------------------");
    println!();
    println!("This tool will not do it for you, and that is on purpose. The last step");
    println!("burns a hash of your public key into one-time-programmable memory on the");
    println!("SoC. It cannot be undone. If the private half is lost or the wrong key is");
    println!("fused, the board will never again boot an image you can sign.");
    println!();
    println!("The sequence, from the Raspberry Pi documentation:");
    println!();
    println!("  1. Generate an RSA key pair and keep the private half off the Pi.");
    println!("  2. Sign the boot image:      rpi-eeprom-digest -i boot.img -o boot.sig");
    println!("  3. Put boot.img and boot.sig on the boot partition.");
    println!("  4. Set SIGNED_BOOT=1 in the bootloader configuration:");
    println!("                               sudo -E rpi-eeprom-config --edit");
    println!("  5. Only once steps 1-4 are known good, fuse the public key hash.");
    println!("     Read the vendor documentation for that step and do it deliberately.");
    println!();
    println!("Verify each step before the one after it. Steps 1 to 4 are reversible;");
    println!("step 5 is not.");
    println!();
    println!("What this gets you, precisely: VERIFIED boot. The bootloader refuses an");
    println!("image it cannot verify. It is not MEASURED boot — that needs a TPM to");
    println!("extend measurements into, and no Raspberry Pi board has one. An add-on");
    println!("SPI or I2C TPM module is the only way to get that, and it is a piece of");
    println!("hardware, not a setting.");
    println!();
    println!("Reference: https://www.raspberrypi.com/documentation/computers/");
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    if cli.how {
        print_how();
        return Ok(());
    }

    let board = if cli.assume_pi {
        Board {
            model: "(unverified — --assume-pi was used)".into(),
            generation: None,
            secure_boot_capable: false,
        }
    } else {
        detect_board()?
    };

    if cli.setup {
        let cfg = read_eeprom_config();
        let root = match &cli.boot_dir {
            Some(d) => std::path::PathBuf::from(d),
            None => find_boot_root()?,
        };
        let baseline = scan(&root, Some(board), cfg.signed_boot())?;
        let count = baseline.entries.len();
        let path = write_baseline(&baseline)?;
        println!("Recorded {count} files from {} at {}", baseline.root, path.display());
        println!();
        println!("Take this on a system you have reason to trust. A baseline recorded");
        println!("after somebody else has had the card records their changes as normal.");
        return Ok(());
    }

    if cli.verify {
        let old = read_baseline()?;
        let cfg = read_eeprom_config();
        let root = match &cli.boot_dir {
            Some(d) => std::path::PathBuf::from(d),
            None => std::path::PathBuf::from(&old.root),
        };
        let now = scan(&root, Some(board), cfg.signed_boot())?;
        let diff = compare(&old, &now);

        if cli.json {
            println!("{}", serde_json::to_string_pretty(&diff)?);
        } else if diff.is_clean() {
            println!("Boot partition matches the baseline. {} files.", now.entries.len());
        } else {
            println!("BOOT PARTITION CHANGED");
            if diff.signed_boot_disabled {
                println!();
                println!("  Signed boot was enabled when the baseline was taken and is not now.");
                println!("  The board's own enforcement has been switched off.");
            }
            for (label, list) in [
                ("changed", &diff.changed),
                ("added", &diff.added),
                ("removed", &diff.removed),
            ] {
                if list.is_empty() {
                    continue;
                }
                println!();
                println!("  {} ({}):", label, list.len());
                for p in list {
                    println!("    {p}");
                }
            }
            println!();
            println!("Some of this is ordinary: a firmware update rewrites these files.");
            println!("Compare it against what you did, not against what you expected.");
        }
        // A difference is a finding, and a finding is a non-zero exit so that a
        // timer or a script notices without parsing the text.
        return if diff.is_clean() {
            Ok(())
        } else {
            Err("boot partition differs from the baseline".into())
        };
    }

    // --check, and the default when nothing is asked for.
    let report = build_report(&cli, board)?;
    if cli.json {
        println!("{}", serde_json::to_string_pretty(&report)?);
    } else {
        println!("Board:        {}", report.board.model);
        println!("Boot files:   {} under {}", report.files, report.boot_root);
        if let Some(order) = &report.boot_order {
            println!("BOOT_ORDER:   {order}");
        }
        println!("boot.img:     {}", if report.boot_img_present { "present" } else { "absent" });
        println!("boot.sig:     {}", if report.boot_sig_present { "present" } else { "absent" });
        println!();
        println!("{}", secure_boot_summary(&report));
        println!();
        println!("Run --setup to record these files, then --verify later to see what changed.");
        println!("Run --how for the steps to enable signed boot, and what they cost.");
    }
    Ok(())
}

fn main() -> ExitCode {
    // Applied before anything is read: the baseline and the configuration are
    // not secrets, but the suite hardens uniformly rather than deciding
    // per-tool which of its memory is worth protecting.
    suite_hardening::harden_process();

    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("pi-boot-guard: {e}");
            ExitCode::FAILURE
        }
    }
}
