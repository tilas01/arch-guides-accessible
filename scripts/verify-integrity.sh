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
    echo "⚠️ GPG is not installed, so the signature cannot be checked."
    echo "   The hash above only proves the download is intact, NOT who made it."
    echo "   Install gnupg and re-run to verify authorship: pacman -S gnupg"
    exit 1
else
    # The signing key is the tilas01.asc committed at the repository root.
    #
    # NOTE: this previously fetched https://github.com/tilas01.keys, which is
    # GitHub's *SSH* public key endpoint. Those are not GPG keys, so the import
    # was a no-op and verification could never succeed.
    if [ ! -f "tilas01.asc" ]; then
        echo "Fetching the tilas01 signing key..."
        curl -sLO "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/tilas01.asc"
    fi

    if ! gpg --import tilas01.asc 2>/dev/null; then
        echo "❌ Could not import the signing key. Aborting."
        exit 1
    fi

    # Check gpg's exit status rather than grepping its text: the wording is
    # localised and "Good signature" can appear in output that still failed.
    if gpg --verify "${BINARY}.asc" "$BINARY" 2>/dev/null; then
        echo "✅ GPG Signature Verification: SUCCESS"
        echo ""
        echo "Fingerprint of the key that signed it:"
        gpg --verify "${BINARY}.asc" "$BINARY" 2>&1 | grep -iE 'using|fingerprint' || true
        echo ""
        echo "⚠️  A valid signature proves the key holder signed this file. Confirm the"
        echo "    fingerprint above matches the one you expect before trusting it."
    else
        echo "❌ GPG Signature Verification: FAILED!"
        echo "The signature is invalid or was made by a different key."
        echo "Do NOT execute this file."
        exit 1
    fi
fi

echo -e "\n🎉 ALL CHECKS PASSED. The file '$BINARY' is safe to run.\n"
