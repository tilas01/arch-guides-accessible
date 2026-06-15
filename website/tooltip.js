// tooltip.js — UNIFIED tooltip engine v3 (Tokyo Night)
// ONE floating panel. Zero overlap. Works on all browsers / iOS / Android.
//
// Supported elements: .nav-tooltip | .form-step | .btn-tooltip | .tooltip-always
//                     .app-item (post-install checkboxes — reads `title` attr)
// Data sources:
//   data-title   — bold heading
//   data-desc    — body description
//   data-wiki    — explicit wiki fragment override
//   title attr   — fallback for .app-item labels (parsed as "Name: description")
// Auto features:
//   • Current selection shown for any .form-step containing a <select>
//   • Wiki map: right-click → opens wiki page in new tab
//   • .tooltip-always bypasses global enable/disable toggle
//   • MutationObserver auto-binds dynamic content
// ─────────────────────────────────────────────────────────────────────────────
(function () {
    'use strict';

    // ── Design tokens (match Tokyo Night) ────────────────
    const C = {
        bg:      'var(--bg-darker,#16161e)',
        border:  'var(--accent-blue,#7aa2f7)',
        title:   'var(--accent-purple,#bb9af7)',
        body:    'var(--fg-color,#a9b1d6)',
        cyan:    'var(--accent-cyan,#7dcfff)',
        green:   'var(--accent-green,#9ece6a)',
        blue:    'var(--accent-blue,#7aa2f7)',
        red:     'var(--accent-red,#f7768e)',
        orange:  'var(--accent-orange,#ff9e64)',
    };

    // ── Config ────────────────────────────────────────────
    const SELECTOR  = '.nav-tooltip, .form-step, .btn-tooltip, .tooltip-always, .app-item[title]';
    const OFFSET    = 18;    // px gap from cursor
    const MAX_W     = 360;   // max desktop width px
    const MOBILE_BP = 768;   // px

    // ── Wiki map: data-title → wiki fragment ──────────────
    const WIKI = {
        // Generator sections — each points to the correct specific wiki page
        'Firmware Selection':              '?page=architecture.md',
        'File System Features':            '?page=02-partitioning/luks2.md',
        'Target Installation Disk':        '?page=01-pre-installation.md',
        'Encryption Options':              '?page=02-partitioning/luks2.md',
        'Init System':                     '?page=03-base-installation.md',
        'Bootloader Choice':               '?page=04-bootloaders/uki-no-grub.md',
        'Main Kernel':                     '?page=maintenance.md',
        'Backup Kernel':                   '?page=maintenance.md',
        'CPU Architecture':                '?page=03-base-installation.md',
        'GPU Hardware':                    '?page=03-base-installation.md',
        'Virtual Machine Guest Setup':     '?page=03-base-installation.md',
        'Software Type & Graphics Drivers':'?page=10-generator-selections-and-dusky.md',
        'Swap File Size':                  '?page=02-partitioning/luks2.md',
        'Post-Install Apps & Scripts':     '?page=10-generator-selections-and-dusky.md',
        'Post-Install Apps':               '?page=10-generator-selections-and-dusky.md',
        'Automatic System Updates':        '?page=07-post-installation.md',
        'Multi-User Setup':                '?page=10-generator-selections-and-dusky.md',
        'System Cleanup':                  '?page=07-post-installation.md',
        'Desktop Environment':             '?page=07-post-installation.md',
        'DNS Caching':                     '?page=07-post-installation.md',
        'Web Browser':                     '?page=10-generator-selections-and-dusky.md',
        'Arch ISO Setup Utilities':        '?page=01-pre-installation.md',
        'Display Server':                  '?page=xorg-vs-wayland.md',
        'Output Format':                   '?page=architecture.md',
        // Arch Rusty Security Suite sections (with specific anchors)
        '🦀 Arch Rusty Security Suite':    '?page=security-suite.md',
        'ARSS — Security Tools':           '?page=security-suite.md',
        'Libre OTP — 2FA Authentication':  '?page=security-suite.md#libre-otp',
        'OTP Enforcement Mode':            '?page=security-suite.md#libre-otp',
        'OTP Hash Algorithm':              '?page=security-suite.md#libre-otp',
        'Input Guard — Anti-Ducky':        '?page=security-suite.md#input-guard-anti-ducky',
        'Arch ISO Verification':           '?page=security-suite.md#arch-iso-verification',
        'Panic Password':                  '?page=security-suite.md#panic-password-emergency-dod-wipe',
        'Notification Webhooks':           '?page=security-suite.md#webhooks-notifications',
        'Malware Detection Webhooks':      '?page=security-suite.md#webhooks-notifications',
        'ARSS Hardened SSH + OTP':         '?page=security-suite.md#hardened-ssh-otp',
        'Hardened SSH via ARSS + OTP':     '?page=security-suite.md#hardened-ssh-otp',
        'Anti-Evil Maid Decoys':           '?page=security-suite.md#anti-evil-maid-decoys',
        'Anti-Evil Maid — Main Kernel':    '?page=security-suite.md#anti-evil-maid-decoys',
        'Anti-Evil Maid — Backup Kernel':  '?page=security-suite.md#anti-evil-maid-decoys',
        'Keystroke Anonymisation':         '?page=security-suite.md#kloak-keystroke-anonymiser',
        'Keystroke Anonymisation — kloak': '?page=security-suite.md#kloak-keystroke-anonymiser',
        'Other Security Tools':            '?page=security-suite.md#other-security-tools',
        // Notification setup
        'Webhook Provider':                '?page=ntfy-setup.md',
    };

    // App right-click URLs (open repo instead of wiki)
    const APP_REPOS = {
        'paru':          'https://github.com/Morganamilo/paru',
        'firefox':       'https://github.com/mozilla/gecko-dev',
        'librewolf':     'https://codeberg.org/librewolf/source',
        'tor-browser':   'https://gitlab.torproject.org/tpo/applications/tor-browser',
        'chromium':      'https://chromium.googlesource.com/chromium/src',
        'signal':        'https://github.com/signalapp/Signal-Desktop',
        'keepassxc':     'https://github.com/keepassxreboot/keepassxc',
        'clamav':        'https://github.com/Cisco-Talos/clamav',
        'firejail':      'https://github.com/netblue30/firejail',
        'neovim':        'https://github.com/neovim/neovim',
        'alacritty':     'https://github.com/alacritty/alacritty',
        'kitty':         'https://github.com/kovidgoyal/kitty',
        'vscodium':      'https://github.com/VSCodium/vscodium',
        'git':           'https://github.com/git/git',
        'mpv':           'https://github.com/mpv-player/mpv',
        'vlc':           'https://github.com/videolan/vlc',
        'obs':           'https://github.com/obsproject/obs-studio',
        'gimp':          'https://gitlab.gnome.org/GNOME/gimp',
        'libreoffice':   'https://git.libreoffice.org/',
        'flatpak':       'https://github.com/flatpak/flatpak',
        'timeshift':     'https://github.com/teejee2008/timeshift',
        'pipewire':      'https://gitlab.freedesktop.org/pipewire/pipewire',
        'pfetch':        'https://github.com/dylanaraps/pfetch',
        'fastfetch':     'https://github.com/fastfetch-cli/fastfetch',
        'openssh':       'https://github.com/openssh/openssh-portable',
    };

    // ── State ─────────────────────────────────────────────
    function readEnabled() {
        const v = sessionStorage.getItem('tooltips_enabled');
        return v === null ? true : v === 'true';
    }
    window.tooltipsEnabled = readEnabled();

    let activeEl       = null;
    let activeUrl      = null;  // URL for right-click (wiki or repo)
    const BOUND        = '_ttBound';
    const isMobile     = () => window.innerWidth <= MOBILE_BP;

    // ── Create panel ──────────────────────────────────────
    const panel = document.createElement('div');
    panel.id = 'tt-panel';
    panel.setAttribute('role', 'tooltip');
    panel.setAttribute('aria-live', 'polite');
    panel.setAttribute('aria-hidden', 'true');
    Object.assign(panel.style, {
        position:       'fixed',
        zIndex:         '99999',
        background:     C.bg,
        border:         '1px solid ' + C.border,
        borderRadius:   '10px',
        padding:        '10px 14px',
        maxWidth:       MAX_W + 'px',
        pointerEvents:  'none',
        opacity:        '0',
        transition:     'opacity 0.16s ease, transform 0.16s ease',
        boxShadow:      '0 6px 30px rgba(0,0,0,0.65)',
        fontFamily:     "monospace",
        lineHeight:     '1.5',
        transform:      'translateY(6px)',
        willChange:     'opacity,transform',
        backdropFilter: 'blur(3px)',
        wordBreak:      'break-word',
    });
    document.body.appendChild(panel);

    // ── Helpers ───────────────────────────────────────────
    function shouldShow(el) {
        if (el.classList.contains('tooltip-always')) return true;
        return window.tooltipsEnabled !== false;
    }

    function parseAppTitle(el) {
        // .app-item labels have: "AppName: description"
        const raw = el.getAttribute('title') || '';
        if (!raw) return { title: null, desc: null };
        const colon = raw.indexOf(':');
        if (colon > 0) {
            return { title: raw.slice(0, colon).trim(), desc: raw.slice(colon + 1).trim() };
        }
        return { title: raw.trim(), desc: null };
    }

    function getAppValue(el) {
        const cb = el.querySelector('input[type="checkbox"]');
        return cb ? cb.value : null;
    }

    function getCurrentSelection(el) {
        const sel = el.querySelector('select');
        if (sel && sel.options[sel.selectedIndex]) return sel.options[sel.selectedIndex].text;
        return null;
    }

    function buildContent(el) {
        let title, desc, wikiUrl = null, repoUrl = null;

        if (el.classList.contains('app-item')) {
            // Post-install app label
            const parsed = parseAppTitle(el);
            title = parsed.title;
            desc  = parsed.desc;
            const val = getAppValue(el);
            if (val && APP_REPOS[val]) repoUrl = APP_REPOS[val];
        } else {
            title = el.getAttribute('data-title') || '';
            desc  = el.getAttribute('data-desc')  || '';
        }

        if (!title && !desc) return null;

        // Resolve wiki URL
        const titleKey = (title || '').replace(/ — .*/, '');
        const wikiFrag = WIKI[titleKey] || WIKI[title] || el.getAttribute('data-wiki') || '';
        if (wikiFrag) wikiUrl = 'wiki.html' + wikiFrag;

        // Set right-click target (repo takes priority over wiki for apps)
        activeUrl = repoUrl || wikiUrl || null;

        // Current selection from <select>
        const current = el.getAttribute('data-current') || getCurrentSelection(el) || '';

        // Build HTML
        let html = `<div style="font-size:0.72rem;color:${C.cyan};letter-spacing:0.04em;margin-bottom:3px;opacity:0.7;">ℹ️ Tooltip</div>`;

        if (title) {
            html += `<strong style="display:block;color:${C.title};font-size:0.9rem;margin-bottom:3px;">${title}</strong>`;
        }
        if (desc) {
            html += `<span style="display:block;color:${C.body};font-size:0.8rem;line-height:1.5;">${desc}</span>`;
        }
        if (current) {
            html += `<div style="margin-top:7px;padding-top:6px;border-top:1px solid rgba(122,162,247,0.25);display:flex;gap:6px;align-items:center;">
  <strong style="color:${C.green};font-size:0.75rem;white-space:nowrap;">Selection:</strong>
  <span style="color:${C.blue};font-size:0.75rem;">${current}</span>
</div>`;
        }

        // Right-click hint
        if (activeUrl) {
            const label = repoUrl ? 'right-click → open repo' : 'right-click → wiki';
            html += `<div style="margin-top:5px;color:${C.orange};font-size:0.7rem;opacity:0.8;">${label}</div>`;
        }

        return html;
    }

    // ── Positioning ───────────────────────────────────────
    function positionDesktop(x, y) {
        // Measure at zero opacity to avoid flash
        panel.style.visibility = 'hidden';
        const pw = panel.offsetWidth  || MAX_W;
        const ph = panel.offsetHeight || 90;
        panel.style.visibility = '';

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let L = x + OFFSET;
        let T = y + OFFSET;

        // Flip if overflows right
        if (L + pw > vw - 8) L = x - pw - OFFSET;
        // Flip if overflows bottom
        if (T + ph > vh - 8) T = y - ph - OFFSET;
        // Safety clamp
        L = Math.max(8, L);
        T = Math.max(8, T);

        panel.style.left     = L + 'px';
        panel.style.top      = T + 'px';
        panel.style.right    = 'auto';
        panel.style.bottom   = 'auto';
        panel.style.maxWidth = MAX_W + 'px';
    }

    function positionMobile() {
        panel.style.left     = '10px';
        panel.style.right    = '10px';
        // iOS Safari WebKit fix: Place tooltips at the top of the viewport to avoid the dynamic bottom address/toolbar
        panel.style.top      = 'calc(12px + env(safe-area-inset-top, 0px))';
        panel.style.bottom   = 'auto';
        panel.style.maxWidth = 'calc(100vw - 22px)';
        // Ensure z-index is maximum to stay above fixed navbars
        panel.style.zIndex   = '999999';
    }

    // ── Show / Hide ───────────────────────────────────────
    function show(el, x, y) {
        if (!shouldShow(el)) return;
        const html = buildContent(el);
        if (!html) return;

        panel.innerHTML = html;
        activeEl = el;

        if (isMobile()) {
            positionMobile();
        } else {
            positionDesktop(x, y);
        }

        panel.style.opacity   = '1';
        panel.style.transform = 'translateY(0)';
        panel.setAttribute('aria-hidden', 'false');
    }

    function hide() {
        panel.style.opacity   = '0';
        panel.style.transform = 'translateY(6px)';
        panel.setAttribute('aria-hidden', 'true');
        activeEl  = null;
        activeUrl = null;
    }

    function move(x, y) {
        if (!activeEl || isMobile()) return;
        positionDesktop(x, y);
    }

    // ── Bind element ──────────────────────────────────────
    function bindEl(el) {
        if (el[BOUND]) return;
        el[BOUND] = true;

        // Desktop mouse
        el.addEventListener('mouseenter', e => show(el, e.clientX, e.clientY));
        el.addEventListener('mousemove',  e => { if (activeEl === el) move(e.clientX, e.clientY); });
        el.addEventListener('mouseleave', hide);

        // Mobile tap-toggle
        el.addEventListener('touchstart', e => {
            if (activeEl === el) { hide(); }
            else {
                const t = e.touches[0];
                show(el, t ? t.clientX : 0, t ? t.clientY : 0);
            }
        }, { passive: true });

        // Live update current selection when changed
        const sel = el.querySelector ? el.querySelector('select') : null;
        if (sel) {
            sel.addEventListener('change', () => {
                if (activeEl === el) {
                    const html = buildContent(el);
                    if (html) panel.innerHTML = html;
                }
                if (typeof validateConfigurations === 'function') validateConfigurations();
            });
        }

        // Checkboxes (app-items): update on change too
        const cb = el.querySelector ? el.querySelector('input[type="checkbox"]') : null;
        if (cb) {
            cb.addEventListener('change', () => {
                if (activeEl === el) {
                    const html = buildContent(el);
                    if (html) panel.innerHTML = html;
                }
            });
        }
    }

    // ── Scan DOM ──────────────────────────────────────────
    function scan() {
        document.querySelectorAll(SELECTOR).forEach(bindEl);
    }

    window.refreshTooltips = scan;
    scan();

    // ── MutationObserver for dynamic content ──────────────
    new MutationObserver(muts => {
        let needsScan = false;
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches(SELECTOR)) bindEl(n);
            else if (n.querySelectorAll && n.querySelectorAll(SELECTOR).length) needsScan = true;
        }));
        if (needsScan) scan();
    }).observe(document.body, { childList: true, subtree: true });

    // ── Global dismiss ────────────────────────────────────
    document.addEventListener('click', e => {
        if (activeEl && !e.target.closest(SELECTOR)) hide();
    });
    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('resize', () => { if (activeEl) hide(); }, { passive: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && activeEl) hide(); });

    // ── Right-click → open repo or wiki ──────────────────
    document.addEventListener('contextmenu', e => {
        if (activeUrl) {
            e.preventDefault();
            window.open(activeUrl, '_blank');
        }
    });

    // ── API for script.js ─────────────────────────────────
    window.setTooltipsEnabled = function (enabled) {
        window.tooltipsEnabled = enabled;
        sessionStorage.setItem('tooltips_enabled', String(enabled));
        if (!enabled) hide();
    };

})();
