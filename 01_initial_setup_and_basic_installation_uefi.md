---
title: 01. Initial Setup & Basic Installation (UEFI)
author: [tilas01](https://www.github.com/tilas01) and Gemini Code Assist
date: 2026-04-07
---

# 01. Initial Setup & Basic Installation (UEFI) 🚀

This guide outlines the core steps for installing Arch Linux on a UEFI system. It serves as the foundation for all subsequent guides in the **Accessible** collection.

## Assumptions
*   You are installing on a UEFI-enabled system.
*   Target disk is identified (e.g., `/dev/sda` or `/dev/nvme0n1`).
*   Secure Boot is disabled in your UEFI firmware settings.

## 1. Create Installation Medium 💾

Download the ISO from the Arch Linux site.

**Linux/macOS:**
Identify your USB drive with `lsblk` and use `dd`:
```bash
sudo dd bs=4M if=path/to/arch-linux.iso of=/dev/sdX conv=fsync oflag=direct status=progress
```
*(Replace `/dev/sdX` with your actual USB device, e.g., `/dev/sdb`.)*

**Windows:**
Use Rufus (Select 'DD mode') or BalenaEtcher.

## 2. Verify Boot Mode 🔍

Boot from the USB and check the EFI directory:
```bash
ls /sys/firmware/efi/efivars
```
If this command shows output, you are in UEFI mode. If it returns an error, you might be in BIOS/CSM mode, or Secure Boot might be interfering.

## 3. Connect to the Internet

Connecting to the internet is crucial for downloading packages.

### Wired Connection

If you have a wired connection, it should typically work automatically. You can verify with:

```bash
ip link
ping archlinux.org
```

### Wi-Fi Connection (Optional)

If you need Wi-Fi, use the `iwctl` utility:

```bash
iwctl
# Inside the iwctl prompt:
device list
station wlan0 scan
station wlan0 get-networks
station wlan0 connect SSID
exit
```

After connecting, verify your connection:

```bash
ip link
ping archlinux.org
```

## 4. Update the System Clock

Ensure your system clock is accurate.

```bash
timedatectl set-ntp true
```

## 5. Discover Your Disk

Identify your target disk.

```bash
fdisk -l
```
Look for your disk, typically `/dev/sda` or `/dev/nvme0n1`.

## 6. Partition the Disk

We will create a GPT partition table with an EFI System Partition, a Linux Swap partition, and a Linux Filesystem partition.

```bash
cfdisk /dev/sda
```

**Partition Table Layout (GPT):**

*   `/dev/sda1`: `256M` - `EFI System` (Type: `EFI System`)
*   `/dev/sda2`: `4GB` - `Linux Swap` (Type: `Linux swap`)
*   `/dev/sda3`: `Rest of storage` - `Linux Filesystem` (Type: `Linux filesystem`)

After partitioning, confirm with:

```bash
fdisk -l
```

## 7. Format the Partitions

Format the EFI, Swap, and Root partitions.

```bash
mkfs.fat -F32 /dev/sda1
mkfs.ext4 /dev/sda3
mkswap /dev/sda2
```

## 8. Mount the System

Mount the root filesystem, create directories for EFI, and mount the EFI partition. Activate swap.

```bash
mount /dev/sda3 /mnt
mkdir /mnt/efi
mount /dev/sda1 /mnt/efi
swapon /dev/sda2
```

## Next Steps

Proceed to 09. Essential Post-Installation Steps & Utilities to continue with the base system installation.
If you plan to use disk encryption, refer to 02. Arch Linux with LUKS Encryption instead of proceeding directly to post-installation steps.