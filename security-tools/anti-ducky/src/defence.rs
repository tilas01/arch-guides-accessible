//! Active responses to a hostile input device.
//!
//! The rest of anti-ducky *detects* a BadUSB/Rubber Ducky device — including
//! the harder case where a ZeroTrace-style implant spoofs the identity of a
//! keyboard you already approved — and captures its injected payload. This
//! module is what happens *after* that: the deauthorize-and-capture response.
//!
//! ## The policy, and where the line is
//!
//! On a confirmed hostile device we:
//!
//!   1. **Capture** the payload (done by the caller) — you keep the evidence.
//!   2. **Deauthorize** the device at the kernel, via
//!      `/sys/bus/usb/devices/<dev>/authorized`. The kernel drops it: it can no
//!      longer deliver input. This is the same mechanism `usbkill` and USBGuard
//!      use, and it is reversible (re-authorize, or replug a device you trust).
//!   3. Optionally **hard-power-off**, if and only if the operator opted in,
//!      to clear disk-encryption keys from RAM before anyone can extract them.
//!
//! We do **not** try to damage or "brick" the attacking device. That would be a
//! retaliatory act rather than a defensive one, it rarely works from the host
//! side anyway, and a misfire damages your own legitimate hardware.
//! Deauthorizing stops the attack completely and leaves the evidence intact,
//! which is the whole objective.
//!
//! Everything here is opt-in where it is destructive, and every action is
//! logged before it is taken.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};

/// Config directory shared with the rest of the suite.
const CONFIG_DIR: &str = "/etc/arch-security/anti-ducky";
/// Marker file: if present, a confirmed hostile device triggers a hard shutdown.
/// Absent by default — this is the destructive option and it is opt-in.
const KILL_ON_ATTACK_FLAG: &str = "/etc/arch-security/anti-ducky/kill-on-attack";

/// Resolve the USB `authorized` sysfs node for an input device given its evdev
/// `sys_path` (e.g. `/sys/class/input/input5`). Walks up the device tree until
/// it finds the USB device node that owns an `authorized` attribute.
///
/// Returns `None` for non-USB devices (a laptop's built-in i8042 keyboard has
/// no USB `authorized` node — and must not, so we never deauthorize it).
pub fn usb_authorized_path(sys_path: &str) -> Option<PathBuf> {
    // The evdev sys_path is usually a symlink into /sys/devices/...; canonicalize
    // so the parent walk follows the real device tree.
    let mut cur = fs::canonicalize(sys_path).unwrap_or_else(|_| PathBuf::from(sys_path));

    // Bounded walk: a USB device is only a handful of levels above the input
    // node. The bound stops a symlink loop turning this into a spin.
    for _ in 0..12 {
        let candidate = cur.join("authorized");
        // A real USB *device* node has both `authorized` and `idVendor`. The
        // idVendor check avoids matching a USB *interface*, whose `authorized`
        // governs only that interface.
        if candidate.is_file() && cur.join("idVendor").is_file() {
            return Some(candidate);
        }
        match cur.parent() {
            Some(p) if p != cur => cur = p.to_path_buf(),
            _ => break,
        }
    }
    None
}

/// Deauthorize a USB input device so the kernel stops accepting input from it.
///
/// Reversible: writing `1` back to the same node, or replugging, restores it.
/// Returns a human-readable outcome for the log and the wall broadcast.
pub fn deauthorize(sys_path: &str, device_name: &str) -> String {
    match usb_authorized_path(sys_path) {
        Some(node) => {
            match fs::write(&node, b"0") {
                Ok(()) => format!(
                    "DEAUTHORIZED '{}' at {} — the kernel will no longer accept its input. \
                     Re-enable with: echo 1 | sudo tee {}",
                    device_name,
                    node.display(),
                    node.display()
                ),
                Err(e) => format!(
                    "Could not deauthorize '{}' ({}). Need root, and write access to {}.",
                    device_name,
                    e,
                    node.display()
                ),
            }
        }
        None => format!(
            "'{}' is not a deauthorizable USB device (built-in or virtual). \
             It stays sandboxed — its input is captured but never forwarded.",
            device_name
        ),
    }
}

