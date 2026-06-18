<div align="center">
  <img src="assets/icon.png" width="128" height="128" style="border-radius: 50%;">
  <br>
  <img src="assets/banner.png" width="800">
</div>

# Anti-Evil Maid Boot Integrity

Detects bootloader and kernel tampering to prevent Evil Maid attacks.

## Overview
This standalone application provides comprehensive anti-evil maid boot integrity capabilities for Arch Linux, natively integrated with Wayland/Xorg via `egui` and providing strict CLI parity via `clap`.

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
cd arch-guides-dynamic/security-tools/anti-evil-maid
cargo build --release
```

## Usage
The application can be run as a daemon or launched interactively via the GUI dashboard.

**Daemon Mode:**
```bash
./target/release/anti-evil-maid
```

**Interactive Dashboard (GUI):**
```bash
./target/release/anti-evil-maid --interactive
# or
./target/release/anti-evil-maid -i
```

**Help Menu:**
```bash
./target/release/anti-evil-maid --help
```
