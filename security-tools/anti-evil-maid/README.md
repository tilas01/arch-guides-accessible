<div align="center">
  <img src="assets/banner.png" width="880" alt="Anti-Evil Maid">
</div>

# Anti-Evil Maid

Verifies that `/boot` has not been modified while the machine was out of your hands, before you type the passphrase that unlocks the disk.

Part of the [Arch Guides Dynamic](../../) security suite. Everything here is
Rust, builds reproducibly, and ships as a signed release binary.

---

## What it does

An evil-maid attack does not need your disk password. It needs five minutes with
your powered-off laptop to modify the unencrypted boot partition so that the
*next* thing you type is captured. Full-disk encryption does not help here,
because `/boot` is what the firmware reads first and it cannot be encrypted by
the disk it is unlocking.

`anti-evil-maid` records a deterministic hash of `/boot` while you know the
machine is clean, and re-checks it at boot. The hash is order-stable,
path-committed and length-prefixed, so an unchanged `/boot` always produces the
same value.

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
cd arch-guides-dynamic/security-tools/anti-evil-maid
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

Run with no arguments to start the daemon:

```bash
sudo anti-evil-maid
```

Or open the dashboard:

```bash
anti-evil-maid --interactive
```

## Where state lives

```
/etc/arch-security/anti-evil-maid/efivars.hash   # EFI variable baseline
/etc/arch-security/anti-evil-maid/boot.hash      # /boot baseline
/etc/arch-security/anti-evil-maid/hwid.hash      # motherboard UUID + MAC profile
/etc/arch-security/anti-evil-maid/tpm.hash       # TPM PCR profile
/etc/arch-security/lockout                       # written only after a failed check
```

That is the directory the suite installer provisions and the only path under
`/etc` this daemon's systemd unit can write to, since it runs with
`ProtectSystem=strict`.

Versions before 1.0 used `/etc/arch-rusty-security-suite/aem/`, which the
installer never created and the daemon could not write to. Those files are still
**read** when the new ones are missing — a baseline that vanished on upgrade
would be reported as tampering and trigger a lockout. Re-run
`anti-evil-maid --setup` to re-baseline in the new location; it will tell you
which old directory to remove.

## Verifying a release binary

```bash
gpg --import tilas01.asc
gpg --fingerprint 69D77707109F4152646AB850669F4E9A22A8A316   # compare against the root README
gpg --verify anti-evil-maid.sig anti-evil-maid
sha512sum -c anti-evil-maid.sha512
```

The previous signing key `4C0383A1…` is **revoked** — its private half was
committed to public git history. See
[Verifying downloads](../../README.md#-verifying-downloads).

## Honest limitations

It **fails closed**. A missing baseline is reported as "cannot verify", not as
"verified". An earlier version returned success when the baseline file was
absent, which meant an attacker could disable the entire check by deleting one
file in `/etc` — considerably easier than modifying `/boot` convincingly.

The hash also had to be made deterministic. `WalkDir` order is not stable, so
the original contents-only hash produced *false* alerts on an unchanged `/boot`.
A tamper alarm that cries wolf is worse than none, because it trains you to
click through the one that matters.

This detects modification. It cannot prevent it, and it cannot protect you from
an attacker who also replaces this binary. For a defence that holds when the
firmware itself is untrusted you need measured boot: coreboot plus
[Heads](https://osresearch.net/), a TPM, and a hardware token.

## Licence

CC BY-NC-SA 4.0 — free to use, modify and share non-commercially, with
attribution, under the same licence. See [LICENSE](../../LICENSE).

Provided **AS IS, without warranty of any kind**. These tools can lock you out
of your own machine if misconfigured. Read the
[wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) first.
