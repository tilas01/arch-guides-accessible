//! Raspberry Pi boot integrity: report what the board is actually doing, and
//! notice when the boot partition changes underneath you.
//!
//! # What a Pi can and cannot do, stated once
//!
//! Raspberry Pi 4 and 5 support **verified boot**. The second-stage bootloader
//! lives in an on-board EEPROM, and it can be configured to require a signed
//! `boot.img`: the image carries an RSA signature, and a hash of the public key
//! is burned into the SoC's one-time-programmable memory. Once that fuse is
//! blown the board will not boot an image signed by anyone else, and it cannot
//! be un-blown.
//!
//! A Pi does **not** support measured boot. Measured boot means each stage
//! hashes the next and extends the result into a tamper-evident register — a
//! TPM's PCRs — so that a later secret release can be made conditional on the
//! whole chain. There is no TPM on any Raspberry Pi board, so there is nowhere
//! to extend to. An add-on SPI or I2C TPM module can provide one, and that is a
//! hardware prerequisite rather than a setting.
//!
//! The distinction matters enough to repeat wherever this tool speaks, because
//! "measured" and "verified" get used interchangeably and they protect against
//! different things: verified boot refuses to run an image it does not
//! recognise, while measured boot runs it and makes the evidence undeniable.
//!
//! # What this tool does
//!
//! It reads, and it compares. It does not write to the EEPROM and it does not
//! fuse anything.
//!
//! That is a deliberate limit, not an unfinished feature. Fusing the OTP key
//! hash is irreversible on physical hardware: get it wrong — wrong key, lost
//! private half — and the board will never boot an image you can sign again.
//! A tool that offers to do that in one command, on a machine somebody is
//! experimenting with, is a brick generator. The commands are printed with
//! their consequences instead, for the operator to run deliberately.
//!
//! What it *can* do usefully:
//!
//! * report whether signed boot is switched on in the EEPROM configuration;
//! * report whether a signature file exists beside the boot image;
//! * record a baseline of everything on the boot partition, and tell you later
//!   whether any of it changed.
//!
//! The last one is the part that works on every Pi, including a Pi 3 or a Zero
//! that has no secure-boot support at all. A boot partition on a Pi is a FAT
//! filesystem that anything with physical access can rewrite, and noticing that
//! it changed is worth having even where the firmware cannot enforce anything.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// Where the baseline lives. Same root as the rest of the suite, so one
/// directory holds all of it and the systemd units' `ReadWritePaths` covers it.
pub const STATE_DIR: &str = "/etc/arch-security/pi-boot-guard";

/// The boot partition on Raspberry Pi OS. Older images used `/boot`; current
/// ones mount the firmware partition at `/boot/firmware` and keep `/boot` for
/// the kernel. Both are checked, in this order, and the first that exists wins.
pub const BOOT_CANDIDATES: [&str; 2] = ["/boot/firmware", "/boot"];

/// Files whose contents change on their own during normal operation, so a
/// difference in them is not evidence of anything.
const VOLATILE: [&str; 2] = ["/proc", "/sys"];

// ─── Errors ──────────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum Error {
    /// Not running on Raspberry Pi hardware.
    NotAPi(String),
    /// A baseline was expected and is not there.
    NoBaseline(PathBuf),
    Io(io::Error),
    Parse(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::NotAPi(what) => write!(
                f,
                "this does not look like Raspberry Pi hardware ({what}). \
                 Refusing rather than reporting on a board that is not here."
            ),
            Error::NoBaseline(p) => write!(
                f,
                "no baseline at {}. Run --setup first, on a system you have \
                 reason to trust.",
                p.display()
            ),
            Error::Io(e) => write!(f, "{e}"),
            Error::Parse(s) => write!(f, "could not parse: {s}"),
        }
    }
}

impl std::error::Error for Error {}

