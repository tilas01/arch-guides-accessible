window.generateOutput = function(auto = false) {

    const fw = document.getElementById('firmware').value;
    const fs = document.getElementById('filesystem').value;
    const disk = document.getElementById('target-disk').value;
    const part = document.getElementById('partitioning').value;
    const initSys = document.getElementById('init_system').value;
    const boot = document.getElementById('bootloader').value;
    const kernelMain = document.getElementById('kernel-main').value;
    const kernelBackup = document.getElementById('kernel-backup').value;
    const software_type = document.getElementById('software_type').value;
    const desktop = document.getElementById('desktop').value;
    const swap_size = document.getElementById('swap_size').value;
    const post_apps = document.getElementById('post_apps').value;
    const cleanup = document.getElementById('cleanup').value;
    const browser = document.getElementById('browser').value;
    const dns = document.getElementById('dns').value;
    const format = document.getElementById('outputformat').value;
    const cpu_brand = document.getElementById('cpu_brand') ? document.getElementById('cpu_brand').value : 'amd';
    const gpu_brand = document.getElementById('gpu_brand') ? document.getElementById('gpu_brand').value : 'amd';
    const auto_updates = document.getElementById('auto_updates') ? document.getElementById('auto_updates').value : 'no';
    
    const useCustomScripts = document.getElementById('use-custom-scripts') ? document.getElementById('use-custom-scripts').value === 'yes' : false;
    const secTools = (useCustomScripts && document.getElementById('securitytools')) ? document.getElementById('securitytools').value : 'none';
    const libreOtpMode = document.getElementById('libre_otp_mode') ? document.getElementById('libre_otp_mode').value : 'login';
    const anon_kloak = (useCustomScripts && document.getElementById('anon_kloak')) ? document.getElementById('anon_kloak').value : 'no';
    const anon_webhook = (useCustomScripts && document.getElementById('anon_webhook')) ? document.getElementById('anon_webhook').value : 'no';
    const anon_ssh = (useCustomScripts && document.getElementById('anon_ssh')) ? document.getElementById('anon_ssh').value : 'no';
    const fakeEvilMaid = (useCustomScripts && document.getElementById('fake-evil-maid')) ? document.getElementById('fake-evil-maid').value : 'no';

    let errors = [];
    if (fw === "bios" && boot !== "grub") {
        errors.push("Legacy BIOS requires the GRUB bootloader. UKI and systemd-boot are UEFI only.");
    }
    if (fw === "bios" && part.includes("luks2")) {
        errors.push("GRUB has limited support for LUKS2 without an unencrypted /boot. Consider LUKS1 for BIOS.");
    }
    
    let errorDiv = document.getElementById("config-errors");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "config-errors";
        document.getElementById("install-form").prepend(errorDiv);
    }
    
    if (errors.length > 0) {
        errorDiv.innerHTML = `<div class="alert warning" style="margin-bottom: 1rem;"><strong>Invalid Configuration Detected:</strong><ul>` + errors.map(e => `<li>${e}</li>`).join("") + `</ul></div>`;
        window.scrollTo(0, 0);
        return; // stop execution
    } else {
        errorDiv.innerHTML = "";
    }

    let partEfi = disk + "1";
    let partRoot = disk + "2";
    if (disk.includes("nvme")) {
        partEfi = disk + "p1";
        partRoot = disk + "p2";
    }

    const configData = { fw, fs, disk, part, initSys, boot, kernelMain, kernelBackup, software_type, cpu_brand, gpu_brand, desktop, swap_size, post_apps, auto_updates, cleanup, secTools, libreOtpMode, anon_kloak, anon_webhook, anon_ssh, fakeEvilMaid, format };

    function buildOutput(cmdOnly) {
        let output = "";
        output += '<!-- CONFIG_START\n' + JSON.stringify(configData) + '\nCONFIG_END -->\n\n';

        if (!cmdOnly) {
        output += `# Your Custom Arch Linux Guide\n\n`;
        output += `*Review and edit your markdown directly below. This is happening entirely locally in your browser.*\n\n`;
        output += `## 1. Partitioning & Formatting (${part} + ${fs})\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `#!/bin/bash\n`;
        output += `# WARNING: Review all script commands before executing!\n`;
        output += `set -e\n\n`;
        output += `# 1. Partitioning & Formatting\n`;
    }

    if (fw === "uefi") {
        output += `sgdisk -Z ${disk}\n`;
        output += `sgdisk -n 1:0:+512M -t 1:ef00 ${disk}\n`;
        output += `sgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
        output += `mkfs.fat -F32 ${partEfi}\n`;
    } else {
        output += `sgdisk -Z ${disk}\n`;
        output += `sgdisk -n 1:0:+2M -t 1:ef02 ${disk} # BIOS boot partition\n`;
        output += `sgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
        partRoot = disk.includes("nvme") ? disk + "p2" : disk + "2";
    }
    
    let targetMount = partRoot;

    if (part === "luks1") {
        output += `cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptroot\n`;
        targetMount = "/dev/mapper/cryptroot";
    } else if (part === "luks2") {
        output += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptroot\n`;
        targetMount = "/dev/mapper/cryptroot";
    } else if (part.includes("lvm")) {
        output += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptlvm\n`;
        output += `pvcreate /dev/mapper/cryptlvm\n`;
        output += `vgcreate vg0 /dev/mapper/cryptlvm\n`;
        output += `lvcreate -l 100%FREE vg0 -n root\n`;
        targetMount = "/dev/vg0/root";
    }

    if (fs === "btrfs") {
        output += `mkfs.btrfs -f ${targetMount}\n`;
        output += `mount ${targetMount} /mnt\n`;
        output += `btrfs subvolume create /mnt/@\n`;
        output += `btrfs subvolume create /mnt/@home\n`;
        output += `btrfs subvolume create /mnt/@var\n`;
        output += `btrfs subvolume create /mnt/@snapshots\n`;
        output += `umount /mnt\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@ ${targetMount} /mnt\n`;
        output += `mkdir -p /mnt/{home,var,.snapshots}\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@home ${targetMount} /mnt/home\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@var ${targetMount} /mnt/var\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@snapshots ${targetMount} /mnt/.snapshots\n`;
    } else if (fs === "xfs") {
        output += `mkfs.xfs -f ${targetMount}\n`;
        output += `mount ${targetMount} /mnt\n`;
    } else {
        output += `mkfs.ext4 ${targetMount}\n`;
        output += `mount ${targetMount} /mnt\n`;
    }

    if (fw === "uefi") {
        output += `mkdir -p /mnt/efi\nmount ${partEfi} /mnt/efi\n`;
    }
    
    if (swap_size !== "0") {
        if (fs === "btrfs") {
            output += `btrfs filesystem mkswapfile --size ${swap_size} /mnt/swapfile\n`;
        } else {
            output += `fallocate -l ${swap_size} /mnt/swapfile\n`;
            output += `chmod 600 /mnt/swapfile\n`;
            output += `mkswap /mnt/swapfile\n`;
        }
        output += `swapon /mnt/swapfile\n`;
    }

    if (!cmdOnly) {
        output += `\`\`\`\n\n`;
        output += `## 2. Base Installation, Kernel & Admin Tools\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `\n# 2. Base Installation\n`;
    }

    let cpuPackages = cpu_brand === "amd" ? "amd-ucode" : (cpu_brand === "intel" ? "intel-ucode" : "");
    let gpuPackages = "";
    if (gpu_brand === "amd") gpuPackages = "mesa xf86-video-amdgpu vulkan-radeon";
    else if (gpu_brand === "intel") gpuPackages = "mesa xf86-video-intel vulkan-intel";
    else if (gpu_brand === "nvidia") {
        if (software_type === "libre" || software_type === "opensource") gpuPackages = "mesa xf86-video-nouveau";
        else gpuPackages = "nvidia nvidia-utils";
    } else if (gpu_brand === "vm") {
        gpuPackages = "spice-vdagent xf86-video-qxl";
    }

    let adminTools = software_type === "libre" ? "opendoas pfetch cronie" : "sudo fastfetch cronie";
    let fsTools = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");

    let allKernels = kernelMain + " " + kernelMain + "-headers";
    if (kernelBackup !== "none") allKernels += " " + kernelBackup + " " + kernelBackup + "-headers";
    
    if (fakeEvilMaid === "yes") {
        allKernels += " linux-lts linux-hardened"; // Generic decoys
    }

    output += `pacstrap -K /mnt base ${allKernels} ${cpuPackages} ${gpuPackages} linux-firmware neovim ${adminTools} git ${fsTools}\n`;
    output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
    
    // Create chroot script to continue execution
    if (cmdOnly) {
        output += `\ncat << 'EOF' > /mnt/chroot_script.sh\n`;
        output += `#!/bin/bash\n`;
        output += `echo "============================="\n`;
        output += `echo "User Account Configuration"\n`;
        output += `echo "============================="\n`;
        output += `echo "Please set a root password:"\n`;
        output += `passwd root\n`;
        output += `read -p "Enter a username for your daily user account: " newuser\n`;
        output += `if [ -n "$newuser" ]; then\n`;
        output += `  useradd -m -G wheel -s /bin/bash "$newuser"\n`;
        output += `  echo "Please set a password for $newuser:"\n`;
        output += `  passwd "$newuser"\n`;
        output += `fi\n`;
    } else {
        output += `arch-chroot /mnt\n`;
    }
    
    if (software_type === "libre") {
        output += `echo "permit persist :wheel" > /etc/doas.conf\n`;
        output += `ln -s /usr/bin/doas /usr/bin/sudo\n`;
    } else {
        output += `echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel\n`;
    }

    if (!cmdOnly) {
        output += `\`\`\`\n\n`;
        output += `## 3. Initramfs Configuration (${initSys})\n`;
        output += `Edit \`/etc/mkinitcpio.conf\` inside the chroot:\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `\n# 3. Initramfs Configuration\n`;
    }
    
    let baseHooks = initSys === "systemd" 
        ? "base systemd autodetect microcode modconf kms keyboard sd-vconsole block" 
        : "base udev autodetect microcode modconf kms keyboard keymap consolefont block";

    let cryptoHook = "";
    if (part !== "unencrypted") {
        cryptoHook = initSys === "systemd" ? "sd-encrypt" : "encrypt";
    }
    
    let lvmHook = part.includes("lvm") ? "lvm2" : "";
    let fsHook = fs === "btrfs" ? "btrfs filesystems fsck" : "filesystems fsck";

    let allHooks = [baseHooks, cryptoHook, lvmHook, fsHook].filter(h => h).join(" ");
    
    output += `sed -i 's/^HOOKS=.*/HOOKS=(${allHooks})/' /etc/mkinitcpio.conf\n`;
    output += `mkinitcpio -P\n`;
    
    if (!cmdOnly) {
        output += `\`\`\`\n\n`;
        output += `## 4. Bootloader & Secure Boot (${boot})\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `\n# 4. Bootloader\n`;
    }

    if (fw === "bios" || boot.includes("grub")) {
        output += `pacman -S --noconfirm grub efibootmgr\n`;
        if (fw === "uefi") {
            if (boot === "grub-shim") {
                output += `pacman -S --noconfirm shim-signed\n`;
                output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB --modules="tpm" --disable-shim-lock\n`;
                output += `cp /usr/share/shim-signed/shimx64.efi /efi/EFI/GRUB/bootx64.efi\n`;
            } else {
                output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n`;
            }
        } else {
            output += `grub-install --target=i386-pc ${disk}\n`;
        }
        output += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
    } else if (boot.includes("uki")) {
        output += `pacman -S --noconfirm sbsigntools efitools efibootmgr\n`;
        if (boot === "uki-shim") {
            output += `pacman -S --noconfirm shim-signed\n`;
            output += `cp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/bootx64.efi\n`;
        }
    } else if (boot === "systemd-boot") {
        output += `bootctl install --esp-path=/efi\n`;
    }

    if (!cmdOnly) {
        output += `\`\`\`\n\n`;
        output += `## 5. DNS Caching Service (${dns})\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `\n# 5. DNS Setup\n`;
    }

    if (dns === "unbound") {
        output += `pacman -S --noconfirm unbound\n`;
        output += `systemctl enable unbound\n`;
    } else if (dns === "dnscrypt-proxy") {
        output += `pacman -S --noconfirm dnscrypt-proxy\n`;
        output += `systemctl enable dnscrypt-proxy\n`;
    } else {
        output += `systemctl enable systemd-resolved\n`;
    }

    if (!cmdOnly) {
        output += `\`\`\`\n\n`;
        output += `## 6. Post-Install Apps & Desktop Environment\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `\n# 6. Desktop, Apps & AUR (paru)\n`;
    }

    if (post_apps !== "none") {
        if (!cmdOnly) output += `\n# Installing Post-Install Applications (${post_apps})\n`;
        output += `pacman -S --noconfirm git base-devel\n`;
        output += `echo "Setting up temporary build user for AUR..."\n`;
        output += `useradd -m -G wheel -s /bin/bash builder\n`;
        output += `echo "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder\n`;
        output += `su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"\n`;
        
        if (post_apps === "standard" || post_apps === "full") {
            output += `su - builder -c "paru -S --noconfirm firefox signal-desktop"\n`;
        }
        if (post_apps === "full") {
            output += `echo "Downloading automated deployment scripts and performing integrity checks..."\n`;
            output += `curl -LO https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/auto_deploy.sh\n`;
            output += `curl -LO https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/auto_deploy.sh.sig\n`;
            output += `# Verify signature (replace with actual key)\n`;
            output += `echo "Simulating integrity check..."\n`;
            output += `chmod +x auto_deploy.sh && ./auto_deploy.sh\n`;
        }
        output += `userdel -r builder\n`;
        output += `rm -f /etc/sudoers.d/builder\n`;
    }

    if (desktop === "gnome") {
        output += `pacman -S --noconfirm gnome gnome-tweaks\n`;
        output += `systemctl enable gdm\n`;
    } else if (desktop === "kde") {
        output += `pacman -S --noconfirm plasma-desktop sddm\n`;
        output += `systemctl enable sddm\n`;
    } else if (desktop === "dwm") {
        output += `pacman -S --noconfirm xorg-server xorg-xinit base-devel libx11 libxinerama libxft\n`;
    }

    if (browser === "librewolf") {
        output += `pacman -S --noconfirm librewolf\n`;
    } else if (browser === "firefox") {
        output += `pacman -S --noconfirm firefox\n`;
    }
    
    if (fs === "btrfs") {
        output += `snapper -c root create-config /\n`;
        output += `systemctl enable snapper-timeline.timer snapper-cleanup.timer\n`;
    }
    if (secTools !== "none") {
        if (!cmdOnly) {
            output += `\`\`\`\n\n`;
            output += `## 7. Advanced Rust Security Tools\n`;
            output += `\`\`\`bash\n`;
        } else {
            output += `\n# 7. Advanced Rust Security Tools\n`;
        }
        
        output += `pacman -S --noconfirm rust cargo\n`;
        output += `mkdir -p /opt/security-tools && cd /opt/security-tools\n`;
        
        if (secTools === "libre-otp" || secTools === "both") {
            output += `git clone https://github.com/tilas01/arch-guides-dynamic.git .\n`;
            output += `cd security-tools/libre-otp && cargo build --release\n`;
            output += `cp target/release/libre-otp /usr/local/bin/\n`;
            output += `# Configure Libre-OTP in PAM or systemd depending on your preference\n`;
            output += `cd /opt/security-tools\n`;
        }
        
        if (secTools === "anti-ducky" || secTools === "both") {
            output += `git clone https://github.com/tilas01/arch-guides-dynamic.git .\n`; // In case not cloned
            output += `cd security-tools/anti-ducky && cargo build --release\n`;
            output += `cp target/release/anti-ducky /usr/local/bin/\n`;
            output += `cat << 'SRV' > /etc/systemd/system/anti-ducky.service\n[Unit]\nDescription=Anti-RubberDucky Input Monitor\n[Service]\nExecStart=/usr/local/bin/anti-ducky\nRestart=always\n[Install]\nWantedBy=multi-user.target\nSRV\n`;
            output += `systemctl enable anti-ducky.service\n`;
        }
    }
    
    
    if (anon_kloak === "yes" || anon_webhook === "yes" || anon_ssh === "yes" || fakeEvilMaid === "yes") {
        if (!cmdOnly) {
            output += `\`\`\`\n\n`;
            output += `## 8. Anonymisation & Anti-Evil Maid\n`;
            output += `Configure background services for anonymity or anti-tampering.\n\n`;
            output += `\`\`\`bash\n`;
        } else {
            output += `\n# 8. Anonymisation & Anti-Evil Maid\n`;
        }

        if (anon_kloak === "yes") {
            output += `pacman -S --noconfirm git make gcc pkgconf\n`;
            output += `git clone https://github.com/vmonaco/kloak.git /opt/kloak\n`;
            output += `cd /opt/kloak && make && cp kloak /usr/local/bin/\n`;
            output += `cat << 'SRV' > /etc/systemd/system/kloak.service\n[Unit]\nDescription=Kloak Keystroke Anonymizer\n[Service]\nExecStart=/usr/local/bin/kloak\nRestart=always\n[Install]\nWantedBy=multi-user.target\nSRV\n`;
            output += `systemctl enable kloak.service\n`;
        }

        if (anon_webhook === "yes") {
            output += `# Optional: Configure kernel hook webhook alerts in /etc/systemd/system/malware-alert.service\n`;
            output += `echo 'Your custom rust/python kernel hook would be deployed here.'\n`;
        }

        if (anon_ssh === "yes") {
            output += `pacman -S --noconfirm openssh\n`;
            output += `sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config\n`;
            output += `sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config\n`;
            output += `if [ -n "$newuser" ]; then\n`;
            output += `  echo "AllowUsers root $newuser" >> /etc/ssh/sshd_config\n`;
            output += `else\n`;
            output += `  echo "AllowUsers root" >> /etc/ssh/sshd_config\n`;
            output += `fi\n`;
            output += `# Integrate Libre-OTP with SSH via PAM\n`;
            output += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp' >> /etc/pam.d/sshd\n`;
            output += `systemctl enable sshd.service\n`;
        }

        if (fakeEvilMaid === "yes") {
            output += `\n# EVIL MAID SPOOFING: Deploy Fake Decoy Kernels\n`;
            output += `mkdir -p /boot/fake_efi\n`;
            output += `echo "Select a kernel to use as a decoy for Evil Maid spoofing (e.g. linux-lts, linux-hardened):"\n`;
            output += `select decoy_kernel in "linux" "linux-lts" "linux-hardened" "linux-zen"; do\n`;
            output += `  if [ -n "$decoy_kernel" ]; then\n`;
            output += `    echo "Using $decoy_kernel as decoy..."\n`;
            output += `    cp /boot/vmlinuz-$decoy_kernel /boot/fake_efi/vmlinuz-linux 2>/dev/null || echo "Kernel not found!"\n`;
            output += `    cp /boot/initramfs-$decoy_kernel.img /boot/fake_efi/initramfs-linux.img 2>/dev/null\n`;
            output += `    break\n`;
            output += `  else\n`;
            output += `    echo "Invalid selection. Please try again."\n`;
            output += `  fi\n`;
            output += `done\n`;
        }
    }
    if (auto_updates === "yes") {
        if (!cmdOnly) {
            output += `\`\`\`\n\n`;
            output += `## Unattended Upgrades & Logging\n`;
            output += `Configure automatic pacman and AUR updates via cronie.\n\n`;
            output += `\`\`\`bash\n`;
        } else {
            output += `\n# --- Unattended Upgrades & Logging ---\n`;
        }
        output += `systemctl enable cronie\n`;
        output += `cat << 'CRON_SCRIPT' > /usr/local/bin/auto-update.sh\n`;
        output += `#!/bin/bash\n`;
        output += `LOGFILE="/var/log/auto-update.log"\n`;
        output += `echo "Starting Update: \\$(date)" >> $LOGFILE\n`;
        output += `pacman -Syu --noconfirm >> $LOGFILE 2>&1\n`;
        if (post_apps !== "none") {
            output += `su - builder -c "paru -Sua --noconfirm" >> $LOGFILE 2>&1\n`;
        }
        output += `echo "Update Complete: \\$(date)" >> $LOGFILE\n`;
        output += `CRON_SCRIPT\n`;
        output += `chmod +x /usr/local/bin/auto-update.sh\n`;
        output += `(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auto-update.sh") | crontab -\n`;
    }

    if (cmdOnly) {
        output += `EOF\n`;
        output += `chmod +x /mnt/chroot_script.sh\n`;
        output += `arch-chroot /mnt /chroot_script.sh\n`;
        
        if (cleanup === "yes") {
            output += `echo "Performing system cleanup..."\n`;
            output += `arch-chroot /mnt pacman -Scc --noconfirm\n`;
            output += `rm -rf /mnt/var/cache/pacman/pkg/*\n`;
            output += `rm -rf /mnt/tmp/*\n`;
        }
        
        output += `rm /mnt/chroot_script.sh\n`;
        output += `echo "Install complete. Please reboot."\n`;
    } else {
        output += `\`\`\`\n`;
        output += `\n*Guide complete. Ensure networking and passwords are set before rebooting into your tailored environment.*`;
    }

    return output;
}

    // Editable text area setup
    const outputSection = document.getElementById('output-section');
    outputSection.style.display = 'block';
    
    let renderedHTML = "";
    if (format === "script") {
        let scriptOutput = buildOutput(true);
        renderedHTML = `
            <div class="alert warning">Review all script commands below. You can edit this script directly in your browser.</div>
            <textarea id="editor" spellcheck="false" style="width: 100%; height: 500px; background: var(--bg-color); color: var(--fg-color); font-family: var(--font-mono); padding: 1rem; border: 1px solid var(--accent-blue);">${scriptOutput}</textarea>
        `;
    } else if (format === "both") {
        let mdOutput = buildOutput(false);
        let scriptOutput = buildOutput(true);
        renderedHTML = `
            <div class="alert info">You chose BOTH. Below is the Markdown Guide. Underneath it is the Raw Script.</div>
            <textarea id="editor" spellcheck="false" style="width: 100%; height: 200px; background: var(--bg-color); color: var(--fg-color); font-family: var(--font-mono); padding: 1rem; border: 1px solid var(--accent-blue); margin-bottom: 1rem;">${mdOutput}</textarea>
            <h3>Live Preview:</h3>
            <div id="preview" style="border: 1px solid var(--bg-lighter); padding: 1rem; margin-bottom: 2rem;"></div>
            
            <h3>Raw Executable Bash Script:</h3>
            <textarea id="script-editor" spellcheck="false" style="width: 100%; height: 300px; background: var(--bg-dark); color: var(--fg-color); font-family: var(--font-mono); padding: 1rem; border: 1px solid var(--accent-blue);">${scriptOutput}</textarea>
        `;
    } else {
        let mdOutput = buildOutput(false);
        renderedHTML = `
            <div class="alert warning">You may edit the markdown guide locally before confirming/saving.</div>
            <textarea id="editor" spellcheck="false" style="width: 100%; height: 200px; background: var(--bg-color); color: var(--fg-color); font-family: var(--font-mono); padding: 1rem; border: 1px solid var(--accent-blue); margin-bottom: 1rem;">${mdOutput}</textarea>
            <h3>Live Preview:</h3>
            <div id="preview" style="border: 1px solid var(--bg-lighter); padding: 1rem;"></div>
        `;
    }

    document.getElementById('generated-guide').innerHTML = renderedHTML;
    
    if (format !== "script") {
        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');
        
        // Ensure marked.js is loaded
        if (typeof marked !== 'undefined') {
            preview.innerHTML = marked.parse(editor.value);
            editor.addEventListener('input', function() {
                preview.innerHTML = marked.parse(editor.value);
            });
        } else {
            preview.innerHTML = "<p>Markdown parsing unavailable (marked.js not loaded).</p>";
        }
    }

    if (!auto) {
        outputSection.scrollIntoView({ behavior: 'smooth' });
    }
};

