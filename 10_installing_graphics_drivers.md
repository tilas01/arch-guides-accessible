---
title: 10. Installing Graphics Drivers
author: "tilas01 on GitHub and Gemini Code Assist"
date: 2026-04-07
---

# 10. Installing Graphics Drivers

Installing the correct graphics driver is essential for optimal performance and display functionality on your Arch Linux system.

## 1. Identify Your Graphics Hardware

Before installing, determine your graphics card manufacturer and model.

```bash
lspci -k | grep -EA3 'VGA|3D|Display'
```

## 2. Consult the Arch Wiki for Driver Information

The Arch Wiki Xorg page provides comprehensive information on available drivers for various hardware.

## 3. Install the Appropriate Driver

Once you've identified the correct driver, install it using `pacman`.

```bash
sudo pacman -S {driver_package_name}
```

**Common Driver Examples:**

*   **Intel Integrated Graphics**: `xf86-video-intel` (often not strictly necessary for modern Intel GPUs, `modesetting` driver is default)
*   **AMD Integrated/Dedicated Graphics**: `xf86-video-amdgpu` (for newer GPUs), `xf86-video-ati` (for older GPUs)
*   **NVIDIA Proprietary Drivers**: `nvidia` (for the default `linux` kernel), `nvidia-dkms` (recommended if you use a non-default kernel like `linux-zen` or `linux-lts`, as it compiles the driver against your specific kernel).

**Note for NVIDIA DKMS:** If you installed a kernel other than `linux` (e.g., `linux-zen`), you **must** install `nvidia-dkms` along with the corresponding kernel headers (e.g., `linux-zen-headers`).

## 4. VirtualBox Guest Additions (For VM Users)

If you are running Arch inside VirtualBox, you need these drivers for screen resizing, shared clipboard, and folder sharing.

### Install Packages

*   **Standard Kernel (`linux`)**:
    ```bash
    sudo pacman -S virtualbox-guest-utils
    ```
*   **Custom Kernels (`linux-zen`, `linux-lts`, etc.)**:
    You must use the DKMS version to ensure the modules are built for your specific kernel.
    ```bash
    sudo pacman -S virtualbox-guest-dkms virtualbox-guest-utils
    ```
    *Note: Ensure your kernel headers are installed (e.g., `sudo pacman -S linux-zen-headers`).*

### Enable Services

```bash
sudo systemctl enable --now vboxservice.service
```

### Shared Folder Permissions
Add your user to the `vboxsf` group to access shared folders:
```bash
sudo usermod -aG vboxsf {your_username}
```

## 5. Reboot (Recommended)

After installing graphics drivers, a reboot is often necessary for the changes to take take full effect.

```bash
sudo reboot
```