# 🛡️ Arch Guides Dynamic

A modular, highly secure, dynamically generated Arch Linux installation system. 

[![Pages Deploy](https://github.com/tilas01/arch-guides-dynamic/actions/workflows/pages.yml/badge.svg)](https://github.com/tilas01/arch-guides-dynamic/actions/workflows/pages.yml)
[![Release Security Tools](https://github.com/tilas01/arch-guides-dynamic/actions/workflows/release-security-tools.yml/badge.svg)](https://github.com/tilas01/arch-guides-dynamic/actions/workflows/release-security-tools.yml)

## 📖 Complete Documentation & Parity

We guarantee 100% parity between the Web Generator and our manual markdown guides. If you prefer not to use the automated `.sh` generator, you can install everything manually by following the instructions here:

* **[General Arch Linux Manual Installation Guide](https://tilas01.github.io/arch-guides-dynamic/docs/general-guide.md)** - Step-by-step generic installation covering base setup, Ext4/Btrfs, and bootloaders.
* **[Permutation Guides (LUKS, X11, Wayland)](https://tilas01.github.io/arch-guides-dynamic/wiki.html)** - Advanced compatibility matrices and manual configuration steps.
* **[tilas01's Security Suite Documentation](https://tilas01.github.io/arch-guides-dynamic/docs/tilas-security-tools.md)** - Full manual compilation and deployment guides for Anti-Ducky, Libre-OTP, Anti-Evil-Maid, Kernel-Watcher, and Scarecrow.

## ⚙️ Generator Usage
The interactive generator handles complex permutations automatically, ensuring your exact bootloader (e.g. `systemd-boot`), filesystem (`btrfs`), and encryption (`LUKS2 Argon2id`) selections compile into a completely stable, fully automated `script.sh`.

Simply visit the [Live Generator](https://tilas01.github.io/arch-guides-dynamic/) to begin.

## 🦀 Security Tools Architecture
All proprietary security tools (`security-tools/`) are written natively in memory-safe Rust. They are compiled and released automatically via GitHub Actions, providing verifiable binary integrity.