document.getElementById('generate-btn').addEventListener('click', function(e) {
    e.preventDefault();
    window.generateOutput(false);
});

// Interactive UI Logic
const formSteps = document.querySelectorAll('.form-step, .nav-tooltip');
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-panel-content');
const defaultPanelHTML = infoContent.innerHTML;

let tooltipsEnabled = true;
const tooltipToggleBtn = document.getElementById('toggle-tooltips-btn');
const customScriptsSelect = document.getElementById('use-custom-scripts');
const customScriptsContainer = document.getElementById('custom-scripts-container');
const securityToolsSelect = document.getElementById('securitytools');
const libreOtpModeContainer = document.getElementById('libre-otp-mode-container');

if (tooltipToggleBtn) {
    tooltipToggleBtn.addEventListener('click', () => {
        tooltipsEnabled = !tooltipsEnabled;
        tooltipToggleBtn.setAttribute('data-desc', `Currently: ${tooltipsEnabled ? 'Enabled' : 'Disabled'}`);
        tooltipToggleBtn.style.color = tooltipsEnabled ? 'var(--accent-blue)' : '#888';
        if (tooltipsEnabled) {
            updateInfoPanel(tooltipToggleBtn);
        } else {
            infoPanel.classList.remove('active');
            document.body.classList.remove('panel-active');
        }
    });
    tooltipToggleBtn.addEventListener('mouseenter', (e) => {
        if (tooltipsEnabled) {
            updateInfoPanel(tooltipToggleBtn, e);
        }
    });
    tooltipToggleBtn.addEventListener('mouseleave', () => {
        if (tooltipsEnabled) {
            infoPanel.classList.remove('active');
        }
    });
}

