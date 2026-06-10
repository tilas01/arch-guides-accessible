# Generator Selections — Complete Reference

> This page documents **every dropdown, checkbox, and option** in the [Arch Guides Dynamic Generator](../index.html). Use this as a standalone manual guide if you prefer to configure everything yourself without using the generator.

---

## Table of Contents

- [1. Firmware Interface (UEFI vs BIOS)](#1-firmware-interface-uefi-vs-bios)
- [2. File System (BTRFS vs Ext4 vs XFS)](#2-file-system-btrfs-vs-ext4-vs-xfs)
- [3. Target Disk](#3-target-disk)
- [4. Encryption (LUKS1, LUKS2, LVM-on-LUKS2)](#4-encryption-luks1-luks2-lvm-on-luks2)
- [5. Init System (systemd vs busybox)](#5-init-system-systemd-vs-busybox)
- [6. Bootloader & Secure Boot](#6-bootloader--secure-boot)
- [7. Main & Backup Kernel](#7-main--backup-kernel)
- [8. CPU Brand](#8-cpu-brand)
- [9. GPU Brand](#9-gpu-brand)
- [10. VM Guest Setup](#10-vm-guest-setup)
- [11. Software Type (Libre vs Proprietary)](#11-software-type-libre-vs-proprietary)
- [12. Swap Size](#12-swap-size)
- [13. Post-Install Apps](#13-post-install-apps)
- [14. Auto Updates](#14-auto-updates)
- [15. Multi-User Setup & SSH](#15-multi-user-setup--ssh)
- [16. Post-Install Cleanup](#16-post-install-cleanup)
- [17. Desktop Environment](#17-desktop-environment)
- [18. Display Server (Wayland vs Xorg)](#18-display-server-wayland-vs-xorg)
- [19. Web Browser](#19-web-browser)
- [20. DNS Caching](#20-dns-caching)
- [21. Arch Rusty Security Suite](#21-arch-rusty-security-suite)
- [22. Security Tools (OTP & Input Guard)](#22-security-tools-otp--input-guard)
- [23. OTP Mode & Algorithm](#23-otp-mode--algorithm)
- [24. Kloak — Keystroke Anonymization](#24-kloak--keystroke-anonymization)
- [25. Webhook Alerts](#25-webhook-alerts)
- [26. Hardened SSH + OTP](#26-hardened-ssh--otp)
- [27. Anti-Evil Maid](#27-anti-evil-maid)
- [28. Arch ISO Pre-Install](#28-arch-iso-pre-install)
- [29. Output Format](#29-output-format)
- [Compatibility Matrix](#compatibility-matrix)
- [Recommended Configurations](#recommended-configurations)

---

## 1. Firmware Interface (UEFI vs BIOS)

### Options

| Option | Value | Default |
|--------|-------|---------|
| **UEFI (Modern, Recommended)** | `uefi` | ✅ Yes |
| **Legacy BIOS** | `bios` | No |

### What Each Means

**UEFI (Unified Extensible Firmware Interface)** is the modern firmware standard that replaced BIOS. Nearly all computers manufactured after 2012 support UEFI.

**Legacy BIOS (Basic Input/Output System)** is the traditional firmware from pre-2012 systems. Some newer systems can emulate BIOS via "CSM" (Compatibility Support Module).

### How to Check Which You Have

```bash
# From a live Arch ISO or existing Linux install:
ls /sys/firmware/efi/efivars
# If this directory exists and has files → UEFI
# If it doesn't exist or errors → BIOS

# Alternative:
[ -d /sys/firmware/efi ] && echo "UEFI" || echo "BIOS"
```

### Comparison

| Feature | UEFI | Legacy BIOS |
|---------|------|-------------|
| Partition table | GPT (required) | MBR or GPT |
| Boot partition | ESP (EFI System Partition, FAT32) | MBR boot sector |
| Max disk size | 9.4 ZB (effectively unlimited) | 2 TB limit |
| Secure Boot | ✅ Supported | ❌ Not available |
| UKI support | ✅ Yes | ❌ No |
| systemd-boot | ✅ Yes | ❌ No |
| GRUB | ✅ Yes | ✅ Yes |
| Boot speed | Faster | Slower |

### Recommendation

**Use UEFI** unless your hardware physically cannot support it. UEFI enables Secure Boot, UKI, and systemd-boot — all superior to legacy BIOS boot.

### Manual Configuration

**UEFI partitioning:**
```bash
sgdisk -Z /dev/sda                              # Zap all partition data
sgdisk -n 1:0:+512M -t 1:ef00 /dev/sda          # 512MB EFI System Partition
sgdisk -n 2:0:0 -t 2:8300 /dev/sda              # Rest = Linux filesystem
mkfs.fat -F32 /dev/sda1                          # Format EFI as FAT32
```

**BIOS partitioning:**
```bash
sgdisk -Z /dev/sda                               # Zap all partition data
sgdisk -n 1:0:+2M -t 1:ef02 /dev/sda            # 2MB BIOS boot partition
sgdisk -n 2:0:0 -t 2:8300 /dev/sda              # Rest = Linux filesystem
```

### Constraints

- BIOS **forces** GRUB bootloader (UKI and systemd-boot are UEFI-only)
- BIOS **disables** LUKS2 (GRUB has limited LUKS2 support on BIOS; use LUKS1)

---

## 2. File System (BTRFS vs Ext4 vs XFS)

### Options

| Option | Value | Default |
|--------|-------|---------|
| **BTRFS (Snapshots & Snapper)** | `btrfs` | ✅ Yes |
| **Ext4 (Standard/Stable)** | `ext4` | No |
| **XFS (High Performance)** | `xfs` | No |

### Comparison Table

| Feature | BTRFS | Ext4 | XFS |
|---------|-------|------|-----|
| **Snapshots** | ✅ Native (Snapper) | ❌ No | ❌ No |
| **Compression** | ✅ zstd, zlib, lzo | ❌ No | ❌ No |
| **Copy-on-Write** | ✅ Yes | ❌ No | ❌ No |
| **Subvolumes** | ✅ Yes | ❌ No | ❌ No |
| **Stability** | Good (mature for years) | ✅ Excellent (decades) | ✅ Excellent |
| **Performance (general)** | Good | Good | ✅ Best for large files |
| **Performance (databases)** | ⚠️ CoW overhead | ✅ Good | ✅ Best |
| **RAID** | ✅ Built-in | ❌ Needs mdraid | ❌ Needs mdraid |
| **Online resize** | ✅ Grow + shrink | ✅ Grow only | ✅ Grow only |
| **Max file size** | 16 EiB | 16 TiB | 8 EiB |
| **Defragmentation** | ✅ Online | ✅ e4defrag | ✅ xfs_fsr |
| **Recovery tools** | btrfs-progs | e2fsck (excellent) | xfs_repair |
| **Packages installed** | `btrfs-progs snapper` | (none extra) | `xfsprogs` |
| **Best for** | Desktops, rollback | Servers, reliability | Databases, large files |

### Recommendation

- **BTRFS** for most desktop users — snapshots let you undo broken updates instantly.
- **Ext4** for simplicity and maximum reliability — decades of battle-tested code.
- **XFS** for workloads with large files (video editing, databases, NAS).

### Manual Configuration

**BTRFS setup (generator default):**
```bash
mkfs.btrfs -f /dev/mapper/cryptroot   # or your target partition
mount /dev/mapper/cryptroot /mnt

# Create subvolumes
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@var
btrfs subvolume create /mnt/@snapshots
umount /mnt

# Mount with recommended options
mount -o noatime,compress=zstd,space_cache=v2,subvol=@ /dev/mapper/cryptroot /mnt
mkdir -p /mnt/{home,var,.snapshots}
mount -o noatime,compress=zstd,space_cache=v2,subvol=@home /dev/mapper/cryptroot /mnt/home
mount -o noatime,compress=zstd,space_cache=v2,subvol=@var /dev/mapper/cryptroot /mnt/var
mount -o noatime,compress=zstd,space_cache=v2,subvol=@snapshots /dev/mapper/cryptroot /mnt/.snapshots
```

**Ext4 setup:**
```bash
mkfs.ext4 /dev/mapper/cryptroot
mount /dev/mapper/cryptroot /mnt
```

**XFS setup:**
```bash
mkfs.xfs -f /dev/mapper/cryptroot
mount /dev/mapper/cryptroot /mnt
```

### BTRFS Post-Install (Snapper)

The generator also configures Snapper for automatic snapshots:

```bash
snapper -c root create-config /
systemctl enable snapper-timeline.timer snapper-cleanup.timer
```

---

## 3. Target Disk

### What It Is

The physical disk where Arch Linux will be installed. This is a text input, not a dropdown.

**Default:** `/dev/sda`

### How to Find Your Target Disk

```bash
lsblk
```

Example output:
```
NAME    MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
sda       8:0    0 931.5G  0 disk
├─sda1    8:1    0   512M  0 part  /efi
└─sda2    8:2    0   931G  0 part
nvme0n1 259:0    0 476.9G  0 disk
├─nvme0n1p1 259:1    0   512M  0 part
└─nvme0n1p2 259:2    0 476.4G  0 part
```

### Common Disk Names

| Type | Device Path | Partition Format |
|------|------------|-----------------|
| **SATA SSD/HDD** | `/dev/sda`, `/dev/sdb` | `/dev/sda1`, `/dev/sda2` |
| **NVMe SSD** | `/dev/nvme0n1`, `/dev/nvme1n1` | `/dev/nvme0n1p1`, `/dev/nvme0n1p2` |
| **Virtual disk** | `/dev/vda` (virtio) | `/dev/vda1`, `/dev/vda2` |
| **USB drive** | `/dev/sdb` (usually) | `/dev/sdb1`, `/dev/sdb2` |

### Important Notes

- The generator automatically detects NVMe vs SATA naming and adjusts partition paths.
- NVMe partitions use the `p` prefix (e.g., `/dev/nvme0n1p1`), SATA does not (e.g., `/dev/sda1`).
- **Double-check your disk** — choosing the wrong disk will destroy its data.
- Use `lsblk -f` to see filesystem labels and UUIDs for identification.

---

## 4. Encryption (LUKS1, LUKS2, LVM-on-LUKS2)

### Options

| Option | Value | Default | Security Level |
|--------|-------|---------|----------------|
| **Unencrypted (No Security)** | `unencrypted` | No | ❌ None |
| **LUKS1 (GRUB Compatible)** | `luks1` | No | 🟡 Good |
| **LUKS2 (Post-Quantum Argon2id)** | `luks2` | ✅ Yes | 🟢 Excellent |
| **LVM on LUKS2 (Flexible Volumes)** | `lvm-on-luks2` | No | 🟢 Excellent + Flexible |

### What Each Means

**Unencrypted:** No disk encryption. Anyone with physical access to your machine can read all data. Only suitable for VMs or throw-away systems.

**LUKS1:** Linux Unified Key Setup version 1. Uses PBKDF2 for key derivation. Fully compatible with GRUB's built-in decryption. Required for Legacy BIOS boot.

**LUKS2:** The current standard. Uses **Argon2id** for key derivation — resistant to GPU and ASIC brute-force attacks, and considered post-quantum secure. The generator uses 512-bit AES-XTS with SHA-512 and 5000ms iteration time.

**LVM on LUKS2:** Combines LUKS2 full-disk encryption with LVM (Logical Volume Manager). The entire disk is encrypted, then LVM creates flexible partitions inside. Allows dynamic resizing of partitions after installation.

### Security Comparison

| Feature | Unencrypted | LUKS1 | LUKS2 | LVM-on-LUKS2 |
|---------|-------------|-------|-------|---------------|
| Physical access protection | ❌ | ✅ | ✅ | ✅ |
| Key derivation | N/A | PBKDF2 | Argon2id | Argon2id |
| GPU brute-force resistant | N/A | ⚠️ Weak | ✅ Strong | ✅ Strong |
| Post-quantum ready | N/A | ❌ | ✅ | ✅ |
| GRUB compatible | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited |
| BIOS compatible | ✅ | ✅ | ❌ | ❌ |
| Flexible partitioning | ❌ | ❌ | ❌ | ✅ LVM |
| Performance impact | None | ~2-5% | ~2-5% | ~3-7% |
| Boot time impact | None | +2-5s | +3-8s | +3-8s |

### Manual Configuration

**LUKS1:**
```bash
cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 /dev/sda2
cryptsetup open /dev/sda2 cryptroot
# Target mount: /dev/mapper/cryptroot
```

**LUKS2 (recommended):**
```bash
cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 /dev/sda2
cryptsetup open /dev/sda2 cryptroot
# Target mount: /dev/mapper/cryptroot
```

**LVM on LUKS2:**
```bash
cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 /dev/sda2
cryptsetup open /dev/sda2 cryptlvm
pvcreate /dev/mapper/cryptlvm
vgcreate vg0 /dev/mapper/cryptlvm
lvcreate -l 100%FREE vg0 -n root
# Target mount: /dev/vg0/root
```

### Constraints

- BIOS firmware **disables** LUKS2 and LVM-on-LUKS2 (use LUKS1 with BIOS)
- LUKS2 requires UKI, systemd-boot, or a bootloader that passes the encrypted partition info to the kernel (GRUB's LUKS2 support is limited)

---

## 5. Init System (systemd vs busybox)

### Options

| Option | Value | Default |
|--------|-------|---------|
| **systemd (Modern, sd-encrypt)** | `systemd` | ✅ Yes |
| **busybox/udev (Traditional)** | `busybox` | No |

### What Each Means

The **init system** controls the initramfs hooks — the early boot process that loads drivers, decrypts disks, and mounts filesystems before the real system starts.

**systemd:** Uses the systemd init framework for early boot. Provides `sd-encrypt` for LUKS decryption and `sd-vconsole` for console setup. Faster boot with parallelized service startup.

**busybox/udev:** Uses the traditional BusyBox-based init with udev for device management. Uses the `encrypt` hook for LUKS and `keymap`/`consolefont` for console setup. More portable and simpler to debug.

### Hook Comparison

| Component | systemd | busybox |
|-----------|---------|---------|
| Base | `base systemd` | `base udev` |
| Autodetect | `autodetect` | `autodetect` |
| Microcode | `microcode` | `microcode` |
| Modules | `modconf kms` | `modconf kms` |
| Keyboard | `keyboard sd-vconsole` | `keyboard keymap consolefont` |
| Block devices | `block` | `block` |
| Encryption | `sd-encrypt` | `encrypt` |
| LVM | `lvm2` | `lvm2` |
| Filesystem | `filesystems fsck` | `filesystems fsck` |
| BTRFS | `btrfs filesystems fsck` | `btrfs filesystems fsck` |

### Manual Configuration

The init system determines the `HOOKS` line in `/etc/mkinitcpio.conf`:

**systemd with LUKS2 + BTRFS (generator default):**
```bash
sed -i 's/^HOOKS=.*/HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt btrfs filesystems fsck)/' /etc/mkinitcpio.conf
mkinitcpio -P
```

**busybox with LUKS2 + BTRFS:**
```bash
sed -i 's/^HOOKS=.*/HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt btrfs filesystems fsck)/' /etc/mkinitcpio.conf
mkinitcpio -P
```

### Recommendation

**Use systemd** for most modern systems — it's faster, has better LUKS2 integration via `sd-encrypt`, and aligns with the rest of the systemd ecosystem. Use busybox only if you specifically need traditional hook compatibility or are building a minimal/embedded system.

---

## 6. Bootloader & Secure Boot

### Options

| Option | Value | Default | UEFI | BIOS |
|--------|-------|---------|------|------|
| **UKI + Custom Keys (Fortress)** | `uki-custom` | ✅ Yes | ✅ | ❌ |
| **UKI + Shim (Microsoft Trust)** | `uki-shim` | No | ✅ | ❌ |
| **systemd-boot (Minimal)** | `systemd-boot` | No | ✅ | ❌ |
| **GRUB (Legacy)** | `grub` | No | ✅ | ✅ |

### What Each Means

**UKI + Custom Keys (Fortress):** Creates Unified Kernel Images with your own Secure Boot signing keys. You enroll your own Platform Key (PK), removing Microsoft's trust chain entirely. Maximum security — only kernels YOU sign will boot.

**UKI + Shim (Microsoft Trust):** Creates Unified Kernel Images but uses Microsoft's Shim bootloader for Secure Boot. Shim is signed by Microsoft, which then chain-loads your signed UKI. Easier to set up, works out-of-the-box with factory Secure Boot databases.

**systemd-boot (Minimal):** A simple UEFI boot manager built into systemd. No Secure Boot signing by default (can be added separately). Extremely fast and lightweight. No menu customization.

**GRUB (Legacy):** The GNU GRand Unified Bootloader. Supports both UEFI and BIOS. Can decrypt LUKS1 partitions directly (without initramfs). Highly configurable with themes and menus. Required for BIOS systems.

### Comparison Table

| Feature | UKI Custom | UKI Shim | systemd-boot | GRUB |
|---------|-----------|----------|--------------|------|
| Secure Boot | ✅ Custom keys | ✅ Microsoft chain | ⚠️ Manual setup | ⚠️ Manual setup |
| UEFI support | ✅ | ✅ | ✅ | ✅ |
| BIOS support | ❌ | ❌ | ❌ | ✅ |
| Boot speed | Fast | Fast | ✅ Fastest | Slower |
| Dual boot | ⚠️ Complex | ⚠️ Complex | ✅ Easy | ✅ Easy |
| Configuration | Source code | Source code | Simple text | `/etc/default/grub` |
| Rescue mode | ❌ | ❌ | ❌ | ✅ Built-in |
| Security level | 🟢 Maximum | 🟡 Good | 🟡 Basic | 🟡 Good |
| Complexity | High | Medium | Low | Medium |

### Manual Configuration

**UKI + Custom Keys:**
```bash
pacman -S --noconfirm sbsigntools efitools efibootmgr
# Then create and enroll custom Secure Boot keys
# See the Secure Boot wiki section for full key creation
```

**UKI + Shim:**
```bash
pacman -S --noconfirm sbsigntools efitools efibootmgr shim-signed
cp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/bootx64.efi
```

**systemd-boot:**
```bash
bootctl install --esp-path=/efi
```

**GRUB (UEFI):**
```bash
pacman -S --noconfirm grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
```

**GRUB (BIOS):**
```bash
pacman -S --noconfirm grub efibootmgr
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

### Recommendation

- **UKI + Custom Keys** for maximum security (you control the entire trust chain).
- **systemd-boot** for simplicity on UEFI systems without Secure Boot needs.
- **GRUB** if you need BIOS support, dual boot, or LUKS1 direct decryption.

---

## 7. Main & Backup Kernel

### Main Kernel Options

| Option | Value | Default | Best For |
|--------|-------|---------|----------|
| **linux-hardened (Max Security)** | `linux-hardened` | ✅ Yes | Security-focused systems |
| **linux (Standard)** | `linux` | No | General use |
| **linux-zen (Performance)** | `linux-zen` | No | Gaming, desktop performance |
| **linux-lts (Stability)** | `linux-lts` | No | Servers, stability |

### Backup Kernel Options

| Option | Value | Default |
|--------|-------|---------|
| **linux-zen (Fallback)** | `linux-zen` | ✅ Yes |
| **linux-lts (Stable Fallback)** | `linux-lts` | No |
| **linux (Standard)** | `linux` | No |
| **None** | `none` | No |

### Kernel Descriptions

**linux-hardened:** Includes security-focused patches: grsecurity-inspired features, more restrictive `sysctl` defaults, hardened memory allocator, and reduced kernel attack surface. May break some software that relies on relaxed kernel settings (e.g., some container runtimes, certain gaming anti-cheat).

**linux (standard):** The mainline kernel as packaged by Arch Linux. Balanced between performance, compatibility, and features. Updated frequently with latest upstream releases.

**linux-zen:** Optimized for desktop interactivity and throughput. Includes scheduler improvements (CacULE or BORE), higher timer frequency (1000Hz), better preemption settings. Ideal for gaming, audio production, and responsive desktop use.

**linux-lts:** Long Term Support kernel. Receives security patches but fewer feature updates. Less likely to introduce regressions. Ideal for servers or systems where stability is paramount.

### Comparison

| Feature | linux-hardened | linux | linux-zen | linux-lts |
|---------|---------------|-------|-----------|-----------|
| Security patches | ✅ Maximum | Standard | Standard | Standard |
| Performance | ⚠️ Slight overhead | Balanced | ✅ Optimized | Balanced |
| Compatibility | ⚠️ May break some software | ✅ Best | ✅ Good | ✅ Good |
| Update frequency | Frequent | Frequent | Frequent | Infrequent |
| Timer frequency | 300Hz | 300Hz | 1000Hz | 250Hz |
| Preemption | Voluntary | Voluntary | Full | Voluntary |
| Kernel attack surface | Reduced | Normal | Normal | Normal |
| Gaming | ⚠️ Anti-cheat issues | ✅ Good | ✅ Best | Good |

### Why a Backup Kernel?

A backup kernel ensures you can still boot if a kernel update breaks your system. If your main kernel fails to boot:

1. Select the backup kernel from your bootloader menu
2. Boot into the working backup
3. Troubleshoot or rollback the main kernel

### Packages Installed

For each kernel, the generator installs both the kernel and headers:
- Main: `linux-hardened linux-hardened-headers` (default)
- Backup: `linux-zen linux-zen-headers` (default)

---

## 8. CPU Brand

### Options

| Option | Value | Default | Package Installed |
|--------|-------|---------|------------------|
| **AMD** | `amd` | ✅ Yes | `amd-ucode` |
| **Intel** | `intel` | No | `intel-ucode` |
| **VM / Other** | `vm` | No | (none) |

### What This Does

Installs the correct **CPU microcode** package. Microcode updates are firmware patches for your CPU that fix bugs, security vulnerabilities, and improve stability. They're loaded very early during boot via the initramfs.

### How to Check Your CPU

```bash
lscpu | grep "Vendor ID"
# AuthenticAMD → AMD
# GenuineIntel → Intel

# Or:
cat /proc/cpuinfo | grep vendor_id
```

### Recommendation

- Select **AMD** or **Intel** to match your physical CPU.
- Select **VM / Other** only when running in a virtual machine or on exotic hardware.

---

## 9. GPU Brand

### Options

| Option | Value | Default | Packages (Libre/Open Source) | Packages (Proprietary) |
|--------|-------|---------|------------------------------|----------------------|
| **AMD Radeon** | `amd` | ✅ Yes | `mesa xf86-video-amdgpu vulkan-radeon` | Same |
| **Intel Graphics** | `intel` | No | `mesa xf86-video-intel vulkan-intel` | Same |
| **Nvidia GeForce** | `nvidia` | No | `mesa xf86-video-nouveau` | `nvidia nvidia-utils` |
| **Virtual Machine** | `vm` | No | `spice-vdagent xf86-video-qxl` | Same |

### Key Differences

**AMD:** Fully open-source drivers (`amdgpu`). Excellent performance on both Xorg and Wayland. No proprietary drivers needed — the open-source stack is AMD's primary driver. Best overall Linux GPU experience.

**Intel:** Fully open-source drivers (`i915`/`xe`). Good integrated GPU performance. Same packages regardless of software type.

**Nvidia:** The only GPU where software type matters significantly:
- **Libre/Open Source** → `nouveau` (reverse-engineered open driver). Significantly lower performance, no reclocking on many GPUs, limited Wayland support.
- **Proprietary** → `nvidia nvidia-utils` (official closed-source driver). Full performance, good Wayland support (515+), required for CUDA/compute.

**VM:** Installs virtual GPU drivers for SPICE and QXL protocols used by QEMU/KVM.

### How to Check Your GPU

```bash
lspci | grep -i vga
# or
lspci -k | grep -A 2 VGA
```

### Recommendation

- **AMD/Intel** — just select your brand, same packages either way.
- **Nvidia** — use **Proprietary** software type unless you have a philosophical commitment to libre software and can accept Nouveau's performance limitations.

---

## 10. VM Guest Setup

### Options

| Option | Value | Default | Package | Service |
|--------|-------|---------|---------|---------|
| **None (Bare Metal)** | `none` | ✅ Yes | (none) | (none) |
| **VirtualBox** | `vbox` | No | `virtualbox-guest-utils` | `vboxservice.service` |
| **VMware** | `vmware` | No | `open-vm-tools` | `vmtoolsd.service` |
| **QEMU/KVM** | `qemu` | No | `qemu-guest-agent` | `qemu-guest-agent.service` |

### What Guest Additions Do

Guest additions/tools enable features when running Arch inside a virtual machine:

- **Shared clipboard** — copy/paste between host and guest
- **Shared folders** — access host files from the VM
- **Dynamic resolution** — guest resolution follows window size
- **Better mouse integration** — seamless cursor movement
- **Time synchronization** — keep guest clock in sync with host
- **Performance optimization** — paravirtualized drivers

### Manual Setup

**VirtualBox:**
```bash
pacman -S --noconfirm virtualbox-guest-utils
systemctl enable vboxservice.service
```

**VMware:**
```bash
pacman -S --noconfirm open-vm-tools
systemctl enable vmtoolsd.service
```

**QEMU/KVM:**
```bash
pacman -S --noconfirm qemu-guest-agent
systemctl enable qemu-guest-agent.service
```

### Recommendation

Select **None** for bare metal installs. Only select a hypervisor if you're installing Arch inside that specific VM software.

---

## 11. Software Type (Libre vs Proprietary)

### Options

| Option | Value | Default | Admin Tool | System Info | Nvidia Driver |
|--------|-------|---------|-----------|-------------|---------------|
| **Fully Libre (100% Open Source)** | `libre` | ✅ Yes | `opendoas` | `pfetch` | `nouveau` |
| **Open Source + Firmware** | `opensource` | No | `sudo` | `fastfetch` | `nouveau` |
| **Open Source + Proprietary** | `proprietary` | No | `sudo` | `fastfetch` | `nvidia nvidia-utils` |
| **Virtual Machine** | `vm` | No | `sudo` | `fastfetch` | N/A |

### What You Gain/Lose With Each

#### Fully Libre

**Gains:**
- Complete software freedom — every binary is open source
- `doas` — simpler, auditable privilege escalation (fewer CVEs than sudo)
- `pfetch` — minimal, clean system info
- No proprietary firmware blobs
- Aligns with FSF Free Software principles

**Loses:**
- Nvidia GPU performance (Nouveau is significantly slower)
- Some firmware-dependent hardware may not work (Wi-Fi, Bluetooth)
- Some apps have libre compatibility warnings (Firefox contains blobs, Signal uses centralized servers)

**Configuration:**
```bash
# doas setup
echo "permit persist :wheel" > /etc/doas.conf
ln -s /usr/bin/doas /usr/bin/sudo  # compatibility symlink
```

#### Open Source + Firmware

**Gains:**
- Better hardware support (firmware blobs for Wi-Fi, Bluetooth, etc.)
- `sudo` — industry standard, more documentation available
- `fastfetch` — more detailed system info

**Loses:**
- Still uses Nouveau for Nvidia (no proprietary GPU driver)
- Firmware blobs are not auditable

#### Open Source + Proprietary

**Gains:**
- Full Nvidia GPU performance with proprietary drivers
- Best hardware compatibility
- CUDA/compute support for Nvidia GPUs

**Loses:**
- Proprietary drivers cannot be audited
- Nvidia driver may break on kernel updates
- Dependent on Nvidia's release schedule

#### Virtual Machine

Same as Open Source + Firmware but optimized for VM environments.

### Recommendation

- **Libre** if you prioritize software freedom and don't have Nvidia hardware.
- **Open Source + Proprietary** for most users, especially with Nvidia GPUs.
- **VM** when installing in a virtual machine.

---

## 12. Swap Size

### Options

| Option | Value | Default |
|--------|-------|---------|
| **0GB (No Swap)** | `0` | No |
| **4GB** | `4G` | No |
| **8GB** | `8G` | ✅ Yes |
| **16GB** | `16G` | No |
| **32GB** | `32G` | No |

### Swap Size Recommendations Based on RAM

| System RAM | Without Hibernation | With Hibernation | Best Choice |
|-----------|--------------------|--------------------|-------------|
| 2-4 GB | 4 GB | Equal to RAM | 4G |
| 8 GB | 4-8 GB | 8-12 GB | 8G |
| 16 GB | 4-8 GB | 16-20 GB | 8G |
| 32 GB | 4-8 GB | 32-36 GB | 8G or 16G |
| 64+ GB | 0-8 GB | Not practical | 8G or 0 |

### What Swap Does

- **Overflow RAM** — prevents out-of-memory kills when RAM is full
- **Hibernation** — saves RAM contents to disk for suspend-to-disk (requires swap ≥ RAM size)
- **Memory-mapped files** — backing store for mmap operations
- **Kernel memory management** — allows the kernel to optimize memory usage

### How Swap Is Created

The generator creates a **swap file** (not a partition):

**BTRFS:**
```bash
btrfs filesystem mkswapfile --size 8G /mnt/swapfile
swapon /mnt/swapfile
```

**Ext4/XFS:**
```bash
fallocate -l 8G /mnt/swapfile
chmod 600 /mnt/swapfile
mkswap /mnt/swapfile
swapon /mnt/swapfile
```

### Recommendation

**8GB** is a good default for most systems. Use 0GB only if you have abundant RAM (32GB+) and never hibernate. Use 16GB+ if you plan to hibernate.

---

## 13. Post-Install Apps

### Available Applications

#### AUR Helpers

| App | Package | Checked | Description | Libre |
|-----|---------|---------|-------------|-------|
| **paru** | `paru` (AUR) | ✅ Default | Rust-based AUR helper by [Morganamilo](https://github.com/Morganamilo/paru) | ✅ |

#### Browsers

| App | Package | Checked | Description | Libre |
|-----|---------|---------|-------------|-------|
| **Firefox** | `firefox` (pacman) | ✅ Default | Standard Mozilla browser | ⚠️ Contains firmware blobs |
| **LibreWolf** | `librewolf` (AUR) | No | [Privacy-hardened](https://librewolf.net/) Firefox fork, no telemetry | ✅ |
| **Tor Browser** | `tor-browser` (AUR) | No | [Maximum anonymity](https://torproject.org/) via Tor network | ✅ |

#### Security

| App | Package | Checked | Description | Libre |
|-----|---------|---------|-------------|-------|
| **Signal** | `signal-desktop` (AUR) | No | [E2E encrypted](https://signal.org/) messaging | ⚠️ Centralized servers |
| **KeePassXC** | `keepassxc` (pacman) | No | [Offline password manager](https://keepassxc.org/) with TOTP | ✅ |

#### Dev / Terminal

| App | Package | Checked | Description | Libre |
|-----|---------|---------|-------------|-------|
| **Neovim** | `neovim git ripgrep fd` (pacman) | ✅ Default | [Terminal editor](https://neovim.io/) + dev search tools | ✅ |
| **Alacritty** | `alacritty` (pacman) | No | [GPU-accelerated](https://alacritty.org/) terminal | ✅ |
| **Zsh** | `zsh zsh-completions` (pacman) | No | Modern shell with completions (changes default shell) | ✅ |
| **VSCodium** | `vscodium` (AUR) | No | [FOSS VS Code](https://vscodium.com/) without telemetry | ✅ |

#### Media / Files

| App | Package | Checked | Description | Libre |
|-----|---------|---------|-------------|-------|
| **Thunar** | `thunar gvfs thunar-volman` (pacman) | No | GTK file manager with volume management | ✅ |
| **mpv** | `mpv` (pacman) | No | [Lightweight](https://mpv.io/) keyboard-driven media player | ✅ |
| **OBS Studio** | `obs-studio` (pacman) | No | [Screen recording](https://obsproject.com/) and streaming | ✅ |

#### System

| App | Package | Checked | Description | Libre |
|-----|---------|---------|-------------|-------|
| **Flatpak** | `flatpak` (pacman) | No | Universal app packaging (adds Flathub remote) | ⚠️ Apps may be proprietary |

### Libre Compatibility Warning

> ⚠️ **Libre users:** Firefox contains firmware blobs, Flatpak's Flathub hosts proprietary apps, and Signal connects to centralized servers. For strict libre, prefer LibreWolf over Firefox and avoid Flatpak proprietary apps.

### How AUR Apps Are Installed

The generator creates a temporary `builder` user to compile AUR packages:

```bash
# Create builder
useradd -m -G wheel -s /bin/bash builder
echo "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder

# Install paru
su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"

# Install AUR apps (examples)
su - builder -c "paru -S --noconfirm librewolf"
su - builder -c "paru -S --noconfirm signal-desktop"

# Cleanup
userdel -r builder
rm -f /etc/sudoers.d/builder
```

---

## 14. Auto Updates

### Options

| Option | Value | Default |
|--------|-------|---------|
| **No (Manual)** | `no` | ✅ Yes |
| **Yes (Daily Cron)** | `yes` | No |

### What It Does

When enabled, creates a daily cron job that runs `pacman -Syu --noconfirm` at 2:00 AM with logging.

### Manual Setup

```bash
systemctl enable cronie

cat << 'CRON_SCRIPT' > /usr/local/bin/auto-update.sh
#!/bin/bash
pacman -Syu --noconfirm >> /var/log/auto-update.log 2>&1
CRON_SCRIPT

chmod +x /usr/local/bin/auto-update.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auto-update.sh") | crontab -
```

### Trade-offs

| Pros | Cons |
|------|------|
| Always up-to-date security patches | Updates may break things unattended |
| No manual maintenance needed | `--noconfirm` skips important prompts |
| Reduces attack window | Arch is rolling release — updates are frequent and can be breaking |

### Recommendation

**No (Manual)** is safer for Arch Linux. Always review `pacman -Syu` output and check [Arch Linux News](https://archlinux.org/news/) before updating. Auto-updates are better suited for stable distros, not rolling-release.

---

## 15. Multi-User Setup & SSH

### Options

**Regular Users:** Number input (1-5, default: 1)

**Root SSH Access:**

| Option | Value | Default |
|--------|-------|---------|
| **No (sudo/doas only)** | `no` | ✅ Yes |
| **Yes (Allow root SSH)** | `yes` | No |

### What This Controls

**User count:** How many non-root users to create during installation. Each user gets:
- Home directory
- `wheel` group membership (for sudo/doas)
- `/bin/bash` shell
- Password prompt during install

**Root SSH:** Whether the root account can log in via SSH:
- **No:** `PermitRootLogin no` in sshd_config — root cannot SSH, must use sudo/doas
- **Yes:** Root can SSH directly (security risk)

### Manual Configuration

```bash
# Create users (in chroot)
passwd root
useradd -m -G wheel -s /bin/bash user1
passwd user1
useradd -m -G wheel -s /bin/bash user2
passwd user2
```

### Recommendation

- **1 user** for personal systems, more for shared machines.
- **No root SSH** — always. Use sudo/doas for privilege escalation.

---

## 16. Post-Install Cleanup

### Options

| Option | Value | Default |
|--------|-------|---------|
| **Yes** | `yes` | ✅ Yes |
| **No** | `no` | No |

### What It Does

Cleans up build dependencies, package cache, and temporary files after installation:

```bash
arch-chroot /mnt pacman -Scc --noconfirm
rm -rf /mnt/var/cache/pacman/pkg/* /mnt/tmp/*
```

### Recommendation

**Yes** for production installs. **No** if you plan to troubleshoot or install more packages immediately after (saves re-downloading).

---

## 17. Desktop Environment

### Options

| Option | Value | Default | Display Manager | Packages |
|--------|-------|---------|-----------------|----------|
| **None (TTY Only)** | `none` | ✅ Yes | (none) | (none) |
| **GNOME** | `gnome` | No | GDM | `gnome gnome-tweaks` |
| **KDE Plasma** | `kde` | No | SDDM | `plasma-desktop sddm` |
| **DWM (Minimal WM)** | `dwm` | No | (none, use startx) | `xorg-server xorg-xinit base-devel libx11 libxinerama libxft` |
| **Dusky OS** | `dusky` | No | (none, use startx) | `git base-devel xorg-server xorg-xinit` |

### Descriptions

**None (TTY Only):** No graphical interface. Command-line only. Suitable for servers, headless machines, or users who want to set up their own DE/WM later.

**GNOME:** Full-featured desktop environment. Modern, polished, touch-friendly. Uses Mutter compositor. Integrates well with Wayland. Includes file manager (Nautilus), terminal, settings app, and more.

**KDE Plasma:** Full-featured, highly customizable desktop. Uses KWin compositor. More traditional desktop layout. Excellent Wayland support. Includes Dolphin file manager, Konsole terminal, and extensive settings.

**DWM (Minimal WM):** Suckless Dynamic Window Manager. Tiling WM configured by editing C source code and recompiling. Extremely lightweight (<500 lines of code). Requires X11/Xorg. Cloned from `git.suckless.org`.

**Dusky OS:** Pre-configured DWM-based desktop by [dusklinux](https://github.com/dusklinux/dusky). Provides a curated tiling WM experience with patches and theming applied. X11 only. For libre mode, `sudo` is replaced with `doas` in the install script. See the [Dusky OS Cheatsheet](dusky-cheatsheet.md) for details.

### Manual Installation

**GNOME:**
```bash
pacman -S --noconfirm gnome gnome-tweaks wayland  # or xorg-server for Xorg
systemctl enable gdm
```

**KDE Plasma:**
```bash
pacman -S --noconfirm plasma-desktop sddm wayland  # or xorg-server for Xorg
systemctl enable sddm
```

**DWM:**
```bash
pacman -S --noconfirm xorg-server xorg-xinit base-devel libx11 libxinerama libxft
git clone https://git.suckless.org/dwm /usr/local/src/dwm
cd /usr/local/src/dwm && make install
```

**Dusky OS:**
```bash
pacman -S --noconfirm git base-devel xorg-server xorg-xinit
# Dusky is installed via paru/AUR builder (see Post-Install Apps section)
git clone https://github.com/dusklinux/dusky.git /tmp/dusky
cd /tmp/dusky && ./install.sh
```

---

## 18. Display Server (Wayland vs Xorg)

### Options

| Option | Value | Default |
|--------|-------|---------|
| **Auto (Depends on DE)** | `auto` | ✅ Yes |
| **Wayland (Modern)** | `wayland` | No |
| **Xorg (Legacy)** | `xorg` | No |

### Auto Behavior

| Desktop | Auto Selects |
|---------|-------------|
| None | N/A |
| GNOME | Wayland |
| KDE Plasma | Wayland |
| DWM | Xorg |
| Dusky OS | Xorg |

### Key Differences

- **Wayland** — better security (app isolation), tear-free rendering, better HiDPI. Recommended for GNOME/KDE.
- **Xorg** — required for DWM/Dusky, better remote desktop support, better Nvidia Nouveau support.
- **DWM/Dusky + Wayland = BROKEN** — these are X11 window managers and cannot run on Wayland.

> For a detailed comparison, see the [Xorg vs Wayland](xorg-vs-wayland.md) page.

---

## 19. Web Browser

### Options

| Option | Value | Default | Install Method |
|--------|-------|---------|---------------|
| **None** | `none` | ✅ Yes | (none) |
| **LibreWolf** | `librewolf` | No | AUR via paru |
| **Firefox** | `firefox` | No | pacman |

### Note

This is a **separate** browser selection from the post-install apps checkboxes. This dropdown installs a browser as part of the desktop setup step, while post-install app checkboxes install during the apps step.

---

## 20. DNS Caching

### Options

| Option | Value | Default | Package | Service |
|--------|-------|---------|---------|---------|
| **systemd-resolved** | `systemd-resolved` | ✅ Yes | (built-in) | `systemd-resolved` |
| **unbound** | `unbound` | No | `unbound` | `unbound` |
| **dnscrypt-proxy** | `dnscrypt-proxy` | No | `dnscrypt-proxy` | `dnscrypt-proxy` |
| **BIND** | `bind` | No | `bind` | `named` |
| **dnsmasq** | `dnsmasq` | No | `dnsmasq` | `dnsmasq` |

### Comparison

| Feature | systemd-resolved | unbound | dnscrypt-proxy | BIND | dnsmasq |
|---------|-----------------|---------|---------------|------|---------|
| Type | Stub resolver | Recursive | Proxy/encrypted | Full DNS server | Forwarder |
| DNSSEC | ✅ | ✅ | ✅ | ✅ | ⚠️ Basic |
| DNS-over-HTTPS | ❌ | ⚠️ Plugin | ✅ Native | ❌ | ❌ |
| DNS-over-TLS | ✅ | ✅ | ✅ | ❌ | ❌ |
| DNSCrypt | ❌ | ❌ | ✅ | ❌ | ❌ |
| Complexity | Low | Medium | Medium | High | Low |
| Caching | ✅ | ✅ | ✅ | ✅ | ✅ |
| DHCP server | ❌ | ❌ | ❌ | ❌ | ✅ |
| Privacy focus | Medium | High | ✅ Highest | Low | Low |
| Best for | Default/simple | Privacy + validation | Max DNS privacy | DNS hosting | Home LAN |

### Recommendation

- **systemd-resolved** for most users — simple, built-in, works out-of-the-box.
- **dnscrypt-proxy** for maximum DNS privacy — encrypts all queries, supports anonymized relays.
- **unbound** for privacy with DNSSEC validation — recursive resolver that doesn't rely on upstream DNS.

---

## 21. Arch Rusty Security Suite

### Options

| Option | Value | Default |
|--------|-------|---------|
| **No (Standard)** | `no` | No |
| **Yes (Recommended)** | `yes` | ✅ Yes |

### What It Is

The [Arch Rusty Security Suite](https://github.com/tilas01/arch-guides-dynamic) by **tilas01** is a collection of security tools written in Rust, providing:

- **Libre OTP** — TOTP-based two-factor authentication for login, boot, and SSH
- **Input Guard** — Anti-RubberDucky USB HID device sandboxing
- **ISO Verification** — Verify the integrity of the Arch ISO used for installation

When enabled, the suite is downloaded from GitHub releases with SHA256 checksum verification:

```bash
SUITE_VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64"
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64.sha256"
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256
chmod +x arch-rusty-security-suite-linux-x86_64
cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite
```

---

## 22. Security Tools (OTP & Input Guard)

### Options (when suite is enabled)

| Option | Value | Default |
|--------|-------|---------|
| **None** | `none` | ✅ Yes |
| **Libre OTP (2FA Boot/Login/SSH)** | `libre-otp` | No |
| **Input Guard (Anti-RubberDucky)** | `anti-ducky` | No |
| **Both OTP & Input Guard** | `both` | No |

### Libre OTP

Adds TOTP (Time-based One-Time Password) two-factor authentication. After setup, you scan a QR code with an authenticator app (Google Authenticator, Aegis, etc.) and must enter a 6-digit code in addition to your password.

**Setup:**
```bash
arch-rusty-security-suite otp --setup --algo sha1  # or sha256/sha512
```

**PAM integration (login):**
```bash
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/login
```

**PAM integration (boot/system-auth):**
```bash
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/system-auth
```

### Input Guard (Anti-RubberDucky)

Protects against malicious USB HID devices (Rubber Ducky, BadUSB, etc.) that inject keystrokes when plugged in. Input Guard monitors and sandboxes new USB HID devices.

**Setup:**
```bash
arch-rusty-security-suite input-guard --init

cat << 'SRV' > /etc/systemd/system/input-guard.service
[Unit]
Description=Arch Rusty Security Suite - Input Guard
After=sshd.service
Requires=sshd.service
[Service]
ExecStart=/usr/local/bin/arch-rusty-security-suite input-guard
Restart=always
User=root
[Install]
WantedBy=multi-user.target
SRV

systemctl enable input-guard.service
```

---

## 23. OTP Mode & Algorithm

### OTP Mode (when OTP is selected)

| Option | Value | Default | Where OTP Is Required |
|--------|-------|---------|----------------------|
| **Login Only** | `login` | ✅ Yes | `/etc/pam.d/login` |
| **Boot Only** | `boot` | No | `/etc/pam.d/system-auth` |
| **Both Boot & Login** | `both` | No | Both PAM files |

### OTP Algorithm

| Option | Value | Default | Security | Compatibility |
|--------|-------|---------|----------|---------------|
| **SHA1 (Compatible)** | `sha1` | ✅ Yes | Standard | ✅ All authenticator apps |
| **SHA256** | `sha256` | No | Better | ⚠️ Some apps don't support |
| **SHA512** | `sha512` | No | Best | ⚠️ Fewer apps support |

### Recommendation

- **SHA1** for maximum compatibility with authenticator apps (Google Authenticator, Aegis, etc.)
- **SHA256/SHA512** only if your authenticator app explicitly supports them (check first)
- **Login Only** is sufficient for most users — Boot OTP adds pre-boot 2FA which may complicate recovery

---

## 24. Kloak — Keystroke Anonymization

### Options

| Option | Value | Default |
|--------|-------|---------|
| **No** | `no` | ✅ Yes |
| **Yes** | `yes` | No |

### What It Does

[Kloak](https://github.com/vmonaco/kloak) by **vmonaco** randomizes the timing between keystrokes to prevent **keystroke biometric profiling** — where an attacker identifies you by your unique typing pattern, even if you use Tor or VPNs.

### Manual Setup

```bash
git clone https://github.com/vmonaco/kloak.git /opt/kloak
cd /opt/kloak && make && cp kloak /usr/local/bin/

cat << 'SRV' > /etc/systemd/system/kloak.service
[Unit]
Description=Kloak Keystroke Anonymizer
[Service]
ExecStart=/usr/local/bin/kloak
Restart=always
[Install]
WantedBy=multi-user.target
SRV

systemctl enable kloak.service
```

### Trade-offs

| Pros | Cons |
|------|------|
| Defeats keystroke biometric fingerprinting | Adds small input latency (~20-100ms) |
| Works system-wide | May feel sluggish for fast typists |
| Transparent to applications | Requires running as root |

---

## 25. Webhook Alerts

### Options

| Option | Value | Default |
|--------|-------|---------|
| **No** | `no` | ✅ Yes |
| **Yes** | `yes` | No |

### What It Does

Creates a systemd service that monitors for malicious binaries and sends alerts via webhook (e.g., Discord, Slack, or custom endpoint) when suspicious activity is detected.

---

## 26. Hardened SSH + OTP

### Options

| Option | Value | Default |
|--------|-------|---------|
| **No** | `no` | ✅ Yes |
| **Yes** | `yes` | No |

### What It Does

Installs and configures OpenSSH with security hardening:

1. **Installs openssh**
2. **Disables password authentication** — forces key-based auth only
3. **Disables root login** (if Root SSH = No) — prevents direct root SSH access
4. **Adds OTP to SSH** (if Libre OTP is enabled) — requires 2FA for SSH sessions
5. **Enables sshd service**

### Manual Configuration

```bash
pacman -S --noconfirm openssh

# Disable password authentication (key-only)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Disable root login
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config

# Add OTP to SSH (if using Libre OTP)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sshd

systemctl enable sshd.service
```

### Recommendation

**Enable** if you need SSH access to your machine. The hardening settings (no password auth, no root login) are essential security practices.

---

## 27. Anti-Evil Maid

### Options

| Option | Value | Default |
|--------|-------|---------|
| **No** | `no` | ✅ Yes |
| **Yes (Decoy environment)** | `yes` | No |

### What It Does

Creates decoy kernel entries and backup kernels to detect physical tampering. If an attacker modifies your boot environment ("evil maid" attack), the decoy files can reveal the compromise.

```bash
mkdir -p /boot/fake_efi
cp /boot/vmlinuz-linux-lts /boot/fake_efi/vmlinuz-linux 2>/dev/null || true
```

### Trade-offs

| Pros | Cons |
|------|------|
| Detects physical boot tampering | Not foolproof against sophisticated attackers |
| Low overhead | Requires manual verification |
| Works with Secure Boot | Decoys may confuse bootloader |

---

## 28. Arch ISO Pre-Install

### Options

| Option | Value | Default |
|--------|-------|---------|
| **None (Local)** | `none` | ✅ Yes |
| **Start SSHd** | `ssh` | No |
| **SSHd + curl** | `ssh_curl` | No |

### What Each Does

**None:** Standard local installation — type commands directly on the machine.

**Start SSHd:** Starts the SSH daemon on the Arch ISO so you can run the install remotely from another machine:
```bash
systemctl start sshd
echo 'root:arch' | chpasswd
ip addr  # Note the IP address, then SSH from another machine
```

**SSHd + curl:** Same as above, also installs curl for downloading scripts:
```bash
pacman -Sy --noconfirm curl
systemctl start sshd
echo 'root:arch' | chpasswd
ip addr
```

### Recommendation

**None** for direct installation. **SSHd** if you want to type commands from a comfortable machine with copy-paste support.

---

## 29. Output Format

### Options

| Option | Value | Default |
|--------|-------|---------|
| **Both (Guide + Script)** | `both` | ✅ Yes |
| **Markdown Guide** | `markdown` | No |
| **Bash Script** | `script` | No |

### What Each Produces

**Both:** Generates a human-readable Markdown guide AND an executable Bash script. Best for learning and automation.

**Markdown Guide:** Step-by-step instructions with code blocks. Read each command, understand it, and type it manually. Best for learning.

**Bash Script:** Automated `set -e` script that runs all commands in sequence. Uses `cat << 'EOF'` for chroot operations. Best for repeat installations.

### Recommendation

**Both** — read the Markdown guide to understand what's happening, use the script for automation.

---

## Compatibility Matrix

### Firmware × Bootloader

| | UKI Custom | UKI Shim | systemd-boot | GRUB |
|---|-----------|----------|--------------|------|
| **UEFI** | ✅ | ✅ | ✅ | ✅ |
| **BIOS** | ❌ | ❌ | ❌ | ✅ |

### Firmware × Encryption

| | Unencrypted | LUKS1 | LUKS2 | LVM-on-LUKS2 |
|---|------------|-------|-------|---------------|
| **UEFI** | ✅ | ✅ | ✅ | ✅ |
| **BIOS** | ✅ | ✅ | ❌ | ❌ |

### Desktop × Display Server

| | Wayland | Xorg | Auto |
|---|---------|------|------|
| **None** | N/A | N/A | N/A |
| **GNOME** | ✅ (Recommended) | ✅ | → Wayland |
| **KDE** | ✅ (Recommended) | ✅ | → Wayland |
| **DWM** | ❌ BROKEN | ✅ (Required) | → Xorg |
| **Dusky** | ❌ BROKEN | ✅ (Required) | → Xorg |

### GPU × Software Type (Nvidia-specific)

| | Libre | Open Source | Proprietary | VM |
|---|------|------------|------------|-----|
| **AMD** | `mesa amdgpu vulkan-radeon` | Same | Same | Same |
| **Intel** | `mesa intel vulkan-intel` | Same | Same | Same |
| **Nvidia** | `nouveau` (slow) | `nouveau` (slow) | `nvidia nvidia-utils` (full) | N/A |
| **VM** | `spice-vdagent qxl` | Same | Same | Same |

---

## Recommended Configurations

### 🟢 Maximum Security (Recommended)

| Setting | Value |
|---------|-------|
| Firmware | UEFI |
| File System | BTRFS |
| Encryption | LUKS2 |
| Init System | systemd |
| Bootloader | UKI + Custom Keys |
| Main Kernel | linux-hardened |
| Backup Kernel | linux-zen |
| Software Type | Fully Libre |
| Security Suite | Yes |
| Security Tools | Both OTP & Input Guard |
| Kloak | Yes |
| Hardened SSH | Yes |
| DNS | dnscrypt-proxy |

### 🟡 Balanced Desktop

| Setting | Value |
|---------|-------|
| Firmware | UEFI |
| File System | BTRFS |
| Encryption | LUKS2 |
| Init System | systemd |
| Bootloader | systemd-boot |
| Main Kernel | linux |
| Backup Kernel | linux-lts |
| Software Type | Open Source + Proprietary |
| Desktop | KDE Plasma |
| Display Server | Auto (Wayland) |
| DNS | systemd-resolved |

### 🔵 Gaming Setup

| Setting | Value |
|---------|-------|
| Firmware | UEFI |
| File System | BTRFS |
| Encryption | LUKS2 |
| Init System | systemd |
| Bootloader | systemd-boot |
| Main Kernel | linux-zen |
| Backup Kernel | linux |
| Software Type | Open Source + Proprietary |
| Desktop | KDE Plasma |
| Display Server | Wayland |
| DNS | systemd-resolved |

### 🟤 Legacy Hardware

| Setting | Value |
|---------|-------|
| Firmware | BIOS |
| File System | Ext4 |
| Encryption | LUKS1 |
| Init System | busybox |
| Bootloader | GRUB |
| Main Kernel | linux-lts |
| Backup Kernel | linux |
| Software Type | Open Source + Firmware |
| Desktop | DWM or None |
| Display Server | Xorg |
| DNS | systemd-resolved |

### ⚫ Minimal Server

| Setting | Value |
|---------|-------|
| Firmware | UEFI |
| File System | XFS |
| Encryption | LUKS2 |
| Init System | systemd |
| Bootloader | systemd-boot |
| Main Kernel | linux-lts |
| Backup Kernel | linux |
| Software Type | Fully Libre |
| Desktop | None (TTY) |
| Swap | 4GB |
| DNS | unbound |

---

*Part of the [Arch Guides Dynamic](https://github.com/tilas01/arch-guides-dynamic) wiki by [tilas01](https://github.com/tilas01).*
*Dusky OS by [dusklinux](https://github.com/dusklinux/dusky). Kloak by [vmonaco](https://github.com/vmonaco/kloak).*
