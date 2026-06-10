# Generator Selections Guide

This section explains every dropdown selection in the Auto Script Generator so you can understand what they do and manually apply them if you prefer.

## Arch ISO Setup Utilities
- **None**: You are running the generator on your local machine and will type/paste commands into the Arch ISO.
- **Start SSHd**: Starts the SSH server on the Arch ISO and sets a temporary root password (`arch`), allowing you to SSH into the ISO from another machine to copy/paste the script.
- **Start SSHd + Download curl**: Also downloads `curl` via pacman on the live ISO.

## Output Format
- **Bash Script**: Generates a raw executable `.sh` file.
- **Markdown Guide**: Generates a human-readable tutorial.
- **Both**: Displays an interactive side-by-side view with live syntax highlighting.

## Hardware & Drivers
- **CPU Brand**: Installs `amd-ucode` or `intel-ucode`.
- **GPU Brand**: Installs `mesa`, `xf86-video-amdgpu`, `nvidia`, `nouveau`, etc.
- **VM Guest**: Installs `virtualbox-guest-utils`, `open-vm-tools`, or `qemu-guest-agent` depending on your hypervisor.

## Base System
- **Software Paradigm**: Choose strict adherence to free software using [doas](https://github.com/Duncaen/OpenDoas) (Libre ONLY), pragmatic usage with [sudo](https://www.sudo.ws/) (Open Source), or Proprietary (Nvidia, etc.).
- **Linux Kernel**: Choose between `linux`, `linux-zen` (for performance), or `linux-hardened` (for security).

## Disks & Filesystems
- **Disk Partitioning**: Standard, LVM, or Encrypted (LUKS).
- **Filesystem**: BTRFS (snapshots), XFS (performance), EXT4 (stable).
- **Swap**: 8GB is recommended for hibernation support.

## Security & Network
- **DNS Caching Service**: `systemd-resolved` (default), [unbound](https://nlnetlabs.nl/projects/unbound/about/) (validating caching), [dnscrypt-proxy](https://dnscrypt.info/) (encrypted).
- **Multi-User Setup**: Set up multiple regular user accounts. Decide if `root` can login directly via SSH or if only `sudo`/`doas` is allowed.
- **OTP Algorithm**: Customize your [Libre OTP](https://github.com/tilas01/arch-guides-dynamic/tree/main/security-tools/libre-otp) hash algorithm (SHA1, SHA256, SHA512).
- **Keystroke Anonymisation**: Installs [Kloak](https://github.com/vmonaco/kloak) by vmonaco to obscure typing biometric metadata.

## Desktop Environments & Applications
- **Desktop Environment**: [GNOME](https://www.gnome.org/), [KDE Plasma](https://kde.org/plasma-desktop/), [DWM](https://dwm.suckless.org/), or **[Dusky OS](https://github.com/dusklinux/dusky)** (Highly customized and blazing fast).
- **Post-Install Apps**: 
  - [paru](https://github.com/Morganamilo/paru): A feature-rich AUR helper.
  - [Firefox](https://www.mozilla.org/firefox/): The standard privacy browser.
  - [LibreWolf](https://librewolf.net/): A custom version of Firefox focused completely on privacy and security.
  - [Signal Desktop](https://signal.org/): End-to-end encrypted messaging.
  - [Neovim](https://neovim.io/): Highly extensible text editor.

---
*Note: The script generator is completely optional. You can manually follow this Wiki using native tools!*