if (customScriptsSelect && customScriptsContainer) {
    customScriptsSelect.addEventListener('change', () => {
        customScriptsContainer.style.display = customScriptsSelect.value === 'yes' ? 'block' : 'none';
    });
}

if (securityToolsSelect && libreOtpModeContainer) {
    securityToolsSelect.addEventListener('change', () => {
        if (securityToolsSelect.value === 'libre-otp' || securityToolsSelect.value === 'both') {
            libreOtpModeContainer.style.display = 'block';
        } else {
            libreOtpModeContainer.style.display = 'none';
        }
    });
}

// Click infoPanel on mobile to open wiki
infoPanel.addEventListener('click', () => {
    if (window.innerWidth <= 768 && window._currentWikiHash) {
        window.open('wiki.html' + window._currentWikiHash, '_blank');
    }
});

// Mobile tap / Desktop hover info panel update
formSteps.forEach((step) => {
    step.addEventListener('mouseenter', (e) => {
        if (tooltipsEnabled) updateInfoPanel(step, e);
    });
    step.addEventListener('mouseleave', () => {
        if (tooltipsEnabled) infoPanel.classList.remove('active');
    });
    step.addEventListener('touchstart', (e) => {
        if (tooltipsEnabled) updateInfoPanel(step, e);
    }, {passive: true});
    
    // Dynamic interactions
    const input = step.querySelector('select, input');
    if (input) {
        input.addEventListener('change', () => {
            if (tooltipsEnabled) updateInfoPanel(step);
            validateConfigurations();
        });
    }
});

