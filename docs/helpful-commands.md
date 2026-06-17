# Arch Command Cheatsheet

> ⚠️ AI-Assisted Reference. Always verify commands with the [Official Arch Wiki](https://wiki.archlinux.org).

---

## Table of Contents
1. [Pacman Package Manager](#-pacman-package-manager)
2. [AUR Helper (paru)](#-aur-helper-paru)
3. [Systemd & Services](#-systemd--services)
4. [Disk & Filesystem](#-disk--filesystem)
5. [Permissions & Users](#-permissions--users)
6. [Security Auditing](#-security-auditing)
7. [DuskyOS Shortcuts & Commands](#-duskos-shortcuts--commands)
8. [DWM Window Manager Cheatsheet](#-dwm-window-manager-cheatsheet)
9. [GNOME Keyboard Shortcuts](#-gnome-keyboard-shortcuts)
10. [KDE Plasma Shortcuts](#-kde-plasma-shortcuts)
11. [Helpful Post-Install Apps](#-helpful-post-install-apps-reference)

---

## 📦 Pacman Package Manager

| Command | Description |
|---------|-------------|
| `pacman -Syu` | Sync mirrors & upgrade all packages |
| `pacman -S <pkg>` | Install a package |
| `pacman -Ss <query>` | Search for a package |
| `pacman -Rs <pkg>` | Remove package + unneeded deps |
| `pacman -Rns <pkg>` | Remove package + deps + config files |
| `pacman -Sc` | Clear package cache |
| `pacman -Scc` | Clear ALL package cache |
| `pacman -Qe` | List explicitly installed packages |
| `pacman -Qq` | List all installed packages |
| `pacman -Qi <pkg>` | Info about installed package |
| `pacman -Qo <file>` | Find which package owns a file |
| `pacman -F <file>` | Find which package provides a file (from repos) |
| `pacman -U <pkg.tar.zst>` | Install from local file |

### doas / sudo equivalents
- If using **Libre (doas)**: replace `sudo pacman` with `doas pacman`
- If using **sudo**: `sudo pacman -Syu`

---

## 🔧 AUR Helper (paru)

| Command | Description |
|---------|-------------|
| `paru -S <pkg>` | Install from AUR |
| `paru -Syu` | Update system + AUR |
| `paru -Rns <pkg>` | Remove + deps |
| `paru -Sc` | Clean paru cache |
| `paru -Ss <query>` | Search AUR |
| `paru -Qi <pkg>` | Package info |

---

## 🔧 Systemd & Services

| Command | Description |
|---------|-------------|
| `systemctl start <svc>` | Start a service |
| `systemctl stop <svc>` | Stop a service |
| `systemctl enable <svc>` | Enable on boot |
| `systemctl disable <svc>` | Disable on boot |
| `systemctl enable --now <svc>` | Enable + start immediately |
| `systemctl status <svc>` | Check service status |
| `systemctl list-units --failed` | Show failed units |
| `journalctl -p 3 -xb` | Show errors from current boot |
| `journalctl -u <svc> -f` | Follow service logs |
| `journalctl --boot=-1` | View last boot's logs |

---

## 💾 Disk & Filesystem

```bash
lsblk                            # List all block devices
lsblk -f                         # List with filesystem types
fdisk -l                         # Detailed disk info
df -h                            # Disk usage (human readable)
du -sh <dir>                     # Directory size
btrfs filesystem show            # Show BTRFS filesystems
btrfs subvolume list /           # List BTRFS subvolumes
snapper -c root list             # BTRFS snapshots
snapper -c root create --description "Pre-update" # Manual snapshot
```

---

## 🛡️ Permissions & Users

```bash
useradd -m -G wheel -s /bin/bash <user>   # Add user with sudo/doas
passwd <user>                              # Set password
usermod -aG <group> <user>                 # Add to group
groups <user>                              # List user's groups
chown -R <user>:<group> <dir>             # Change ownership
chmod 755 <dir>                            # Set directory permissions
chmod 644 <file>                           # Set file permissions

# doas config (libre systems)
echo "permit persist :wheel" > /etc/doas.conf

# sudo config
echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel
```

---

## 🔒 Security Auditing

```bash
bootctl status                                          # Check Secure Boot status
sbverify --list /efi/EFI/arch/secure-boot-linux.efi    # Verify UKI signature
cryptsetup luksDump /dev/sdX2                           # LUKS partition info
sha256sum <file>                                        # Check file hash
gpg --verify <file>.asc <file>                          # Verify GPG signature
ss -tulnp                                               # Show open ports
systemctl list-units --failed                           # Check failed services
```

---

## 🎨 DuskyOS Shortcuts & Commands

> [Dusky OS by dusklinux](https://github.com/dusklinux/dusky) | [YouTube Demo](https://www.youtube.com/watch?v=JmgvSdEIK8c)
>
> Dusky OS is based on a custom X11/Xorg environment with bspwm or similar tiling window manager.

### Window Management
| Keybinding | Action |
|------------|--------|
| `Super + Enter` | Open terminal (Alacritty/kitty) |
| `Super + d` | App launcher (Rofi/dmenu) |
| `Super + Shift + q` | Close focused window |
| `Super + 1-9` | Switch to workspace 1-9 |
| `Super + Shift + 1-9` | Move window to workspace 1-9 |
| `Super + Space` | Toggle floating mode |
| `Super + f` | Toggle fullscreen |
| `Super + Tab` | Cycle windows |
| `Super + h/j/k/l` | Focus left/down/up/right (vim keys) |
| `Super + Shift + h/j/k/l` | Move window |
| `Super + Shift + r` | Reload / restart window manager |
| `Super + Shift + e` | Exit / logout |

### Applications
| Keybinding | Action |
|------------|--------|
| `Super + b` | Open browser |
| `Super + e` | Open file manager |
| `Super + n` | Open Neovim editor |
| `Super + s` | Screenshot tool |
| `Super + m` | Audio mixer |
| `Print` | Screenshot |

### System Info
```bash
neofetch / pfetch         # System info
htop                      # Process monitor
free -h                   # Memory usage
lspci                     # PCI hardware list
lsusb                     # USB device list
uname -a                  # Kernel info
cat /etc/os-release       # OS info
xrandr                    # Display configuration (X11)
```

### Theming / Customization
| Component | Tool Used |
|-----------|-----------|
| WM | bspwm/openbox (see Dusky repo) |
| Status Bar | polybar / eww |
| Compositor | picom |
| Terminal | Alacritty / kitty |
| Launcher | Rofi / dmenu |
| Wallpaper | nitrogen / feh |
| Notification | dunst |
| Theme | Tokyo Night / custom GTK |
| Icons | Papirus Dark |
| Fonts | JetBrains Mono / Nerd Font |

```bash
# Change wallpaper
nitrogen --set-scaled <path/to/image.png>

# Restart picom (compositor)
pkill picom && picom --daemon

# Reload polybar
pkill polybar && $HOME/.config/polybar/launch.sh
```

---

## 🪟 DWM Window Manager Cheatsheet

> [DWM by suckless.org](https://dwm.suckless.org/) — Built from source, configured via `config.h`

### Essential Keybindings (Default)
| Keybinding | Action |
|------------|--------|
| `Alt + Shift + Enter` | Open terminal (st) |
| `Alt + p` | dmenu launcher |
| `Alt + Shift + c` | Close focused window |
| `Alt + b` | Toggle statusbar |
| `Alt + 1-9` | Switch to tag 1-9 |
| `Alt + Shift + 1-9` | Move window to tag 1-9 |
| `Alt + h / l` | Resize master area |
| `Alt + Return` | Move window to master |
| `Alt + j / k` | Focus next/prev window |
| `Alt + Shift + q` | Quit DWM |
| `Alt + t` | Tiling layout |
| `Alt + f` | Floating layout |
| `Alt + m` | Monocle (fullscreen) layout |

### Building DWM
```bash
git clone https://git.suckless.org/dwm /usr/local/src/dwm
cd /usr/local/src/dwm
# Edit config.h to customize
cp config.def.h config.h
vim config.h
make install
```

---

## 🌀 GNOME Keyboard Shortcuts

| Keybinding | Action |
|------------|--------|
| `Super` | Activities overview |
| `Super + A` | Applications grid |
| `Super + 1-9` | Switch to workspace |
| `Super + Shift + 1-9` | Move window to workspace |
| `Super + L` | Lock screen |
| `Super + D` | Hide all windows (show desktop) |
| `Alt + F2` | Run command |
| `Ctrl + Alt + T` | Open terminal (if configured) |
| `Alt + Tab` | Switch applications |
| `Super + Tab` | Switch applications (GNOME style) |
| `PrtSc` | Screenshot |
| `Shift + PrtSc` | Screenshot area |

### GNOME Tweaks
```bash
gnome-tweaks           # Open GUI tweaks tool
gsettings list-schemas # List all GNOME settings
dconf-editor           # Advanced settings editor
gnome-extensions       # Manage extensions
```

---

## 🔵 KDE Plasma Shortcuts

| Keybinding | Action |
|------------|--------|
| `Super` | Application launcher |
| `Alt + F2` | KRunner (run command) |
| `Super + 1-9` | Switch to virtual desktop |
| `Super + L` | Lock screen |
| `Ctrl + Alt + T` | Open Konsole |
| `Super + E` | Open Dolphin file manager |
| `Alt + Tab` | Switch windows |
| `Super + Tab` | Switch desktops |
| `Ctrl + F12` | Show desktop |
| `PrtSc` | Screenshot (Spectacle) |

---

## 📱 Helpful Post-Install Apps Reference

| App | Install | Description | Libre? |
|-----|---------|-------------|--------|
| [paru](https://github.com/Morganamilo/paru) | `yay -S paru` | AUR helper (Rust) | ✅ |
| [Firefox](https://mozilla.org) | `pacman -S firefox` | Web browser | ⚠️ non-libre firmware |
| [LibreWolf](https://librewolf.net) | `paru -S librewolf` | Privacy Firefox fork | ✅ |
| [Tor Browser](https://torproject.org) | `paru -S tor-browser` | Anonymity browser | ✅ |
| [Signal](https://signal.org) | `paru -S signal-desktop` | E2E messaging | ⚠️ some non-libre |
| [KeePassXC](https://keepassxc.org) | `pacman -S keepassxc` | Password manager | ✅ |
| [Neovim](https://neovim.io) | `pacman -S neovim` | Text editor | ✅ |
| [Alacritty](https://alacritty.org) | `pacman -S alacritty` | GPU terminal | ✅ |
| [VSCodium](https://vscodium.com) | `paru -S vscodium` | Code editor | ✅ |
| [mpv](https://mpv.io) | `pacman -S mpv` | Media player | ✅ |
| [OBS Studio](https://obsproject.com) | `pacman -S obs-studio` | Streaming/recording | ✅ |
| [Flatpak](https://flatpak.org) | `pacman -S flatpak` | Universal app format | ⚠️ may include proprietary |

> ✅ = Fully libre/open source | ⚠️ = Free to use but may include non-libre components
