<!-- Author: tilas01 | Main Developer & Maintainer -->
**🚨 NOTE: DO NOT USE THIS BRANCH. IT IS SOLELY FOR DEVELOPMENT AND TESTING. USE THE `MAIN` BRANCH FOR STABLE RELEASES. 🚨**

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

## 🌐 Public Hosted Resources
*   **[Interactive Dynamic Install Generator](https://tilas01.github.io/arch-guides-dynamic/)** - Dynamically generates an installation guide tailored exactly to your hardware and security needs.
*   **[Static Arch Guides Wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html)** - A comprehensive, modular documentation repository aggregating the best guides.
*   **[OS Shortcut & Command cheatsheet for dusky 2026 os release](docs/dusky-cheatsheet.md)** - A full cheatsheet to use the entire Dusky OS and its tools (if you selected it in the auto-installer).
*   **[Arch Command Cheatsheet](docs/helpful-commands.md)** - General Arch Linux command cheatsheet for maintenance and pacman.

> **Note:** The auto script generator is completely optional and is just a tool to make installation much easier. You can use the native tools manually and follow the Wiki directly to reduce downloads and learn the process yourself!

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

