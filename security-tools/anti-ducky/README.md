<div align="center">
  <img src="assets/icon.png" width="128" height="128" style="border-radius: 50%;">
  <br>
  <img src="assets/banner.png" width="800">
</div>

# Anti-Ducky USB HID Monitor

Intelligent USB HID Input Manager - detects, sandboxes, and alerts on RubberDucky/BadUSB payloads.

## Overview
This standalone application provides comprehensive anti-ducky usb hid monitor capabilities for Arch Linux, natively integrated with Wayland/Xorg via `egui` and providing strict CLI parity via `clap`.

## Build Instructions
Ensure you have the Rust toolchain installed:
```bash
# Install rustup
pacman -S rustup
rustup default stable
```

Clone the repository and build:
```bash
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic/security-tools/anti-ducky
cargo build --release
```

## Usage
The application can be run as a daemon or launched interactively via the GUI dashboard.

**Daemon Mode:**
```bash
./target/release/anti-ducky
```

**Interactive Dashboard (GUI):**
```bash
./target/release/anti-ducky --interactive
# or
./target/release/anti-ducky -i
```

**Help Menu:**
```bash
./target/release/anti-ducky --help
```


## Cryptographic Memory Hygiene

To prevent cold boot attacks, memory scraping, and privilege escalation vulnerabilities, this tool employs strict cryptographic memory hygiene. All sensitive data (passwords, PINs, cryptographic seeds, and TOTP secrets) are handled via the `zeroize` crate.

As soon as a sensitive variable falls out of scope or is no longer immediately required for verification, its memory address is explicitly overwritten with zeroes. This guarantees that your secrets do not linger in RAM.
