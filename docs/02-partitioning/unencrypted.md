<img src="../../img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ?? Legal Disclaimer & AI Notice
> *?? AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Unencrypted Partitioning

This is the standard, simple partitioning scheme.

```bash
cfdisk /dev/sda
```

**Layout:**
* `/dev/sda1` - 512M - EFI System
* `/dev/sda2` - Remainder - Linux Filesystem

**Format:**
```bash
mkfs.fat -F32 /dev/sda1
mkfs.ext4 /dev/sda2
```

**Mount:**
```bash
mount /dev/sda2 /mnt
mkdir -p /mnt/efi
mount /dev/sda1 /mnt/efi
```

Proceed to **[Step 3: Base Installation](../03-base-installation.md)**.
