---
title: 03. Arch Linux with LVM on LUKS
author: tilas01 on GitHub (https://www.github.com/tilas01) (Gemini Code Assist)
date: 2026-04-07
---

# 03. Arch Linux with LVM on LUKS

This guide explains how to configure Logical Volume Management (LVM) on top of a LUKS-encrypted partition. This provides flexibility in managing your disk space. This guide assumes you have completed the initial setup steps (flashing USB, verifying boot mode, connecting to Wi-Fi, updating clock) as described in 01. Initial Setup & Basic Installation (UEFI) up to the "Discover Your Disk" step.

## Assumptions

*   You have identified your target disk (e.g., `/dev/sda`).
*   Secure Boot is disabled.
*   You are comfortable with `cryptsetup` and LVM utilities.

## 1. Partition the Disk for LVM on LUKS

We will create a GPT partition table with an EFI System Partition and a single Linux Filesystem partition that will house the LUKS container and LVM.

```bash
cfdisk /dev/sda
```

**Partition Table Layout (GPT):**

*   `/dev/sda1`: `256M` - `EFI System` (Type: `EFI System`)
*   `/dev/sda2`: `Rest of storage` - `Linux Filesystem` (Type: `Linux filesystem`) - This will be your LUKS container for LVM.

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
cryptsetup open /dev/sda2 cryptlvm
```
This creates a mapped device `/dev/mapper/cryptlvm` which will serve as the physical volume for LVM.

## 3. Create LVM Partitions

Now, create the LVM physical volume, volume group, and logical volumes for swap, root, and home.

```bash
pvcreate /dev/mapper/cryptlvm
vgcreate vg0 /dev/mapper/cryptlvm
lvcreate -L 4GB vg0 -n swap
lvcreate -L 32GB vg0 -n root
lvcreate -l 100%FREE vg0 -n home
```

## 4. Format the Partitions

Format the EFI partition and the newly created LVM logical volumes.

```bash
mkfs.fat -F32 /dev/sda1
mkfs.ext4 /dev/vg0/root
mkfs.ext4 /dev/vg0/home
mkswap /dev/vg0/swap
```

## 5. Mount the System

Mount the root filesystem, create directories for home and EFI, and mount them. Activate swap.

```bash
mount /dev/vg0/root /mnt
mkdir /mnt/home
mount /dev/vg0/home /mnt/home
mkdir /mnt/efi
mount /dev/sda1 /mnt/efi
swapon /dev/vg0/swap
```

## 6. Install LVM2 Package

Ensure the `lvm2` package is installed during `pacstrap` (it's included in the `pacstrap` command in the post-installation guide).

## 7. Configure `mkinitcpio` for LVM on LUKS

This step is crucial for your system to be able to decrypt the LUKS container and activate LVM volumes at boot.

```bash
nano /etc/mkinitcpio.conf
```

Modify the `HOOKS` array. You need to add `keyboard` (for passphrase input) after `udev`, and `encrypt` and `lvm2` after `block`. Remove `keyboard` if it appears later in the `HOOKS` array (e.g., after `filesystems`).

**Example `HOOKS` configuration:**

```
HOOKS=(base udev keyboard autodetect modconf block encrypt lvm2 filesystems fsck)
```

## 8. Regenerate `initramfs`

After modifying `mkinitcpio.conf`, regenerate the `initramfs` image.

```bash
mkinitcpio -P
```

## Next Steps

Proceed to 09. Essential Post-Installation Steps & Utilities to continue with the base system installation. Pay close attention to the GRUB configuration section for LVM on LUKS.

#### Credits
*   **Author:** tilas01 on GitHub (https://www.github.com/tilas01) (Gemini Code Assist)
*Please do not remove credits*