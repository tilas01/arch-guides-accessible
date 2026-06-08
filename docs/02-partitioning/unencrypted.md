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
