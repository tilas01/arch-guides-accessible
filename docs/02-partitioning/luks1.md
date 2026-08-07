

# *nix Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

# LUKS1 Standard Encryption

For systems that require strict legacy compatibility (such as older GRUB versions lacking Argon2id support), you can use LUKS1. This still provides excellent AES-256-XTS encryption, though it lacks the advanced memory-hard key derivation (Argon2id) of LUKS2.

## 1. Format & Mount
```bash
cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 /dev/sda2
cryptsetup open /dev/sda2 cryptroot
mkfs.ext4 /dev/mapper/cryptroot
mount /dev/mapper/cryptroot /mnt
```
