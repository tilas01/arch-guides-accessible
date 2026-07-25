<div align="center">
  <img src="assets/banner.png" width="880" alt="Kernel Watcher">
</div>

# Kernel Watcher

Asynchronous filesystem monitor that flags infostealers reading browser profiles, SSH keys and wallets, and userland rootkit behaviour.

Part of the [Arch Guides Dynamic](../../) security suite. Everything here is
Rust, builds reproducibly, and ships as a signed release binary.

---

## What it does

Most credential theft on a desktop Linux machine is not exotic. It is a process
reading `~/.ssh/id_*`, `~/.mozilla`, a browser's `Login Data` or a wallet
directory and sending the contents somewhere. `kernel-watcher` watches those
paths and reports who touched them.

Destructive controls are behind a master password stored as an Argon2id hash
(m=64MiB, t=3, p=4, well above the OWASP floor) written at 0600, so a stolen
hash is expensive to attack offline.

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
cd arch-guides-dynamic/security-tools/kernel-watcher
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
sudo kernel-watcher
```

Or open the dashboard:

```bash
kernel-watcher --interactive
```

## Where state lives

```
/etc/arch-security/kernel-watcher/tamper.hash        # Argon2id master password hash, 0600
/etc/arch-security/kernel-watcher/evil_maid.hash     # /boot baseline, 0600
/etc/arch-security/kernel-watcher/ntfy_topic.conf    # optional ntfy.sh alert topic
```

That is the directory the suite installer provisions, one subdirectory per tool.

Versions before 1.0 wrote to `/etc/arch-rusty-security-suite/`, which the
installer never created. Those files are still **read** when the new ones are
missing, so an upgrade does not turn an existing baseline into a RED ALERT.
Nothing writes there any more — run `kernel-watcher --setup` to record state in
the new location, and it will point at the stale copy so you can remove it.

## Verifying a release binary

```bash
gpg --import tilas01.asc
gpg --fingerprint 745F82B41AFD945636859C922F43352EC307EF09   # compare against the root README
gpg --verify kernel-watcher.sig kernel-watcher
sha512sum -c kernel-watcher.sha512
```

The previous signing key `4C0383A1…` is **revoked** — its private half was
committed to public git history. See
[Verifying downloads](../../README.md#-verifying-downloads).

## Honest limitations

The eBPF paths have **not** been independently reviewed. Treat the filesystem
monitoring as the part that has had attention.

Monitoring is detection, not prevention. A process that has already read your
SSH key has already read it; what this buys you is knowing, and knowing quickly.
For prevention, look at AppArmor profiles — and at not running the thing.

## Licence

CC BY-NC-SA 4.0 — free to use, modify and share non-commercially, with
attribution, under the same licence. See [LICENSE](../../LICENSE).

Provided **AS IS, without warranty of any kind**. These tools can lock you out
of your own machine if misconfigured. Read the
[wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) first.
