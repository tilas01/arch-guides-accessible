<!-- Author: tilas01 | Main Developer & Maintainer -->

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
> **Licensing & Commercial Use:** This project is licensed under the **GNU AGPLv3**. This mathematically prevents theft and closing of the source code. You are strictly forbidden from copying the full application, changing the title, and re-releasing it or selling it as a proprietary product without fully open-sourcing all modifications under the AGPLv3 and providing attribution to `tilas01`.

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

### 🥷 Kloak
Anonymizes keystroke timing to prevent biometric profiling (by vmonaco).
<br><br>

### 🕵️ Anti-Evil Maid
Generates generic kernel decoy entries to obfuscate your real encrypted boot target and checks boot integrity.
<br><br>

### 👁️ Kernel Watcher (Semi-EDR)
Real-time async file monitoring. Detects infostealers accessing browser/SSH data, and userland rootkits.
<br><br>

### 👻 ScareCrow
Spoofs a fake Virtual Machine and analysis sandbox to trick advanced malware into self-terminating.
<br><br>

</div>

---

## ⭐ Credits & Acknowledgements

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
  Creator of Arch Guides, the Security Tools, and all project code.<br>
  All AI-generated content has been manually curated, reviewed, and authored by tilas01.
</p>

This project integrates tools, configurations, and concepts from brilliant developers across the open-source community. If you use these tools, please check out their official pages!

*   **[Max-Baz Arch Install Guide](https://github.com/maximbaz/dotfiles)** - Core inspiration for the modularity and security concepts of this project.
*   **[Dusky OS / dusklinux](https://github.com/dusklinux/dusky)** - An incredible, fully riced, and blazing-fast Arch OS. Included as an auto-install option! Check out [Dusky's Demo Video on YouTube](https://www.youtube.com/watch?v=JmgvSdEIK8c).
*   **[Kloak](https://github.com/vmonaco/kloak)** - Keystroke anonymization tool created by vmonaco.
*   **Anti-RubberDucky Concepts** - Inspired by various open-source HID injection mitigation tools developed by the community. 
*   **Tilas01 Security Tools** - Libre-OTP, Anti-Ducky, Kernel Watcher, Anti-Evil-Maid, and ScareCrow custom Rust implementations authored by tilas01 for this repository.

*This repository is provided purely for educational and security research purposes.*

---

## License & Copyright

**Copyright (c) 2026 tilas01**

This project is licensed under the **[GNU Affero General Public License v3.0 (AGPLv3)](LICENSE)**.
By using, modifying, or distributing this software, you agree to the strict terms of the AGPLv3, which mandates that any derivative works or network services built upon this codebase must also release their full source code under the AGPLv3 and provide explicit attribution.
