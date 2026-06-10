# Arch Linux Display Servers: Xorg vs Wayland

When configuring your Arch Linux graphical interface, you must choose a display server protocol. The display server is responsible for coordinating input and output between your OS and your hardware.

## Wayland (Modern & Secure)
Wayland is the modern, secure replacement for X11. It is simpler, has better code maintainability, and provides much better security isolation between applications.

**Pros:**
*   **Security:** Applications cannot keylog or capture the screen without explicit permission via portals.
*   **Performance:** Generally smoother rendering and less tearing.
*   **Multi-Monitor:** Excellent support for different refresh rates and scaling per monitor.

**Cons:**
*   **Compatibility:** Older applications or specific window managers (like DWM or i3) are designed exclusively for X11.
*   **Nvidia:** While vastly improved in 2024+, Nvidia proprietary drivers can still have edge-case issues compared to AMD/Intel on Wayland.

*Recommended for:* Modern GNOME and KDE Plasma installations, especially with AMD or Intel graphics.

## Xorg / X11 (Legacy & Compatible)
Xorg is the legacy display server that has been used for decades. 

**Pros:**
*   **Compatibility:** Every Linux application and window manager works flawlessly.
*   **Nvidia Support:** Historically much more stable with proprietary drivers.
*   **Window Managers:** Essential if you want to use classic tiling window managers like DWM, i3, or AwesomeWM.

**Cons:**
*   **Security Risk:** Any application running under X11 can log all keystrokes and capture the entire screen without permission.
*   **Multi-Monitor:** Struggles with different refresh rates and fractional scaling across multiple monitors.

*Recommended for:* Dusky OS (based on X11), DWM, and legacy hardware.
