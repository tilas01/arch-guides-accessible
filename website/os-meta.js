/* ============================================================================
   os-meta.js — the target operating systems, described once.
   ----------------------------------------------------------------------------
   Loaded by every page, ahead of manual-data.js and shared-ui.js. This is the
   only place the four systems are written down: their labels, their tooling,
   which documentation is authoritative for each, and whether the guide for it
   is finished.

   One table, not one per front end. The header switcher, the walkthrough
   question, the generated markdown and the generated shell script all read from
   here, and the answer decides which commands get printed onto somebody's
   screen. Two tables would let the dropdown and the question disagree about
   which system the reader is installing, and nothing would notice.

   `complete: false` drives the Work In Progress badge. An OS may appear here
   before it is finished, but must be unmistakably marked as not ready to
   install from: these scripts repartition disks, and someone who ignores a
   subtle warning loses one. The badge comes off only when the guides reach
   Arch's depth, every permutation generates in both front ends, every emitted
   script passes `bash -n` (and `sh -n` for the BSDs, whose /bin/sh is not
   bash), option parity holds, and the tool-support table is honest about what
   cannot work there.

   No dependencies. Exports onto the global object, so it works both as a
   classic script in the browser and inside the test harnesses, which
   concatenate the website's scripts into one scope.
   ========================================================================= */

'use strict';

