<img src="img/banner.png" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ?? Legal Disclaimer & AI Notice
> *?? AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

This repository maps out every path to building an Arch Linux system. Whether you desire a standard unencrypted setup, or a hardened, Post-Quantum LUKS2 encrypted system utilizing Unified Kernel Images, Secure Boot with custom keys, and active Evil Maid countermeasures, you have full control over the process.

---

Building your Arch Linux system is a series of interconnected choices. Follow this linear map to build your precise setup.

### 1. Pre-Installation
All installations begin here. You will verify your boot mode, connect to the internet, and sync your clock.
* [Start Pre-Installation Guide](docs/01-pre-installation.md)
* *Next step: Choose your storage format.*

### 2. Partitioning & Encryption
Determine your storage foundation.
* **Option A:** [Unencrypted Partitioning](docs/02-partitioning/unencrypted.md)
  * *Choose this if:* You do not require data-at-rest protection.
* **Option B:** [LUKS2 Quantum-Resistant Encryption](docs/02-partitioning/luks2.md) *(Recommended)*
  * *Choose this if:* You want AES-256-XTS and Argon2id protection against physical theft and future quantum decryption.
* **Option C:** [LVM on LUKS2](docs/02-partitioning/lvm-on-luks2.md)
  * *Choose this if:* You need high security alongside flexible logical volumes.
* *Next step: Proceed to Base Installation.*

### 3. Base Installation
Install the core OS.
* [Base Installation Guide](docs/03-base-installation.md)
  * *Note:* If you chose LUKS2 in Step 2, ensure you configure the `sd-encrypt` hook as specified in this guide.
* *Next step: Choose how the system boots.*

### 4. Bootloader Selection
Select how your UEFI firmware loads the OS.
* **Option A:** [systemd-boot](docs/04-bootloaders/systemd-boot.md)
  * *Choose this if:* You want a minimal, built-in boot menu.
* **Option B:** [GRUB](docs/04-bootloaders/grub.md)
  * *Choose this if:* You prefer the traditional, highly configurable bootloader.
* **Option C:** [UKI (Direct UEFI / No GRUB)](docs/04-bootloaders/uki-no-grub.md) *(Recommended for Security)*
  * *Choose this if:* You want to eliminate bootloader vulnerabilities by compiling the kernel, initramfs, and cmdline into a single Unified Kernel Image.
* *Next step: Secure your boot chain, or skip to Dual Boot/Post-Install.*

### 5. Secure Boot Integration (Optional but Recommended)
Prevent rootkits from loading before the OS.
* **If you chose UKI (Option C):** [Custom Keys with UKI](docs/05-secure-boot/custom-keys-uki.md)
  * Generate your own PK/KEK/db keys, sign your UKI, and enroll them in your motherboard firmware.
* **If you chose GRUB (Option B):** [Shim with GRUB](docs/05-secure-boot/shim-grub.md)
  * Use the Microsoft-signed Shim to chainload GRUB.
* *Next step: Setup Windows Dual Boot, or skip to Post-Installation.*

### 6. Dual Booting Windows (Optional)
If Windows shares your hardware.
* **If you chose systemd-boot:** [systemd-boot Windows Detection](docs/06-dual-boot/systemd-boot-windows.md)
  * Requires no `os-prober`. Detects Windows natively.
* **If you chose GRUB:** [GRUB & os-prober](docs/06-dual-boot/grub-os-prober.md)
  * Requires modifying GRUB configs and running `os-prober`.
* *Next step: Finalize the setup.*

### 7. Post-Installation
Finish up with networking, DNS, and GUI.
* [Post-Installation Guide](docs/07-post-installation.md)

---

## Included Payloads & Security Mechanisms

This repository includes several integrated payloads designed for maximal security and stability.

### 1. Advanced Evil Maid Detection & Remediation
Found in `scripts/evil-maid-detector.sh`.
An "Evil Maid" attack occurs when an adversary physically accesses your machine to tamper with the unencrypted `/efi` partition, compromising the kernel or initramfs before your LUKS password is even entered.

