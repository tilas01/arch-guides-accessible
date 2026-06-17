# 🦀 Rust Security Apps

The following are individual, standalone security applications authored by tilas01 to provide granular, specific hardening for Arch Linux.

### Input Guard (Anti-Ducky)
Input Guard is a daemon that monitors the Linux kernel input subsystem (`/dev/input/event*`) for keystroke injection attacks typically executed by malicious USB devices (like the Hak5 Rubber Ducky). It fingerprints the speed and cadence of typing, and aggressively sandboxes or drops the USB interface if the input speed wildly exceeds human capabilities.

### Anti-Evil Maid
Protects against physical tampering of the `/boot` partition. This daemon hashes your LUKS header, bootloader payload, and initramfs, securely sealing those checksums with your TPM 2.0 module. Upon boot, it verifies the hashes before prompting for decryption, deterring "Evil Maid" attacks where an attacker modifies the bootloader to steal your password.

### Kernel Watcher (EDR)
An advanced Endpoint Detection and Response (EDR) agent that leverages eBPF and `kprobes` to actively monitor unauthorized kernel module loading, anomalous system calls, and attempts to modify `/proc/kcore` or `kallsyms`.

### ScareCrow (LKM)
A highly specialized Linux Kernel Module (LKM) that creates deceptive hooks and decoys at Ring-0. It leverages Netfilter to spoof active services on unused ports to trap automated scanners, and uses Kprobes to log execution of sensitive binaries without userspace evasion.

### Kloak
Kloak (created by vmonaco) is a keystroke anonymizer that adds random delays to keyboard events. This defeats keystroke biometric profiling, where advanced trackers identify you based on the unique timing patterns of your typing.
