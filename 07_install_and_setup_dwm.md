---
title: "07. Install and Setup DWM (Suckless Window Manager)"
author: "[tilas01](https://www.github.com/tilas01) and Gemini Code Assist"
date: 2026-04-07
---

# 07. Install and Setup DWM (Suckless Window Manager)

This guide covers the installation and configuration of DWM (Dynamic Window Manager) and other Suckless tools. It includes steps for setting up a minimal desktop environment, incorporating `tilas01`'s personal customizations, and general Suckless patching advice.

## Assumptions

*   You have a working Arch Linux installation.
*   You have `yay` (an AUR helper) installed. If not, install it first (see 11. Optional Tools & Customizations).
*   You are familiar with basic command-line operations and text editors like `nano`.

## 1. Replace `sudo` with `doas` (Optional, Recommended for Suckless Philosophy)

If you wish to align with the Suckless philosophy of minimalism and replace `sudo` with `doas`, follow these steps. Otherwise, skip to the next section.

```bash
sudo pacman -Sy opendoas

sudo nano /etc/doas.conf
```
Add the following line to `/etc/doas.conf`:

```
permit persist :wheel
```
This allows users in the `wheel` group to use `doas` without re-entering their password for a period.

```bash
sudo pacman -R sudo # Remove sudo
doas ln -s /bin/doas /bin/sudo # Symlink doas to sudo for compatibility
```

## 2. Install Dependencies and Essential Applications

Install Xorg server, display utilities, fonts, Git, and other useful applications.

```bash
doas pacman -Sy xorg-server xorg-xrandr xorg-xinit xorg-xset libx11 libxft libxinerama ttf-jetbrains-mono git python-pywal feh ttf-font-awesome ranger alsa-utils pulseaudio firefox btop xautolock
```

## 3. Create a Directory for Suckless Tools

Organize your Suckless source code.

```bash
mkdir -p ~/git/suckless
cd ~/git/suckless
```

## 4. Clone Suckless Tools and Dotfiles

You have two options here:

*   **Option A: `tilas01`'s Customized DWM Setup**: This includes `tilas01`'s patched and configured versions of DWM, ST, DMenu, SLStatus, SLock, along with wallpapers and dotfiles. This is generally recommended for a quick start with a pre-configured setup.
*   **Option B: Official Suckless Tools**: This clones the vanilla versions directly from the Suckless repositories, giving you a clean slate for your own patching and configuration.

### Option A: Clone `tilas01`'s Customized DWM Setup

```bash
git clone https://github.com/tilas01/dwm.git
git clone https://github.com/tilas01/st.git
git clone https://github.com/tilas01/dmenu.git
git clone https://github.com/tilas01/slstatus.git
git clone https://github.com/tilas01/slock.git
git clone https://github.com/tilas01/wallpapers.git

# For desktop:
git clone https://github.com/tilas01/dotfiles.git

# For laptop (if different configurations are desired):
# git clone -b laptop https://github.com/tilas01/dwm.git
# git clone -b laptop https://github.com/tilas01/slstatus.git
# git clone https://github.com/tilas01/dotfiles.git
```

