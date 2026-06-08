#!/bin/bash
# Arch Guides: Download, Verify, and Execute Rust Installer

set -e

echo "[+] Fetching pre-compiled Reproducible Rust Build..."
curl -sLO https://github.com/tilas01/arch-guides-accessible/releases/download/latest/arch-installer-linux-x86_64
curl -sLO https://github.com/tilas01/arch-guides-accessible/releases/download/latest/arch-installer-linux-x86_64.sha256

echo "[+] Verifying Hash Signature against Git-hosted checksum..."
if sha256sum -c arch-installer-linux-x86_64.sha256; then
    echo "[✓] Hash verification passed."
else
    echo "[!] CRITICAL ERROR: Hash verification failed. Binary may be compromised."
    rm -f arch-installer-linux-x86_64 arch-installer-linux-x86_64.sha256
    exit 1
fi

echo "[+] Executing Async Rust Installer..."
chmod +x arch-installer-linux-x86_64
./arch-installer-linux-x86_64

echo "[+] Cleaning up local files..."
rm -f arch-installer-linux-x86_64 arch-installer-linux-x86_64.sha256

echo "[+] Finished."