(function (root) {

    /* Arch is the default whenever no selection has been made or the stored one
       is not recognised. That is a promise the rest of the site depends on:
       skipping the question has to produce exactly the guide this project
       produced before the selector existed. */
    var DEFAULT_OS = 'arch';

    var OS_META = {
        arch: {
            label: 'Arch Linux', short: 'Arch', complete: true,
            pkg: 'pacman', init: 'systemd', fde: 'LUKS2',
            docs: 'https://wiki.archlinux.org/',
            docsName: 'the Arch Wiki',
            /* Asset base name. The icons and banners are generated from
               scripts/gen-icons.py under these names, at
               img/icons/<slug>-<size>.png and img/banners/<slug>.png. */
            slug: 'arch-guides',
            accent: 'cyan',
            summary: 'pacman, systemd, LUKS2.',
            desc: 'Complete, and the default. pacman, systemd, LUKS2. The Arch ' +
                  'Wiki is the authority — where this project and the Arch Wiki ' +
                  'disagree, the Arch Wiki is right.'
        },
        gentoo: {
            label: 'Gentoo', short: 'Gentoo', complete: false,
            pkg: 'portage', init: 'OpenRC or systemd', fde: 'LUKS2',
            docs: 'https://wiki.gentoo.org/wiki/Handbook:AMD64',
            docsName: 'the Gentoo Handbook',
            slug: 'gentoo-guides',
            accent: 'purple',
            summary: 'stage3, portage, USE flags.',
            desc: 'Source-based: a stage3 tarball, portage with USE flags, and ' +
                  'you compile the kernel. Shares Linux primitives with Arch, so ' +
                  'LUKS2 and every security tool work unchanged.',
            danger: '🚧 NOT READY TO INSTALL FROM. Visible for reading only — ' +
                    'the guide is incomplete and running it would not produce a ' +
                    'working system. Use Arch for an actual install.'
        },
        freebsd: {
            label: 'FreeBSD', short: 'FreeBSD', complete: false,
            pkg: 'pkg / ports', init: 'rc.d', fde: 'geli',
            docs: 'https://docs.freebsd.org/en/books/handbook/',
            docsName: 'the FreeBSD Handbook',
            slug: 'freebsd-guides',
            accent: 'red',
            summary: 'Not Linux. geli, ZFS, rc.d.',
            desc: 'Not Linux. bsdinstall, ZFS or UFS, geli for encryption, ' +
                  'pkg and ports, rc.d instead of systemd.',
            danger: '🚧 NOT READY TO INSTALL FROM. Visible for reading only. ' +
                    'Several security tools cannot work here unchanged — see ' +
                    'the wiki before relying on any of it.'
        },
        openbsd: {
            label: 'OpenBSD', short: 'OpenBSD', complete: false,
            pkg: 'pkg_add', init: 'rc.d', fde: 'softraid -C CRYPTO',
            docs: 'https://www.openbsd.org/faq/',
            docsName: 'the OpenBSD FAQ',
            slug: 'openbsd-guides',
            accent: 'green',
            summary: 'Not Linux. softraid, FFS2, signify.',
            desc: 'Not Linux, and the furthest from Arch. The install(8) ' +
                  'script, disklabel, FFS2, softraid for encryption, and ' +
                  'signify rather than GPG for release signatures.',
            danger: '🚧 NOT READY TO INSTALL FROM. Visible for reading only. ' +
                    'OpenBSD has no PAM and no Wayland, so the duress PINs and ' +
                    'the Dusky desktop cannot work there at all.'
        }
    };

    /* The neutral identity, shown before anything has been chosen. Not a member
       of OS_META: it is not a system you can install, and putting it in the
       table would mean every consumer had to remember to exclude it. */
    var NEUTRAL = {
        label: 'Unix Guides',
        slug: 'unix-guides',
        accent: 'purple'
    };

    /** Any value in, a real OS id out. Unknown and missing both mean Arch. */
    function osIdOf(value) {
        return (value && Object.prototype.hasOwnProperty.call(OS_META, value))
            ? value : DEFAULT_OS;
    }

    function osMetaOf(value) { return OS_META[osIdOf(value)]; }
    function osLabelOf(value) { return osMetaOf(value).label; }

    /* ── The selection ───────────────────────────────────────────────────────
       sessionStorage, alongside the walkthrough's own state, because that is
       the only persistence a static site on GitHub Pages has and because the
       choice should not outlive the tab that made it.

       Two accessors, and the difference between them matters:

         chosenOS()  what the reader picked, or null if they have not been asked
                     yet. The header uses this — the banner stays neutral until
                     somebody chooses.
         targetOS()  what to generate for, which is Arch when nothing has been
                     chosen. Everything downstream uses this.

       Collapsing the two would either badge the site as Arch before the reader
       had said anything, or leave the generators with no system at all. */
    var KEY = 'unix_target_os';

    function chosenOS() {
        var raw;
        try { raw = root.sessionStorage && root.sessionStorage.getItem(KEY); }
        catch (_) { return null; }                 // private mode; treat as unasked
        return (raw && Object.prototype.hasOwnProperty.call(OS_META, raw)) ? raw : null;
    }

    function targetOS() { return chosenOS() || DEFAULT_OS; }

    /**
     * Record the selection and tell the page. Returns the id actually stored,
     * which is the Arch fallback if `id` is not one of the four.
     */
    function setTargetOS(id) {
        var next = osIdOf(id);
        try { if (root.sessionStorage) root.sessionStorage.setItem(KEY, next); }
        catch (_) { /* private mode: the selection holds for this page only */ }
        announce(next);
        return next;
    }

    /** Forget the selection, returning the site to its neutral, unasked state. */
    function clearTargetOS() {
        try { if (root.sessionStorage) root.sessionStorage.removeItem(KEY); }
        catch (_) { /* nothing to undo */ }
        announce(null);
    }

    /* One event, on document, so any page can react without the switcher
       needing to know what is on it. `detail.os` is the stored id, or null when
       the selection has been cleared. */
    function announce(os) {
        var doc = root.document;
        if (!doc || typeof doc.dispatchEvent !== 'function') return;
        var ev;
        try {
            ev = new root.CustomEvent('unix:os-changed', { detail: { os: os } });
        } catch (_) {
            // Older engines: the constructor is unavailable but the legacy
            // factory is. Feature-detected rather than assumed, as everything
            // optional here is.
            if (!doc.createEvent) return;
            ev = doc.createEvent('CustomEvent');
            ev.initCustomEvent('unix:os-changed', true, false, { os: os });
        }
        doc.dispatchEvent(ev);
    }

    root.OS_META = OS_META;
    root.OS_NEUTRAL = NEUTRAL;
    root.OS_DEFAULT = DEFAULT_OS;
    root.osIdOf = osIdOf;
    root.osMetaOf = osMetaOf;
    root.osLabelOf = osLabelOf;
    root.chosenOS = chosenOS;
    root.targetOS = targetOS;
    root.setTargetOS = setTargetOS;
    root.clearTargetOS = clearTargetOS;

})(typeof window !== 'undefined' ? window : this);