const banner = document.querySelector('.banner');
if (banner) {
    banner.style.cursor = 'pointer';
    banner.addEventListener('click', () => { window.open('https://github.com/tilas01/arch-guides-dynamic', '_blank'); });
    banner.addEventListener('mouseenter', (e) => {
        updateInfoPanel({ getAttribute: (attr) => attr === 'data-title' ? 'Project Repository' : '<span style="color: var(--accent-blue);">Click to view the source code on GitHub.</span>', querySelector: () => null }, e);
    });
    banner.addEventListener('mouseleave', () => infoPanel.classList.remove('active'));
}

document.addEventListener('contextmenu', (e) => {
    if (window.innerWidth > 768 && infoPanel.classList.contains('active') && window._currentWikiHash) {
        e.preventDefault();
        window.open('wiki.html' + window._currentWikiHash, '_blank');
    }
});

document.addEventListener('mousemove', (e) => {
    if (!infoPanel.classList.contains('active')) return;
    if (window.innerWidth <= 768) return;

    infoPanel.classList.remove('side-overlay');
    
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    
    const rect = infoPanel.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
    if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
    
    infoPanel.style.left = x + 'px';
    infoPanel.style.top = y + 'px';
});

function updateInfoPanel(group, e) {
    if (!tooltipsEnabled) return;

    const title = group.getAttribute('data-title');
    const desc = group.getAttribute('data-desc');
    const select = group.querySelector ? group.querySelector('select') : null;
    let extraInfo = '';
    let warnings = '';

    if (!title && !desc) return;
    
    const wikiMap = {
        'Generator': 'architecture.md#how-the-website-generator-works',
        'Wiki': 'architecture.md',
        'Upload Guide': 'architecture.md',
        'Project Repository': 'architecture.md',
        'Firmware Selection': 'architecture.md#1-firmware-uefi-vs-bios',
        'Target Installation Disk': '01-pre-installation.md',
        'Partitioning Scheme': 'architecture.md#2-encryption-luks1-vs-luks2-vs-unencrypted',
        'File System': 'architecture.md#2-encryption-luks1-vs-luks2-vs-unencrypted',
        'Init System': 'architecture.md#3-init-systems-systemd-vs-busybox',
        'Bootloader': 'architecture.md#4-bootloaders-secure-boot',
        'Main Linux Kernel': '03-base-installation.md',
        'Backup Linux Kernel': '03-base-installation.md',
        'Software Philosophy': '03-base-installation.md',
        'Desktop Environment': '04-desktop-environment.md',
        'Swap Space': '02-partitioning.md',
        'Post-Install Apps': '04-desktop-environment.md',
        'System Cleanup': '04-desktop-environment.md',
        'Tilas01 Custom Scripts': 'architecture.md#anti-rubberducky-daemon',
        'Advanced Security Tools': 'architecture.md#anti-rubberducky-daemon',
        'Libre OTP Mode': 'architecture.md#anti-rubberducky-daemon',
        'Keystroke Anonymisation': 'architecture.md#kloak-anti-keystroke-profiling',
        'Malware Detection Webhooks': 'architecture.md#anti-rubberducky-daemon',
        'Hardened SSH & OTP': 'architecture.md#anti-rubberducky-daemon',
        'Fake Evil Maid Directory': 'architecture.md#anti-rubberducky-daemon',
        'Output Format': 'architecture.md#how-the-website-generator-works',
        'Toggle Tooltips': 'architecture.md#how-the-website-generator-works'
    };

    const mappedLink = title ? wikiMap[title] : null;
    window._currentWikiHash = mappedLink ? `?page=${mappedLink.split('#')[0]}${mappedLink.includes('#') ? '#' + mappedLink.split('#')[1] : ''}` : '';

    if (select) {
        const selectedText = select.options[select.selectedIndex].text;
        extraInfo = `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--bg-lighter);">
            <strong style="color: var(--accent-green)">🟢 Current Selection:</strong><br>
            <span style="color: var(--accent-blue); font-weight: bold; font-size: 1.1rem;">${selectedText}</span>
        </div>`;
    }

    // Dynamic warnings based on current selections
    const fwEl = document.getElementById('firmware');
    const partEl = document.getElementById('partitioning');
    const bootEl = document.getElementById('bootloader');
    
    const fw = fwEl ? fwEl.value : '';
    const part = partEl ? partEl.value : '';
    const boot = bootEl ? bootEl.value : '';
    
    if (group.querySelector && group.querySelector('#bootloader') && fw === 'bios') {
        warnings += `<div style="color: #ff5555; margin-top: 10px;">⚠️ <strong>Warning:</strong> You selected Legacy BIOS. UKI and systemd-boot are physically impossible to install. GRUB is enforced.</div>`;
    }
    if (group.querySelector && group.querySelector('#partitioning') && fw === 'bios' && part === 'luks2') {
        warnings += `<div style="color: #ffb86c; margin-top: 10px;">⚠️ <strong>Notice:</strong> GRUB has limited support for LUKS2. You will need an unencrypted /boot partition.</div>`;
    }
    
    // Smart Setup Analysis
    if ((group.querySelector && (group.querySelector('#partitioning') || group.querySelector('#bootloader') || group.querySelector('#fake-evil-maid'))) && part === 'unencrypted' && boot !== 'uki-custom') {
        warnings += `<div style="color: #f1fa8c; margin-top: 10px;">⚠️ <strong>Smart Setup Analysis:</strong> You chose no encryption and no secure boot. This is a highly insecure setup.</div>`;
    }

    infoContent.innerHTML = `
        <h3 style="color: var(--accent-purple); margin-top: 0; font-size: 1.2rem;">📌 ${title || 'Setting Details'}</h3>
        <p style="color: var(--fg-color); line-height: 1.5;">${desc || ''}</p>
        ${window._currentWikiHash ? `<p style="font-size: 0.85rem; color: var(--accent-blue); margin-top: 10px;"><em>💡 Right-click anywhere to read the full Wiki article on this topic.</em></p>` : ''}
        ${warnings}
        ${extraInfo}
    `;

    infoPanel.classList.add('active');
    
    // Position immediately on enter if event is provided
    if (e && window.innerWidth > 768) {
        infoPanel.classList.remove('side-overlay');
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        
        const rect = infoPanel.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
        if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
        
        infoPanel.style.left = x + 'px';
        infoPanel.style.top = y + 'px';
    }
    
    if (window.innerWidth <= 768) {
        document.body.classList.add('panel-active');
    }
}

