# Commands, Cheatsheets & App Reference

> Comprehensive command reference for Arch Linux, all window manager keyboard shortcuts, and post-install application details.

---

## Table of Contents

- [Essential Arch Linux Commands](#essential-arch-linux-commands)
- [Package Management — pacman](#package-management--pacman)
- [AUR Helper — paru](#aur-helper--paru)
- [System Information](#system-information)
- [Service Management — systemctl](#service-management--systemctl)
- [Journal & Logs](#journal--logs)
- [BTRFS Commands](#btrfs-commands)
- [Snapper Snapshots](#snapper-snapshots)
- [Encryption — LUKS & LVM](#encryption--luks--lvm)
- [Bootloader Commands](#bootloader-commands)
- [Privilege Escalation — doas vs sudo](#privilege-escalation--doas-vs-sudo)
- [Network Commands](#network-commands)
- [User & Disk Management](#user--disk-management)
- [Window Manager Cheatsheets](#window-manager-cheatsheets)
- [GNOME Shortcuts](#gnome-shortcuts)
- [KDE Plasma Shortcuts](#kde-plasma-shortcuts)
- [DWM Shortcuts](#dwm-shortcuts)
- [Dusky OS Shortcuts](#dusky-os-shortcuts)
- [Post-Install Apps Reference](#post-install-apps-reference)
- [DNS Configuration Reference](#dns-configuration-reference)
- [Security Suite Commands](#security-suite-commands)
- [System Maintenance](#system-maintenance)

---

## Essential Arch Linux Commands

### Package Management — pacman

| Command | Description |
|---------|-------------|
| `pacman -Syu` | Full system upgrade (sync + update) |
| `pacman -S <pkg>` | Install a package |
| `pacman -S --noconfirm <pkg>` | Install without confirmation |
| `pacman -R <pkg>` | Remove a package (keep dependencies) |
| `pacman -Rns <pkg>` | Remove package + unused deps + configs |
| `pacman -Ss <query>` | Search for packages in repositories |
| `pacman -Qs <query>` | Search installed packages |
| `pacman -Qi <pkg>` | Show detailed info about installed package |
| `pacman -Ql <pkg>` | List all files owned by a package |
| `pacman -Qo /path/to/file` | Find which package owns a file |
| `pacman -Sc` | Remove cached packages (keep current) |
| `pacman -Scc` | Remove ALL cached packages |
| `pacman -Qtdq` | List orphaned packages (unused deps) |
| `pacman -Rns $(pacman -Qtdq)` | Remove all orphaned packages |
| `pacman -Fy` | Sync file database |
| `pacman -F <filename>` | Find which package provides a file |
| `pacman -U /path/to/pkg.tar.zst` | Install local package file |

### AUR Helper — paru

| Command | Description |
|---------|-------------|
| `paru -S <pkg>` | Install from AUR or official repos |
| `paru -Syu` | Full system + AUR upgrade |
| `paru -Ss <query>` | Search AUR + official repos |
| `paru -Rns <pkg>` | Remove package cleanly |
| `paru -Gc <pkg>` | Show AUR comments for a package |
| `paru -Gp <pkg>` | Print PKGBUILD |
| `paru -Sua` | Update only AUR packages |
| `paru --gendb` | Generate development package database |
| `paru -c` | Clean unneeded dependencies |

> **Note:** paru is a Rust-based AUR helper from [Morganamilo/paru](https://github.com/Morganamilo/paru). It's installed by default when the generator detects AUR packages are needed.

---

## System Information

| Command | Description |
|---------|-------------|
| `uname -r` | Show kernel version |
| `uname -a` | Show all system info |
| `lsblk` | List block devices (disks/partitions) |
| `lsblk -f` | List with filesystem types and UUIDs |
| `lscpu` | CPU architecture details |
| `lspci` | List PCI devices (GPU, network, etc.) |
| `lspci -k` | PCI devices with kernel drivers |
| `lsusb` | List USB devices |
| `ip addr` | Show network interfaces and IPs |
| `free -h` | Memory usage (human-readable) |
| `df -h` | Disk space usage |
| `du -sh /path` | Directory size |
| `findmnt` | Show mounted filesystems as tree |
| `blkid` | Show block device UUIDs and types |
| `cat /proc/cpuinfo` | Detailed CPU info |
| `cat /proc/meminfo` | Detailed memory info |
| `hostnamectl` | Hostname and OS info |
| `timedatectl` | Time/date settings and NTP status |

---

## Service Management — systemctl

| Command | Description |
|---------|-------------|
| `systemctl start <service>` | Start a service now |
| `systemctl stop <service>` | Stop a service now |
| `systemctl restart <service>` | Restart a service |
| `systemctl enable <service>` | Enable at boot |
| `systemctl disable <service>` | Disable at boot |
| `systemctl enable --now <service>` | Enable and start immediately |
| `systemctl status <service>` | Show service status |
| `systemctl list-units --type=service` | List all loaded services |
| `systemctl list-unit-files --state=enabled` | List enabled services |
| `systemctl --failed` | List failed services |
| `systemctl daemon-reload` | Reload service files after changes |
| `systemctl --user start <service>` | Start a user-level service |

---

## Journal & Logs

| Command | Description |
|---------|-------------|
| `journalctl -xe` | Recent logs with extra context |
| `journalctl -b` | Logs from current boot |
| `journalctl -b -1` | Logs from previous boot |
| `journalctl --since "1 hour ago"` | Logs from last hour |
| `journalctl --since "2024-01-01"` | Logs since date |
| `journalctl -u <service>` | Logs for specific service |
| `journalctl -f` | Follow log output (like tail -f) |
| `journalctl -p err` | Show only errors |
| `journalctl --disk-usage` | Check journal disk usage |
| `journalctl --vacuum-size=500M` | Limit journal to 500MB |
| `dmesg` | Kernel ring buffer messages |
| `dmesg -w` | Follow kernel messages |

---

## BTRFS Commands

> These apply when BTRFS filesystem is selected in the generator. BTRFS installs `btrfs-progs` and `snapper`.

### Subvolume Management

| Command | Description |
|---------|-------------|
| `btrfs subvolume list /` | List all subvolumes |
| `btrfs subvolume create /mnt/@name` | Create a subvolume |
| `btrfs subvolume delete /mnt/@name` | Delete a subvolume |
| `btrfs subvolume snapshot /source /dest` | Create a snapshot |
| `btrfs subvolume snapshot -r /source /dest` | Create read-only snapshot |
| `btrfs subvolume show /path` | Show subvolume details |

### Filesystem Operations

| Command | Description |
|---------|-------------|
| `btrfs filesystem show` | Show filesystem info |
| `btrfs filesystem df /` | Show space allocation |
| `btrfs filesystem usage /` | Detailed space usage |
| `btrfs balance start /` | Rebalance data across devices |
| `btrfs scrub start /` | Verify data integrity |
| `btrfs scrub status /` | Check scrub progress |

### Generator BTRFS Layout

The generator creates these subvolumes with mount options `noatime,compress=zstd,space_cache=v2`:

```
@           → /          (root)
@home       → /home      (user data)
@var        → /var       (logs, cache)
@snapshots  → /.snapshots (snapper snapshots)
```

---

## Snapper Snapshots

> Snapper is automatically configured when BTRFS is selected.

| Command | Description |
|---------|-------------|
| `snapper -c root create-config /` | Create initial config (done by generator) |
| `snapper create -d "description"` | Create manual snapshot |
| `snapper list` | List all snapshots |
| `snapper list --type single` | List single snapshots |
| `snapper list --type pre-post` | List pre/post pairs |
| `snapper delete <number>` | Delete a snapshot |
| `snapper undochange <num1>..<num2>` | Undo changes between snapshots |
| `snapper rollback <number>` | Rollback to a snapshot |
| `snapper diff <num1>..<num2>` | Show file differences |
| `snapper status <num1>..<num2>` | Show changed files |

### Automatic Timers

The generator enables:
- `snapper-timeline.timer` — Creates hourly snapshots
- `snapper-cleanup.timer` — Cleans old snapshots per retention policy

---

## Encryption — LUKS & LVM

### LUKS Commands

| Command | Description |
|---------|-------------|
| `cryptsetup luksFormat /dev/sdX` | Format partition with LUKS |
| `cryptsetup open /dev/sdX cryptroot` | Open/unlock encrypted volume |
| `cryptsetup close cryptroot` | Close/lock encrypted volume |
| `cryptsetup luksAddKey /dev/sdX` | Add a new passphrase |
| `cryptsetup luksRemoveKey /dev/sdX` | Remove a passphrase |
| `cryptsetup luksChangeKey /dev/sdX` | Change existing passphrase |
| `cryptsetup luksDump /dev/sdX` | Show LUKS header info |
| `cryptsetup luksHeaderBackup /dev/sdX --header-backup-file backup.img` | Backup LUKS header |
| `cryptsetup luksHeaderRestore /dev/sdX --header-backup-file backup.img` | Restore LUKS header |
| `cryptsetup isLuks /dev/sdX` | Check if partition is LUKS |

### LVM Commands

| Command | Description |
|---------|-------------|
| `pvcreate /dev/mapper/cryptlvm` | Create physical volume |
| `vgcreate vg0 /dev/mapper/cryptlvm` | Create volume group |
| `lvcreate -l 100%FREE vg0 -n root` | Create logical volume (all space) |
| `lvcreate -L 50G vg0 -n root` | Create logical volume (specific size) |
| `lvextend -l +100%FREE /dev/vg0/root` | Extend volume to use all free space |
| `pvs` | List physical volumes |
| `vgs` | List volume groups |
| `lvs` | List logical volumes |
| `vgdisplay` | Detailed volume group info |
| `lvdisplay` | Detailed logical volume info |

---

## Bootloader Commands

### GRUB

| Command | Description |
|---------|-------------|
| `grub-install --target=x86_64-efi --efi-directory=/efi` | Install GRUB (UEFI) |
| `grub-install --target=i386-pc /dev/sdX` | Install GRUB (BIOS) |
| `grub-mkconfig -o /boot/grub/grub.cfg` | Generate GRUB config |
| Edit `/etc/default/grub` | Change GRUB settings |

### systemd-boot

| Command | Description |
|---------|-------------|
| `bootctl install --esp-path=/efi` | Install systemd-boot |
| `bootctl update` | Update systemd-boot |
| `bootctl status` | Show boot status |
| Edit `/efi/loader/loader.conf` | Configure default entry, timeout |
| Edit `/efi/loader/entries/*.conf` | Configure boot entries |

### UKI (Unified Kernel Image)

| Command | Description |
|---------|-------------|
| `mkinitcpio -P` | Regenerate all initramfs/UKI images |
| `sbsign --key db.key --cert db.crt --output signed.efi unsigned.efi` | Sign an EFI binary |
| `sbverify --cert db.crt /efi/EFI/Linux/arch.efi` | Verify signature |

### Secure Boot

| Command | Description |
|---------|-------------|
| `sbctl create-keys` | Create Secure Boot keys |
| `sbctl enroll-keys` | Enroll keys in firmware |
| `sbctl sign /path/to/efi` | Sign an EFI binary |
| `sbctl verify` | Verify all signed files |
| `sbctl status` | Show Secure Boot status |

---

## Privilege Escalation — doas vs sudo

### Libre Mode: doas (opendoas)

The generator uses `opendoas` for fully libre setups.

| doas Command | Equivalent sudo | Description |
|-------------|----------------|-------------|
| `doas pacman -Syu` | `sudo pacman -Syu` | Run as root |
| `doas -s` | `sudo -i` | Root shell |
| `doas -u user cmd` | `sudo -u user cmd` | Run as different user |

**Configuration** — `/etc/doas.conf`:

```bash
# Basic config (generated)
permit persist :wheel

# Additional examples
permit nopass :wheel as root cmd pacman   # No password for pacman
permit nopass root                        # Root can doas without password
```

The generator also creates a symlink: `ln -s /usr/bin/doas /usr/bin/sudo` for compatibility.

### Standard Mode: sudo

| Command | Description |
|---------|-------------|
| `sudo <command>` | Run command as root |
| `sudo -i` | Interactive root shell |
| `sudo -u <user> <cmd>` | Run as another user |
| `visudo` | Safely edit sudoers |
| `sudo -l` | List allowed commands |

**Configuration** — `/etc/sudoers.d/wheel`:

```bash
# Generated config
%wheel ALL=(ALL:ALL) ALL
```

---

## Network Commands

| Command | Description |
|---------|-------------|
| `ip addr` | Show IP addresses |
| `ip link` | Show network interfaces |
| `ip link set <iface> up/down` | Enable/disable interface |
| `nmcli device status` | NetworkManager device list |
| `nmcli connection show` | Show saved connections |
| `nmcli device wifi list` | Scan for Wi-Fi networks |
| `nmcli device wifi connect <SSID> password <pass>` | Connect to Wi-Fi |
| `ping -c 4 archlinux.org` | Test connectivity |
| `ss -tuln` | Show listening ports |
| `curl -I https://archlinux.org` | HTTP header check |
| `dig archlinux.org` | DNS lookup |
| `resolvectl status` | DNS resolver status (systemd-resolved) |

---

## User & Disk Management

### User Management

| Command | Description |
|---------|-------------|
| `useradd -m -G wheel -s /bin/bash <user>` | Create user with home dir in wheel group |
| `userdel -r <user>` | Delete user and home directory |
| `passwd <user>` | Set/change user password |
| `usermod -aG <group> <user>` | Add user to group |
| `groups <user>` | Show user's groups |
| `id <user>` | Show user UID/GID/groups |
| `chsh -s /bin/zsh <user>` | Change default shell |

### Disk Management

| Command | Description |
|---------|-------------|
| `lsblk` | List block devices |
| `lsblk -f` | With filesystem info |
| `fdisk -l` | List all partitions |
| `sgdisk -Z /dev/sdX` | Zap (destroy) all partition data |
| `sgdisk -n 1:0:+512M -t 1:ef00 /dev/sdX` | Create EFI partition |
| `mount /dev/sdX /mnt` | Mount a partition |
| `umount /mnt` | Unmount |
| `findmnt` | Show mount tree |

---

## Window Manager Cheatsheets

### GNOME Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super` | Activities overview |
| `Super + A` | Application grid |
| `Super + L` | Lock screen |
| `Alt + Tab` | Switch between windows |
| `Alt + F2` | Run dialog |
| `Super + ←/→` | Snap window left/right |
| `Super + ↑` | Maximize window |
| `Super + ↓` | Restore/minimize window |
| `Ctrl + Alt + Delete` | Log out dialog |
| `Super + Page Up/Down` | Switch workspaces |
| `Super + Shift + Page Up/Down` | Move window to workspace |
| `Print` | Screenshot (full screen) |
| `Shift + Print` | Screenshot (selection) |
| `Alt + Print` | Screenshot (window) |
| `Super + E` | File manager |
| `Super + Tab` | Switch applications |
| `Ctrl + Alt + T` | Open terminal (if configured) |
| `Alt + F4` | Close window |
| `Super + H` | Minimize window |
| `Super + D` | Show desktop |

**GNOME-specific commands:**
```bash
# Install GNOME Tweaks for advanced settings
pacman -S gnome-tweaks

# Install extensions manager
pacman -S gnome-shell-extensions

# Reset GNOME settings
dconf reset -f /org/gnome/

# List all GNOME settings
gsettings list-recursively
```

### KDE Plasma Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super / Meta` | Application launcher |
| `Meta + E` | File manager (Dolphin) |
| `Alt + Tab` | Window switching |
| `Meta + ←/→` | Snap window left/right |
| `Meta + ↑` | Maximize window |
| `Meta + ↓` | Minimize window |
| `Ctrl + F1-F4` | Switch virtual desktop 1-4 |
| `Meta + L` | Lock screen |
| `Print` | Screenshot (Spectacle) |
| `Meta + Print` | Active window screenshot |
| `Shift + Print` | Rectangular region screenshot |
| `Meta + D` | Show desktop |
| `Alt + F4` | Close window |
| `Alt + F2` | KRunner (command launcher) |
| `Meta + Tab` | Task switcher (alternative) |
| `Ctrl + Alt + Delete` | Log out / shutdown |
| `Meta + Shift + ←/→` | Move window to another desktop |
| `Meta + PgUp/PgDn` | Switch activity |

**KDE-specific commands:**
```bash
# KDE system settings from terminal
systemsettings

# Restart KWin (window manager)
kwin_x11 --replace &   # Xorg
kwin_wayland --replace & # Wayland

# Restart Plasma shell
plasmashell --replace &

# KDE file indexer
balooctl status
balooctl disable  # Disable file indexing
```

### DWM Shortcuts

> DWM (Dynamic Window Manager) from [suckless.org](https://dwm.suckless.org/). Default Mod key is usually `Alt` (`Mod1`) or `Super` (`Mod4`).

| Shortcut | Action |
|----------|--------|
| `Mod + Enter` | Open terminal (`st`) |
| `Mod + p` | Open dmenu (application launcher) |
| `Mod + j` | Focus next window |
| `Mod + k` | Focus previous window |
| `Mod + h` | Decrease master area |
| `Mod + l` | Increase master area |
| `Mod + Return` | Promote window to master |
| `Mod + Shift + c` | Close focused window |
| `Mod + t` | Tiled layout |
| `Mod + f` | Floating layout |
| `Mod + m` | Monocle layout |
| `Mod + Space` | Toggle between layouts |
| `Mod + Shift + Space` | Toggle floating for window |
| `Mod + 1-9` | Switch to tag 1-9 |
| `Mod + Shift + 1-9` | Move window to tag 1-9 |
| `Mod + 0` | View all tags |
| `Mod + Shift + 0` | Apply all tags to window |
| `Mod + i` | Increase master count |
| `Mod + d` | Decrease master count |
| `Mod + b` | Toggle status bar |
| `Mod + Tab` | View previous tag |
| `Mod + Shift + q` | Quit DWM |
| `Mod + Mouse1` | Move floating window |
| `Mod + Mouse3` | Resize floating window |

**DWM installation (manual):**
```bash
pacman -S xorg-server xorg-xinit base-devel libx11 libxinerama libxft
git clone https://git.suckless.org/dwm /usr/local/src/dwm
cd /usr/local/src/dwm
make clean install
```

### Dusky OS Shortcuts

> **Dusky OS** by [dusklinux](https://github.com/dusklinux/dusky) — A DWM-based minimal desktop environment.
> For the complete Dusky cheatsheet, see the dedicated [Dusky OS Cheatsheet](dusky-cheatsheet.md).

Dusky inherits DWM's keybinding system. Core shortcuts:

| Shortcut | Action |
|----------|--------|
| `Mod + Enter` | Open terminal |
| `Mod + p` | Open application launcher |
| `Mod + Shift + c` | Close window |
| `Mod + Shift + q` | Quit Dusky |
| `Mod + 1-9` | Switch workspace/tag |
| `Mod + Shift + 1-9` | Move window to tag |
| `Mod + j/k` | Navigate windows |
| `Mod + h/l` | Resize master area |
| `Mod + t/f/m` | Tiled/Floating/Monocle layout |

> **Note:** Dusky may customize these defaults. Check the `config.h` in the [Dusky repository](https://github.com/dusklinux/dusky) for exact keybindings.

---

## Post-Install Apps Reference

Complete reference for every application available in the generator's post-install section.

| App | Install Method | Packages | Description | Libre Compatible | Link |
|-----|---------------|----------|-------------|-------------------|------|
| **paru** | AUR (manual build) | `paru` | Rust-based AUR helper, searches AUR + official repos | ✅ Fully | [GitHub](https://github.com/Morganamilo/paru) |
| **Firefox** | pacman | `firefox` | Mozilla web browser | ⚠️ Contains firmware blobs | [mozilla.org](https://mozilla.org/firefox/) |
| **LibreWolf** | AUR (via paru) | `librewolf` | Privacy-hardened Firefox fork, no telemetry | ✅ Fully | [librewolf.net](https://librewolf.net/) |
| **Tor Browser** | AUR (via paru) | `tor-browser` | Anonymity-focused browser via Tor network | ✅ Fully | [torproject.org](https://torproject.org/) |
| **Signal** | AUR (via paru) | `signal-desktop` | E2E encrypted messaging app | ⚠️ Connects to Signal servers | [signal.org](https://signal.org/) |
| **KeePassXC** | pacman | `keepassxc` | Offline password manager with TOTP support | ✅ Fully | [keepassxc.org](https://keepassxc.org/) |
| **Neovim** | pacman | `neovim git ripgrep fd` | Terminal text editor + dev search tools | ✅ Fully | [neovim.io](https://neovim.io/) |
| **Alacritty** | pacman | `alacritty` | GPU-accelerated terminal emulator | ✅ Fully | [alacritty.org](https://alacritty.org/) |
| **Zsh** | pacman | `zsh zsh-completions` | Modern shell (also runs `chsh -s /bin/zsh`) | ✅ Fully | — |
| **VSCodium** | AUR (via paru) | `vscodium` | VS Code without Microsoft telemetry | ✅ Fully | [vscodium.com](https://vscodium.com/) |
| **Thunar** | pacman | `thunar gvfs thunar-volman` | GTK file manager with volume management | ✅ Fully | — |
| **mpv** | pacman | `mpv` | Lightweight keyboard-driven media player | ✅ Fully | [mpv.io](https://mpv.io/) |
| **OBS Studio** | pacman | `obs-studio` | Screen recording and live streaming | ✅ Fully | [obsproject.com](https://obsproject.com/) |
| **Flatpak** | pacman | `flatpak` | Universal app packaging (adds Flathub remote) | ⚠️ Apps may be proprietary | — |

### Libre Compatibility Notes

- **Firefox:** Contains binary firmware blobs. For strict libre, use **LibreWolf** instead.
- **Signal:** The app itself is open source, but it connects to centralized Signal servers.
- **Flatpak:** The Flatpak runtime is open source, but Flathub hosts both open source and proprietary applications. Exercise discretion when installing Flatpak apps in a libre setup.

---

## DNS Configuration Reference

| DNS Option | Package | Service | Description |
|-----------|---------|---------|-------------|
| **systemd-resolved** | (built-in) | `systemd-resolved` | Default stub resolver, simple, integrates with systemd-networkd |
| **unbound** | `unbound` | `unbound` | Full recursive resolver with DNSSEC validation |
| **dnscrypt-proxy** | `dnscrypt-proxy` | `dnscrypt-proxy` | Encrypted DNS (DoH/DoT/DNSCrypt), anonymized relay support |
| **BIND** | `bind` | `named` | Full-featured authoritative + recursive DNS server |
| **dnsmasq** | `dnsmasq` | `dnsmasq` | Lightweight DNS forwarder + DHCP server, good for LANs |

### Quick Setup for Each

```bash
# systemd-resolved (default)
systemctl enable systemd-resolved

# unbound
pacman -S --noconfirm unbound
systemctl enable unbound

# dnscrypt-proxy
pacman -S --noconfirm dnscrypt-proxy
systemctl enable dnscrypt-proxy

# BIND
pacman -S --noconfirm bind
systemctl enable named

# dnsmasq
pacman -S --noconfirm dnsmasq
systemctl enable dnsmasq
```

---

## Security Suite Commands

> The **Arch Rusty Security Suite** by [tilas01](https://github.com/tilas01) provides advanced security tooling.

### Installation (from generator)

```bash
# Download latest release
SUITE_VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64"
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64.sha256"

# Verify integrity
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256

# Install
chmod +x arch-rusty-security-suite-linux-x86_64
cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite
```

### Suite Commands

| Command | Description |
|---------|-------------|
| `arch-rusty-security-suite otp --setup --algo sha1` | Setup OTP 2FA (SHA1 compatible) |
| `arch-rusty-security-suite otp --setup --algo sha256` | Setup OTP 2FA (SHA256) |
| `arch-rusty-security-suite otp --setup --algo sha512` | Setup OTP 2FA (SHA512) |
| `arch-rusty-security-suite input-guard --init` | Initialize Input Guard (anti-rubber-ducky) |
| `arch-rusty-security-suite verify-iso /dev/sr0` | Verify Arch ISO integrity |

### Kloak — Keystroke Anonymization

> Created by [vmonaco](https://github.com/vmonaco/kloak).

```bash
# Install
git clone https://github.com/vmonaco/kloak.git /opt/kloak
cd /opt/kloak && make && cp kloak /usr/local/bin/

# Create service
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

---

## System Maintenance

### Regular Maintenance Tasks

```bash
# Full system update
pacman -Syu
# Or with AUR:
paru -Syu

# Check for orphaned packages
pacman -Qtdq

# Remove orphans
pacman -Rns $(pacman -Qtdq)

# Clear package cache (keep last 3 versions)
paccache -r

# Clear all package cache
pacman -Scc

# Check failed services
systemctl --failed

# Check journal disk usage
journalctl --disk-usage

# Vacuum journal to 500MB
journalctl --vacuum-size=500M

# Update mirror list
reflector --latest 20 --protocol https --sort rate --save /etc/pacman.d/mirrorlist

# Check for .pacnew files (config changes from updates)
find / -name "*.pacnew" 2>/dev/null
find / -name "*.pacsave" 2>/dev/null

# Verify installed packages
pacman -Qkk  # Check file integrity

# Check for news before updating
# Visit: https://archlinux.org/news/
```

### BTRFS Maintenance

```bash
# Check filesystem integrity
btrfs scrub start /
btrfs scrub status /

# Rebalance (if space is fragmented)
btrfs balance start -dusage=50 /

# Check disk usage
btrfs filesystem usage /

# Defragment (optional, not usually needed)
btrfs filesystem defragment -r /
```

### Kernel Management

```bash
# List installed kernels
pacman -Qs linux | grep "^local"

# Check running kernel
uname -r

# Regenerate initramfs after kernel/mkinitcpio changes
mkinitcpio -P

# List available kernels to install
pacman -Ss '^linux$' '^linux-hardened$' '^linux-zen$' '^linux-lts$'
```

---

*Part of the [Arch Guides Dynamic](https://github.com/tilas01/arch-guides-dynamic) wiki by [tilas01](https://github.com/tilas01).*
*Dusky OS by [dusklinux](https://github.com/dusklinux/dusky). Kloak by [vmonaco](https://github.com/vmonaco/kloak).*
