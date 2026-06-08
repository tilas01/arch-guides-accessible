# Bootloader: UKI (No GRUB)

Unified Kernel Images package everything into a single `.efi` file.
Recommended for high-security Secure Boot.

Create `/etc/kernel/cmdline`:
```text
root=UUID=<ROOT-UUID> rw
# OR for LUKS:
# rd.luks.name=<UUID>=cryptroot root=/dev/mapper/cryptroot rw
```

Use the `arch-secure-boot.sh` script to bundle the UKI. See **[Secure Boot Custom Keys](../05-secure-boot/custom-keys-uki.md)**.
