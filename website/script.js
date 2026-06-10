// =============================================
// Arch Guides Dynamic - Main Script
// Arch Rusty Security Suite by tilas01
// =============================================

// ---- Generation History (sessionStorage, clears on reload) ----
const HISTORY_KEY = 'arch_gen_history';

function saveToHistory(mdContent, shContent, format) {
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    history.unshift({ timestamp: new Date().toLocaleString(), format, md: mdContent || '', sh: shContent || '' });
    if (history.length > 10) history = history.slice(0, 10);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    updateHistoryTooltip();
}

function renderHistoryPanel() {
    const panel = document.getElementById('history-panel');
    if (!panel) return;
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    if (history.length === 0) {
        panel.innerHTML = '<em style="color:var(--fg-color)">No generations yet this session.</em>';
        return;
    }
    panel.innerHTML = history.map((entry, i) => `
        <div style="border-bottom:1px solid var(--bg-lighter);padding:0.4rem 0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.82rem;color:var(--accent-cyan)">${entry.timestamp} (${entry.format})</span>
            <button class="btn" style="width:auto;padding:0.25rem 0.6rem;font-size:0.78rem;" onclick="restoreFromHistory(${i})">Restore</button>
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
    if (mdEl && entry.md) mdEl.innerText = entry.md;
    if (shEl && entry.sh) shEl.innerText = entry.sh;
    updatePreview();
    if (window.Prism) Prism.highlightAll();
};

window.toggleHistoryModal = function() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;
    const vis = modal.style.display === 'block';
    modal.style.display = vis ? 'none' : 'block';
    if (!vis) renderHistoryPanel();
};


// â”€â”€â”€ Page switching: Generator â†” Output â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showOutputPage(mdContent, shContent, format) {
    const genArea   = document.querySelector('.layout-container');
    const outputSec = document.getElementById('output-section');
    if (!outputSec) return;

    // Hide generator, show output
    if (genArea) genArea.style.display = 'none';
    outputSec.style.display = 'block';

    // Build dynamic download buttons
    const dlContainer = document.getElementById('download-btns');
    if (dlContainer) {
        dlContainer.innerHTML = '';
        if (mdContent && format !== 'script') {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Markdown Guide');
            b.setAttribute('data-desc', 'Download the generated installation guide as a .md file.');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-cyan);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = 'â¬‡ Download .md';
            b.onclick = () => downloadFile(mdContent, 'arch-install-guide.md');
            dlContainer.appendChild(b);
        }
        if (shContent && format !== 'markdown') {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Shell Script');
            b.setAttribute('data-desc', 'Download the generated Bash install script as a .sh file. REVIEW before executing!');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-blue);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = 'â¬‡ Download .sh';
            b.onclick = () => downloadFile(shContent, 'arch-install.sh');
            dlContainer.appendChild(b);
        }
        if (window.refreshTooltips) window.refreshTooltips();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.returnToGenerator = function() {
    const genArea   = document.querySelector('.layout-container');
    const outputSec = document.getElementById('output-section');
    if (genArea)   genArea.style.display = '';
    if (outputSec) outputSec.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.clearGeneratedOutput = function() {
    const guide     = document.getElementById('generated-guide');
    const dlBtns    = document.getElementById('download-btns');
    if (guide)  guide.innerHTML = '';
    if (dlBtns) dlBtns.innerHTML = '';
    window.returnToGenerator();
};



// ---- Update History Button Tooltip Count ----
function updateHistoryTooltip() {
    const btn = document.getElementById('history-btn');
    if (!btn) return;
    let count = 0;
    try { count = (JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []).length; } catch(e) {}
    btn.setAttribute('data-desc', count > 0
        ? `View and restore previous generation configs. ${count} previous generation${count !== 1 ? 's' : ''} saved this session.`
        : 'No previous generations this session. Generate a guide to start saving history.'
    );
}

// ---- Utility: Escape HTML ----
const escapeHTML = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- Utility: Strip config comment ----
const stripConfig = (s) => s.replace(/<!--[\s\S]*?-->/g, '').trim();

// ---- Download helper ----
window.downloadFile = function(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ---- Live Preview Updater ----
window.updatePreview = function() {
    const mdEl = document.getElementById('raw-md-code');
    const previewEl = document.getElementById('preview');
    if (!mdEl || !previewEl) return;
    const clean = stripConfig(mdEl.innerText || "");
    if (typeof marked !== 'undefined') {
        previewEl.innerHTML = marked.parse(clean);
        if (window.Prism) Prism.highlightAll();
    }
};

// ====================================================================
// MAIN OUTPUT GENERATOR
// ====================================================================
window.generateOutput = function(auto = false) {
    const gv = (id, def='') => { const e = document.getElementById(id); return e ? e.value : def; };
    const gi = (id, def=1) => { const e = document.getElementById(id); return e ? parseInt(e.value)||def : def; };

    const fw = gv('firmware','uefi');
    const fs = gv('filesystem','btrfs');
    const disk = gv('target-disk','/dev/sda');
    const part = gv('partitioning','luks2');
    const initSys = gv('init_system','systemd');
    const boot = gv('bootloader','uki-custom');
    const kernelMain = gv('kernel-main','linux-hardened');
    const kernelBackup = gv('kernel-backup','linux-zen');
    const software_type = gv('software_type','libre');
    const desktop = gv('desktop','none');
    const displayServer = gv('display_server','auto');
    const swap_size = gv('swap_size','8G');
    const cleanup = gv('cleanup','yes');
    const browser = gv('browser','none');
    const dns = gv('dns','systemd-resolved');
    const format = gv('outputformat','both');
    const user_count = gi('user_count',1);
    const root_ssh = gv('root_ssh','no');
    const otp_sha = gv('otp_sha','sha1');
    const iso_setup = gv('iso_setup','none');
    const cpu_brand = gv('cpu_brand','amd');
    const gpu_brand = gv('gpu_brand','amd');
    const vm_guest = gv('vm_guest','none');
    const auto_updates = gv('auto_updates','no');

    const useCustomScripts = gv('use-custom-scripts','no') === 'yes';
    const secTools = useCustomScripts ? gv('securitytools','none') : 'none';
    const libreOtpMode = gv('libre_otp_mode','login');
    const anon_kloak = useCustomScripts ? gv('anon_kloak','no') : 'no';
    const anon_webhook = useCustomScripts ? gv('anon_webhook','no') : 'no';
    const anon_ssh = useCustomScripts ? gv('anon_ssh','no') : 'no';
    const fakeEvilMaid = useCustomScripts ? gv('fake-evil-maid','no') : 'no';

    // Post-install apps (checkboxes)
    const post_apps = [];
    document.querySelectorAll('input[name="post_apps"]:checked').forEach(cb => post_apps.push(cb.value));

    // â”€â”€ Validation â”€â”€
    const errors = [];
    if (fw === "bios" && boot !== "grub") errors.push("Legacy BIOS requires GRUB. UKI/systemd-boot are UEFI only.");
    if (fw === "bios" && part.includes("luks2")) errors.push("GRUB has limited LUKS2 support on BIOS. Use LUKS1.");

    let errorDiv = document.getElementById("config-errors");
    if (!errorDiv) { errorDiv = document.createElement("div"); errorDiv.id = "config-errors"; document.getElementById("install-form").prepend(errorDiv); }
    if (errors.length > 0) {
        errorDiv.innerHTML = `<div class="alert warning"><strong>âš  Invalid Configuration:</strong><ul>${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
        window.scrollTo(0, 0);
        return;
    }
    errorDiv.innerHTML = "";

    // Partition paths
    let partEfi = disk + (disk.includes("nvme") ? "p1" : "1");
    let partRoot = disk + (disk.includes("nvme") ? "p2" : "2");

    // Build output
    function buildOutput(cmdOnly) {
        let o = "";
        // Hidden config (only in raw source, stripped from preview)
        const configObj = { fw,fs,disk,part,initSys,boot,kernelMain,kernelBackup,software_type,cpu_brand,gpu_brand,desktop,displayServer,swap_size,post_apps,auto_updates,cleanup,browser,dns,secTools,libreOtpMode,anon_kloak,anon_webhook,anon_ssh,fakeEvilMaid,format,user_count,root_ssh,otp_sha,iso_setup };
        o += '<!-- CONFIG_START\n' + JSON.stringify(configObj) + '\nCONFIG_END -->\n\n';

        if (!cmdOnly) {
            o += `# Your Custom Arch Linux Installation Guide\n\n`;
            o += `> *Generated for your specific hardware. Review every command before running.*\n\n`;
            o += `## 1. Partitioning & Formatting (${part} + ${fs})\n\`\`\`bash\n`;
        } else {
            o += `#!/bin/bash\n# Arch Rusty Security Suite by tilas01 â€” Generated Script\n# WARNING: Review ALL commands!\nset -e\n\n# 1. Partitioning\n`;
        }

        // Partitioning
        if (fw === "uefi") {
            o += `sgdisk -Z ${disk}\nsgdisk -n 1:0:+512M -t 1:ef00 ${disk}\nsgdisk -n 2:0:0 -t 2:8300 ${disk}\nmkfs.fat -F32 ${partEfi}\n`;
        } else {
            o += `sgdisk -Z ${disk}\nsgdisk -n 1:0:+2M -t 1:ef02 ${disk}\nsgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
        }

        let targetMount = partRoot;
        if (part === "luks1") {
            o += `cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 ${partRoot}\ncryptsetup open ${partRoot} cryptroot\n`;
            targetMount = "/dev/mapper/cryptroot";
        } else if (part === "luks2") {
            o += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 ${partRoot}\ncryptsetup open ${partRoot} cryptroot\n`;
            targetMount = "/dev/mapper/cryptroot";
        } else if (part.includes("lvm")) {
            o += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 ${partRoot}\ncryptsetup open ${partRoot} cryptlvm\npvcreate /dev/mapper/cryptlvm\nvgcreate vg0 /dev/mapper/cryptlvm\nlvcreate -l 100%FREE vg0 -n root\n`;
            targetMount = "/dev/vg0/root";
        }

        if (fs === "btrfs") {
            o += `mkfs.btrfs -f ${targetMount}\nmount ${targetMount} /mnt\nbtrfs subvolume create /mnt/@\nbtrfs subvolume create /mnt/@home\nbtrfs subvolume create /mnt/@var\nbtrfs subvolume create /mnt/@snapshots\numount /mnt\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@ ${targetMount} /mnt\nmkdir -p /mnt/{home,var,.snapshots}\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@home ${targetMount} /mnt/home\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@var ${targetMount} /mnt/var\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@snapshots ${targetMount} /mnt/.snapshots\n`;
        } else if (fs === "xfs") {
            o += `mkfs.xfs -f ${targetMount}\nmount ${targetMount} /mnt\n`;
        } else {
            o += `mkfs.ext4 ${targetMount}\nmount ${targetMount} /mnt\n`;
        }

        if (fw === "uefi") o += `mkdir -p /mnt/efi\nmount ${partEfi} /mnt/efi\n`;

        if (swap_size !== "0") {
            if (fs === "btrfs") o += `btrfs filesystem mkswapfile --size ${swap_size} /mnt/swapfile\n`;
            else o += `fallocate -l ${swap_size} /mnt/swapfile\nchmod 600 /mnt/swapfile\nmkswap /mnt/swapfile\n`;
            o += `swapon /mnt/swapfile\n`;
        }

        if (!cmdOnly) o += `\`\`\`\n\n## 2. Base Installation\n\`\`\`bash\n`;
        else o += `\n# 2. Base Installation\n`;

        let cpuPkg = cpu_brand === "amd" ? "amd-ucode" : (cpu_brand === "intel" ? "intel-ucode" : "");
        let gpuPkg = "";
        if (gpu_brand === "amd") gpuPkg = "mesa xf86-video-amdgpu vulkan-radeon";
        else if (gpu_brand === "intel") gpuPkg = "mesa xf86-video-intel vulkan-intel";
        else if (gpu_brand === "nvidia") gpuPkg = (software_type === "libre" || software_type === "opensource") ? "mesa xf86-video-nouveau" : "nvidia nvidia-utils";
        else if (gpu_brand === "vm") gpuPkg = "spice-vdagent xf86-video-qxl";

        let vmPkg = vm_guest === "vbox" ? "virtualbox-guest-utils" : (vm_guest === "vmware" ? "open-vm-tools" : (vm_guest === "qemu" ? "qemu-guest-agent" : ""));
        let adminTools = software_type === "libre" ? "opendoas pfetch cronie" : "sudo fastfetch cronie";
        let fsPkg = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");
        let allKernels = kernelMain + " " + kernelMain + "-headers";
        if (kernelBackup !== "none") allKernels += " " + kernelBackup + " " + kernelBackup + "-headers";

        o += `pacstrap -K /mnt base ${allKernels} ${cpuPkg} ${gpuPkg} ${vmPkg} linux-firmware neovim ${adminTools} git ${fsPkg}\n`;
        o += `genfstab -U /mnt >> /mnt/etc/fstab\n`;

        if (cmdOnly) {
            o += `\ncat << 'EOF' > /mnt/chroot_script.sh\n#!/bin/bash\npasswd root\n`;
            for (let u = 1; u <= user_count; u++) o += `read -p "Username ${u}: " u${u}\nuseradd -m -G wheel -s /bin/bash "$u${u}"\npasswd "$u${u}"\n`;
        } else {
            o += `arch-chroot /mnt\n`;
        }

        if (software_type === "libre") o += `echo "permit persist :wheel" > /etc/doas.conf\nln -s /usr/bin/doas /usr/bin/sudo\n`;
        else o += `echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel\n`;

        if (!cmdOnly) o += `\`\`\`\n\n## 3. Initramfs\n\`\`\`bash\n`;
        else o += `\n# 3. Initramfs\n`;

        let baseHooks = initSys === "systemd" ? "base systemd autodetect microcode modconf kms keyboard sd-vconsole block" : "base udev autodetect microcode modconf kms keyboard keymap consolefont block";
        let cryptoHook = part !== "unencrypted" ? (initSys === "systemd" ? "sd-encrypt" : "encrypt") : "";
        let lvmHook = part.includes("lvm") ? "lvm2" : "";
        let fsHook = fs === "btrfs" ? "btrfs filesystems fsck" : "filesystems fsck";
        let hooks = [baseHooks, cryptoHook, lvmHook, fsHook].filter(h => h).join(" ");
        o += `sed -i 's/^HOOKS=.*/HOOKS=(${hooks})/' /etc/mkinitcpio.conf\nmkinitcpio -P\n`;

        if (!cmdOnly) o += `\`\`\`\n\n## 4. Bootloader (${boot})\n\`\`\`bash\n`;
        else o += `\n# 4. Bootloader\n`;

        if (fw === "bios" || boot.includes("grub")) {
            o += `pacman -S --noconfirm grub efibootmgr\n`;
            o += fw === "uefi" ? `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n` : `grub-install --target=i386-pc ${disk}\n`;
            o += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
        } else if (boot.includes("uki")) {
            o += `pacman -S --noconfirm sbsigntools efitools efibootmgr\n`;
            if (boot === "uki-shim") o += `pacman -S --noconfirm shim-signed\ncp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/bootx64.efi\n`;
        } else if (boot === "systemd-boot") {
            o += `bootctl install --esp-path=/efi\n`;
        }

        if (!cmdOnly) o += `\`\`\`\n\n## 5. DNS (${dns})\n\`\`\`bash\n`;
        else o += `\n# 5. DNS\n`;

        if (dns === "unbound") o += `pacman -S --noconfirm unbound\nsystemctl enable unbound\n`;
        else if (dns === "dnscrypt-proxy") o += `pacman -S --noconfirm dnscrypt-proxy\nsystemctl enable dnscrypt-proxy\n`;
        else if (dns === "bind") o += `pacman -S --noconfirm bind\nsystemctl enable named\n`;
        else if (dns === "dnsmasq") o += `pacman -S --noconfirm dnsmasq\nsystemctl enable dnsmasq\n`;
        else o += `systemctl enable systemd-resolved\n`;

        if (!cmdOnly) o += `\`\`\`\n\n## 6. Desktop & Apps\n\`\`\`bash\n`;
        else o += `\n# 6. Desktop & Apps\n`;

        // AUR
        const needsAUR = post_apps.length > 0 || desktop === "dusky";
        if (needsAUR) {
            o += `pacman -S --noconfirm git base-devel\nuseradd -m -G wheel -s /bin/bash builder\necho "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder\n`;
            o += `su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"\n`;
        }

        // Apps
        const aurApps = ['librewolf','signal','tor-browser','vscodium','timeshift'];
        const pacApps = {
            firefox:'firefox', neovim:'neovim git ripgrep fd', alacritty:'alacritty',
            zsh:'zsh zsh-completions', thunar:'thunar gvfs thunar-volman', mpv:'mpv',
            obs:'obs-studio', keepassxc:'keepassxc', flatpak:'flatpak',
            chromium:'chromium', kitty:'kitty', git:'git', tmux:'tmux', htop:'htop',
            nautilus:'nautilus', vlc:'vlc', gimp:'gimp', libreoffice:'libreoffice-fresh',
            networkmanager:'networkmanager', bluetooth:'bluez bluez-utils',
            pipewire:'pipewire pipewire-pulse pipewire-alsa wireplumber',
            clamav:'clamav', firejail:'firejail'
        };
        post_apps.forEach(app => {
            if (app === 'paru') return; // already installed
            if (aurApps.includes(app)) o += `su - builder -c "paru -S --noconfirm ${app === 'signal' ? 'signal-desktop' : app}"\n`;
            else if (pacApps[app]) o += `pacman -S --noconfirm ${pacApps[app]}\n`;
        });
        if (post_apps.includes('flatpak')) o += `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo\n`;
        if (post_apps.includes('zsh')) o += `chsh -s /bin/zsh\n`;
        if (post_apps.includes('networkmanager')) o += `systemctl enable --now NetworkManager\n`;
        if (post_apps.includes('bluetooth')) o += `systemctl enable --now bluetooth\n`;
        if (post_apps.includes('pipewire')) o += `systemctl --user enable --now pipewire pipewire-pulse wireplumber\n`;
        if (post_apps.includes('clamav')) o += `freshclam\nsystemctl enable --now clamav-freshclam\n`;

        // Desktop
        const dsXorg = (displayServer === "auto" && (desktop === "dusky" || desktop === "dwm")) || displayServer === "xorg";
        if (desktop === "gnome") { o += `pacman -S --noconfirm gnome gnome-tweaks ${dsXorg ? 'xorg-server' : 'wayland'}\nsystemctl enable gdm\n`; }
        else if (desktop === "kde") { o += `pacman -S --noconfirm plasma-desktop sddm ${dsXorg ? 'xorg-server' : 'wayland'}\nsystemctl enable sddm\n`; }
        else if (desktop === "dwm") { o += `pacman -S --noconfirm xorg-server xorg-xinit base-devel libx11 libxinerama libxft\ngit clone https://git.suckless.org/dwm /usr/local/src/dwm && cd /usr/local/src/dwm && make install\n`; }
        else if (desktop === "dusky") {
            o += dsXorg ? `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\n` : `pacman -S --noconfirm git base-devel wayland xorg-xwayland\n`;
            o += software_type === "libre"
                ? `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && sed -i 's/sudo/doas/g' install.sh && ./install.sh"\n`
                : `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\n`;
        }

        if (browser === "librewolf") o += `su - builder -c "paru -S --noconfirm librewolf"\n`;
        else if (browser === "firefox") o += `pacman -S --noconfirm firefox\n`;

        if (fs === "btrfs") o += `snapper -c root create-config /\nsystemctl enable snapper-timeline.timer snapper-cleanup.timer\n`;
        if (vm_guest === "vbox") o += `systemctl enable vboxservice.service\n`;
        else if (vm_guest === "vmware") o += `systemctl enable vmtoolsd.service\n`;
        else if (vm_guest === "qemu") o += `systemctl enable qemu-guest-agent.service\n`;
        if (needsAUR) o += `userdel -r builder\nrm -f /etc/sudoers.d/builder\n`;

        // Security tools (now Arch Rusty Security Suite)
        if (secTools !== "none") {
            if (!cmdOnly) o += `\`\`\`\n\n## 7. Arch Rusty Security Suite by tilas01\n\`\`\`bash\n`;
            else o += `\n# 7. Arch Rusty Security Suite\n`;
            o += `# Download the latest release from GitHub\n`;
            o += `SUITE_VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)\n`;
            o += `curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64"\n`;
            o += `curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64.sha256"\n`;
            o += `echo "Verifying integrity..."\nsha256sum -c arch-rusty-security-suite-linux-x86_64.sha256\n`;
            o += `chmod +x arch-rusty-security-suite-linux-x86_64\n`;
            o += `cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite\n`;

            if (secTools === "libre-otp" || secTools === "both") {
                o += `arch-rusty-security-suite otp --setup --algo ${otp_sha}\n`;
                if (libreOtpMode === "login" || libreOtpMode === "both") {
                    o += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/login\n`;
                }
                if (libreOtpMode === "boot" || libreOtpMode === "both") {
                    o += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/system-auth\n`;
                }
            }
            if (secTools === "anti-ducky" || secTools === "both") {
                o += `arch-rusty-security-suite input-guard --init\n`;
                o += `cat << 'SRV' > /etc/systemd/system/input-guard.service\n[Unit]\nDescription=Arch Rusty Security Suite - Input Guard\nAfter=sshd.service\nRequires=sshd.service\n[Service]\nExecStart=/usr/local/bin/arch-rusty-security-suite input-guard\nRestart=always\nUser=root\n[Install]\nWantedBy=multi-user.target\nSRV\nsystemctl enable input-guard.service\n`;
            }
        }

        // Anonymisation
        if (anon_kloak === "yes" || anon_ssh === "yes" || fakeEvilMaid === "yes") {
            if (!cmdOnly) o += `\`\`\`\n\n## 8. Anonymisation & Hardening\n\`\`\`bash\n`;
            else o += `\n# 8. Anonymisation\n`;
            if (anon_kloak === "yes") {
                o += `git clone https://github.com/vmonaco/kloak.git /opt/kloak && cd /opt/kloak && make && cp kloak /usr/local/bin/\n`;
                o += `cat << 'SRV' > /etc/systemd/system/kloak.service\n[Unit]\nDescription=Kloak Keystroke Anonymizer\n[Service]\nExecStart=/usr/local/bin/kloak\nRestart=always\n[Install]\nWantedBy=multi-user.target\nSRV\nsystemctl enable kloak.service\n`;
            }
            if (anon_ssh === "yes") {
                o += `pacman -S --noconfirm openssh\nsed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config\n`;
                if (root_ssh === "no") o += `sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config\n`;
                if (secTools === "libre-otp" || secTools === "both") o += `echo 'auth required pam_exec.so expose_authtok /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sshd\n`;
                o += `systemctl enable sshd.service\n`;
            }
            if (fakeEvilMaid === "yes") {
                o += `mkdir -p /boot/fake_efi\ncp /boot/vmlinuz-linux-lts /boot/fake_efi/vmlinuz-linux 2>/dev/null || true\n`;
            }
        }

        // Verify USB ISO integrity using the suite
        if (secTools !== "none") {
            if (!cmdOnly) o += `\`\`\`\n\n## 9. Verify Arch ISO USB Integrity\n\`\`\`bash\n`;
            else o += `\n# 9. ISO Verification\n`;
            o += `# Verify the Arch ISO on USB that was used for this install\n`;
            o += `arch-rusty-security-suite verify-iso /dev/sr0  # or USB path\n`;
        }

        if (auto_updates === "yes") {
            if (!cmdOnly) o += `\`\`\`\n\n## 10. Auto Updates\n\`\`\`bash\n`;
            else o += `\n# 10. Auto Updates\n`;
            o += `systemctl enable cronie\ncat << 'CRON_SCRIPT' > /usr/local/bin/auto-update.sh\n#!/bin/bash\npacman -Syu --noconfirm >> /var/log/auto-update.log 2>&1\nCRON_SCRIPT\nchmod +x /usr/local/bin/auto-update.sh\n(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auto-update.sh") | crontab -\n`;
        }

        if (cmdOnly) {
            o += `EOF\nchmod +x /mnt/chroot_script.sh\narch-chroot /mnt /chroot_script.sh\n`;
            if (cleanup === "yes") o += `arch-chroot /mnt pacman -Scc --noconfirm\nrm -rf /mnt/var/cache/pacman/pkg/* /mnt/tmp/*\n`;
            o += `rm /mnt/chroot_script.sh\necho "Install complete! Run: reboot"\n`;
        } else {
            o += `\`\`\`\n\n---\n*Guide complete. Reboot into your ${desktop !== "none" ? desktop : "TTY"} environment.*\n*Generated by [Arch Guides Dynamic](https://tilas01.github.io/arch-guides-dynamic/) â€” by [tilas01](https://github.com/tilas01)*\n`;
        }

        return o;
    }

    // â”€â”€ Render â”€â”€
    // For auto-mode (re-generate on form change): keep output section in whatever state it's in
    // For manual generate: showOutputPage() is called after this function builds the HTML
    const outputSection = document.getElementById('output-section');
    if (auto && outputSection && outputSection.style.display !== 'none') {
        // Stay visible if already showing
    }

    let mdOutput = "", scriptOutput = "";
    if (format === "script" || format === "both") scriptOutput = buildOutput(true);
    if (format === "markdown" || format === "both") mdOutput = buildOutput(false);

    // ISO pre-setup
    let isoHTML = "";
    if (iso_setup === "ssh") isoHTML = `<div class="alert warning"><strong>ðŸ“¡ Run on Arch ISO first:</strong><pre><code>systemctl start sshd\necho 'root:arch' | chpasswd\nip addr</code></pre></div>`;
    else if (iso_setup === "ssh_curl") isoHTML = `<div class="alert warning"><strong>ðŸ“¡ Run on Arch ISO first:</strong><pre><code>pacman -Sy --noconfirm curl\nsystemctl start sshd\necho 'root:arch' | chpasswd\nip addr</code></pre></div>`;

    let html = isoHTML;

    // â”€â”€ BOX 1: Markdown Editor â”€â”€
    if (format === "markdown" || format === "both") {
        html += `
        <div class="output-actions">
            <h3 class="output-title md-edit">ðŸ“ Markdown Guide â€” Live Editor</h3>
            <div style="display:flex;gap:0.4rem;">
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-md-code').innerText).then(()=>this.textContent='Copied!'); setTimeout(()=>this.textContent='Copy .md',2000)">Copy .md</button>
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-md-code').innerText, 'arch-install.md')">ðŸ’¾ .md</button>
            </div>
        </div>
        <pre class="output-box editor-md"><code id="raw-md-code" class="language-markdown" contenteditable="true" oninput="updatePreview()">${escapeHTML(mdOutput)}</code></pre>

        <div class="output-actions">
            <h3 class="output-title md-prev">ðŸ‘ Markdown â€” Live Preview</h3>
            <span style="font-size:0.75rem;color:var(--accent-purple);">Renders as you type above</span>
        </div>
        <div id="preview" class="output-box preview-md markdown-body"></div>
        `;
    }

    // â”€â”€ BOX 3: Script Editor â”€â”€
    if (format === "script" || format === "both") {
        html += `
        <div class="output-actions" style="margin-top:1rem;">
            <h3 class="output-title sh-edit">âš¡ Bash Script â€” Live Editor</h3>
            <div style="display:flex;gap:0.4rem;">
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-script-code').innerText).then(()=>this.textContent='Copied!'); setTimeout(()=>this.textContent='Copy .sh',2000)">Copy .sh</button>
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-script-code').innerText, 'arch-install.sh')">ðŸ’¾ .sh</button>
            </div>
        </div>
        <pre class="output-box editor-sh"><code id="raw-script-code" class="language-bash" contenteditable="true">${escapeHTML(scriptOutput)}</code></pre>

        <div class="output-actions" style="margin-top:0.8rem;">
            <h3 class="output-title ssh-cmd">ðŸ–¥ SSH One-Liner Deploy</h3>
        </div>
        <pre class="output-box oneliner"><code class="language-bash">${escapeHTML(`cat << 'ARCHEOF' > install.sh\n${scriptOutput}\nARCHEOF\nbash install.sh`)}</code></pre>
        `;
    }

    // â”€â”€ History + state â”€â”€
    document.getElementById('generated-guide').innerHTML = html;
    if (window.Prism) Prism.highlightAll();
    updatePreview();

    if (!auto) {
        saveToHistory(mdOutput, scriptOutput, format);
        // Switch to output page view
        showOutputPage(mdOutput, scriptOutput, format);
    }
};

// ====================================================================
// UI EVENT HANDLERS
// ====================================================================
document.getElementById('generate-btn').addEventListener('click', function(e) {
    e.preventDefault();
    window.generateOutput(false);
});

// ── Tooltip toggle (emoji button, always-enabled) ──
let tooltipsEnabled = sessionStorage.getItem('tooltips_enabled') !== 'false';
const tooltipToggleBtn = document.getElementById('toggle-tooltips-btn');

function syncTooltipBtn() {
    if (!tooltipToggleBtn) return;
    const on = window.tooltipsEnabled !== false;
    tooltipToggleBtn.classList.toggle('disabled', !on);
    tooltipToggleBtn.setAttribute('data-title', on ? 'ℹ️ Tooltips: ON' : 'ℹ️ Tooltips: OFF');
    tooltipToggleBtn.setAttribute('data-desc', on
        ? 'Tooltips are ON. Hover (desktop) or tap (mobile) any element for info. Click to disable.'
        : 'Tooltips are OFF. Only ℹ️ and 🕓 always show. Click to re-enable.');
}

if (tooltipToggleBtn) {
    syncTooltipBtn();
    tooltipToggleBtn.addEventListener('click', () => {
        const nowOn = !window.tooltipsEnabled;
        if (window.setTooltipsEnabled) window.setTooltipsEnabled(nowOn);
        else { window.tooltipsEnabled = nowOn; sessionStorage.setItem('tooltips_enabled', nowOn); }
        syncTooltipBtn();
    });
}

// wiki map kept for parity (used by unified tooltip.js)
const wikiMap = {
    'Firmware Selection':           '?page=architecture.md',
    'File System Features':         '?page=02-partitioning/',
    'Target Installation Disk':     '?page=01-pre-installation.md',
    'Encryption Options':           '?page=02-partitioning/',
    'Init System':                  '?page=architecture.md',
    'Bootloader Choice':            '?page=04-bootloaders/',
    'Main Kernel':                  '?page=03-base-installation.md',
    'Backup Kernel':                '?page=03-base-installation.md',
    'CPU Architecture':             '?page=03-base-installation.md',
    'GPU Hardware':                 '?page=03-base-installation.md',
    'Virtual Machine Guest Setup':  '?page=03-base-installation.md',
    'Software Type & Graphics Drivers': '?page=10-generator-selections-and-dusky.md',
    'Swap File Size':               '?page=02-partitioning/',
    'Post-Install Apps & Scripts':  '?page=10-generator-selections-and-dusky.md',
    'Automatic System Updates':     '?page=07-post-installation.md',
    'Multi-User Setup':             '?page=10-generator-selections-and-dusky.md',
    'System Cleanup':               '?page=07-post-installation.md',
    'Tilas01 Custom Scripts':       '?page=architecture.md',
    'Advanced Security Tools':      '?page=architecture.md',
    'Display Server':               '?page=xorg-vs-wayland.md',
};
// Note: updateInfoPanel sidebar removed — unified tooltip.js handles all tooltips

// Back to generator button
const backToGenBtn = document.getElementById('back-to-gen-btn');
if (backToGenBtn) backToGenBtn.addEventListener('click', window.returnToGenerator);

// Clear output button (far right of output bar)
const clearOutputBtn = document.getElementById('clear-output-btn');
if (clearOutputBtn) clearOutputBtn.addEventListener('click', window.clearGeneratedOutput);


// â”€â”€ Custom scripts toggle â”€â”€
const customScriptsSelect = document.getElementById('use-custom-scripts');
const customScriptsContainer = document.getElementById('custom-scripts-container');
if (customScriptsSelect && customScriptsContainer) {
    customScriptsSelect.addEventListener('change', () => {
        customScriptsContainer.style.display = customScriptsSelect.value === 'yes' ? 'block' : 'none';
    });
}
const securityToolsSelect = document.getElementById('securitytools');
const libreOtpModeContainer = document.getElementById('libre-otp-mode-container');
if (securityToolsSelect && libreOtpModeContainer) {
    securityToolsSelect.addEventListener('change', () => {
        libreOtpModeContainer.style.display = (securityToolsSelect.value === 'libre-otp' || securityToolsSelect.value === 'both') ? 'block' : 'none';
    });
}

// â”€â”€ Smart Analysis â”€â”€
window.smartAnalysisWarnings = [];
function validateConfigurations() {
    const fw = document.getElementById('firmware')?.value || 'uefi';
    const bootloader = document.getElementById('bootloader');
    const part = document.getElementById('partitioning');
    if (!bootloader || !part) return;

    if (fw === 'bios') {
        Array.from(bootloader.options).forEach(opt => {
            const bad = opt.value.includes('uki') || opt.value === 'systemd-boot';
            opt.disabled = bad;
        });
        if (bootloader.value !== 'grub') bootloader.value = 'grub';
        Array.from(part.options).forEach(opt => { opt.disabled = opt.value === 'luks2'; });
        if (part.value === 'luks2') part.value = 'luks1';
    } else {
        Array.from(bootloader.options).forEach(opt => opt.disabled = false);
        Array.from(part.options).forEach(opt => opt.disabled = false);
    }

    const warnings = [];
    const gpuBrand = document.getElementById('gpu_brand')?.value || 'amd';
    const softwareType = document.getElementById('software_type')?.value || 'libre';
    const desktop = document.getElementById('desktop')?.value || 'none';
    const displayServer = document.getElementById('display_server')?.value || 'auto';

    if (part.value === 'unencrypted') warnings.push("âš ï¸ No encryption â€” physical access = full compromise.");
    if (gpuBrand === 'nvidia' && softwareType === 'libre') warnings.push("âš ï¸ Nvidia + Libre = Nouveau only. Limited performance.");
    if (displayServer === 'wayland' && (desktop === 'dusky' || desktop === 'dwm')) warnings.push(`âš ï¸ ${desktop} requires X11/Xorg. Wayland will break it.`);

    window.smartAnalysisWarnings = warnings;
    const div = document.getElementById('global-warnings');
    if (div) {
        div.innerHTML = warnings.map(w => `<div class="alert warning" style="margin-bottom:0.4rem;">${w}</div>`).join('');
        div.style.display = warnings.length ? 'block' : 'none';
    }

    if (typeof window.generateOutput === 'function') window.generateOutput(true);
}

validateConfigurations();

// â”€â”€ Config restore â”€â”€
const restoreConfig = sessionStorage.getItem('arch_restore_config');
if (restoreConfig) {
    try {
        const c = JSON.parse(restoreConfig);
        const map = { initSys:'init_system', kernelMain:'kernel-main', kernelBackup:'kernel-backup', secTools:'securitytools', fakeEvilMaid:'fake-evil-maid', format:'outputformat', part:'partitioning', disk:'target-disk', fw:'firmware', fs:'filesystem', boot:'bootloader' };
        Object.keys(c).forEach(k => {
            if (k === 'post_apps' && Array.isArray(c[k])) {
                document.querySelectorAll('input[name="post_apps"]').forEach(cb => cb.checked = c[k].includes(cb.value));
                return;
            }
            const el = document.getElementById(map[k] || k);
            if (el) el.value = c[k];
        });
        sessionStorage.removeItem('arch_restore_config');
    } catch(e) { console.error(e); }
}

// Banner cursor (link already in HTML <a> tag)
const banner = document.querySelector('.banner');
if (banner) banner.style.cursor = 'pointer';

// Update history tooltip on load
updateHistoryTooltip();

// â”€â”€â”€ Live Editor / Upload Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function initLiveEditor() {
    const fileInput      = document.getElementById('upload-file-input');
    const clearBtn       = document.getElementById('upload-clear-btn');
    const statusEl       = document.getElementById('upload-status');
    const editorWrapper  = document.getElementById('upload-editor-wrapper');
    const filenameEl     = document.getElementById('upload-filename');
    const editor         = document.getElementById('upload-editor');
    const restoreBtn     = document.getElementById('upload-restore-btn');
    const downloadBtn    = document.getElementById('upload-download-btn');
    const restoreBtnAlt  = document.getElementById('upload-restore-btn-alt');
    const restoreWrap    = document.getElementById('upload-restore-btn-wrapper');

    if (!fileInput) return;

    let currentFilename = '';
    let parsedConfig    = null;
    let isValid         = false;

    const VALID_EXTS    = ['.sh', '.md', '.bash', '.txt'];

    function setStatus(msg, color) {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color = color || 'var(--accent-cyan)';
    }

    function tryParseConfig(text) {
        // Look for embedded config comment block
        const m1 = text.match(/<!--\s*CONFIG_START\s*([\s\S]*?)\s*CONFIG_END\s*-->/);
        if (m1) { try { return JSON.parse(m1[1]); } catch(e) {} }
        // Shell script config block
        const m2 = text.match(/###\s*CONFIG_START\s*([\s\S]*?)\s*###\s*CONFIG_END/);
        if (m2) { try { return JSON.parse(m2[1]); } catch(e) {} }
        return null;
    }

    function reset() {
        currentFilename = '';
        parsedConfig    = null;
        isValid         = false;
        if (fileInput)     fileInput.value = '';
        if (clearBtn)      clearBtn.style.display = 'none';
        if (editorWrapper) editorWrapper.style.display = 'none';
        if (restoreWrap)   restoreWrap.style.display = 'none';
        if (editor)        editor.value = '';
        setStatus('');
    }

    function loadFile(file) {
        if (!file) return;

        // Check extension
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!VALID_EXTS.includes(ext)) {
            setStatus('âš  Invalid file type. Only .sh, .md, .bash, or .txt files are accepted.', 'var(--accent-red)');
            if (fileInput) fileInput.value = '';
            return;
        }

        currentFilename = file.name;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;

            // Try to parse config
            parsedConfig = tryParseConfig(text);
            isValid = parsedConfig !== null;

            // Populate editor
            if (editor) editor.value = text;
            if (filenameEl) filenameEl.textContent = file.name + (isValid ? '' : ' (no valid config â€” editable only)');

            // Show/hide restore button
            if (restoreBtn)  restoreBtn.style.display  = isValid ? '' : 'none';
            if (restoreWrap) restoreWrap.style.display   = isValid ? '' : 'none';
            if (restoreBtnAlt) restoreBtnAlt.style.display = isValid ? '' : 'none';

            // Show UI
            if (clearBtn)      clearBtn.style.display      = '';
            if (editorWrapper) editorWrapper.style.display  = '';

            if (isValid) {
                setStatus('âœ“ Valid config file â€” settings can be restored to the generator.', 'var(--accent-green)');
            } else {
                setStatus('â„¹ No valid config header found. Showing file as editable text only.', 'var(--accent-orange, #ff9e64)');
            }
        };
        reader.readAsText(file);
    }

    // â”€â”€ Event listeners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (fileInput) fileInput.addEventListener('change', function() {
        loadFile(this.files[0]);
    });

    if (clearBtn) clearBtn.addEventListener('click', reset);

    // Restore config to generator form
    function doRestore() {
        if (!parsedConfig) return;
        const map = { initSys:'init_system', kernelMain:'kernel-main', kernelBackup:'kernel-backup',
                      secTools:'securitytools', fakeEvilMaid:'fake-evil-maid', format:'outputformat',
                      part:'partitioning', disk:'target-disk', fw:'firmware', fs:'filesystem', boot:'bootloader' };
        Object.keys(parsedConfig).forEach(k => {
            if (k === 'post_apps' && Array.isArray(parsedConfig[k])) {
                document.querySelectorAll('input[name="post_apps"]').forEach(cb => {
                    cb.checked = parsedConfig[k].includes(cb.value);
                });
                return;
            }
            const el = document.getElementById(map[k] || k);
            if (el) el.value = parsedConfig[k];
        });
        setStatus('âœ“ Settings restored to generator! Adjust options above then re-generate.', 'var(--accent-green)');
        setTimeout(() => setStatus(isValid ? 'âœ“ Valid config file loaded.' : '', 'var(--accent-cyan)'), 4000);
        validateConfigurations();
        // Scroll to top of generator
        const form = document.getElementById('install-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    }

    if (restoreBtn)    restoreBtn.addEventListener('click', doRestore);
    if (restoreBtnAlt) restoreBtnAlt.addEventListener('click', doRestore);

    // Download edited file
    if (downloadBtn) downloadBtn.addEventListener('click', () => {
        if (!editor || !currentFilename) return;
        downloadFile(editor.value, currentFilename);
    });

    // Live Editor nav link: smooth scroll to section
    const liveEditorNav = document.getElementById('live-editor-nav');
    if (liveEditorNav) {
        liveEditorNav.addEventListener('click', e => {
            e.preventDefault();
            const sec = document.getElementById('live-editor');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        });
    }
})();
