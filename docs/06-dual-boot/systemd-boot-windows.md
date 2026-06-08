# Dual Boot: systemd-boot

`systemd-boot` natively auto-detects Windows.
Ensure Windows is installed on the same EFI partition as Arch Linux, or copy the `EFI/Microsoft` folder into the Arch `/efi` partition.

**No `os-prober` needed!** The boot menu will automatically list "Windows Boot Manager".

Proceed to **[Step 7: Post-Installation](../07-post-installation.md)**.
