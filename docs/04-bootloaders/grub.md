# Bootloader: GRUB

Classic, highly customizable.

```bash
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
```

Edit `/etc/default/grub` if you have LUKS or LVM to add `cryptdevice=UUID=<UUID>:cryptroot`.

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

Proceed to **[Step 5: Secure Boot](../README.md#step-5--secure-boot-optional)** or **[Step 6: Dual Boot](../README.md#step-6--dual-booting-optional)**.
