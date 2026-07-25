<!-- Author: tilas01 | Main Developer & Maintainer -->
# Arch Linux Dynamic Guides & Tools

<p align="center">
  <img src="img/banner.png" width="100%" alt="Arch Guides Banner">
</p>

<h1 align="center">Arch Guides: Accessible & Modular</h1>

<p align="center">
  <strong>The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.</strong>
</p>

<p align="center">
  Created and maintained by <a href="https://github.com/tilas01"><strong>tilas01</strong></a>
</p>

---

## ⚖️ Legal Disclaimer & Liability Waiver
> **AI-GENERATED CONTENT & NO WARRANTY:** 
> This website, its entire repository, and the dynamically generated scripts/configurations were built with the assistance of Artificial Intelligence. 
> 
> By using this repository or the hosted website, you explicitly agree that all scripts and instructions are provided **"AS IS", WITHOUT WARRANTY OF ANY KIND**, express or implied. The authors hold absolutely **NO liability** for any data loss, system damage, hardware failure, or security breaches resulting from the use of these tools. 
> 
> **You are solely responsible for your own machine.** You must ALWAYS manually review code and commands before executing them. We strongly recommend testing in a VM and cross-referencing with the official Arch Wiki.
> 
> **Licensing & Commercial Use:** This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license. You are free to use, modify, and distribute this software for any non-commercial project. You are strictly forbidden from selling it, re-releasing it for profit, or using it to make money. You must provide clear attribution to `tilas01` and share any modifications under the same license.

---

## 🚦 Three ways to use this — pick one

There is no wrong answer here. All three end at the same system; they differ in
how much you want automated versus how much you want to understand.