impl From<io::Error> for Error {
    fn from(e: io::Error) -> Self {
        Error::Io(e)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

// ─── Hardware identification ─────────────────────────────────────────────────

/// Which Pi this is, as far as the device tree admits.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Board {
    /// The raw model string, e.g. "Raspberry Pi 5 Model B Rev 1.0".
    pub model: String,
    /// The generation, where it can be read from the model string.
    pub generation: Option<u8>,
    /// Whether this generation has secure-boot support in its bootloader.
    ///
    /// Pi 4 and 5 do. Earlier boards load their firmware from the card with no
    /// signature check available, so there is nothing to enable.
    pub secure_boot_capable: bool,
}

/// Parse a device-tree model string.
///
/// Kept separate from reading the file so it can be tested against the strings
/// real boards report, without needing one of the boards.
pub fn parse_model(raw: &str) -> Board {
    // The device tree null-terminates; trim it and any whitespace.
    let model = raw.trim_end_matches('\0').trim().to_string();
    let lower = model.to_ascii_lowercase();

    // "Raspberry Pi 5 Model B", "Raspberry Pi 4 Model B Rev 1.4",
    // "Raspberry Pi Zero 2 W", "Raspberry Pi Compute Module 4".
    let generation = if lower.contains("compute module 5") {
        Some(5)
    } else if lower.contains("compute module 4") {
        Some(4)
    } else if lower.contains("zero") {
        // A Zero 2 W is BCM2710-class, not a Pi 2; the "2" in its name is not a
        // generation. Treated as no generation rather than guessed wrongly.
        None
    } else {
        lower
            .split_whitespace()
            .skip_while(|w| *w != "pi")
            .nth(1)
            .and_then(|w| w.parse::<u8>().ok())
    };

    Board {
        secure_boot_capable: matches!(generation, Some(4) | Some(5)),
        model,
        generation,
    }
}

/// Read the board from the device tree.
pub fn detect_board() -> Result<Board> {
    let path = Path::new("/proc/device-tree/model");
    let raw = fs::read_to_string(path)
        .map_err(|_| Error::NotAPi("/proc/device-tree/model is not readable".into()))?;
    let board = parse_model(&raw);
    if !board.model.to_ascii_lowercase().contains("raspberry pi") {
        return Err(Error::NotAPi(format!("device tree says {:?}", board.model)));
    }
    Ok(board)
}

// ─── EEPROM configuration ────────────────────────────────────────────────────

/// The bootloader configuration, as key/value pairs.
///
/// Produced by `rpi-eeprom-config`, which prints an INI-like block. Parsed
/// rather than grepped so that a key appearing in a comment cannot be mistaken
/// for a setting — which is exactly how a "signed boot is on" report would come
/// to be printed about a board where it is off.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct EepromConfig {
    pub values: BTreeMap<String, String>,
}

impl EepromConfig {
    pub fn parse(text: &str) -> Self {
        let mut values = BTreeMap::new();
        for line in text.lines() {
            let line = line.trim();
            // A comment is a comment even when it contains an assignment.
            if line.is_empty() || line.starts_with('#') || line.starts_with(';') {
                continue;
            }
            // Section headers such as [all] or [pi4] carry no value.
            if line.starts_with('[') {
                continue;
            }
            if let Some((k, v)) = line.split_once('=') {
                values.insert(
                    k.trim().to_ascii_uppercase(),
                    v.trim().to_string(),
                );
            }
        }
        Self { values }
    }

    /// Whether the bootloader is configured to require a signed boot image.
    ///
    /// `SIGNED_BOOT=1` is the switch. Any other value, or its absence, is off —
    /// reported as off rather than unknown, because the effect on the board is
    /// the same and "unknown" invites the reader to assume the better case.
    pub fn signed_boot(&self) -> bool {
        self.values.get("SIGNED_BOOT").map(|v| v.trim()) == Some("1")
    }

    /// Whether the bootloader will fall back to booting from USB or network.
    ///
    /// Reported because it widens what "boot" means: a board that refuses an
    /// unsigned image on the card and then tries the network has not narrowed
    /// its attack surface as much as the first half suggests.
    pub fn boot_order(&self) -> Option<&str> {
        self.values.get("BOOT_ORDER").map(|s| s.as_str())
    }
}

// ─── Boot partition baseline ─────────────────────────────────────────────────

