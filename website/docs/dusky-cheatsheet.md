# Dusky OS — Complete Cheatsheet

> **Dusky OS** is created and maintained by [dusklinux](https://github.com/dusklinux/dusky).
> YouTube Demo: [Watch here](https://www.youtube.com/watch?v=JmgvSdEIK8c)

---

## Table of Contents

- [What is Dusky OS?](#what-is-dusky-os)
- [Installation](#installation)
- [Universal Keybinds Search](#universal-keybinds-search)
- [Core Keyboard Shortcuts](#core-keyboard-shortcuts)
- [Window Management](#window-management)
- [Layouts](#layouts)
- [Tags / Workspaces](#tags--workspaces)
- [Application Launching (Rofi)](#application-launching-rofi)
- [Theming & Aesthetics](#theming--aesthetics)
- [Media & System Keys](#media--system-keys)
- [Configuration](#configuration)
- [Autostart & Session Setup](#autostart--session-setup)
- [Theming & Appearance](#theming--appearance)
- [Compositor & Effects](#compositor--effects)
- [Notifications](#notifications)
- [Troubleshooting](#troubleshooting)
- [Differences from Vanilla DWM](#differences-from-vanilla-dwm)

---

## What is Dusky OS?

Dusky OS is a minimal, X11-based desktop environment for Arch Linux built on the [DWM](https://dwm.suckless.org/) (Dynamic Window Manager) philosophy from the suckless project. It provides a pre-configured, aesthetically polished tiling window manager experience without the complexity of full desktop environments like GNOME or KDE.

**Key characteristics:**

- **X11/Xorg only** — Dusky requires Xorg. Wayland is **not** supported and will break it.
- **DWM-based** — Uses the suckless DWM as its core window manager.
- **Keyboard-driven** — Designed for efficient keyboard navigation with minimal mouse usage.
- **Lightweight** — Minimal RAM and CPU usage compared to full DEs.
- **Pre-configured** — Ships with curated defaults, patches, and theming out of the box.

---

## Installation

### Via the Generator (Recommended)

Select **Dusky OS (dusklinux/dusky)** in the Desktop Environment dropdown. The generator handles all dependencies automatically.

### Manual Installation

```bash
# Install Xorg dependencies
pacman -S --noconfirm git base-devel xorg-server xorg-xinit

# Install paru (AUR helper) if not already installed
useradd -m -G wheel -s /bin/bash builder
echo "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder
su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"

# Clone and install Dusky
su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"

# Cleanup
userdel -r builder
rm -f /etc/sudoers.d/builder
```

### Libre Mode Installation

If you're using the **Fully Libre** software type with `doas` instead of `sudo`:

```bash
su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && sed -i 's/sudo/doas/g' install.sh && ./install.sh"
```

### Starting Dusky

Add to your `~/.xinitrc`:

```bash
exec dwm
```

Then start with:

```bash
startx
```

---

## Universal Keybinds Search

> [!TIP]
> **Forget a shortcut?** Use the Universal Searchable Keybinds Menu.

| Shortcut | Action |
|----------|--------|
| <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>k</kbd> | Open searchable keybinds menu (Rofi/Waybar integration) |

This menu parses your configuration and allows you to fuzzy-search every single keybind mapped in Dusky OS.

---

## Core Keyboard Shortcuts

> **Note:** Dusky is based on DWM, so it inherits DWM's keybinding conventions. The exact keybindings may differ from vanilla DWM — **always check the `config.h` file in the [Dusky repository](https://github.com/dusklinux/dusky) for the definitive keybindings.** The shortcuts below reflect DWM defaults as a baseline.

The **Mod key** is typically <kbd>Super</kbd> (Windows key) or <kbd>Alt</kbd>, depending on the Dusky configuration.

| Shortcut | Action |
|----------|--------|
| <kbd>Mod</kbd> + <kbd>Enter</kbd> | Open terminal (usually `st` or `alacritty`) |
| <kbd>Mod</kbd> + <kbd>p</kbd> | Open application launcher (`rofi` or `dmenu`) |
| <kbd>Mod</kbd> + <kbd>Shift</kbd> + <kbd>c</kbd> | Close focused window |
| <kbd>Mod</kbd> + <kbd>Shift</kbd> + <kbd>q</kbd> | Quit DWM / Dusky (logout) |
| <kbd>Mod</kbd> + <kbd>b</kbd> | Toggle status bar visibility |

---

## Window Management

### Focus Navigation

| Shortcut | Action |
|----------|--------|
| <kbd>Mod</kbd> + <kbd>j</kbd> | Focus next window in stack |
| <kbd>Mod</kbd> + <kbd>k</kbd> | Focus previous window in stack |
| <kbd>Mod</kbd> + <kbd>Return</kbd> | Promote focused window to master area |
| <kbd>Mod</kbd> + <kbd>Tab</kbd> | Switch to last active tag/workspace |

### Resizing

| Shortcut | Action |
|----------|--------|
| `Mod + h` | Decrease master area width |
| `Mod + l` | Increase master area width |
| `Mod + i` | Increase number of windows in master |
| `Mod + d` | Decrease number of windows in master |

### Moving Windows

| Shortcut | Action |
|----------|--------|
| `Mod + Shift + j` | Move window down in stack |
| `Mod + Shift + k` | Move window up in stack |
| `Mod + Shift + Return` | Swap with master window |

### Floating Windows

| Shortcut | Action |
|----------|--------|
| `Mod + Shift + Space` | Toggle floating for focused window |
| `Mod + Mouse1 (drag)` | Move floating window |
| `Mod + Mouse3 (drag)` | Resize floating window |
| `Mod + Middle Click` | Toggle floating |

---

## Layouts

DWM/Dusky supports multiple tiling layouts:

| Shortcut | Layout | Description |
|----------|--------|-------------|
| `Mod + t` | **Tiled** | Master on left, stack on right (default) |
| `Mod + f` | **Floating** | All windows float freely |
| `Mod + m` | **Monocle** | All windows fullscreen, stacked |
| `Mod + Space` | **Toggle** | Cycle between previous and current layout |

### Layout Descriptions

- **Tiled (Default):** One master window on the left, remaining windows stacked vertically on the right. The master ratio is adjustable with `Mod+h`/`Mod+l`.
- **Floating:** Windows behave like traditional desktop windows — drag to move, drag edges to resize.
- **Monocle:** Every window takes up the full screen. Use `Mod+j`/`Mod+k` to switch between them. Great for focused work.

---

## Tags / Workspaces

DWM uses a **tagging system** rather than traditional workspaces. Each window can have one or more tags, and you can view one or more tags simultaneously.

| Shortcut | Action |
|----------|--------|
| `Mod + 1-9` | View tag 1–9 |
| `Mod + Shift + 1-9` | Move focused window to tag 1–9 |
| `Mod + 0` | View all tags simultaneously |
| `Mod + Shift + 0` | Apply all tags to focused window |
| `Mod + Ctrl + 1-9` | Toggle tag view (show multiple tags) |
| `Mod + Ctrl + Shift + 1-9` | Toggle tag on focused window |

### Understanding Tags vs Workspaces

Unlike GNOME/KDE workspaces, DWM tags are more flexible:

- A window can belong to **multiple tags** (appears on multiple "desktops")
- You can view **multiple tags at once** (combine workspaces)
- Tags are numbered `1-9` by default

---

## Application Launching (Rofi)

Dusky leverages **Rofi** for a beautiful, Waybar-integrated Tokyo Night themed launcher experience.

| Shortcut | Action |
|----------|--------|
| <kbd>Mod</kbd> + <kbd>p</kbd> | Open standard app launcher |
| <kbd>Mod</kbd> + <kbd>Shift</kbd> + <kbd>w</kbd> | Window selection menu (switch open windows) |
| <kbd>Mod</kbd> + <kbd>Shift</kbd> + <kbd>e</kbd> | Rofi power menu (Shutdown/Reboot) |

### Rofi Tips

- Start typing the application name — Rofi fuzzy-matches instantly.
- Use <kbd>Tab</kbd> to autocomplete.
- <kbd>Enter</kbd> to launch.
- <kbd>Escape</kbd> to cancel.

---

## Theming & Aesthetics

Dusky allows advanced theming and visual changes using integrated scripts and commands. 

### Tokyo Night Theme Defaults
By default, Dusky implements a comprehensive Tokyo Night color palette. This applies to the terminal, borders, Rofi, and Waybar.

### Change Wallpaper

Dusky includes advanced scripts to dynamically change wallpapers and sync the system colors.

```bash
# Set wallpaper and update colors
dusky-wallpaper --set /path/to/wallpaper.png

# Cycle through random wallpapers in a directory
dusky-wallpaper --random ~/Pictures/Wallpapers
```

### Change Window Styles (Borders/Gaps)

You can adjust window gaps and border styling on the fly:

| Shortcut | Action |
|----------|--------|
| <kbd>Mod</kbd> + <kbd>-</kbd> | Decrease window gaps |
| <kbd>Mod</kbd> + <kbd>=</kbd> | Increase window gaps |
| <kbd>Mod</kbd> + <kbd>Shift</kbd> + <kbd>=</kbd> | Reset window gaps to default |

You can also use the CLI:
```bash
# Set gaps to 10px
dusky-gaps --set 10

# Toggle between rounded and sharp borders
dusky-borders --toggle
```

---

## Media & System Keys

These may vary depending on Dusky's configuration and installed utilities:

| Key | Action |
|-----|--------|
| `XF86AudioRaiseVolume` | Volume up (requires `amixer` or `pamixer`) |
| `XF86AudioLowerVolume` | Volume down |
| `XF86AudioMute` | Toggle mute |
| `XF86MonBrightnessUp` | Screen brightness up (requires `xbacklight` or `brightnessctl`) |
| `XF86MonBrightnessDown` | Screen brightness down |
| `Print` | Screenshot (requires `scrot`, `maim`, or `flameshot`) |

### Setting Up Media Keys Manually

If not configured, add to `config.h`:

```c
#include <X11/XF86keysym.h>

static const char *upvol[]   = { "amixer", "set", "Master", "5%+", NULL };
static const char *downvol[] = { "amixer", "set", "Master", "5%-", NULL };
static const char *mutevol[] = { "amixer", "set", "Master", "toggle", NULL };

static Key keys[] = {
    { 0, XF86XK_AudioLowerVolume, spawn, {.v = downvol } },
    { 0, XF86XK_AudioRaiseVolume, spawn, {.v = upvol } },
    { 0, XF86XK_AudioMute,       spawn, {.v = mutevol } },
};
```

---

## Configuration

Dusky/DWM is configured by editing **C source code** and recompiling. There is no runtime configuration file.

### Key Files

| File | Purpose |
|------|---------|
| `config.h` | Main configuration (keybindings, colors, fonts, rules) |
| `config.def.h` | Default configuration template |
| `config.mk` | Build configuration (compiler flags, install paths) |
| `dwm.c` | Core DWM source code |
| `patches/` | Applied patches directory (if any) |

### Modifying Keybindings

1. Edit `config.h`:

```c
static Key keys[] = {
    /* modifier          key        function       argument */
    { MODKEY,            XK_Return, spawn,         {.v = termcmd } },
    { MODKEY,            XK_p,      spawn,         {.v = dmenucmd } },
    { MODKEY|ShiftMask,  XK_c,      killclient,    {0} },
    { MODKEY|ShiftMask,  XK_q,      quit,          {0} },
};
```

2. Recompile and install:

```bash
cd /path/to/dusky   # or /usr/local/src/dwm
sudo make clean install
```

3. Restart DWM (log out and back in, or use `Mod+Shift+q`).

### Changing the Mod Key

In `config.h`:

```c
#define MODKEY Mod4Mask   /* Super/Windows key (default) */
/* #define MODKEY Mod1Mask */   /* Alt key (alternative) */
```

### Changing the Terminal

In `config.h`:

```c
static const char *termcmd[] = { "alacritty", NULL };  /* Use Alacritty */
/* static const char *termcmd[] = { "st", NULL }; */    /* Use st (default) */
```

### Customizing Colors

In `config.h`:

```c
static const char col_gray1[] = "#222222";  /* Bar background */
static const char col_gray2[] = "#444444";  /* Border inactive */
static const char col_gray3[] = "#bbbbbb";  /* Font color inactive */
static const char col_gray4[] = "#eeeeee";  /* Font color active */
static const char col_cyan[]  = "#005577";  /* Border active / bar accent */
```

---

## Autostart & Session Setup

### ~/.xinitrc

Your `~/.xinitrc` is the startup script for X sessions:

```bash
#!/bin/sh

# Set wallpaper
feh --bg-scale ~/wallpaper.jpg &

# Start compositor for transparency
picom --daemon &

# Start notification daemon
dunst &

# Status bar (if using slstatus or custom script)
slstatus &
# OR: while true; do xsetroot -name "$(date '+%Y-%m-%d %H:%M')"; sleep 60; done &

# Set keyboard repeat rate
xset r rate 300 50 &

# Start Dusky/DWM
exec dwm
```

### Setting Wallpaper

```bash
# Install feh
pacman -S feh

# Set wallpaper
feh --bg-scale /path/to/wallpaper.jpg

# Add to ~/.xinitrc for persistence
echo 'feh --bg-scale /path/to/wallpaper.jpg &' >> ~/.xinitrc
```

Alternative with `nitrogen`:

```bash
pacman -S nitrogen
nitrogen /path/to/wallpapers/  # GUI picker
```

---

## Compositor & Effects

Use `picom` for window transparency, animations, and vsync:

```bash
pacman -S picom
```

Create `~/.config/picom/picom.conf`:

```conf
# Transparency
inactive-opacity = 0.9;
active-opacity = 1.0;
frame-opacity = 0.8;

# Blur
blur-method = "dual_kawase";
blur-strength = 5;

# Shadows
shadow = true;
shadow-radius = 12;

# Fading
fading = true;
fade-in-step = 0.03;
fade-out-step = 0.03;

# VSync
vsync = true;

# Backend
backend = "glx";
```

Start: `picom --daemon` or add to `~/.xinitrc`.

---

## Notifications

Use `dunst` for desktop notifications:

```bash
pacman -S dunst libnotify
```

Test: `notify-send "Hello" "This is a test notification"`

Configure at `~/.config/dunst/dunstrc`.

---

## Troubleshooting

### Black Screen After startx

- Check `~/.xinitrc` has `exec dwm` as the **last** line.
- Verify Xorg is installed: `pacman -Qs xorg-server`
- Check logs: `cat ~/.local/share/xorg/Xorg.0.log | grep "(EE)"`

### No Status Bar

- Ensure `slstatus` or a status script is running.
- Check if bar is hidden: press `Mod + b` to toggle.

### Keybindings Not Working

- You may need to recompile after editing `config.h`:
  ```bash
  sudo make clean install
  ```
- Verify the Mod key setting matches your keyboard.
- Check for conflicting keybindings in other running programs.

### Screen Tearing

- Install and start `picom` with `vsync = true`.
- For AMD GPUs, add to `/etc/X11/xorg.conf.d/20-amdgpu.conf`:
  ```
  Section "Device"
      Identifier "AMD"
      Driver "amdgpu"
      Option "TearFree" "true"
  EndSection
  ```

### Multi-Monitor Setup

Use `xrandr` to configure monitors:

```bash
# List connected displays
xrandr

# Set dual monitor (laptop + external)
xrandr --output eDP-1 --primary --auto --output HDMI-1 --auto --right-of eDP-1
```

Make persistent by adding to `~/.xinitrc` before `exec dwm`.

### Wayland Error

Dusky/DWM is **X11 only**. If you accidentally selected Wayland in the generator:

- Re-generate with Xorg or Auto display server selected
- Or manually install Xorg: `pacman -S xorg-server xorg-xinit`

---

## Differences from Vanilla DWM

Dusky OS is based on DWM but comes with enhancements:

| Feature | Vanilla DWM | Dusky OS |
|---------|-------------|----------|
| Pre-applied patches | None | Multiple usability patches included |
| Default terminal | `st` | May differ (check config) |
| Theming | Minimal (edit source) | Pre-configured color scheme |
| Status bar | None (DIY) | Pre-configured or bundled |
| Install process | Manual `make install` | Automated `install.sh` |
| Suckless philosophy | Pure minimal | Balanced minimal + usable |
| Documentation | Wiki only | Bundled with Arch Guides |

> **Always refer to the [official Dusky repository](https://github.com/dusklinux/dusky) for the most accurate and up-to-date configuration details, patches, and keybindings.**

---

*Part of the [Arch Guides Dynamic](https://github.com/tilas01/arch-guides-dynamic) wiki by [tilas01](https://github.com/tilas01).*
*Dusky OS by [dusklinux](https://github.com/dusklinux/dusky).*
