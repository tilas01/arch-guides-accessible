

# *nix Install Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Secure Boot: Shim with GRUB

A standard approach compatible with Microsoft's Secure Boot keys.

1. Install `shim-signed` (from AUR) and `grub`.
2. Copy the signed shim to your EFI partition:
```bash
cp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/
cp /usr/share/shim-signed/mmx64.efi /efi/EFI/arch/
```
3. Install GRUB to generate `grubx64.efi`:
```bash
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=arch --modules="tpm" --disable-shim-lock
```
4. Create boot entry for shim:
```bash
efibootmgr --create --disk /dev/sda --part 1 --label "Arch Secure Boot" --loader /EFI/arch/shimx64.efi
```

Proceed to **[Step 6: Dual Boot](../README.md#step-6--dual-booting-optional)**.
