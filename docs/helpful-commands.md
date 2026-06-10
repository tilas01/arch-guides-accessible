

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ⚖️ Legal Disclaimer & AI Notice
> *⚠️ AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## 📖 Helpful Commands

### 📦 Pacman (Package Manager)
* **Sync & Upgrade System:** `sudo pacman -Syu`
* **Install a Package:** `sudo pacman -S <package_name>`
* **Search for a Package:** `pacman -Ss <query>`
* **Remove a Package (and unneeded dependencies):** `sudo pacman -Rs <package_name>`
* **Clear Package Cache (Frees space):** `sudo pacman -Sc`
* **List Explicitly Installed Packages:** `pacman -Qe`

### 🧹 Systemd & Services
* **Start a Service:** `sudo systemctl start <service>`
* **Enable a Service (Starts on boot):** `sudo systemctl enable <service>`
* **Check Service Status:** `systemctl status <service>`
* **View System Logs (Errors):** `journalctl -p 3 -xb`

### 🛡️ Permissions & Users
* **Add a new user:** `sudo useradd -m -G wheel -s /bin/bash <username>`
* **Change password:** `passwd <username>`
* **Fix Permissions (Directories to 755, Files to 644):**
  ```bash
  find /target/dir -type d -exec chmod 755 {} \;
  find /target/dir -type f -exec chmod 644 {} \;
  ```

### 🔒 Security Auditing
* **Check if Secure Boot is Active:** `bootctl status`
* **Verify UKI Signatures:** `sbverify --list /efi/EFI/arch/secure-boot-linux.efi`
* **Check Evil Maid Logs:** `cat /var/lib/evilmaid/esp_hash.sha256`

### 📦 AUR Package Manager (paru)

`paru` is the recommended Rust-based Libre AUR helper.

*   `paru -S <package>`: Install a package from the AUR.
*   `paru -Syu`: Update all system and AUR packages.
*   `paru -Rns <package>`: Remove a package and its orphaned dependencies.
*   `paru -Sc`: Clean the paru cache.
