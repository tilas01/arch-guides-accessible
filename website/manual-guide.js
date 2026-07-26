/* ============================================================================
   manual-guide.js — turns answers into a guide and a script.
   ----------------------------------------------------------------------------
   Two exports, from one set of answers:

     buildManualGuide(state)  → markdown: every command with the reason for it
     buildManualScript(state) → bash: the same commands, in order, runnable

   They are built from the same branch logic so they cannot disagree, which is
   the whole point — a walkthrough that explains one thing while the script does
   another is worse than either alone.

   Commands follow the Arch Wiki installation guide. Where this and the Arch
   Wiki differ, the Arch Wiki is right and this is a bug.
   ========================================================================= */

'use strict';

(function () {

    function esc(v) { return String(v === undefined || v === null ? '' : v); }
    function has(list, v) { return Array.isArray(list) && list.indexOf(v) !== -1; }

    /* Package sets, kept next to each other so the markdown and the script
       cannot install different things. */
    const FONT_PKG = {
        'jetbrains-mono-nerd': 'ttf-jetbrains-mono-nerd',
        'fira-code-nerd': 'ttf-firacode-nerd',
        'cascadia-code': 'ttf-cascadia-code-nerd',
        'iosevka': 'ttc-iosevka',
        'hack': 'ttf-hack-nerd'
    };

    /* Palettes ship as themes for the terminal, editor and prompt. Only the
       ones actually in the repositories or the AUR are listed. */
    const PALETTE_INFO = {
        'tokyo-night':      { pkg: null, repo: 'https://github.com/folke/tokyonight.nvim',        label: 'Tokyo Night' },
        'catppuccin-mocha': { pkg: null, repo: 'https://github.com/catppuccin/catppuccin',        label: 'Catppuccin Mocha' },
        'gruvbox-dark':     { pkg: null, repo: 'https://github.com/morhetz/gruvbox',              label: 'Gruvbox Dark' },
        'nord':             { pkg: null, repo: 'https://www.nordtheme.com/',                     label: 'Nord' },
        'dracula':          { pkg: null, repo: 'https://draculatheme.com/',                       label: 'Dracula' },
        'rose-pine':        { pkg: null, repo: 'https://rosepinetheme.com/',                      label: 'Rosé Pine' },
        'everforest':       { pkg: null, repo: 'https://github.com/sainnhe/everforest',           label: 'Everforest' }
    };

    const LIBRE_BLOCKED = ['steam', 'discord'];

    /* ── Derived facts ──────────────────────────────────────────────────── */

    function facts(s) {
        const arm = s.arch === 'aarch64';
        const enc = s.encryption && s.encryption !== 'none';
        const disk = esc(s.disk) || '/dev/CHANGE_ME';
        /* nvme0n1 partitions are nvme0n1p1; sda partitions are sda1. mmcblk
           follows the nvme rule. Getting this wrong is the classic way a
           generated script targets a device that does not exist. */
        const sep = /(\d|nvme\d+n\d+|mmcblk\d+|loop\d+)$/.test(disk) &&
                    /(nvme|mmcblk|loop)/.test(disk) ? 'p' : '';
        const dual = s.dualboot && s.dualboot !== 'none';
        return {
            arm: arm,
            enc: enc,
            disk: disk,
            esp: dual ? esc(s.dualboot_esp) : disk + sep + '1',
            root: disk + sep + (dual ? '2' : '2'),
            rootDev: enc ? '/dev/mapper/cryptroot' : disk + sep + '2',
            dual: dual,
            libre: s.libre === 'yes',
            btrfs: s.filesystem === 'btrfs',
            gui: s.desktop && s.desktop !== 'none',
            dusky: s.desktop === 'dusky'
        };
    }

    /* ── Package list ───────────────────────────────────────────────────── */

    function basePackages(s, f) {
        const pkgs = ['base', 'linux-firmware', 'sudo', 'vim', 'man-db', 'man-pages', 'texinfo'];
        (s.kernels || ['linux']).forEach(k => pkgs.push(k, k + '-headers'));
        if (f.btrfs) pkgs.push('btrfs-progs');
        if (s.filesystem === 'xfs') pkgs.push('xfsprogs');
        if (f.enc) pkgs.push('cryptsetup');
        if (!f.arm && !f.libre && s.microcode && s.microcode !== 'none') pkgs.push(s.microcode);
        if (s.network === 'networkmanager') pkgs.push('networkmanager');
        if (s.network === 'systemd-networkd') pkgs.push('iwd');
        if (s.network === 'iwd') pkgs.push('iwd');
        if (s.bootloader === 'grub' || (f.arm && s.arm_boot === 'efi-arm')) pkgs.push('grub', 'efibootmgr');
        if (s.bootloader === 'uki') pkgs.push('sbctl', 'efibootmgr');
        if (s.bootloader === 'systemd-boot') pkgs.push('efibootmgr');
        if (s.swap === 'zram') pkgs.push('zram-generator');
        if (s.shell === 'zsh') pkgs.push('zsh');
        if (s.shell === 'fish') pkgs.push('fish');
        return pkgs;
    }

    function desktopPackages(s, f) {
        const p = [];
        if (!f.gui) return p;
        if (s.desktop === 'dusky' || s.desktop === 'hyprland') {
            p.push('hyprland', 'waybar', 'wofi', 'xdg-desktop-portal-hyprland',
                   'qt5-wayland', 'qt6-wayland', 'polkit-kde-agent');
        }
        if (s.desktop === 'dwm') p.push('xorg-server', 'xorg-xinit', 'libx11', 'libxft', 'libxinerama');
        if (s.desktop === 'gnome') p.push('gnome', 'gdm');
        if (s.desktop === 'kde') p.push('plasma-meta', 'sddm', 'konsole');
        if (s.display_server === 'xorg' && s.desktop !== 'dwm') p.push('xorg-server');
        if (s.audio === 'pipewire') p.push('pipewire', 'pipewire-pulse', 'pipewire-alsa', 'wireplumber');
        if (s.font && FONT_PKG[s.font]) p.push(FONT_PKG[s.font]);
        // Ricing toolkit. Each choice maps to the Wayland or Xorg package
        // depending on the display server, so the guide never tells a Wayland
        // user to install an X-only tool.
        const wl = s.display_server !== 'xorg';
        const RICE = {
            rofi:       wl ? 'wofi' : 'rofi',
            waybar:     wl ? 'waybar' : 'polybar',
            dunst:      wl ? 'mako' : 'dunst',
            wallpaper:  wl ? 'hyprpaper' : 'feh',
            picom:      'picom',
            lockscreen: wl ? 'hyprlock' : 'swaylock',
            idle:       wl ? 'hypridle' : 'swayidle',
            clipboard:  wl ? 'cliphist' : 'clipman',
            screenshot: wl ? 'grim slurp' : 'flameshot'
        };
        (s.ricing || []).forEach(r => {
            if (RICE[r]) RICE[r].split(' ').forEach(pkg => p.push(pkg));
        });
        return p;
    }

    function postPackages(s, f) {
        let apps = (s.apps || []).slice();
        if (f.libre) apps = apps.filter(a => LIBRE_BLOCKED.indexOf(a) === -1);
        const extra = [];
        if (s.firewall === 'ufw') extra.push('ufw');
        if (s.firewall === 'nftables') extra.push('nftables');
        if (s.snapshots === 'snapper') extra.push('snapper', 'snap-pac');
        if (s.snapshots === 'timeshift') extra.push('timeshift');
        return { apps: apps, extra: extra };
    }

    /* ── Markdown ───────────────────────────────────────────────────────── */

    function buildManualGuide(s) {
        const f = facts(s);
        const L = [];
        const answered = Object.keys(s).length > 0;

        L.push('# Arch Linux — your manual install guide');
        L.push('');
        if (!answered) {
            L.push('_Answer the questions to build a guide. Every command that appears');
            L.push('here comes with the reason it is there._');
            return L.join('\n');
        }

        L.push('Generated by the [Arch Guides manual walkthrough](https://tilas01.github.io/arch-guides-dynamic/manual.html).');
        L.push('Cross-check anything you are unsure about against the');
        L.push('[Arch Wiki installation guide](https://wiki.archlinux.org/title/Installation_guide) —');
        L.push('it is the authority, and where it and this disagree it is right.');
        L.push('');
        L.push('> **Read this before running any of it.** The partitioning commands are');
        L.push('> aimed at `' + f.disk + '` and will destroy everything on it. They do not');
        L.push('> ask twice.');
        L.push('');

        /* Summary table — what you chose, at a glance. */
        L.push('## Your choices');
        L.push('');
        L.push('| | |');
        L.push('|---|---|');
        const row = (k, v) => { if (v !== undefined && v !== null && v !== '') L.push('| **' + k + '** | ' + (Array.isArray(v) ? v.join(', ') : v) + ' |'); };
        row('Architecture', s.arch);
        row('Board', s.board);
        row('Alongside', s.dualboot === 'none' ? 'nothing — whole disk' : s.dualboot);
        row('Disk', s.disk);
        row('Encryption', s.encryption);
        row('Filesystem', s.filesystem);
        row('Swap', s.swap);
        row('Firmware', s.firmware);
        row('Bootloader', s.bootloader || s.arm_boot);
        row('Secure Boot', s.secureboot);
        row('Kernels', s.kernels);
        row('Microcode', s.microcode);
        row('Mirror country', s.mirror_country === 'auto' ? 'auto (fastest worldwide)' : s.mirror_country);
        row('Mirror protocol', s.mirror_https === 'no' ? 'HTTP + HTTPS' : 'HTTPS only');
        row('Desktop', s.desktop);
        row('Display server', s.display_server);
        row('Ricing toolkit', s.ricing);
        row('Font', s.font);
        row('Palette', s.palette);
        row('Shell', s.shell);
        row('Network', s.network);
        row('Firewall', s.firewall);
        row('Snapshots', s.snapshots);
        row('Security tools', s.security_tools);
        row('Libre only', s.libre);
        L.push('');

        if (f.dusky) {
            L.push('> **DuskyOS is preconfigured.** It fixes the compositor (Hyprland on');
            L.push('> Wayland), the shell (zsh), the font (JetBrains Mono Nerd) and the');
            L.push('> palette (Tokyo Night). Those questions were locked rather than');
            L.push('> silently overridden, so you could see the cost of the choice.');
            L.push('> Walkthrough video: <https://www.youtube.com/watch?v=6bnLBs_j8Kk>');
            L.push('');
        }

        /* ── 0. Before you boot ── */
        L.push('## 0. Before you boot the installer');
        L.push('');
        L.push('1. **Verify the image.** Hash it, and get the checksum from a host other');
        L.push('   than the one that served the image — a server that lies about the');
        L.push('   image can hand you a checksum that matches the lie.');
        L.push('   [Verifier](https://tilas01.github.io/arch-guides-dynamic/iso-verify.html).');
        L.push('2. **Lock the firmware down.** Update it, set a supervisor password,');
        L.push('   disable USB and network boot. Without a supervisor password every');
        L.push('   other setting is one unlocked menu away from being undone.');
        L.push('3. **Back up anything you cannot lose** — not to the disk below.');
        if (f.dual) {
            L.push('4. **Dual boot preparation**, because the other system is staying:');
            if (s.dualboot === 'windows') {
                L.push('   - In Windows, as administrator: `powercfg /h off`. Fast Startup');
                L.push('     leaves NTFS hibernated, and resizing it in that state corrupts it.');
                L.push('   - Suspend BitLocker: `manage-bde -protectors -disable C: -RebootCount 2`.');
                L.push('     **Write the recovery key down first, somewhere that is not this');
                L.push('     machine.** Changing the boot configuration changes the TPM');
                L.push('     measurements, and Windows will ask for it.');
                L.push('   - Full **Restart**, not Shut down, before booting the installer.');
            } else {
                L.push('   - Note the existing EFI system partition: `' + esc(s.dualboot_esp) + '`.');
                L.push('     It is **mounted, never formatted** — formatting it deletes the');
                L.push('     other system\'s bootloader.');
            }
        }
        L.push('');

        /* ── 1. Boot ── */
        L.push('## 1. Boot the installer and get a network');
        L.push('');
        L.push('```bash');
        if (s.keymap && s.keymap !== 'us') L.push('loadkeys ' + s.keymap);
        if (!f.arm) L.push('ls /sys/firmware/efi && echo UEFI   # confirms firmware mode');
        L.push('');
        L.push('# Wireless, if you need it:');
        L.push('iwctl station wlan0 connect YOUR_SSID');
        L.push('');
        L.push('ping -c3 archlinux.org');
        L.push('timedatectl set-ntp true');
        L.push('```');
        L.push('');
        if (f.arm) {
            L.push('> **ARM is different here.** Arch Linux ARM does not ship a bootable');
            L.push('> installer ISO. You prepare the storage from another machine and');
            L.push('> extract a per-board rootfs tarball onto it, then boot into the');
            L.push('> installed system. Steps 2 and 3 below run on the *other* machine.');
            L.push('> Mirror selection below is Arch-proper only; Arch Linux ARM uses its');
            L.push('> own mirror list at /etc/pacman.d/mirrorlist. See');
            L.push('> <https://archlinuxarm.org/platforms> for your board.');
            L.push('');
        } else {
            // Mirror selection with reflector. Only on Arch-proper (x86_64):
            // Arch Linux ARM has a separate mirror system.
            const httpsOnly = s.mirror_https !== 'no';
            const country = s.mirror_country && s.mirror_country !== 'auto'
                ? s.mirror_country : null;
            L.push('### Pick fast package mirrors');
            L.push('');
            L.push('```bash');
            L.push('pacman -Sy --noconfirm reflector');
            const parts = ['reflector'];
            if (country) parts.push('--country ' + country);
            parts.push('--age 12');            // synced in the last 12 hours
            parts.push('--latest 20');         // the 20 most-recently-synced
            if (httpsOnly) parts.push('--protocol https');
            parts.push('--sort rate');         // then rank those by download speed
            parts.push('--save /etc/pacman.d/mirrorlist');
            // Wrap the reflector line for readability rather than one long line.
            L.push(parts.join(' \\\n    '));
            L.push('');
            L.push('# --sort rate downloads from each candidate to measure real speed,');
            L.push('# so this takes a minute. --age 12 and --latest 20 keep only mirrors');
            L.push('# that are both fresh and fast.' +
                   (httpsOnly ? ' --protocol https keeps it to encrypted mirrors.' : ''));
            L.push('```');
            L.push('');
            if (!httpsOnly) {
                L.push('> You allowed HTTP mirrors. Package **contents** are still verified');
                L.push('> by pacman\'s signatures, so this is not an integrity risk — but');
                L.push('> anyone on the path can see which packages you install. HTTPS');
                L.push('> hides that.');
                L.push('');
            }
        }

        /* ── 2. Partition ── */
        L.push('## 2. Partition `' + f.disk + '`');
        L.push('');
        L.push('```bash');
        L.push('lsblk                       # identify the disk by size and model. Twice.');
        L.push('```');
        L.push('');
        if (f.dual) {
            L.push('You are keeping another operating system, so you are **adding** a');
            L.push('partition rather than repartitioning. Shrink the existing one from');
            L.push('that system\'s own tools first — Windows Disk Management, or GParted');
            L.push('for Linux — then create one Linux partition in the free space.');
            L.push('');
            L.push('```bash');
            L.push('gdisk ' + f.disk);
            L.push('#   n → next free number → rest of free space → type 8300');
            L.push('#   w → write');
            L.push('#');
            L.push('# Do NOT touch ' + esc(s.dualboot_esp) + '. That is the existing ESP and it is shared.');
            L.push('```');
        } else {
            L.push('```bash');
            L.push('gdisk ' + f.disk);
            L.push('#   o → new GPT (destroys the existing table)');
            L.push('#   n → 1 → +' + (s.bootloader === 'uki' ? '1G' : '512M') + ' → type ef00   (EFI system partition)');
            L.push('#   n → 2 → rest        → type 8300   (Linux filesystem)');
            L.push('#   w → write');
            if (s.bootloader === 'uki') {
                L.push('#');
                L.push('# 1 GiB rather than 512 MiB: a unified kernel image bundles the kernel');
                L.push('# and initramfs into one EFI file, and two of those plus a fallback');
                L.push('# does not fit in 512 MiB.');
            }
            L.push('```');
        }
        L.push('');

        if (f.enc) {
            L.push('### Encrypt');
            L.push('');
            L.push('```bash');
            if (s.encryption === 'luks2') {
                L.push('cryptsetup luksFormat --type luks2 --pbkdf argon2id ' + f.root);
            } else {
                L.push('cryptsetup luksFormat --type luks1 ' + f.root);
                L.push('# LUKS1 uses PBKDF2, not Argon2id: a weak passphrase falls far');
                L.push('# faster to a GPU. Use a long one.');
            }
            L.push('cryptsetup open ' + f.root + ' cryptroot');
            L.push('```');
            L.push('');
            L.push('> The passphrase you set here is the one standing between a stolen');
            L.push('> machine and every file on it. There is no recovery if you forget it.');
            L.push('');
        }

        L.push('### Format and mount');
        L.push('');
        L.push('```bash');
        if (!f.dual) L.push('mkfs.fat -F32 ' + f.esp);
        else L.push('# ' + f.esp + ' is the existing ESP. It is NOT formatted.');
        if (f.btrfs) {
            L.push('mkfs.btrfs -f ' + f.rootDev);
            L.push('');
            L.push('mount ' + f.rootDev + ' /mnt');
            L.push('btrfs subvolume create /mnt/@');
            L.push('btrfs subvolume create /mnt/@home');
            L.push('btrfs subvolume create /mnt/@log');
            L.push('btrfs subvolume create /mnt/@pkg');
            L.push('btrfs subvolume create /mnt/@snapshots');
            L.push('umount /mnt');
            L.push('');
            L.push('O="noatime,compress=zstd:3,space_cache=v2"');
            L.push('mount -o $O,subvol=@          ' + f.rootDev + ' /mnt');
            L.push('mkdir -p /mnt/{home,var/log,var/cache/pacman/pkg,.snapshots,boot}');
            L.push('mount -o $O,subvol=@home      ' + f.rootDev + ' /mnt/home');
            L.push('mount -o $O,subvol=@log       ' + f.rootDev + ' /mnt/var/log');
            L.push('mount -o $O,subvol=@pkg       ' + f.rootDev + ' /mnt/var/cache/pacman/pkg');
            L.push('mount -o $O,subvol=@snapshots ' + f.rootDev + ' /mnt/.snapshots');
            L.push('mount ' + f.esp + ' /mnt/boot');
        } else {
            L.push('mkfs.' + (s.filesystem === 'xfs' ? 'xfs -f' : 'ext4') + ' ' + f.rootDev);
            L.push('mount ' + f.rootDev + ' /mnt');
            L.push('mkdir -p /mnt/boot');
            L.push('mount ' + f.esp + ' /mnt/boot');
        }
        L.push('```');
        L.push('');
        if (f.btrfs) {
            L.push('> `@log` and `@pkg` are separate subvolumes so that rolling back to a');
            L.push('> snapshot does not also roll back your logs — you want those to');
            L.push('> explain what went wrong — or throw away the package cache you are');
            L.push('> about to need.');
            L.push('');
        }

        if (s.swap === 'swapfile') {
            L.push('### Swap file');
            L.push('');
            L.push('```bash');
            if (f.btrfs) {
                L.push('btrfs subvolume create /mnt/@swap');
                L.push('mount -o noatime,subvol=@swap ' + f.rootDev + ' /mnt/swap');
                L.push('btrfs filesystem mkswapfile --size 8G /mnt/swap/swapfile');
            } else {
                L.push('mkswap -U clear --size 8G --file /mnt/swapfile');
            }
            L.push('```');
            L.push('');
            if (f.enc) {
                L.push('> The swap file lives inside the encrypted volume, so anything paged');
                L.push('> out of memory — including keys — is encrypted at rest too.');
                L.push('');
            }
        }

        /* ── 3. Install ── */
        const base = basePackages(s, f);
        L.push('## 3. Install the base system');
        L.push('');
        L.push('```bash');
        L.push('pacstrap -K /mnt \\');
        L.push('    ' + base.join(' ') + '');
        L.push('');
        L.push('genfstab -U /mnt >> /mnt/etc/fstab');
        L.push('cat /mnt/etc/fstab          # read it before you trust it');
        L.push('arch-chroot /mnt');
        L.push('```');
        L.push('');
        if (f.libre) {
            L.push('> **Libre policy is on**, so no microcode is installed. That leaves');
            L.push('> known CPU errata unmitigated, including some speculative-execution');
            L.push('> issues. That is the trade you asked for; it is worth knowing you');
            L.push('> made it.');
            L.push('');
        }

        /* ── 4. Configure ── */
        L.push('## 4. Configure, inside the chroot');
        L.push('');
        L.push('```bash');
        L.push('ln -sf /usr/share/zoneinfo/' + esc(s.timezone) + ' /etc/localtime');
        L.push('hwclock --systohc');
        L.push('');
        L.push("sed -i 's/^#" + esc(s.locale) + "/" + esc(s.locale) + "/' /etc/locale.gen");
        L.push('locale-gen');
        L.push('echo "LANG=' + esc(s.locale) + '" > /etc/locale.conf');
        L.push('echo "KEYMAP=' + esc(s.keymap) + '" > /etc/vconsole.conf');
        L.push('');
        L.push('echo "' + esc(s.hostname) + '" > /etc/hostname');
        L.push("cat >> /etc/hosts <<'EOF'");
        L.push('127.0.0.1   localhost');
        L.push('::1         localhost');
        L.push('127.0.1.1   ' + esc(s.hostname) + '.localdomain ' + esc(s.hostname));
        L.push('EOF');
        L.push('');
        L.push('passwd                                     # root password');
        L.push('useradd -m -G wheel -s ' + (s.shell === 'zsh' ? '/bin/zsh' : s.shell === 'fish' ? '/usr/bin/fish' : '/bin/bash') + ' ' + esc(s.username));
        L.push('passwd ' + esc(s.username));
        L.push('EDITOR=vim visudo                          # uncomment %wheel ALL=(ALL:ALL) ALL');
        L.push('```');
        L.push('');
        if (f.dual && s.dualboot === 'windows') {
            L.push('> Windows expects the hardware clock in local time and Linux keeps it');
            L.push('> in UTC, so the two will disagree by your offset. `hwclock --systohc`');
            L.push('> above writes UTC, which is the standards-compliant side; set');
            L.push('> `RealTimeIsUniversal` to `DWORD 1` in Windows to match.');
            L.push('');
        }

        if (f.enc) {
            L.push('### Tell the initramfs about the encryption');
            L.push('');
            L.push('```bash');
            L.push('vim /etc/mkinitcpio.conf');
            L.push('# HOOKS=(base systemd autodetect microcode modconf kms keyboard \\');
            L.push('#        sd-vconsole block sd-encrypt filesystems fsck)');
            L.push('#');
            L.push('# sd-encrypt must come BEFORE filesystems, and keyboard before');
            L.push('# sd-encrypt — otherwise you get a passphrase prompt you cannot type');
            L.push('# into, which looks exactly like a broken install.');
            L.push('');
            L.push('mkinitcpio -P');
            L.push('```');
            L.push('');
        }

        /* ── 5. Bootloader ── */
        L.push('## 5. Bootloader');
        L.push('');
        const uuidCmd = 'UUID=$(blkid -s UUID -o value ' + f.root + ')';
        const rootOpts = (f.enc ? 'rd.luks.name=$UUID=cryptroot root=/dev/mapper/cryptroot ' : 'root=UUID=$UUID ') +
                         (f.btrfs ? 'rootflags=subvol=@ ' : '') + 'rw';

        if (f.arm) {
            if (s.arm_boot === 'rpi-firmware') {
                L.push('The Raspberry Pi EEPROM bootloader reads `config.txt` and');
                L.push('`cmdline.txt` from the FAT partition. There is no EFI stub involved.');
                L.push('');
                L.push('```bash');
                L.push('cat /boot/cmdline.txt        # single line, kernel command line');
                L.push('cat /boot/config.txt         # firmware settings');
                L.push('```');
                L.push('');
                L.push('> **Update and then lock the EEPROM.** It runs before anything you');
                L.push('> control, and an attacker with brief physical access can reflash an');
                L.push('> unprotected one — after which none of the disk encryption above');
                L.push('> helps you.');
                L.push('>');
                L.push('> ```bash');
                L.push('> rpi-eeprom-update -a');
                L.push('> vcgencmd bootloader_version');
                L.push('> ```');
            } else if (s.arm_boot === 'extlinux') {
                L.push('```bash');
                L.push('mkdir -p /boot/extlinux');
                L.push(uuidCmd);
                L.push("cat > /boot/extlinux/extlinux.conf <<EOF");
                L.push('LABEL Arch Linux ARM');
                L.push('    KERNEL /Image');
                L.push('    FDT /dtbs/your-board.dtb');
                L.push('    APPEND ' + rootOpts);
                L.push('EOF');
                L.push('```');
                L.push('');
                L.push('> Replace `your-board.dtb` with the device tree for your board — the');
                L.push('> kernel cannot enumerate ARM hardware without it, and the wrong one');
                L.push('> gives you a board that powers on and does nothing.');
            } else {
                L.push('```bash');
                L.push('bootctl install');
                L.push(uuidCmd);
                L.push("cat > /boot/loader/entries/arch.conf <<EOF");
                L.push('title   Arch Linux ARM');
                L.push('linux   /Image');
                L.push('initrd  /initramfs-linux.img');
                L.push('options ' + rootOpts);
                L.push('EOF');
                L.push('```');
            }
        } else if (s.bootloader === 'uki') {
            L.push('```bash');
            L.push(uuidCmd);
            L.push('echo "' + rootOpts + '" > /etc/kernel/cmdline');
            L.push('');
            L.push('# Turn on the unified image preset');
            L.push('sed -i "s|^#\\?ALL_config|ALL_config|" /etc/mkinitcpio.d/linux.preset');
            L.push('mkinitcpio -P');
            L.push('```');
            L.push('');
            if (s.secureboot === 'own-keys') {
                L.push('### Your own Secure Boot keys');
                L.push('');
                L.push('```bash');
                L.push('sbctl status                 # firmware must be in Setup Mode');
                L.push('sbctl create-keys');
                L.push('sbctl enroll-keys -m         # -m keeps the Microsoft OEM certificates');
                L.push('sbctl sign -s /boot/EFI/Linux/arch-linux.efi');
                L.push('sbctl verify');
                L.push('```');
                L.push('');
                L.push('> `-m` keeps Microsoft\'s certificates enrolled. On many machines');
                L.push('> the firmware itself is signed by them, and removing them can leave');
                L.push('> you with hardware that will not initialise. Back up the existing');
                L.push('> keys first, and know where "restore factory keys" is in your');
                L.push('> firmware setup before you start.');
            }
        } else if (s.bootloader === 'systemd-boot') {
            L.push('```bash');
            L.push('bootctl install');
            L.push('');
            L.push("cat > /boot/loader/loader.conf <<'EOF'");
            L.push('default arch.conf');
            L.push('timeout 3');
            L.push('console-mode max');
            L.push('editor no');
            L.push('EOF');
            L.push('');
            L.push(uuidCmd);
            L.push("cat > /boot/loader/entries/arch.conf <<EOF");
            L.push('title   Arch Linux');
            L.push('linux   /vmlinuz-' + ((s.kernels && s.kernels[0]) || 'linux'));
            if (s.microcode && s.microcode !== 'none' && !f.libre) L.push('initrd  /' + s.microcode + '.img');
            L.push('initrd  /initramfs-' + ((s.kernels && s.kernels[0]) || 'linux') + '.img');
            L.push('options ' + rootOpts);
            L.push('EOF');
            L.push('```');
            L.push('');
            L.push('> `editor no` matters. Without it anyone standing at the boot menu can');
            L.push('> append `init=/bin/bash` and walk straight past your login — on an');
            L.push('> unencrypted system that is a full compromise in one keystroke.');
        } else {
            L.push('```bash');
            L.push(f.dual
                ? 'pacman -S os-prober\ngrub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=Arch'
                : 'grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=Arch');
            if (f.enc) {
                L.push('');
                L.push('# GRUB needs to be told to unlock the root device');
                L.push(uuidCmd);
                L.push('sed -i "s|^GRUB_CMDLINE_LINUX=.*|GRUB_CMDLINE_LINUX=\\"' + rootOpts + '\\"|" /etc/default/grub');
                L.push('echo GRUB_ENABLE_CRYPTODISK=y >> /etc/default/grub');
            }
            if (f.dual) {
                L.push('');
                L.push('echo GRUB_DISABLE_OS_PROBER=false >> /etc/default/grub');
                L.push('# os-prober is disabled by default since GRUB 2.06; without this');
                L.push('# line the other operating system never appears in the menu.');
            }
            L.push('');
            L.push('grub-mkconfig -o /boot/grub/grub.cfg');
            L.push('```');
        }
        L.push('');

        /* ── 6. Services ── */
        L.push('## 6. Services');
        L.push('');
        L.push('```bash');
        if (s.network === 'networkmanager') L.push('systemctl enable NetworkManager');
        if (s.network === 'systemd-networkd') L.push('systemctl enable systemd-networkd systemd-resolved iwd');
        if (s.network === 'iwd') L.push('systemctl enable iwd');
        if (s.desktop === 'gnome') L.push('systemctl enable gdm');
        if (s.desktop === 'kde') L.push('systemctl enable sddm');
        if (s.swap === 'zram') {
            L.push('');
            L.push("cat > /etc/systemd/zram-generator.conf <<'EOF'");
            L.push('[zram0]');
            L.push('zram-size = min(ram / 2, 8192)');
            L.push('compression-algorithm = zstd');
            L.push('EOF');
        }
        L.push('```');
        L.push('');
        if (s.swap === 'zram') {
            L.push('> zram compresses swap in RAM. Nothing from your memory is written to');
            L.push('> disk, which is one fewer place for a key to end up. It cannot');
            L.push('> hibernate — that needs real disk swap at least the size of RAM.');
            L.push('');
        }

        L.push('## 7. Reboot');
        L.push('');
        L.push('```bash');
        L.push('exit');
        L.push('umount -R /mnt');
        if (f.enc) L.push('cryptsetup close cryptroot');
        L.push('reboot');
        L.push('```');
        L.push('');
        L.push('> If it does not come up, boot the installer again, `cryptsetup open`,');
        L.push('> remount, `arch-chroot`, and you are exactly where you were. Almost');
        L.push('> nothing at this stage is unrecoverable.');
        L.push('');

        /* ── 8. Post-install ── */
        const dpkgs = desktopPackages(s, f);
        const post = postPackages(s, f);
        if (dpkgs.length || post.apps.length || post.extra.length) {
            L.push('## 8. After the first boot');
            L.push('');
            L.push('Do this from the installed system, logged in as `' + esc(s.username) + '`.');
            L.push('');
            L.push('```bash');
            const all = dpkgs.concat(post.extra, post.apps);
            L.push('sudo pacman -S --needed \\');
            L.push('    ' + all.join(' '));
            L.push('```');
            L.push('');
            if (f.libre && (s.apps || []).some(a => LIBRE_BLOCKED.indexOf(a) !== -1)) {
                L.push('> Removed under the libre policy: `' +
                       (s.apps || []).filter(a => LIBRE_BLOCKED.indexOf(a) !== -1).join('`, `') +
                       '`. They ship proprietary components.');
                L.push('');
            }
        }

        if (s.firewall === 'ufw') {
            L.push('### Firewall');
            L.push('');
            L.push('```bash');
            L.push('sudo ufw default deny incoming');
            L.push('sudo ufw default allow outgoing');
            if (has(s.apps, 'openssh')) L.push('sudo ufw limit ssh    # rate-limits repeated connection attempts');
            L.push('sudo ufw enable');
            L.push('sudo systemctl enable ufw');
            L.push('```');
            L.push('');
            L.push('> Default-deny inbound is the highest security-per-keystroke item in');
            L.push('> this whole guide. Everything you did not open is closed.');
            L.push('');
        }

        if (s.snapshots === 'snapper' && f.btrfs) {
            L.push('### Snapshots');
            L.push('');
            L.push('```bash');
            L.push('sudo umount /.snapshots && sudo rm -rf /.snapshots');
            L.push('sudo snapper -c root create-config /');
            L.push('sudo btrfs subvolume delete /.snapshots');
            L.push('sudo mkdir /.snapshots && sudo mount -a');
            L.push('sudo systemctl enable --now snapper-timeline.timer snapper-cleanup.timer');
            L.push('```');
            L.push('');
            L.push('> With `snap-pac` installed, a snapshot is taken before and after every');
            L.push('> pacman transaction. A broken update becomes a reboot rather than a');
            L.push('> rescue USB.');
            L.push('');
        }

        /* Per-app configuration — the "auto config setup" step. */
        const cfg = appConfig(s, f);
        if (cfg.length) {
            L.push('### Configure what you installed');
            L.push('');
            L.push('These need a decision from you, so they are asked rather than guessed.');
            L.push('');
            cfg.forEach(c => {
                L.push('#### ' + c.title);
                L.push('');
                L.push(c.why);
                L.push('');
                L.push('```bash');
                c.cmds.forEach(x => L.push(x));
                L.push('```');
                L.push('');
            });
        }

        if ((s.security_tools || []).length) {
            L.push('### Security tools');
            L.push('');
            L.push('```bash');
            L.push('curl -fsSL https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/scripts/install-security-suite.sh -o install.sh');
            L.push('less install.sh          # read it before running it as root');
            L.push('sudo bash install.sh --only ' + (s.security_tools || []).join(','));
            L.push('```');
            L.push('');
            L.push('> The installer verifies each binary\'s SHA-512 hash **and** GPG');
            L.push('> signature, pins the signing key fingerprint, and fails closed. It');
            L.push('> installs the daemons but does not enable them — several of these can');
            L.push('> lock you out, which is the point of them.');
            L.push('');
            if (has(s.security_tools, 'anti-ducky')) {
                L.push('> **Input Guard specifically:** its keystroke-timing thresholds have');
                L.push('> never been measured on real hardware, so its false-positive rate is');
                L.push('> unknown — and it guards the keyboard you log in with. Test it while');
                L.push('> you still have SSH or a second keyboard.');
                L.push('');
            }
        }

        if (s.buskill && s.buskill !== 'none') {
            L.push('### BusKill');
            L.push('');
            L.push('```bash');
            L.push("cat | sudo tee /etc/udev/rules.d/99-buskill.rules <<'EOF'");
            L.push('SUBSYSTEM=="usb", ACTION=="remove", ENV{ID_MODEL}=="BusKill*", RUN+="' +
                   (s.buskill === 'shutdown' ? '/usr/bin/systemctl poweroff' : '/usr/bin/loginctl lock-sessions') + '"');
            L.push('EOF');
            L.push('sudo udevadm control --reload-rules');
            L.push('```');
            L.push('');
            if (s.buskill === 'shutdown') {
                L.push('> **This cuts power on every disconnect, accidental or not.** Unsaved');
                L.push('> work is gone. Rehearse it in a virtual machine before you trust it');
                L.push('> on a machine you use.');
            } else {
                L.push('> Locking is the non-destructive option: pull the cable and the');
                L.push('> session locks. You can always get back in.');
            }
            L.push('');
        }

        L.push('---');
        L.push('');
        L.push('## Where to go from here');
        L.push('');
        L.push('- [The wiki](https://tilas01.github.io/arch-guides-dynamic/wiki.html) — every option above, explained in full');
        L.push('- [Firmware lockdown](https://tilas01.github.io/arch-guides-dynamic/wiki.html#bios-lockdown) — do this if you have not');
        L.push('- [AUR safety](https://tilas01.github.io/arch-guides-dynamic/wiki.html#aur-safety) — before you install your first AUR package');
        L.push('- [Arch Wiki](https://wiki.archlinux.org/) — the authority for all of it');
        L.push('');
        L.push('_Set up a backup. Snapshots live on the disk that fails._');

        return L.join('\n');
    }

    /* Per-application configuration that genuinely needs an answer. */
    function appConfig(s, f) {
        const out = [];
        const apps = s.apps || [];
        if (has(apps, 'git')) {
            out.push({
                title: 'git',
                why: 'git refuses to commit without an identity, and it goes into every ' +
                     'commit you ever make — including public ones.',
                cmds: ['git config --global user.name "Your Name"',
                       'git config --global user.email "you@example.com"',
                       'git config --global init.defaultBranch main']
            });
        }
        if (has(apps, 'openssh')) {
            out.push({
                title: 'openssh',
                why: 'The defaults permit password authentication. Keys only, and no ' +
                     'root login, closes the two things automated scanners try first. ' +
                     'Copy your key across *before* you disable passwords, or you will ' +
                     'lock yourself out.',
                cmds: ['ssh-keygen -t ed25519 -a 100',
                       '# copy the public key to the server first, then:',
                       "sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config",
                       "sudo sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config",
                       'sudo systemctl enable --now sshd']
            });
        }
        if (has(apps, 'docker')) {
            out.push({
                title: 'docker',
                why: 'Adding yourself to the docker group is equivalent to giving ' +
                     'yourself passwordless root: the daemon runs as root and will ' +
                     'mount any path you ask it to. Use rootless docker instead unless ' +
                     'you need the daemon.',
                cmds: ['sudo systemctl enable --now docker',
                       '# Root-equivalent. Prefer rootless if you can:',
                       'dockerd-rootless-setuptool.sh install',
                       '# Only if you accept the above:',
                       '# sudo usermod -aG docker ' + esc(s.username)]
            });
        }
        if (s.palette && PALETTE_INFO[s.palette] && f.gui) {
            const p = PALETTE_INFO[s.palette];
            const themed = [];
            if (has(apps, 'kitty')) themed.push('kitty');
            if (has(apps, 'alacritty')) themed.push('alacritty');
            if (has(apps, 'neovim')) themed.push('neovim');
            if (themed.length) {
                out.push({
                    title: p.label + ' theme for ' + themed.join(', '),
                    why: 'One palette across the terminal, the editor and the prompt, so ' +
                         'they agree with each other. Themes are per-application config ' +
                         'files, not a system setting — this fetches them from upstream: ' +
                         p.repo,
                    cmds: ['mkdir -p ~/.config']
                        .concat(has(apps, 'kitty') ? ['# kitty: add "include ' + s.palette + '.conf" to ~/.config/kitty/kitty.conf'] : [])
                        .concat(has(apps, 'alacritty') ? ['# alacritty: import the ' + p.label + ' toml into ~/.config/alacritty/alacritty.toml'] : [])
                        .concat(has(apps, 'neovim') ? ['# neovim: install the ' + p.label + ' colourscheme plugin, then `colorscheme`'] : [])
                });
            }
        }
        return out;
    }

    /* ── Shell script ───────────────────────────────────────────────────── */

    function buildManualScript(s) {
        const f = facts(s);
        const md = buildManualGuide(s);
        const L = [];

        L.push('#!/usr/bin/env bash');
        L.push('#');
        L.push('# Arch Linux install — generated by the Arch Guides manual walkthrough.');
        L.push('#');
        L.push('# READ THIS BEFORE RUNNING IT. It repartitions ' + f.disk + ' and does not');
        L.push('# ask twice. Nothing on that disk survives.');
        L.push('#');
        L.push('# The markdown guide explains why each command is here. This is the same');
        L.push('# sequence with the prose stripped out.');
        L.push('');
        L.push('set -Eeuo pipefail');
        if (s.verbosity === 'debug') {
            L.push('set -x        # debug verbosity: echo every command before running it');
        }
        if (s.verbosity === 'quiet') {
            L.push('exec 1>/dev/null   # quiet: suppress stdout, errors still reach stderr');
        }
        L.push('');
        L.push('trap \'echo "FAILED at line $LINENO. The disk may be half-configured." >&2\' ERR');
        L.push('');
        L.push('# A generated script that runs without you having read it is exactly the');
        L.push('# failure mode this project exists to avoid.');
        L.push('read -rp "Have you read this script in full? Type YES to continue: " ok');
        L.push('[[ "$ok" == "YES" ]] || { echo "Stopping."; exit 1; }');
        L.push('');
        L.push('lsblk');
        L.push('read -rp "Destroy everything on ' + f.disk + '? Type the disk path to confirm: " confirm');
        L.push('[[ "$confirm" == "' + f.disk + '" ]] || { echo "Mismatch. Stopping."; exit 1; }');
        L.push('');

        /* Pull every fenced bash block out of the markdown, in order. Building
           the script from the guide is what guarantees they cannot diverge. */
        const blocks = [];
        const lines = md.split('\n');
        let inBlock = false, buf = [];
        for (const line of lines) {
            if (line.trim() === '```bash') { inBlock = true; buf = []; continue; }
            if (inBlock && line.trim() === '```') { inBlock = false; blocks.push(buf.join('\n')); continue; }
            if (inBlock) buf.push(line);
        }
        blocks.forEach((b, i) => {
            L.push('# ── block ' + (i + 1) + ' ' + '─'.repeat(Math.max(0, 60 - String(i + 1).length)));
            L.push(b);
            L.push('');
        });

        L.push('echo "Done. Read the markdown guide for what to do after the first boot."');
        return L.join('\n');
    }

    window.buildManualGuide = buildManualGuide;
    window.buildManualScript = buildManualScript;
})();
