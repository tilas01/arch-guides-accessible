#!/bin/bash
# Arch Guides: Automated Rust Compiler & Runner

set -e
echo "[+] Bootstrapping Rust Environment..."
pacman -Sy --noconfirm --needed rustup git
rustup default stable

echo "[+] Fetching Repository..."
git clone --depth 1 https://github.com/tilas01/arch-guides-accessible.git /tmp/arch-repo
cd /tmp/arch-repo/rust-installer

echo "[+] Compiling Highly Optimized Async Installer..."
cargo build --release

echo "[+] Executing..."
./target/release/arch-installer

echo "[+] Cleaning up build dependencies..."
cd /
rm -rf /tmp/arch-repo
rustup self uninstall -y || true
pacman -Rs --noconfirm rustup git || true

echo "[+] Finished."
