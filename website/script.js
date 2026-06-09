document.getElementById('install-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const fw = document.getElementById('firmware').value;
    const fs = document.getElementById('filesystem').value;
    const disk = document.getElementById('target-disk').value;
    const part = document.getElementById('partitioning').value;
    const initSys = document.getElementById('init_system').value;
    const boot = document.getElementById('bootloader').value;
    const kernels = document.getElementById('kernel').value;
    const philosophy = document.getElementById('philosophy').value;
    const desktop = document.getElementById('desktop').value;
    const browser = document.getElementById('browser').value;
    const dns = document.getElementById('dns').value;
    const format = document.getElementById('outputformat').value;
    const secTools = document.getElementById('securitytools') ? document.getElementById('securitytools').value : 'none';

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
    
    if (!cmdOnly) {
        output += `\`\`\`\n\n`;
        output += `## 2. Base Installation, Kernel & Admin Tools\n`;
        output += `\`\`\`bash\n`;
    } else {
        output += `\n# 2. Base Installation\n`;
    }

    let gpuPackages = "";
    if (philosophy === "libre") gpuPackages = "mesa xf86-video-amdgpu xf86-video-intel vulkan-radeon vulkan-intel";
    else if (philosophy === "opensource") gpuPackages = "mesa xf86-video-nouveau";
    else if (philosophy === "proprietary") gpuPackages = "nvidia nvidia-utils";

    let adminTools = philosophy === "libre" ? "opendoas pfetch" : "sudo fastfetch";
    let fsTools = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");

    output += `pacstrap -K /mnt base ${kernels} ${gpuPackages} linux-firmware neovim ${adminTools} git ${fsTools}\n`;
    output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
    
    // Create chroot script to continue execution
    if (cmdOnly) {
        output += `\ncat << 'EOF' > /mnt/chroot_script.sh\n`;
        output += `#!/bin/bash\n`;
    } else {
        output += `arch-chroot /mnt\n`;
    }
    
    if (philosophy === "libre") {
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
        output += `\n# 6. Desktop & Apps\n`;
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
    
    const anonTools = document.getElementById('anonymisation') ? document.getElementById('anonymisation').value : 'none';
    if (anonTools !== "none") {
        if (!cmdOnly) {
            output += `\`\`\`\n\n`;
            output += `## 8. Anonymisation & Anti-Evil Maid\n`;
            output += `\`\`\`bash\n`;
        } else {
            output += `\n# 8. Anonymisation & Anti-Evil Maid\n`;
        }

        if (anonTools === "kloak" || anonTools === "all") {
            output += `pacman -S --noconfirm git make gcc pkgconf\n`;
            output += `git clone https://github.com/vmonaco/kloak.git /opt/kloak\n`;
            output += `cd /opt/kloak && make && cp kloak /usr/local/bin/\n`;
            output += `cat << 'SRV' > /etc/systemd/system/kloak.service\n[Unit]\nDescription=Kloak Keystroke Anonymizer\n[Service]\nExecStart=/usr/local/bin/kloak\nRestart=always\n[Install]\nWantedBy=multi-user.target\nSRV\n`;
            output += `systemctl enable kloak.service\n`;
        }

        if (anonTools === "webhook" || anonTools === "all") {
            output += `# Optional: Configure kernel hook webhook alerts in /etc/systemd/system/malware-alert.service\n`;
            output += `echo 'Your custom rust/python kernel hook would be deployed here.'\n`;
        }

        if (anonTools === "ssh" || anonTools === "all") {
            output += `pacman -S --noconfirm openssh\n`;
            output += `sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config\n`;
            output += `sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config\n`;
            output += `# Integrate Libre-OTP with SSH via PAM\n`;
            output += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp' >> /etc/pam.d/sshd\n`;
            output += `systemctl enable sshd.service\n`;
        }
    }
    if (cmdOnly) {
        output += `EOF\n`;
        output += `chmod +x /mnt/chroot_script.sh\n`;
        output += `arch-chroot /mnt /chroot_script.sh\n`;
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
    toggleBtn.addEventListener('click', () => {
        tooltipsEnabled = !tooltipsEnabled;
        if (!tooltipsEnabled) {
            toggleBtn.textContent = 'Enable Info Panel / Tooltips';
            toggleBtn.style.background = 'var(--accent-red)';
            infoPanel.classList.remove('active');
            document.body.classList.remove('panel-active');
        } else {
            toggleBtn.textContent = 'Disable Info Panel / Tooltips';
            toggleBtn.style.background = 'var(--bg-lighter)';
        }
    });
}

// Progressive Disclosure
let currentStep = 0;
formSteps[0].classList.add('visible');

document.getElementById('reveal-all-btn').addEventListener('click', () => {
    formSteps.forEach(step => step.classList.add('visible'));
    document.getElementById('continue-prompt').style.display = 'none';
    document.getElementById('generate-btn').style.display = 'block';
});

// Add dynamic interactions to inputs
formSteps.forEach((step, index) => {
    const input = step.querySelector('select, input');
    
    // Progress form
    if (input) {
        input.addEventListener('change', () => {
            if (index + 1 < formSteps.length) {
                formSteps[index + 1].classList.add('visible');
            }
            if (index + 2 >= formSteps.length) {
                document.getElementById('continue-prompt').style.display = 'none';
                document.getElementById('generate-btn').style.display = 'block';
            }
            updateInfoPanel(step);
            validateConfigurations();
        });
        
        // Mobile tap / Desktop hover info panel update
        step.addEventListener('mouseenter', () => updateInfoPanel(step));
        step.addEventListener('touchstart', () => updateInfoPanel(step), {passive: true});
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
        ${warnings}
        ${extraInfo}
    `;
    
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
