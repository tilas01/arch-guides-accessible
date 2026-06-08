#!/bin/bash
# Arch Guides: Automated Modular Installer
# This script automates the permutations available in the Arch Guides repository.

set -e

echo "================================================="
echo "   Arch Guides: Automated Modular Installer      "
echo "================================================="
echo "WARNING: This script will format the selected disk."
echo "Press Ctrl+C at any time to abort before partitioning."
echo ""

# --- Gather User Input ---

read -p "Enter the target disk (e.g., /dev/sda or /dev/nvme0n1): " DISK

echo ""
echo "Select Partitioning & Encryption Setup:"
echo "1) Unencrypted (Basic)"
echo "2) LUKS2 Quantum-Resistant Encryption (Recommended)"
echo "3) LVM on LUKS2 (Flexible)"
read -p "Choice [1-3]: " PART_CHOICE

echo ""
echo "Select Bootloader:"
echo "1) systemd-boot (Recommended for standard setups)"
echo "2) GRUB (Traditional)"
echo "3) UKI / No GRUB (Maximum Security)"
read -p "Choice [1-3]: " BOOT_CHOICE

if [ "$BOOT_CHOICE" == "3" ]; then
    echo ""
    echo "Secure Boot is highly recommended for UKI."
    read -p "Generate and enroll custom Secure Boot keys post-install? (y/n): " SB_CHOICE
elif [ "$BOOT_CHOICE" == "2" ]; then
    echo ""
    read -p "Use Microsoft Shim for Secure Boot compatibility? (y/n): " SHIM_CHOICE
fi

echo ""
read -p "Install Advanced Evil Maid Detector? (y/n): " EVIL_CHOICE

echo ""
read -p "Set Root Password: " ROOT_PASS

echo ""
echo "================================================="
echo "Configuration Summary:"
echo "Disk: $DISK"
echo "Partitioning: Option $PART_CHOICE"
echo "Bootloader: Option $BOOT_CHOICE"
echo "Evil Maid Detector: $EVIL_CHOICE"
echo "================================================="
read -p "Press ENTER to begin installation or Ctrl+C to abort..."

# --- 1. Partitioning & Formatting ---
echo "[+] Wiping disk and creating partitions..."
sgdisk -Z "$DISK"
sgdisk -n 1:0:+512M -t 1:ef00 "$DISK"
sgdisk -n 2:0:0 -t 2:8300 "$DISK"

PART_EFI="${DISK}1"
PART_ROOT="${DISK}2"
if [[ "$DISK" == *"nvme"* ]]; then
    PART_EFI="${DISK}p1"
    PART_ROOT="${DISK}p2"
fi

mkfs.fat -F32 "$PART_EFI"

if [ "$PART_CHOICE" == "1" ]; then
    echo "[+] Setting up Unencrypted Root..."
    mkfs.ext4 "$PART_ROOT"
    mount "$PART_ROOT" /mnt

elif [ "$PART_CHOICE" == "2" ]; then
    echo "[+] Setting up LUKS2 Encrypted Root..."
    echo -n "$ROOT_PASS" | cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 --pbkdf argon2id "$PART_ROOT" -
    echo -n "$ROOT_PASS" | cryptsetup open "$PART_ROOT" cryptroot -
    mkfs.ext4 /dev/mapper/cryptroot
    mount /dev/mapper/cryptroot /mnt

elif [ "$PART_CHOICE" == "3" ]; then
    echo "[+] Setting up LVM on LUKS2..."
    echo -n "$ROOT_PASS" | cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 "$PART_ROOT" -
    echo -n "$ROOT_PASS" | cryptsetup open "$PART_ROOT" cryptlvm -
    pvcreate /dev/mapper/cryptlvm
    vgcreate vg0 /dev/mapper/cryptlvm
    lvcreate -L 8G vg0 -n swap
    lvcreate -l 100%FREE vg0 -n root
    mkfs.ext4 /dev/vg0/root
    mkswap /dev/vg0/swap
    mount /dev/vg0/root /mnt
    swapon /dev/vg0/swap
fi

mkdir -p /mnt/efi
mount "$PART_EFI" /mnt/efi

# --- 2. Base Installation ---
echo "[+] Installing Base System..."
pacstrap -K /mnt base linux-hardened linux-firmware neovim sudo git rsync

echo "[+] Generating fstab..."
genfstab -U /mnt >> /mnt/etc/fstab

# --- 3. Chroot Configuration ---
echo "[+] Configuring System via Chroot..."
cat <<EOF > /mnt/setup-chroot.sh
#!/bin/bash
ln -sf /usr/share/zoneinfo/UTC /etc/localtime
hwclock --systohc
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf
echo "archlinux" > /etc/hostname
echo "root:$ROOT_PASS" | chpasswd

# Configure mkinitcpio
if [ "$PART_CHOICE" == "1" ]; then
    sed -i 's/^HOOKS=.*/HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block filesystems fsck)/' /etc/mkinitcpio.conf
elif [ "$PART_CHOICE" == "2" ]; then
    sed -i 's/^HOOKS=.*/HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)/' /etc/mkinitcpio.conf
elif [ "$PART_CHOICE" == "3" ]; then
    sed -i 's/^HOOKS=.*/HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt lvm2 filesystems fsck)/' /etc/mkinitcpio.conf
fi
mkinitcpio -P

# Bootloader setup
if [ "$BOOT_CHOICE" == "1" ]; then
    bootctl install --esp-path=/efi
    echo "default arch.conf" > /efi/loader/loader.conf
    echo -e "title Arch Linux\nlinux /vmlinuz-linux-hardened\ninitrd /initramfs-linux-hardened.img" > /efi/loader/entries/arch.conf
    if [ "$PART_CHOICE" == "2" ]; then
        UUID=\$(blkid -s UUID -o value $PART_ROOT)
        echo "options rd.luks.name=\$UUID=cryptroot root=/dev/mapper/cryptroot rw" >> /efi/loader/entries/arch.conf
    else
        echo "options root=PARTUUID=\$(blkid -s PARTUUID -o value $PART_ROOT) rw" >> /efi/loader/entries/arch.conf
    fi
elif [ "$BOOT_CHOICE" == "2" ]; then
    pacman -S --noconfirm grub efibootmgr
    if [ "$PART_CHOICE" != "1" ]; then
        sed -i 's/^GRUB_CMDLINE_LINUX=.*/GRUB_CMDLINE_LINUX="cryptdevice=UUID=\$(blkid -s UUID -o value $PART_ROOT):cryptroot root=\/dev\/mapper\/cryptroot"/' /etc/default/grub
        echo "GRUB_ENABLE_CRYPTODISK=y" >> /etc/default/grub
    fi
    grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
    grub-mkconfig -o /boot/grub/grub.cfg
elif [ "$BOOT_CHOICE" == "3" ]; then
    pacman -S --noconfirm sbsigntools efitools efibootmgr
    echo "UKI configured. Please execute arch-secure-boot.sh after reboot."
fi

EOF

chmod +x /mnt/setup-chroot.sh
arch-chroot /mnt /setup-chroot.sh
rm /mnt/setup-chroot.sh

# --- 4. Copy Scripts ---
echo "[+] Copying security scripts to the new system..."
mkdir -p /mnt/root/scripts
cp scripts/*.sh /mnt/root/scripts/ || true
chmod +x /mnt/root/scripts/*.sh

if [[ "$EVIL_CHOICE" =~ ^[Yy]$ ]]; then
    arch-chroot /mnt /root/scripts/evil-maid-detector.sh setup
fi

echo "[+] Installation complete. Unmount and reboot."
