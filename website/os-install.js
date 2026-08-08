/* ============================================================================
   os-install.js — how each system actually installs, described once.
   ----------------------------------------------------------------------------
   os-meta.js says which systems exist and what they are called. This says what
   their commands are: how the base system gets onto the disk, how packages are
   installed, how services are enabled, and what each package is called there.

   Why it is a table rather than branches inside the emitters: the generator and
   the walkthrough both emit install commands, and every `if (os === 'gentoo')`
   written inside one of them is a chance for the two to disagree about what a
   Gentoo install looks like. They read the same table instead.

   ── The Arch entry must not change its output ───────────────────────────────
   Arch's templates reproduce, character for character, the commands that were
   hard-coded in the emitters before this file existed. `tests/permutations.mjs`
   holds 578 configs and 16,319 assertions against that output, and the standing
   constraint is that the count does not fall while other systems are added. If
   an Arch string here needs editing, that is a change to the Arch guide and
   should be made deliberately, not as a side effect of adding a system.

   ── Systems that are not built yet are absent, not approximated ─────────────
   A missing entry throws. That is the point: the failure this project keeps
   finding is a guide that silently prints one system's commands under another
   system's name, and an entry filled in with Arch's commands "for now" is
   exactly that bug with a table around it.

   Authority per system, cited because the commands came from there:
     Arch    — https://wiki.archlinux.org/title/Installation_guide
     Gentoo  — https://wiki.gentoo.org/wiki/Handbook:AMD64

   No dependencies. Exports onto the global object so it works both as a classic
   script in the browser and inside the test harnesses, which concatenate the
   website's scripts into one scope.
   ========================================================================= */

'use strict';

