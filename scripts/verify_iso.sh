#!/bin/bash
echo "==================================================="
echo "  Arch Linux ISO Integrity Verifier (Linux/macOS)"
echo "==================================================="

if [ -z "$1" ]; then
    echo "Usage: ./verify_iso.sh <path_to_archlinux.iso>"
    exit 1
fi

ISO_FILE="$1"
if [ ! -f "$ISO_FILE" ]; then
    echo "Error: File not found - $ISO_FILE"
    exit 1
fi

echo -e "\nFetching latest SHA256 checksums from Arch Linux mirrors..."
curl -sL "https://mirror.rackspace.com/archlinux/iso/latest/sha256sums.txt" > /tmp/arch_sha256sums.txt

if [ $? -ne 0 ]; then
    echo "Error: Failed to fetch checksums. Check your internet connection."
    exit 1
fi

echo "Calculating SHA256 hash of your ISO (this may take a minute)..."
if command -v sha256sum &> /dev/null; then
    MY_HASH=$(sha256sum "$ISO_FILE" | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    MY_HASH=$(shasum -a 256 "$ISO_FILE" | awk '{print $1}')
else
    echo "Error: Cannot find sha256sum or shasum command."
    exit 1
fi

echo "Your ISO Hash:  $MY_HASH"

if grep -iq "$MY_HASH" /tmp/arch_sha256sums.txt; then
    echo -e "\n[SUCCESS] ISO Integrity Verified! Hash matches official release."
    echo "You may proceed to flash this ISO to your USB drive."
else
    echo -e "\n[WARNING] INTEGRITY CHECK FAILED!"
    echo "The hash of your ISO does NOT match the official release!"
    echo "Please DELETE this ISO, re-download it, and do NOT flash it to a USB!"
fi

rm -f /tmp/arch_sha256sums.txt
echo
