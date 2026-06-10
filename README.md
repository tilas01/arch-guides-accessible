<img src="img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## Legal Disclaimer & Liability Waiver
> **AI-GENERATED CONTENT & NO WARRANTY:** 
> This website, its entire repository, and all dynamically generated scripts/configurations were built with the assistance of Artificial Intelligence.
>
> By using this repository or the hosted website, you explicitly agree that all scripts and instructions are provided **"AS IS", WITHOUT WARRANTY OF ANY KIND**. The authors hold absolutely **NO liability** for any data loss, system damage, hardware failure, or security breaches. You must ALWAYS manually review code before executing. We strongly recommend testing in a VM first. Licensed under the [MIT License](LICENSE).

---

## Table of Contents
1. [Public Hosted Resources](#1-public-hosted-resources)
2. [Quick Start: Auto Generator](#2-quick-start-auto-generator)
3. [Quick Start: SSH Deploy to Arch ISO](#3-quick-start-ssh-deploy-to-arch-iso)
4. [Manual Installation Guide](#4-manual-installation-guide)
5. [Security Tools — Releases & Downloads](#5-security-tools--releases--downloads)
6. [Integrity Verification Guide](#6-integrity-verification-guide)
7. [Anti-RubberDucky: Input Manager](#7-anti-rubberducky-input-manager)
8. [Libre OTP: Two-Factor Authentication](#8-libre-otp-two-factor-authentication)
9. [Included Payloads & Security Mechanisms](#9-included-payloads--security-mechanisms)
10. [Post-Install Cheatsheets](#10-post-install-cheatsheets)
11. [Credits & Acknowledgements](#11-credits--acknowledgements)

---

## 1. Public Hosted Resources

| Resource | Link | Description |
|----------|------|-------------|
| 🌐 **Generator Website** | [tilas01.github.io/arch-guides-dynamic](https://tilas01.github.io/arch-guides-dynamic/) | Interactive Arch Linux install generator |
| 📖 **Wiki** | [Website Wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) | Full modular documentation |
| 🎮 **OS Shortcut & Command Cheatsheet for Dusky 2026 OS Release** | [dusky-cheatsheet.md](docs/dusky-cheatsheet.md) | Full DuskyOS shortcuts, keybindings, theming |
| ⌨️ **Arch Command Cheatsheet** | [helpful-commands.md](docs/helpful-commands.md) | Arch pacman, systemd, DWM, GNOME, KDE cheatsheets |
| 🖥️ **Xorg vs Wayland Guide** | [xorg-vs-wayland.md](docs/xorg-vs-wayland.md) | Display server differences and use cases |
| 🔐 **Generator Selections Wiki** | [10-generator-selections-and-dusky.md](docs/10-generator-selections-and-dusky.md) | Every generator option explained |

> **Note:** The auto script generator is completely optional. Follow the Wiki manually if you prefer native tools and want to reduce downloads!

---

## 2. Quick Start: Auto Generator

1. Visit **[tilas01.github.io/arch-guides-dynamic](https://tilas01.github.io/arch-guides-dynamic/)**
2. Select your hardware: CPU brand, GPU brand, firmware (UEFI/BIOS)
3. Choose your security options: encryption, kernel, bootloader, OTP, anti-ducky
4. Choose your desktop environment (GNOME, KDE, DWM, or **Dusky OS**)
5. Click **"Generate Custom Guide"**
6. Download the Markdown tutorial (`.md`) and/or Bash script (`.sh`)

---

## 3. Quick Start: SSH Deploy to Arch ISO

If you want to type/paste from a second machine instead of the ISO keyboard:

```bash
# In the generator: set "Arch ISO Pre-Install Setup" → "Start SSHd"
# Run this on the Arch ISO booted machine:
systemctl start sshd
echo 'root:arch' | chpasswd
ip addr  # Note the IP address

# On your other machine, SSH in:
ssh root@<ISO_IP>

# Then paste the generated deploy command (from the website):
cat << 'ARCHEOF' > install.sh
<paste generated script here>
ARCHEOF
bash install.sh
```

---

## 4. Manual Installation Guide

Every generator option has a corresponding manual guide. Follow these in order:

1. **[Pre-Installation](docs/01-pre-installation.md)** — ISO preparation, keyboard, internet
2. **[Partitioning](docs/02-partitioning/)** — LUKS1, LUKS2, LVM-on-LUKS2, unencrypted
3. **[Base Installation](docs/03-base-installation.md)** — pacstrap, kernel, microcode
4. **[Bootloaders](docs/04-bootloaders/)** — UKI (custom keys), UKI (shim), systemd-boot, GRUB
5. **[Secure Boot](docs/05-secure-boot/)** — enrolling custom keys or using shim
6. **[Dual Boot](docs/06-dual-boot/)** — Windows dual boot with GRUB or systemd-boot
7. **[Post-Installation](docs/07-post-installation.md)** — users, desktop, apps
8. **[Generator Selections Explained](docs/10-generator-selections-and-dusky.md)** — understand every option
9. **[Xorg vs Wayland](docs/xorg-vs-wayland.md)** — display server choice guide

---

## 5. Security Tools — Releases & Downloads

All security tools are compiled from this repository via GitHub Actions and released to the [**Releases page**](https://github.com/tilas01/arch-guides-dynamic/releases/latest).

> **Each release is tagged `vYYYY.MM.DD-<commit>` and contains SHA-256 hashes. GPG signatures are included when `GPG_PRIVATE_KEY` secret is configured.**

| Binary | Direct Link | SHA256 File | GPG Sig |
|--------|-------------|-------------|---------|
| `anti-ducky-linux-x86_64` | [Latest Release ↗](https://github.com/tilas01/arch-guides-dynamic/releases/latest) | `.sha256` included | `.asc` if signed |
| `libre-otp-linux-x86_64` | [Latest Release ↗](https://github.com/tilas01/arch-guides-dynamic/releases/latest) | `.sha256` included | `.asc` if signed |

```bash
# Quick download (replace VERSION with latest tag):
VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/${VERSION}/anti-ducky-linux-x86_64"
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/${VERSION}/anti-ducky-linux-x86_64.sha256"
```

---

## 6. Integrity Verification Guide

<details>
<summary><strong>🔍 Automatic Verification (Quick — SHA256)</strong></summary>

```bash
# After downloading binary and .sha256 file:
sha256sum -c anti-ducky-linux-x86_64.sha256
sha256sum -c libre-otp-linux-x86_64.sha256
# Expected output: "<filename>: OK"
```
</details>

<details>
<summary><strong>🔐 GPG Signature Verification (Recommended — if .asc files present)</strong></summary>

```bash
# Import the public key (replace with actual key fingerprint from releases):
gpg --recv-keys <TILAS01_KEY_ID>

# Verify binary signature:
gpg --verify anti-ducky-linux-x86_64.asc anti-ducky-linux-x86_64
gpg --verify libre-otp-linux-x86_64.asc libre-otp-linux-x86_64

# Verify hash file signature:
gpg --verify anti-ducky-linux-x86_64.sha256.asc anti-ducky-linux-x86_64.sha256

# Expected: "Good signature from tilas01 ..."
```
</details>

<details>
<summary><strong>🔨 Manual Hash Verification (Compute yourself)</strong></summary>

```bash
# Step 1: Download the binary
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/latest/download/anti-ducky-linux-x86_64"

# Step 2: Download the expected hash
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/latest/download/anti-ducky-linux-x86_64.sha256"

# Step 3: Compute hash yourself
sha256sum anti-ducky-linux-x86_64

# Step 4: View the expected hash
cat anti-ducky-linux-x86_64.sha256

# Step 5: Compare — they must be identical!
# If they differ, DO NOT use the binary.
```
</details>

<details>
<summary><strong>🛡️ Reproducible Build Verification (Full Trust — Build Yourself)</strong></summary>

Build the exact same binary from source to verify it matches the release hash:

```bash
# 1. Clone the repository at the exact commit of the release
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic

# Check the release commit SHA (shown in release notes):
git checkout <RELEASE_COMMIT_SHA>

# 2. Install exact Rust toolchain (stable)
rustup toolchain install stable
rustup default stable

# 3. Build with --locked (uses exact Cargo.lock dep versions)
cd security-tools/anti-ducky
cargo build --release --locked

# 4. Compare hash with the official release
sha256sum target/release/anti-ducky
# This MUST match: anti-ducky-linux-x86_64.sha256 from the release
```

> If the hash matches, the release binary was built from exactly that source code with no tampering.
</details>

<details>
<summary><strong>💾 ISO Integrity Verification (Arch Linux ISO before flashing)</strong></summary>

```bash
# Linux/macOS — automatic
bash scripts/verify_iso.sh /path/to/archlinux-*.iso

# Windows — drag and drop .iso onto:
scripts\verify_iso.bat

# Manual:
sha256sum /path/to/archlinux-*.iso
curl -sL https://mirror.rackspace.com/archlinux/iso/latest/sha256sums.txt
# Compare your computed hash to the line matching your ISO filename
```
</details>

---

## 7. Anti-RubberDucky: Input Manager

> **anti-ducky v0.2.0** — completely rewritten as an intelligent USB HID Input Manager.

### What it does

Unlike simple rate-limiters, anti-ducky is a **full input proxy and sandbox daemon**:

| Feature | Description |
|---------|-------------|
| **Device Registry** | Maintains a list of approved input devices with SHA-256 fingerprints |
| **Auto Sandbox** | Any *new* USB HID device is automatically sandboxed — keystrokes are captured but NOT forwarded to the OS |
| **Payload Detection** | Analyses keystroke timing patterns. Injection-speed events (< 15ms) trigger payload capture mode |
| **Forensic Logging** | Full payload dump written to `/var/log/anti-ducky/payload_<timestamp>.log` with SHA-256 chain-of-custody |
| **2-of-N Approval** | A new device only exits sandbox after **2 currently-approved input devices** both run `anti-ducky --approve <fingerprint>` |
| **SSH Backup Channel** | SSH (with Libre-OTP 2FA) acts as a required backup input approval channel — checked at daemon startup |
| **Wall Alerts** | All events broadcast via `wall` to all TTYs and SSH sessions |

### Security Requirements

> **⚠️ To use anti-ducky, you MUST have ALL of the following configured:**
> 1. **SSH daemon** running (`sshd`) — serves as guaranteed backup input channel
> 2. **Libre-OTP** on SSH and login — prevents unauthorized SSH-based approval
> 3. **At least 2 physical input devices** registered as approved at setup time

### Setup

```bash
# Install the daemon
cp anti-ducky-linux-x86_64 /usr/local/bin/anti-ducky
chmod 755 /usr/local/bin/anti-ducky

# First run — registers your existing keyboard and mouse as approved
anti-ducky --init

# Create systemd service
cat > /etc/systemd/system/anti-ducky.service << 'EOF'
[Unit]
Description=Anti-RubberDucky Intelligent Input Manager
After=sshd.service  
Requires=sshd.service

[Service]
ExecStart=/usr/local/bin/anti-ducky
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now anti-ducky.service
```

### Approving a new device

```bash
# When you plug in a new keyboard/mouse, you will see a wall broadcast.
# On TWO different currently-approved devices (e.g. keyboard + SSH session), run:
anti-ducky --approve <first-16-chars-of-fingerprint>

# After both approvals, the device is ungrabbed and forwarded normally.
# Logs: /var/log/anti-ducky/anti-ducky.log
```

---

## 8. Libre OTP: Two-Factor Authentication

> Native Rust TOTP/OTP 2FA for PAM integration. Works at boot, login, and over SSH.

```bash
# Setup (as root)
libre-otp --setup
# → Generates a secret, saves to /etc/libre-otp/secret.txt
# → Outputs the Base32 secret to add to your authenticator app (Aegis, etc.)

# Verify it works
libre-otp
# → Prompts for 6-digit OTP code

# Integrate with PAM (SSH)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp' >> /etc/pam.d/sshd

# Integrate with login
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp' >> /etc/pam.d/login

# Select SHA algorithm (default SHA1, set env var)
OTP_ALGO=SHA256 libre-otp --setup
```

---

## 9. Included Payloads & Security Mechanisms

| Tool | Author | Description |
|------|--------|-------------|
| **Libre OTP** | tilas01 | Native Rust PAM module for TOTP 2FA (Boot/Login/SSH) |
| **Anti-RubberDucky** | tilas01 | Intelligent HID input manager — sandboxes & detects BadUSB |
| **Kloak** | [vmonaco](https://github.com/vmonaco/kloak) | Keystroke anonymization — prevents biometric profiling |
| **Evil Maid Decoys** | tilas01 | Generates decoy kernel entries to obfuscate real boot target |

---

## 10. Post-Install Cheatsheets

| Cheatsheet | Link |
|------------|------|
| **Arch Command Cheatsheet** (pacman, systemd, disk, security) | [docs/helpful-commands.md](docs/helpful-commands.md) |
| **OS Shortcut & Command Cheatsheet for Dusky 2026 OS Release** | [docs/dusky-cheatsheet.md](docs/dusky-cheatsheet.md) |
| **DWM Window Manager** | [docs/helpful-commands.md#-dwm-window-manager-cheatsheet](docs/helpful-commands.md) |
| **GNOME Shortcuts** | [docs/helpful-commands.md#-gnome-keyboard-shortcuts](docs/helpful-commands.md) |
| **KDE Plasma Shortcuts** | [docs/helpful-commands.md#-kde-plasma-shortcuts](docs/helpful-commands.md) |
| **Xorg vs Wayland** | [docs/xorg-vs-wayland.md](docs/xorg-vs-wayland.md) |

---

## 11. Credits & Acknowledgements

This project integrates tools and concepts from brilliant open-source developers. Please support their work!

| Credit | Link | Note |
|--------|------|------|
| **dusklinux** | [github.com/dusklinux/dusky](https://github.com/dusklinux/dusky) | Creator of Dusky OS — amazing Arch rice. [YouTube Demo](https://www.youtube.com/watch?v=JmgvSdEIK8c) |
| **vmonaco** | [github.com/vmonaco/kloak](https://github.com/vmonaco/kloak) | Creator of kloak keystroke anonymizer |
| **max-baz** | [github.com/maximbaz/dotfiles](https://github.com/maximbaz/dotfiles) | Core inspiration for modularity and security architecture |
| **tilas01** | [github.com/tilas01](https://github.com/tilas01) | Author of this repo, Libre-OTP, and Anti-RubberDucky tools |
| **Anti-RubberDucky Concepts** | Community | HID injection mitigation techniques from the open-source community |

*This repository is provided purely for educational and security research purposes. MIT License.*
