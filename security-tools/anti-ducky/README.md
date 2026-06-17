# Anti-Ducky USB Blocker

![Icon](img/icon.png)

![Banner](img/banner.png)

A Rust-based background daemon that enforces a strict USB whitelist upon screen lock, preventing Rubber Ducky / BadUSB keystroke injection attacks. Supports dynamic udev rules and quorum-based emergency unlocks.


## ⚖️ Legal Disclaimer

**USE AT YOUR OWN RISK.**
This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. 
The author (tilas01) is not responsible for any system lockouts, data loss, bricked installations, or damages resulting from the use of this tool. These are advanced security mechanisms that interact directly with the Linux kernel, PAM, and the bootloader. Ensure you have adequate backups, fallback recovery keys, and understand the tools before deploying them in a production environment.
