# Bootloader: systemd-boot

Minimal and built into systemd. Recommended for standard setups.

```bash
bootctl install --esp-path=/efi
```

Create `/efi/loader/loader.conf`:
```text
default arch.conf
timeout 4
console-mode max
editor no
```

Create `/efi/loader/entries/arch.conf`:
```text
title   Arch Linux
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options root=UUID=<YOUR-ROOT-UUID> rw
```
*(If using LUKS, options should include `rd.luks.name=<UUID>=cryptroot root=/dev/mapper/cryptroot rw`)*

Proceed to **[Step 5: Secure Boot](../README.md#step-5--secure-boot-optional)** or **[Step 6: Dual Boot](../README.md#step-6--dual-booting-optional)**.
