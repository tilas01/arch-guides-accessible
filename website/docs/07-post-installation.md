

# *nix Install Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Post-Installation & Desktop

## 1. Minimalist System Tools (`doas` & `pfetch`)
To adhere to the minimalist philosophy, we use `doas` instead of `sudo`. If you included `opendoas` and `pfetch` during `pacstrap`, configure them now:
```bash
echo "permit persist :wheel" > /etc/doas.conf
ln -s /usr/bin/doas /usr/bin/sudo
echo "pfetch" >> /etc/profile
```

## 2. Fast Wi-Fi & DNS
```bash
pacman -S iwd systemd-resolvconf
systemctl enable iwd systemd-resolved
ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
```
Configure IWD in `/etc/iwd/main.conf` to use `systemd` for `NameResolvingService`.

## 2. Desktop Environments
**GNOME:**
```bash
pacman -S gnome gnome-tweaks
systemctl enable gdm
```
**DWM:**
```bash
pacman -S xorg-server xorg-xinit
# clone suckless tools and make clean install
```

## 3. AUR Helper
```bash
pacman -S git base-devel
# clone yay and makepkg -si
```

## 4. Next Steps & Maintenance
Congratulations! Your core setup is complete.
To ensure your system remains secure and well-maintained over time, please review the following advanced resources:
* 👉 **[System Maintenance & SSH Security Guide](maintenance.md)** - Explains Fake/Backup Kernels, OTP, and VM specific installations.
* 👉 **[Arch Command Cheatsheet](arch-command-cheatsheet.md)** - Essential commands for pacman, services, and auditing.

Reboot and enjoy your highly modular, accessible Arch Linux setup!
