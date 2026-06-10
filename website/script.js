// =============================================
// Arch Guides Dynamic - Main Script
// =============================================

// ---- Generation History (sessionStorage based, cleared on reload) ----
const HISTORY_KEY = 'arch_gen_history';

function saveToHistory(mdContent, shContent, format) {
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    const entry = {
        timestamp: new Date().toLocaleString(),
        format,
        md: mdContent || '',
        sh: shContent || ''
    };
    history.unshift(entry); // newest first
    if (history.length > 10) history = history.slice(0, 10);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistoryPanel();
}

function renderHistoryPanel() {
    const panel = document.getElementById('history-panel');
    if (!panel) return;
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}

    if (history.length === 0) {
        panel.innerHTML = '<em style="color:var(--fg-color)">No generations this session.</em>';
        return;
    }
    panel.innerHTML = history.map((entry, i) => `
        <div style="border-bottom:1px solid var(--bg-lighter);padding:0.5rem 0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.85rem;color:var(--accent-cyan)">${entry.timestamp} (${entry.format})</span>
            <button class="btn" style="width:auto;padding:0.3rem 0.7rem;font-size:0.8rem;" onclick="restoreFromHistory(${i})">Restore</button>
        </div>
    `).join('');
}

window.restoreFromHistory = function(idx) {
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    const entry = history[idx];
    if (!entry) return;

    const mdEl = document.getElementById('raw-md-code');
    const shEl = document.getElementById('raw-script-code');
    const previewEl = document.getElementById('preview');

    if (mdEl && entry.md) mdEl.innerText = entry.md;
    if (shEl && entry.sh) shEl.innerText = entry.sh;
    if (previewEl && entry.md && typeof marked !== 'undefined') {
        previewEl.innerHTML = marked.parse(entry.md.replace(/<!--[\s\S]*?-->/g, ''));
    }
    if (window.Prism) Prism.highlightAll();
};

