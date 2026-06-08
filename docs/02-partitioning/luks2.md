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
