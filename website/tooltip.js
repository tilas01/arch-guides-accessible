// tooltip.js — Shared floating tooltip system (Tokyo Night theme)
// Supports: .nav-tooltip, .form-step, .btn-tooltip elements
// Attributes: data-title, data-desc, data-current
// Toggle: sessionStorage('tooltips_enabled'), default true
// Elements with class 'tooltip-always' bypass the toggle
// ─────────────────────────────────────────────────────────
(function () {
    'use strict';

    // ── CSS Variables ────────────────────────────────────
    const VARS = {
        bgDarker:     'var(--bg-darker, #16161e)',
        accentBlue:   'var(--accent-blue, #7aa2f7)',
        accentPurple: 'var(--accent-purple, #bb9af7)',
        fgColor:      'var(--fg-color, #a9b1d6)',
        accentCyan:   'var(--accent-cyan, #7dcfff)',
    };

    // ── Tooltip selectors ────────────────────────────────
    // Note: .form-step is handled by the sidebar info-panel (script.js).
    // Only .nav-tooltip and .btn-tooltip use this floating tooltip panel
    // to avoid two tooltip elements appearing simultaneously.
    const TOOLTIP_SELECTOR = '.nav-tooltip, .btn-tooltip, .tooltip-always';
    const OFFSET = 14;           // px offset from cursor
    const PANEL_MAX_W = 320;     // max width on desktop
    const MOBILE_BP = 768;       // mobile breakpoint

    // ── Toggle state ─────────────────────────────────────
    // Read persisted preference; default to enabled
    function readToggle() {
        const stored = sessionStorage.getItem('tooltips_enabled');
        return stored === null ? true : stored === 'true';
    }

    /** @type {boolean} Global flag other scripts can inspect */
    window.tooltipsEnabled = readToggle();

    // ── Create tooltip panel ─────────────────────────────
    const panel = document.createElement('div');
    panel.id = 'tooltip-panel';
    panel.setAttribute('role', 'tooltip');
    panel.setAttribute('aria-hidden', 'true');
    Object.assign(panel.style, {
        position:       'fixed',
        zIndex:         '9999',
        background:     VARS.bgDarker,
        border:         '1px solid ' + VARS.accentBlue,
        borderRadius:   '10px',
        padding:        '12px 16px',
        maxWidth:       PANEL_MAX_W + 'px',
        pointerEvents:  'none',
        opacity:        '0',
        transition:     'opacity 0.18s ease, transform 0.18s ease',
        boxShadow:      '0 4px 24px rgba(0,0,0,0.5)',
        fontFamily:     "'JetBrains Mono', monospace",
        lineHeight:     '1.45',
        transform:      'translateY(4px)',
        willChange:     'opacity, transform',
    });
    document.body.appendChild(panel);

    // ── Internal state ───────────────────────────────────
    let activeEl = null;   // currently hovered / tapped element
    let isMobile = () => window.innerWidth <= MOBILE_BP;

    // ── Helpers ──────────────────────────────────────────

    /**
     * Determine if a tooltip should display for the given element
     * based on the global toggle and the 'tooltip-always' override.
     */
    function shouldShow(el) {
        if (el.classList.contains('tooltip-always')) return true;
        return window.tooltipsEnabled;
    }

    /**
     * Build the inner HTML of the tooltip panel.
     *  - Bold title in purple
     *  - Description in fg-color
     *  - Optional "Current: xxx" line in cyan
     */
    function buildContent(el) {
        const title   = el.getAttribute('data-title');
        const desc    = el.getAttribute('data-desc');
        const current = el.getAttribute('data-current');

        if (!title && !desc) return null;

        let html = '';

        if (title) {
            html += '<strong style="display:block;color:' + VARS.accentPurple +
                    ';font-size:0.95rem;margin-bottom:2px;">' + title + '</strong>';
        }

        if (desc) {
            html += '<span style="display:block;color:' + VARS.fgColor +
                    ';font-size:0.82rem;">' + desc + '</span>';
        }

        if (current) {
            html += '<span style="display:block;margin-top:6px;color:' +
                    VARS.accentCyan + ';font-size:0.8rem;">Current: ' +
                    current + '</span>';
        }

        return html;
    }

    // ── Position helpers ─────────────────────────────────

    /** Desktop: position near cursor with boundary clamping */
    function positionDesktop(x, y) {
        const rect = panel.getBoundingClientRect();
        const pw = rect.width  || PANEL_MAX_W;
        const ph = rect.height || 80;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = x + OFFSET;
        let top  = y + OFFSET;

        // Right edge overflow
        if (left + pw > vw - 8) left = x - pw - OFFSET;
        // Bottom edge overflow
        if (top + ph > vh - 8)  top  = y - ph - OFFSET;
        // Left edge clamp
        if (left < 8) left = 8;
        // Top edge clamp
        if (top < 8)  top  = 8;

        panel.style.left     = left + 'px';
        panel.style.top      = top  + 'px';
        panel.style.right    = 'auto';
        panel.style.bottom   = 'auto';
        panel.style.maxWidth = PANEL_MAX_W + 'px';
    }

    /** Mobile: fixed at viewport bottom, full width with margins */
    function positionMobile() {
        panel.style.left     = '10px';
        panel.style.right    = '10px';
        panel.style.bottom   = '10px';
        panel.style.top      = 'auto';
        panel.style.maxWidth = 'calc(100vw - 20px)';
    }

    // ── Show / Hide ──────────────────────────────────────

    function show(el, e) {
        if (!shouldShow(el)) return;

        const html = buildContent(el);
        if (!html) return;

        panel.innerHTML = html;

        // Make visible so we can measure for boundary checks
        panel.style.opacity   = '1';
        panel.style.transform = 'translateY(0)';
        panel.setAttribute('aria-hidden', 'false');
        activeEl = el;

        if (isMobile()) {
            positionMobile();
        } else if (e) {
            positionDesktop(e.clientX, e.clientY);
        }
    }

    function hide() {
        panel.style.opacity   = '0';
        panel.style.transform = 'translateY(4px)';
        panel.setAttribute('aria-hidden', 'true');
        activeEl = null;
    }

    // ── Mouse follow (desktop) ───────────────────────────

    function onMouseMove(e) {
        if (!activeEl || isMobile()) return;
        positionDesktop(e.clientX, e.clientY);
    }

    // ── Bind events to a single element ──────────────────

    const BOUND_FLAG = '_ttBound';   // prevent double-binding

    function bindElement(el) {
        if (el[BOUND_FLAG]) return;
        el[BOUND_FLAG] = true;

        // Desktop — hover
        el.addEventListener('mouseenter', function (e) {
            show(el, e);
        });
        el.addEventListener('mousemove', function (e) {
            if (activeEl === el) onMouseMove(e);
        });
        el.addEventListener('mouseleave', hide);

        // Touch — tap to toggle
        el.addEventListener('touchstart', function (e) {
            if (activeEl === el) {
                hide();
            } else {
                show(el, e.touches[0]);
            }
        }, { passive: true });
    }

    // ── Scan & bind all matching elements ────────────────

    function scanAndBind() {
        document.querySelectorAll(TOOLTIP_SELECTOR).forEach(bindElement);
    }

    /** @public Re-scan the DOM for new tooltip elements */
    window.refreshTooltips = function () {
        scanAndBind();
    };

    // Initial scan
    scanAndBind();

    // ── MutationObserver for dynamic elements ────────────

    const observer = new MutationObserver(function (mutations) {
        let needsScan = false;
        for (let i = 0; i < mutations.length; i++) {
            const added = mutations[i].addedNodes;
            for (let j = 0; j < added.length; j++) {
                const node = added[j];
                if (node.nodeType !== 1) continue;           // element nodes only
                if (node.matches && node.matches(TOOLTIP_SELECTOR)) {
                    bindElement(node);
                }
                // Also check children of inserted subtrees
                if (node.querySelectorAll) {
                    const children = node.querySelectorAll(TOOLTIP_SELECTOR);
                    if (children.length) needsScan = true;
                }
            }
        }
        if (needsScan) scanAndBind();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // ── Global dismiss listeners ─────────────────────────

    // Tap/click elsewhere dismisses tooltip
    document.addEventListener('click', function (e) {
        if (activeEl && !e.target.closest(TOOLTIP_SELECTOR)) {
            hide();
        }
    });

    // Scroll dismisses tooltip
    window.addEventListener('scroll', hide, { passive: true });

    // Escape key dismisses tooltip
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && activeEl) hide();
    });

})();
