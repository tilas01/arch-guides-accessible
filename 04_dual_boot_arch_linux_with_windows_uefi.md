---
title: 04. Dual Boot Arch Linux with Windows (UEFI)
author: [tilas01](https://www.github.com/tilas01) (Gemini Code Assist)
date: 2026-04-07
---

# 04. Dual Boot Arch Linux with Windows 10/11 (UEFI)

This guide outlines the process for dual-booting Arch Linux alongside an existing Windows 10/11 installation on a UEFI system.

**Crucial Warning:** Always install Windows first. Windows installers are known to overwrite existing bootloaders and partitions without warning.

## 1. Windows Setup

Before installing Arch Linux, prepare your Windows system.

1.  **Disable Secure Boot and Fast Startup**: Access your UEFI firmware settings (BIOS) and disable both Secure Boot and Fast Startup. Fast Startup can cause issues with Linux accessing NTFS partitions.
2.  **Shrink Windows Volume**:
    *   Open "Disk Management" in Windows.
    *   Right-click on your `C:\` Drive and select "Shrink Volume."
    *   Shrink the volume by the amount of space you want to allocate for your Arch Linux installation. This will create unallocated space.

## 2. Arch Linux Installation (Partitioning for Dual Boot)

Proceed with the initial installation steps as described in 01. Initial Setup, 02. LUKS, or 03. LVM on LUKS.

The key difference will be in the partitioning step. Instead of creating a new EFI partition, you will **reuse the existing Windows EFI System Partition**.

### Partitioning with `cfdisk`

When you reach the partitioning step (`cfdisk /dev/sda`), you will see your existing Windows partitions, including the EFI System Partition (usually `/dev/sda1` or similar, typically 100-500MB).

**Example Partition Table (GPT) for a non-encrypted Arch dual boot:**

*   `(Existing Windows Partitions)`
*   `/dev/sda1`: `(Existing EFI System Partition)` - **DO NOT FORMAT THIS!**
*   `(Unallocated Space from Windows Shrink)`
*   `/dev/sdaX`: `4GB` - `Linux Swap` (Type: `Linux swap`) - Create this in the unallocated space.
*   `/dev/sdaY`: `Rest of free space` - `Linux Filesystem` (Type: `Linux filesystem`) - Create this in the remaining unallocated space.

**If using LUKS or LVM on LUKS:**

*   `(Existing Windows Partitions)`
*   `/dev/sda1`: `(Existing EFI System Partition)` - **DO NOT FORMAT THIS!**
*   `(Unallocated Space from Windows Shrink)`
*   `/dev/sdaX`: `Rest of free space` - `Linux Filesystem` (Type: `Linux filesystem`) - This will be your LUKS container.

### Mounting for Dual Boot

When mounting your partitions:

*   Mount your Arch Linux root partition to `/mnt`.
*   Mount your existing Windows EFI System Partition to `/mnt/efi`. **Crucially, do NOT format this partition.**

```bash
mount /dev/sdaY /mnt # Replace sdaY with your Linux root partition
mkdir /mnt/efi
mount /dev/sda1 /mnt/efi # Replace sda1 with your existing EFI partition
swapon /dev/sdaX # If using a swap partition
```

## 3. GRUB Configuration for Dual Boot

During the GRUB configuration step (covered in 09. Essential Post-Installation), you must enable `os-prober` to detect your Windows installation.

```bash
nano /etc/default/grub
```

Uncomment or add the following line:

```
GRUB_DISABLE_OS_PROBER=false
```

Then, regenerate your GRUB configuration:

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

This will allow GRUB to detect Windows and add it to the boot menu.

## Next Steps

Continue with 09. Essential Post-Installation Steps & Utilities for the remaining steps. Adjust partition names (e.g., `/dev/sdaX`) as needed.

#### Credits
*   **Author:** tilas01 (Gemini Code Assist)
*Please do not remove credits when sharing, modifying, or publishing this guide.*