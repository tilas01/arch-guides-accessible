---
title: 09. Essential Post-Installation Steps & Utilities
author: tilas01
date: 2026-04-07
---

# 09. Essential Post-Installation Steps & Utilities

This guide covers the crucial steps after partitioning and mounting your system, leading to a bootable Arch Linux installation. It includes generating `fstab`, chrooting, system configuration, user management, and GRUB installation.

## Assumptions

*   You have completed the partitioning, formatting, and mounting steps from either:
    *   01. Initial Setup & Basic Installation (UEFI)
    *   02. Arch Linux with LUKS Encryption
    *   03. Arch Linux with LVM on LUKS
*   Your root filesystem is mounted at `/mnt`.
*   Your EFI System Partition is mounted at `/mnt/efi`.

## 1. Setup Your Mirrors

Before installing the base system, update your mirror list to ensure fast and reliable downloads.

```bash
pacman -Sy reflector

# This command finds HTTPS mirrors for your country, sorts them by speed, and saves the list.
# Replace {your_country} with your country's name (e.g., "United States", "Germany").
reflector --verbose -c {your_country} -p https --sort rate --save /etc/pacman.d/mirrorlist
```

## 2. Install Arch Linux Base System and Essential Packages

Install the `base` system and other critical packages.

**Kernel Selection:**
*   `linux`: The default Arch Linux kernel.
*   `linux-zen`: A kernel optimized for desktop responsiveness.
*   `linux-lts`: A long-term support kernel for stability.
*   `linux-hardened`: A security-focused kernel.

Replace `linux` and `linux-headers` with your preferred kernel (e.g., `linux-zen linux-zen-headers`). Refer to the Arch Wiki Kernel page for more options.

**Microcode:**
*   `intel-ucode`: For Intel processors.
*   `amd-ucode`: For AMD processors.
*   If installing in a VM, you typically don't need either.

**LVM2 (if applicable):**
*   If you followed 03. Arch Linux with LVM on LUKS, ensure `lvm2` is included in the `pacstrap` command.

```bash
# Example for Intel CPU, default kernel, and no LVM
pacstrap /mnt base linux linux-firmware base-devel linux-headers nano git networkmanager openssh intel-ucode

# Example for AMD CPU, zen kernel, and LVM
# pacstrap /mnt base linux-zen linux-zen-firmware base-devel linux-zen-headers nano git networkmanager openssh amd-ucode lvm2
```

## 3. Generate `fstab`

