<!-- Author: tilas01 | Main Developer & Maintainer -->

<p align="center">
  <img src="img/banner.png" width="100%" alt="Arch Guides Banner">
</p>

<h1 align="center">🛡️ Arch Guides Dynamic</h1>

<p align="center">
  <strong>A modular, dynamically generated, security-focused Arch Linux installation system.</strong>
</p>

<p align="center">
  Created and maintained by <a href="https://github.com/tilas01"><strong>tilas01</strong></a>
</p>

<p align="center">
  <a href="https://github.com/tilas01/arch-guides-dynamic/actions/workflows/pages.yml"><img src="https://github.com/tilas01/arch-guides-dynamic/actions/workflows/pages.yml/badge.svg" alt="Pages Deploy"></a>
  <a href="https://github.com/tilas01/arch-guides-dynamic/actions/workflows/release-all.yml"><img src="https://github.com/tilas01/arch-guides-dynamic/actions/workflows/release-all.yml/badge.svg" alt="Release Security Tools"></a>
</p>

---

## ⚖️ Legal Disclaimer & Liability Waiver

> **AI-assisted content, no warranty.** This website, its repository, and the
> dynamically generated scripts and configurations were built with AI assistance.
>
> Everything here is provided **"AS IS", WITHOUT WARRANTY OF ANY KIND**, express
> or implied. The authors accept **no liability** for data loss, system damage,
> hardware failure or security breaches resulting from use of these tools.
>
> **You are responsible for your own machine.** Always read a generated script
> before running it. These scripts repartition disks, and some options here
> deliberately destroy data. Test in a VM and cross-reference the
> [Arch Wiki](https://wiki.archlinux.org/), which is the authoritative source —
> where this project and the Arch Wiki disagree, the Arch Wiki is right.
>
> **Licensing:** [CC BY-NC-SA 4.0](LICENSE). Free to use, modify and share
> non-commercially, with attribution to `tilas01`, under the same licence.
> Selling it or re-releasing it for profit is not permitted.

---

## 🚦 Three ways to use this — pick one

No wrong answer. All three end at the same system; they differ in how much is
automated versus how much you understand at the end.

| | Route | Best for | Start here |
|---|---|---|---|
| **1** | **Dynamic generator** — answer questions, get a script | You want it working, with sane security defaults | **[Open the generator →](https://tilas01.github.io/arch-guides-dynamic/)** |
| **2** | **Choose-your-own-path wiki** — the same options, explained, done by hand | You want to understand each step | **[Open the wiki →](https://tilas01.github.io/arch-guides-dynamic/wiki.html#choose-your-path)** |
| **3** | **Manual guides in this repo** — plain markdown, no website | You are offline, or prefer reading on GitHub | [Start at 01-pre-installation](docs/01-pre-installation.md) |

Every option in route 1 has a matching explanation in route 2: **right-click any
dropdown in the generator** and it opens that option's wiki entry. Routes 2 and 3
cover the same ground — the wiki is the navigable version, `docs/` is the flat
version that reads well on GitHub.

> The generator is optional. It writes a shell script; it does nothing you could
> not do by hand from the Arch Wiki. If you want to learn the process, route 2 or
> 3 is the better use of your time.

---

## 🌐 Hosted resources

* **[Interactive install generator](https://tilas01.github.io/arch-guides-dynamic/)** — builds an install script and a markdown guide from your hardware and security choices.
* **[Wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html)** — every generator option explained, plus the choose-your-own-path setup guide.
* **[Security tools](https://tilas01.github.io/arch-guides-dynamic/security-tools.html)** — all the tools in one place, with live release statistics.
* **[Live editor](https://tilas01.github.io/arch-guides-dynamic/live.html)** — edit a generated script and guide side by side before downloading.

### Reference

* **[Arch command cheatsheet](docs/helpful-commands.md)** — pacman, systemd, LUKS, BTRFS/Snapper, networking, recovery.
* **[DuskyOS / Hyprland keybinds](docs/dusky-cheatsheet.md)** — every shortcut, if you chose Dusky in the generator.
* **[Xorg vs Wayland](docs/xorg-vs-wayland.md)** — what actually differs and which you need.
* **[Maintenance](docs/maintenance.md)** — keeping a rolling-release install healthy.
* **[Architecture](docs/architecture.md)** — how the generator, guides and tools fit together.

### Manual install guides

* [01. Pre-installation](docs/01-pre-installation.md)
* [02. Partitioning](docs/02-partitioning/) — [unencrypted](docs/02-partitioning/unencrypted.md) · [LUKS1](docs/02-partitioning/luks1.md) · [LUKS2](docs/02-partitioning/luks2.md) · [LVM on LUKS2](docs/02-partitioning/lvm-on-luks2.md)
* [03. Base installation](docs/03-base-installation.md)
* [04. Bootloaders](docs/04-bootloaders/) — [UKI without GRUB](docs/04-bootloaders/uki-no-grub.md) · [systemd-boot](docs/04-bootloaders/systemd-boot.md) · [GRUB](docs/04-bootloaders/grub.md)
* [05. Secure Boot](docs/05-secure-boot/) — [custom keys + UKI](docs/05-secure-boot/custom-keys-uki.md) · [Shim + GRUB](docs/05-secure-boot/shim-grub.md)
* [06. Dual boot](docs/06-dual-boot/) — [systemd-boot + Windows](docs/06-dual-boot/systemd-boot-windows.md) · [GRUB os-prober](docs/06-dual-boot/grub-os-prober.md)
* [07. Post-installation](docs/07-post-installation.md)
* [10. Generator selections & DuskyOS](docs/10-generator-selections-and-dusky.md)

---

## 🔧 Hardware security — read before buying anything

The generator runs **after** your firmware. If someone can modify the firmware,
none of it helps: they can capture your passphrase before the kernel exists.

**[Hardware & Firmware Security →](https://tilas01.github.io/arch-guides-dynamic/wiki.html#hardware-security)**
covers, in order of value for money:

1. **Locking down the firmware you already have** — free, reversible, do this first.
2. **[BusKill](https://www.buskill.in/)** — a magnetic USB cable that triggers a lock or shutdown when separated from you. Cheap, needs no firmware changes, and covers the case FDE does not: the machine being taken while already unlocked.
3. **Measured boot** — coreboot + [Heads](https://osresearch.net/) + a TPM + a USB token, which can prove the firmware is unchanged *before* you type your passphrase. This is what a [NitroPad](https://www.nitrokey.com/products/nitropads) demonstrates.

coreboot and libreboot are both written up there, with the trade-off stated
plainly: coreboot + Heads gets you tamper-evident boot; libreboot gets you zero
proprietary blobs but generally on hardware too old to have a usable TPM. You
usually cannot maximise both. The ThinkPad flashing procedure is deliberately
out of scope — getting it wrong bricks the machine and it is board-specific.

---

## 🛡️ Security tools

Native Rust tools built for this project. All standalone, all open source.

| | Tool | What it does |
|---|---|---|
| <img src="img/icons/libre-otp-64.png" width="40" alt=""> | **[Libre OTP](security-tools/libre-otp/)** | TOTP/HOTP two-factor for boot, login and SSH. Defaults to a *silent* mode: one secret, never displayed, compared internally at boot so a mismatch means the boot chain changed. |
| <img src="img/icons/anti-ducky-64.png" width="40" alt=""> | **[Input Guard (Anti-Ducky)](security-tools/anti-ducky/)** | Watches USB HID keystroke timing and sandboxes unknown input devices, blocking BadUSB / Rubber Ducky injection before the payload can type. |
| <img src="img/icons/anti-evil-maid-64.png" width="40" alt=""> | **[Anti-Evil Maid](security-tools/anti-evil-maid/)** | Verifies boot integrity and hides the real encrypted target behind decoy kernel entries. Supports decoy and duress passphrases. |
| <img src="img/icons/kernel-watcher-64.png" width="40" alt=""> | **[Kernel Watcher](security-tools/kernel-watcher/)** | Async filesystem monitor that flags infostealers touching browser profiles, SSH keys and wallets, and detects userland rootkit behaviour. |
| <img src="img/icons/scarecrow-64.png" width="40" alt=""> | **[Scarecrow](security-tools/scarecrow/)** | Plants canary tokens and spoofs sandbox artefacts so malware that checks whether it is being analysed stays dormant. |
| <img src="img/icons/arch-security-suite-64.png" width="40" alt=""> | **[Arch Security Suite](security-tools/arch-security-suite/)** | All five of the above in one signed binary, dispatching to whichever you ask for. |

Every icon, favicon and banner in this repository is generated from one source —
[`scripts/gen-icons.py`](scripts/gen-icons.py) — which emits SVG, PNG, ICO and
the raw RGBA blob each GUI binary embeds for its window icon. Regenerate with
`python scripts/gen-icons.py`; the output is deterministic.

### Install all of them in one step

```bash
curl -fsSLO https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/scripts/install-security-suite.sh

# Read it before running it as root
less install-security-suite.sh

sudo bash install-security-suite.sh --all
```

[`install-security-suite.sh`](scripts/install-security-suite.sh) downloads each
binary, verifies its SHA-512 hash **and** GPG signature, installs it, and writes
hardened systemd units.

It **fails closed** — anything that does not verify aborts the whole run, and
there is no `--skip-verify` flag. Everything is verified before anything is
installed, so a failure part-way cannot leave you with half a suite. Daemons are
installed but left **stopped**: Input Guard can reject a keyboard and OTP can
block login, so enabling them is a decision you make after reading the config.

```bash
--all / --only libre-otp,scarecrow   # everything, or a subset
--dry-run                            # show what would happen, change nothing
--from-source                        # build with cargo from this repo
--enable                             # also start the daemons now
--uninstall                          # remove binaries and units
```

Detail: [Installing the Suite in One Step](https://tilas01.github.io/arch-guides-dynamic/wiki.html#suite-installer)

### Third-party tools also wired into the generator

[AppArmor](https://apparmor.net/) · [fail2ban](https://github.com/fail2ban/fail2ban) ·
[UFW](https://launchpad.net/ufw) · [Lynis](https://cisofy.com/lynis/) ·
[USBGuard](https://usbguard.github.io/) · [auditd](https://github.com/linux-audit/audit-userspace) ·
[usbkill](https://github.com/hephaest0s/usbkill)

---

## 🔒 Verifying downloads

Release binaries are SHA-512 hashed and, when the CI signing key is configured,
GPG-signed. The public key (`tilas01.asc`) is committed at the repository root.

**Current signing key — trust this one:**

```
5CC1 B2BE D4D0 5F65 E9E9  6542 3AA7 4BEC 12F3 D5ED
tilas01
ed25519, created 2026-07-26, expires 2028-07-25
```

The user ID is the bare name `tilas01` — no email address, by design. An email
in a key's user ID is published forever in every copy of it and cannot be taken
back.

```bash
gpg --import tilas01.asc                                  # 1. import the key
gpg --fingerprint 5CC1B2BED4D05F65E9E965423AA74BEC12F3D5ED  # 2. compare against the block above
gpg --verify libre-otp.sig libre-otp                      # 3. verify the signature
sha512sum -c libre-otp.sha512                             # 4. verify the hash
```

A `Good signature from "tilas01"` plus an
`OK` means the binary is what was built. If either check fails, do not run it.

You can also use [`scripts/verify-integrity.sh`](scripts/verify-integrity.sh),
which does all three steps and refuses to pass if `gpg` is unavailable.

### 🔑 Signing key history

The signing key has been rotated a few times. The full history is below so that
anyone verifying an older release can tell which key was current when, and why
each one was retired. **Only the current key at the top of this section should
be trusted.**

| Key fingerprint | Period | Retired because |
|---|---|---|
| `5CC1 B2BE D4D0 5F65 E9E9  6542 3AA7 4BEC 12F3 D5ED` | 2026-07-26 → current | — (current) |
| `69D7 7707 109F 4152 646A  B850 669F 4E9A 22A8 A316` | 2026-07-26 | Data loss — private key no longer available |
| `745F 82B4 1AFD 9456 3685  9C92 2F43 352E C307 EF09` | 2026-07-25 | Withdrawn before use — never signed a release |
| `4C03 83A1 68D0 EA1D D6F1  ACB5 A131 18E0 3A7D 55A0` | 2026-06-18 → 2026-07-25 | **Compromised** — private key was committed to public git history. **Revoked.** |

Only one of these keys was ever *compromised*: `4C0383A1…`, whose private key
material (`.keys/private.key`, `.keys/private-keys-v1.d/*.key`) was committed to
this public repository and is still recoverable from git history. It is
**revoked**, and the revocation is published as
[`tilas01-revoked-2026-06.asc`](tilas01-revoked-2026-06.asc). The later
retirements were housekeeping — a withdrawn key that never shipped, and a key
whose private half was subsequently lost — not breaches, so those keys carry no
revocation.

If you ever imported the compromised key, import its revocation so GnuPG stops
trusting it:

```bash
gpg --import tilas01-revoked-2026-06.asc
gpg --list-keys 4C0383A168D0EA1DD6F1ACB5A13118E03A7D55A0   # must show "revoked"
```

**Treat every signature made by `4C0383A1…` as meaningless.** Re-verify anything
you installed from a release signed with it against the current key, or rebuild
from source using [`docs/building-from-source.md`](docs/building-from-source.md)
— the builds are reproducible, so a rebuild is an independent check that does
not rely on any key at all.

Private key material for the current key is stored **outside this repository and
outside any cloud-synced folder**, and `.keys/`, `*.key` and `*.gpg` are in
[`.gitignore`](.gitignore). Nothing secret is committed.

---

## 🗺️ Roadmap

Planned, not yet built:

* **Wider setup choice** — pick your exact window manager, or Xorg, or Wayland, or neither; shell (zsh and friends), colour palette, monospace font, size and syntax highlighting.
* **AUR review tool** — the AUR is a recurring attack surface. The idea: review each `PKGBUILD`/`makepkg` before it runs, show the reasoning so you can review it too, record every file the install touches so it can be reverted precisely, remember authors whose packages have consistently been clean, block or warn on critical paths, and cross-check against a public list of known-malicious AUR packages. Killing a build mid-flight and rolling back is the core requirement.
* **Expanded hardware guidance** — more measured-boot walkthroughs for specific machines.

Contributions and issue reports are welcome.

---

## 🙏 Credits

* **[tilas01](https://github.com/tilas01)** — author, developer and maintainer of all project code, scripts, tooling and documentation.
* **[dusklinux](https://github.com/dusklinux/dusky)** — creator of DuskyOS, the basis for the Dusky desktop option and its cheatsheet.
* **[Arch Wiki](https://wiki.archlinux.org/)** — the authoritative reference every procedure here follows.
* **[max-baz/arch-secure-boot](https://github.com/max-baz/arch-secure-boot)** — the Secure Boot / UKI approach, whose guide covers running LUKS with a Unified Kernel Image instead of GRUB, as used here. [`scripts/arch-secure-boot.sh`](scripts/arch-secure-boot.sh) is adapted from it.
* **[Snapper](https://github.com/openSUSE/snapper)** and **[usbkill](https://github.com/hephaest0s/usbkill)** — integrated into the generator.
* **[Claude](https://claude.com/claude-code)** (Anthropic) — the AI assistant that
  wrote and rebuilt much of this site, the generator, the manual walkthrough, the
  wiki and the Rust security tools, working alongside tilas01. Named rather than
  credited vaguely: you should know what wrote the code that partitions your
  disk. Every output is reviewed, tested and curated by tilas01, and nothing
  ships unreviewed — but "AI-assisted" is doing real work in that sentence, and
  the disclaimer at the top of every page means it.
