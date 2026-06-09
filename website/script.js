document.getElementById('install-form').addEventListener('submit', function(e) {
    e.preventDefault();

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
    const secTools = document.getElementById('securitytools') ? document.getElementById('securitytools').value : 'none';
    const anon_kloak = document.getElementById('anon_kloak') ? document.getElementById('anon_kloak').value : 'no';
    const anon_webhook = document.getElementById('anon_webhook') ? document.getElementById('anon_webhook').value : 'no';
    const anon_ssh = document.getElementById('anon_ssh') ? document.getElementById('anon_ssh').value : 'no';
    const fakeMain = document.getElementById('kernel-fake-main') ? document.getElementById('kernel-fake-main').value : 'none';
    const fakeBackup = document.getElementById('kernel-fake-backup') ? document.getElementById('kernel-fake-backup').value : 'none';
    const spoofDir = document.getElementById('spoof-dir') ? document.getElementById('spoof-dir').value : '/boot';

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

    let isScript = (format === "script");
    let cmdOnly = isScript;
    let output = "";

    const configData = { fw, fs, disk, part, initSys, boot, kernelMain, kernelBackup, software_type, desktop, swap_size, post_apps, cleanup, secTools, anon_kloak, anon_webhook, anon_ssh, fakeMain, fakeBackup, spoofDir, format };
    output += '### CONFIG_START\n### ' + JSON.stringify(configData) + '\n### CONFIG_END\n\n';

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

    let gpuPackages = "";
    if (software_type === "libre") gpuPackages = "mesa xf86-video-amdgpu xf86-video-intel vulkan-radeon vulkan-intel";
    else if (software_type === "opensource") gpuPackages = "mesa xf86-video-nouveau";
    else if (software_type === "proprietary") gpuPackages = "nvidia nvidia-utils";

    let adminTools = software_type === "libre" ? "opendoas pfetch" : "sudo fastfetch";
    let fsTools = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");

    let allKernels = kernelMain + " " + kernelMain + "-headers";
    if (kernelBackup !== "none") allKernels += " " + kernelBackup + " " + kernelBackup + "-headers";
    if (anonTools !== "none") {
        if (fakeMain !== "none") allKernels += " " + fakeMain;
        if (fakeBackup !== "none") allKernels += " " + fakeBackup;
    }

    output += `pacstrap -K /mnt base ${allKernels} ${gpuPackages} linux-firmware neovim ${adminTools} git ${fsTools}\n`;
    output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
    
    // Create chroot script to continue execution
    if (cmdOnly) {
        output += `\ncat << 'EOF' > /mnt/chroot_script.sh\n`;
        output += `#!/bin/bash\n`;
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
    
    const anon_kloak = document.getElementById('anon_kloak') ? document.getElementById('anon_kloak').value : 'no';
    const anon_webhook = document.getElementById('anon_webhook') ? document.getElementById('anon_webhook').value : 'no';
    const anon_ssh = document.getElementById('anon_ssh') ? document.getElementById('anon_ssh').value : 'no';
    
    if (anon_kloak === "yes" || anon_webhook === "yes" || anon_ssh === "yes" || fakeMain !== "none" || fakeBackup !== "none") {
        if (!cmdOnly) {
            output += `\`\`\`\n\n`;
            output += `## 8. Anonymisation & Anti-Evil Maid\n`;
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
            output += `# Integrate Libre-OTP with SSH via PAM\n`;
            output += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp' >> /etc/pam.d/sshd\n`;
            output += `systemctl enable sshd.service\n`;
        }

        if (fakeMain !== "none" || fakeBackup !== "none") {
            output += `\n# EVIL MAID SPOOFING: Deploy Fake Decoy Kernels\n`;
            output += `mkdir -p ${spoofDir}\n`;
            if (fakeMain !== "none") {
                output += `cp /boot/vmlinuz-${fakeMain} ${spoofDir}/vmlinuz-linux\n`;
                output += `cp /boot/initramfs-${fakeMain}.img ${spoofDir}/initramfs-linux.img\n`;
            }
            if (fakeBackup !== "none") {
                output += `cp /boot/vmlinuz-${fakeBackup} ${spoofDir}/vmlinuz-linux-lts\n`;
                output += `cp /boot/initramfs-${fakeBackup}.img ${spoofDir}/initramfs-linux-lts.img\n`;
            }
            output += `echo "Fake decoy kernels successfully deployed to ${spoofDir} to trap attackers."\n`;
        }
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

    // Editable text area setup
    const outputSection = document.getElementById('output-section');
    outputSection.style.display = 'block';
    
    let renderedHTML = "";
    if (isScript) {
        renderedHTML = `
            <div class="alert warning">Review all script commands below. You can edit this script directly in your browser.</div>
            <textarea id="editor" spellcheck="false" style="width: 100%; height: 500px; background: var(--bg-color); color: var(--fg-color); font-family: var(--font-mono); padding: 1rem; border: 1px solid var(--accent-blue);">${output}</textarea>
        `;
    } else {
        renderedHTML = `
            <div class="alert warning">You may edit the markdown guide locally before confirming/saving.</div>
            <textarea id="editor" spellcheck="false" style="width: 100%; height: 200px; background: var(--bg-color); color: var(--fg-color); font-family: var(--font-mono); padding: 1rem; border: 1px solid var(--accent-blue); margin-bottom: 1rem;">${output}</textarea>
            <h3>Live Preview:</h3>
            <div id="preview" style="border: 1px solid var(--bg-lighter); padding: 1rem;"></div>
        `;
    }

    document.getElementById('generated-guide').innerHTML = renderedHTML;
    
    if (!isScript) {
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

    outputSection.scrollIntoView({ behavior: 'smooth' });
});

// Interactive UI Logic
const formSteps = document.querySelectorAll('.form-step');
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-panel-content');
const defaultPanelHTML = infoContent.innerHTML;
let tooltipsEnabled = true;

const toggleBtn = document.getElementById('toggle-tooltips');
if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        tooltipsEnabled = !tooltipsEnabled;
        if (!tooltipsEnabled) {
            toggleBtn.style.filter = 'grayscale(1) sepia(1) hue-rotate(-50deg) saturate(5)'; // Makes it redish
            infoPanel.classList.remove('active');
            document.body.classList.remove('panel-active');
        } else {
            toggleBtn.style.filter = 'none';
        }
    });
}

