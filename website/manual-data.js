/* ============================================================================
   manual-data.js — the question set behind the manual walkthrough.
   ----------------------------------------------------------------------------
   Declarative on purpose. Every question is data: what it asks, when it applies,
   what each answer means, which wiki section explains it, and what it
   contributes to the generated guide. The renderer in manual.js knows nothing
   about Arch; it only knows how to draw a question and collect an answer.

   That split is what keeps this at parity with the dynamic generator. Adding an
   option means adding it here once, and it appears in the walkthrough, in the
   markdown guide, in the shell script and in the exported JSON together —
   rather than in three places that drift.

   Field reference
     id        state key
     title     the question
     help      tooltip body; every question has one
     wiki      anchor in wiki.html, reached by right-click as well
     type      'choice' | 'multi' | 'text' | 'bool'
     when      (s) => boolean; omit for "always"
     options   [{ value, label, desc, note?, recommended?, danger?, locks? }]
     validate  (value, s) => null | 'message'
     section   heading the emitted guide steps are filed under
   ========================================================================= */

'use strict';

/* Values Dusky fixes for you. Selecting it locks these rather than silently
   overriding them, so you can see what the choice costs before you make it.
   Every key here must be the id of a real step and every value must be one of
   that step's option values — a key that matches nothing locks nothing, and a
   value that matches no option leaves the question with no answer to carry
   forward. `tests/dusky-locks.mjs` fails the build if either stops holding. */
const DUSKY_LOCKS = {
    display_server: 'wayland',
    shell: 'zsh',
    font: 'jetbrains-mono-nerd',
    palette: 'tokyo-night'
};

/* Dusky, by dusklinux. Worth being precise about what it is: a dotfiles and
   install-script project for Hyprland on Wayland, not a separate operating
   system and nothing to do with dwm. It ships Waybar, Rofi, Swaync, Wlogout and
   SDDM. Links kept together so the credit stays correct everywhere it appears. */
const DUSKY_REPO = 'https://github.com/dusklinux/dusky';
/* The wallpapers are a separate repository from Dusky itself, which is why they
   are offered to anyone with a desktop rather than only to Dusky users. Two
   folders: dark/ 135 files, light/ 134 — 269 in total, ~40 MB. */
const DUSKY_IMAGES = 'https://github.com/dusklinux/images';
const DUSKY_VIDEO = 'https://www.youtube.com/watch?v=JmgvSdEIK8c';
const DUSKY_CHANNEL = 'https://www.youtube.com/@dusk_everyday';

