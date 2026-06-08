# Secure Boot: Custom Keys + UKI

Provides the highest level of security by signing your own Unified Kernel Image.

1. `pacman -S sbsigntools efitools efibootmgr`
2. Run `scripts/arch-secure-boot.sh generate-keys`
3. Run `scripts/arch-secure-boot.sh generate-efi`
4. Run `scripts/arch-secure-boot.sh add-efi`
5. Reboot to BIOS, delete factory keys (enter Setup Mode).
6. Boot back and run `scripts/arch-secure-boot.sh enroll-keys`.

Proceed to **[Step 6: Dual Boot](../README.md#step-6--dual-booting-optional)** or **[Step 7: Post-Installation](../README.md#step-7--post-installation--desktop)**.