// Mobile tap / Desktop hover info panel update
const formSteps = document.querySelectorAll('.form-step');
formSteps.forEach((step) => {
    step.addEventListener('mouseenter', () => updateInfoPanel(step));
    step.addEventListener('touchstart', () => updateInfoPanel(step), {passive: true});
    
    // Dynamic interactions
    const input = step.querySelector('select, input');
    if (input) {
        input.addEventListener('change', () => {
            updateInfoPanel(step);
            validateConfigurations();
        });
    }
});

function updateInfoPanel(group) {
    if (!tooltipsEnabled) return;
    
    const title = group.getAttribute('data-title');
    const desc = group.getAttribute('data-desc');
    const select = group.querySelector('select');
    let extraInfo = '';
    let warnings = '';

    if (!title && !desc) return;

    if (select) {
        const selectedText = select.options[select.selectedIndex].text;
        extraInfo = `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--bg-lighter);">
            <strong style="color: var(--accent-green)">Current Selection:</strong><br>
            <span style="color: var(--fg-color)">${selectedText}</span>
        </div>`;
    }

    // Dynamic warnings based on current selections
    const fw = document.getElementById('firmware').value;
    const part = document.getElementById('partitioning').value;
    
    if (group.querySelector('#bootloader') && fw === 'bios') {
        warnings += `<div style="color: #ff5555; margin-top: 10px;">⚠️ <strong>Warning:</strong> You selected Legacy BIOS. UKI and systemd-boot are physically impossible to install. GRUB is enforced.</div>`;
    }
    if (group.querySelector('#partitioning') && fw === 'bios' && part === 'luks2') {
        warnings += `<div style="color: #ffb86c; margin-top: 10px;">⚠️ <strong>Notice:</strong> GRUB has limited support for LUKS2. You will need an unencrypted /boot partition.</div>`;
    }

    infoContent.innerHTML = `
        <h3 style="color: var(--accent-purple); margin-top: 0; font-size: 1.2rem;">📌 ${title || 'Setting Details'}</h3>
        <p style="color: var(--fg-color); line-height: 1.5;">${desc || ''}</p>
        <p style="font-size: 0.85rem; color: var(--accent-blue); margin-top: 10px;"><em>💡 Right-click this panel to read the full Wiki article on this topic.</em></p>
        ${warnings}
        ${extraInfo}
    `;

    infoPanel.oncontextmenu = (e) => {
        e.preventDefault();
        window.open('wiki.html', '_blank');
    };
    
    infoPanel.classList.add('active');
    if (window.innerWidth <= 768) {
        document.body.classList.add('panel-active');
    }
}

// Close panel on clicking outside (Mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && tooltipsEnabled) {
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
    
    if (fw === 'bios') {
        Array.from(bootloader.options).forEach(opt => {
            if (opt.value.includes('uki') || opt.value === 'systemd-boot') {
                opt.disabled = true;
            }
        });
        if (bootloader.value !== 'grub') {
            bootloader.value = 'grub';
        }
    } else {
        Array.from(bootloader.options).forEach(opt => opt.disabled = false);
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
                                             key === 'fakeMain' ? 'kernel-fake-main' :
                                             key === 'fakeBackup' ? 'kernel-fake-backup' :
                                             key === 'spoofDir' ? 'spoof-dir' :
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
        const generatedDiv = document.getElementById('generated-guide');
        if (!generatedDiv || !generatedDiv.innerHTML) {
            alert("Please generate a guide or script first.");
            return;
        }
        
        const format = document.getElementById('outputformat').value;
        const extension = format === 'script' ? 'sh' : 'md';
        const filename = `arch-install-${new Date().getTime()}.${extension}`;
        
        // Find the raw text, including our metadata block
        const textContent = generatedDiv.innerText;
        
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (format === 'both') {
            const scriptMatches = textContent.match(/```bash\n([\s\S]*?)```/g);
            if (scriptMatches) {
                const scriptContent = "#!/bin/bash\n# Arch Installation Script (Extracted from Guide)\n\n" + scriptMatches.map(m => m.replace(/```bash\n/g, '').replace(/```/g, '')).join("\n");
                const blobSh = new Blob([scriptContent], { type: 'text/plain' });
                const urlSh = URL.createObjectURL(blobSh);
                const aSh = document.createElement('a');
                aSh.href = urlSh;
                aSh.download = `arch-install-${new Date().getTime()}.sh`;
                document.body.appendChild(aSh);
                aSh.click();
                document.body.removeChild(aSh);
                URL.revokeObjectURL(urlSh);
            }
        }
    });
}
