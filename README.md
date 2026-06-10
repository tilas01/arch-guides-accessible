<!-- Author: tilas01 | Main Developer & Maintainer -->

<img src="img/banner.png" width="100%" alt="Arch Guides Banner">

<h1 align="center">Arch Guides: Accessible & Modular</h1>

<p align="center">
  <strong>The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.</strong>
</p>

<p align="center">
  Created and maintained by <a href="https://github.com/tilas01"><strong>tilas01</strong></a>
</p>

---

## Legal Disclaimer

> **AI-GENERATED CONTENT & NO WARRANTY:**
> This repository was built with the assistance of AI (multiple models), with manual curation, review, and authorship by **tilas01**. All scripts are **"AS IS"** without warranty. You must review every command before execution. Test in a VM first. Licensed under [MIT License](LICENSE).

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Quick Start](#quick-start)
- [Manual Installation Guide](#manual-installation-guide)
- [Arch Rusty Security Suite](#arch-rusty-security-suite)
- [Integrity Verification](#integrity-verification)
- [Build from Source](#build-from-source)
- [Input Guard (Anti-RubberDucky)](#input-guard-anti-rubberducky)
- [Libre OTP: Two-Factor Authentication](#libre-otp-two-factor-authentication)
- [Post-Install Apps](#post-install-apps)
- [Cheatsheets](#cheatsheets)
- [Credits & Acknowledgements](#credits--acknowledgements)
- [License](#license)

---

## About

**Arch Guides** is a comprehensive, modular resource for installing and securing Arch Linux. It provides an interactive web-based generator that produces custom installation guides and scripts tailored to your hardware, security preferences, and desktop environment — along with a full security suite, cheatsheets, and post-install references.

---

## Features

- 🔧 **Custom Install Guide Generator** — Interactive web tool that produces tailored `.md` guides and `.sh` scripts for your exact hardware and preferences
- 📖 **Comprehensive Wiki** — Step-by-step reference covering every stage of an Arch installation
- 🛡️ **Arch Rusty Security Suite** — A single Rust binary bundling OTP 2FA, USB Input Guard, and ISO/release verification
- 📋 **Cheatsheets** — Quick-reference guides for Arch commands, Dusky OS, DWM, GNOME, KDE Plasma, and Xorg vs Wayland
- 🔐 **Integrity Verification** — SHA256 checksums and optional GPG signature verification for all release binaries
- 🌐 **SSH Deploy** — One-liner remote deployment from the generator for headless installs

---

## Quick Start

1. Visit the **[Arch Guides Generator](https://tilas01.github.io/arch-guides-dynamic/)**
2. Configure your hardware, security level, and desktop environment
3. Click **"Generate Custom Guide"**
4. Download your custom `.md` tutorial and/or `.sh` script

> The generator is optional. Follow the [Wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) manually if you prefer.

### SSH Deploy (Optional)

```bash
# On the Arch ISO:
systemctl start sshd
echo 'root:arch' | chpasswd
ip addr

# On your other machine:
ssh root@<ISO_IP>
# Paste the SSH one-liner from the generator
```

---

## Manual Installation Guide

| Step | Guide |
|------|-------|
| 1. Pre-Installation | [docs/01-pre-installation.md](docs/01-pre-installation.md) |
| 2. Partitioning | [docs/02-partitioning/](docs/02-partitioning/) |
| 3. Base Installation | [docs/03-base-installation.md](docs/03-base-installation.md) |
| 4. Bootloaders | [docs/04-bootloaders/](docs/04-bootloaders/) |
| 5. Secure Boot | [docs/05-secure-boot/](docs/05-secure-boot/) |
| 6. Dual Boot | [docs/06-dual-boot/](docs/06-dual-boot/) |
| 7. Post-Installation | [docs/07-post-installation.md](docs/07-post-installation.md) |

---

## Arch Rusty Security Suite

All security tools are bundled into a **single Rust binary**: `arch-rusty-security-suite`

| Subcommand | Description |
|------------|-------------|
| `arch-rusty-security-suite otp` | Native Rust TOTP/OTP 2FA (Boot/Login/SSH via PAM) |
| `arch-rusty-security-suite input-guard` | Intelligent USB HID Input Manager & RubberDucky Detector |
| `arch-rusty-security-suite verify-iso` | Verify Arch Linux ISO integrity against official checksums |
| `arch-rusty-security-suite verify-release <file> <sha256>` | Verify downloaded release binary integrity |

### Download

All releases are available on the [**Releases page**](https://github.com/tilas01/arch-guides-dynamic/releases/latest).

```bash
# Download latest release
VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/${VERSION}/arch-rusty-security-suite-linux-x86_64"
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/${VERSION}/arch-rusty-security-suite-linux-x86_64.sha256"

# Verify and install
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256
chmod +x arch-rusty-security-suite-linux-x86_64
sudo cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite
```

---

## Integrity Verification

### SHA256 Check

```bash
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256
# Expected: "arch-rusty-security-suite-linux-x86_64: OK"
```

### Self-Verify Using the Suite

```bash
arch-rusty-security-suite verify-release \
    arch-rusty-security-suite-linux-x86_64 \
    arch-rusty-security-suite-linux-x86_64.sha256
```

### GPG Signature (Optional)

If a `.asc` signature file is provided with the release:

```bash
gpg --recv-keys <TILAS01_KEY_ID>
gpg --verify arch-rusty-security-suite-linux-x86_64.asc arch-rusty-security-suite-linux-x86_64
```

### Manual Hash Comparison

```bash
sha256sum arch-rusty-security-suite-linux-x86_64
cat arch-rusty-security-suite-linux-x86_64.sha256
# Compare — they must be identical
```

### Verify Arch ISO

```bash
# Using the suite:
arch-rusty-security-suite verify-iso /path/to/archlinux-*.iso

# Manual:
sha256sum /path/to/archlinux-*.iso
curl -sL https://mirror.rackspace.com/archlinux/iso/latest/sha256sums.txt
```

---

## Build from Source

```bash
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic/security-tools
cargo build --release --locked
sha256sum target/release/arch-rusty-security-suite
# Compare against the published release hash for full reproducible trust
```

---

## Input Guard (Anti-RubberDucky)

> Completely rewritten as an **Intelligent USB HID Input Manager**.

| Feature | Description |
|---------|-------------|
| **Auto Sandbox** | New USB HID devices are sandboxed — keystrokes captured but NOT forwarded |
| **Payload Detection** | Injection-speed events (< 15ms) trigger forensic payload capture |
| **2-of-N Approval** | New devices need 2 approved devices to run `arch-rusty-security-suite input-guard --approve <fingerprint>` |
| **SSH Backup** | SSH (with OTP) is a required backup approval channel |
| **Wall Alerts** | All events broadcast to every TTY and SSH session |

```bash
# Setup
arch-rusty-security-suite input-guard --init
systemctl enable --now input-guard.service
```

---

## Libre OTP: Two-Factor Authentication

```bash
# Setup
arch-rusty-security-suite otp --setup --algo sha256

# PAM integration (SSH)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sshd

# PAM integration (login)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/login
```

---

## Post-Install Apps

| App | Install | Description | Libre? |
|-----|---------|-------------|--------|
| [paru](https://github.com/Morganamilo/paru) | `yay -S paru` | AUR helper (Rust) | ✅ |
| [Firefox](https://mozilla.org) | `pacman -S firefox` | Web browser | ⚠️ non-libre firmware |
| [LibreWolf](https://librewolf.net) | `paru -S librewolf` | Privacy-focused Firefox fork | ✅ |
| [Tor Browser](https://torproject.org) | `paru -S tor-browser` | Anonymity browser | ✅ |
| [Signal](https://signal.org) | `paru -S signal-desktop` | E2E encrypted messaging | ⚠️ some non-libre |
| [KeePassXC](https://keepassxc.org) | `pacman -S keepassxc` | Password manager | ✅ |
| [Neovim](https://neovim.io) | `pacman -S neovim` | Text editor | ✅ |
| [Alacritty](https://alacritty.org) | `pacman -S alacritty` | GPU-accelerated terminal | ✅ |
| [VSCodium](https://vscodium.com) | `paru -S vscodium` | Code editor (libre VS Code) | ✅ |
| [mpv](https://mpv.io) | `pacman -S mpv` | Media player | ✅ |
| [OBS Studio](https://obsproject.com) | `pacman -S obs-studio` | Streaming & recording | ✅ |
| [Flatpak](https://flatpak.org) | `pacman -S flatpak` | Universal app format | ⚠️ may include proprietary |
| [kloak](https://github.com/vmonaco/kloak) | Build from source | Keystroke anonymizer | ✅ |

> ✅ = Fully libre/open source | ⚠️ = Free to use but may include non-libre components

---

## Cheatsheets

| Cheatsheet | Link |
|------------|------|
| **Arch Commands** (pacman, systemd, disk, security) | [docs/helpful-commands.md](docs/helpful-commands.md) |
| **Dusky OS Shortcuts** | [docs/dusky-cheatsheet.md](docs/dusky-cheatsheet.md) |
| **DWM Window Manager** | [docs/helpful-commands.md#-dwm-window-manager-cheatsheet](docs/helpful-commands.md#-dwm-window-manager-cheatsheet) |
| **GNOME Keyboard Shortcuts** | [docs/helpful-commands.md#-gnome-keyboard-shortcuts](docs/helpful-commands.md#-gnome-keyboard-shortcuts) |
| **KDE Plasma Shortcuts** | [docs/helpful-commands.md#-kde-plasma-shortcuts](docs/helpful-commands.md#-kde-plasma-shortcuts) |
| **Xorg vs Wayland** | [docs/xorg-vs-wayland.md](docs/xorg-vs-wayland.md) |
| **Generator Selections Explained** | [docs/10-generator-selections-and-dusky.md](docs/10-generator-selections-and-dusky.md) |

---

## Credits & Acknowledgements

<h3 align="center">
  <a href="https://github.com/tilas01">
    <img src="https://github.com/tilas01.png?size=80" width="80" alt="tilas01" style="border-radius:50%">
  </a>
  <br>
  <a href="https://github.com/tilas01">tilas01</a>
  <br>
  <sub>Main Author, Developer & Maintainer</sub>
</h3>

<p align="center">
  Creator of Arch Guides, the Arch Rusty Security Suite, and all project code.<br>
  All AI-generated content has been manually curated, reviewed, and authored by tilas01.
</p>

---

| Contributor | Role | Links |
|-------------|------|-------|
| **dusklinux** | Creator of Dusky OS — the minimal Arch-based distro featured in this project | [GitHub](https://github.com/dusklinux) · [YouTube](https://www.youtube.com/watch?v=JmgvSdEIK8c) |
| **arch-minimal-install** | Inspiration for the minimal installation approach and modular guide structure | — |
| **vmonaco** | Creator of kloak, the keystroke anonymizer referenced in the security tools | [GitHub](https://github.com/vmonaco/kloak) |
| **AI Assistance** | Multiple AI models were used during development; all output was reviewed and authored by tilas01 | — |

---

## License

This project is licensed under the [MIT License](LICENSE).
