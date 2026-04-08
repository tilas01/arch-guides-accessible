---
title: "05. Setup Secure Boot with Shim (GRUB)"
author: "tilas01 on GitHub and Gemini Code Assist"
date: 2026-04-07
---

# 05. Setup Secure Boot with Shim (GRUB)

This guide outlines how to enable Secure Boot on your Arch Linux installation using Shim and GRUB. This is often necessary for dual-booting with Windows (especially with BitLocker) or for systems that require Secure Boot to be enabled.

## Important Information & Security Considerations

*   **Evil Maid Attack**: This setup primarily provides a workaround for Secure Boot requirements and **does NOT protect against sophisticated "Evil Maid" attacks**. An attacker with physical access can still enroll their own keys.
    *   For a deeper understanding, review the [Wikipedia page on Evil Maid attacks](https://en.wikipedia.org/wiki/Evil_maid_attack).
*   **Real Protection**: True protection against physical attacks involves full disk encryption (LUKS), strong boot and administrator passwords in your UEFI firmware, and potentially physical security measures.
*   **Custom Keys**: While it's possible to use your own Secure Boot keys, this guide uses Shim, which simplifies the process but relies on Microsoft's keys. Using your own keys is more complex and carries a higher risk of bricking your system if not done correctly.
*   **Arch Wiki**: For advanced Secure Boot configurations and using your own keys, refer to the [Arch Wiki UEFI/Secure Boot page](https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot).

## Assumptions

*   You have a pre-existing Arch Linux installation.
*   You are using GRUB as your bootloader.
*   Your EFI System Partition is mounted at `/efi` (e.g., `/dev/sda1`).
*   You have `yay` (an AUR helper) installed. If not, install it first (see 11. Optional Tools & Customizations).

## 1. Create SBAT (UEFI Secure Boot Advanced Targeting)

SBAT is a mechanism to revoke vulnerable boot components. Create the `sbat.csv` file:

```bash
echo "sbat,1,SBAT Version,sbat,1,https://github.com/rhboot/shim/blob/main/SBAT.md" > sbat.csv
echo "grub,1,Free Software Foundation,grub,2.04,https://www.gnu.org/software/grub/" >> sbat.csv
```

## 2. Reinstall GRUB with SBAT and TPM Support

Reinstall GRUB, incorporating the SBAT data and enabling TPM (Trusted Platform Module) support if available.

```bash
sudo grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB --recheck --sbat=sbat.csv --modules="tpm"
rm sbat.csv # Optional: remove the temporary sbat.csv file
```

## 3. Install Shim

Shim is a small EFI application that acts as a first-stage bootloader, signed by Microsoft, which then verifies and chainloads GRUB.

```bash
yay -S shim-signed
sudo cp /usr/share/shim-signed/shimx64.efi /efi/EFI/GRUB/shimx64.EFI
sudo cp /usr/share/shim-signed/mmx64.efi /efi/EFI/GRUB/
```

## 4. Create Your Own Machine Owner Key (MOK)

You will create a MOK key pair to sign your kernel and GRUB. This key will be enrolled into your system's MOK list.

```bash
sudo pacman -S sbsigntools # Install signing tools
sudo mkdir -p /root/sbkeys
sudo su # Switch to root for key generation
cd /root/sbkeys

# Replace "{common_name}" with a descriptive name (e.g., "MyArchMOK")
openssl req -newkey rsa:4096 -nodes -keyout MOK.key -new -x509 -sha256 -days 3650 -subj "/CN={common_name}/" -out MOK.crt
openssl x509 -outform DER -in MOK.crt -out MOK.cer
exit # Exit root shell
```

## 5. Copy MOK.cer to the EFI Partition

This `.cer` file is needed to enroll your key in MokManager during the boot process.

```bash
sudo cp /root/sbkeys/MOK.cer /efi/
```

## 6. Sign GRUB and Kernel

Sign your GRUB EFI executable and your kernel images with your newly created MOK key.

```bash
sudo sbsign --key /root/sbkeys/MOK.key --cert /root/sbkeys/MOK.crt --output /boot/vmlinuz-linux /boot/vmlinuz-linux # Sign default kernel
sudo sbsign --key /root/sbkeys/MOK.key --cert /root/sbkeys/MOK.crt --output /efi/EFI/GRUB/grubx64.efi /efi/EFI/GRUB/grubx64.efi

# If you have other kernels (e.g., linux-zen, linux-lts), sign them too:
# sudo sbsign --key /root/sbkeys/MOK.key --cert /root/sbkeys/MOK.crt --output /boot/vmlinuz-linux-zen /boot/vmlinuz-linux-zen
```

## 7. Create Pacman Hooks for Automatic Signing

To ensure your kernel and GRUB remain signed after updates, create Pacman hooks. These hooks will automatically re-sign the relevant files whenever they are updated.

```bash
sudo mkdir -p /etc/pacman.d/hooks
```

Create `/etc/pacman.d/hooks/999-sign_kernel_for_secureboot.hook` with the following content:

```
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = linux
Target = linux-lts
Target = linux-hardened
Target = linux-zen

[Action]
Description = Signing Kernel for Secure Boot
When = PostTransaction
Exec = /usr/bin/find /boot/ -maxdepth 1 -name 'vmlinuz-*' -exec /usr/bin/sh -c 'if ! /usr/bin/sbverify --list {} 2>/dev/null | /usr/bin/grep -q "signature certificates"; then /usr/bin/sbsign --key /root/sbkeys/MOK.key --cert /root/sbkeys/MOK.crt --output {} {}; fi' \ ;
Depends = sbsigntools
Depends = findutils
Depends = grep
```

Create `/etc/pacman.d/hooks/998-sign_grub_for_secureboot.hook` with the following content:

```
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = grub

[Action]
Description = Signing GRUB for Secure Boot
When = PostTransaction
Exec = /usr/bin/find /efi/ -name 'grubx64*' -exec /usr/bin/sh -c 'if ! /usr/bin/sbverify --list {} 2>/dev/null | /usr/bin/grep -q "signature certificates"; then /usr/bin/sbsign --key /root/sbkeys/MOK.key --cert /root/sbkeys/MOK.crt --output {} {}; fi' \ ;
Depends = sbsigntools
Depends = findutils
Depends = grep
```

## 8. Add Shim to EFI Boot Manager

Create a new EFI boot entry for Shim.

```bash
sudo efibootmgr --verbose --disk /dev/sda --part 1 --create --label "Shim" --loader /EFI/GRUB/shimx64.EFI
```

## 9. Enable Secure Boot in UEFI Firmware

1.  **Shutdown your system**: `sudo shutdown now`
2.  **Enter UEFI Firmware (BIOS) Setup Utility**: This usually involves pressing a key like `F2`, `Del`, `F10`, or `F12` during boot.
3.  **Enable Secure Boot**: Navigate to the "Security" or "Boot" section and enable Secure Boot.
4.  **Set Administrator Password**: Set an Administrator (Setup Utility) password to prevent unauthorized changes to your UEFI settings.
5.  **Consider Boot Password**: If available, set a Boot Password for an additional layer of security.
6.  **Save Changes and Reboot**.

## 10. Enroll Key in MokManager

Upon reboot, your system should boot into MokManager (a blue screen).

1.  Select `Enroll key from disk`.
2.  Navigate to your EFI partition (usually labeled something like "EFI System Partition" or "NO NAME") and find `MOK.cer`.
3.  Select `MOK.cer` and enroll it.
4.  Choose `Reboot`.

Your system should now boot into Arch Linux with Secure Boot enabled.

## 11. Skip GRUB Boot Menu (Optional)

If you primarily use your UEFI boot menu to select operating systems (e.g., for dual-booting with Windows), you might want to hide or shorten the GRUB timeout.

```bash
sudo nano /etc/default/grub
```

Modify `GRUB_TIMEOUT` and `GRUB_TIMEOUT_STYLE`:

```
# Change to 0 or 1 to hide or show for a very short time
GRUB_TIMEOUT=0
# Hide the menu unless a key is pressed during the timeout period
GRUB_TIMEOUT_STYLE=hidden
```

If you have `GRUB_DISABLE_OS_PROBER=false` and rely on your UEFI boot menu, you might consider removing this line if you don't want GRUB to show other OSes.

```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
sudo reboot
```

## Final Notes

Remember to use your UEFI boot menu (e.g., `F9` or `F12` during boot) to select between Arch Linux (via Shim) and Windows if you've hidden the GRUB menu.

#### Credits
*   **Author:** [tilas01](https://www.github.com/tilas01)
*Please do not remove credits when sharing, modifying, or publishing this guide.*