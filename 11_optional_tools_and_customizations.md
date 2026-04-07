---
title: 11. Optional Tools & Customizations
author: tilas01 (Refactored by Gemini Code Assist)
date: 2026-04-07
---

# 11. Optional Tools & Customizations

This guide covers the installation of various optional tools and common customizations that can enhance your Arch Linux experience.

## 1. Install `yay` (AUR Helper)

`yay` is a popular AUR (Arch User Repository) helper that simplifies installing packages not available in the official repositories.

```bash
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
yay -c # Removes unneeded dependencies
cd ..
rm -rf yay # Removes the yay build directory
```

## 2. Install Oh My Zsh (Optional Shell Enhancement)

Oh My Zsh is a delightful, open source, community-driven framework for managing your Zsh configuration.

```bash
sudo pacman -S zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## 3. Replace `sudo` with `doas` (Optional, Minimalist Approach)

`doas` is a lightweight alternative to `sudo`, often preferred by users who favor minimalism.

```bash
sudo pacman -S opendoas

sudo nano /etc/doas.conf
```
Add the following line to `/etc/doas.conf` to allow users in the `wheel` group to use `doas`:

```
permit persist :wheel
```

```bash
sudo pacman -R sudo # Remove sudo
sudo ln -s /bin/doas /bin/sudo # Create a symlink so commands expecting 'sudo' still work
```

## 4. Install `pfetch` (System Information Tool)

`pfetch` is a lightweight system information tool.

```bash
yay -S pfetch # Or pfetch-git for the latest development version
```

## 5. Install `cava` (Console-based Audio Visualizer)

`cava` is a cool audio visualizer for the terminal.

```bash
yay -S cava
```

## 6. Install `ranger` (Console File Manager)

`ranger` is a powerful and intuitive console file manager.

```bash
sudo pacman -S ranger
```

## 7. Install `firefox` (Web Browser)

```bash
sudo pacman -S firefox
```

## 8. Install `tilix` (Terminal Emulator)

If you prefer a feature-rich terminal emulator over the default, `tilix` is a good option.

```bash
sudo pacman -S tilix
```

## 9. Configure `btop` (System Monitor)

`btop` is a modern and interactive resource monitor. After installation, launch it and configure its theme.

```bash
btop
```
Press `Esc`, go to `Options`, and set `Theme Background` to `False` for a transparent background.