| | Route | Best for | Start here |
|---|---|---|---|
| **1** | **Dynamic generator** — answer questions, get a script | You want it working, with sane security defaults | **[Open the generator →](https://tilas01.github.io/arch-guides-dynamic/)** |
| **2** | **Choose-your-own-path wiki** — same options, explained, done by hand | You want to learn what each step does | **[Open the wiki →](https://tilas01.github.io/arch-guides-dynamic/wiki.html#choose-your-path)** |
| **3** | **Manual guides in this repo** — plain markdown, no website | You are offline, or prefer reading on GitHub | [Start at 01-pre-installation](docs/01-pre-installation.md) |

Every option in route 1 has a matching explanation in route 2: right-click any
dropdown in the generator and it opens that option's wiki entry. Routes 2 and 3
cover the same ground — the wiki is the navigable version, `docs/` is the flat
version that reads well on GitHub.

> The generator is entirely optional. It writes a shell script; it does not do
> anything you could not do by hand from the Arch Wiki. If you would rather
> learn the process, route 2 or 3 is the better use of your time.

---

## 🌐 Hosted resources

*   **[Interactive install generator](https://tilas01.github.io/arch-guides-dynamic/)** — builds an install script and a markdown guide from your hardware and security choices.
*   **[Wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html)** — every generator option explained, plus the choose-your-own-path setup guide.
*   **[Security tools](https://tilas01.github.io/arch-guides-dynamic/security-tools.html)** — all the tools in one place, with live release stats.
*   **[Live editor](https://tilas01.github.io/arch-guides-dynamic/live.html)** — edit a generated script and guide side by side before downloading.

### Reference

*   **[Arch command cheatsheet](docs/helpful-commands.md)** — pacman, systemd, LUKS, BTRFS/Snapper, networking, recovery.
*   **[DuskyOS / Hyprland keybinds](docs/dusky-cheatsheet.md)** — every shortcut, if you chose Dusky in the generator.
*   **[Xorg vs Wayland](docs/xorg-vs-wayland.md)** — what actually differs and which you need.
*   **[Maintenance](docs/maintenance.md)** — keeping a rolling-release install healthy.
*   **[Architecture](docs/architecture.md)** — how the generator, the guides and the tools fit together.

### Hardware security (not automatable — read before buying anything)

The generator runs *after* your firmware. If someone can modify the firmware,
none of it helps. **[Hardware & Firmware Security in the wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html#hardware-security)**
covers locking down the firmware you already have (free, and do this first),
BusKill as the recommended physical measure, and what measured boot with
coreboot + Heads actually buys you versus libreboot's stricter no-blobs policy.

---

## 📑 Table of Contents
1. [Arch Dynamic Installation Setup Guide](#arch-dynamic-installation-setup-guide)
2. [Quick Setup: Automated Batch Installer](#quick-setup-automated-batch-installer)
3. [Manual Dynamic Setup Guide](#manual-dynamic-setup-guide)
4. [Included Payloads & Security Projects](#included-payloads--security-projects)
5. [Credits & Acknowledgements](#credits--acknowledgements)

---

## 🛠️ Arch Dynamic Installation Setup Guide

This guide allows you to generate a custom-tailored Arch Linux installation script and markdown tutorial based on your specific hardware, security needs, and software philosophy.

**To get started:**
1. Visit the [Dynamic Generator Website](https://tilas01.github.io/arch-guides-dynamic/).
2. Select your CPU, GPU, Firmware, and VM configurations.
3. Choose your display server (Xorg Minimal vs Wayland) and Desktop Environment (Dusky OS, GNOME, etc.).
4. Choose your filesystem (BTRFS for snapshots, XFS for performance).
5. Select your security parameters (Full Disk Encryption, Libre OTP, Anti-RubberDucky).
6. Generate the script!

---

## ⚡ Quick Setup: Automated Batch Installer
If you generated the automated bash script, you can deploy it directly over SSH to the live Arch ISO!
1. Boot into the Arch ISO.
2. In the generator, set **Arch ISO Pre-Install Setup** to `Start SSHd`.
3. Type the generated command on the ISO to start the SSH daemon and set a root password.
4. Copy the generated `cat << 'EOF' > install.sh ...` deploy command.
5. Paste it into your terminal on your other machine connected via SSH.
6. Run `bash install.sh` and watch it install!

---

## 📖 Manual Dynamic Setup Guide
If you prefer to install manually, every selection in the generator has a corresponding guide!
*   [01. Pre-Installation](docs/01-pre-installation.md)
*   [02. Partitioning](docs/02-partitioning/)
*   [03. Base Installation](docs/03-base-installation.md)
*   [04. Bootloaders](docs/04-bootloaders/)
*   [05. Secure Boot](docs/05-secure-boot/)
*   [10. Generator Selections & Dusky OS Explanation](docs/10-generator-selections-and-dusky.md)
*   [Display Server Guide: Xorg vs Wayland](docs/xorg-vs-wayland.md)

---

## 🛡️ Included Payloads & Security Projects

<p align="center">
  <img src="img/banner.png" width="80%" alt="Security Projects Banner">
</p>

The security tools in this repository are standalone modules. They are open-source Rust tools built to enhance Linux security and integrate deeply with Arch Linux.

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

Full detail: [Installing the Suite in One Step](https://tilas01.github.io/arch-guides-dynamic/wiki.html#suite-installer)

<div align="center">

### 🔐 Libre OTP
Native Rust TOTP/OTP 2FA providing Two-Factor Authentication during Boot, Login, or SSH. Customizable SHA algorithms.
<br><br>

### 🛡️ Input Guard (Anti-RubberDucky)
A native Rust daemon that monitors input speeds, sandboxes unknown USB HID devices, and blocks automated keystroke injection attacks.
<br><br>

### 🕵️ Anti-Evil Maid
Generates generic kernel decoy entries to obfuscate your real encrypted boot target and checks boot integrity.
<br><br>

### 👁️ Kernel Watcher (Semi-EDR)
Real-time async file monitoring. Detects infostealers accessing browser/SSH data, and userland rootkits.
<br><br>



## 🔒 Integrity Verification (GPG & Hashes)

All pre-compiled standalone security tools in this repository are cryptographically signed using GPG and hashed to ensure build integrity.

The public GPG key (`tilas01.asc`) is committed to the root of this repository. The private key is strictly isolated and never exposed.

**To verify the integrity of any downloaded binary:**

1. Import the public key:
   ```bash
   gpg --import tilas01.asc
   ```
2. Verify the GPG signature against the binary:
   ```bash
   gpg --verify binary_name.sig binary_name
   ```
3. Verify the SHA-512 hash:
   ```bash
   sha512sum -c binary_name.sha512
   ```

If the signature says `Good signature from "tilas01"`, and the SHA512 hash matches `OK`, the binary is 100% authentic and untampered.
