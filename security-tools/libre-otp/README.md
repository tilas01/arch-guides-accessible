<div align="center">
  <img src="assets/banner.png" width="880" alt="Libre OTP">
</div>

# Libre OTP

TOTP and HOTP one-time passwords in Rust, with no proprietary backend, no cloud account and no binary blobs.

Part of the [Arch Guides Dynamic](../../) security suite. Everything here is
Rust, builds reproducibly, and ships as a signed release binary.

---

## What it does

A second factor should not require an app store, a phone that phones home, or a
vendor who can lock you out of your own accounts. `libre-otp` generates RFC 6238
(TOTP) and RFC 4226 (HOTP) codes locally, from secrets that never leave the
machine.

TTY display has three modes — `discreet`, `visible` and `none` — so a code can be
shown, partly masked, or withheld entirely depending on who can see the screen.

Secrets are handled through `zeroize`, so they are overwritten rather than left
sitting in freed memory.

## Install

The suite installer verifies the SHA-512 hash *and* the GPG signature, pins the
signing key by fingerprint, and refuses to install anything that fails either
check:

```bash
curl -fsSL https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/scripts/install-security-suite.sh -o install.sh
less install.sh          # read it before you run it
sudo bash install.sh
```

Or build it yourself. The builds are reproducible, so a local build is an
independent check that does not require trusting any signing key at all:

```bash
pacman -S rustup && rustup default stable
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic/security-tools/libre-otp
cargo build --release --locked
```

[docs/building-from-source.md](../../docs/building-from-source.md) has the exact
toolchain and the `SOURCE_DATE_EPOCH` setting that makes the output
byte-identical to the published binary.

## Usage

```
  -i, --interactive   Launch the GUI dashboard (Wayland/Xorg)
  -h, --help          Full argument list
  -V, --version       Version
```

```bash
libre-otp --help
```

## Verifying a release binary

```bash
gpg --import tilas01.asc
gpg --fingerprint 5CC1B2BED4D05F65E9E965423AA74BEC12F3D5ED   # compare against the root README
gpg --verify libre-otp.sig libre-otp
sha512sum -c libre-otp.sha512
```

The previous signing key `4C0383A1…` is **revoked** — its private half was
committed to public git history. See
[Verifying downloads](../../README.md#-verifying-downloads).

## Honest limitations

Three things this README used to claim that were **not true**. They are
corrected here rather than quietly deleted, because someone may have acted on
them:

* **There is no PAM module.** The README told you to add
  `auth required pam_libre_otp.so` to `/etc/pam.d/sshd`. No such module exists —
  this crate builds a binary, not a `cdylib`. Following that instruction adds a
  line referencing a missing module to your SSH auth stack, which can lock you
  out of the machine. If you did this, remove that line.
* **There is no YubiKey support.** HMAC-SHA1 challenge-response with a hardware
  token is not implemented anywhere in this crate.
* **`--interactive` did not work.** The dashboard was fully written but nothing
  ever called it, so clap rejected the flag as unknown. That is fixed.

PAM integration is a reasonable thing to want and may be built later. Until it
exists, this README will not say it does.

## Licence

CC BY-NC-SA 4.0 — free to use, modify and share non-commercially, with
attribution, under the same licence. See [LICENSE](../../LICENSE).

Provided **AS IS, without warranty of any kind**. These tools can lock you out
of your own machine if misconfigured. Read the
[wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) first.