const STEPS = [

/* ── Architecture ──────────────────────────────────────────────────────── */
{
    id: 'arch',
    section: 'Before you start',
    title: 'Which CPU architecture are you installing on?',
    help: 'Everything downstream depends on this. x86_64 is any Intel or AMD ' +
          'desktop or laptop. aarch64 is 64-bit ARM: Raspberry Pi, Pine64, ' +
          'most ARM servers. Run "uname -m" on the machine if you are unsure. ' +
          'Getting this wrong does not produce a slightly worse install, it ' +
          'produces a script that cannot work.',
    wiki: 'architecture',
    type: 'choice',
    options: [
        { value: 'x86_64', label: 'x86_64 (Intel / AMD)', recommended: true,
          desc: 'Standard PC. UEFI firmware, an EFI system partition, CPU ' +
                'microcode, and Secure Boot available.' },
        { value: 'aarch64', label: 'aarch64 (64-bit ARM)',
          desc: 'Raspberry Pi, Pine64, ARM servers. Uses Arch Linux ARM — a ' +
                'different project with different mirrors and signing keys — ' +
                'and boots via a device tree rather than an EFI executable.' }
    ]
},
{
    id: 'board',
    section: 'Before you start',
    title: 'Which ARM board?',
    help: 'ARM boards do not share a boot path the way PCs do. The board ' +
          'decides whether you get UEFI, U-Boot, or vendor firmware in an ' +
          'EEPROM, and which device tree the kernel needs.',
    wiki: 'arch-arm',
    when: s => s.arch === 'aarch64',
    type: 'choice',
    options: [
        { value: 'rpi', label: 'Raspberry Pi 4 / 5',
          desc: 'Bootloader lives in an on-board EEPROM that runs before ' +
                'anything you control. No UEFI Secure Boot.' },
        { value: 'uefi-arm', label: 'ARM board with UEFI (EDK2)', recommended: true,
          desc: 'Ampere, some Rockchip boards, ARM VMs. Closest to the x86 ' +
                'path: an ESP and an EFI bootloader.' },
        { value: 'uboot', label: 'Generic U-Boot SBC',
          desc: 'Pine64, Odroid, most SBCs. Boots via extlinux.conf or ' +
                'boot.scr plus a device tree.' }
    ]
},

{
    id: 'libre',
    section: 'Before you start',
    title: 'Enforce a strictly libre software policy?',
    help: 'On, the guide refuses anything with proprietary or closed-source ' +
          'components: no microcode, no proprietary graphics drivers, no ' +
          'Discord, no Steam. Off, you get microcode and the drivers your ' +
          'hardware actually needs.',
    wiki: 'libre-policy',
    type: 'bool',
    options: [
        { value: 'yes', label: 'Yes, libre only',
          desc: 'Anything with a proprietary component is excluded and the ' +
                'guide says what you are giving up.' },
        { value: 'no', label: 'No', recommended: true,
          desc: 'Microcode and proprietary drivers permitted.' }
    ]
},

/* ── Dual boot ─────────────────────────────────────────────────────────── */
{
    id: 'dualboot',
    section: 'Before you start',
    title: 'Is anything else staying on this machine?',
    help: 'Dual booting is the most common way people lose data during an ' +
          'Arch install. What you pick here changes the partitioning, whether ' +
          'the EFI system partition is created or reused, and which warnings ' +
          'the guide gives you.',
    wiki: 'dual-boot',
    type: 'choice',
    options: [
        { value: 'none', label: 'No — this disk is only for Arch', recommended: true,
          desc: 'The whole disk gets repartitioned. Simplest, and nothing ' +
                'else can be broken by it.',
          danger: 'Everything currently on the target disk is destroyed.' },
        { value: 'windows', label: 'Windows 10 or 11',
          desc: 'Shares the existing EFI system partition. Adds the Fast ' +
                'Startup, BitLocker and RTC steps, and the guide will refuse ' +
                'to format the ESP.' },
        { value: 'linux', label: 'Another Linux distribution',
          desc: 'Shares the ESP and, usually, the bootloader. Adds os-prober ' +
                'or a manual loader entry.' },
        { value: 'arch', label: 'An existing Arch install',
          desc: 'Reuses the ESP; you choose whether to share /home.' }
    ]
},
{
    id: 'dualboot_esp',
    section: 'Before you start',
    title: 'Where is the existing EFI system partition?',
    help: 'Run "lsblk -f" on the running system. The ESP is the small FAT32 ' +
          'partition, usually 100-500 MiB, with partition type EF00. This ' +
          'partition is mounted, never formatted — formatting it deletes the ' +
          'other operating system\'s bootloader.',
    wiki: 'dual-boot-esp',
    when: s => s.dualboot && s.dualboot !== 'none',
    type: 'text',
    placeholder: '/dev/nvme0n1p1',
    validate: v => /^\/dev\/[a-z0-9]+p?\d+$/.test(v.trim())
        ? null
        : 'Needs a partition path such as /dev/nvme0n1p1 or /dev/sda1.'
},

/* ── Disk ──────────────────────────────────────────────────────────────── */
{
    id: 'disk',
    section: 'Disk',
    title: 'Which disk are you installing to?',
    help: 'This is the single most destructive value in the whole guide — every ' +
          'partitioning command is aimed at it, and they do not ask twice. ' +
          'Identify the disk by its size and model, never by the name you ' +
          'expect: device names are assigned in the order the kernel finds ' +
          'them, so the disk that was /dev/sda last week can be /dev/sdb today.',
    /* How to actually find it. The old help text said "run lsblk" and left it
       there, which is not much use if you have never read lsblk output or do not
       know why the name has a `p` in it on one machine and not on another. */
    howto: {
        intro: 'In the live environment, list what is attached:',
        command: 'lsblk -o NAME,SIZE,MODEL,TRAN,MOUNTPOINTS',
        reading: 'Look for the row with no parent indentation and the size you ' +
                 'expect. Its children are existing partitions — if it has ' +
                 'some, there is data on this disk. Cross-check the MODEL ' +
                 'column against the drive you mean to erase.',
        naming: [
            ['/dev/nvme0n1', 'An NVMe SSD. "n1" is the first namespace on controller 0. ' +
                             'Partitions get a p: /dev/nvme0n1p1.'],
            ['/dev/sda',     'SATA or USB — an SSD, a hard disk, or the stick you booted from. ' +
                             'Partitions have no p: /dev/sda1.'],
            ['/dev/mmcblk0', 'An SD card or eMMC, common on ARM boards. ' +
                             'Partitions get a p: /dev/mmcblk0p1.'],
            ['/dev/vda',     'A virtio disk — you are in a virtual machine.']
        ],
        warn: 'Enter the whole disk, not a partition: /dev/nvme0n1, not ' +
              '/dev/nvme0n1p2. And make sure it is not the USB stick you are ' +
              'running from — check TRAN for "usb".'
    },
    wiki: 'target-disk',
    type: 'text',
    placeholder: '/dev/nvme0n1',
    validate: v => {
        v = v.trim();
        // Named partitions are the mistake people actually make, so say which
        // one they typed rather than restating the rule.
        var part = /^\/dev\/(nvme\d+n\d+p|mmcblk\d+p|loop\d+p)(\d+)$/.exec(v)
                || /^\/dev\/([a-z]+d[a-z])(\d+)$/.exec(v);
        if (part) {
            return 'That is partition ' + part[2] + ' of a disk, not the disk. Drop the ' +
                   'trailing ' + (/p\d+$/.test(v) ? '"p' + part[2] + '"' : '"' + part[2] + '"') + '.';
        }
        return /^\/dev\/[a-z0-9]+$/.test(v)
            ? null
            : 'Needs a whole-disk path such as /dev/nvme0n1, /dev/sda or /dev/mmcblk0.';
    }
},
{
    id: 'encryption',
    section: 'Disk',
    title: 'Encrypt the disk?',
    help: 'Full-disk encryption is what makes a stolen laptop a stolen laptop ' +
          'rather than a data breach. It costs you a passphrase at every boot ' +
          'and nothing else. LUKS2 with Argon2id is the current default and ' +
          'resists GPU brute-forcing far better than LUKS1.',
    wiki: 'partitioning',
    type: 'choice',
    options: [
        { value: 'luks2', label: 'LUKS2 with Argon2id', recommended: true,
          desc: 'Modern defaults, memory-hard key derivation. Requires a ' +
                'bootloader that can read a LUKS2 header, so not Legacy BIOS ' +
                'GRUB.' },
        { value: 'luks1', label: 'LUKS1',
          desc: 'Only if you are constrained to Legacy BIOS with GRUB. PBKDF2 ' +
                'rather than Argon2id, so a weak passphrase falls much faster.' },
        { value: 'none', label: 'No encryption',
          desc: 'Reasonable for a desktop that never leaves a room you ' +
                'control. Anyone who picks the machine up reads everything.',
          danger: 'Anyone with physical access reads every file, including ' +
                  'your saved passwords and SSH keys.' }
    ]
},
{
    id: 'filesystem',
    section: 'Disk',
    title: 'Which filesystem?',
    help: 'Btrfs gives you snapshots, so a bad update is one rollback away, ' +
          'at the cost of subvolumes to lay out and its own tooling. ext4 is ' +
          'the fewest moving parts and is extremely well understood.',
    wiki: 'filesystem',
    type: 'choice',
    options: [
        { value: 'btrfs', label: 'Btrfs with subvolumes', recommended: true,
          desc: 'Snapshots, compression, and rollback. The guide lays out ' +
                '@, @home, @log, @pkg and @snapshots so a rollback does not ' +
                'also roll back your logs or re-download the package cache.' },
        { value: 'ext4', label: 'ext4',
          desc: 'Format and forget. No snapshots.' },
        { value: 'xfs', label: 'XFS',
          desc: 'Good with large files. No snapshots; cannot be shrunk.' }
    ]
},
{
    id: 'swap',
    section: 'Disk',
    title: 'Swap?',
    help: 'zram compresses swap in RAM and is the sensible default on almost ' +
          'any modern machine. A swap file or partition is only needed if you ' +
          'want hibernation, which needs swap at least as large as RAM.',
    wiki: 'swap_size',
    type: 'choice',
    options: [
        { value: 'zram', label: 'zram (compressed, in RAM)', recommended: true,
          desc: 'No disk space used, no plaintext of your memory written to ' +
                'disk. Cannot hibernate.' },
        { value: 'swapfile', label: 'Swap file on disk',
          desc: 'Resizable later. Inside the encrypted volume, so hibernation ' +
                'images stay encrypted.' },
        { value: 'partition', label: 'Dedicated swap partition',
          desc: 'Traditional. Fixed size.' },
        { value: 'none', label: 'None',
          desc: 'Fine with plenty of RAM. The OOM killer becomes your memory ' +
                'management strategy.' }
    ]
},

/* ── Boot ──────────────────────────────────────────────────────────────── */
{
    id: 'firmware',
    section: 'Boot',
    title: 'Firmware mode',
    help: 'Check with "ls /sys/firmware/efi" from the live environment — if ' +
          'that directory exists you booted UEFI. Legacy BIOS restricts you ' +
          'to GRUB and LUKS1 and rules out Secure Boot entirely.',
    wiki: 'firmware',
    when: s => s.arch === 'x86_64',
    type: 'choice',
    options: [
        { value: 'uefi', label: 'UEFI', recommended: true,
          desc: 'Required for unified kernel images, systemd-boot and Secure ' +
                'Boot.' },
        { value: 'bios', label: 'Legacy BIOS / CSM',
          desc: 'GRUB only, LUKS1 only, no Secure Boot.',
          note: 'Selecting this restricts encryption to LUKS1 and the ' +
                'bootloader to GRUB.' }
    ]
},
{
    id: 'bootloader',
    section: 'Boot',
    title: 'Which bootloader?',
    help: 'A unified kernel image bundles kernel, initramfs and command line ' +
          'into one signed EFI file, which is what makes Secure Boot with ' +
          'your own keys meaningful. systemd-boot is the simplest thing that ' +
          'works on UEFI. GRUB is the only option on Legacy BIOS.',
    wiki: 'bootloader',
    when: s => s.arch === 'x86_64',
    type: 'choice',
    options: [
        { value: 'uki', label: 'Unified Kernel Image + your own Secure Boot keys',
          recommended: true,
          desc: 'Strongest boot chain. Kernel, initramfs and cmdline in one ' +
                'signed file, so the command line cannot be edited at the ' +
                'boot menu.',
          note: 'Needs a 1 GiB ESP — two UKIs plus a fallback do not fit in 512 MiB.' },
        { value: 'systemd-boot', label: 'systemd-boot',
          desc: 'Small, no configuration language, reads loader entries from ' +
                'the ESP.' },
        { value: 'grub', label: 'GRUB',
          desc: 'Most features, most configuration, works on BIOS and with ' +
                'many operating systems side by side.' }
    ]
},
{
    id: 'arm_boot',
    section: 'Boot',
    title: 'How does this board boot?',
    help: 'ARM boards do not agree on a boot mechanism. This decides whether ' +
          'the guide writes an EFI loader entry, an extlinux.conf, or the ' +
          'Raspberry Pi config.txt and cmdline.txt.',
    wiki: 'arch-arm',
    when: s => s.arch === 'aarch64',
    type: 'choice',
    options: [
        { value: 'rpi-firmware', label: 'Raspberry Pi firmware (config.txt)',
          when: s => s.board === 'rpi',
          desc: 'The EEPROM bootloader loads start.elf, which loads the ' +
                'kernel and device tree from a FAT partition.' },
        { value: 'extlinux', label: 'U-Boot / extlinux.conf', recommended: true,
          desc: 'The common SBC path. A text file listing kernel, initramfs ' +
                'and device tree.' },
        { value: 'efi-arm', label: 'UEFI bootloader (systemd-boot or GRUB)',
          desc: 'For boards whose firmware implements UEFI.' }
    ]
},
{
    id: 'secureboot',
    section: 'Boot',
    title: 'Secure Boot',
    help: 'Secure Boot stops the firmware executing an unsigned bootloader. ' +
          'Enrolling your own keys means you decide what may boot, rather ' +
          'than a third-party certificate authority. Turning it off for Arch ' +
          'also lowers the bar for any other operating system on the machine.',
    wiki: 'bootloader',
    when: s => s.arch === 'x86_64' && s.firmware === 'uefi',
    type: 'choice',
    options: [
        { value: 'own-keys', label: 'Enrol my own keys', recommended: true,
          desc: 'Generate PK, KEK and db, sign the bootloader and the UKI, ' +
                'enrol them in firmware setup mode.',
          note: 'Back up the existing keys first, and know how to clear them ' +
                'from firmware setup before you start.' },
        { value: 'shim', label: 'shim with the Microsoft-signed chain',
          desc: 'Works without touching firmware keys. You are trusting ' +
                'Microsoft\'s CA.' },
        { value: 'off', label: 'Leave Secure Boot off',
          desc: 'Simplest. Anything that can write to the ESP can replace ' +
                'your bootloader.' }
    ]
},
{
    id: 'kernels',
    section: 'Boot',
    title: 'Which kernels? (pick at least one)',
    help: 'Installing two is cheap insurance: if an update breaks the main ' +
          'kernel you can boot the other one and fix it. linux-hardened ' +
          'trades some performance and some out-of-tree driver compatibility ' +
          'for exploit mitigations.',
    wiki: 'kernel-main',
    type: 'multi',
    options: [
        { value: 'linux', label: 'linux (mainline)', recommended: true,
          desc: 'Current stable. What most guidance assumes.' },
        { value: 'linux-lts', label: 'linux-lts', recommended: true,
          desc: 'Long-term support. The one you boot when an update breaks ' +
                'the other.' },
        { value: 'linux-hardened', label: 'linux-hardened',
          desc: 'Upstream hardening patches and stricter defaults. Some ' +
                'proprietary and out-of-tree modules will not build.' },
        { value: 'linux-zen', label: 'linux-zen',
          desc: 'Desktop responsiveness tuning.' }
    ],
    validate: v => (v && v.length) ? null : 'Pick at least one kernel — the system needs something to boot.'
},
{
    id: 'microcode',
    section: 'Boot',
    title: 'CPU microcode',
    help: 'Microcode updates fix CPU errata, including the ones behind ' +
          'speculative-execution vulnerabilities. Loaded early by the ' +
          'initramfs. There is no equivalent on ARM — firmware comes from the ' +
          'board vendor.',
    wiki: 'cpu_brand',
    // Not asked under a libre policy: microcode is a proprietary blob, so the
    // answer is already decided and offering it produced a summary that
    // disagreed with the packages actually installed.
    when: s => s.arch === 'x86_64' && s.libre !== 'yes',
    type: 'choice',
    options: [
        { value: 'intel-ucode', label: 'Intel', desc: 'Installs intel-ucode.' },
        { value: 'amd-ucode', label: 'AMD', desc: 'Installs amd-ucode.' },
        { value: 'none', label: 'Skip',
          desc: 'Only if you are enforcing a strictly libre policy — microcode ' +
                'is a proprietary blob.',
          note: 'Skipping leaves known CPU errata unmitigated.' }
    ]
},

/* ── System ────────────────────────────────────────────────────────────── */
{
    id: 'hostname',
    section: 'System',
    title: 'Hostname',
    help: 'The machine\'s name on your network. Letters, digits and hyphens.',
    wiki: 'manual-install',
    type: 'text',
    placeholder: 'archbox',
    validate: v => /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(v.trim())
        ? null
        : 'Letters, digits and hyphens only, and it cannot start or end with a hyphen.'
},
{
    id: 'username',
    section: 'System',
    title: 'Your username',
    help: 'The everyday account. It goes in the wheel group so it can use ' +
          'sudo; you should not be logging in as root.',
    wiki: 'manual-install',
    type: 'text',
    placeholder: 'you',
    validate: v => /^[a-z_][a-z0-9_-]{0,31}$/.test(v.trim())
        ? null
        : 'Lower-case letters, digits, underscore and hyphen, starting with a letter or underscore.'
},
{
    id: 'timezone',
    section: 'System',
    title: 'Time zone',
    help: 'An IANA zone name — the "Region/City" form. On the installed system ' +
          '"timedatectl list-timezones" lists every one of them. The hardware ' +
          'clock is kept in UTC; if you dual boot Windows the guide adds the ' +
          'step that stops the two disagreeing about the time.',
    wiki: 'manual-install',
    type: 'text',
    placeholder: 'Europe/London',
    /* Offer the browser's own zone as a one-click fill. It is the one answer
       this page can work out for itself, and typing "America/Argentina/Buenos_Aires"
       by hand on a phone is how people end up with the wrong clock. Still
       editable — a machine is not always installed in the zone it is set up in,
       and the detected value is presented as a suggestion, not an assumption. */
    suggest: () => {
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (!tz || tz.indexOf('/') === -1) return null;   // "UTC" alone is not a zone name
            return { value: tz, label: 'Use ' + tz, note: 'detected from your browser' };
        } catch (_) { return null; }        // very old engine, or Intl stripped
    },
    validate: v => /^[A-Za-z]+\/[A-Za-z_+-]+(\/[A-Za-z_+-]+)?$/.test(v.trim())
        ? null
        : 'Needs a zone such as Europe/London, America/New_York or Australia/Sydney.'
},
{
    id: 'locale',
    section: 'System',
    title: 'Locale',
    help: 'Sets language, date format, sort order and currency. UTF-8 ' +
          'variants only — anything else will bite you the first time a ' +
          'filename has an accent in it.',
    wiki: 'manual-install',
    type: 'choice',
    options: [
        { value: 'en_GB.UTF-8', label: 'en_GB.UTF-8', desc: 'British English.' },
        { value: 'en_US.UTF-8', label: 'en_US.UTF-8', recommended: true,
          desc: 'US English. What most documentation assumes.' },
        { value: 'de_DE.UTF-8', label: 'de_DE.UTF-8', desc: 'German.' },
        { value: 'fr_FR.UTF-8', label: 'fr_FR.UTF-8', desc: 'French.' }
    ]
},
{
    id: 'keymap',
    section: 'System',
    title: 'Console keymap',
    help: 'The console layout, used before any desktop starts. Get this ' +
          'wrong and your disk passphrase will not type the way you expect ' +
          'at the boot prompt.',
    wiki: 'manual-install',
    type: 'choice',
    options: [
        { value: 'us', label: 'us', recommended: true, desc: 'US QWERTY.' },
        { value: 'uk', label: 'uk', desc: 'UK QWERTY.' },
        { value: 'de', label: 'de', desc: 'German QWERTZ.' },
        { value: 'fr', label: 'fr', desc: 'French AZERTY.' }
    ]
},
{
    id: 'mirror_country',
    section: 'System',
    title: 'Which country for package mirrors?',
    help: 'reflector builds your pacman mirror list from the servers closest ' +
          'to you and ranks them by download speed, so the install pulls ' +
          'packages fast. Pick where you are — the guide fetches that country\'s ' +
          'mirrors, ranks them, and writes the list.',
    wiki: 'manual-install',
    type: 'choice',
    options: [
        { value: 'auto', label: 'Detect from my location (worldwide, ranked by speed)',
          recommended: true,
          desc: 'reflector picks the fastest recently-synced mirrors regardless ' +
                'of country. Safe default if you are unsure.' },
        { value: 'US', label: 'United States', desc: 'US mirrors.' },
        { value: 'GB', label: 'United Kingdom', desc: 'UK mirrors.' },
        { value: 'DE', label: 'Germany', desc: 'German mirrors.' },
        { value: 'FR', label: 'France', desc: 'French mirrors.' },
        { value: 'CA', label: 'Canada', desc: 'Canadian mirrors.' },
        { value: 'AU', label: 'Australia', desc: 'Australian mirrors.' },
        { value: 'NZ', label: 'New Zealand', desc: 'New Zealand mirrors.' },
        { value: 'JP', label: 'Japan', desc: 'Japanese mirrors.' },
        { value: 'SG', label: 'Singapore', desc: 'Singapore mirrors.' },
        { value: 'IN', label: 'India', desc: 'Indian mirrors.' },
        { value: 'BR', label: 'Brazil', desc: 'Brazilian mirrors.' },
        { value: 'NL', label: 'Netherlands', desc: 'Dutch mirrors.' },
        { value: 'SE', label: 'Sweden', desc: 'Swedish mirrors.' }
    ]
},
{
    id: 'mirror_https',
    section: 'System',
    title: 'Restrict mirrors to HTTPS?',
    help: 'HTTPS mirrors protect the package list and databases in transit. ' +
          'Package contents are signed and verified by pacman regardless, so ' +
          'plain HTTP is not a compromise of package integrity — but HTTPS ' +
          'hides which packages you are installing from anyone watching the ' +
          'connection, and is the safer default.',
    wiki: 'manual-install',
    type: 'bool',
    options: [
        { value: 'yes', label: 'HTTPS only', recommended: true,
          desc: 'reflector is told --protocol https, so only encrypted mirrors ' +
                'are used.' },
        { value: 'no', label: 'Allow HTTP too',
          desc: 'A larger mirror pool, occasionally faster. Package signatures ' +
                'still verify, but observers can see what you install.' }
    ]
},
/* ── Desktop ───────────────────────────────────────────────────────────── */
{
    id: 'desktop',
    section: 'Desktop',
    title: 'Desktop environment',
    help: 'Nothing here is required to have a working system. Get the base ' +
          'system booting first — debugging a desktop is much easier from ' +
          'something you know boots.',
    wiki: 'desktop',
    type: 'choice',
    options: [
        { value: 'dusky', label: 'Dusky (preconfigured Hyprland rice)',
          desc: 'A complete Hyprland-on-Wayland desktop by dusklinux, installed ' +
                'from its own scripts. It is a dotfiles project, not a separate ' +
                'operating system — you are still running Arch. It brings its ' +
                'own Waybar, Rofi, Swaync and Wlogout, and decides your ' +
                'compositor, shell, font and colour scheme, so those questions ' +
                'lock and each one says what Dusky set it to.',
          note: 'Locks display server, shell, font and palette. Repo: ' + DUSKY_REPO +
                ' · Video: ' + DUSKY_VIDEO,
          locks: DUSKY_LOCKS },
        { value: 'hyprland', label: 'Hyprland (unconfigured)', recommended: true,
          desc: 'The compositor, with none of the rice. You configure it.' },
        { value: 'dwm', label: 'dwm',
          desc: 'Suckless tiling window manager on Xorg. Configured by ' +
                'recompiling it.' },
        { value: 'gnome', label: 'GNOME', desc: 'Full desktop, Wayland by default.' },
        { value: 'kde', label: 'KDE Plasma', desc: 'Full desktop, very configurable.' },
        { value: 'none', label: 'No GUI',
          desc: 'A console. Correct for a server, and the fastest way to a ' +
                'system you understand.' }
    ]
},
{
    id: 'display_server',
    section: 'Desktop',
    title: 'Display server',
    help: 'Wayland isolates clients from each other, so one window cannot ' +
          'read another\'s keystrokes or screen. Xorg cannot make that ' +
          'guarantee, but some older applications and some accessibility ' +
          'tools still need it.',
    wiki: 'display_server',
    when: s => s.desktop && s.desktop !== 'none',
    type: 'choice',
    options: [
        { value: 'wayland', label: 'Wayland', recommended: true,
          desc: 'Client isolation by design. The default for Hyprland, GNOME ' +
                'and Plasma.' },
        { value: 'xorg', label: 'Xorg',
          desc: 'Required by dwm and some legacy applications. Any X client ' +
                'can read any other X client\'s input.' }
    ]
},
{
    id: 'font',
    section: 'Desktop',
    title: 'Monospace font',
    help: 'The font your terminal and editor use. Nerd Font variants include ' +
          'the glyphs that status bars and shell prompts expect; without ' +
          'them you get boxes.',
    wiki: 'desktop',
    when: s => s.desktop && s.desktop !== 'none',
    type: 'choice',
    options: [
        { value: 'jetbrains-mono-nerd', label: 'JetBrains Mono Nerd Font', recommended: true,
          desc: 'ttf-jetbrains-mono-nerd. Wide, very legible, full glyph coverage.' },
        { value: 'fira-code-nerd', label: 'FiraCode Nerd Font',
          desc: 'ttf-firacode-nerd. Programming ligatures.' },
        { value: 'cascadia-code', label: 'Cascadia Code',
          desc: 'ttf-cascadia-code-nerd. Microsoft\'s terminal font.' },
        { value: 'iosevka', label: 'Iosevka',
          desc: 'ttc-iosevka. Narrow — fits more columns on a small screen.' },
        { value: 'hack', label: 'Hack',
          desc: 'ttf-hack-nerd. Plain and dependable.' }
    ]
},
{
    id: 'palette',
    section: 'Desktop',
    title: 'Colour palette',
    help: 'Applied to the terminal, the editor and the shell prompt so they ' +
          'agree with each other. All of these are dark schemes designed for ' +
          'long sessions.',
    wiki: 'desktop',
    when: s => s.desktop && s.desktop !== 'none',
    type: 'choice',
    options: [
        { value: 'tokyo-night', label: 'Tokyo Night', recommended: true,
          desc: 'What this site uses. Deep blue-grey with magenta and cyan accents.' },
        { value: 'catppuccin-mocha', label: 'Catppuccin Mocha', desc: 'Soft, low contrast, pastel.' },
        { value: 'gruvbox-dark', label: 'Gruvbox Dark', desc: 'Warm, retro, high contrast.' },
        { value: 'nord', label: 'Nord', desc: 'Cool arctic blues, deliberately muted.' },
        { value: 'dracula', label: 'Dracula', desc: 'Purple and pink on near-black.' },
        { value: 'rose-pine', label: 'Rosé Pine', desc: 'Muted rose and pine, low glare.' },
        { value: 'everforest', label: 'Everforest', desc: 'Green, soft, easy on the eyes.' }
    ]
},
/* ── Wallpapers ─────────────────────────────────────────────────────────────
   dusklinux publishes a wallpaper collection separately from Dusky itself, so it
   is offered to everyone with a desktop rather than only to Dusky users — the
   images have nothing to do with the compositor.

   Counts are real, checked against the repository: dark/ has 135 files and
   light/ has 134, so 269 in total at roughly 65–285 KB each — about 40 MB for
   the lot. That is why the count is a question rather than an assumption. */
{
    id: 'wallpapers',
    section: 'Desktop',
    title: 'Wallpapers',
    help: 'dusklinux publishes 269 wallpapers — 135 dark and 134 light. This is ' +
          'a separate collection from Dusky itself, so you can take the ' +
          'wallpapers without the desktop or the desktop without the ' +
          'wallpapers. Downloading all of them is about 40 MB.',
    wiki: 'desktop',
    when: s => s.desktop && s.desktop !== 'none',
    type: 'choice',
    options: [
        { value: 'none', label: 'None', recommended: true,
          desc: 'Skip it. Nothing is downloaded and no directory is created.' },
        { value: 'dark', label: 'Dark only',
          desc: '135 available. Matches every palette offered above, all of which are dark.' },
        { value: 'light', label: 'Light only',
          desc: '134 available. For a light desktop, or a bright room.' },
        { value: 'mixed', label: 'A mix of both',
          desc: 'Both folders, split by the percentage you choose next.' }
    ]
},
{
    id: 'wallpaper_count',
    section: 'Desktop',
    title: 'How many wallpapers?',
    help: 'Picked at random from the collection each time the command runs, so ' +
          'you get a different set rather than always the first N. All 269 is ' +
          'about 40 MB; 50 is about 7 MB.',
    wiki: 'desktop',
    when: s => s.wallpapers && s.wallpapers !== 'none',
    type: 'choice',
    options: [
        { value: '10',  label: '10',  desc: 'About 1.5 MB. Enough to try the look.' },
        { value: '25',  label: '25',  desc: 'About 4 MB.' },
        { value: '50',  label: '50',  recommended: true, desc: 'About 7 MB. Plenty for a rotation.' },
        { value: '100', label: '100', desc: 'About 15 MB.' },
        { value: 'all', label: 'Every one',
          desc: 'All 269, about 40 MB. Capped at what the chosen folders actually hold.' }
    ]
},
{
    id: 'wallpaper_split',
    section: 'Desktop',
    title: 'How should the mix be split?',
    help: 'The share taken from the dark folder; the rest comes from light. ' +
          'Rounded to whole images, and capped at what each folder holds.',
    wiki: 'desktop',
    when: s => s.wallpapers === 'mixed',
    type: 'choice',
    options: [
        { value: '90', label: '90% dark / 10% light', desc: 'Almost all dark, a few light.' },
        { value: '75', label: '75% dark / 25% light', recommended: true,
          desc: 'Mostly dark. Matches the palettes offered above.' },
        { value: '50', label: '50% dark / 50% light', desc: 'An even split.' },
        { value: '25', label: '25% dark / 75% light', desc: 'Mostly light.' },
        { value: '10', label: '10% dark / 90% light', desc: 'Almost all light.' }
    ]
},
{
    id: 'shell',
    section: 'Desktop',
    title: 'Login shell',
    help: 'bash is what every guide on the internet assumes. zsh with a ' +
          'prompt framework is the common upgrade. fish is friendlier out of ' +
          'the box but is not POSIX, so pasted shell snippets can fail.',
    wiki: 'desktop',
    type: 'choice',
    options: [
        { value: 'bash', label: 'bash', recommended: true, desc: 'Default. Nothing to install.' },
        { value: 'zsh', label: 'zsh', desc: 'Completion and prompt customisation.' },
        { value: 'fish', label: 'fish', desc: 'Good defaults, not POSIX-compatible.' }
    ]
},
{
    id: 'ricing',
    section: 'Desktop',
    title: 'Ricing toolkit — the pieces that make a window manager usable',
    help: 'A bare tiling window manager has no bar, no launcher, no notifications ' +
          'and no wallpaper — you assemble those yourself. This is where a rice ' +
          'comes from. Pick the pieces you want; the guide installs and points ' +
          'you at configuring each. These are separate from ordinary apps ' +
          'because they define the desktop rather than run on it. Dusky ships ' +
          'its own set preconfigured, so this is skipped when you pick it.',
    wiki: 'advanced-config-themes',
    optional: true,
    when: s => s.desktop && ['hyprland', 'dwm'].indexOf(s.desktop) !== -1,
    type: 'multi',
    options: [
        { value: 'rofi', label: 'rofi / wofi — app launcher', recommended: true,
          desc: 'The search-and-launch menu. wofi is the Wayland-native one; ' +
                'rofi works on both and is what Dusky uses.' },
        { value: 'waybar', label: 'waybar / polybar — status bar', recommended: true,
          desc: 'The top bar: workspaces, clock, battery, tray. waybar on ' +
                'Wayland, polybar on Xorg.' },
        { value: 'dunst', label: 'dunst / mako — notifications', recommended: true,
          desc: 'Draws desktop notifications. mako on Wayland, dunst on Xorg.' },
        { value: 'wallpaper', label: 'hyprpaper / feh — wallpaper',
          desc: 'Sets the desktop background. hyprpaper on Wayland, feh on Xorg.' },
        { value: 'picom', label: 'picom — compositor (Xorg only)',
          when: s => s.display_server === 'xorg',
          desc: 'Shadows, transparency and vsync on Xorg. Wayland compositors ' +
                'do this themselves.' },
        { value: 'lockscreen', label: 'hyprlock / swaylock — lock screen',
          desc: 'Locks the session to a password prompt.' },
        { value: 'idle', label: 'hypridle / swayidle — idle management',
          desc: 'Locks or sleeps after inactivity.' },
        { value: 'clipboard', label: 'cliphist / clipman — clipboard history',
          desc: 'Keeps a searchable clipboard history.' },
        { value: 'screenshot', label: 'grim + slurp / flameshot — screenshots',
          desc: 'Region and window screenshots.' }
    ]
},

