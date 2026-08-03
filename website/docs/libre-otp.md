# 🛡️ Post-Quantum Libre-OTP

**Libre-OTP** is a memory-safe, Rust-based Multi-Factor Authentication (MFA) toolkit specifically engineered to defend against physical access and cold-boot attacks by zeroizing sensitive memory arrays post-use. It generates post-quantum resistant cryptographic keys and stores them securely in a root-protected path (`/etc/libre-otp/`).

## Boot Decryption (LUKS) Integration
When enabled, Libre-OTP integrates into the Arch Linux boot process using a custom `initcpio` hook and a Tokyo Night stylized Plymouth boot prompt.
- The prompt is completely unbranded to serve as a decoy.
- **Duress/Decoy Shutdown:** If a duress password is entered by mistake, the system will instantly power off instead of dropping into an emergency shell or a decoy OS.
- **Boot Tamper Verification:** Supports `--verify-tamper` mode where the computer displays a TOTP code on the screen. If it matches the code on your phone, you have cryptographic proof that the boot environment has not been tampered with (Anti-Evil-Maid).

## System Login (PAM)
Libre-OTP integrates seamlessly into `/etc/pam.d/system-auth`. This enforces an OTP challenge upon any local TTY login or graphical Display Manager login (GDM/SDDM/LightDM).

## SSH Access
Libre-OTP secures remote connections by enforcing:
```bash
AuthenticationMethods publickey,keyboard-interactive
ForceCommand /usr/local/bin/libre-otp --gate
```
This guarantees that attackers possessing stolen SSH keys still cannot gain a shell without the hardware-backed OTP.

## LUKS1 vs LUKS2: Post-Quantum Resilience
- **LUKS1** uses `PBKDF2`, which is vulnerable to GPU-based brute-force attacks and future quantum decryption.
- **LUKS2** uses `Argon2id`, a memory-hard algorithm that provides robust resistance to GPU and post-quantum attacks.
> ⚠️ **WARNING:** The standard GRUB bootloader **does not** natively support LUKS2 Argon2id. If you select GRUB, you must use LUKS1 or an unencrypted `/boot` partition. Systemd-boot (UKI) fully supports LUKS2 out of the box.
