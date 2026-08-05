# Dusky — cheatsheet

**Dusky** by [dusklinux](https://github.com/dusklinux/dusky) is a dotfiles and
install-script project for **Hyprland on Wayland**.

- [Repository](https://github.com/dusklinux/dusky)
- [Video walkthrough](https://www.youtube.com/watch?v=JmgvSdEIK8c)
- [dusklinux on YouTube](https://www.youtube.com/@dusk_everyday)

> [!IMPORTANT]
> **This page is a starting point, not the source of truth.** Dusky ships its own
> `cheatsheet.md`, and the bindings actually in force live in your
> `hyprland.conf`. Where this page and those disagree, they are right and this is
> out of date. See [Where the real keybinds are](#where-the-real-keybinds-are).

---

## What Dusky is, and what it is not

**It is** a set of configuration files plus an installer that turns a working
Arch system into a complete Hyprland desktop — compositor settings, bar,
launcher, notifications, theme, fonts and wallpaper, already configured.

**It is not:**

| Not… | Because |
|---|---|
| a separate operating system | You are running Arch Linux. Dusky is configuration on top of it, so `pacman`, the AUR, systemd and everything else in this project's guides work exactly as they do on any Arch install. |
| based on dwm | dwm is a suckless **Xorg** window manager configured by editing C and recompiling. Dusky is Hyprland, configured by editing a text file. There is no `config.h`, no `make install` and no recompiling. |
| an Xorg desktop | Hyprland is a **Wayland** compositor with no Xorg backend. Choosing Xorg alongside Dusky is not a trade-off, it is a configuration that cannot start. Xwayland is installed so legacy X11 applications still run. |

Earlier versions of this page described Dusky as a DWM-based X11 environment.
That was wrong, and every keybind table derived from it was wrong with it.

---

## What it installs

| Component | What Dusky uses |
|---|---|
| Compositor | **Hyprland** (Wayland) |
| Status bar | **Waybar** |
| Launcher | **Rofi** |
| Notifications | **Swaync** |
| Session / power menu | **Wlogout** |
| Display manager | **SDDM** |
| Terminal | **Kitty** |
| Theme | Tokyo Night |

Xwayland comes along too, so X11-only applications keep working inside the
Wayland session.

### Installing it

**Through this project** — pick **Dusky** as the desktop in either the
[Unix Install Generator](../index.html) or the
[Unix Install Walkthrough](../manual.html). Both fix the display server to Wayland and
say so, then hand off to Dusky's own installer.

**By hand**, on a system that already boots:

```bash
# Wayland base, plus Xwayland for legacy X11 clients
pacman -S --needed git base-devel wayland xorg-xwayland

# Dusky's installer does the rest. Read it before you run it — it is
# someone else's script and it will change your configuration.
git clone https://github.com/dusklinux/dusky.git ~/dusky
less ~/dusky/install.sh
cd ~/dusky && ./install.sh
```

---

## Hyprland defaults

These are **Hyprland's own defaults**, given so you are not stranded on first
boot. Dusky changes some of them — check its cheatsheet for the ones it moved.

`SUPER` is the Windows / Command key, written `$mainMod` in the config.

### Windows

| Shortcut | Action |
|---|---|
| <kbd>Super</kbd> + <kbd>Q</kbd> | Open terminal |
| <kbd>Super</kbd> + <kbd>C</kbd> | Close the focused window |
| <kbd>Super</kbd> + <kbd>V</kbd> | Toggle floating |
| <kbd>Super</kbd> + <kbd>P</kbd> | Pseudo-tile |
| <kbd>Super</kbd> + <kbd>J</kbd> | Toggle split direction |
| <kbd>Super</kbd> + arrow keys | Move focus |
| <kbd>Super</kbd> + drag, left button | Move a floating window |
| <kbd>Super</kbd> + drag, right button | Resize a window |

### Workspaces

| Shortcut | Action |
|---|---|
| <kbd>Super</kbd> + <kbd>1</kbd>–<kbd>0</kbd> | Switch to workspace 1–10 |
| <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>1</kbd>–<kbd>0</kbd> | Move the window to that workspace |
| <kbd>Super</kbd> + scroll | Cycle workspaces |
| <kbd>Super</kbd> + <kbd>S</kbd> | Toggle the scratchpad |

Hyprland uses plain numbered workspaces, not dwm's tags — a window is on one
workspace at a time.

### Session

| Shortcut | Action |
|---|---|
| <kbd>Super</kbd> + <kbd>R</kbd> | Launcher (Rofi on Dusky) |
| <kbd>Super</kbd> + <kbd>E</kbd> | File manager |
| <kbd>Super</kbd> + <kbd>M</kbd> | Exit Hyprland |

---

## Where the real keybinds are

Three places, in order of authority.

**1. Dusky's own cheatsheet.** The installer clones the repository, so right
after an install:

```bash
less /tmp/dusky/cheatsheet.md
```

`/tmp` does not survive a reboot. Keep a copy:

```bash
mkdir -p ~/cheatsheets
cp /tmp/dusky/cheatsheet.md ~/cheatsheets/dusky.md
```

**2. Your live config** — what is bound right now:

```bash
grep -E '^\s*bind' ~/.config/hypr/hyprland.conf
```

**3. Ask Hyprland directly.** The compositor lists its own bindings, which is the
only answer that cannot be out of date:

```bash
hyprctl binds
```

---

## Configuring it

Hyprland reads a text file and reloads on save. No compiler involved.

```bash
$EDITOR ~/.config/hypr/hyprland.conf
```

A binding looks like this:

```ini
# bind = MODIFIERS, KEY, DISPATCHER, ARGUMENTS
bind = SUPER, Return, exec, kitty
bind = SUPER SHIFT, Q, killactive,
```

Reload without logging out:

```bash
hyprctl reload
```

If a change stops the session starting, log in on a TTY
(<kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>F2</kbd>) and revert the file — Dusky
keeps its originals in the cloned repository.

---

## Troubleshooting

**The session will not start after selecting Dusky.**
Check you are on Wayland. Hyprland cannot start on Xorg at all:

```bash
echo $XDG_SESSION_TYPE     # expect: wayland
```

**An application shows a blank window or refuses to launch.**
It is probably X11-only and Xwayland is missing:

```bash
pacman -Qi xorg-xwayland
```

**Screen sharing does not work.**
Wayland needs a portal, and it has to be running:

```bash
systemctl --user status xdg-desktop-portal-hyprland
```

**Waybar shows boxes instead of icons.**
A Nerd Font is missing or is not the configured font — the same cause as in any
other rice.

---

## Credit

Dusky is by **[dusklinux](https://github.com/dusklinux)**. This project installs
it with the author's own script and changes nothing about it; the configuration,
the design and the work are theirs.

- Repository: <https://github.com/dusklinux/dusky>
- Video: <https://www.youtube.com/watch?v=JmgvSdEIK8c>
- Channel: <https://www.youtube.com/@dusk_everyday>