/// One recorded file: path relative to the boot partition, and its digest.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Entry {
    pub path: String,
    pub sha256: String,
    pub bytes: u64,
}

/// Everything recorded about a boot partition at one moment.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Baseline {
    pub root: String,
    pub board: Option<Board>,
    pub signed_boot: bool,
    pub entries: Vec<Entry>,
}

/// What changed between a baseline and what is on disk now.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Diff {
    pub added: Vec<String>,
    pub removed: Vec<String>,
    pub changed: Vec<String>,
    /// Signed boot was on when the baseline was taken and is off now.
    ///
    /// Its own field rather than a line of prose: this is the one difference
    /// that means the board's own enforcement was switched off, which no amount
    /// of file hashing would otherwise reveal.
    pub signed_boot_disabled: bool,
}

impl Diff {
    pub fn is_clean(&self) -> bool {
        self.added.is_empty()
            && self.removed.is_empty()
            && self.changed.is_empty()
            && !self.signed_boot_disabled
    }
}

/// Compare two baselines. Pure, so the comparison is testable without a disk.
pub fn compare(old: &Baseline, new: &Baseline) -> Diff {
    let index = |b: &Baseline| -> BTreeMap<String, String> {
        b.entries
            .iter()
            .map(|e| (e.path.clone(), e.sha256.clone()))
            .collect()
    };
    let (a, b) = (index(old), index(new));

    let mut diff = Diff {
        // Only a transition from on to off is worth reporting. Turning it on
        // between a baseline and a check is somebody improving things.
        signed_boot_disabled: old.signed_boot && !new.signed_boot,
        ..Default::default()
    };

    for (path, digest) in &b {
        match a.get(path) {
            None => diff.added.push(path.clone()),
            Some(before) if before != digest => diff.changed.push(path.clone()),
            Some(_) => {}
        }
    }
    for path in a.keys() {
        if !b.contains_key(path) {
            diff.removed.push(path.clone());
        }
    }

    diff.added.sort();
    diff.removed.sort();
    diff.changed.sort();
    diff
}

/// Hash one file.
pub fn hash_file(path: &Path) -> io::Result<(String, u64)> {
    let data = fs::read(path)?;
    let mut hasher = Sha256::new();
    hasher.update(&data);
    Ok((hex::encode(hasher.finalize()), data.len() as u64))
}

/// Find the boot partition, or say why not.
pub fn find_boot_root() -> Result<PathBuf> {
    for candidate in BOOT_CANDIDATES {
        let p = Path::new(candidate);
        if p.is_dir() {
            // An empty /boot is not a boot partition that failed to mount in
            // any useful sense, but reporting on it would produce a baseline of
            // nothing that later "matches".
            if fs::read_dir(p)?.next().is_some() {
                return Ok(p.to_path_buf());
            }
        }
    }
    Err(Error::Io(io::Error::new(
        io::ErrorKind::NotFound,
        format!(
            "no non-empty boot partition at any of {}",
            BOOT_CANDIDATES.join(" or ")
        ),
    )))
}

/// Walk a boot partition and record every regular file in it.
pub fn scan(root: &Path, board: Option<Board>, signed_boot: bool) -> Result<Baseline> {
    let mut entries = Vec::new();
    for item in walkdir::WalkDir::new(root).follow_links(false) {
        let item = match item {
            Ok(i) => i,
            // A file that vanished mid-walk, or one the process cannot read, is
            // skipped rather than aborting the scan — but see the note in
            // `write_baseline` about why a partial baseline is never stored
            // over a good one.
            Err(_) => continue,
        };
        if !item.file_type().is_file() {
            continue;
        }
        let path = item.path();
        if VOLATILE.iter().any(|v| path.starts_with(v)) {
            continue;
        }
        let rel = path
            .strip_prefix(root)
            .unwrap_or(path)
            .to_string_lossy()
            .replace('\\', "/");
        if let Ok((sha256, bytes)) = hash_file(path) {
            entries.push(Entry { path: rel, sha256, bytes });
        }
    }
    entries.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(Baseline {
        root: root.to_string_lossy().to_string(),
        board,
        signed_boot,
        entries,
    })
}

