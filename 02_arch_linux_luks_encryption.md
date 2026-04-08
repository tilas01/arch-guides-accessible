---
title: 02. Arch Linux with LUKS Encryption
author: [tilas01](https://www.github.com/tilas01) and Gemini Code Assist
date: 2026-04-07
---

# 02. Arch Linux with LUKS Encryption

This guide details how to set up Arch Linux with full disk encryption using LUKS. This guide assumes you have completed the initial setup steps (flashing USB, verifying boot mode, connecting to Wi-Fi, updating clock) as described in 01. Initial Setup & Basic Installation (UEFI) up to the "Discover Your Disk" step.

## Assumptions

*   You have identified your target disk (e.g., `/dev/sda`).
*   Secure Boot is disabled (refer to your UEFI firmware settings).
*   You are comfortable with the `cryptsetup` utility.

## 1. Partition the Disk for LUKS

We will create a GPT partition table with an EFI System Partition and a single Linux Filesystem partition that will be encrypted with LUKS.

```bash
cfdisk /dev/sda
```

**Partition Table Layout (GPT):**

*   `/dev/sda1`: `256M` - `EFI System` (Type: `EFI System`)
*   `/dev/sda2`: `Rest of storage` - `Linux Filesystem` (Type: `Linux filesystem`) - This will be your LUKS container.

After partitioning, confirm with:

```bash
fdisk -l
```

## 2. Setup LUKS Encryption

Encrypt the main Linux partition (`/dev/sda2`) with LUKS. **This will erase all data on `/dev/sda2`.**

```bash
cryptsetup luksFormat --type luks1 /dev/sda2
```
You will be prompted to enter a passphrase. Choose a strong, memorable one.

Open the encrypted volume:

```bash
cryptsetup open /dev/sda2 cryptroot
```
This creates a mapped device `/dev/mapper/cryptroot` which you can now format and use.

## 3. Format the Partitions

Format the EFI partition and the newly opened LUKS volume.

```bash
mkfs.fat -F32 /dev/sda1
mkfs.ext4 /dev/mapper/cryptroot
```

## 4. Mount the System

Mount the root filesystem (the LUKS volume), create directories for EFI, and mount the EFI partition.

```bash
mount /dev/mapper/cryptroot /mnt
mkdir /mnt/efi
mount /dev/sda1 /mnt/efi
```

## 5. Create a Swap File (Optional but Recommended)

Instead of a dedicated swap partition, we'll create a swap file within the encrypted root filesystem. This ensures your swap is also encrypted.

```bash
dd if=/dev/zero of=/mnt/swapfile bs=1M count=4000 status=progress # Creates a 4GB swap file
chmod 600 /mnt/swapfile
mkswap /mnt/swapfile
swapon /mnt/swapfile
```

## 6. Configure `mkinitcpio` for LUKS

This step is crucial for your system to be able to decrypt the root partition at boot.

```bash
nano /etc/mkinitcpio.conf
```

Modify the `HOOKS` array. You need to add `keyboard` (for passphrase input) after `udev` and `encrypt` after `block`. Remove `keyboard` if it appears later in the `HOOKS` array (e.g., after `filesystems`).

**Example `HOOKS` configuration:**

```
HOOKS=(base udev keyboard autodetect modconf block encrypt filesystems fsck)
```

## 7. Regenerate `initramfs`

After modifying `mkinitcpio.conf`, regenerate the `initramfs` image.

```bash
mkinitcpio -P
```

## Next Steps

Proceed to 09. Essential Post-Installation Steps & Utilities to continue with the base system installation. Ensure you follow the specific GRUB configuration for LUKS.

#### Credits
*   **Author:** tilas01 on GitHub (https://www.github.com/tilas01) (Gemini Code Assist)
*Please do not remove credits*