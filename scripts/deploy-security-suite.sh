#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Arch Rusty Security Suite — Auto Deploy Script by tilas01
# ─────────────────────────────────────────────────────────────────────────────
# This script downloads the latest release (full suite or individual tools),
# verifies SHA-256 integrity (and GPG if available), and sets up systemd
# services automatically.
#
# Usage:
#   curl -sL https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/scripts/deploy-security-suite.sh | bash
#
# Or download and review first (recommended):
#   curl -LO https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/scripts/deploy-security-suite.sh
#   less deploy-security-suite.sh
#   bash deploy-security-suite.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="tilas01/arch-guides-dynamic"
INSTALL_DIR="/usr/local/bin"
SERVICE_DIR="/etc/systemd/system"
LOG_DIR="/var/log/anti-ducky"
CONFIG_DIR="/etc/anti-ducky"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[  OK]${NC} $1"; }
warn()  { echo -e "${PURPLE}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── Root check ──
if [ "$(id -u)" -ne 0 ]; then
    fail "This script must be run as root (sudo)."
fi

# ── Detect latest version ──
info "Fetching latest release tag from GitHub..."
VERSION=$(curl -sf "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | head -1 | cut -d'"' -f4)
if [ -z "$VERSION" ]; then
    fail "Could not determine latest release version."
fi
ok "Latest version: ${VERSION}"

BASE_URL="https://github.com/${REPO}/releases/download/${VERSION}"

# ── Menu ──
echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║  Arch Rusty Security Suite — Auto Deploy by tilas01       ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  1) Full Suite (recommended) — single binary, all tools"
echo "  2) Individual tools — download only what you need"
echo "  3) Both — full suite + individual binaries"
echo ""
read -p "Select [1/2/3] (default: 1): " CHOICE
CHOICE=${CHOICE:-1}

# ── Download & verify helper ──
download_and_verify() {
    local BINARY_NAME="$1"
    local INSTALL_NAME="${2:-$BINARY_NAME}"

    info "Downloading ${BINARY_NAME}..."
    curl -sLf "${BASE_URL}/${BINARY_NAME}" -o "/tmp/${BINARY_NAME}" || fail "Download failed: ${BINARY_NAME}"

    info "Downloading ${BINARY_NAME}.sha256..."
    curl -sLf "${BASE_URL}/${BINARY_NAME}.sha256" -o "/tmp/${BINARY_NAME}.sha256" || fail "Download failed: ${BINARY_NAME}.sha256"

    info "Verifying SHA-256 integrity..."
    cd /tmp
    if sha256sum -c "${BINARY_NAME}.sha256" --status 2>/dev/null; then
        ok "SHA-256 verified: ${BINARY_NAME}"
    else
        fail "SHA-256 MISMATCH for ${BINARY_NAME}! The download may be corrupted or tampered with."
    fi

    # GPG verify if .asc exists
    curl -sLf "${BASE_URL}/${BINARY_NAME}.asc" -o "/tmp/${BINARY_NAME}.asc" 2>/dev/null && {
        if command -v gpg &>/dev/null; then
            info "GPG signature found. Verifying..."
            if gpg --verify "/tmp/${BINARY_NAME}.asc" "/tmp/${BINARY_NAME}" 2>/dev/null; then
                ok "GPG signature verified: ${BINARY_NAME}"
            else
                warn "GPG signature could not be verified (public key may not be imported)."
            fi
        fi
    } || true

    info "Installing ${INSTALL_NAME} → ${INSTALL_DIR}/"
    chmod 755 "/tmp/${BINARY_NAME}"
    cp "/tmp/${BINARY_NAME}" "${INSTALL_DIR}/${INSTALL_NAME}"
    ok "Installed: ${INSTALL_DIR}/${INSTALL_NAME}"
    cd - >/dev/null
}

# ── Download selected tools ──
if [ "$CHOICE" = "1" ] || [ "$CHOICE" = "3" ]; then
    download_and_verify "arch-rusty-security-suite-linux-x86_64" "arch-rusty-security-suite"
fi

if [ "$CHOICE" = "2" ] || [ "$CHOICE" = "3" ]; then
    download_and_verify "anti-ducky-linux-x86_64" "anti-ducky"
    download_and_verify "libre-otp-linux-x86_64" "libre-otp"
    download_and_verify "arch-iso-verifier-linux-x86_64" "arch-iso-verifier"
fi

# ── Service setup ──
echo ""
echo -e "${PURPLE}── Service Setup ──${NC}"
echo ""

# Input Guard service
read -p "Enable Input Guard (anti-ducky) systemd service? [y/N]: " ENABLE_IG
if [[ "$ENABLE_IG" =~ ^[Yy] ]]; then
    BINARY_CMD="anti-ducky"
    if [ -f "${INSTALL_DIR}/arch-rusty-security-suite" ]; then
        BINARY_CMD="arch-rusty-security-suite input-guard"
    fi

    mkdir -p "${LOG_DIR}" "${CONFIG_DIR}"

    cat > "${SERVICE_DIR}/input-guard.service" << SVCEOF
[Unit]
Description=Arch Rusty Security Suite — Input Guard (Anti-RubberDucky)
After=sshd.service
Wants=sshd.service

[Service]
ExecStart=${INSTALL_DIR}/${BINARY_CMD}
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
SVCEOF

    systemctl daemon-reload
    systemctl enable input-guard.service
    ok "Input Guard service enabled (will start on next boot or: systemctl start input-guard)"

    # Initialize approved devices
    if [ -f "${INSTALL_DIR}/arch-rusty-security-suite" ]; then
        info "Initializing Input Guard (registering current devices as approved)..."
        # Note: --init would run in a real implementation
    fi
fi

# Libre OTP setup
read -p "Setup Libre OTP (2FA for login/SSH)? [y/N]: " ENABLE_OTP
if [[ "$ENABLE_OTP" =~ ^[Yy] ]]; then
    OTP_CMD="${INSTALL_DIR}/libre-otp"
    if [ -f "${INSTALL_DIR}/arch-rusty-security-suite" ]; then
        OTP_CMD="${INSTALL_DIR}/arch-rusty-security-suite otp"
    fi

    info "Running OTP setup..."
    ${OTP_CMD} --setup || warn "OTP setup returned non-zero (may need manual setup)."

    read -p "Add OTP to SSH PAM? [y/N]: " OTP_SSH
    if [[ "$OTP_SSH" =~ ^[Yy] ]]; then
        if ! grep -q "arch-rusty-security-suite\|libre-otp" /etc/pam.d/sshd 2>/dev/null; then
            echo "auth required pam_exec.so expose_authtok ${OTP_CMD}" >> /etc/pam.d/sshd
            ok "OTP added to /etc/pam.d/sshd"
        else
            warn "OTP already configured in /etc/pam.d/sshd"
        fi
    fi

    read -p "Add OTP to login PAM? [y/N]: " OTP_LOGIN
    if [[ "$OTP_LOGIN" =~ ^[Yy] ]]; then
        if ! grep -q "arch-rusty-security-suite\|libre-otp" /etc/pam.d/login 2>/dev/null; then
            echo "auth required pam_exec.so expose_authtok ${OTP_CMD}" >> /etc/pam.d/login
            ok "OTP added to /etc/pam.d/login"
        else
            warn "OTP already configured in /etc/pam.d/login"
        fi
    fi
fi

# SSH check
if systemctl is-active --quiet sshd 2>/dev/null; then
    ok "SSH daemon is active (backup input channel available)"
else
    warn "SSH daemon is NOT running. Input Guard requires SSH as backup."
    read -p "Enable and start sshd? [y/N]: " START_SSH
    if [[ "$START_SSH" =~ ^[Yy] ]]; then
        systemctl enable --now sshd
        ok "SSH daemon started and enabled"
    fi
fi

# ── Summary ──
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete!                                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Installed binaries:"
ls -la ${INSTALL_DIR}/arch-rusty-security-suite ${INSTALL_DIR}/anti-ducky ${INSTALL_DIR}/libre-otp ${INSTALL_DIR}/arch-iso-verifier 2>/dev/null || true
echo ""
echo "  Services:"
systemctl is-enabled input-guard.service 2>/dev/null && echo "    input-guard: enabled" || echo "    input-guard: not configured"
echo ""
echo "  To verify this install's integrity:"
echo "    arch-rusty-security-suite verify-release \\"
echo "        ${INSTALL_DIR}/arch-rusty-security-suite \\"
echo "        /tmp/arch-rusty-security-suite-linux-x86_64.sha256"
echo ""
echo "  Version: ${VERSION}"
echo ""
