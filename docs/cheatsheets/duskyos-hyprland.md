# DuskyOS / Hyprland Cheatsheet

DuskyOS is built around the Hyprland Wayland compositor. It uses a heavily customized, keyboard-centric workflow.

> [!TIP]
> **Searchable Keybinds UI:** Press `SUPER + SHIFT + K` at any time to open the dynamic searchable keybinds overlay.

## Essential Keybinds
*Note: The primary modifier key (SUPER) is typically the Windows key.*

### Application Launching
- **Terminal (Alacritty / Kitty)**: `SUPER + Enter`
- **App Launcher (Wofi / Rofi)**: `SUPER + D` or `SUPER + Space`
- **Web Browser**: `SUPER + W`
- **File Manager**: `SUPER + E`

### Window Management
- **Close Focused Window**: `SUPER + Q` or `SUPER + Shift + Q`
- **Toggle Floating Mode**: `SUPER + V`
- **Toggle Fullscreen**: `SUPER + F`
- **Move Focus**: `SUPER + Arrow Keys` (or `H J K L`)
- **Move Window**: `SUPER + Shift + Arrow Keys` (or `H J K L`)
- **Resize Window**: `SUPER + Alt + Arrow Keys`

### Workspaces
- **Switch Workspace**: `SUPER + [1-9]`
- **Move Window to Workspace**: `SUPER + Shift + [1-9]`
- **Scroll Workspaces**: `SUPER + Mouse Scroll`

### System Commands
- **Lock Screen**: `SUPER + L`
- **Logout / Power Menu**: `SUPER + Escape` or `SUPER + Shift + E`
- **Take Screenshot**: `Print Screen` (saves to ~/Pictures/Screenshots)
- **Screenshot Region**: `SUPER + Shift + S` (copies to clipboard)

## Advanced Dusky Commands

> [!NOTE]
> DuskyOS comes with several custom scripts bound to Rofi menus for quick customization.

- **Change Wallpaper**: `SUPER + Alt + W` (Opens swww wallpaper selector)
- **Change System Theme**: `SUPER + Alt + T` (Switches GTK theme and Waybar colors)
- **Restart Waybar**: `SUPER + Shift + W` or `killall waybar && waybar &`
- **Bluetooth Menu**: `SUPER + B`
- **Clipboard History**: `SUPER + C` (Requires cliphist)

## Troubleshooting

> [!WARNING]
> **Wayland Issues with NVIDIA:** Ensure you have `nvidia-drm.modeset=1` in your kernel parameters, and you are using the proprietary drivers if Nouveau fails.