**Benefits:**
* **Hashes & Backups:** On shutdown, the script hashes all files in `/efi` and securely backs them up inside your encrypted root directory.
* **Detection:** On boot, the system verifies the `/efi` state against the known hash.
* **Remediation & Analysis:** If tampered with, the system silently captures the malicious files into a secure folder (`/var/lib/evilmaid/compromised`), generates a diff patch revealing the exact modifications the attacker made, and automatically restores the legitimate, clean kernel to protect your system.

### 2. Arch Secure Boot Engine
Found in `scripts/arch-secure-boot.sh`.
A heavily audited script designed to bypass GRUB vulnerabilities. 

**Benefits:**
* **Defaults to Hardened:** Uses `linux-hardened` by default, with `linux-zen` as a robust fallback.
* **Immutable Boot Parameters:** Hardcodes your kernel command line inside the UKI so attackers cannot append malicious flags (like `init=/bin/bash`) to bypass authentication.
* **Automated Keys:** Automates generating and enrolling custom Secure Boot keys.

### 3. Modular Pacman Hooks
Found in `scripts/pacman-hooks/`.
**Benefits:**
* Automatically regenerates and resigns your Secure Boot UKIs every time the kernel or microcode is updated via `pacman`.
* Triggers BTRFS snapshots seamlessly (if utilized).

---

## Supported Install Configurations

By utilizing the modular paths above, you can build over 20 distinct configurations across BIOS and UEFI systems. Click below to expand and view the detailed permutations:

<details>
<summary><strong>1. The Fortress (Maximum Security)</strong></summary>

* **Base Elements:** LUKS2 (AES-256-XTS) + Direct UKI + Custom Secure Boot Keys + Evil Maid Detector + Linux-Hardened.
* **Firmware Limits:** Requires UEFI (Secure Boot and UKIs do not function on Legacy BIOS).
* **Dual Boot Permutations:**
  * *Non-Dual Boot:* The purest and most secure form.
  * *Dual Boot (Systemd-boot):* Adds `systemd-boot` to chainload Windows without compromising the UKI security, assuming Windows is securely maintained.
</details>

<details>
<summary><strong>2. The Flexible Secure (LVM & Snapshots)</strong></summary>

* **Base Elements:** LVM on LUKS2 + systemd-boot + Evil Maid Detector + Linux-Zen.
* **Firmware Limits:** Fully supports UEFI. For BIOS, systemd-boot is swapped for GRUB.
* **Dual Boot Permutations:**
  * *Non-Dual Boot:* Highly resilient setup allowing encrypted BTRFS/Ext4 snapshots across logical volumes.
  * *Dual Boot (systemd-boot or GRUB os-prober):* Easily segments storage for Windows while retaining full volume encryption for Linux.
</details>

<details>
<summary><strong>3. The Minimalist (Performance & Simplicity)</strong></summary>

* **Base Elements:** LUKS2 + systemd-boot + Standard Linux Kernel.
* **Firmware Limits:** Requires UEFI (systemd-boot is UEFI-only).
* **Dual Boot Permutations:**
  * *Non-Dual Boot:* Extremely fast boot times with zero menu bloat.
  * *Dual Boot (Native Windows Detection):* systemd-boot instantly detects Windows on the same ESP.
</details>

<details>
<summary><strong>4. The Microsoft Trust (Standard Secure Boot)</strong></summary>

* **Base Elements:** LUKS2 + GRUB + Shim Secure Boot + Standard Linux Kernel.
* **Firmware Limits:** Requires UEFI for Shim/Secure Boot functionality.
* **Dual Boot Permutations:**
  * *Non-Dual Boot:* Utilizes factory Microsoft keys to load Shim -> GRUB -> Arch.
  * *Dual Boot (GRUB os-prober):* The traditional, safest dual-boot method compatible with out-of-the-box Windows Secure Boot parameters.
</details>

<details>
<summary><strong>5. The Legacy Classic (BIOS Systems)</strong></summary>

* **Base Elements:** Unencrypted or LUKS2 + GRUB + MBR/DOS.
* **Firmware Limits:** Explicitly designed for older Legacy BIOS systems lacking UEFI.
* **Dual Boot Permutations:**
  * *Non-Dual Boot:* Standard MBR installation.
  * *Dual Boot (GRUB os-prober):* Chainloads older Windows installations (e.g., Windows 7/10 Legacy).
</details>

<details>
<summary><strong>License Information</strong></summary>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
</details>