Generate the `fstab` file, which defines how disk partitions are mounted.

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```
Review the generated `fstab` for correctness: `cat /mnt/etc/fstab`.

## 4. Chroot into the System

Change root into your newly installed Arch Linux environment.

```bash
arch-chroot /mnt
```

## 5. Set the Time Zone

First, list available time zones to find yours.

```bash
ls /usr/share/zoneinfo
```

Then, create a symbolic link for your time zone and synchronize the hardware clock.

```bash
ln -sf /usr/share/zoneinfo/{your_region}/{your_city} /etc/localtime
hwclock --systohc
```

## 6. Set Locale

Configure your system's language and locale settings.

```bash
nano /etc/locale.gen
```
Uncomment `en_US.UTF-8 UTF-8` (or your preferred locale). Save and exit.

```bash
locale-gen
echo "LANG=en_US.UTF-8" >> /etc/locale.conf
```

## 7. Set Hostname

Define your system's hostname.

```bash
echo "yourhostname" >> /etc/hostname
```

## 8. Add Hostname to `/etc/hosts`

Map your hostname to loopback addresses.

```bash
nano /etc/hosts
```
Add the following lines, replacing `{yourhostname}`:

```
127.0.0.1        localhost
::1              localhost
127.0.1.1        {yourhostname}
```

## 9. Enable SSH (Optional)

If you plan to access your machine via SSH, enable the service.

```bash
systemctl enable sshd
```

## 10. Enable NetworkManager

Ensure NetworkManager starts automatically on boot.

```bash
systemctl enable NetworkManager
```

## 11. Install Some Nice-to-Have Packages (Optional)

Install common utilities for system monitoring, text editing, and network diagnostics.

```bash
pacman -Sy vim neovim htop neofetch net-tools
```

## 12. Setup `sudo`

Configure `sudo` to allow users in the `wheel` group to execute commands with root privileges.

```bash
nano /etc/sudoers
```
Uncomment the line:

```
%wheel ALL=(ALL) ALL
```

## 13. Setup Users and Passwords

Create a regular user and set passwords for both the root user and your new user.

```bash
useradd -m -G wheel {your_username} # Create user and add to wheel group
passwd {your_username} # Set password for your new user
passwd # Set password for the root user
```

## 14. Configure GRUB Bootloader

Install and configure GRUB to make your system bootable.

### Install GRUB Packages

```bash
pacman -S grub efibootmgr os-prober
```

### Special GRUB Configuration for LUKS/LVM on LUKS

If you are using LUKS encryption (from 02. Arch Linux with LUKS Encryption or 03. Arch Linux with LVM on LUKS), you need to modify `/etc/default/grub`.

1.  **Get UUID**: Find the UUID of your LUKS partition (`/dev/sda2` in those guides).
    ```bash
    blkid
    ```
    Save the UUID for your encrypted partition.
 
2.  **Edit GRUB defaults**:
    ```bash
    nano /etc/default/grub
    ```
    *   Modify `GRUB_CMDLINE_LINUX` to include `cryptdevice` and `root` parameters:
        *   **For LUKS only**:
            ```
            GRUB_CMDLINE_LINUX="cryptdevice=UUID={uuid_you_saved}:cryptroot root=/dev/mapper/cryptroot"
            ```
        *   **For LVM on LUKS**:
            ```
            GRUB_CMDLINE_LINUX="cryptdevice=UUID={uuid_you_saved}:cryptlvm root=/dev/vg0/root"
            ```
    *   Uncomment `GRUB_ENABLE_CRYPTODISK=y`.

### GRUB Configuration for Dual Boot with Windows

If you are dual-booting with Windows (from 04. Dual Boot Arch Linux with Windows (UEFI)), ensure `os-prober` is enabled in `/etc/default/grub`:

```
GRUB_DISABLE_OS_PROBER=false
```

### Optional GRUB Timeout Configuration

If you don't want to see the GRUB menu, or only briefly:

```bash
nano /etc/default/grub
```
Change `GRUB_TIMEOUT=5` to `GRUB_TIMEOUT=0` or `GRUB_TIMEOUT=1`.
You might also change `GRUB_TIMEOUT_STYLE=menu` to `GRUB_TIMEOUT_STYLE=hidden`.

### Install GRUB to EFI

```bash
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB --recheck
ls -l /boot/grub # Confirm GRUB files are present
```

### Make GRUB Configuration File

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

## 15. Avoid Entering Passphrase Twice (Optional, for LUKS/LVM on LUKS)

This step allows you to use a keyfile to unlock your LUKS volume, potentially avoiding a second passphrase prompt if your `initramfs` is configured to use it.

```bash
# Create a keyfile
dd bs=512 count=4 if=/dev/random of=/root/luks.keyfile iflag=fullblock # For LUKS only
# dd bs=512 count=4 if=/dev/random of=/root/cryptlvm.keyfile iflag=fullblock # For LVM on LUKS

# Set permissions
chmod 000 /root/luks.keyfile # Or cryptlvm.keyfile

# Add keyfile to LUKS volume
cryptsetup -v luksAddKey /dev/sda2 /root/luks.keyfile # Replace sda2 with your LUKS partition

# Edit mkinitcpio.conf to include the keyfile
nano /etc/mkinitcpio.conf
```
Edit the `FILES=()` line to include your keyfile:

```
FILES=(/root/luks.keyfile) # Or /root/cryptlvm.keyfile
```

```bash
# Set permissions for initramfs
chmod 600 /boot/initramfs-linux*

# Edit GRUB defaults to use the keyfile
nano /etc/default/grub
```
Add `cryptkey=rootfs:/root/luks.keyfile` (or `cryptkey=rootfs:/root/cryptlvm.keyfile`) to the end of your `GRUB_CMDLINE_LINUX` line.

```bash
# Regenerate initramfs and GRUB config
mkinitcpio -P
grub-mkconfig -o /boot/grub/grub.cfg
```

## 16. Exit Chroot and Reboot

You have completed the core installation.

```bash
exit
umount -R /mnt
reboot
```

Your system should now boot into Arch Linux.

## Next Steps

After rebooting into your new Arch Linux system, you can proceed with:

*   10. Installing Graphics Drivers
*   07. Install and Setup DWM (Suckless Window Manager)
*   08. Install GNOME Desktop Environment
*   11. Optional Tools & Customizations
*   12. General Notes & Troubleshooting Tips

#### Credits
*   **Author:** tilas01
*Please do not remove credits*