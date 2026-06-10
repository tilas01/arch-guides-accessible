// tooltip.js — Shared lightweight tooltip system for nav-tooltip elements
// Works across all pages: wiki.html, upload.html, etc.
// Requires: elements with class="nav-tooltip" and data-title/data-desc attributes
(function() {
    'use strict';

    // Create floating tooltip panel
    const panel = document.createElement('div');
    panel.id = 'tooltip-panel';
    panel.style.cssText = 'position:fixed;z-index:9999;background:var(--bg-darker,#1a1a2e);border:1px solid var(--accent-blue,#4fc3f7);border-radius:10px;padding:12px 16px;max-width:320px;pointer-events:none;opacity:0;transition:opacity 0.2s;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
    document.body.appendChild(panel);

    let active = false;

    function show(el, e) {
        const title = el.getAttribute('data-title');
        const desc = el.getAttribute('data-desc');
        if (!title && !desc) return;

        panel.innerHTML = (title ? '<strong style="color:var(--accent-purple,#bb86fc);font-size:0.95rem;">' + title + '</strong>' : '') +
            (desc ? '<p style="color:var(--fg-color,#e0e0e0);font-size:0.82rem;margin:6px 0 0;line-height:1.4;">' + desc + '</p>' : '');
        panel.style.opacity = '1';
        active = true;

        if (e && window.innerWidth > 768) {
            let x = e.clientX + 15, y = e.clientY + 15;
            if (x + 340 > window.innerWidth) x = e.clientX - 340;
            if (y + 160 > window.innerHeight) y = e.clientY - 160;
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
        } else {
            // Mobile: fixed bottom
            panel.style.left = '10px';
            panel.style.right = '10px';
            panel.style.bottom = '10px';
            panel.style.top = 'auto';
            panel.style.maxWidth = 'calc(100vw - 20px)';
        }
    }

    function hide() {
        panel.style.opacity = '0';
        active = false;
    }

    document.querySelectorAll('.nav-tooltip').forEach(el => {
        el.addEventListener('mouseenter', e => show(el, e));
        el.addEventListener('mouseleave', hide);
        el.addEventListener('touchstart', e => {
            if (active) { hide(); } else { show(el, e); }
        }, { passive: true });
    });

    // Hide on scroll/click elsewhere
    document.addEventListener('click', e => {
        if (active && !e.target.closest('.nav-tooltip')) hide();
    });
})();
