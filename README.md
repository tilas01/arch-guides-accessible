<img src="img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## Legal Disclaimer
> **AI-GENERATED CONTENT & NO WARRANTY:** 
> This repository was built with the assistance of AI (multiple models), with manual curation, review, and authorship by **tilas01**. All scripts are **"AS IS"** without warranty. You must review every command before execution. Test in a VM first. Licensed under [MIT License](LICENSE).

---

## Table of Contents
1. [Public Resources](#1-public-resources)
2. [Quick Start: Auto Generator](#2-quick-start-auto-generator)
3. [Quick Start: SSH Deploy](#3-quick-start-ssh-deploy)
4. [Manual Installation Guide](#4-manual-installation-guide)
5. [Arch Rusty Security Suite](#5-arch-rusty-security-suite-by-tilas01)
6. [Integrity Verification](#6-integrity-verification)
7. [Input Guard (Anti-RubberDucky)](#7-input-guard-anti-rubberducky)
8. [Libre OTP: Two-Factor Authentication](#8-libre-otp-two-factor-authentication)
9. [Post-Install Cheatsheets](#9-post-install-cheatsheets)
10. [Credits & Acknowledgements](#10-credits--acknowledgements)

---

## 1. Public Resources

| Resource | Link |
|----------|------|
| 🌐 **Generator** | [tilas01.github.io/arch-guides-dynamic](https://tilas01.github.io/arch-guides-dynamic/) |
| 📖 **Wiki** | [Wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) |
| 🎮 **Dusky OS Cheatsheet** | [docs/dusky-cheatsheet.md](docs/dusky-cheatsheet.md) |
| ⌨️ **Arch Commands + WM Shortcuts** | [docs/helpful-commands.md](docs/helpful-commands.md) |
| 🖥️ **Xorg vs Wayland** | [docs/xorg-vs-wayland.md](docs/xorg-vs-wayland.md) |
| ⚙️ **Generator Selections Explained** | [docs/10-generator-selections-and-dusky.md](docs/10-generator-selections-and-dusky.md) |

> The auto script generator is optional. Follow the Wiki manually if you prefer native tools!

---

## 2. Quick Start: Auto Generator

1. Visit **[tilas01.github.io/arch-guides-dynamic](https://tilas01.github.io/arch-guides-dynamic/)**
2. Configure hardware, security, desktop environment
3. Click **"Generate Custom Guide"**
4. Download `.md` tutorial and/or `.sh` script separately

---

## 3. Quick Start: SSH Deploy

```bash
# On Arch ISO:
systemctl start sshd
echo 'root:arch' | chpasswd
ip addr

# On your other machine:
ssh root@<ISO_IP>
# Paste the SSH one-liner from the generator
```

---

## 4. Manual Installation Guide

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

## 5. Arch Rusty Security Suite by tilas01

All security tools are bundled into a **single Rust binary**: `arch-rusty-security-suite`

| Subcommand | Description |
|------------|-------------|
| `arch-rusty-security-suite otp` | Native Rust TOTP/OTP 2FA (Boot/Login/SSH via PAM) |
| `arch-rusty-security-suite input-guard` | Intelligent USB HID Input Manager & RubberDucky Detector |
| `arch-rusty-security-suite verify-iso` | Verify Arch Linux ISO integrity against official checksums |
| `arch-rusty-security-suite verify-release <file> <sha256>` | Verify downloaded release binary integrity |

### Download

All releases are on the [**Releases page**](https://github.com/tilas01/arch-guides-dynamic/releases/latest).

```bash
# Download latest
VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/${VERSION}/arch-rusty-security-suite-linux-x86_64"
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/${VERSION}/arch-rusty-security-suite-linux-x86_64.sha256"

# Verify and install
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256
chmod +x arch-rusty-security-suite-linux-x86_64
sudo cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite
```

---

## 6. Integrity Verification

<details>
<summary><strong>🔍 Quick — SHA256 Check</strong></summary>

```bash
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256
# Expected: "arch-rusty-security-suite-linux-x86_64: OK"
```
</details>

<details>
<summary><strong>🔒 Self-Verify — Using the Suite Itself</strong></summary>

```bash
arch-rusty-security-suite verify-release \
    arch-rusty-security-suite-linux-x86_64 \
    arch-rusty-security-suite-linux-x86_64.sha256
```
</details>

<details>
<summary><strong>🔐 GPG Signature (if .asc present)</strong></summary>

```bash
gpg --recv-keys <TILAS01_KEY_ID>
gpg --verify arch-rusty-security-suite-linux-x86_64.asc arch-rusty-security-suite-linux-x86_64
```
</details>

<details>
<summary><strong>🔨 Manual Hash Computation</strong></summary>

```bash
sha256sum arch-rusty-security-suite-linux-x86_64
cat arch-rusty-security-suite-linux-x86_64.sha256
# Compare — they must be identical
```
</details>

<details>
<summary><strong>🛡️ Reproducible Build (Full Trust)</strong></summary>

```bash
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic/security-tools
cargo build --release --locked
sha256sum target/release/arch-rusty-security-suite
# Must match release hash
```
</details>

<details>
<summary><strong>💾 Verify Arch ISO on USB</strong></summary>

```bash
# Using the suite:
arch-rusty-security-suite verify-iso /path/to/archlinux-*.iso

# Manual:
sha256sum /path/to/archlinux-*.iso
curl -sL https://mirror.rackspace.com/archlinux/iso/latest/sha256sums.txt
```
</details>

---

## 7. Input Guard (Anti-RubberDucky)

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

## 8. Libre OTP: Two-Factor Authentication

```bash
# Setup
arch-rusty-security-suite otp --setup --algo sha256

# PAM integration (SSH)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sshd

# PAM integration (login)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/login
```

---

## 9. Post-Install Cheatsheets

| Cheatsheet | Link |
|------------|------|
| **Arch Commands** (pacman, systemd, disk, security) | [docs/helpful-commands.md](docs/helpful-commands.md) |
| **Dusky OS Shortcuts** | [docs/dusky-cheatsheet.md](docs/dusky-cheatsheet.md) |
| **DWM** | [docs/helpful-commands.md#-dwm-window-manager-cheatsheet](docs/helpful-commands.md) |
| **GNOME** | [docs/helpful-commands.md#-gnome-keyboard-shortcuts](docs/helpful-commands.md) |
| **KDE Plasma** | [docs/helpful-commands.md#-kde-plasma-shortcuts](docs/helpful-commands.md) |
| **Xorg vs Wayland** | [docs/xorg-vs-wayland.md](docs/xorg-vs-wayland.md) |
| **All Apps Reference** | [docs/helpful-commands.md#-helpful-post-install-apps-reference](docs/helpful-commands.md) |

---

## 10. Credits & Acknowledgements

| Who | Role | Links |
|-----|------|-------|
| [![tilas01](https://github.com/tilas01.png?size=30)](https://github.com/tilas01) **tilas01** | Author — Arch Rusty Security Suite, this repo, all code | [GitHub](https://github.com/tilas01) |
| 🤖 **AI** | Co-developer — Multiple models used, all output reviewed & authored by tilas01 | — |
| [![dusklinux](https://github.com/dusklinux.png?size=30)](https://github.com/dusklinux) **dusklinux** | Creator of Dusky OS | [GitHub](https://github.com/dusklinux/dusky) · [YouTube](https://www.youtube.com/watch?v=JmgvSdEIK8c) |
| [![vmonaco](https://github.com/vmonaco.png?size=30)](https://github.com/vmonaco) **vmonaco** | Creator of kloak keystroke anonymizer | [GitHub](https://github.com/vmonaco/kloak) |
| [![maximbaz](https://github.com/maximbaz.png?size=30)](https://github.com/maximbaz) **maximbaz** | Inspiration — security & modularity patterns | [GitHub](https://github.com/maximbaz/dotfiles) |
| 🌐 **Community** | Anti-RubberDucky HID injection mitigation concepts | Open source community |

*MIT License.*
