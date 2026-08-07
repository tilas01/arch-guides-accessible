

# *nix Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Secure Boot: Custom Keys + UKI

Provides the highest level of security by signing your own Unified Kernel Image.

1. `pacman -S sbsigntools efitools efibootmgr`
2. Run `scripts/arch-secure-boot.sh generate-keys`
3. Run `scripts/arch-secure-boot.sh generate-efi`
4. Run `scripts/arch-secure-boot.sh add-efi`
5. Reboot to BIOS, delete factory keys (enter Setup Mode).
6. Boot back and run `scripts/arch-secure-boot.sh enroll-keys`.

Proceed to **[Step 6: Dual Boot](../README.md#step-6--dual-booting-optional)** or **[Step 7: Post-Installation](../README.md#step-7--post-installation--desktop)**.
