<img src="../../img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ?? Legal Disclaimer & AI Notice
> *?? AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

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
