# This project is currently unmaintaned and not functional, please refer to my arch-guides-all repo instead for informarion related to installing arch or better yet visit the official arch wiki and use that. I plan to begin fixing and then completing the github pages dynamic guide generator site etc and upgrade in functionality and code my own security tools and also potentially widen the scope of choice like down to ur specific wm xorg, wayland, a setup with neither but still like zsh and nice colour pallette monospace or whatever font in the correct size and highlighting... and more!

# TLDR: WORK IN PROGRESS - DO NOT USE THIS REPO ESPECIALLT NOT THE WEBSITE IT CONTAINS - IF YOU IGNORE THIS NOTICE AND THE ONE ABOVE YOU ARE DOING SO AT YOUR OWN RISK AND YOU ALONE ARE LIABLE FOR ANY OUTCOME OF A FAILED INSTALL AND OR OS DAMAGE OR APPLICATION MISCONFIGURATION

# to fight against constant aur attacks i plan to write a tool that uses a malware scanning api key for any big company llm such as chstgpt anthropic or google etc and it will review the logic chain of ever makepkg as well as its thoughts allow you to review it also runs in online sandbox and uses rhose results also requires api basically it will remember authors and simply note to the user like hey everytime ive seen this author their makepkg is safe but essentially ur job is to either kill a makepkg live and revert any changes ur watching for it to make before any aur install entire add proccess of app to machine is recorded and fherefore files can be removed specificsllt where needed and also prescsns of it warnings or glocks on critical ones and also connect to a public repo of known malicious current aur projects thst mst not be taken down yet if so

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
