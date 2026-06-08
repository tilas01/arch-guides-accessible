# LVM on LUKS2

LVM inside an encrypted container provides maximum flexibility for resizing and snapshots.

```bash
cfdisk /dev/sda
# sda1: EFI System (512M)
# sda2: Linux Filesystem (Remainder)

cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 /dev/sda2
cryptsetup open /dev/sda2 cryptlvm

pvcreate /dev/mapper/cryptlvm
vgcreate vg0 /dev/mapper/cryptlvm

lvcreate -L 8G vg0 -n swap
lvcreate -l 100%FREE vg0 -n root

mkfs.ext4 /dev/vg0/root
mkswap /dev/vg0/swap

mount /dev/vg0/root /mnt
swapon /dev/vg0/swap

mkfs.fat -F32 /dev/sda1
mkdir -p /mnt/efi
mount /dev/sda1 /mnt/efi
```

Proceed to **[Step 3: Base Installation](../03-base-installation.md)**.
