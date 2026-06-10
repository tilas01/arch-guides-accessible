

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Bootloader: GRUB

Classic, highly customizable.

```bash
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
```

Edit `/etc/default/grub` if you have LUKS or LVM to add `cryptdevice=UUID=<UUID>:cryptroot`.

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

Proceed to **[Step 5: Secure Boot](../README.md#step-5--secure-boot-optional)** or **[Step 6: Dual Boot](../README.md#step-6--dual-booting-optional)**.
