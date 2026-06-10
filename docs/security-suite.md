# 🦀 Arch Rusty Security Suite (ARSS)

> **Author:** [tilas01](https://github.com/tilas01) — MIT / GPL-3.0 Licensed  
> **Repository:** [arch-guides-dynamic/security-tools](https://github.com/tilas01/arch-guides-dynamic/tree/main/security-tools)  
> **Releases:** [Download Latest](https://github.com/tilas01/arch-guides-dynamic/releases)

The **Arch Rusty Security Suite (ARSS)** is a state-of-the-art Rust-based security toolkit designed for Arch Linux bare-metal installations.

## The 10 Modules of ARSS

### 1. 🔐 Libre-OTP (Boot & Login 2FA)
Libre-OTP integrates TOTP (Time-Based One-Time Passwords) directly into the Linux PAM (Pluggable Authentication Modules) stack. This enforces two-factor authentication before decryption at boot, upon logging into the TTY, or when accessing the system via SSH. Supports SHA-1, SHA-256, and SHA-512, with offline recovery codes.

### 2. 🛡️ Input Guard (Anti-Ducky)
Input Guard is a robust USB HID sandbox designed to defeat malicious hardware like the USB Rubber Ducky. Any new HID plugged into the system is automatically blocked until manually authorized. It also monitors typing speed heuristics—if an "authorized" keyboard begins typing at 10,000 WPM, it is severed and flagged.

### 3. 🔍 ISO & Release Verification
Automates the fetching and verification of official SHA-256 checksums and GnuPG `.asc` signatures for both Arch Linux ISOs and ARSS Release binaries.

### 4. ☠️ Panic Password (Duress Wipe)
Provides emergency duress protection. If you are compelled to unlock your device under duress, entering the Panic Password twice in a row triggers an immediate, irreversible DoD 3-pass overwrite of your entire LUKS header. The system will be permanently destroyed.

### 5. 📱 Notification Webhooks (Ntfy.sh)
Connects ARSS directly to your mobile device. Whenever the Kernel Watcher detects malware, or Anti-Evil-Maid detects tampering, an instant push notification is fired to your phone via Ntfy.sh, Discord, Slack, or Bark.

### 6. 🔒 Hardened SSH + OTP
Aggressively hardens the OpenSSH daemon by enforcing Ed25519 keys, ChaCha20-Poly1305, and pairing with Libre-OTP to require both a private key file AND a time-based 2FA token to authenticate.

### 7. 🕵️ Anti-Evil Maid (AEM)
Creates decoy kernel images and verifies the cryptographic checksum of the real kernel on every boot to protect the unencrypted `/boot` partition against physical Evil Maid attacks.

### 8. 🥷 Kloak Anonymizer
Intercepts raw `/dev/input` events and obfuscates keystroke timing, making your typing pattern completely unidentifiable to web trackers and behavioral biometrics.

### 9. 👁️ Malicious Kernel Behavior Watcher (Semi-EDR)
An asynchronous, highly-optimized semi-EDR daemon written in Rust. It immediately detects unauthorized reads to Infostealer targets (`~/.config/google-chrome`, `~/.ssh/`), monitors `/dev/input/` for software keyloggers, and watches `/etc/ld.so.preload` for rootkits. Alerts you instantly via Webhooks.

### 10. 👻 Libre-Cyber-ScareCrow (Sandbox Spoofing)
Weaponizes the "anti-analysis" killswitches of advanced malware. It turns your bare-metal Arch installation into a "fake" analysis environment by spawning lightweight dummy processes (`VBoxService`, `wireshark`, `ida64`) and fake sandbox artifacts. Malware scans the process tree, thinks it is in a hostile sandbox, and immediately self-terminates to avoid detection.

---

## Build From Source & Verification

All builds are **reproducible**.

```bash
git clone https://github.com/tilas01/arch-guides-dynamic.git
cd arch-guides-dynamic/security-tools
cargo build --release --locked

sha256sum target/release/arch-rusty-security-suite
```

Verify downloaded releases via the official verification scripts:
- **Linux:** `scripts/run-rust-installer.sh`
- **Windows:** `scripts/verify-integrity.bat`
