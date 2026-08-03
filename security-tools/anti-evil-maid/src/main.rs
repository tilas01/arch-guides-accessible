use anti_evil_maid::gui::start_gui;
use anti_evil_maid::{autolock, run};
use clap::Parser;
use std::process::ExitCode;

/// Anti-Evil Maid Boot Integrity - Arch Security Suite Standalone
///
/// Every flag below is one the website, the generated install scripts and the
/// README already tell people to run. They previously did not exist: this binary
/// accepted `--interactive` and nothing else, so `anti-evil-maid --setup` — the
/// line every generated install script executes inside the chroot — failed with
/// "unexpected argument" and the boot baseline was never recorded. The library
/// had implemented all of it; only the argument parser was missing.
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Launch the GUI Dashboard (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,

    /// Record the current boot chain as the trusted baseline
    #[arg(long)]
    setup: bool,

    /// Verify the boot chain against the baseline, then exit
    #[arg(long)]
    daemon: bool,

    /// Run the deep filesystem hash verification
    #[arg(long)]
    fs_hash_check: bool,

    /// Kernel to base decoy images on, with --setup
    #[arg(long, value_name = "VERSION")]
    main_kernel: Option<String>,

    /// Fallback kernel recorded alongside the main one
    #[arg(long, value_name = "VERSION")]
    backup_kernel: Option<String>,

    /// How many decoy kernels to generate, or "random"
    #[arg(long, value_name = "N")]
    decoy_count: Option<String>,

    /// Suspend the LUKS volume now: flush the master key from RAM and hold
    /// the resume prompt. Unlike a screen lock, this is a real boundary.
    #[arg(long)]
    lock_now: bool,

    /// Set up the auto-lock timer and the session-lock hook
    #[arg(long)]
    configure_autolock: bool,

    /// Idle time before an automatic lock: 15m, 1h, 2d3h, or "never"
    #[arg(long, value_name = "INTERVAL")]
    idle: Option<String>,

    /// Device-mapper name to suspend, as in /dev/mapper/<name>
    #[arg(long, value_name = "NAME")]
    mapper: Option<String>,

    /// Show the current auto-lock settings and what they do and do not protect
    #[arg(long)]
    autolock_status: bool,

    /// Suspend the LUKS volume and exit, without holding the resume prompt.
    ///
    /// For a caller that is about to power the machine off — anti-ducky's
    /// lockdown response. Holding a passphrase prompt there would stop the
    /// shutdown from ever happening.
    ///
    /// After this returns the disk is frozen: the caller must touch nothing on
    /// it. Writes to /proc and /sys still work, which is why the power-off that
    /// follows uses the sysrq trigger rather than /sbin/poweroff.
    #[arg(long)]
    suspend_only: bool,

    /// Install a watcher that suspends the LUKS volume whenever the session
    /// locks, making the lock screen an actual cryptographic barrier.
    #[arg(long)]
    install_lock_hook: bool,
}

fn main() -> ExitCode {
    // First statement in main, before even argument parsing: a crash any
    // time before this call still dumps the whole address space, and the
    // resume path below reads a LUKS passphrase into it. Best-effort by
    // design — a tool that refuses to start because it could not raise a
    // memory-lock limit is a tool that gets uninstalled.
    //
    // Note this is separate from the mlockall in autolock::lock_now, which
    // is a hard requirement rather than best-effort: there, being paged out
    // to a suspended swap device hangs the machine.
    let _hardening = suite_hardening::harden_process();

    let args = Args::parse();

    // Auto-lock first: --lock-now must work even on a machine whose baseline was
    // never recorded. Being unable to flush the key because of an unrelated
    // setup step is the wrong failure.
    let code = if args.lock_now {
        autolock::lock_now()
    } else if args.suspend_only {
        autolock::suspend_only()
    } else if args.install_lock_hook {
        autolock::install_lock_hook()
    } else if args.configure_autolock {
        autolock::configure(args.mapper, args.idle)
    } else if args.autolock_status {
        autolock::status()
    } else if args.interactive {
        match start_gui() {
            Ok(()) => 0,
            Err(e) => {
                eprintln!("Failed to start Anti-Evil Maid Boot Integrity GUI: {e}");
                1
            }
        }
    } else {
        run(
            args.setup,
            args.main_kernel,
            args.backup_kernel,
            args.daemon,
            args.decoy_count,
            args.fs_hash_check,
        );
        0
    };

    ExitCode::from(code)
}
