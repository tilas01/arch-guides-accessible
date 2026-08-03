use aur_guard::{Report, Severity, render, scan_path};
use clap::Parser;
use std::path::PathBuf;
use std::process::ExitCode;

/// AUR Guard — static review aid for PKGBUILDs.
///
/// Reads a PKGBUILD and its .install files before makepkg runs any of them, and
/// reports the patterns worth reading yourself. It does not decide whether a
/// package is safe, and it is built so it cannot be mistaken for something that
/// does — see the exit codes below.
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// PKGBUILD to read, or a directory containing one
    #[arg(value_name = "PATH", default_value = "./PKGBUILD")]
    path: PathBuf,

    /// Directory to read, as an explicit alternative to the positional path
    #[arg(long, value_name = "DIR")]
    dir: Option<PathBuf>,

    /// Machine-readable output, for hooking into an AUR helper
    #[arg(long)]
    json: bool,

    /// Exit 0 when nothing matched.
    ///
    /// Off by default, deliberately. A tool that exits 0 gets wrapped in
    /// `aur-guard && makepkg`, and then a clean scan silently authorises a
    /// build — which is precisely the "it said it was fine" failure this is
    /// built to avoid. Pass this only if you have read the limitations and
    /// still want it in a pipeline.
    #[arg(long)]
    exit_zero_when_clean: bool,
}

fn main() -> ExitCode {
    let args = Args::parse();
    let target = args.dir.unwrap_or(args.path);

    if !target.exists() {
        eprintln!("{}: no such file or directory", target.display());
        eprintln!("Point this at a PKGBUILD, or at the directory your AUR helper cloned into:");
        eprintln!("  aur-guard ./PKGBUILD");
        eprintln!("  aur-guard --dir ~/.cache/paru/clone/some-package");
        return ExitCode::from(1);
    }

    let mut report = Report::default();
    scan_path(&target, &mut report);

    if args.json {
        match serde_json::to_string_pretty(&report) {
            Ok(j) => println!("{j}"),
            Err(e) => {
                eprintln!("Could not serialise the report: {e}");
                return ExitCode::from(1);
            }
        }
    } else {
        print!("{}", render(&report));
    }

    // Exit codes, and why they are shaped this way:
    //
    //   1  something matched at STOP
    //   3  something matched at REVIEW or NOTE
    //   2  nothing matched
    //
    // Two is not zero on purpose. The whole hazard with a tool like this is
    // that a green light stops people reading, and `aur-guard && makepkg` is
    // the obvious thing to type. Making the no-findings case non-zero means
    // that pipeline does not build, and the person has to decide for
    // themselves — which is the only decision available, because "no known-bad
    // pattern matched" is not "safe".
    match report.worst() {
        Some(Severity::Stop) => ExitCode::from(1),
        Some(_) => ExitCode::from(3),
        None => {
            if args.exit_zero_when_clean {
                ExitCode::SUCCESS
            } else {
                ExitCode::from(2)
            }
        }
    }
}
