# Dual Boot: GRUB & os-prober

If using GRUB, you must use `os-prober` to detect Windows.

```bash
pacman -S os-prober mtools dosfstools
```

Edit `/etc/default/grub` and add/uncomment:
```text
GRUB_DISABLE_OS_PROBER=false
```

Mount the Windows partition if necessary, then regenerate the config:
```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

Proceed to **[Step 7: Post-Installation](../07-post-installation.md)**.
