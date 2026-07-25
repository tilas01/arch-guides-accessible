<div align="center">
  <img src="assets/banner.png" width="880" alt="Input Guard (Anti-Ducky)">
</div>

# Input Guard (Anti-Ducky)

Watches USB HID keystroke timing and sandboxes unknown input devices, so a BadUSB / Rubber Ducky cannot type its payload.

Part of the [Arch Guides Dynamic](../../) security suite. Everything here is
Rust, builds reproducibly, and ships as a signed release binary.

---

## What it does

`anti-ducky` reads input devices through `evdev` and looks at *how* they type.
A human hitting keys produces irregular inter-keystroke intervals; a firmware
implant replaying a payload does not. Devices that appear mid-session and
immediately type at machine speed are held back rather than trusted.

An unlock path exists for the legitimate case where you really did just plug in
a new keyboard. It is guarded by a PIN stored as an Argon2id hash at
`/etc/arch-security/anti-ducky/unlock.hash` (0600) and it **fails closed**: if
no PIN has been configured, nothing is unlocked.

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
cd arch-guides-dynamic/security-tools/anti-ducky
cargo build --release --locked
```

[docs/building-from-source.md](../../docs/building-from-source.md) has the exact
toolchain and the `SOURCE_DATE_EPOCH` setting that makes the output
byte-identical to the published binary.

## Usage

```
  -i, --interactive      Launch the GUI dashboard (Wayland/Xorg)
  -u, --unlock           Authenticate, then temporarily allow new USB input devices
      --set-unlock-pin   Set or change the unlock PIN (needs root), then exit
  -h, --help             Full argument list
  -V, --version          Version
```

Run with no arguments to start the daemon:

```bash
sudo anti-ducky
```

Or open the dashboard:

```bash
anti-ducky --interactive
```

## Verifying a release binary

```bash
gpg --import tilas01.asc
gpg --fingerprint 745F82B41AFD945636859C922F43352EC307EF09   # compare against the root README
gpg --verify anti-ducky.sig anti-ducky
sha512sum -c anti-ducky.sha512
```

The previous signing key `4C0383A1…` is **revoked** — its private half was
committed to public git history. See
[Verifying downloads](../../README.md#-verifying-downloads).

## Honest limitations

**The keystroke-timing thresholds have never been measured on real hardware.**
Its false-positive rate is unknown, and this is the tool standing between you
and the keyboard you log in with. Test it on a machine you can still reach by
other means (SSH, a second keyboard, a live USB) before enabling the daemon on a
machine you depend on.

A previous version compared the unlock PIN against the literal string `"1337"`
hardcoded in `main.rs`. That was not authentication — the PIN was published in
the source of a public repository, so anyone could lift the USB block. It is now
an Argon2id hash that you set yourself.

## Licence

CC BY-NC-SA 4.0 — free to use, modify and share non-commercially, with
attribution, under the same licence. See [LICENSE](../../LICENSE).

Provided **AS IS, without warranty of any kind**. These tools can lock you out
of your own machine if misconfigured. Read the
[wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) first.