(function (root) {

    /* ── Package names ──────────────────────────────────────────────────────
       Keyed by the Arch name, because that is what the emitters already say.
       A system that calls a package something else gets an entry; a system that
       has no equivalent at all gets `null`, and the emitters must then say so
       rather than installing something approximate.

       Gentoo atoms are category/name from packages.gentoo.org. The category is
       part of the name: `emerge vim` and `emerge app-editors/vim` are not
       reliably the same request, because more than one category can hold a
       package with that name. */
    var PKG_NAMES = {
        gentoo: {
            'linux-firmware': 'sys-kernel/linux-firmware',
            'sudo': 'app-admin/sudo',
            'vim': 'app-editors/vim',
            'man-db': 'sys-apps/man-db',
            'man-pages': 'sys-apps/man-pages',
            'texinfo': 'sys-apps/texinfo',
            'btrfs-progs': 'sys-fs/btrfs-progs',
            'xfsprogs': 'sys-fs/xfsprogs',
            'e2fsprogs': 'sys-fs/e2fsprogs',
            'cryptsetup': 'sys-fs/cryptsetup',
            'lvm2': 'sys-fs/lvm2',
            'networkmanager': 'net-misc/networkmanager',
            'dhcpcd': 'net-misc/dhcpcd',
            'iwd': 'net-wireless/iwd',
            'grub': 'sys-boot/grub',
            'efibootmgr': 'sys-boot/efibootmgr',
            'zsh': 'app-shells/zsh',
            'fish': 'app-shells/fish',
            'intel-ucode': 'sys-firmware/intel-microcode',
            /* AMD microcode is not a separate package on Gentoo — it ships
               inside sys-kernel/linux-firmware, which the base install already
               pulls in. Mapping it to the firmware package rather than to a
               name that does not exist. */
            'amd-ucode': 'sys-kernel/linux-firmware',
            'cronie': 'sys-process/cronie',
            'sysklogd': 'app-admin/sysklogd',

            /* No equivalent. The emitters check for null and explain the
               absence instead of substituting something that merely sounds
               similar. */
            'base': null,              // the stage3 tarball is the base system
            'zram-generator': null     // Gentoo configures zram through its own init scripts
        }
    };

    /** Translate one Arch package name for the target system. */
    function pkgName(os, name) {
        var table = PKG_NAMES[os];
        if (!table) return name;                       // same names as Arch
        return Object.prototype.hasOwnProperty.call(table, name) ? table[name] : name;
    }

    /** Translate a list, dropping the ones that do not exist on that system. */
    function pkgNames(os, list) {
        var out = [];
        (list || []).forEach(function (n) {
            var mapped = pkgName(os, n);
            if (mapped) out.push(mapped);
        });
        return out;
    }

    /** What was dropped, so a guide can say why rather than going quiet. */
    function pkgUnavailable(os, list) {
        var out = [];
        (list || []).forEach(function (n) {
            if (pkgName(os, n) === null) out.push(n);
        });
        return out;
    }


    /* ── Init systems ───────────────────────────────────────────────────────
       Gentoo's init is a genuine choice rather than a fact about the system, so
       the service commands are looked up by init rather than by OS. Passing an
       init a system does not offer is a programming error and throws. */
    var INIT = {
        systemd: {
            label: 'systemd',
            enable: function (unit) { return 'systemctl enable ' + unit; },
            enableNow: function (unit) { return 'systemctl enable --now ' + unit; },
            /* systemd unit names carry a suffix; OpenRC script names do not.
               The emitters pass the bare name and this adds what is needed. */
            unit: function (name) { return name + '.service'; }
        },
        openrc: {
            label: 'OpenRC',
            enable: function (unit) { return 'rc-update add ' + unit + ' default'; },
            enableNow: function (unit) {
                return 'rc-update add ' + unit + ' default && rc-service ' + unit + ' start';
            },
            unit: function (name) { return name; }
        }
    };

    function initOf(os, answers) {
        var model = OS_INSTALL[os];
        if (!model) return INIT.systemd;
        if (model.init.fixed) return INIT[model.init.fixed];
        var chosen = answers && answers.init_system;
        return INIT[chosen] || INIT[model.init.dflt];
    }


    /* ── The install models ─────────────────────────────────────────────── */

    var OS_INSTALL = {

        arch: {
            family: 'arch',
            authority: 'https://wiki.archlinux.org/title/Installation_guide',
            /* Arch mounts the EFI system partition at /boot and puts the kernel
               there directly. Gentoo mounts it at /efi and keeps /boot on the
               root filesystem — the same partition, a different place, and
               getting it wrong produces a system that builds and will not
               boot. */
            espMount: '/boot',
            init: { fixed: 'systemd' },
            kernel: { model: 'binary', compiled: false },
            aur: true,

            sync: 'pacman -Sy',
            install: function (pkgs) {
                return 'pacman -S --needed --noconfirm ' + pkgs.join(' ');
            },
            upgrade: 'pacman -Syu --noconfirm',
            chroot: 'arch-chroot /mnt',
            fstab: 'genfstab -U /mnt >> /mnt/etc/fstab',
            initramfs: 'mkinitcpio -P'
        },

        gentoo: {
            family: 'gentoo',
            authority: 'https://wiki.gentoo.org/wiki/Handbook:AMD64',
            espMount: '/efi',
            /* Both are supported and the choice changes every service command
               below, which is why it gates other questions the way the desktop
               choice does. OpenRC is Gentoo's own and the default profile. */
            init: { dflt: 'openrc', choices: ['openrc', 'systemd'] },
            /* The reason someone runs Gentoo. Every package can be compiled for
               the machine it will run on, and the kernel is not shipped
               pre-built by default. */
            kernel: { model: 'source', compiled: true },
            aur: false,

            sync: 'emerge --sync',
            install: function (pkgs) {
                return 'emerge --verbose --noreplace ' + pkgs.join(' ');
            },
            upgrade: 'emerge --verbose --update --deep --changed-use @world',
            /* Gentoo has no arch-chroot wrapper: the bind mounts are done by
               hand first, then a plain chroot. Listed rather than folded into
               one string because each line is a separate failure point and the
               guide explains them individually. */
            chrootPrep: [
                'mount --types proc /proc /mnt/gentoo/proc',
                'mount --rbind /sys /mnt/gentoo/sys',
                'mount --make-rslave /mnt/gentoo/sys',
                'mount --rbind /dev /mnt/gentoo/dev',
                'mount --make-rslave /mnt/gentoo/dev',
                'mount --bind /run /mnt/gentoo/run',
                'mount --make-slave /mnt/gentoo/run'
            ],
            chroot: 'chroot /mnt/gentoo /bin/bash',
            chrootAfter: [
                'source /etc/profile',
                'export PS1="(chroot) ${PS1}"'
            ],
            /* No genfstab on Gentoo. fstab is written by hand, which is a real
               step the guide has to walk through rather than a command to
               print. */
            fstab: null,
            initramfs: null,

            /* Where the base system comes from. Not a package manager
               operation at all — a signed tarball, verified and unpacked. */
            stage3: {
                mirrorList: 'https://www.gentoo.org/downloads/mirrors/',
                path: 'releases/amd64/autobuilds/current-stage3-amd64-openrc/',
                keyImport: 'gpg --import /usr/share/openpgp-keys/gentoo-release.asc',
                verify: function (file) { return 'gpg --verify ' + file + '.asc ' + file; },
                unpack: function (file) {
                    return 'tar xpvf ' + file + " --xattrs-include='*.*' " +
                           '--numeric-owner -C /mnt/gentoo';
                }
            }
        }
    };

    /**
     * The install model for a system, or a thrown error naming what is missing.
     *
     * Loud on purpose. A silent fallback to Arch here would print pacstrap and
     * pacman under another system's heading, which is the single defect class
     * this project has spent the most time removing.
     */
    function installModel(os) {
        var model = OS_INSTALL[os];
        if (!model) {
            throw new Error('os-install.js: no install model for "' + os +
                            '". Its emitters have not been written, so there is ' +
                            'nothing honest to generate for it.');
        }
        return model;
    }

    /** True when a system has an install model, for callers that must not throw. */
    function hasInstallModel(os) {
        return Object.prototype.hasOwnProperty.call(OS_INSTALL, os);
    }

    root.OS_INSTALL = OS_INSTALL;
    root.OS_INIT = INIT;
    root.osInstallModel = installModel;
    root.osHasInstallModel = hasInstallModel;
    root.osInitOf = initOf;
    root.osPkgName = pkgName;
    root.osPkgNames = pkgNames;
    root.osPkgUnavailable = pkgUnavailable;

})(typeof window !== 'undefined' ? window : this);
