#!/bin/bash
# verify-integrity.sh - Arch Rusty Security Suite

echo "=== Arch Rusty Security Suite Integrity Verifier ==="
if [ "$#" -ne 1 ]; then
    echo "Usage: ./verify-integrity.sh <binary-file>"
    exit 1
fi

BINARY=$1
SHA_FILE="${BINARY}.sha256"
ASC_FILE="${BINARY}.asc"
PUB_KEY="tilas01-public-key.asc"

if [ ! -f "$BINARY" ] || [ ! -f "$SHA_FILE" ]; then
    echo "Error: Missing binary or .sha256 file."
    exit 1
fi

echo "[1/2] Verifying SHA-256 Hash..."
sha256sum -c "$SHA_FILE"
if [ $? -ne 0 ]; then
    echo "❌ HASH VERIFICATION FAILED! Do not run this binary."
    exit 1
fi
echo "✅ Hash matches successfully."

if [ -f "$ASC_FILE" ]; then
    echo ""
    echo "[2/2] Verifying GPG Signature..."
    
    if [ ! -f "$PUB_KEY" ]; then
        echo "Public key not found locally. Downloading official key from GitHub..."
        curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/tilas01-public-key.asc" -o "$PUB_KEY"
    fi

    gpg --import "$PUB_KEY" 2>/dev/null
    gpg --verify "$ASC_FILE" "$BINARY"
    if [ $? -ne 0 ]; then
        echo "❌ GPG SIGNATURE VERIFICATION FAILED! Do not run this binary."
        exit 1
    fi
    echo "✅ GPG Signature matches successfully."
else
    echo ""
    echo "[2/2] Skipping GPG check (missing .asc file)."
fi

echo ""
echo "Integrity check passed. You may safely run the binary."