// ---- Main Output Generator ----
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
    const displayServer = document.getElementById('display_server') ? document.getElementById('display_server').value : 'auto';
    const swap_size = document.getElementById('swap_size').value;
    const cleanup = document.getElementById('cleanup').value;
    const browser = document.getElementById('browser').value;
    const dns = document.getElementById('dns').value;
    const format = document.getElementById('outputformat').value;
    const user_count = document.getElementById('user_count') ? parseInt(document.getElementById('user_count').value) || 1 : 1;
    const root_ssh = document.getElementById('root_ssh') ? document.getElementById('root_ssh').value : 'no';
    const otp_sha = document.getElementById('otp_sha') ? document.getElementById('otp_sha').value : 'sha1';
    const iso_setup = document.getElementById('iso_setup') ? document.getElementById('iso_setup').value : 'none';

    // Get checkboxes for post_apps
    const post_apps = [];
    document.querySelectorAll('input[name="post_apps"]:checked').forEach((cb) => post_apps.push(cb.value));

    const cpu_brand = document.getElementById('cpu_brand') ? document.getElementById('cpu_brand').value : 'amd';
    const gpu_brand = document.getElementById('gpu_brand') ? document.getElementById('gpu_brand').value : 'amd';
    const vm_guest = document.getElementById('vm_guest') ? document.getElementById('vm_guest').value : 'none';
    const auto_updates = document.getElementById('auto_updates') ? document.getElementById('auto_updates').value : 'no';

    const useCustomScripts = document.getElementById('use-custom-scripts') ? document.getElementById('use-custom-scripts').value === 'yes' : false;
    const secTools = (useCustomScripts && document.getElementById('securitytools')) ? document.getElementById('securitytools').value : 'none';
    const libreOtpMode = document.getElementById('libre_otp_mode') ? document.getElementById('libre_otp_mode').value : 'login';
    const anon_kloak = (useCustomScripts && document.getElementById('anon_kloak')) ? document.getElementById('anon_kloak').value : 'no';
    const anon_webhook = (useCustomScripts && document.getElementById('anon_webhook')) ? document.getElementById('anon_webhook').value : 'no';
    const anon_ssh = (useCustomScripts && document.getElementById('anon_ssh')) ? document.getElementById('anon_ssh').value : 'no';
    const fakeEvilMaid = (useCustomScripts && document.getElementById('fake-evil-maid')) ? document.getElementById('fake-evil-maid').value : 'no';

    // Config validation
    const errors = [];
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
        return;
    } else {
        errorDiv.innerHTML = "";
    }

    let partEfi = disk + "1";
    let partRoot = disk + "2";
    if (disk.includes("nvme")) {
        partEfi = disk + "p1";
        partRoot = disk + "p2";
    }

    const configData = { fw, fs, disk, part, initSys, boot, kernelMain, kernelBackup, software_type, cpu_brand, gpu_brand, desktop, displayServer, swap_size, post_apps, auto_updates, cleanup, browser, dns, secTools, libreOtpMode, anon_kloak, anon_webhook, anon_ssh, fakeEvilMaid, format, user_count, root_ssh, otp_sha, iso_setup };

    // ---- Build Output Function ----
    function buildOutput(cmdOnly) {
        let output = "";

        // Embed config metadata silently (no visible reprint)
        output += '<!-- CONFIG_START\n' + JSON.stringify(configData) + '\nCONFIG_END -->\n\n';

        if (!cmdOnly) {
            output += `# Your Custom Arch Linux Installation Guide\n\n`;
            output += `> *This guide was generated for your specific hardware. Review all commands before running.*\n\n`;
            output += `## 1. Partitioning & Formatting (${part} + ${fs})\n`;
            output += '```bash\n';
        } else {
            output += `#!/bin/bash\n`;
            output += `# Generated by Arch Guides Dynamic (https://tilas01.github.io/arch-guides-dynamic/)\n`;
            output += `# WARNING: Review ALL commands before executing!\n`;
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
                output += `fallocate -l ${swap_size} /mnt/swapfile\nchmod 600 /mnt/swapfile\nmkswap /mnt/swapfile\n`;
            }
            output += `swapon /mnt/swapfile\n`;
        }

        if (!cmdOnly) {
            output += '```\n\n';
            output += `## 2. Base Installation, Kernel & Admin Tools\n`;
            output += '```bash\n';
        } else {
            output += `\n# 2. Base Installation\n`;
        }

        let cpuPackages = cpu_brand === "amd" ? "amd-ucode" : (cpu_brand === "intel" ? "intel-ucode" : "");
        let gpuPackages = "";
        if (gpu_brand === "amd") gpuPackages = "mesa xf86-video-amdgpu vulkan-radeon";
        else if (gpu_brand === "intel") gpuPackages = "mesa xf86-video-intel vulkan-intel";
        else if (gpu_brand === "nvidia") {
            if (software_type === "libre" || software_type === "opensource") {
                gpuPackages = "mesa xf86-video-nouveau";
                if (!cmdOnly) output += `> **Note:** Nvidia selected with Libre/OSS paradigm. Using Nouveau open-source driver. For proprietary Nvidia performance, switch to 'Open Source + Proprietary' software type.\n\n`;
            } else {
                gpuPackages = "nvidia nvidia-utils";
            }
        } else if (gpu_brand === "vm") {
            gpuPackages = "spice-vdagent xf86-video-qxl";
        }

        let vmPackages = "";
        if (vm_guest === "vbox") vmPackages = "virtualbox-guest-utils";
        else if (vm_guest === "vmware") vmPackages = "open-vm-tools";
        else if (vm_guest === "qemu") vmPackages = "qemu-guest-agent";

        let adminTools = software_type === "libre" ? "opendoas pfetch cronie" : "sudo fastfetch cronie";
        let fsTools = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");

        let allKernels = kernelMain + " " + kernelMain + "-headers";
        if (kernelBackup !== "none") allKernels += " " + kernelBackup + " " + kernelBackup + "-headers";
        if (fakeEvilMaid === "yes") allKernels += " linux-lts linux-hardened";

        output += `pacstrap -K /mnt base ${allKernels} ${cpuPackages} ${gpuPackages} ${vmPackages} linux-firmware neovim ${adminTools} git ${fsTools}\n`;
        output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;

        if (cmdOnly) {
            output += `\ncat << 'EOF' > /mnt/chroot_script.sh\n#!/bin/bash\n`;
            output += `echo "== Setting root password =="\npasswd root\n`;
            for (let u = 1; u <= user_count; u++) {
                output += `read -p "Enter username for user ${u}: " newuser${u}\n`;
                output += `useradd -m -G wheel -s /bin/bash "$newuser${u}"\npasswd "$newuser${u}"\n`;
            }
        } else {
            output += `arch-chroot /mnt\n`;
        }

        if (software_type === "libre") {
            output += `echo "permit persist :wheel" > /etc/doas.conf\nln -s /usr/bin/doas /usr/bin/sudo\n`;
        } else {
            output += `echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel\n`;
        }

        if (root_ssh === "no") {
            output += `# Root SSH disabled; only regular users can SSH in\n`;
        }

        if (!cmdOnly) {
            output += '```\n\n';
            output += `## 3. Initramfs Configuration (${initSys})\n`;
            output += '```bash\n';
        } else {
            output += `\n# 3. Initramfs\n`;
        }

        let baseHooks = initSys === "systemd"
            ? "base systemd autodetect microcode modconf kms keyboard sd-vconsole block"
            : "base udev autodetect microcode modconf kms keyboard keymap consolefont block";
        let cryptoHook = part !== "unencrypted" ? (initSys === "systemd" ? "sd-encrypt" : "encrypt") : "";
        let lvmHook = part.includes("lvm") ? "lvm2" : "";
        let fsHook = fs === "btrfs" ? "btrfs filesystems fsck" : "filesystems fsck";
        let allHooks = [baseHooks, cryptoHook, lvmHook, fsHook].filter(h => h).join(" ");

        output += `sed -i 's/^HOOKS=.*/HOOKS=(${allHooks})/' /etc/mkinitcpio.conf\nmkinitcpio -P\n`;

        if (!cmdOnly) {
            output += '```\n\n';
            output += `## 4. Bootloader & Secure Boot (${boot})\n`;
            output += '```bash\n';
        } else {
            output += `\n# 4. Bootloader\n`;
        }

        if (fw === "bios" || boot.includes("grub")) {
            output += `pacman -S --noconfirm grub efibootmgr\n`;
            if (fw === "uefi") {
                output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n`;
            } else {
                output += `grub-install --target=i386-pc ${disk}\n`;
            }
            output += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
        } else if (boot.includes("uki")) {
            output += `pacman -S --noconfirm sbsigntools efitools efibootmgr\n`;
            if (boot === "uki-shim") {
                output += `pacman -S --noconfirm shim-signed\ncp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/bootx64.efi\n`;
            }
        } else if (boot === "systemd-boot") {
            output += `bootctl install --esp-path=/efi\n`;
        }

        if (!cmdOnly) {
            output += '```\n\n';
            output += `## 5. DNS Caching Service (${dns})\n`;
            output += '```bash\n';
        } else {
            output += `\n# 5. DNS\n`;
        }

        if (dns === "unbound") {
            output += `pacman -S --noconfirm unbound\nsystemctl enable unbound\n`;
        } else if (dns === "dnscrypt-proxy") {
            output += `pacman -S --noconfirm dnscrypt-proxy\nsystemctl enable dnscrypt-proxy\n`;
        } else if (dns === "bind") {
            output += `pacman -S --noconfirm bind\nsystemctl enable named\n`;
        } else if (dns === "dnsmasq") {
            output += `pacman -S --noconfirm dnsmasq\nsystemctl enable dnsmasq\n`;
        } else {
            output += `systemctl enable systemd-resolved\n`;
        }

        if (!cmdOnly) {
            output += '```\n\n';
            output += `## 6. Desktop Environment & Post-Install Apps\n`;
            output += '```bash\n';
        } else {
            output += `\n# 6. Desktop, Apps & AUR\n`;
        }

        // AUR helper setup (always done for paru or any AUR app)
        const needsAUR = post_apps.length > 0 || desktop === "dusky";
        if (needsAUR) {
            output += `pacman -S --noconfirm git base-devel\n`;
            output += `useradd -m -G wheel -s /bin/bash builder\n`;
            output += `echo "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder\n`;
        }

        // Post-install apps with per-app logic
        if (post_apps.includes("paru") || post_apps.length > 0) {
            output += `su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"\n`;
        }
        if (post_apps.includes("firefox")) output += `pacman -S --noconfirm firefox\n`;
        if (post_apps.includes("librewolf")) output += `su - builder -c "paru -S --noconfirm librewolf"\n`;
        if (post_apps.includes("signal")) output += `su - builder -c "paru -S --noconfirm signal-desktop"\n`;
        if (post_apps.includes("neovim")) output += `pacman -S --noconfirm neovim git ripgrep fd\n`;
        if (post_apps.includes("alacritty")) output += `pacman -S --noconfirm alacritty\n`;
        if (post_apps.includes("zsh")) output += `pacman -S --noconfirm zsh zsh-completions\nchsh -s /bin/zsh\n`;
        if (post_apps.includes("thunar")) output += `pacman -S --noconfirm thunar gvfs thunar-volman\n`;
        if (post_apps.includes("mpv")) output += `pacman -S --noconfirm mpv\n`;
        if (post_apps.includes("flatpak")) output += `pacman -S --noconfirm flatpak\nflatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo\n`;
        if (post_apps.includes("keepassxc")) output += `pacman -S --noconfirm keepassxc\n`;
        if (post_apps.includes("tor-browser")) output += `su - builder -c "paru -S --noconfirm tor-browser"\n`;
        if (post_apps.includes("vscodium")) output += `su - builder -c "paru -S --noconfirm vscodium"\n`;
        if (post_apps.includes("obs")) output += `pacman -S --noconfirm obs-studio\n`;

        // Desktop Environment
        const dsXorg = (displayServer === "auto" && (desktop === "dusky" || desktop === "dwm")) || displayServer === "xorg";
        const dsWayland = displayServer === "wayland";

        if (desktop === "gnome") {
            if (dsWayland) output += `pacman -S --noconfirm gnome gnome-tweaks wayland\n`;
            else output += `pacman -S --noconfirm gnome gnome-tweaks xorg-server\n`;
            output += `systemctl enable gdm\n`;
        } else if (desktop === "kde") {
            if (dsWayland) output += `pacman -S --noconfirm plasma-desktop sddm wayland\n`;
            else output += `pacman -S --noconfirm plasma-desktop sddm xorg-server\n`;
            output += `systemctl enable sddm\n`;
        } else if (desktop === "dwm") {
            output += `pacman -S --noconfirm xorg-server xorg-xinit base-devel libx11 libxinerama libxft\n`;
            output += `# DWM must be compiled from source: https://dwm.suckless.org\n`;
            output += `git clone https://git.suckless.org/dwm /usr/local/src/dwm && cd /usr/local/src/dwm && make install\n`;
        } else if (desktop === "dusky") {
            output += dsWayland
                ? `pacman -S --noconfirm git base-devel wayland xorg-xwayland\n`
                : `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\n`;
            if (software_type === "libre") {
                output += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && sed -i 's/sudo/doas/g' install.sh && ./install.sh"\n`;
            } else {
                output += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\n`;
            }
        }

        // Browser
        if (browser === "librewolf") output += `su - builder -c "paru -S --noconfirm librewolf"\n`;
        else if (browser === "firefox") output += `pacman -S --noconfirm firefox\n`;

        // BTRFS snapper
        if (fs === "btrfs") {
            output += `snapper -c root create-config /\nsystemctl enable snapper-timeline.timer snapper-cleanup.timer\n`;
        }

        // VM guest services
        if (vm_guest === "vbox") output += `systemctl enable vboxservice.service\n`;
        else if (vm_guest === "vmware") output += `systemctl enable vmtoolsd.service\n`;
        else if (vm_guest === "qemu") output += `systemctl enable qemu-guest-agent.service\n`;

        // Cleanup AUR builder
        if (needsAUR) {
            output += `userdel -r builder\nrm -f /etc/sudoers.d/builder\n`;
        }

        // Security Tools
        if (secTools !== "none") {
            if (!cmdOnly) {
                output += '```\n\n';
                output += `## 7. Advanced Rust Security Tools (by tilas01)\n`;
                output += '```bash\n';
            } else {
                output += `\n# 7. Security Tools\n`;
            }
            output += `pacman -S --noconfirm rust cargo\nmkdir -p /opt/security-tools && cd /opt/security-tools\n`;

            if (secTools === "libre-otp" || secTools === "both") {
                output += `git clone https://github.com/tilas01/arch-guides-dynamic.git /tmp/ag-dynamic\n`;
                output += `cd /tmp/ag-dynamic/security-tools/libre-otp && cargo build --release\n`;
                output += `cp target/release/libre-otp /usr/local/bin/\n`;
                output += `libre-otp --setup\n`;
            }
            if (secTools === "anti-ducky" || secTools === "both") {
                output += `cd /tmp/ag-dynamic/security-tools/anti-ducky && cargo build --release\n`;
                output += `cp target/release/anti-ducky /usr/local/bin/\n`;
                output += `cat << 'SRV' > /etc/systemd/system/anti-ducky.service\n[Unit]\nDescription=Anti-RubberDucky Input Monitor\n[Service]\nExecStart=/usr/local/bin/anti-ducky\nRestart=always\n[Install]\nWantedBy=multi-user.target\nSRV\n`;
                output += `systemctl enable anti-ducky.service\n`;
            }
        }

        // Anonymisation
        if (anon_kloak === "yes" || anon_webhook === "yes" || anon_ssh === "yes" || fakeEvilMaid === "yes") {
            if (!cmdOnly) {
                output += '```\n\n';
                output += `## 8. Anonymisation & Anti-Evil Maid\n`;
                output += '```bash\n';
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

            if (anon_ssh === "yes") {
                output += `pacman -S --noconfirm openssh\n`;
                output += `sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config\n`;
                if (root_ssh === "no") {
                    output += `sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config\n`;
                }
                if (secTools === "libre-otp" || secTools === "both") {
                    output += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp' >> /etc/pam.d/sshd\n`;
                }
                output += `systemctl enable sshd.service\n`;
            }

            if (fakeEvilMaid === "yes") {
                output += `\n# Deploy Fake Decoy Kernels for Evil Maid Protection\n`;
                output += `mkdir -p /boot/fake_efi\n`;
                output += `cp /boot/vmlinuz-linux-lts /boot/fake_efi/vmlinuz-linux 2>/dev/null || true\n`;
                output += `cp /boot/initramfs-linux-lts.img /boot/fake_efi/initramfs-linux.img 2>/dev/null || true\n`;
            }
        }

        if (auto_updates === "yes") {
            if (!cmdOnly) {
                output += '```\n\n';
                output += `## 9. Automatic Updates\n`;
                output += '```bash\n';
            } else {
                output += `\n# 9. Auto Updates\n`;
            }
            output += `systemctl enable cronie\n`;
            output += `cat << 'CRON_SCRIPT' > /usr/local/bin/auto-update.sh\n#!/bin/bash\nLOGFILE="/var/log/auto-update.log"\necho "Starting Update: $(date)" >> $LOGFILE\npacman -Syu --noconfirm >> $LOGFILE 2>&1\necho "Update Complete: $(date)" >> $LOGFILE\nCRON_SCRIPT\n`;
            output += `chmod +x /usr/local/bin/auto-update.sh\n`;
            output += `(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auto-update.sh") | crontab -\n`;
        }

        if (cmdOnly) {
            output += `EOF\nchmod +x /mnt/chroot_script.sh\narch-chroot /mnt /chroot_script.sh\n`;
            if (cleanup === "yes") {
                output += `echo "Cleaning up..."\narch-chroot /mnt pacman -Scc --noconfirm\nrm -rf /mnt/var/cache/pacman/pkg/* /mnt/tmp/*\n`;
            }
            output += `rm /mnt/chroot_script.sh\necho "==========================="\necho "Install complete! Run: reboot"\necho "==========================="\n`;
        } else {
            output += '```\n\n';
            output += `---\n*Guide complete. Verify networking and set passwords before rebooting into your tailored ${desktop !== "none" ? desktop : "TTY"} environment.*\n`;
            output += `\n*Generated by [Arch Guides Dynamic](https://tilas01.github.io/arch-guides-dynamic/) — a tool by [tilas01](https://github.com/tilas01)*\n`;
        }

        return output;
    }

    // ---- Render Output ----
    const outputSection = document.getElementById('output-section');
    outputSection.style.display = 'block';

    let isoSetupCmd = "";
    if (iso_setup === "ssh") {
        isoSetupCmd = `systemctl start sshd\necho 'root:arch' | chpasswd\n# Connect via: ssh root@<ip-address>`;
    } else if (iso_setup === "ssh_curl") {
        isoSetupCmd = `pacman -Sy --noconfirm curl\nsystemctl start sshd\necho 'root:arch' | chpasswd\n# Connect via: ssh root@<ip-address>`;
    }

    const BOX = `
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
        background: #0d1117;
        padding: 1.5rem 2rem;
        border: 2px solid var(--accent-blue);
        border-radius: 16px;
        max-width: 100%;
        box-sizing: border-box;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.6);
        font-family: var(--font-mono);
        font-size: 0.92rem;
        line-height: 1.6;
        overflow: hidden;
    `;
    const PREVIEW_BOX = BOX.replace('border: 2px solid var(--accent-blue)', 'border: 2px solid var(--accent-purple)') + `
        color: var(--fg-color);
    `;
    const HDR = `color:var(--accent-cyan);font-weight:bold;font-size:1.1rem;margin:1.5rem 0 0.5rem;border-bottom:2px solid var(--accent-blue);padding-bottom:0.4rem;`;
    const HDR_PREV = `color:var(--accent-purple);font-weight:bold;font-size:1.1rem;margin:1.5rem 0 0.5rem;border-bottom:2px solid var(--accent-purple);padding-bottom:0.4rem;`;

    const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let renderedHTML = "";
    let mdOutput = "", scriptOutput = "";

    if (isoSetupCmd) {
        renderedHTML += `<div class="alert warning"><strong>📡 Arch ISO Pre-Setup Commands:</strong><pre><code>${escape(isoSetupCmd)}</code></pre></div>`;
    }

    if (format === "script" || format === "both") {
        scriptOutput = buildOutput(true);
    }
    if (format === "markdown" || format === "both") {
        mdOutput = buildOutput(false);
    }

    // Markdown editor + live preview
    if (format === "markdown" || format === "both") {
        renderedHTML += `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                <h3 style="${HDR}">📝 Markdown Guide Editor</h3>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn" style="width:auto;padding:0.4rem 1rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-md-code').innerText).then(()=>this.textContent='Copied!').catch(()=>{}); setTimeout(()=>this.textContent='Copy MD',2000)">Copy MD</button>
                    <button class="btn" style="width:auto;padding:0.4rem 1rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-md-code').innerText, 'arch-install.md')">💾 Download .md</button>
                </div>
            </div>
            <pre style="${BOX}"><code id="raw-md-code" class="language-markdown" contenteditable="true" oninput="updatePreview()">${escape(mdOutput)}</code></pre>

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                <h3 style="${HDR_PREV}">👁 Live Preview</h3>
                <span style="font-size:0.8rem;color:var(--accent-cyan);">Updates as you type in the editor above</span>
            </div>
            <div id="preview" style="${PREVIEW_BOX}" class="markdown-body"></div>
        `;
    }

    // Script editor
    if (format === "script" || format === "both") {
        const deployCmd = `cat << 'ARCHEOF' > install.sh\n${scriptOutput}\nARCHEOF\nbash install.sh`;
        renderedHTML += `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-top:1.5rem;">
                <h3 style="${HDR}">⚡ Raw Executable Bash Script</h3>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn" style="width:auto;padding:0.4rem 1rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-script-code').innerText).then(()=>this.textContent='Copied!').catch(()=>{}); setTimeout(()=>this.textContent='Copy Script',2000)">Copy Script</button>
                    <button class="btn" style="width:auto;padding:0.4rem 1rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-script-code').innerText, 'arch-install.sh')">💾 Download .sh</button>
                </div>
            </div>
            <pre style="${BOX}"><code id="raw-script-code" class="language-bash" contenteditable="true">${escape(scriptOutput)}</code></pre>

            <div style="margin-top:1rem;padding:1.2rem;border:2px solid var(--accent-cyan);border-radius:12px;background:rgba(125,207,255,0.07);">
                <strong style="color:var(--accent-cyan);">🖥 SSH Deploy Command</strong>
                <p style="font-size:0.85rem;color:var(--fg-color);margin:0.5rem 0;">Copy the entire block below and paste it into your Arch ISO terminal over SSH:</p>
                <pre style="word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;font-size:0.8rem;"><code class="language-bash">${escape(deployCmd)}</code></pre>
            </div>
        `;
    }

    // Generation history panel
    renderedHTML += `
        <div style="margin-top:2rem;padding:1.2rem;border:1px solid var(--bg-lighter);border-radius:12px;background:var(--bg-darker);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;">
                <strong style="color:var(--accent-purple);">🕓 Generation History (this session)</strong>
                <button class="btn" style="width:auto;padding:0.3rem 0.7rem;font-size:0.8rem;background:var(--accent-red);" onclick="sessionStorage.removeItem('arch_gen_history');renderHistoryPanel()">Clear History</button>
            </div>
            <div id="history-panel"></div>
        </div>
        <div style="margin-top:1rem;text-align:center;">
            <a href="index.html" class="btn" style="display:inline-block;width:auto;padding:0.6rem 1.5rem;text-decoration:none;">🔧 Back to Generator (reconfigure)</a>
        </div>
    `;

    document.getElementById('generated-guide').innerHTML = renderedHTML;
    if (window.Prism) Prism.highlightAll();

    // Initial preview render
    updatePreview();

    // Save to session history
    if (!auto) {
        saveToHistory(mdOutput, scriptOutput, format);
        outputSection.scrollIntoView({ behavior: 'smooth' });
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) downloadBtn.style.display = 'block';
    }
};