/// Whether the operator opted into a hard shutdown on a confirmed attack.
pub fn kill_on_attack_enabled() -> bool {
    Path::new(KILL_ON_ATTACK_FLAG).exists()
}

/// Enable or disable the hard-shutdown-on-attack policy. Writing the flag is the
/// opt-in; the CLI gates this behind a typed confirmation.
pub fn set_kill_on_attack(enabled: bool) -> std::io::Result<()> {
    if enabled {
        fs::create_dir_all(CONFIG_DIR)?;
        fs::write(KILL_ON_ATTACK_FLAG, b"1\n")
    } else {
        match fs::remove_file(KILL_ON_ATTACK_FLAG) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(e) => Err(e),
        }
    }
}

/// What to do once a payload is confirmed, beyond capturing and deauthorizing.
///
/// Deauthorization always happens — it is reversible and it stops the attack.
/// This is the *additional* response, and it is a spectrum rather than a switch
/// because the two ends have very different costs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AttackResponse {
    /// Capture, deauthorize, alert. Nothing else. The default.
    AlertOnly,
    /// Also lock every session, so an attacker standing at the machine cannot
    /// use the unlocked desktop the injected keystrokes were aimed at.
    ///
    /// The middle option, and the right default for most people: it costs
    /// nothing but a re-login if it misfires, whereas a power-off costs unsaved
    /// work. It does *not* protect the keys in RAM — a lock screen is a UI, not
    /// a cryptographic boundary. Pair it with `anti-evil-maid --lock-now` if
    /// that is what you need.
    LockSession,
    /// Hard power-off, to clear disk-encryption keys from RAM before anyone can
    /// pull the DIMMs. Destructive to unsaved work; strictly opt-in.
    PowerOff,
    /// Staged lockdown, then power off: lock every session, raise the kernel
    /// lockdown level, suspend the LUKS volume so the master key leaves RAM,
    /// then cut power via sysrq.
    ///
    /// The difference from [`AttackResponse::PowerOff`] is the order and what is
    /// closed before the power goes. A bare `poweroff -f` leaves several seconds
    /// during which the machine is still running with the master key in RAM, the
    /// desktop still unlocked behind whatever the payload typed, and
    /// `/dev/mem`, `kexec` and unsigned module loading all still available. This
    /// closes each of those first and only then cuts power.
    Lockdown,
}

/// Where the response policy is recorded, when it is not the legacy flag file.
const RESPONSE_FILE: &str = "/etc/arch-security/anti-ducky/attack-response";

/// The configured response.
///
/// Reads [`RESPONSE_FILE`] first, then falls back to the older
/// `kill-on-attack` marker so a machine configured before this existed keeps the
/// behaviour its operator chose. Anything unrecognised is treated as
/// [`AttackResponse::AlertOnly`]: a corrupt config file must not be able to
/// *escalate* the response into powering the machine off.
pub fn attack_response() -> AttackResponse {
    if let Ok(s) = fs::read_to_string(RESPONSE_FILE) {
        return match s.trim() {
            "poweroff" => AttackResponse::PowerOff,
            "lockdown" => AttackResponse::Lockdown,
            "lock" => AttackResponse::LockSession,
            _ => AttackResponse::AlertOnly,
        };
    }
    if kill_on_attack_enabled() {
        return AttackResponse::PowerOff;
    }
    AttackResponse::AlertOnly
}