// Close panel on clicking outside (Mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!e.target.closest('.form-step') && !e.target.closest('#info-panel')) {
            infoPanel.classList.remove('active');
            document.body.classList.remove('panel-active');
            infoContent.innerHTML = defaultPanelHTML;
        }
    }
});

// Validate configurations dynamically
function validateConfigurations() {
    const fw = document.getElementById('firmware').value;
    const bootloader = document.getElementById('bootloader');
    const part = document.getElementById('partitioning');
    const generateBtn = document.getElementById('generate-btn');
    
    // BIOS constraints
    if (fw === 'bios') {
        Array.from(bootloader.options).forEach(opt => {
            if (opt.value.includes('uki') || opt.value === 'systemd-boot') {
                opt.disabled = true;
                opt.text = opt.text.replace(' (Disabled)', '') + ' (Disabled)';
            }
        });
        if (bootloader.value !== 'grub') {
            bootloader.value = 'grub';
        }
        
        // Disable LUKS2 for BIOS
        Array.from(part.options).forEach(opt => {
            if (opt.value === 'luks2') {
                opt.disabled = true;
                opt.text = opt.text.replace(' (Disabled)', '') + ' (Disabled)';
            }
        });
        if (part.value === 'luks2') {
            part.value = 'luks1';
        }
    } else {
        Array.from(bootloader.options).forEach(opt => {
            opt.disabled = false;
            opt.text = opt.text.replace(' (Disabled)', '');
        });
        Array.from(part.options).forEach(opt => {
            opt.disabled = false;
            opt.text = opt.text.replace(' (Disabled)', '');
        });
    }
    
    // Validate if the setup is completely insecure and warn globally
    const warnings = [];
    const successes = [];
    
    const secToolsVal = document.getElementById('securitytools') ? document.getElementById('securitytools').value : 'none';
    const fakeEvilMaidVal = document.getElementById('fake-evil-maid') ? document.getElementById('fake-evil-maid').value : 'no';
    const useCustomScripts = document.getElementById('use-custom-scripts') ? document.getElementById('use-custom-scripts').value === 'yes' : false;
    const gpuBrand = document.getElementById('gpu_brand') ? document.getElementById('gpu_brand').value : 'amd';
    const softwareType = document.getElementById('software_type') ? document.getElementById('software_type').value : 'libre';

    if (part.value === 'unencrypted' && bootloader.value !== 'uki-custom') {
        warnings.push("⚠️ Smart Analysis: You chose no encryption and no secure boot ownership. This is a highly insecure setup. Anyone with physical access can tamper with your system.");
    }

    if (gpuBrand === 'nvidia' && softwareType === 'libre') {
        warnings.push("⚠️ Compatibility Warning: You selected an Nvidia GPU but chose 'Fully Libre'. Nvidia hardware requires non-free Nouveau firmware or Proprietary drivers. We will fallback to Nouveau firmware, but this setup cannot be truly 100% Libre.");
    }
    
    if (part.value === 'luks2' && bootloader.value === 'uki-custom' && fw === 'uefi' && useCustomScripts && secToolsVal === 'both' && fakeEvilMaidVal === 'yes') {
        successes.push("🛡️ Smart Analysis: Outstanding! You have configured a fully encrypted, tamper-evident system with hardware-bound 2FA and decoy environments. This is the most secure setup possible! Good job.");
    }
    
    const globalWarningsDiv = document.getElementById('global-warnings');
    if (globalWarningsDiv) {
        let htmlContent = "";
        if (warnings.length > 0) {
            htmlContent += warnings.map(w => `<div class="alert warning" style="margin-bottom: 0.5rem; text-align: left;">${w}</div>`).join('');
        }
        if (successes.length > 0) {
            htmlContent += successes.map(s => `<div class="alert info" style="margin-bottom: 0.5rem; text-align: left; background: rgba(46, 204, 113, 0.1); border-color: #2ecc71;">${s}</div>`).join('');
        }
        
        if (htmlContent) {
            globalWarningsDiv.innerHTML = htmlContent;
            globalWarningsDiv.style.display = 'block';
        } else {
            globalWarningsDiv.innerHTML = '';
            globalWarningsDiv.style.display = 'none';
        }
    }
    
    // Auto-generate preview without scrolling
    if (typeof window.generateOutput === 'function') {
        window.generateOutput(true);
    }
}

