# Post-Installation & Desktop

## 1. Fast Wi-Fi & DNS
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

Reboot and enjoy your highly modular, accessible Arch Linux setup!