/// Record the response policy.
pub fn set_attack_response(r: AttackResponse) -> std::io::Result<()> {
    fs::create_dir_all(CONFIG_DIR)?;
    let word = match r {
        AttackResponse::PowerOff => "poweroff",
        AttackResponse::Lockdown => "lockdown",
        AttackResponse::LockSession => "lock",
        AttackResponse::AlertOnly => "alert",
    };
    fs::write(RESPONSE_FILE, format!("{word}\n"))?;
    // Keep the legacy flag consistent, so the two cannot disagree and leave a
    // machine powering itself off after its operator chose not to.
    // Lockdown ends in a power cut too, so the legacy marker tracks both.
    // Leaving it clear for Lockdown would let an older component conclude the
    // machine is not configured to power off when it very much is.
    set_kill_on_attack(matches!(
        r,
        AttackResponse::PowerOff | AttackResponse::Lockdown
    ))
}

/// Lock every active session.
///
/// `loginctl lock-sessions` asks each session's own locker, which is what
/// respects the user's configured screen lock. Best-effort: a machine with no
/// graphical session has nothing to lock, and that is not an error.
pub fn lock_sessions(reason: &str) {
    eprintln!("[anti-ducky] LOCKING SESSIONS: {reason}");
    let _ = Command::new("loginctl").arg("lock-sessions").status();
}

/// Where an alert waits to be shown after the next boot.
const PENDING_ALERT: &str = "/etc/arch-security/anti-ducky/pending-alert";

/// Leave a note that survives the reboot.
///
/// When the response is a power-off, everything on screen is gone a fraction of
/// a second later — including the alert explaining why the machine just died.
/// Without this, the attack is invisible to the person it happened to: they
/// power the machine back on and find no explanation, which is indistinguishable
/// from a hardware fault, and they plug the device back in.
///
/// Appended, not overwritten: two attacks before anyone reads the file are two
/// things worth knowing about.
pub fn record_boot_alert(device: &str, detail: &str) {
    let _ = fs::create_dir_all(CONFIG_DIR);
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let line = format!("{ts}\t{device}\t{detail}\n");
    use std::io::Write;
    if let Ok(mut f) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(PENDING_ALERT)
    {
        let _ = f.write_all(line.as_bytes());
    }
}

/// Show and clear any alert recorded before the last boot.
///
/// Returns the number of alerts shown. The file is only removed once it has
/// actually been printed — an alert that is cleared without being read is worse
/// than no alert at all, because it makes the system look clean.
pub fn show_boot_alerts() -> usize {
    let Ok(contents) = fs::read_to_string(PENDING_ALERT) else {
        return 0;
    };
    let lines: Vec<&str> = contents.lines().filter(|l| !l.trim().is_empty()).collect();
    if lines.is_empty() {
        let _ = fs::remove_file(PENDING_ALERT);
        return 0;
    }

    println!("=============================================================");
    println!(" anti-ducky: a BadUSB payload was detected before this boot");
    println!("=============================================================");
    for line in &lines {
        let mut f = line.split('\t');
        let ts = f.next().unwrap_or("?");
        let device = f.next().unwrap_or("unknown device");
        let detail = f.next().unwrap_or("");
        println!("  when   : unix {ts}");
        println!("  device : {device}");
        if !detail.is_empty() {
            println!("  detail : {detail}");
        }
        println!();
    }
    println!("The captured payload is in /var/log/anti-ducky/payload_*.log.");
    println!("Read it before plugging that device into anything else.");
    println!("=============================================================");

    let _ = fs::remove_file(PENDING_ALERT);
    lines.len()
}

