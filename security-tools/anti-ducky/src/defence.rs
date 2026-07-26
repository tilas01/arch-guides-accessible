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
