<div align="center">
  <img src="assets/icon.png" width="128" height="128" style="border-radius: 50%;">
  <br>
  <img src="assets/banner.png" width="800">
</div>

# Kernel Watcher (EDR)

eBPF-based EDR for real-time kernel integrity monitoring.

## Overview
This standalone application provides comprehensive kernel watcher (edr) capabilities for Arch Linux, natively integrated with Wayland/Xorg via `egui` and providing strict CLI parity via `clap`.

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
cd arch-guides-dynamic/security-tools/kernel-watcher
cargo build --release
```

## Usage
The application can be run as a daemon or launched interactively via the GUI dashboard.

**Daemon Mode:**
```bash
./target/release/kernel-watcher
```

**Interactive Dashboard (GUI):**
```bash
./target/release/kernel-watcher --interactive
# or
./target/release/kernel-watcher -i
```

**Help Menu:**
```bash
./target/release/kernel-watcher --help
```