/// Staged lockdown, then power off.
///
/// The order is the whole design, and each step is chosen for what it closes:
///
/// 1. **Lock every session.** Instant and cheap. The payload's whole objective
///    is usually a shell on an unlocked desktop; this takes that away first.
/// 2. **Raise the kernel lockdown level to `confidentiality`.** Blocks
///    `/dev/mem`, `/dev/kmem`, `kexec`, unsigned module loading and several
///    debug interfaces — the paths an attacker would use to read the LUKS
///    master key straight out of kernel memory in the seconds we are still up.
///    One-way, which is fine because the next step is a power cut.
/// 3. **Suspend the LUKS volume**, via `anti-evil-maid --suspend-only`. The
///    master key leaves RAM. From here the disk is unreadable.
/// 4. **Cut power with sysrq.**
///
/// # Why sysrq and not `poweroff`
///
/// After step 3 the root filesystem is frozen, so `/sbin/poweroff` cannot be
/// *read*, let alone run — calling it would block forever and leave the machine
/// sitting there locked but alive, which is the opposite of the intent.
/// `/proc/sysrq-trigger` is a virtual file: writing to it needs no disk I/O and
/// asks the kernel to power off directly. This is the only ordering that both
/// flushes the key and reliably reaches the power cut.
///
/// # Why the LUKS suspend is delegated
///
/// `anti-evil-maid` already implements it correctly — staging `cryptsetup` and
/// its libraries into tmpfs, verifying that really is memory-backed, and
/// `mlockall`ing so nothing is paged out to a swap device that is itself about
/// to freeze. Reimplementing that here would be a second copy of the most
/// deadlock-prone code in the project. If it is not installed, the lockdown
/// still locks, still raises kernel lockdown, and still powers off — it just
/// cannot flush the key, and it says so.
pub fn lockdown_and_poweroff(reason: &str) {
    eprintln!("[anti-ducky] LOCKDOWN: {reason}");

    // 1. Sessions first: cheapest, and it is what the payload was after.
    lock_sessions(reason);

    // 2. Kernel lockdown. Best-effort: the LSM is not enabled on every kernel,
    // and the file is absent rather than failing when it is not.
    match fs::write("/sys/kernel/security/lockdown", b"confidentiality") {
        Ok(()) => eprintln!("[anti-ducky] kernel lockdown raised to confidentiality"),
        Err(e) => eprintln!(
            "[anti-ducky] could not raise kernel lockdown ({e}) — \
             /dev/mem and kexec may still be reachable"
        ),
    }

    // 3. Flush the master key. Everything after this point must avoid the disk.
    let suspended = Command::new("anti-evil-maid")
        .arg("--suspend-only")
        .status();
    match suspended {
        Ok(s) if s.success() => eprintln!("[anti-ducky] LUKS volume suspended; key is out of RAM"),
        Ok(s) => eprintln!("[anti-ducky] anti-evil-maid --suspend-only failed ({s})"),
        Err(e) => eprintln!(
            "[anti-ducky] could not run anti-evil-maid ({e}) — \
             powering off without flushing the key"
        ),
    }

    // 4. Power off through the kernel. No disk read is possible now, so this
    // must not be /sbin/poweroff.
    let _ = fs::write("/proc/sysrq-trigger", b"o");

    // If sysrq is disabled the write above is a no-op and we are still running.
    // Try the ordinary paths as a fallback — they may still work if the volume
    // was never suspended, and if it was, they block, which is no worse than
    // the machine sitting here unlocked would have been.
    std::thread::sleep(Duration::from_secs(2));
    eprintln!("[anti-ducky] sysrq power-off did not take (is kernel.sysrq disabled?)");
    let _ = Command::new("poweroff").arg("-f").status();
}

/// Hard power-off to clear disk-encryption keys from RAM.
///
/// `poweroff -f` cuts power without the normal shutdown sequence: the objective
/// is that the machine loses the keys in RAM *fast*, before anyone can pull the
/// DIMMs for a cold-boot read or attach a DMA device. A clean shutdown would
/// give the attacker that window.
///
/// Only ever called when [`kill_on_attack_enabled`] is true.
pub fn hard_poweroff(reason: &str) {
    eprintln!("[anti-ducky] HARD SHUTDOWN: {reason}");
    // Best-effort, most forceful first. Each is a no-op if the previous worked.
    let _ = Command::new("poweroff").arg("-f").status();
    let _ = Command::new("systemctl").arg("poweroff").arg("-f").status();
    // Last resort: ask the kernel directly via sysrq, if it is enabled.
    let _ = fs::write("/proc/sysrq-trigger", b"o");
}

// ─── Mouse jiggler detection ─────────────────────────────────────────────────