/* ── Services ──────────────────────────────────────────────────────────── */
{
    id: 'network',
    section: 'Services',
    title: 'Network management',
    help: 'Pick exactly one. Two network managers fighting over the same ' +
          'interface is a classic way to end up with no network at all.',
    wiki: 'firewall',
    type: 'choice',
    options: [
        { value: 'networkmanager', label: 'NetworkManager', recommended: true,
          desc: 'Works with every desktop, handles wifi roaming and VPNs.' },
        { value: 'systemd-networkd', label: 'systemd-networkd + iwd',
          desc: 'Lighter, declarative, no daemon beyond systemd. Better on a server.' },
        { value: 'iwd', label: 'iwd alone',
          desc: 'Wireless only, minimal. You configure addressing yourself.' }
    ]
},
/* ── DNS ────────────────────────────────────────────────────────────────────
   Whoever answers your DNS queries sees every domain you visit, before any
   encryption in the browser applies. By default that is your ISP, on the wire,
   in plaintext. This picks the upstream and turns on DNS-over-TLS.

   Addresses checked against each provider's own documentation. "No logs" is a
   published policy, not something you can verify from here — the options say
   what each provider claims and who they are, and let you decide. */
{
    id: 'dns_provider',
    section: 'Services',
    title: 'Who answers your DNS queries?',
    help: 'Every site you visit starts with a DNS lookup, and by default that ' +
          'goes to your ISP unencrypted — visible to them and to anyone on the ' +
          'path, regardless of HTTPS. Picking a provider here also enables ' +
          'DNS-over-TLS and DNSSEC, so the queries are encrypted and the ' +
          'answers are authenticated.',
    wiki: 'encrypted-dns',
    type: 'choice',
    options: [
        { value: 'quad9', label: 'Quad9 — 9.9.9.9', recommended: true,
          desc: 'Swiss non-profit foundation. Blocks known-malicious domains ' +
                'at the resolver, and states it does not log the querying IP. ' +
                'DNS-over-TLS at dns.quad9.net.' },
        { value: 'mullvad', label: 'Mullvad DNS — 194.242.2.2',
          desc: 'Run by the VPN provider, usable without a subscription. ' +
                'States no logging. DNS-over-TLS at dns.mullvad.net.' },
        { value: 'cloudflare', label: 'Cloudflare — 1.1.1.1',
          desc: 'Fast and very widely used. Publishes a no-logging policy with ' +
                'third-party audits. DNS-over-TLS at cloudflare-dns.com.',
          note: 'A single very large company sees a large share of the ' +
                'internet\'s DNS. That is a centralisation trade-off, not a ' +
                'technical fault.' },
        { value: 'dns0', label: 'dns0.eu — 193.110.81.0',
          desc: 'European non-profit, GDPR-scoped, states no logging. ' +
                'DNS-over-TLS at dns0.eu.' },
        { value: 'adguard', label: 'AdGuard DNS — 94.140.14.14',
          desc: 'Blocks advertising and tracking domains at the resolver, so ' +
                'it applies to every device and every application, not just a ' +
                'browser. DNS-over-TLS at dns.adguard-dns.com.' },
        { value: 'isp', label: 'Whatever DHCP hands out',
          desc: 'Your ISP or your router. No extra configuration, and no ' +
                'encryption unless they happen to offer it.',
          note: 'Your ISP sees every domain you look up, in plaintext.' }
    ]
},
{
    id: 'audio',
    section: 'Services',
    title: 'Audio',
    help: 'PipeWire replaced PulseAudio and JACK and is what Arch ships now. ' +
          'Choose none for a server.',
    wiki: 'desktop',
    when: s => s.desktop && s.desktop !== 'none',
    type: 'choice',
    options: [
        { value: 'pipewire', label: 'PipeWire', recommended: true,
          desc: 'pipewire, pipewire-pulse, wireplumber.' },
        { value: 'none', label: 'No audio', desc: 'Server, or you will set it up later.' }
    ]
},
{
    id: 'firewall',
    section: 'Services',
    title: 'Firewall',
    help: 'A default-deny inbound policy closes everything you did not ' +
          'deliberately open. Two commands, and it is the highest ' +
          'security-per-effort item in this whole guide.',
    wiki: 'firewall-profiles',
    type: 'choice',
    options: [
        { value: 'ufw', label: 'UFW, default deny inbound', recommended: true,
          desc: 'Simple front end to nftables. Easy to reason about.' },
        { value: 'nftables', label: 'nftables directly',
          desc: 'No abstraction layer. You write the ruleset.' },
        { value: 'none', label: 'No firewall',
          desc: 'Everything you run that listens is reachable from your network.',
          danger: 'Any service that binds a port is exposed to your whole network.' }
    ]
},
{
    id: 'snapshots',
    section: 'Services',
    title: 'Snapshots',
    help: 'A snapshot taken automatically before every pacman transaction ' +
          'turns a broken update into a reboot. Only useful on Btrfs.',
    wiki: 'filesystem',
    when: s => s.filesystem === 'btrfs',
    type: 'choice',
    options: [
        { value: 'snapper', label: 'Snapper + snap-pac', recommended: true,
          desc: 'Automatic pre/post snapshots around every pacman run.' },
        { value: 'timeshift', label: 'Timeshift', desc: 'Simpler, GUI-driven.' },
        { value: 'none', label: 'None', desc: 'You can add it later.' }
    ]
},

