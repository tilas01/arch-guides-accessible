<div align="center">
  <img src="assets/banner.png" width="880" alt="Scarecrow">
</div>

# Scarecrow

Canary tokens and sandbox spoofing: convinces malware it is being watched, and gives you a duress login that does not look like one.

Part of the [Arch Guides Dynamic](../../) security suite. Everything here is
Rust, builds reproducibly, and ships as a signed release binary.

---

## What it does

A lot of commodity malware checks whether it is running in an analyst's sandbox
and quietly exits if it decides it is. `scarecrow` makes an ordinary machine look
like that sandbox. Cheap to run, and it costs an attacker more than it costs you.

It also plants canary files: documents that nothing legitimate ever reads.
Anything that opens one has announced itself.

The duress login presents a plausible session while signalling that you are not
entering it freely.

### Duress login with real plausible deniability

The duress login exists so that, under coercion, you can hand over *a* password
that opens a believable, working environment while your real data stays sealed.
For that to work it has to be **silent about being a decoy** — the person
standing over your shoulder must see an ordinary login, not a message announcing
that a duress password was entered.

So: the duress password is an Argon2id hash you set with
`--set-duress-password` (never a value baked into the source), the prompt is
indistinguishable from a normal one, and a match silently raises an on-disk
duress signal and drops you into a functional decoy session rooted in a
populated decoy home. Nothing on screen says "duress", and the word "wipe"
appears nowhere.

This provides the believable *session*. Deniability at the *disk* level still
needs the hidden-volume LUKS setup covered in the
[wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html#luks-duress) —
the two work together: the hidden volume keeps the real data unreachable, and
this makes the decoy that is reachable look lived-in.

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
cd arch-guides-dynamic/security-tools/scarecrow
cargo build --release --locked
```

[docs/building-from-source.md](../../docs/building-from-source.md) has the exact
toolchain and the `SOURCE_DATE_EPOCH` setting that makes the output
byte-identical to the published binary.

## Usage

```
  -i, --interactive           Launch the GUI dashboard (Wayland/Xorg)
  -l, --login                 Present the duress / decoy login prompt
      --set-duress-password   Set or change the duress password, then exit
      --confirm               Double-enter at the duress prompt (off by default; a confirm step is a tell)
  -h, --help                  Full argument list
  -V, --version               Version
```

Run with no arguments to start the daemon:

```bash
sudo scarecrow
```

Or open the dashboard:

```bash
scarecrow --interactive
```

## Verifying a release binary

```bash
gpg --import tilas01.asc
gpg --fingerprint 5CC1B2BED4D05F65E9E965423AA74BEC12F3D5ED   # compare against the root README
gpg --verify scarecrow.sig scarecrow
sha512sum -c scarecrow.sha512
```

The previous signing key `4C0383A1…` is **revoked** — its private half was
committed to public git history. See
[Verifying downloads](../../README.md#-verifying-downloads).

## Honest limitations

**Plausible deniability is only as good as the decoy you build.** An empty decoy
home fools no one — populate it with believable, innocuous files so it reads as a
real account in use. And the disk-level half is not this tool's job: without the
hidden-volume LUKS setup, an examiner who images the disk can still see that a
second, larger encrypted volume exists. This makes the *session* convincing; the
wiki covers making the *disk* convincing.

A previous version compared the duress password against the hardcoded string
`"duress123"` and then printed "Duress password detected! Wiping system" — which
told the coercer exactly what had happened. Both problems are fixed.

Sandbox spoofing works against malware that bothers to check. It is a filter,
not a wall. Targeted tooling will not be fooled and should not be assumed to be.

## Licence

CC BY-NC-SA 4.0 — free to use, modify and share non-commercially, with
attribution, under the same licence. See [LICENSE](../../LICENSE).

Provided **AS IS, without warranty of any kind**. These tools can lock you out
of your own machine if misconfigured. Read the
[wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) first.
