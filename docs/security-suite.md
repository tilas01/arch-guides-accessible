# 🦀 Arch Rusty Security Suite

> **Author:** [tilas01](https://github.com/tilas01) — MIT / GPL-3.0 Licensed  
> **Repository:** [arch-guides-dynamic/security-tools](https://github.com/tilas01/arch-guides-dynamic/tree/main/security-tools)  
> **Releases:** [Download Latest](https://github.com/tilas01/arch-guides-dynamic/releases)

The **Arch Rusty Security Suite (ARSS)** is a Rust-based security toolkit designed for Arch Linux. It bundles multiple security tools into a single, reproducible binary — or you can use each tool individually.

## Suite vs Individual Tools

| Mode | Binary | Services | Use Case |
|------|--------|----------|----------|
| **Full Suite** (recommended) | `arch-rusty-security-suite` | 1 binary, subcommands | Using 2+ tools — fewer services, simpler management |
| **Individual** | `libre-otp`, `anti-ducky`, `arch-iso-verifier` | 1 binary per tool | Using only 1 tool — minimal footprint |

> 💡 **Recommendation:** If you plan to use Libre OTP, Input Guard, and ISO Verifier together, install the full suite. It functions identically but runs as 1 service instead of 3 separate ones.

All builds are **reproducible** — you can verify by building from source and comparing SHA256 hashes. See [Build From Source](#build-from-source) below.

---

## Libre OTP

**TOTP-based Two-Factor Authentication for Linux login, boot, and SSH.**

Libre OTP integrates with PAM (Pluggable Authentication Modules) to require a time-based one-time password at:
- **Login** — TTY or display manager login
- **Boot** — initramfs prompt before kernel continues (maximum security)
- **SSH** — remote SSH sessions via sshd PAM stack
- **All three** — full coverage

### Hash Algorithms

| Algorithm | Compatibility | Security |
|-----------|---------------|----------|
| **SHA1** (default) | Works with all authenticator apps (Google Authenticator, Aegis, Authy, etc.) | Standard — sufficient for TOTP |
| **SHA256** | Aegis, KeePassXC, some others | Stronger hash, fewer compatible apps |
| **SHA512** | Aegis, KeePassXC | Maximum hash strength, fewest compatible apps |

> 💡 **Recommendation:** Use SHA1 for maximum compatibility unless you know your authenticator app supports SHA256/512.

### OTP Setup

```bash
# Full suite
arch-rusty-security-suite otp --setup --algo sha1

# Individual
libre-otp --setup --algo sha1
```

This generates a TOTP secret, displays a QR code for scanning with your authenticator app, and creates recovery codes.

### Recovery Codes

During setup, **5 cryptographically secure recovery codes** are generated. These are your backup if you lose your authenticator device.

- Recovery codes are stored **hashed** (SHA-256) in `/etc/libre-otp/recovery.json`
- Each code can only be used **once**
- When a recovery code is used, an **alert is sent** via your configured webhook (ntfy/bark/custom)
- You are notified of remaining recovery codes after each use

**Managing recovery codes:**

```bash
# View remaining unused recovery codes (requires root)
arch-rusty-security-suite otp --show-recovery

# Reset and generate new recovery codes
arch-rusty-security-suite otp --reset-recovery
```

### PAM Integration

The generated install script automatically adds OTP to the appropriate PAM files:

```bash
# Login only
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/login

# Boot (system-auth)
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/system-auth

# SSH
echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sshd
```

### Customisation

Libre OTP is fully customisable via its configuration at `/etc/libre-otp/config.toml`:

- TOTP period (default: 30 seconds)
- Digits (default: 6)
- Hash algorithm
- Recovery code count (default: 5, configurable up to any number in source)
- Webhook URL for recovery code alerts
- Memory-safe and disk-safe: secrets are zeroised after use

---

## Input Guard (Anti-Ducky)

**USB HID Sandboxing & Rubber Ducky Detection**

Input Guard protects against BadUSB / Rubber Ducky attacks by:

1. **Device Approval** — At install time, all currently connected input devices are approved. Any new USB HID device triggers an alert and is blocked until manually approved.
2. **Spoofing Detection** — Monitors for devices attempting to impersonate approved device IDs (vendor/product ID spoofing).
3. **Inhuman Typing Speed** — Even if a device passes approval, Input Guard watches for typing patterns that exceed human capability (characteristic of Rubber Ducky payloads). Suspicious input is cancelled and the payload is captured for review.
4. **Self-Healing Permissions** — Config files at `/etc/input-guard/` are root-protected. The service enforces correct permissions on startup and re-protects if modified.

### Setup

```bash
# Approve current devices and create initial config
arch-rusty-security-suite input-guard --init

# Start the service
systemctl enable --now input-guard.service
```

### How It Works

Input Guard runs as a root-level systemd service monitoring `/dev/input/` events:

- New device detected → **block + alert** (webhook notification if configured)
- Known device, normal typing → **allow**
- Known device, inhuman speed → **block + capture payload + alert**
- Device ID spoofing attempt → **block + alert**

The service cannot be disabled without root access. Configuration changes require root.

---

## ISO Verifier

**Verify Arch Linux ISO Integrity**

Before installing Arch, verify that your ISO hasn't been tampered with:

```bash
# Verify ISO on USB or file
arch-rusty-security-suite verify-iso /path/to/archlinux.iso

# Or verify the USB device directly
arch-rusty-security-suite verify-iso /dev/sdb
```

The verifier:
1. Computes SHA-256 hash of the ISO/device
2. Compares against official Arch Linux SHA256SUMS (fetched from archlinux.org or provided manually)
3. Reports PASS/FAIL with hash comparison

> 💡 **Recommendation:** Always verify your ISO before installing. The generator places ISO verification as the **first step** when security tools are enabled.

---

## Panic Password (Emergency Wipe)

**Duress-Activated DoD 3-Pass Disk Destruction**

If you're in a situation where you're compelled to decrypt your drive under duress, the panic password triggers a complete disk wipe instead of decryption.

### How It Works

1. At LUKS decrypt prompt, entering the **panic password once** shows a slightly different error message — a subtle emoji is added to the standard error. This alerts you (but not an observer) that you've entered the panic code.
2. Entering the panic password a **second time** (as if "confirming") initiates the wipe sequence.
3. The system performs a **DoD 5220.22-M 3-pass overwrite**:
   - Pass 1: Write zeros
   - Pass 2: Write ones (0xFF)
   - Pass 3: Write random data
4. After wipe, the LUKS header is destroyed — data is irrecoverable.

### Important Notes

- The panic password is set during LUKS setup alongside your real password
- The error message difference is **intentionally subtle** — only you should know what to look for
- Standard incorrect passwords show the normal error with no emoji
- There is no lockout for normal incorrect attempts — brute force is prevented by LUKS key derivation (Argon2id)
- You can customise the confirmation error message (templates available below)

### Suggested Error Message Templates

Choose a subtle message that only you would recognise as the panic confirmation:

| Template | Example |
|----------|---------|
| Emoji only | `❌ Incorrect passphrase. Try again.` (vs normal `Incorrect passphrase.`) |
| Typo style | `Incorect passphrase. Try again.` (deliberate single-r typo) |
| Extra period | `Incorrect passphrase.. Try again.` (double period) |
| Capitalisation | `incorrect passphrase. Try again.` (lowercase i) |

> ⚠️ **The panic password feature is irreversible.** Test in a VM before deploying. Never share your panic password or its error signature.

---

## Webhooks & Notifications

**Real-Time Security Alerts to Your Phone**

Configure webhook notifications to receive alerts about security events:

### Supported Providers

| Provider | Self-Hosted | Recommended | Notes |
|----------|-------------|-------------|-------|
| **ntfy.sh** | No (free service) | ✅ Yes | No server needed, free, iOS + Android apps |
| **Bark** | Yes (needs server) | ❌ | Adds overhead, needs a VPS or always-on server |
| **Discord** | No | — | Webhook URL from channel settings |
| **Telegram** | No | — | Bot API token + chat ID |
| **Slack** | No | — | Incoming webhook URL |
| **Custom** | Varies | — | Any URL that accepts POST requests |

### Why ntfy is Recommended

- **Free** — no account needed, no self-hosting
- **No server required** — uses ntfy.sh public instance
- **Apps available** — iOS (App Store) and Android (F-Droid / Play Store)
- **Simple** — just pick a topic name and subscribe

See the [ntfy Setup Guide](ntfy-setup.md) for iOS/Android app setup instructions.

### Events That Trigger Alerts

- 🔑 Recovery code used (OTP)
- 🔌 New USB device detected (Input Guard)
- ⌨️ Inhuman typing speed detected (Input Guard)
- 🚨 Device spoofing attempt (Input Guard)
- ❌ Failed login attempt (PAM)
- 🛡️ Anti-Evil Maid tamper detected
- ☠️ Panic password entered (if configured)

### Configuration

```bash
# Set up ntfy notifications
arch-rusty-security-suite webhook --setup --provider ntfy --topic your-secret-topic

# Test notification
arch-rusty-security-suite webhook --test
```

The webhook config is stored at `/etc/arch-security/webhook.conf`.

---

## Kloak — Keystroke Anonymiser

**Timing Obfuscation for Keyboard and Mouse Input**

[kloak](https://github.com/vmonaco/kloak) by vmonaco randomises the timing of your keystrokes and mouse movements to prevent behavioural biometric tracking. Your typing pattern becomes unidentifiable.

### Why Use Kloak

Every person has a unique typing rhythm (keystroke dynamics). This can be used to:
- Identify you across websites and sessions
- De-anonymise Tor/VPN users
- Track you without cookies or fingerprinting

Kloak adds random delays to your input events, making your typing pattern indistinguishable from anyone else's.

### Setup

```bash
# Build and install kloak
git clone https://github.com/vmonaco/kloak.git /opt/kloak
cd /opt/kloak && make && cp kloak /usr/local/bin/

# Enable as systemd service
systemctl enable --now kloak.service
```

---

## Anti-Evil Maid Decoys

**Detect Physical Boot-Level Tampering**

Anti-Evil Maid creates decoy kernel entries and backup EFI images to detect if someone has physically tampered with your boot chain while you were away.

### How It Works

1. Creates a copy of your kernel/initramfs with known checksums
2. On each boot, verifies the checksums haven't changed
3. If tampered → alerts via webhook + shows warning at boot
4. Decoy entries in bootloader make it harder for an attacker to identify the real boot entry

### Kernel Settings

When Anti-Evil Maid is enabled, you can configure:
- **Main kernel** — your primary kernel for daily use
- **Backup kernel** — fallback if main kernel is compromised or fails to boot
- **Whether to use a backup** — none, or select which backup kernel

These settings appear in the generator when Anti-Evil Maid is enabled.

---

## Hardened SSH + OTP

**Maximum-Security SSH Configuration**

When both SSH and OTP are enabled:

1. **Ed25519 only** — no RSA, DSA, or ECDSA keys
2. **ChaCha20-Poly1305** + AES-256-GCM ciphers only
3. **No root login** (configurable)
4. **No password authentication** — key-auth only
5. **OTP 2FA** — TOTP required after key authentication via PAM
6. **Strict limits** — MaxAuthTries 3, LoginGraceTime 30s, no forwarding

```bash
# Generate Ed25519 host keys
ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""

# Generate user key pair
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C "user@arch"
```

> ⚠️ **Save your SSH private key** before rebooting. Password auth is disabled — you will be locked out without your key.

---

## Other Security Tools

These are independent third-party tools that complement the ARSS:

### AppArmor
Mandatory Access Control (MAC) policies. Restricts what programs can access at the kernel level.

```bash
pacman -S apparmor
systemctl enable apparmor
```

### USBGuard
USB device whitelisting. Only approved USB devices can connect.

```bash
pacman -S usbguard
usbguard generate-policy > /etc/usbguard/rules.conf
systemctl enable --now usbguard
```

### auditd
Kernel-level syscall logging. Monitors file access, privilege escalation, and more.

```bash
pacman -S audit
systemctl enable --now auditd
```

### fail2ban
SSH brute-force protection. Bans IPs after repeated failed login attempts.

```bash
pacman -S fail2ban
systemctl enable --now fail2ban
```

---

## Build From Source

All ARSS builds are **reproducible**. You can build from source and verify the hash matches the release:

```bash
# Clone the repository
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic/security-tools

# Build all tools (requires Rust stable + libevdev-dev)
cargo build --release --locked

# Full suite binary
ls -la target/release/arch-rusty-security-suite

# Individual binaries
ls -la target/release/libre-otp
ls -la target/release/anti-ducky
ls -la target/release/arch-iso-verifier

# Verify hash matches release
sha256sum target/release/arch-rusty-security-suite
# Compare with .sha256 file from the release page
```

### Dependencies

- Rust stable toolchain
- `libevdev-dev` (for Input Guard evdev support)
- `pkg-config`

### Reproducibility

The CI pipeline builds twice and compares hashes to ensure reproducibility. If you build with the same Rust version and `--locked` flag, your hash should match the release.

---

## Integrity Verification

### SHA-256

Every release includes `.sha256` files:

```bash
sha256sum -c arch-rusty-security-suite-linux-x86_64.sha256
```

### GPG Verification

If GPG signing is configured, releases include `.asc` signature files:

```bash
# Import the signing key
gpg --keyserver keyserver.ubuntu.com --recv-keys <KEY_ID>

# Verify signature
gpg --verify arch-rusty-security-suite-linux-x86_64.asc arch-rusty-security-suite-linux-x86_64
```

### Reproducible Build Verification

Build from source and compare your hash with the release hash — they should match exactly.