// ---- Live Preview Updater ----
window.updatePreview = function() {
    const mdEl = document.getElementById('raw-md-code');
    const previewEl = document.getElementById('preview');
    if (!mdEl || !previewEl) return;
    const raw = mdEl.innerText || "";
    // Strip the hidden config comment before rendering
    const clean = raw.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (typeof marked !== 'undefined') {
        previewEl.innerHTML = marked.parse(clean);
        if (window.Prism) Prism.highlightAll();
    }
};

// ---- Download Helper ----
window.downloadFile = function(content, filename) {
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

// ---- Generate Button ----
document.getElementById('generate-btn').addEventListener('click', function(e) {
    e.preventDefault();
    window.generateOutput(false);
});

// ---- Interactive UI Logic ----
const formSteps = document.querySelectorAll('.form-step, .nav-tooltip');
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-panel-content');
const defaultPanelHTML = infoContent ? infoContent.innerHTML : '';

let tooltipsEnabled = true;
const tooltipToggleBtn = document.getElementById('toggle-tooltips-btn');
const customScriptsSelect = document.getElementById('use-custom-scripts');
const customScriptsContainer = document.getElementById('custom-scripts-container');
const securityToolsSelect = document.getElementById('securitytools');
const libreOtpModeContainer = document.getElementById('libre-otp-mode-container');

if (tooltipToggleBtn) {
    tooltipToggleBtn.addEventListener('click', () => {
        tooltipsEnabled = !tooltipsEnabled;
        tooltipToggleBtn.style.color = tooltipsEnabled ? 'var(--accent-blue)' : '#888';
        if (!tooltipsEnabled && infoPanel) {
            infoPanel.classList.remove('active');
            document.body.classList.remove('panel-active');
        }
    });
    tooltipToggleBtn.addEventListener('mouseenter', (e) => { if (tooltipsEnabled) updateInfoPanel(tooltipToggleBtn, e); });
    tooltipToggleBtn.addEventListener('mouseleave', () => { if (tooltipsEnabled && infoPanel) infoPanel.classList.remove('active'); });
}

if (customScriptsSelect && customScriptsContainer) {
    customScriptsSelect.addEventListener('change', () => {
        customScriptsContainer.style.display = customScriptsSelect.value === 'yes' ? 'block' : 'none';
    });
}

if (securityToolsSelect && libreOtpModeContainer) {
    securityToolsSelect.addEventListener('change', () => {
        libreOtpModeContainer.style.display = (securityToolsSelect.value === 'libre-otp' || securityToolsSelect.value === 'both') ? 'block' : 'none';
    });
}

// Mobile panel tap → open wiki
if (infoPanel) {
    infoPanel.addEventListener('click', () => {
        if (window.innerWidth <= 768 && window._currentWikiHash) {
            window.open('wiki.html' + window._currentWikiHash, '_blank');
        }
    });
}

// Wiki map for tooltip → wiki linking
const wikiMap = {
    'Generator': '?page=architecture.md',
    'Wiki': '?page=architecture.md',
    'Firmware Selection': '?page=architecture.md',
    'File System Features': '?page=02-partitioning/',
    'Target Installation Disk': '?page=01-pre-installation.md',
    'Encryption Options': '?page=02-partitioning/',
    'Init System': '?page=architecture.md',
    'Bootloader Choice': '?page=04-bootloaders/',
    'Main Kernel': '?page=03-base-installation.md',
    'Backup Kernel': '?page=03-base-installation.md',
    'CPU Architecture': '?page=03-base-installation.md',
    'GPU Hardware': '?page=03-base-installation.md',
    'Virtual Machine Guest Setup': '?page=03-base-installation.md',
    'Software Type & Graphics Drivers': '?page=10-generator-selections-and-dusky.md',
    'Swap File Size': '?page=02-partitioning/',
    'Post-Install Apps & Scripts': '?page=10-generator-selections-and-dusky.md',
    'Automatic System Updates': '?page=07-post-installation.md',
    'Multi-User Setup': '?page=10-generator-selections-and-dusky.md',
    'System Cleanup': '?page=07-post-installation.md',
    'Tilas01 Custom Scripts': '?page=architecture.md',
    'Advanced Security Tools': '?page=architecture.md',
    'Libre OTP Mode': '?page=architecture.md',
    'Libre OTP SHA Algorithm': '?page=architecture.md',
    'Keystroke Anonymisation': '?page=architecture.md',
    'Malware Detection Webhooks': '?page=architecture.md',
    'Hardened SSH & OTP': '?page=architecture.md',
    'Fake Evil Maid Directory': '?page=architecture.md',
    'Arch ISO Setup Utilities': '?page=01-pre-installation.md',
    'Output Format': '?page=architecture.md',
    'Display Server': '?page=xorg-vs-wayland.md',
};

function updateInfoPanel(group, e, force = false) {
    if (!tooltipsEnabled && !force) return;
    if (!infoPanel || !infoContent) return;

    const title = group.getAttribute ? group.getAttribute('data-title') : null;
    const desc = group.getAttribute ? group.getAttribute('data-desc') : null;
    if (!title && !desc) return;

    const warningCount = window.smartAnalysisWarnings ? window.smartAnalysisWarnings.length : 0;
    const warnText = warningCount > 0 ? `<br><br><strong style="color:var(--accent-red);">⚠ ${warningCount} Warning(s) — Scroll down for Smart Analysis.</strong>` : '';
    const mappedLink = wikiMap[title] || '';
    window._currentWikiHash = mappedLink;

    const select = group.querySelector ? group.querySelector('select') : null;
    let extraInfo = '';
    if (select) {
        const sel = select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : '';
        extraInfo = `<div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid var(--bg-lighter);"><strong style="color:var(--accent-green)">Current:</strong> <span style="color:var(--accent-blue)">${sel}</span></div>`;
    }

    const wikiHint = mappedLink
        ? `<p style="font-size:0.8rem;color:var(--accent-blue);margin-top:8px;"><em>💡 Right-click (desktop) or tap panel (mobile) to open Wiki.</em></p>`
        : '';

    infoContent.innerHTML = `
        <h3 style="color:var(--accent-purple);margin-top:0;font-size:1.1rem;">📌 ${title || 'Setting Details'}</h3>
        <p style="color:var(--fg-color);line-height:1.5;font-size:0.9rem;">${desc || ''}</p>
        ${wikiHint}${warnText}${extraInfo}
    `;

    infoPanel.classList.add('active');

    if (e && window.innerWidth > 768) {
        let x = e.clientX + 15, y = e.clientY + 15;
        const rect = infoPanel.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
        if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
        infoPanel.style.left = x + 'px';
        infoPanel.style.top = y + 'px';
    }
    if (window.innerWidth <= 768) document.body.classList.add('panel-active');
}

formSteps.forEach((step) => {
    step.addEventListener('mouseenter', (e) => { if (tooltipsEnabled) updateInfoPanel(step, e); });
    step.addEventListener('mouseleave', () => { if (tooltipsEnabled && infoPanel) infoPanel.classList.remove('active'); });
    step.addEventListener('touchstart', (e) => { if (tooltipsEnabled) updateInfoPanel(step, e); }, { passive: true });
    const input = step.querySelector ? step.querySelector('select, input') : null;
    if (input) {
        input.addEventListener('change', () => {
            if (tooltipsEnabled) updateInfoPanel(step);
            validateConfigurations();
        });
    }
});

// Desktop: right-click anywhere with active panel → open wiki
document.addEventListener('contextmenu', (e) => {
    if (window.innerWidth > 768 && infoPanel && infoPanel.classList.contains('active') && window._currentWikiHash) {
        e.preventDefault();
        window.open('wiki.html' + window._currentWikiHash, '_blank');
    }
});

document.addEventListener('mousemove', (e) => {
    if (!infoPanel || !infoPanel.classList.contains('active') || window.innerWidth <= 768) return;
    let x = e.clientX + 15, y = e.clientY + 15;
    const rect = infoPanel.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 15;
    if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 15;
    infoPanel.style.left = x + 'px';
    infoPanel.style.top = y + 'px';
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && infoPanel) {
        if (!e.target.closest('.form-step') && !e.target.closest('#info-panel')) {
            infoPanel.classList.remove('active');
            document.body.classList.remove('panel-active');
            if (infoContent) infoContent.innerHTML = defaultPanelHTML;
        }
    }
});

