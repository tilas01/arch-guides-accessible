#!/bin/bash
# backup_dependencies.sh
# Clones critical dependency repositories into archive/ for offline reproducibility.
# Run this script from the repo root to fetch the latest versions.
# The cloned directories are .gitignored — they are for local use only.
# Credit original authors when distributing.

set -e

ARCHIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=============================================="
echo "  *nix Guides Dependency Archive Tool"
echo "  Saving to: $ARCHIVE_DIR"
echo "=============================================="

# ── Dusky OS ──────────────────────────────────────
echo ""
echo "[1/2] Archiving Dusky OS (by dusklinux)..."
echo "      Credit: https://github.com/dusklinux/dusky"
DUSKY_DIR="$ARCHIVE_DIR/dusky-os"
if [ -d "$DUSKY_DIR/.git" ]; then
    echo "  -> Already cloned, pulling latest..."
    git -C "$DUSKY_DIR" pull --quiet
else
    git clone --depth=1 https://github.com/dusklinux/dusky.git "$DUSKY_DIR"
fi
echo "  -> Dusky OS archived at $DUSKY_DIR"

# ── OpenDoas ──────────────────────────────────────
echo ""
echo "[2/2] Archiving OpenDoas (by Duncaen)..."
echo "      Credit: https://github.com/Duncaen/OpenDoas"
DOAS_DIR="$ARCHIVE_DIR/opendoas"
if [ -d "$DOAS_DIR/.git" ]; then
    echo "  -> Already cloned, pulling latest..."
    git -C "$DOAS_DIR" pull --quiet
else
    git clone --depth=1 https://github.com/Duncaen/OpenDoas.git "$DOAS_DIR"
fi
echo "  -> OpenDoas archived at $DOAS_DIR"

echo ""
echo "=============================================="
echo "  All dependencies archived successfully."
echo "  NOTE: These dirs are .gitignored."
echo "  Run this script again to update them."
echo "=============================================="
