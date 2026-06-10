

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## System Maintenance & Security Guide

Maintaining a highly secure Arch Linux system requires consistent auditing and careful management of your boot chain.

### 1. Fake Kernels & Backup Kernels Strategy
In a maximum-security (Fortress) setup, adversaries may attempt to physically replace your kernel or initramfs on the unencrypted `/efi` partition.
* **The "Fake" Kernel:** As deployed by our Evil Maid script, you can leave a decoy kernel in the standard `/efi/EFI/arch/` directory. 
* **The Backup/Real Kernel:** The actual encrypted, signed UKI is stored deeper or tracked strictly via hashes. If an Evil Maid alters the fake kernel, the detector script triggers, backups the compromised fake payload for your analysis, and silently restores the real signed kernel.
* **Code Implementation:** To use a backup kernel via `arch-secure-boot.sh`, ensure `KERNEL_LTS="linux-zen"` is set. If `linux-hardened` fails to boot, your UEFI menu will securely offer `linux-zen` as a cryptographic fallback.

### 2. Pacman Hook Maintenance
Your system relies on `pacman` hooks to automatically resign kernels during system updates.
If an update fails halfway, **DO NOT REBOOT**. 
Manually re-run the secure boot generation script:
```bash
sudo /root/scripts/arch-secure-boot.sh generate-efi
sudo /root/scripts/arch-secure-boot.sh add-efi
```

### 3. SSH Hardening (Keys & OTP)
Never leave default SSH configurations exposed.
1. **Disable Root Login & Passwords:**
   Edit `/etc/ssh/sshd_config`:
   ```text
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```
2. **Setup Two-Factor Authentication (OTP):**
   Install Google Authenticator:
   ```bash
   sudo pacman -S libpam-google-authenticator
   google-authenticator
   ```
   Edit `/etc/pam.d/sshd` and add: `auth required pam_google_authenticator.so`
   Edit `/etc/ssh/sshd_config` and add: `ChallengeResponseAuthentication yes`

### 4. Hardware & VM Specifics
* **Virtual Machines (VMs):** If running in VirtualBox/VMware, ensure `xf86-video-vmware` and `virtualbox-guest-utils` are installed for proper graphical acceleration and resizing.
* **Microcode:** Always ensure `intel-ucode` or `amd-ucode` is installed and loaded in your bootloader/UKI parameters.

Continue to the **[Command Cheatsheet](arch-command-cheatsheet.md)** for daily operations.