// ---- Smart Analysis ----
window.smartAnalysisWarnings = [];

function validateConfigurations() {
    const fw = document.getElementById('firmware') ? document.getElementById('firmware').value : 'uefi';
    const bootloader = document.getElementById('bootloader');
    const part = document.getElementById('partitioning');
    const gpuBrand = document.getElementById('gpu_brand') ? document.getElementById('gpu_brand').value : 'amd';
    const softwareType = document.getElementById('software_type') ? document.getElementById('software_type').value : 'libre';
    const desktop = document.getElementById('desktop') ? document.getElementById('desktop').value : 'none';
    const displayServer = document.getElementById('display_server') ? document.getElementById('display_server').value : 'auto';
    const secToolsVal = document.getElementById('securitytools') ? document.getElementById('securitytools').value : 'none';
    const fakeEvilMaidVal = document.getElementById('fake-evil-maid') ? document.getElementById('fake-evil-maid').value : 'no';
    const useCustomScripts = document.getElementById('use-custom-scripts') ? document.getElementById('use-custom-scripts').value === 'yes' : false;

    if (!bootloader || !part) return;

    if (fw === 'bios') {
        Array.from(bootloader.options).forEach(opt => {
            const isIncompat = opt.value.includes('uki') || opt.value === 'systemd-boot';
            opt.disabled = isIncompat;
            opt.text = opt.text.replace(' (Disabled)', '') + (isIncompat ? ' (Disabled)' : '');
        });
        if (bootloader.value !== 'grub') bootloader.value = 'grub';
        Array.from(part.options).forEach(opt => {
            opt.disabled = opt.value === 'luks2';
            opt.text = opt.text.replace(' (Disabled)', '') + (opt.value === 'luks2' ? ' (Disabled)' : '');
        });
        if (part.value === 'luks2') part.value = 'luks1';
    } else {
        Array.from(bootloader.options).forEach(opt => { opt.disabled = false; opt.text = opt.text.replace(' (Disabled)', ''); });
        Array.from(part.options).forEach(opt => { opt.disabled = false; opt.text = opt.text.replace(' (Disabled)', ''); });
    }

    const warnings = [], successes = [];

    if (part.value === 'unencrypted' && bootloader.value !== 'uki-custom') {
        warnings.push("⚠️ <strong>Smart Analysis:</strong> No encryption + no secure boot ownership. Anyone with physical access can tamper with your system.");
    }
    if (gpuBrand === 'nvidia' && softwareType === 'libre') {
        warnings.push("⚠️ <strong>Compatibility:</strong> Nvidia GPU + Fully Libre = Nouveau driver only. Proprietary Nvidia drivers are not libre. Expect limited performance & features.");
    }
    if (displayServer === 'wayland' && (desktop === 'dusky' || desktop === 'dwm')) {
        warnings.push(`⚠️ <strong>Display Server Conflict:</strong> ${desktop === 'dusky' ? 'Dusky OS' : 'DWM'} is X11/Xorg based. Wayland will break your desktop environment.`);
    }
    if (part.value === 'luks2' && bootloader.value === 'uki-custom' && fw === 'uefi' && useCustomScripts && secToolsVal === 'both' && fakeEvilMaidVal === 'yes') {
        successes.push("🛡️ <strong>Outstanding Config!</strong> Full LUKS2 encryption + UKI Secure Boot + 2FA + decoy environments. This is the most secure setup possible.");
    }

    window.smartAnalysisWarnings = warnings;

    const globalWarningsDiv = document.getElementById('global-warnings');
    if (globalWarningsDiv) {
        let html = warnings.map(w => `<div class="alert warning" style="margin-bottom:0.5rem;text-align:left;">${w}</div>`).join('');
        html += successes.map(s => `<div class="alert info" style="margin-bottom:0.5rem;text-align:left;background:rgba(158,206,106,0.1);border-color:var(--accent-green);">${s}</div>`).join('');
        globalWarningsDiv.innerHTML = html;
        globalWarningsDiv.style.display = html ? 'block' : 'none';
    }

    if (typeof window.generateOutput === 'function') window.generateOutput(true);
}

