<p align="center">
  <img src="img/banner.png" alt="Arch Guides Banner">
</p>

<h1 align="center">Arch Guides: Accessible & Modular</h1>

<p align="center">
  <strong>The ultimate, dynamically customizable guide to installing Arch Linux.</strong><br>
  Whether you want a simple unencrypted system with GRUB, or a Post-Quantum LUKS2 encrypted setup using Unified Kernel Images and Secure Boot with custom keys, this repository maps out every path.
</p>

---

## ⚖️ Legal Disclaimer & AI Notice

> **⚠️ AI-Generated Content & Security Warning:** 
> Please be advised that approximately 95% of the content in this repository has been generated, refactored, and formatted by **Gemini AI**, with the remainder manually curated by [tilas01](https://www.github.com/tilas01). This content draws heavily from modular best practices and scripts provided by contributors like [max-baz](https://github.com/max-baz/arch-secure-boot). While designed for clarity and modularity, AI-generated technical instructions can contain inaccuracies or deprecated commands. **You are solely responsible for reviewing every command and script for safety and accuracy before execution.** We strongly recommend testing these procedures in a Virtual Machine (VM) first and cross-referencing with the [Arch Wiki](https://wiki.archlinux.org/title/Main_page). By using this guide, you accept all risks; the authors provide this "AS IS" without warranty.

---

## 🗺️ Choose Your Path: Dynamic Setup

Building your Arch Linux system is a series of choices. Follow the modular steps below to build your perfect, tailor-made setup.

### Step 1: 🚀 Pre-Installation
Start here to prepare your installation medium, connect to the internet, and update the system clock.
*   👉 **[Start Pre-Installation Guide](docs/01-pre-installation.md)**

### Step 2: 💽 Partitioning & Encryption
Choose your storage foundation.
*   👉 **[Unencrypted Partitioning](docs/02-partitioning/unencrypted.md)** - Fast, simple, standard.
*   👉 **[LUKS2 Quantum-Resistant Encryption](docs/02-partitioning/luks2.md)** - High security (AES-256-XTS & Argon2id). *(Recommended)*
*   👉 **[LVM on LUKS2](docs/02-partitioning/lvm-on-luks2.md)** - High security with flexible logical volumes.

### Step 3: 🛠️ Base Installation
Install the base system, kernel, and configure the essentials (locale, hostname, users).
*   👉 **[Base Installation Guide](docs/03-base-installation.md)**

### Step 4: 👢 Bootloader
How will your system boot?
*   👉 **[systemd-boot](docs/04-bootloaders/systemd-boot.md)** - Minimal, modern, built-in UEFI manager. *(Recommended for standard setups)*
*   👉 **[GRUB](docs/04-bootloaders/grub.md)** - The classic, highly configurable bootloader.
*   👉 **[No GRUB / UKI (Direct UEFI)](docs/04-bootloaders/uki-no-grub.md)** - Highest security, minimal attack surface. Pairs with Secure Boot.

### Step 5: 🛡️ Secure Boot (Optional)
Lock down your boot chain to prevent rootkits and evil maid attacks.
*   👉 **[Custom Keys with UKI (Highest Security)](docs/05-secure-boot/custom-keys-uki.md)** - Roll your own keys and sign your kernel.
*   👉 **[Shim with GRUB](docs/05-secure-boot/shim-grub.md)** - Standard secure boot compatibility.

### Step 6: 💻 Dual Booting (Optional)
If you are sharing the drive with Windows.
*   👉 **[Dual Booting via systemd-boot](docs/06-dual-boot/systemd-boot-windows.md)** - No os-prober needed.
*   👉 **[Dual Booting via GRUB & os-prober](docs/06-dual-boot/grub-os-prober.md)** - The traditional method.

### Step 7: 🖥️ Post-Installation & Desktop
Finish your setup with Wi-Fi, DNS, and Graphical Environments.
*   👉 **[Post-Installation (Networking & Desktop Environments)](docs/07-post-installation.md)**

---

## 📜 Included Scripts

The `scripts/` directory contains tools to automate high-security setups:
*   `arch-secure-boot.sh`: Generates UKIs and manages Secure Boot keys.
*   `evil-maid-detector.sh`: Hashes the `/efi` partition to detect offline tampering.
*   Pacman Hooks to automatically resign kernels on update.

---
**Credits:** [tilas01](https://github.com/tilas01), [max-baz](https://github.com/max-baz/arch-secure-boot), and Gemini AI.
