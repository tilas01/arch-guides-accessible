// =============================================
// Arch Guides Dynamic - Main Script
// Arch Rusty Security Suite by tilas01
// =============================================

// ---- Form Initialization & "No Selection" Injection ----
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('select').forEach(select => {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = "No Selection Provided";
        // Insert at the top
        select.insertBefore(defaultOption, select.firstChild);
    });
});

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
function showOutputPage(mdContent, shContent, format, scContent) {
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
            b.textContent = '⬇ Download .md';
            b.onclick = () => downloadFile(mdContent, 'arch-install-guide.md');
            dlContainer.appendChild(b);
        }
        if (shContent && format !== 'markdown') {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Shell Script');
            b.setAttribute('data-desc', 'Download the generated Bash install script as a .sh file. REVIEW before executing!');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-blue);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = '⬇ Download .sh';
            b.onclick = () => downloadFile(shContent, 'arch-install.sh');
            dlContainer.appendChild(b);
        }
        if (scContent) {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Selection Config (.sc)');
            b.setAttribute('data-desc', 'Download your exact form selections as a .sc JSON file so you can restore them later.');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-purple);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = '⬇ Download .sc';
            b.onclick = () => downloadFile(scContent, 'arch-config.sc');
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

    // Checkboxes arrays
    const post_apps = [];
    document.querySelectorAll('input[name="post_apps"]:checked').forEach(cb => post_apps.push(cb.value));

    const arss_tools = [];
    if (useCustomScripts) {
        document.querySelectorAll('input[name="arss_tools"]:checked').forEach(cb => arss_tools.push(cb.value));
    }

    const other_sec_tools = [];
    document.querySelectorAll('input[name="other_sec_tools"]:checked').forEach(cb => other_sec_tools.push(cb.value));

    // ARSS sub-options
    const libreOtpMode = gv('libre_otp_mode','login');
    const otp_recovery = gv('otp_recovery','5');
    const webhook_provider = gv('webhook_provider','ntfy');
    const webhook_url = gv('webhook_url','');
    const aem_main = gv('aem-kernel-main','linux');
    const aem_backup = gv('aem-kernel-backup','none');

    const configJSON = JSON.stringify(getFormValues(), null, 2);

    // â”€â”€ Validation â”€â”€
    const errors = [];
    
    // Clear previous highlights
    document.querySelectorAll('select').forEach(sel => sel.style.border = '');

    // Strict dropdown checking
    const requiredSelects = Array.from(document.querySelectorAll('select')).filter(sel => {
        // Only validate visible selects
        return sel.closest('.form-group') && sel.closest('.form-group').style.display !== 'none';
    });

    let firstErrorEl = null;

    requiredSelects.forEach(sel => {
        if (!sel.value) {
            const stepName = sel.closest('.form-step')?.getAttribute('data-title') || sel.id;
            errors.push(`<a href="#" style="color:var(--accent-red);text-decoration:underline;" onclick="document.getElementById('${sel.id}').scrollIntoView({behavior:'smooth', block:'center'}); document.getElementById('${sel.id}').focus(); return false;">Must complete step: ${stepName}</a>`);
            sel.style.border = '2px solid var(--accent-red)';
            if (!firstErrorEl) firstErrorEl = sel;
        }
    });

    if (fw === "bios" && boot !== "grub") errors.push("Legacy BIOS requires GRUB. UKI/systemd-boot are UEFI only.");
    if (fw === "bios" && part.includes("luks2")) errors.push("GRUB has limited LUKS2 support on BIOS. Use LUKS1.");

    let errorDiv = document.getElementById("config-errors");
    if (!errorDiv) { errorDiv = document.createElement("div"); errorDiv.id = "config-errors"; document.getElementById("install-form").prepend(errorDiv); }
    if (errors.length > 0) {
        errorDiv.innerHTML = `<div class="alert warning" style="border-left-color:var(--accent-red);"><strong>âš  Generation Blocked (Missing Selections):</strong><ul style="margin-top:0.5rem;line-height:1.6;">${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
        if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            window.scrollTo(0, 0);
        }
        return;
    }
    errorDiv.innerHTML = "";

    // Default Profiles Check for Apps & Security
    const hasApps = document.querySelectorAll('input[name="post_apps"]:checked').length > 0;
    const hasSec = document.querySelectorAll('input[name="arss_tools"]:checked').length > 0 || document.querySelectorAll('input[name="other_sec_tools"]:checked').length > 0;
    
    if (!hasApps || !hasSec) {
        if (!confirm("You have not selected any Apps or Security Tools. Default minimal profiles will be automatically applied. Proceed?")) {
            return;
        }
        // Auto-tick minimal defaults if they agreed
        if (!hasApps) {
            const defApps = ['openssh', 'fastfetch'];
            defApps.forEach(val => {
                const cb = document.querySelector(`input[name="post_apps"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (!hasSec) {
            const defSec = ['iso-verifier', 'input-guard'];
            defSec.forEach(val => {
                const cb = document.querySelector(`input[name="arss_tools"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        }
    }

    // Partition paths
    let partEfi = disk + (disk.includes("nvme") ? "p1" : "1");
    let partRoot = disk + (disk.includes("nvme") ? "p2" : "2");

    // â”€â”€ Proprietary Software Analysis â”€â”€
    const propAppsDB = {
        'discord': 'Discord is closed-source and tracks user activity. Use WebCord or matrix-bridges for a libre alternative.',
        'steam': 'Steam is a proprietary storefront and DRM client by Valve.',
        'spotify': 'Spotify is a closed-source streaming client with proprietary DRM.',
        'vmware': 'VMware Tools (open-vm-tools is libre, but VMware hypervisor is proprietary).',
        'vbox': 'VirtualBox Extension Pack contains proprietary code (PUEL license).'
    };
    if (gpu_brand === 'nvidia') propAppsDB['nvidia'] = 'NVIDIA drivers contain heavily proprietary closed-source blobs.';

    const selectedPropApps = post_apps.filter(app => propAppsDB[app]);
    if (gpu_brand === 'nvidia') selectedPropApps.push('nvidia');
    if (browser === 'chrome') {
        propAppsDB['chrome'] = 'Google Chrome is proprietary spyware. Chromium or LibreWolf is libre.';
        selectedPropApps.push('chrome');
    }

    // Strict Libre enforcement
    if (software_type === 'libre' && selectedPropApps.length > 0) {
        const reasons = selectedPropApps.map(a => `\n- ${a.toUpperCase()}: ${propAppsDB[a]}`).join('');
        if (!confirm(`âš  STRICT LIBRE WARNING âš \n\nYou selected "Libre + Open Source 100% Only", but have selected software containing proprietary code:\n${reasons}\n\nDo you want to override your Libre setting and allow these proprietary blobs?`)) {
            return;
        }
    }

    // Build output
    function buildOutput(cmdOnly) {
        let o = "";
        // Hidden config (only in raw source, stripped from preview)
        // Hidden config inside markdown for Live Editor compatibility
        const configObj = getFormValues();
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

        if (useCustomScripts && arss_tools.includes("iso-verifier")) {
            if (!cmdOnly) o += `\`\`\`\n\n## ISO Verification\n> *It is highly recommended to verify the Arch ISO integrity before installing.*\n\`\`\`bash\n`;
            o += `curl -sLO https://geo.mirror.pkgbuild.com/iso/latest/sha256sums.txt\n`;
            o += `echo "Verifying ISO Hash..."\n`;
            o += `sha256sum -c sha256sums.txt --ignore-missing || { echo "ISO HASH VERIFICATION FAILED!"; exit 1; }\n`;
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
            clamav:'clamav', firejail:'firejail',
            openssh:'openssh', snapper:'snapper snap-pac grub-btrfs',
            pfetch:'pfetch', fastfetch:'fastfetch',
        };
        post_apps.forEach(app => {
            if (app === 'paru') return; // already installed
            if (aurApps.includes(app)) o += `su - builder -c "paru -S --noconfirm ${app === 'signal' ? 'signal-desktop' : app}"\n`;
            else if (pacApps[app]) o += `pacman -S --noconfirm ${pacApps[app]}\n`;
        });
        // Post-install service enables & extra setup
        if (post_apps.includes('flatpak')) o += `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo\n`;
        if (post_apps.includes('zsh')) o += `chsh -s /bin/zsh\n`;
        if (post_apps.includes('networkmanager')) o += `systemctl enable --now NetworkManager\n`;
        if (post_apps.includes('bluetooth')) o += `systemctl enable --now bluetooth\n`;
        if (post_apps.includes('pipewire')) o += `systemctl --user enable --now pipewire pipewire-pulse wireplumber\n`;
        if (post_apps.includes('clamav')) o += `freshclam\nsystemctl enable --now clamav-freshclam\n`;

        // Desktop environments
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

        // Browser (from browser dropdown, separate from post_apps)
        if (browser === "librewolf") o += `su - builder -c "paru -S --noconfirm librewolf"\n`;
        else if (browser === "firefox") o += `pacman -S --noconfirm firefox\n`;



        // Hardened OpenSSH setup
        if (post_apps.includes('openssh')) {
            if (!cmdOnly) o += `\`\`\`\n\n### OpenSSH Server Setup (Hardened)\n\`\`\`bash\n`;
            else o += `\n# OpenSSH — Hardened Setup\n`;
            o += `# Generate Ed25519 host keys\n`;
            o += `ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""\n`;
            o += `rm -f /etc/ssh/ssh_host_rsa_key /etc/ssh/ssh_host_dsa_key /etc/ssh/ssh_host_ecdsa_key\n`;
            o += `# Harden sshd_config\n`;
            o += `cat > /etc/ssh/sshd_config << 'SSHD'\n`;
            o += `Port 22\nAddressFamily inet\nListenAddress 0.0.0.0\n`;
            o += `HostKey /etc/ssh/ssh_host_ed25519_key\nKexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org\n`;
            o += `Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com\nMACs hmac-sha2-512-etm@openssh.com\n`;
            o += `PermitRootLogin no\nPasswordAuthentication no\nKbdInteractiveAuthentication no\n`;
            o += `AuthenticationMethods publickey\nPubkeyAuthentication yes\n`;
            o += `X11Forwarding no\nAllowTcpForwarding no\nPermitTunnel no\nGatewayPorts no\n`;
            o += `MaxAuthTries 3\nLoginGraceTime 30\nClientAliveInterval 300\nClientAliveCountMax 2\n`;
            o += `AllowAgentForwarding no\nUsePAM yes\nPrintMotd no\n`;
            o += `SSHD\n`;
            o += `# Generate user SSH key pair (Ed25519)\n`;
            o += `USER_SSH_DIR="/home/$NEWUSER/.ssh"\n`;
            o += `mkdir -p "$USER_SSH_DIR" && chmod 700 "$USER_SSH_DIR"\n`;
            o += `ssh-keygen -t ed25519 -f "$USER_SSH_DIR/id_ed25519" -C "$NEWUSER@arch" -N ""\n`;
            o += `cat "$USER_SSH_DIR/id_ed25519.pub" >> "$USER_SSH_DIR/authorized_keys"\n`;
            o += `chmod 600 "$USER_SSH_DIR/authorized_keys"\nchown -R "$NEWUSER:$NEWUSER" "$USER_SSH_DIR"\n`;
            o += `systemctl enable sshd.service\n`;
            o += `echo "# SSH private key saved: $USER_SSH_DIR/id_ed25519"\n`;
            o += `echo "# Copy id_ed25519 to your client machine before rebooting!"\n`;
            if (!cmdOnly) o += `\`\`\`\n\n> ⚠️ **Save your SSH private key** (\`~/.ssh/id_ed25519\`) to your client machine before rebooting. Password auth is disabled.\n\n`;
        }

        // Snapper hooks
        if (post_apps.includes('snapper')) {
            o += `# Snapper — BTRFS snapshot config\n`;
            o += `snapper -c root create-config /\n`;
            o += `systemctl enable --now snapper-timeline.timer snapper-cleanup.timer\n`;
            o += `# Install grub-btrfs for rollback menu\n`;
            o += `systemctl enable --now grub-btrfsd.service\n`;
        } else if (fs === "btrfs") {
            o += `snapper -c root create-config /\nsystemctl enable snapper-timeline.timer snapper-cleanup.timer\n`;
        }

        // pfetch / fastfetch shell greeting
        if (post_apps.includes('fastfetch') || post_apps.includes('pfetch')) {
            const fetchCmd = post_apps.includes('fastfetch') ? 'fastfetch' : 'pfetch';
            o += `# Add system info greeting to shell\necho '${fetchCmd}' >> /etc/profile.d/greeting.sh\n`;
        }

        // Dusky OS auto-setup
        if (post_apps.includes('dusky-setup')) {
            if (!cmdOnly) o += `\n### Dusky OS Auto-Setup\n> Watch the [YouTube guide](https://www.youtube.com/watch?v=JmgvSdEIK8c) and read the [dusky repo](https://github.com/dusklinux/dusky) cheatsheet before running.\n\n\`\`\`bash\n`;
            else o += `\n# Dusky OS Auto-Setup (by dusklinux)\n# Watch: https://www.youtube.com/watch?v=JmgvSdEIK8c\n# Repo:  https://github.com/dusklinux/dusky\n`;
            o += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\n`;
            if (!cmdOnly) o += `\`\`\`\n\n> 📋 **Cheatsheet**: \`/tmp/dusky/cheatsheet.md\` — Hyprland keybinds and workflow\n`;
        }

        if (vm_guest === "vbox") o += `systemctl enable vboxservice.service\n`;
        else if (vm_guest === "vmware") o += `systemctl enable vmtoolsd.service\n`;
        else if (vm_guest === "qemu") o += `systemctl enable qemu-guest-agent.service\n`;
        if (needsAUR) o += `userdel -r builder\nrm -f /etc/sudoers.d/builder\n`;

        // Security tools (now Arch Rusty Security Suite)
        if (useCustomScripts && arss_tools.length > 0) {
            if (!cmdOnly) o += `\`\`\`\n\n## 7. Arch Rusty Security Suite by tilas01\n\`\`\`bash\n`;
            else o += `\n# 7. Arch Rusty Security Suite\n`;
            o += `# Download the latest release from GitHub\n`;
            o += `SUITE_VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)\n`;
            o += `curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64"\n`;
            o += `curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64.sha256"\n`;
            o += `echo "Verifying integrity..."\nsha256sum -c arch-rusty-security-suite-linux-x86_64.sha256\n`;
            o += `chmod +x arch-rusty-security-suite-linux-x86_64\n`;
            o += `cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite\n`;

            if (arss_tools.includes("webhooks")) {
                o += `\n# Configuring Webhooks\nmkdir -p /etc/arch-security/\ncat << 'WH' > /etc/arch-security/webhook.conf\nPROVIDER=${webhook_provider}\nURL=${webhook_url}\nWH\n`;
                o += `arch-rusty-security-suite webhooks --install-service\n`;
            }
            if (arss_tools.includes("libre-otp")) {
                o += `\n# Configuring Libre OTP\narch-rusty-security-suite libre-otp --setup --mode ${libreOtpMode} --hash ${otp_sha} --recovery-codes ${otp_recovery}\n`;
            }
            if (arss_tools.includes("panic-password")) {
                o += `\n# Configuring Panic Password\narch-rusty-security-suite panic --setup\n`;
            }
            if (arss_tools.includes("evil-maid")) {
                o += `\n# Configuring Anti-Evil Maid\narch-rusty-security-suite aem --setup --main-kernel ${aem_main} --backup-kernel ${aem_backup}\n`;
            }
            if (arss_tools.includes("anti-ducky")) {
                o += `\n# Configuring Input Guard (Anti-Ducky)\narch-rusty-security-suite ducky --approve-current\n`;
            }
            if (arss_tools.includes("hardened-ssh")) {
                o += `\n# Hardening SSH Server\narch-rusty-security-suite ssh --harden\n`;
            }
            if (arss_tools.includes("kloak")) {
                o += `\n# Installing Kloak (Keystroke Anonymisation)\npacman -S --noconfirm kloak\nsystemctl enable kloak\n`;
            }
            if (arss_tools.includes("kernel-watcher")) {
                o += `\n# Configuring Kernel Watcher (Semi-EDR)\narch-rusty-security-suite kernel-watcher --setup\n`;
                o += `cat << 'EOF' > /etc/systemd/system/arss-kernel-watcher.service\n[Unit]\nDescription=ARSS Kernel Watcher EDR Daemon\nAfter=network.target\n\n[Service]\nExecStart=/usr/local/bin/arch-rusty-security-suite kernel-watcher --start\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF\n`;
                o += `systemctl enable arss-kernel-watcher.service\n`;
            }
            if (arss_tools.includes("scarecrow")) {
                o += `\n# Configuring Libre-Cyber-ScareCrow (Sandbox Spoofing)\n`;
                o += `cat << 'EOF' > /etc/systemd/system/arss-scarecrow.service\n[Unit]\nDescription=Libre-Cyber-ScareCrow Sandbox Spoofing\nAfter=network.target\n\n[Service]\nExecStart=/usr/local/bin/arch-rusty-security-suite scarecrow\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF\n`;
                o += `systemctl enable arss-scarecrow.service\n`;
            }
        }

        // Other Security Tools (independent of ARSS)
        if (otherSecTools !== 'no') {
            if (!cmdOnly) o += `\`\`\`\n\n## 9. Other Security Hardening\n\`\`\`bash\n`;
            else o += `\n# 9. Other Security Tools\n`;
            const installAll = otherSecTools === 'all';
            if (installAll || otherSecTools === 'apparmor') {
                o += `pacman -S --noconfirm apparmor\nsed -i 's/^GRUB_CMDLINE_LINUX="/GRUB_CMDLINE_LINUX="apparmor=1 lsm=landlock,lockdown,yama,apparmor,bpf /' /etc/default/grub\nsystemctl enable apparmor\n`;
            }
            if (installAll || otherSecTools === 'usbguard') {
                o += `pacman -S --noconfirm usbguard\nusbguard generate-policy > /etc/usbguard/rules.conf\nsystemctl enable --now usbguard\n`;
            }
            if (installAll || otherSecTools === 'auditd') {
                o += `pacman -S --noconfirm audit\nsystemctl enable --now auditd\necho '-w /etc/passwd -p wa -k passwd_changes' >> /etc/audit/rules.d/audit.rules\necho '-w /etc/sudoers -p wa -k sudoers_changes' >> /etc/audit/rules.d/audit.rules\n`;
            }
            if (installAll || otherSecTools === 'fail2ban') {
                o += `pacman -S --noconfirm fail2ban\ncat > /etc/fail2ban/jail.local << 'F2B'\n[DEFAULT]\nbantime = 3600\nfindtime = 600\nmaxretry = 3\n[sshd]\nenabled = true\nF2B\nsystemctl enable --now fail2ban\n`;
            }
        }

        if (secTools !== "none") {
            if (!cmdOnly) o += `\`\`\`\n\n## 9. Verify Arch ISO USB Integrity\n\`\`\`bash\n`;
            else o += `\n# 9. ISO Verification\n`;
            o += `# Verify the Arch ISO on USB that was used for this install\n`;
            o += `arch-rusty-security-suite verify-iso /dev/sr0  # or USB path\n`;
        }

        if (auto_updates === "yes") {
            if (!cmdOnly) o += `\`\`\`\n\n## 10. Auto Updates\n\`\`\`bash\n`;
            else o += `\n# 10. Auto Updates\n`;
            o += `systemctl enable cronie\ncat << 'CRON_SCRIPT' > /usr/local/bin/auto-update.sh\n#!/bin/bash\n`;
            o += `echo "[$(date)] Starting full system auto-update..." >> /var/log/auto-update.log\n`;
            o += `pacman -Syu --noconfirm >> /var/log/auto-update.log 2>&1\n`;
            o += `if id "builder" >/dev/null 2>&1 && command -v paru >/dev/null 2>&1; then\n`;
            o += `  su - builder -c "paru -Sua --noconfirm" >> /var/log/auto-update.log 2>&1\n`;
            o += `fi\n`;
            o += `echo "[$(date)] System update complete." >> /var/log/auto-update.log\n`;
            o += `# If system is inactive (0 users logged in), reboot to apply kernel/systemd updates\n`;
            o += `if [ "$(who | wc -l)" -eq 0 ]; then\n`;
            o += `  echo "[$(date)] System inactive. Rebooting to apply updates..." >> /var/log/auto-update.log\n`;
            o += `  reboot\n`;
            o += `fi\n`;
            o += `CRON_SCRIPT\nchmod +x /usr/local/bin/auto-update.sh\n(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auto-update.sh") | crontab -\n`;
        }

        // â”€â”€ Download Cheatsheets â”€â”€
        if (cmdOnly) {
            o += `\n# Downloading Cheatsheets\n`;
            o += `mkdir -p /home/$NEWUSER/cheatsheets\n`;
            o += `curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/arch-commands.md" -o /home/$NEWUSER/cheatsheets/arch-commands.md\n`;
            if (desktop === 'dusky') {
                o += `curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/duskyos-hyprland.md" -o /home/$NEWUSER/cheatsheets/duskyos-hyprland.md\n`;
            }
            o += `chown -R $NEWUSER:$NEWUSER /home/$NEWUSER/cheatsheets\n`;
        } else {
            o += `\n### 11. Download Cheatsheets\n\`\`\`bash\nmkdir -p ~/cheatsheets\ncurl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/arch-commands.md" -o ~/cheatsheets/arch-commands.md\n`;
            if (desktop === 'dusky') {
                o += `curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/duskyos-hyprland.md" -o ~/cheatsheets/duskyos-hyprland.md\n`;
            }
            o += `\`\`\`\n`;
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

    // â”€â”€ Append Proprietary Warnings to Markdown Output â”€â”€
    if (selectedPropApps.length > 0 && software_type !== 'libre') {
        let warnStr = `\n\n## âš  Proprietary Software Notice\n> You have chosen to include software containing proprietary (closed-source) code. Be aware of the following privacy/freedom implications:\n`;
        selectedPropApps.forEach(a => warnStr += `- **${a.toUpperCase()}**: ${propAppsDB[a]}\n`);
        mdOutput += warnStr;
    }

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
        
        // Push output into the Live Editor directly
        const uploadEditor = document.getElementById('upload-editor');
        if (uploadEditor) {
            uploadEditor.value = format === 'script' ? scriptOutput : mdOutput;
            // Trigger input event to update preview
            uploadEditor.dispatchEvent(new Event('input'));
            
            // Show the live editor UI
            document.getElementById('upload-editor-wrapper').style.display = 'block';
            document.getElementById('upload-clear-btn').style.display = 'block';
            
            const statusEl = document.getElementById('upload-status');
            if (statusEl) {
                statusEl.textContent = 'âœ“ New generation applied to Live Editor.';
                statusEl.style.color = 'var(--accent-green)';
            }
        }

        // Generate .sc config string
        const configJSONText = JSON.stringify(window.getFormValues(), null, 2);

        // Populate the download buttons dynamically
        const downloadBtnsContainer = document.getElementById('download-btns');
        if (downloadBtnsContainer) {
            let btnsHTML = '';
            if (format === 'markdown' || format === 'both') {
                btnsHTML += `<button type="button" class="btn tooltip-always" data-title="ðŸ“  Download Guide" data-desc="Save the step-by-step tutorial as a markdown file." style="width:auto; padding:0.5rem 1.2rem; background:var(--accent-blue); font-size:0.9rem;" onclick="downloadFile(document.getElementById('raw-md-code').innerText, 'arch-install.md')">ðŸ’¾ .md Guide</button>`;
            }
            if (format === 'script' || format === 'both') {
                btnsHTML += `<button type="button" class="btn tooltip-always" data-title="âš¡ Download Script" data-desc="Save the executable auto-install Bash script." style="width:auto; padding:0.5rem 1.2rem; background:var(--accent-green); color:#000; font-size:0.9rem; font-weight:bold;" onclick="downloadFile(document.getElementById('raw-script-code').innerText, 'arch-install.sh')">ðŸ’¾ .sh Script</button>`;
            }
            // Always show the .sc config download option
            btnsHTML += `<button type="button" class="btn tooltip-always" data-title="âš™ï¸  Save Configuration" data-desc="Download your selections as a .sc file so you can upload and restore them later." style="width:auto; padding:0.5rem 1.2rem; background:var(--bg-lighter); border:1px solid var(--accent-cyan); color:var(--accent-cyan); font-size:0.9rem;" onclick="downloadFile(JSON.stringify(window.getFormValues(), null, 2), 'arch-config.sc')">ðŸ’¾ .sc Config</button>`;
            
            downloadBtnsContainer.innerHTML = btnsHTML;
            if (window.syncTooltipBtn) syncTooltipBtn(); // Re-bind tooltips
        }

        // Show output page instead of generator
        const genForm = document.getElementById('install-form');
        const outputSec = document.getElementById('output-section');
        if (genForm && outputSec) {
            genForm.style.display = 'none';
            outputSec.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

// ── Form Serialization & Preview Logic ──
window.getFormValues = function() {
    const data = {
        version: 1,
        generator: "arch-guides-dynamic",
        selects: {},
        inputs: {},
        checkboxes: {}
    };
    document.querySelectorAll('#install-form select').forEach(el => data.selects[el.id] = el.value);
    document.querySelectorAll('#install-form input[type="text"], #install-form input[type="number"]').forEach(el => data.inputs[el.id] = el.value);
    document.querySelectorAll('#install-form input[type="checkbox"]').forEach(el => {
        if (!data.checkboxes[el.name]) data.checkboxes[el.name] = [];
        if (el.checked) data.checkboxes[el.name].push(el.value);
    });
    return data;
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('install-form');
    if (form) {
        form.addEventListener('change', () => {
            const pre = document.getElementById('sc-preview-json');
            if(pre) pre.textContent = JSON.stringify(window.getFormValues(), null, 2);
        });
        // Initial populate
        const pre = document.getElementById('sc-preview-json');
        if(pre) pre.textContent = JSON.stringify(window.getFormValues(), null, 2);
    }

    // Handle .sc upload
    const scInput = document.getElementById('upload-sc-input');
    if (scInput) {
        scInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.generator !== "arch-guides-dynamic") throw new Error("Invalid format");
                    
                    // Restore Selects
                    if (data.selects) {
                        for (const [id, val] of Object.entries(data.selects)) {
                            const el = document.getElementById(id);
                            if (el) el.value = val;
                        }
                    }
                    // Restore Inputs
                    if (data.inputs) {
                        for (const [id, val] of Object.entries(data.inputs)) {
                            const el = document.getElementById(id);
                            if (el) el.value = val;
                        }
                    }
                    // Restore Checkboxes
                    if (data.checkboxes) {
                        document.querySelectorAll('#install-form input[type="checkbox"]').forEach(cb => cb.checked = false);
                        for (const [name, vals] of Object.entries(data.checkboxes)) {
                            vals.forEach(v => {
                                const cb = document.querySelector(`input[name="${name}"][value="${v}"]`);
                                if (cb) cb.checked = true;
                            });
                        }
                    }
                    // Trigger UI updates
                    document.querySelectorAll('#install-form select').forEach(sel => sel.dispatchEvent(new Event('change')));
                    document.querySelectorAll('#install-form input[type="checkbox"]').forEach(cb => cb.dispatchEvent(new Event('change')));
                    alert('Configuration restored successfully.');
                } catch (err) {
                    alert('Error parsing .sc config file. Is it valid JSON?');
                }
            };
            reader.readAsText(file);
        });
    }
});

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
    'File System Features':         '?page=02-partitioning/luks2.md',
    'Target Installation Disk':     '?page=01-pre-installation.md',
    'Encryption Options':           '?page=02-partitioning/luks2.md',
    'Init System':                  '?page=03-base-installation.md',
    'Bootloader Choice':            '?page=04-bootloaders/uki-no-grub.md',
    'Main Kernel':                  '?page=maintenance.md',
    'Backup Kernel':                '?page=maintenance.md',
    'CPU Architecture':             '?page=03-base-installation.md',
    'GPU Hardware':                 '?page=03-base-installation.md',
    'Virtual Machine Guest Setup':  '?page=03-base-installation.md',
    'Software Type & Graphics Drivers': '?page=10-generator-selections-and-dusky.md',
    'Swap File Size':               '?page=02-partitioning/luks2.md',
    'Post-Install Apps & Scripts':  '?page=10-generator-selections-and-dusky.md',
    'Automatic System Updates':     '?page=07-post-installation.md',
    'Multi-User Setup':             '?page=10-generator-selections-and-dusky.md',
    'System Cleanup':               '?page=07-post-installation.md',
    'Desktop Environment':          '?page=07-post-installation.md',
    'DNS Caching':                  '?page=07-post-installation.md',
    'Display Server':               '?page=xorg-vs-wayland.md',
    '🦀 Arch Rusty Security Suite': '?page=security-suite.md',
    'ARSS — Security Tools':        '?page=security-suite.md',
    'Anti-Evil Maid Decoys':        '?page=security-suite.md',
    'Other Security Tools':         '?page=security-suite.md',
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

// â”€â”€ Full Suite Toggle â”€â”€
const fullSuiteToggle = document.getElementById('arss-full-suite-toggle');
if (fullSuiteToggle) {
    fullSuiteToggle.addEventListener('change', () => {
        const arssCheckboxes = document.querySelectorAll('input[name="arss_tools"]');
        arssCheckboxes.forEach(cb => {
            if (fullSuiteToggle.checked) {
                cb.checked = true;
                cb.disabled = true;
                cb.parentElement.style.opacity = '0.6';
            } else {
                cb.disabled = false;
                cb.parentElement.style.opacity = '1';
            }
            cb.dispatchEvent(new Event('change'));
        });
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

    // DuskyOS Automation Lock
    const duskyAppCb = document.querySelector('input[name="post_apps"][value="dusky-setup"]');
    if (desktop === 'dusky') {
        if (duskyAppCb) {
            duskyAppCb.checked = true;
            duskyAppCb.disabled = true;
            duskyAppCb.parentElement.style.opacity = '0.6';
        }
    } else {
        if (duskyAppCb) {
            duskyAppCb.disabled = false;
            duskyAppCb.parentElement.style.opacity = '1';
        }
    }

    if (part.value === 'unencrypted') warnings.push("⚠️ No encryption — physical access = full compromise.");
    if (gpuBrand === 'nvidia' && softwareType === 'libre') warnings.push("⚠️ Nvidia + Libre = Nouveau only. Limited performance.");
    if (displayServer === 'wayland' && (desktop === 'dusky' || desktop === 'dwm')) warnings.push(`⚠️ ${desktop} requires X11/Xorg. Wayland will break it.`);

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
    }
})();

// â”€â”€â”€ Bind Generate Button â”€â”€â”€
const generateBtn = document.getElementById('generate-btn');
if (generateBtn) {
    generateBtn.addEventListener('click', () => {
        if (typeof window.generateOutput === 'function') {
            window.generateOutput(false);
        }
    });
}
