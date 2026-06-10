# DuskyOS / Hyprland Cheatsheet

DuskyOS is built around the Hyprland Wayland compositor. It uses a heavily customized, keyboard-centric workflow.

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

## Troubleshooting
- **Wayland Issues with NVIDIA**: Ensure you have `nvidia-drm.modeset=1` in your kernel parameters, and you are using the proprietary drivers if Nouveau fails.
- **Restart Waybar**: `killall waybar && waybar &`