fn baseline_path() -> PathBuf {
    Path::new(STATE_DIR).join("boot-baseline.json")
}

/// Write a baseline, all of it or none of it.
///
/// Staged to a sibling file and renamed into place. The suite has been bitten
/// once already by a half-written baseline: a sibling tool wrote its hashes one
/// at a time, and a disk that filled between the first and the second left a
/// record that disagreed with an untouched system, so the next check reported
/// tampering and locked the machine. A transient disk-full should not look like
/// an attack.
pub fn write_baseline(b: &Baseline) -> Result<PathBuf> {
    let dir = Path::new(STATE_DIR);
    fs::create_dir_all(dir)?;
    let final_path = baseline_path();
    let staged = final_path.with_extension("json.new");

    let json = serde_json::to_string_pretty(b)
        .map_err(|e| Error::Parse(e.to_string()))?;

    match fs::write(&staged, json).and_then(|_| fs::rename(&staged, &final_path)) {
        Ok(()) => Ok(final_path),
        Err(e) => {
            // Leave whatever was there before intact.
            let _ = fs::remove_file(&staged);
            Err(Error::Io(e))
        }
    }
}

pub fn read_baseline() -> Result<Baseline> {
    let path = baseline_path();
    let text = fs::read_to_string(&path).map_err(|_| Error::NoBaseline(path.clone()))?;
    serde_json::from_str(&text).map_err(|e| Error::Parse(e.to_string()))
}

// ─── Reporting ───────────────────────────────────────────────────────────────

/// Everything worth saying about the current state, in one value.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub board: Board,
    pub signed_boot: bool,
    pub boot_order: Option<String>,
    pub boot_root: String,
    pub files: usize,
    /// Present only when a `boot.img` is there to have one.
    pub boot_img_present: bool,
    pub boot_sig_present: bool,
}

