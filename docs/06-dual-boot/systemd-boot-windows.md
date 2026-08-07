

# Unix Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

# Dual Boot: systemd-boot

`systemd-boot` natively auto-detects Windows.
Ensure Windows is installed on the same EFI partition as Arch Linux, or copy the `EFI/Microsoft` folder into the Arch `/efi` partition.

**No `os-prober` needed!** The boot menu will automatically list "Windows Boot Manager".

Proceed to **[Step 7: Post-Installation](../07-post-installation.md)**.