/* ── Security ──────────────────────────────────────────────────────────── */
{
    id: 'security_tools',
    section: 'Security',
    title: 'Which security tools?',
    help: 'Read what each one does before enabling it. Several can lock you ' +
          'out of your own machine, which is the point of them, and the ' +
          'reason none are enabled automatically.',
    wiki: 'security-suite',
    type: 'multi',
    optional: true,
    options: [
        { value: 'libre-otp', label: 'Libre OTP',
          desc: 'TOTP/HOTP second factor with no cloud account and no blobs.' },
        { value: 'anti-ducky', label: 'Input Guard (anti-ducky)',
          desc: 'Blocks BadUSB keystroke injection by watching HID timing.',
          note: 'Its timing thresholds have never been measured on real ' +
                'hardware. Test it before trusting it with your only keyboard.' },
        { value: 'anti-evil-maid', label: 'Anti-Evil Maid',
          desc: 'Hashes /boot so you know if it changed while the machine ' +
                'was out of your hands.' },
        { value: 'kernel-watcher', label: 'Kernel Watcher',
          desc: 'Watches SSH keys, browser profiles and wallet directories ' +
                'for readers.' },
        { value: 'scarecrow', label: 'Scarecrow',
          desc: 'Canary files and sandbox spoofing.',
          danger: 'Its duress mode can destroy data. Off by default and gated ' +
                  'behind typed confirmation.' },
        { value: 'aur-guard', label: 'AUR Guard',
          desc: 'Audits a PKGBUILD for malicious patterns before makepkg ' +
                'runs it. Read-only; it cannot lock you out.' }
    ]
},
/* ── Duress PINs ────────────────────────────────────────────────────────────
   Only offered when scarecrow is installed and the disk is actually encrypted:
   a duress PIN erases a LUKS header, and there is no header to erase on an
   unencrypted install. Offering it there would be a control that silently does
   nothing, which is worse than not offering it. */
{
    id: 'duress_pins',
    section: 'Security',
    title: 'Duress PINs',
    // "at the LUKS prompt" was wrong and it mattered: these are checked at the
    // *login* prompt, by a PAM gate. Someone who believed otherwise would type
    // their duress PIN at the boot passphrase prompt, where it is just a wrong
    // passphrase and nothing happens — at the one moment it needed to work.
    help: 'Three separate passwords you can set at the login prompt, each ' +
          'optional. They exist for the situation where someone is standing ' +
          'over you demanding a password. Nothing on screen ever reveals that ' +
          'one was used — that is the whole point, and it is why none of them ' +
          'announce themselves.',
    wiki: 'luks-duress',
    when: s => (s.security_tools || []).indexOf('scarecrow') !== -1 &&
               s.encryption && s.encryption !== 'none',
    type: 'multi',
    optional: true,
    options: [
        { value: 'duress', label: 'Duress — erase, silently',
          desc: 'Erases the LUKS header. The data becomes unrecoverable. It ' +
                'then behaves exactly like a wrong password, because a disk ' +
                'that will not unlock reads as a forgotten passphrase.',
          danger: 'Irreversible without a header backup. Take one first, and ' +
                  'keep it where the person you are hiding from cannot reach it.' },
        { value: 'decoy', label: 'Decoy — a plausible session',
          desc: 'Opens a working session in a decoy home while your real data ' +
                'stays sealed. Erases nothing. An obviously empty decoy home ' +
                'is itself a tell, so populate it.' },
        { value: 'both', label: 'Both at once — erase and show a decoy',
          desc: 'Erases the header and opens the decoy session, so the data ' +
                'is gone and the screen still shows a working system. For ' +
                'when you need both and cannot afford either to be visible.',
          danger: 'Irreversible without a header backup, same as duress.' }
    ]
},
/* ── Input Guard response ───────────────────────────────────────────────────
   Only asked when Input Guard is actually installed. The capture and the
   deauthorization happen regardless; this is the *extra* response, and the two
   ends of it have very different costs. */
{
    id: 'ducky_response',
    section: 'Security',
    title: 'What should Input Guard do when it catches a payload?',
    help: 'It always captures the payload and deauthorizes the device at the ' +
          'kernel, whatever you pick here. This is what happens on top of that.',
    wiki: 'anti-ducky',
    when: s => (s.security_tools || []).indexOf('anti-ducky') !== -1,
    type: 'single',
    optional: true,
    options: [
        { value: 'lock', label: 'Lock every session', recommended: true,
          desc: 'The attacker cannot use the unlocked desktop the injected ' +
                'keystrokes were aimed at. If it misfires you lose a login, ' +
                'not your work. It does not protect the encryption keys in ' +
                'RAM — a lock screen is a UI, not a cryptographic boundary.' },
        { value: 'alert', label: 'Alert only',
          desc: 'The device is already blocked and the payload already saved. ' +
                'Doing nothing further is a legitimate choice.' },
        { value: 'poweroff', label: 'Hard power-off',
          desc: 'Cuts power so the disk-encryption keys leave RAM before ' +
                'anyone can pull the DIMMs for a cold-boot read.',
          danger: 'Loses unsaved work, with no confirmation, on a false ' +
                  'positive. Input Guard\'s timing thresholds have never been ' +
                  'measured on real hardware, so its false-positive rate is ' +
                  'unknown. Requires typed confirmation to arm.' }
    ]
},
/* ── LUKS auto-lock ─────────────────────────────────────────────────────────
   Encryption-only for the obvious reason, and anti-evil-maid-only because that
   is the crate that ships `--lock-now`. Offering it without either would be a
   control that configures nothing. */
{
    id: 'luks_autolock',
    section: 'Security',
    title: 'Lock the disk when you step away?',
    help: 'Locking your screen leaves the LUKS master key sitting in kernel ' +
          'memory, where a DMA port or a cold-boot attack on the RAM can still ' +
          'reach it. Suspending the volume flushes that key, so the disk is as ' +
          'protected as it is when the machine is off.',
    wiki: 'luks-autolock',
    when: s => (s.security_tools || []).indexOf('anti-evil-maid') !== -1 &&
               s.encryption && s.encryption !== 'none',
    type: 'single',
    optional: true,
    options: [
        { value: 'never', label: 'No auto-lock',
          desc: 'You can still lock on demand with `anti-evil-maid --lock-now`.' },
        { value: '15m', label: 'After 15 minutes idle', recommended: true,
          desc: 'Long enough not to interrupt you, short enough that a machine ' +
                'left on a desk is not open all afternoon.' },
        { value: '1h', label: 'After 1 hour idle',
          desc: 'For a machine you leave running but stay near.' },
        { value: '8h', label: 'After 8 hours idle',
          desc: 'Effectively overnight. Little protection during the day.' },
        { value: 'on-lock', label: 'Whenever the session locks',
          desc: 'The key stops being resident the moment you lock the screen, ' +
                'which is when you have decided you are done.' }
    ],
    note: 'Suspending the volume that backs / freezes every disk read until ' +
          'you type the passphrase. Test it once while you can still reach ' +
          'the machine physically — a mistake needs a power cycle.'
},
{
    id: 'apps',
    section: 'Software',
    title: 'Post-install software',
    help: 'Installed and configured after the first boot, not during the ' +
          'base install. Anything needing a decision from you is asked at ' +
          'that point rather than guessed.',
    wiki: 'advanced-config',
    optional: true,
    type: 'multi',
    options: [
        { value: 'git', label: 'git', recommended: true, desc: 'Asks for your name and email.' },
        { value: 'neovim', label: 'neovim', desc: 'Editor. Themed to match your palette.' },
        { value: 'kitty', label: 'kitty', desc: 'GPU terminal. Themed to match your palette.' },
        { value: 'alacritty', label: 'alacritty', desc: 'GPU terminal, minimal.' },
        { value: 'firefox', label: 'firefox', desc: 'Browser.' },
        { value: 'chromium', label: 'chromium', desc: 'Browser.' },
        { value: 'thunar', label: 'thunar', desc: 'File manager.' },
        { value: 'mpv', label: 'mpv', desc: 'Media player.' },
        { value: 'btop', label: 'btop', desc: 'Process monitor.' },
        { value: 'openssh', label: 'openssh', desc: 'Asks whether to permit root login and password auth.' },
        { value: 'docker', label: 'docker', desc: 'Asks whether to add you to the docker group, which is root-equivalent.' },
        { value: 'steam', label: 'steam', desc: 'Proprietary. Excluded under a libre policy.' },
        { value: 'discord', label: 'discord', desc: 'Proprietary. Excluded under a libre policy.' }
    ]
},
{
    id: 'buskill',
    section: 'Security',
    title: 'BusKill dead-man switch?',
    help: 'BusKill is a magnetic USB cable. Pull the laptop away — or have ' +
          'it pulled away — and the magnet separates, the USB device ' +
          'disappears, and udev fires a rule. It turns physical separation ' +
          'from the machine into an event you can act on.',
    wiki: 'usb-kill',
    optional: true,
    type: 'choice',
    options: [
        { value: 'none', label: 'No', recommended: true, desc: 'Skip it.' },
        { value: 'lock', label: 'Yes — lock the session',
          desc: 'Non-destructive. Locks the screen on disconnect. You can ' +
                'always get back in.' },
        { value: 'shutdown', label: 'Yes — shut down',
          desc: 'Cuts power, so the encryption keys leave RAM.',
          danger: 'Unsaved work is lost on every accidental disconnect. ' +
                  'Rehearse it before relying on it.' }
    ]
},
{
    id: 'verbosity',
    section: 'Output',
    title: 'How much should the generated script say?',
    help: 'Debug injects "set -x", so bash prints every command with its ' +
          'arguments before running it. That is what you want the first time ' +
          'something fails.',
    wiki: 'advanced-config-verbosity',
    type: 'choice',
    options: [
        { value: 'normal', label: 'Normal', recommended: true, desc: 'Standard pacman and configuration output.' },
        { value: 'quiet', label: 'Quiet', desc: 'Errors only.' },
        { value: 'debug', label: 'Debug (set -x)', desc: 'Every command echoed before it runs.' }
    ]
}
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STEPS, DUSKY_LOCKS, DUSKY_VIDEO };
}