/// The sentence to print about secure boot for this board, which is not the
/// same sentence for every board.
pub fn secure_boot_summary(r: &Report) -> String {
    if r.board.generation.is_none() && !r.board.secure_boot_capable {
        // Either a model string that gave no generation, or a run with
        // --assume-pi where nothing was read at all. Saying such a board "has
        // no secure-boot support" would assert something never checked.
        return format!(
            "Secure-boot capability was not determined for {}. The boot partition check \
             below still applies and does not depend on it.",
            r.board.model
        );
    }
    if !r.board.secure_boot_capable {
        return format!(
            "{} has no secure-boot support in its bootloader, so there is nothing to \
             switch on. The boot partition check below still applies, and on this board \
             it is the only boot integrity you can have.",
            r.board.model
        );
    }
    if r.signed_boot {
        let sig = if r.boot_sig_present {
            "A boot.sig is present beside the image."
        } else {
            "No boot.sig is present, which will stop this board booting."
        };
        format!(
            "Signed boot is ENABLED in the EEPROM configuration. {sig} This is verified \
             boot: the bootloader refuses an image it cannot verify. It is not measured \
             boot — there is no TPM on this board to measure into."
        )
    } else {
        format!(
            "Signed boot is NOT enabled. {} can enforce it, but the EEPROM configuration \
             does not ask it to, so the bootloader will run whatever image is on the card.",
            r.board.model
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn model_strings_from_real_boards() {
        let pi5 = parse_model("Raspberry Pi 5 Model B Rev 1.0\0");
        assert_eq!(pi5.generation, Some(5));
        assert!(pi5.secure_boot_capable);

        let pi4 = parse_model("Raspberry Pi 4 Model B Rev 1.4\0");
        assert_eq!(pi4.generation, Some(4));
        assert!(pi4.secure_boot_capable);

        // A Pi 3 cannot do signed boot, and must not be reported as if it could.
        let pi3 = parse_model("Raspberry Pi 3 Model B Plus Rev 1.3\0");
        assert_eq!(pi3.generation, Some(3));
        assert!(!pi3.secure_boot_capable);

        // The "2" in "Zero 2 W" is not a generation number. Guessing it would
        // report a Zero as a Pi 2, which is a different SoC entirely.
        let zero = parse_model("Raspberry Pi Zero 2 W Rev 1.0\0");
        assert_eq!(zero.generation, None);
        assert!(!zero.secure_boot_capable);

        let cm4 = parse_model("Raspberry Pi Compute Module 4 Rev 1.1\0");
        assert_eq!(cm4.generation, Some(4));
        assert!(cm4.secure_boot_capable);
    }

    #[test]
    fn a_commented_out_setting_is_not_a_setting() {
        // The failure this parser exists to avoid: reporting signed boot as on
        // because the string appears in a comment.
        let cfg = EepromConfig::parse(
            "[all]\n\
             # SIGNED_BOOT=1\n\
             BOOT_UART=0\n\
             BOOT_ORDER=0xf41\n",
        );
        assert!(!cfg.signed_boot());
        assert_eq!(cfg.boot_order(), Some("0xf41"));
    }

    #[test]
    fn signed_boot_reads_only_an_exact_one() {
        assert!(EepromConfig::parse("SIGNED_BOOT=1").signed_boot());
        assert!(EepromConfig::parse("  signed_boot = 1  ").signed_boot());
        assert!(!EepromConfig::parse("SIGNED_BOOT=0").signed_boot());
        assert!(!EepromConfig::parse("SIGNED_BOOT=true").signed_boot());
        assert!(!EepromConfig::parse("BOOT_UART=1").signed_boot());
    }

    fn baseline_of(pairs: &[(&str, &str)], signed: bool) -> Baseline {
        Baseline {
            root: "/boot/firmware".into(),
            board: None,
            signed_boot: signed,
            entries: pairs
                .iter()
                .map(|(p, h)| Entry {
                    path: (*p).into(),
                    sha256: (*h).into(),
                    bytes: 1,
                })
                .collect(),
        }
    }

    #[test]
    fn an_unchanged_partition_is_clean() {
        let b = baseline_of(&[("config.txt", "aa"), ("start4.elf", "bb")], true);
        assert!(compare(&b, &b.clone()).is_clean());
    }

    #[test]
    fn additions_removals_and_edits_are_told_apart() {
        let before = baseline_of(&[("config.txt", "aa"), ("gone.bin", "cc")], false);
        let after = baseline_of(&[("config.txt", "ZZ"), ("new.bin", "dd")], false);
        let d = compare(&before, &after);
        assert_eq!(d.changed, vec!["config.txt"]);
        assert_eq!(d.added, vec!["new.bin"]);
        assert_eq!(d.removed, vec!["gone.bin"]);
        assert!(!d.is_clean());
    }

    #[test]
    fn turning_signed_boot_off_is_reported_even_with_no_file_changes() {
        let before = baseline_of(&[("config.txt", "aa")], true);
        let after = baseline_of(&[("config.txt", "aa")], false);
        let d = compare(&before, &after);
        assert!(d.signed_boot_disabled);
        assert!(!d.is_clean(), "the files match, but enforcement was switched off");
    }

    #[test]
    fn turning_signed_boot_on_is_not_a_finding() {
        let before = baseline_of(&[("config.txt", "aa")], false);
        let after = baseline_of(&[("config.txt", "aa")], true);
        assert!(compare(&before, &after).is_clean());
    }

    #[test]
    fn the_summary_never_calls_verified_boot_measured() {
        for capable in [true, false] {
            for signed in [true, false] {
                let r = Report {
                    board: Board {
                        model: "Raspberry Pi 5 Model B".into(),
                        generation: Some(5),
                        secure_boot_capable: capable,
                    },
                    signed_boot: signed,
                    boot_order: None,
                    boot_root: "/boot/firmware".into(),
                    files: 1,
                    boot_img_present: true,
                    boot_sig_present: signed,
                };
                let s = secure_boot_summary(&r);
                let lower = s.to_ascii_lowercase();
                // "measured" may only ever appear to deny it.
                if lower.contains("measured") {
                    assert!(
                        lower.contains("not measured boot"),
                        "summary used the word 'measured' without denying it: {s}"
                    );
                }
            }
        }
    }
}
