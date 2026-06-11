# 🦀 Arch Rusty Security Suite

The Arch Rusty Security Suite (ARSS) is a collection of high-security Rust-based tools authored by [tilas01](https://github.com/tilas01). These tools can be installed individually or as a complete suite to harden your Arch Linux installation.

## Downloading the Suite

You can download the pre-compiled, fully reproducible unified binary from GitHub releases. We strongly recommend verifying the SHA-256 checksum before running any executable.

### Installation & Verification

```bash
# Get the latest version tag
SUITE_VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)

# Download the unified binary and checksum
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64"
curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64.sha256"

# Verify integrity
echo "Verifying integrity..."
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256

# Make executable and install
chmod +x arch-rusty-security-suite-linux-x86_64
sudo cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite
```

---

## 🔐 Libre OTP

TOTP-based two-factor authentication designed for Linux PAM without proprietary backends. Compatible with Aegis, 2FAS, Google Authenticator, etc.

**Features:**
- Supports login, boot (initramfs), or both.
- Configurable hash algorithm (SHA1, SHA256, SHA512).
- **Double OTP Mode:** Requires two valid consecutive TOTP codes for maximum security.
- **Bypass Password:** Set a dedicated emergency bypass password with a limited number of uses (1-10).
- **Recovery Codes:** Generates up to 20 one-time-use recovery codes.

**Setup:**
```bash
arch-rusty-security-suite libre-otp --setup --mode login --hash sha1 --recovery-codes 5 --bypass-uses 3
```

---

## 🛡️ Input Guard (Anti-Ducky)

Monitors USB HID input devices in a sandbox to prevent malicious keystroke injection from devices like Rubber Ducky or BadUSB.

**Setup:**
```bash
arch-rusty-security-suite ducky --approve-current
```

---

## 👁️ Kernel Watcher (Semi-EDR)

An asynchronous file-monitoring EDR daemon. Watches critical files and detects rootkits, malicious SSH/browser credential theft, and unauthorized module loading. Quarantines known malicious patterns automatically.

**Setup:**
```bash
arch-rusty-security-suite kernel-watcher --setup
arch-rusty-security-suite kernel-watcher --start
```

---

## 👻 Libre-Cyber-ScareCrow

A decoy virtual machine environment. Spawns fake `VBoxService` processes, registry keys, and VMware artifacts to trick evasive malware into triggering their anti-sandbox killswitches, effectively making the malware self-terminate.

**Setup:**
```bash
arch-rusty-security-suite scarecrow
```

---

## 🕵️ Anti-Evil Maid Decoys

Monitors the boot partition for tampering. It hashes the primary kernel on setup. During every boot, it validates the checksum to detect Evil Maid attacks. Includes decoy kernel backups.

**Setup:**
```bash
arch-rusty-security-suite aem --setup --main-kernel linux --backup-kernel none
```

---

## ☠️ Panic Password

Emergency duress-wipe mechanism. If forced to decrypt your disk against your will, entering the Panic Password twice at the LUKS prompt triggers a DoD 3-pass wipe of the LUKS header and encryption keys, permanently destroying all data.

**Setup:**
```bash
arch-rusty-security-suite panic --setup
```

---

## 📱 Notification Webhooks

Receive real-time alerts when security events occur (e.g., Evil Maid detection, OTP lockout, Kernel Watcher quarantine, Recovery Code used).

**Setup:**
```bash
# Uses ntfy.sh, bark, discord, telegram, slack, or custom URL
arch-rusty-security-suite webhooks --install-service
```

---

## 🔍 Arch ISO Verification

Verifies the live ISO integrity immediately before installation. Scrapes the official Arch Linux mirrors to confirm the SHA-256 hash matches the local media.

**Usage:**
```bash
arch-rusty-security-suite verify-iso /dev/sr0
```

---

## 🔒 Hardened SSH

Disables password authentication and root login. Generates strictly secure Ed25519 host keys and forces ChaCha20-Poly1305 ciphers. Works flawlessly with Libre OTP for 2FA SSH.

**Setup:**
```bash
arch-rusty-security-suite ssh --harden
```
