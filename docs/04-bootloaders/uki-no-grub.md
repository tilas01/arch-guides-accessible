<img src="../../img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ?? Legal Disclaimer & AI Notice
> *?? AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

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
