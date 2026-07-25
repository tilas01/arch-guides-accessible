# Security Audit — the Rust Tools

A source review of the five crates under `security-tools/`. Static review only:
these crates cannot be compiled on a non-Linux machine (`nix` and `libudev-sys`
have no Windows build), so this is a read of the logic, not a run of it.

Findings are ranked by what an attacker actually gains, not by how alarming they
sound. Everything marked **Fixed** was addressed in the same change as this
document.

---

## HIGH — Integrity check failed open on a missing baseline · **Fixed**

`kernel-watcher::check_evil_maid_hash()`

```rust
let stored_hash = fs::read_to_string(EVIL_MAID_HASH_FILE).unwrap_or_default();
if stored_hash.is_empty() {
    return true; // Not set up
}
```

Returning `true` means "integrity verified". So deleting or truncating one file
silently disabled the entire evil-maid check, and the boot continued with a clean
bill of health.

Why this matters more than it looks: the attacker this tool exists to stop is
one with offline physical access to the disk. Deleting a file in `/etc` is
strictly easier for them than modifying `/boot` — so the defence could be removed
by an attacker weaker than the one it was designed for.

**Fixed:** fails closed. A missing baseline now reports loudly, distinguishes
"never set up" from "baseline deleted", and returns `false`.

---

## HIGH — Baseline hash was not deterministic · **Fixed**

`kernel-watcher::setup_evil_maid_hash()` / `check_evil_maid_hash()`

```rust
for entry in WalkDir::new("/boot").into_iter().filter_map(|e| e.ok()) {
    if entry.file_type().is_file() {
        if let Ok(content) = fs::read(entry.path()) {
            hasher.update(&content);   // contents only, traversal order
        }
    }
}
```

Three defects in six lines:

1. **Unstable ordering.** `WalkDir` traversal order is filesystem-dependent and
   not guaranteed stable between runs. The baseline and the check could disagree
   on an unchanged `/boot`.
2. **Paths not hashed.** Only file contents fed the hash, so renaming a file, or
   deleting one and adding another with identical bytes, was invisible.
3. **No length framing.** Concatenating contents with no boundaries means
   different file layouts can produce identical byte streams.

Defect 1 is the dangerous one, and not for the obvious reason. It produces
**false** RED ALERTs telling the user not to enter their LUKS passphrase. A
warning that fires when nothing is wrong trains the user to dismiss it, so the
real alert gets dismissed too. An unreliable alarm is worse than none.

Note `anti-evil-maid::hash_directory` already did this correctly — it sorts and
includes paths. Only kernel-watcher's copy was wrong.

**Fixed:** extracted `hash_boot_partition()`, which sorts entries by path and
hashes a length-prefixed path and a length-prefixed content for each. Unreadable
files contribute a sentinel rather than being skipped, so they cannot become a
blind spot to hide a payload in.

---

## MEDIUM — Master-password hash was world-readable · **Fixed**

`kernel-watcher::run_setup()` wrote the Argon2 hash with `fs::write`, which
creates using the process umask — normally `0644`. Any local user could copy the
hash and brute-force it offline at their own pace, which negates the reason for
using a memory-hard KDF at all.

`libre-otp` already got this right, setting `0600` on its secret and its recovery
codes. Only this file was missed.

**Fixed:** added `write_private()`, which sets mode `0600` **at creation** via
`OpenOptionsExt::mode` — so unlike a create-then-chmod, there is no window where
the file exists with wider permissions. Applied to both the tamper hash and the
evil-maid baseline.

---

## MEDIUM — Lockout destroyed the user's OTP secret · **Fixed**

`anti-evil-maid::enforce_lockout()`

```rust
let _ = fs::write("/etc/libre-otp/secret.json", "LOCKOUT_TRIGGERED_BY_AEM");
```

This overwrote the user's TOTP secret **and their recovery codes** with a
sentinel string. That is unrecoverable: after a lockout the user cannot
authenticate even once the machine is confirmed clean.

Worse in combination with the non-determinism above — a false positive could
trigger it, meaning an entirely untampered machine could permanently lose its
OTP enrolment.

**Fixed:** writes a separate `0600` lockout flag at
`/etc/arch-security/lockout` and leaves the OTP secret untouched. The flag
explains how to verify the machine from a live medium and how to clear the
lockout deliberately.

---

## LOW — Argon2 parameters were the bare minimum · **Fixed**

`Argon2::default()` is m=19 MiB, t=2, p=1 — the OWASP *floor*. For a password
verified interactively a handful of times a day, spending materially more work
per attempt costs the legitimate user nothing noticeable and costs an offline
attacker linearly more.

**Fixed:** m=64 MiB, t=3, p=4 for new hashes, with a fallback to the library
default if the parameters are ever rejected, so a bad constant cannot brick the
tool. Verification deliberately still uses `Argon2::default()`, because
`verify_password` takes m/t/p from the PHC string in the stored hash — that is
what keeps hashes written under the old parameters verifying after the upgrade.
There is a comment in the source saying so, because it looks like an
inconsistency and is not one.

---

## Reviewed and found correct

* **`libre-otp` secret storage.** Creates the file, chmods to `0600`, *then*
  writes the secret. The ordering is right — no window where the secret exists at
  a wider mode. Recovery codes likewise.
* **Secret zeroization.** `libre-otp`, `kernel-watcher` and `scarecrow` call
  `.zeroize()` on password buffers, including on the mismatch path where it would
  be easy to forget.
* **Randomness.** `SaltString::generate(&mut OsRng)` — OS CSPRNG, correct.
* **Password verification timing.** Handled by argon2's `verify_password`, which
  is constant-time. The tool never hand-rolls a secret comparison.
* **No command injection.** Every `Command::new` uses a fixed program with
  fixed arguments; no user input reaches a shell.
* **No hardcoded secrets.** Nothing key-like in any source file.

## Deliberately not "fixed"

**Plain `!=` when comparing the `/boot` hash.** Constant-time comparison is not
needed: the hash is not secret — an attacker with the disk can compute it
themselves — so there is no timing signal worth hiding. Adding a constant-time
compare here would be cargo-culting, and the source records why it is absent so
it is not mistaken for an oversight.

**Plain `!=` between a password and its confirmation.** Both values are supplied
by the same person in the same prompt. There is no secret to leak to anyone.

---

## Still outstanding

Honest about what this review did **not** cover:

* **No dynamic analysis.** Nothing was run. There may be logic errors that only
  appear at runtime, and `cargo test` coverage across these crates is thin.
* **`anti-ducky`'s timing heuristics were not evaluated for accuracy.** Whether
  its keystroke-interval thresholds actually separate a human from an injector,
  and what its false-positive rate is on real hardware, needs measurement on a
  real machine. A tool that can reject your only keyboard deserves that.
* **`scarecrow`'s kernel module (`src/driver/`) was not reviewed.** Kernel code
  is a different risk class and warrants its own pass.
* **`aya`/eBPF paths in `kernel-watcher` were not reviewed.**
* **No dependency vulnerability scan.** `cargo audit` was not available in this
  environment; it should be added to CI.
* **`anti-evil-maid` declares `zeroize` but never uses it.** It does not appear
  to handle raw secrets directly, so this is probably just an unused dependency
  rather than a missed wipe — but it is worth confirming and removing if so.

Recommended next: add `cargo audit` and `cargo deny` to CI, write tests for the
integrity-check paths (especially the fail-closed behaviour fixed above), and
measure anti-ducky's false-positive rate on real hardware before anyone relies on
it to guard a login.