validateConfigurations();
renderHistoryPanel();

// ---- Restore Config from upload.html ----
const restoreConfig = sessionStorage.getItem('arch_restore_config');
if (restoreConfig) {
    try {
        const configData = JSON.parse(restoreConfig);
        const keyMap = { initSys: 'init_system', kernelMain: 'kernel-main', kernelBackup: 'kernel-backup', secTools: 'securitytools', fakeEvilMaid: 'fake-evil-maid', format: 'outputformat', part: 'partitioning', disk: 'target-disk', fw: 'firmware', fs: 'filesystem', boot: 'bootloader', philosophy: 'software_type' };
        Object.keys(configData).forEach(key => {
            if (key === 'post_apps' && Array.isArray(configData[key])) {
                document.querySelectorAll('input[name="post_apps"]').forEach(cb => { cb.checked = configData[key].includes(cb.value); });
                return;
            }
            const elId = keyMap[key] || key;
            const el = document.getElementById(elId);
            if (el) el.value = configData[key];
        });
        sessionStorage.removeItem('arch_restore_config');
        const errorDiv = document.getElementById("config-errors") || (() => { const d = document.createElement("div"); d.id = "config-errors"; document.getElementById("install-form").prepend(d); return d; })();
        errorDiv.innerHTML = `<div class="alert info" style="margin-bottom:1rem;"><strong>✅ Configuration Restored!</strong> Your settings have been loaded. Review and regenerate.</div>`;
    } catch(e) { console.error("Error restoring config:", e); }
}

// ---- Banner click ----
const banner = document.querySelector('.banner');
if (banner) {
    banner.style.cursor = 'pointer';
    banner.addEventListener('click', () => window.open('https://github.com/tilas01/arch-guides-dynamic', '_blank'));
}