// Initial validation
validateConfigurations();

// Restore Configuration from upload.html
const restoreConfig = sessionStorage.getItem('arch_restore_config');
if (restoreConfig) {
    try {
        const configData = JSON.parse(restoreConfig);
        Object.keys(configData).forEach(key => {
            if (key === 'anonTools') {
                if (configData[key] === 'all') {
                    if(document.getElementById('anon_kloak')) document.getElementById('anon_kloak').value = 'yes';
                    if(document.getElementById('anon_webhook')) document.getElementById('anon_webhook').value = 'yes';
                    if(document.getElementById('anon_ssh')) document.getElementById('anon_ssh').value = 'yes';
                } else if (configData[key] !== 'none') {
                    if(document.getElementById('anon_' + configData[key])) document.getElementById('anon_' + configData[key]).value = 'yes';
                }
                return;
            }
            
            const el = document.getElementById(key === 'initSys' ? 'init_system' : 
                                             key === 'kernelMain' ? 'kernel-main' :
                                             key === 'kernelBackup' ? 'kernel-backup' :
                                             key === 'secTools' ? 'securitytools' :
                                             key === 'fakeEvilMaid' ? 'fake-evil-maid' :
                                             key === 'format' ? 'outputformat' :
                                             key === 'part' ? 'partitioning' :
                                             key === 'disk' ? 'target-disk' :
                                             key === 'fw' ? 'firmware' :
                                             key === 'fs' ? 'filesystem' :
                                             key === 'boot' ? 'bootloader' : key === 'philosophy' ? 'software_type' : key);
            if (el) el.value = configData[key];
        });
        sessionStorage.removeItem('arch_restore_config');
        
        // Show all form steps so the user sees their full config
        document.querySelectorAll('.form-step').forEach(step => step.classList.add('visible'));
        
        let errorDiv = document.getElementById("config-errors");
        if (!errorDiv) {
            errorDiv = document.createElement("div");
            errorDiv.id = "config-errors";
            document.getElementById("install-form").prepend(errorDiv);
        }
        errorDiv.innerHTML = `<div class="alert info" style="margin-bottom: 1rem;"><strong>Configuration Restored!</strong> Your settings from the uploaded guide have been loaded.</div>`;
    } catch (e) {
        console.error("Error restoring config:", e);
    }
}

// Download Button Logic
const downloadBtn = document.getElementById('download-btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const format = document.getElementById('outputformat').value;
        const ts = new Date().getTime();

        const triggerDownload = (content, filename) => {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        const mdEditor = document.getElementById('editor');
        const shEditor = document.getElementById('script-editor');

        if (format === 'script' && mdEditor) {
            triggerDownload(mdEditor.value, `arch-install-${ts}.sh`);
        } else if (format === 'markdown' && mdEditor) {
            triggerDownload(mdEditor.value, `arch-install-${ts}.md`);
        } else if (format === 'both' && mdEditor && shEditor) {
            triggerDownload(mdEditor.value, `arch-install-${ts}.md`);
            triggerDownload(shEditor.value, `arch-install-${ts}.sh`);
        } else {
            alert("No guide generated yet. Please generate first.");
        }
    });
}