/// A "mouse jiggler" is a device that emits small, regular pointer movements to
/// stop the screen locking — used to keep an unattended, unlocked session alive
/// while its owner is away. This detector flags a pointer device whose motion is
/// too *regular* to be a hand: a person's mouse movement is bursty and varied,
/// a jiggler's is metronomic.
pub struct JigglerDetector {
    /// Intervals between recent motion events.
    intervals: Vec<Duration>,
    last_event: Option<Instant>,
    /// Consecutive suspiciously-regular intervals seen.
    regular_streak: u32,
}

impl Default for JigglerDetector {
    fn default() -> Self {
        Self {
            intervals: Vec::with_capacity(32),
            last_event: None,
            regular_streak: 0,
        }
    }
}

impl JigglerDetector {
    /// Feed a pointer-motion event timestamp. Returns `true` the moment the
    /// movement pattern looks mechanical rather than human.
    pub fn record_motion(&mut self, now: Instant) -> bool {
        if let Some(prev) = self.last_event {
            let dt = now.duration_since(prev);
            self.last_event = Some(now);

            // Ignore the long idle gaps between real bursts of use — a jiggler
            // fires on a short, fixed cadence (typically 1–60s). Only intervals
            // in that band are evidence either way.
            if dt < Duration::from_millis(200) || dt > Duration::from_secs(90) {
                self.regular_streak = 0;
                return false;
            }

            self.intervals.push(dt);
            if self.intervals.len() > 16 {
                self.intervals.remove(0);
            }

            // Need a few samples before the regularity is meaningful.
            if self.intervals.len() >= 6 {
                if self.is_metronomic() {
                    self.regular_streak += 1;
                } else {
                    self.regular_streak = 0;
                }
                // Several windows of clockwork motion in a row: a hand does not
                // do this.
                return self.regular_streak >= 3;
            }
        } else {
            self.last_event = Some(now);
        }
        false
    }

    /// True when the intervals cluster tightly around their mean — the signature
    /// of a timer, not a hand. Uses coefficient of variation (stddev / mean);
    /// human motion sits well above the threshold, a jiggler well below.
    fn is_metronomic(&self) -> bool {
        let n = self.intervals.len() as f64;
        if n < 4.0 {
            return false;
        }
        let secs: Vec<f64> = self.intervals.iter().map(|d| d.as_secs_f64()).collect();
        let mean = secs.iter().sum::<f64>() / n;
        if mean <= 0.0 {
            return false;
        }
        let variance = secs.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / n;
        let cv = variance.sqrt() / mean;
        // < 0.15 means the intervals vary by under ~15% — mechanically regular.
        cv < 0.15
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn steady_cadence_is_flagged() {
        let mut d = JigglerDetector::default();
        let start = Instant::now();
        let mut flagged = false;
        // Exactly 5s apart, forever — a textbook jiggler.
        for i in 1..40 {
            let t = start + Duration::from_millis(5000 * i);
            if d.record_motion(t) {
                flagged = true;
                break;
            }
        }
        assert!(flagged, "a perfectly regular cadence should be detected");
    }

    #[test]
    fn human_bursts_are_not_flagged() {
        let mut d = JigglerDetector::default();
        let start = Instant::now();
        // Irregular, varied intervals as a hand produces.
        let jitters = [300u64, 1200, 450, 90000, 700, 250, 5000, 380, 900, 210, 1500, 640];
        let mut t = start;
        let mut flagged = false;
        for _ in 0..3 {
            for &ms in &jitters {
                t += Duration::from_millis(ms);
                if d.record_motion(t) {
                    flagged = true;
                }
            }
        }
        assert!(!flagged, "varied human motion must not be flagged");
    }

    #[test]
    fn builtin_keyboard_has_no_authorized_node() {
        // A path that does not resolve to a USB device tree yields None rather
        // than deauthorizing something it should not.
        assert!(usb_authorized_path("/definitely/not/a/real/sys/path").is_none());
    }
}