**Important for `slock` (if using `tilas01`'s version):**

Before building `slock`, you might need to edit its `config.h` to replace `tilas01` with your username.

```bash
nano slock/config.h
```

### Option B: Clone Official Suckless Tools

```bash
git clone git://git.suckless.org/dwm
git clone git://git.suckless.org/st
git clone git://git.suckless.org/dmenu
git clone git://git.suckless.org/slstatus
git clone git://git.suckless.org/slock
```

**Important for `slock` (if using official version):**

Before building `slock`, edit its `config.h` to replace `nobody` and `nogroup` with your username and group.

```bash
nano slock/config.h
```

## 5. Compile and Install Suckless Tools

Navigate into each cloned directory and compile/install the tools.

```bash
cd dwm && doas make clean install && cd ..
cd st && doas make clean install && cd ..
cd dmenu && doas make clean install && cd ..
cd slstatus && doas make clean install && cd ..
cd slock && doas make clean install && cd ..
```

## 6. Configure `~/.xinitrc`

The `.xinitrc` file tells `startx` what to launch when you start your X session.

```bash
cp /etc/X11/xinit/xinitrc ~/.xinitrc
nano ~/.xinitrc
```

Remove `twm &` and all lines below it. Then add the following:

```
slstatus &
xautolock -time 10 -locker slock -corners 000- -detectsleep & # Optional, remove if not desired
exec dwm
```

**Optional: `xrandr` for VMs**

If you are running in a VM and need to set a specific resolution, add this before `slstatus &`:

```
xrandr --output Virtual-1 --mode 1920x1080 # Adjust "Virtual-1" and resolution as needed
```

## 7. Configure `startx` for Automatic Login

To automatically start DWM when you log in to a TTY, add `startx` to your shell's profile.

### For Bash (`~/.bash_profile`)

```bash
nano ~/.bash_profile
```
Add to the end:

```
if [ -z "${DISPLAY}" ] && [ "${XDG_VTNR}" -eq 1 ]; then
  exec startx
fi
```

### For Zsh (`~/.zshrc`)

```bash
nano ~/.zshrc
```
Add to the end:

```
if [ -z "${DISPLAY}" ] && [ "${XDG_VTNR}" -eq 1 ]; then
  exec startx
fi
```

## 8. Reboot and Test

```bash
doas reboot
```

After rebooting, log in to a TTY, and DWM should start automatically.

## 9. Set `slock` to Run on Sleep

Create a systemd service to automatically lock your screen with `slock` when your system suspends.

Create the file `/etc/systemd/system/slock@.service` with the following content:

```ini
[Unit]
Description=Lock X session using slock for user %i
Before=sleep.target

[Service]
User=%i
Environment=DISPLAY=:0
ExecStartPre=/usr/bin/xset dpms force suspend
ExecStart=/usr/local/bin/slock

[Install]
WantedBy=sleep.target
```

Enable the service for your user:

```bash
doas systemctl enable slock@$(whoami).service
systemctl suspend # Test if slock runs on suspend (your screen should lock)
```

## 10. Block TTY Access and Prevent Killing X (Security for `slock`)

To prevent bypassing `slock` by switching TTYs or killing the X server, configure Xorg.

Create `/etc/X11/xorg.conf.d/slock.conf` with the following content:

```
Section "ServerFlags"
    Option "DontVTSwitch" "True"
    Option "DontZap"      "True"
+EndSection
```

Reboot for changes to take effect. After rebooting, log in, quit DWM (`Alt+Shift+q` by default), and then check the Xorg log:

```bash
doas cat ~/.local/share/xorg/Xorg.0.log | grep "VT\|ZAP"
```

You should see output similar to:

```
[  1144.672] (**) Option "DontVTSwitch" "True"
[  1144.672] (**) Option "DontZap" "True"
[  1144.673] (++) using VT number 1
```

## 11. Set Wallpaper with `feh`

```bash
feh --bg-scale ~/git/suckless/wallpapers/cat_town.png # Adjust path and image
```

To make this persistent, add it to your `~/.xinitrc` before `exec dwm`:

```bash
nano ~/.xinitrc
```
Add:

```
~/.fehbg &
```

## 12. Enable `pywal` (Optional, for Dynamic Theming)

`pywal` generates a color scheme from your wallpaper and applies it to your terminal and other applications.

```bash
wal -i ~/git/suckless/wallpapers/cat_town.png -n # Adjust path and image
```

To load the color scheme in your shell, add this to your `~/.bashrc` or `~/.zshrc`:

```bash
cat ~/.cache/wal/sequences
```

## 13. DWM Configuration Notes

*   **Font Size**: Edit `dwm/config.h` to adjust `font` and `dmenufont` variables. `16` is often a good starting point for laptops.
*   **Colors**: Modify `col_cyan[]` and other color arrays in `dwm/config.h` to match your preferred color scheme (e.g., generated by `pywal`).
*   **Keybinds**: Review `dwm/config.h` for keybindings. `Alt+Shift+l` is often used for `slock`.

## 14. Patching Suckless Programs

Suckless tools are customized by editing their source code and applying patches.

*   **Recommended Way**:
    ```bash
    patch < the-patch.diff
    ```
*   **If the above fails**:
    ```bash
    patch -p1 < the-patch.diff
    ```
*   **Last Resort (manual application)**: If patching fails, examine the `.rej` file generated by `patch` and manually apply the changes.

After applying patches, always recompile and reinstall:

```bash
cd {program_directory}
doas make clean install
```

## 15. Useful Commands & Resources

*   **Sleep**: `systemctl suspend` (consider binding this to a key in DWM).
*   **Find Display Name**: `xrandr`
*   **Adjust Brightness**: `xrandr --output {display} --brightness {value}` (e.g., `0.8`).
*   **Volume Mixer**: `alsamixer`
*   **DWM Keybind Cheat Sheet**: ratfactor.com/dwm
*   **Official DWM Tutorial**: dwm.suckless.org/tutorial/
*   **Mental Outlaw's Suckless Guides**: YouTube Playlist

#### Credits
*   **Author:** tilas01
*Please do not remove credits*