//! Process-level memory hardening for a program that holds a long-lived secret.
//!
//! Shared by every tool in the suite. This was `libre-otp/src/hardening.rs` and
//! applied to exactly one of six crates, while `scarecrow` held three Argon2id
//! PINs, `anti-ducky` held an unlock PIN and captured keystroke payloads, and
//! `kernel-watcher` held a tamper password — all of them swappable, dumpable
//! and ptrace-able. Lifted into its own crate rather than copied four times so
//! there is one implementation to get right.
//!
//! Kept to one dependency on purpose. Everything in the suite links this, so a
//! dependency added here is added to all of them, and a hardening crate that
//! drags in a tree is one nobody applies.
//!
//! `zeroize` already wipes secrets when they go out of scope. That closes the
//! "freed heap still contains the key" hole, but it does nothing about three
//! others, all of which put the TOTP seed on disk or in another process's hands
//! while the program is still running:
//!
//!   1. **Swap.** The kernel may page the seed out to disk, where it persists
//!      after the process exits — and, on an unencrypted swap partition, after
//!      the machine is powered off.
//!   2. **Core dumps.** A crash writes the whole address space to a file that is
//!      frequently world-readable or shipped to a crash collector.
//!   3. **ptrace.** Any process running as the same user can attach and read
//!      memory directly, no root required, on a default Linux configuration.
//!
//! This module closes all three. Call [`harden_process`] once at start-up,
//! before any secret is loaded.
//!
//! Everything here is **best-effort and non-fatal**. A tool that refuses to
//! start because it could not raise a memory lock limit is a tool that gets
//! uninstalled; the honest behaviour is to apply what the kernel permits, and
//! say clearly what it did not get. Call [`hardening_report`] to show that.

#[cfg(target_os = "linux")]
use std::sync::OnceLock;

/// What the process actually managed to switch on. Recorded so the tool can
/// report the truth rather than implying protection it does not have.
#[derive(Debug, Clone, Copy, Default)]
pub struct HardeningState {
    /// Memory is locked and will not be written to swap.
    pub mlock: bool,
    /// Core dumps are disabled for this process.
    pub no_dumps: bool,
    /// Non-root ptrace attach by another process is refused.
    pub no_ptrace: bool,
}

#[cfg(target_os = "linux")]
static STATE: OnceLock<HardeningState> = OnceLock::new();

/// Apply every mitigation the kernel allows. Safe to call more than once; only
/// the first call does the work.
///
/// Ordering matters: dumpable is cleared **before** anything sensitive is read,
/// because a crash between start-up and that call would still dump.
#[cfg(target_os = "linux")]
pub fn harden_process() -> HardeningState {
    *STATE.get_or_init(|| {
        // ── 1. Never swap this process's memory ──────────────────────────────
        // MCL_CURRENT locks what is mapped now, MCL_FUTURE everything mapped
        // later — the secret is read after this point, so FUTURE is the one that
        // actually matters. Needs CAP_IPC_LOCK or a sufficient RLIMIT_MEMLOCK;
        // failure is common for an unprivileged process and is not fatal.
        //
        // SAFETY: mlockall takes a flags bitmask and touches no memory we own.
        let mlock = unsafe { libc::mlockall(libc::MCL_CURRENT | libc::MCL_FUTURE) } == 0;

        // ── 2. No core dumps ─────────────────────────────────────────────────
        // Two independent mechanisms, because either alone can be overridden:
        //
        //   RLIMIT_CORE = 0 stops the kernel writing a core file, but a
        //   sufficiently privileged parent can raise it again.
        //
        //   PR_SET_DUMPABLE = 0 additionally makes /proc/<pid>/mem
        //   root-owned and unreadable by the user, which is what also blocks
        //   the ptrace path below. This is the stronger of the two.
        let rl = libc::rlimit {
            rlim_cur: 0,
            rlim_max: 0,
        };
        // SAFETY: setrlimit reads the rlimit struct we just initialised.
        let core_off = unsafe { libc::setrlimit(libc::RLIMIT_CORE, &rl) } == 0;
        // SAFETY: prctl with PR_SET_DUMPABLE takes an int and no pointers.
        let dumpable_off = unsafe { libc::prctl(libc::PR_SET_DUMPABLE, 0) } == 0;

        // ── 3. Refuse ptrace attach ──────────────────────────────────────────
        // PR_SET_DUMPABLE=0 already denies same-user ptrace. Where the Yama LSM
        // is present, ask it explicitly as well: PR_SET_PTRACER with 0 clears
        // any previously granted tracer. Yama being absent is not an error, so
        // this is reported together with the dumpable result.
        //
        // Root can still attach. Nothing a process can do to itself prevents
        // that, and claiming otherwise would be dishonest.
        // "Yama" as a 4-byte magic — the LSM's own prctl option number.
        const PR_SET_PTRACER: libc::c_int = 0x59616d61;
        // SAFETY: prctl with PR_SET_PTRACER takes an integer argument only.
        let _ = unsafe { libc::prctl(PR_SET_PTRACER, 0) };

        HardeningState {
            mlock,
            no_dumps: core_off && dumpable_off,
            no_ptrace: dumpable_off,
        }
    })
}

/// Non-Linux builds compile but do nothing. These are Linux security tools;
/// this exists so the crate still builds for a developer on another OS.
#[cfg(not(target_os = "linux"))]
pub fn harden_process() -> HardeningState {
    HardeningState::default()
}

/// A human-readable account of what is and is not in force.
///
/// Deliberately explicit about failure. "Could not lock memory" tells the user
/// their seed may reach swap, which is something they can act on (raise
/// RLIMIT_MEMLOCK, or encrypt swap); silence would not.
pub fn hardening_report(st: &HardeningState) -> String {
    let mut lines = Vec::new();
    lines.push(if st.mlock {
        "  [on ] memory locked — secrets will not be written to swap".to_string()
    } else {
        "  [OFF] could not lock memory — the seed may be paged to swap. \
         Raise RLIMIT_MEMLOCK (LimitMEMLOCK= in the systemd unit), or use an \
         encrypted swap device."
            .to_string()
    });
    lines.push(if st.no_dumps {
        "  [on ] core dumps disabled — a crash cannot write the seed to disk".to_string()
    } else {
        "  [OFF] core dumps still possible — a crash could write the seed to disk".to_string()
    });
    lines.push(if st.no_ptrace {
        "  [on ] ptrace attach refused for same-user processes (root can still attach)".to_string()
    } else {
        "  [OFF] another process running as you could attach and read the seed".to_string()
    });
    lines.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hardening_is_idempotent_and_reports() {
        let a = harden_process();
        let b = harden_process();
        // Same cached state both times.
        assert_eq!(a.mlock, b.mlock);
        assert_eq!(a.no_dumps, b.no_dumps);
        assert_eq!(a.no_ptrace, b.no_ptrace);
        let r = hardening_report(&a);
        // The report always accounts for all three, on or off.
        assert!(r.contains("memory") || r.contains("swap"));
        assert!(r.contains("core dumps"));
        assert!(r.contains("ptrace"));
        assert_eq!(r.lines().count(), 3);
    }

    #[test]
    fn report_states_failure_plainly() {
        let off = HardeningState::default();
        let r = hardening_report(&off);
        // A failed mitigation must never read as if it succeeded.
        assert!(r.contains("[OFF]"));
        assert!(!r.contains("[on ] memory locked"));
    }
}
