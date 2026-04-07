---
title: 08. Install GNOME Desktop Environment
author: tilas01 (Refactored by Gemini Code Assist)
date: 2026-04-07
---

# 08. Install GNOME Desktop Environment

This guide provides instructions for installing the GNOME desktop environment on your Arch Linux system.

## 1. Install GNOME Packages

```bash
sudo pacman -S gnome gnome-tweaks xorg-server
```

## 2. Enable GDM (GNOME Display Manager)

```bash
sudo systemctl enable gdm
sudo reboot
```
After rebooting, you should be greeted by the GDM login screen.