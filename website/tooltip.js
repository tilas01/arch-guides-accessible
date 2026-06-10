// tooltip.js — UNIFIED tooltip engine (Tokyo Night)
// ONE panel. Zero overlap. Replaces both the old floating tooltip AND the info-panel sidebar.
// Attributes:  data-title, data-desc, data-current, data-wiki (optional URL fragment)
// Classes:     .nav-tooltip | .form-step | .btn-tooltip | .tooltip-always
// Toggle:      sessionStorage('tooltips_enabled') — default true
//              .tooltip-always bypasses toggle (used for history & info buttons)
// Right-click: any active tooltip opens its wiki link if data-wiki is set
// ─────────────────────────────────────────────────────────────────────────────
(function () {
    'use strict';

    // ── CSS variables (match Tokyo Night) ────────────────
    const C = {
        bg:      'var(--bg-darker,#16161e)',
        border:  'var(--accent-blue,#7aa2f7)',
        title:   'var(--accent-purple,#bb9af7)',
        body:    'var(--fg-color,#a9b1d6)',
        cyan:    'var(--accent-cyan,#7dcfff)',
        green:   'var(--accent-green,#9ece6a)',
        blue:    'var(--accent-blue,#7aa2f7)',
    };

    // ── Configuration ─────────────────────────────────────
    const SELECTOR  = '.nav-tooltip, .form-step, .btn-tooltip, .tooltip-always';
    const OFFSET    = 16;    // px from cursor
    const MAX_W     = 340;   // max desktop width
    const MOBILE_BP = 768;

    // ── State ─────────────────────────────────────────────
    function readEnabled() {
        const v = sessionStorage.getItem('tooltips_enabled');
        return v === null ? true : v === 'true';
    }
    window.tooltipsEnabled = readEnabled();
    let activeEl   = null;
    let currentWikiUrl = null;
    const BOUND    = '_ttBound';

    // ── Build panel ───────────────────────────────────────
    const panel = document.createElement('div');
    panel.id = 'tt-panel';
    panel.setAttribute('role', 'tooltip');
    panel.setAttribute('aria-live', 'polite');
    Object.assign(panel.style, {
        position:      'fixed',
        zIndex:        '99999',
        background:    C.bg,
        border:        '1px solid ' + C.border,
        borderRadius:  '10px',
        padding:       '10px 14px',
        maxWidth:      MAX_W + 'px',
        pointerEvents: 'none',
        opacity:       '0',
        transition:    'opacity 0.15s ease, transform 0.15s ease',
        boxShadow:     '0 6px 28px rgba(0,0,0,0.6)',
        fontFamily:    "'JetBrains Mono',monospace",
        lineHeight:    '1.45',
        transform:     'translateY(6px)',
        willChange:    'opacity,transform',
        backdropFilter:'blur(4px)',
    });
    document.body.appendChild(panel);

    // ── Wiki map (title → wiki page) ──────────────────────
    const WIKI = {
        'Firmware Selection':         '?page=architecture.md',
        'File System Features':       '?page=02-partitioning/',
        'Target Installation Disk':   '?page=01-pre-installation.md',
        'Encryption Options':         '?page=02-partitioning/',
        'Init System':                '?page=architecture.md',
        'Bootloader Choice':          '?page=04-bootloaders/',
        'Main Kernel':                '?page=03-base-installation.md',
        'Backup Kernel':              '?page=03-base-installation.md',
        'CPU Architecture':           '?page=03-base-installation.md',
        'GPU Hardware':               '?page=03-base-installation.md',
        'Virtual Machine Guest Setup':'?page=03-base-installation.md',
        'Software Type & Graphics Drivers':'?page=10-generator-selections-and-dusky.md',
        'Swap File Size':             '?page=02-partitioning/',
        'Post-Install Apps & Scripts':'?page=10-generator-selections-and-dusky.md',
        'Automatic System Updates':   '?page=07-post-installation.md',
        'Multi-User Setup':           '?page=10-generator-selections-and-dusky.md',
        'System Cleanup':             '?page=07-post-installation.md',
        'Tilas01 Custom Scripts':     '?page=architecture.md',
        'Advanced Security Tools':    '?page=architecture.md',
        'Display Server':             '?page=xorg-vs-wayland.md',
        'Output Format':              '?page=architecture.md',
        'Post-Install Apps':          '?page=10-generator-selections-and-dusky.md',
    };

    // ── Helpers ───────────────────────────────────────────
    function shouldShow(el) {
        if (el.classList.contains('tooltip-always')) return true;
        return window.tooltipsEnabled;
    }

    function getCurrentSelection(el) {
        const sel = el.querySelector ? el.querySelector('select') : null;
        if (sel && sel.options[sel.selectedIndex]) return sel.options[sel.selectedIndex].text;
        return null;
    }

    function buildHTML(el) {
        const title   = el.getAttribute('data-title') || '';
        const desc    = el.getAttribute('data-desc')  || '';
        const current = el.getAttribute('data-current') || getCurrentSelection(el) || '';
        const wikiKey = title.replace(/ — .*/, ''); // strip subtitle for lookup
        const wikiUrl = WIKI[wikiKey] || WIKI[title] || el.getAttribute('data-wiki') || '';

        currentWikiUrl = wikiUrl ? 'wiki.html' + wikiUrl : null;

        if (!title && !desc) return null;

        let html = '';

        // Title bar
        if (title) {
            html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;">
  <strong style="color:${C.title};font-size:0.9rem;display:block;">${title}</strong>
  ${wikiUrl ? `<span style="color:${C.cyan};font-size:0.68rem;white-space:nowrap;opacity:0.8;">right-click→wiki</span>` : ''}
</div>`;
        }

        // Body
        if (desc) {
            html += `<span style="display:block;color:${C.body};font-size:0.8rem;line-height:1.5;">${desc}</span>`;
        }

        // Current selection
        if (current) {
            html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(122,162,247,0.2);display:flex;gap:6px;align-items:center;">
  <strong style="color:${C.green};font-size:0.76rem;">Current:</strong>
  <span style="color:${C.blue};font-size:0.76rem;">${current}</span>
</div>`;
        }

        return html || null;
    }

    // ── Positioning ───────────────────────────────────────
    function positionDesktop(x, y) {
        // Reveal at opacity 0 first to measure
        panel.style.visibility = 'hidden';
        panel.style.opacity    = '1';
        const pw = panel.offsetWidth  || MAX_W;
        const ph = panel.offsetHeight || 80;
        panel.style.visibility = '';
        panel.style.opacity    = '0'; // will be set properly by show()

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let L = x + OFFSET;
        let T = y + OFFSET;
        if (L + pw > vw - 8) L = x - pw - OFFSET;
        if (T + ph > vh - 8) T = y - ph - OFFSET;
        if (L < 8) L = 8;
        if (T < 8) T = 8;
        panel.style.left   = L + 'px';
        panel.style.top    = T + 'px';
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
        panel.style.maxWidth = MAX_W + 'px';
    }

    function positionMobile() {
        panel.style.left     = '10px';
        panel.style.right    = '10px';
        panel.style.bottom   = '10px';
        panel.style.top      = 'auto';
        panel.style.maxWidth = 'calc(100vw - 20px)';
    }

    // ── Show / hide ───────────────────────────────────────
    function show(el, x, y) {
        if (!shouldShow(el)) return;
        const html = buildHTML(el);
        if (!html) return;

        panel.innerHTML = html;
        activeEl = el;

        if (window.innerWidth <= MOBILE_BP) {
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
        activeEl       = null;
        currentWikiUrl = null;
    }

    function move(x, y) {
        if (!activeEl || window.innerWidth <= MOBILE_BP) return;
        positionDesktop(x, y);
    }

    // ── Bind one element ──────────────────────────────────
    function bindEl(el) {
        if (el[BOUND]) return;
        el[BOUND] = true;

        // Desktop hover
        el.addEventListener('mouseenter', e => show(el, e.clientX, e.clientY));
        el.addEventListener('mousemove',  e => { if (activeEl === el) move(e.clientX, e.clientY); });
        el.addEventListener('mouseleave', hide);

        // Mobile tap-toggle
        el.addEventListener('touchstart', e => {
            if (activeEl === el) { hide(); }
            else { show(el, 0, 0); }
        }, { passive: true });

        // Form-change: update "Current" in tooltip if visible
        const sel = el.querySelector ? el.querySelector('select') : null;
        if (sel) {
            sel.addEventListener('change', () => {
                if (activeEl === el) {
                    const html = buildHTML(el);
                    if (html) panel.innerHTML = html;
                }
                if (typeof validateConfigurations === 'function') validateConfigurations();
            });
        }
    }

    // ── Scan & bind ───────────────────────────────────────
    function scan() {
        document.querySelectorAll(SELECTOR).forEach(bindEl);
    }

    window.refreshTooltips = scan;
    scan();

    // ── MutationObserver for dynamic content ──────────────
    new MutationObserver(muts => {
        let needs = false;
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches(SELECTOR)) bindEl(n);
            if (n.querySelectorAll && n.querySelectorAll(SELECTOR).length) needs = true;
        }));
        if (needs) scan();
    }).observe(document.body, { childList: true, subtree: true });

    // ── Global dismiss ────────────────────────────────────
    document.addEventListener('click', e => {
        if (activeEl && !e.target.closest(SELECTOR)) hide();
    });
    window.addEventListener('scroll', hide, { passive: true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && activeEl) hide(); });

    // ── Right-click → wiki ────────────────────────────────
    document.addEventListener('contextmenu', e => {
        if (currentWikiUrl) {
            e.preventDefault();
            window.open(currentWikiUrl, '_blank');
        }
    });

    // ── Tooltip toggle (called from script.js) ────────────
    window.setTooltipsEnabled = function(enabled) {
        window.tooltipsEnabled = enabled;
        sessionStorage.setItem('tooltips_enabled', enabled);
        if (!enabled) hide();
    };

})();
