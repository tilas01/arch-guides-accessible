<div align="center">
  <img src="assets/icon.png" width="128" height="128" style="border-radius: 50%;">
  <br>
  <img src="assets/banner.png" width="800">
</div>

# Scarecrow Decoy System

Duress and decoy system that triggers cryptographic wipes upon unauthorized access.

## Overview
This standalone application provides comprehensive scarecrow decoy system capabilities for Arch Linux, natively integrated with Wayland/Xorg via `egui` and providing strict CLI parity via `clap`.

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
cd arch-guides-dynamic/security-tools/scarecrow
cargo build --release
```

## Usage
The application can be run as a daemon or launched interactively via the GUI dashboard.

**Daemon Mode:**
```bash
./target/release/scarecrow
```

**Interactive Dashboard (GUI):**
```bash
./target/release/scarecrow --interactive
# or
./target/release/scarecrow -i
```

**Help Menu:**
```bash
./target/release/scarecrow --help
```
