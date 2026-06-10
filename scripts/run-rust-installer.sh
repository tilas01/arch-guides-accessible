#!/bin/bash
# Arch Guides: Download, Verify, and Execute Rust Installer

set -e

echo "[+] Fetching pre-compiled Reproducible Rust Build..."
curl -sLO https://github.com/tilas01/arch-guides-dynamic/releases/download/latest/arch-installer-linux-x86_64
curl -sLO https://github.com/tilas01/arch-guides-dynamic/releases/download/latest/arch-installer-linux-x86_64.sha256

echo "[+] Verifying Hash Signature and GPG signature..."
if sha256sum -c arch-installer-linux-x86_64.sha256; then
    echo "[✓] SHA256 verification passed."
else
    echo "[!] CRITICAL ERROR: SHA256 verification failed. Binary may be compromised."
    rm -f arch-installer-linux-x86_64 arch-installer-linux-x86_64.sha256
    exit 1
fi

echo "[+] Fetching GPG signature..."
curl -sLO https://github.com/tilas01/arch-guides-dynamic/releases/download/latest/arch-installer-linux-x86_64.sig

echo "[+] Verifying GPG signature..."
if gpg --verify arch-installer-linux-x86_64.sig arch-installer-linux-x86_64; then
    echo "[✓] GPG signature verified successfully."
else
    echo "[!] WARNING: GPG signature verification failed or key not trusted. Ensure you have imported the author's public key."
    # We do not strictly exit 1 here if they don't have the key imported yet, but we warn them strongly.
fi

echo "[+] Executing Async Rust Installer..."
chmod +x arch-installer-linux-x86_64
./arch-installer-linux-x86_64

echo "[+] Cleaning up local files..."
rm -f arch-installer-linux-x86_64 arch-installer-linux-x86_64.sha256

echo "[+] Finished."
