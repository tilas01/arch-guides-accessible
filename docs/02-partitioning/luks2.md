<img src="../../img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# LUKS2 Quantum-Resistant Encryption

Uses AES-256-XTS which is highly resistant to Grover's algorithm (quantum brute forcing).

```bash
cfdisk /dev/sda
# sda1: EFI System (512M)
# sda2: Linux Filesystem (Remainder)

cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 --pbkdf argon2id /dev/sda2
cryptsetup open /dev/sda2 cryptroot

mkfs.ext4 /dev/mapper/cryptroot
mount /dev/mapper/cryptroot /mnt

mkfs.fat -F32 /dev/sda1
mkdir -p /mnt/efi
mount /dev/sda1 /mnt/efi
```

Proceed to **[Step 3: Base Installation](../03-base-installation.md)**.
