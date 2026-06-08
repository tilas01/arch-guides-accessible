# Base Installation

## 1. Install Base Packages
```bash
pacstrap -K /mnt base linux linux-firmware neovim lvm2
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
