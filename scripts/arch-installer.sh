#!/bin/bash
# Arch Guides: Automated Extractive Modular Installer
# This script extracts bash blocks directly from the live GitHub repository markdown files
# to guarantee it matches the guide exactly.

set -e

REPO_URL="https://raw.githubusercontent.com/tilas01/arch-guides-accessible/main"

echo "================================================="
echo "   Arch Guides: Automated Extractive Installer   "
echo "================================================="
echo "WARNING: This script will format the selected disk."
echo "Press Ctrl+C at any time to abort before execution."
echo ""

# --- Gather User Input ---
read -p "Enter the target disk (e.g., /dev/sda or /dev/nvme0n1): " DISK

echo ""
echo "Select Partitioning & Encryption Setup:"
echo "1) Unencrypted (docs/02-partitioning/unencrypted.md)"
echo "2) LUKS2 (docs/02-partitioning/luks2.md)"
echo "3) LVM on LUKS2 (docs/02-partitioning/lvm-on-luks2.md)"
read -p "Choice [1-3]: " PART_CHOICE

echo ""
echo "Select Bootloader:"
echo "1) systemd-boot (docs/04-bootloaders/systemd-boot.md)"
echo "2) GRUB (docs/04-bootloaders/grub.md)"
echo "3) UKI / No GRUB (docs/04-bootloaders/uki-no-grub.md)"
read -p "Choice [1-3]: " BOOT_CHOICE

echo ""
read -p "Install Advanced Evil Maid Detector? (y/n): " EVIL_CHOICE

echo ""
echo "================================================="
echo "Ready to begin installation on $DISK."
read -p "Press ENTER to begin extracting and running blocks..."

# Determine partitions
PART_EFI="${DISK}1"
PART_ROOT="${DISK}2"
if [[ "$DISK" == *"nvme"* ]]; then
    PART_EFI="${DISK}p1"
    PART_ROOT="${DISK}p2"
fi

extract_and_run() {
    local file_path="$1"
    local chroot_mode="$2"
    echo "[+] Extracting live script from: $file_path"
    
    local tmp_script="/tmp/arch_extract_$RANDOM.sh"
    # Extract bash blocks using awk
    curl -s "$REPO_URL/$file_path" | awk '/^```bash/{flag=1; next} /^```/{flag=0} flag' > "$tmp_script"
    
    # Replace markdown placeholders with actual choices
    sed -i "s|/dev/sda1|$PART_EFI|g" "$tmp_script"
    sed -i "s|/dev/sda2|$PART_ROOT|g" "$tmp_script"
    sed -i "s|/dev/sda|$DISK|g" "$tmp_script"
    
    # Remove interactive commands like cfdisk, we'll do it manually
    sed -i '/cfdisk/d' "$tmp_script"
    
    if [ -s "$tmp_script" ]; then
        if [ "$chroot_mode" == "chroot" ]; then
            cp "$tmp_script" /mnt/tmp_script.sh
            arch-chroot /mnt /bin/bash /tmp_script.sh
            rm /mnt/tmp_script.sh
        else
            bash "$tmp_script"
        fi
    else
        echo "Warning: No bash commands found in $file_path"
    fi
    rm -f "$tmp_script"
}

# 1. Manual partitioning logic because cfdisk is interactive in markdown
echo "[+] Wiping disk and creating partitions..."
sgdisk -Z "$DISK"
sgdisk -n 1:0:+512M -t 1:ef00 "$DISK"
sgdisk -n 2:0:0 -t 2:8300 "$DISK"

# Run specific partitioning markdown
if [ "$PART_CHOICE" == "1" ]; then
    extract_and_run "docs/02-partitioning/unencrypted.md" "host"
elif [ "$PART_CHOICE" == "2" ]; then
    extract_and_run "docs/02-partitioning/luks2.md" "host"
elif [ "$PART_CHOICE" == "3" ]; then
    extract_and_run "docs/02-partitioning/lvm-on-luks2.md" "host"
fi

# 2. Base Install
extract_and_run "docs/03-base-installation.md" "host"

# 3. Bootloader Install (Requires chroot, but scripts in MD don't prepend arch-chroot)
if [ "$BOOT_CHOICE" == "1" ]; then
    extract_and_run "docs/04-bootloaders/systemd-boot.md" "chroot"
elif [ "$BOOT_CHOICE" == "2" ]; then
    extract_and_run "docs/04-bootloaders/grub.md" "chroot"
elif [ "$BOOT_CHOICE" == "3" ]; then
    extract_and_run "docs/04-bootloaders/uki-no-grub.md" "chroot"
fi

# 4. Copy scripts and Setup Evil Maid
echo "[+] Fetching scripts directory..."
mkdir -p /mnt/root/scripts
curl -s "$REPO_URL/scripts/evil-maid-detector.sh" > /mnt/root/scripts/evil-maid-detector.sh
curl -s "$REPO_URL/scripts/arch-secure-boot.sh" > /mnt/root/scripts/arch-secure-boot.sh
chmod +x /mnt/root/scripts/*.sh

if [[ "$EVIL_CHOICE" =~ ^[Yy]$ ]]; then
    arch-chroot /mnt /root/scripts/evil-maid-detector.sh setup
fi

echo "[+] Live Extractive Installation complete. You may now reboot."
