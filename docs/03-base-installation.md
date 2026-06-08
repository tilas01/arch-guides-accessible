<img src="../img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Base Installation

## 1. Install Base Packages & Kernel Choice

When installing Arch Linux, you must choose your kernel strategy. You can install multiple kernels simultaneously (e.g., one primary, one backup).

*   **`linux`** (Standard): The default, stable kernel. Best for minimalists.
*   **`linux-zen`** (Performance): Tuned for desktop responsiveness and gaming. Excellent as a primary or reliable backup.
*   **`linux-hardened`** (Security): Applies strict security patches. Recommended as primary for "Fortress" setups.

**Example (Installing Hardened as primary, Zen as backup):**
```bash
pacstrap -K /mnt base linux-hardened linux-zen linux-firmware neovim lvm2
```
*(Include `btrfs-progs` if using BTRFS, or `lvm2` if using LVM).*

## 2. Generate fstab
```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

## 3. Chroot into System
```bash
arch-chroot /mnt
```

## 4. Time, Locale, Hostname
```bash
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime
hwclock --systohc
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf
echo "archlinux" > /etc/hostname
```

## 5. Initramfs
Edit `/etc/mkinitcpio.conf`:
- **Unencrypted**: standard hooks.
- **LUKS2**: `HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)`
- **LVM on LUKS**: `HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt lvm2 filesystems fsck)`

```bash
mkinitcpio -P
```

## 6. Root Password
```bash
passwd
```

Proceed to **[Step 4: Bootloader](../README.md#step-4--bootloader)**.
