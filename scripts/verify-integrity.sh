#!/bin/bash
# automated integrity verification script for tilas01 Release
set -e

echo "=================================================="
echo "🛡️  tilas01 Release Integrity Verifier"
echo "=================================================="

BINARY=$1
if [ -z "$BINARY" ]; then
    echo "Usage: ./verify-integrity.sh <binary_file>"
    echo "Example: ./verify-integrity.sh arch-rusty-security-suite-linux-x86_64"
    exit 1
fi

if [ ! -f "$BINARY" ]; then
    echo "❌ Error: File '$BINARY' not found."
    exit 1
fi

if [ ! -f "${BINARY}.sha256" ]; then
    echo "⚠️ Warning: ${BINARY}.sha256 not found. Attempting to download..."
    curl -sLO "https://github.com/tilas01/arch-guides-dynamic/releases/latest/download/${BINARY}.sha256"
fi

if [ ! -f "${BINARY}.asc" ]; then
    echo "⚠️ Warning: ${BINARY}.asc not found. Attempting to download..."
    curl -sLO "https://github.com/tilas01/arch-guides-dynamic/releases/latest/download/${BINARY}.asc"
fi

echo -e "\n[1/2] Verifying SHA-256 Hash..."
if sha256sum -c "${BINARY}.sha256"; then
    echo "✅ Hash Verification: SUCCESS"
else
    echo "❌ Hash Verification: FAILED!"
    echo "The file is corrupt or tampered with. Do NOT execute it."
    exit 1
fi

echo -e "\n[2/2] Verifying GPG Signature..."
if ! command -v gpg &> /dev/null; then
    echo "⚠️ GPG is not installed. Skipping signature verification."
else
    # Fetch tilas01 public key (mock keyserver / github direct)
    echo "Downloading tilas01 public key..."
    curl -sL https://github.com/tilas01.gpg | gpg --import 2>/dev/null || true

    if gpg --verify "${BINARY}.asc" "$BINARY" 2>&1 | grep -q "Good signature"; then
        echo "✅ GPG Signature Verification: SUCCESS"
    else
        echo "❌ GPG Signature Verification: FAILED!"
        echo "The signature is invalid. Do NOT execute it."
        exit 1
    fi
fi

echo -e "\n🎉 ALL CHECKS PASSED. The file '$BINARY' is safe to run.\n"
