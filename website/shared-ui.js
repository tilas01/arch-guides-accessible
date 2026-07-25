/* ============================================================================
   shared-ui.js — the parts of the interface that must be identical everywhere.
   ----------------------------------------------------------------------------
   Loaded by every page. Three jobs:

     1. The persistent control cluster, top-left: verify-ISO, repository,
        history, tooltips. Built here rather than copied into eight HTML files,
        because a control that exists on seven pages and not the eighth is the
        one a user goes looking for on the eighth.

     2. A warning before you close the tab with unsaved generation history.
        History is sessionStorage, so closing the tab is the moment it is gone
        for good.

     3. Making sure tooltips are actually initialised. tooltip.js does the work;
        this only guarantees it gets a chance to on every page.

   No dependencies, no build step, and it degrades to "nothing happens" rather
   than throwing if a page lacks a piece it expects.
   ========================================================================= */

'use strict';

(function () {
    var REPO_URL = 'https://github.com/tilas01/arch-guides-dynamic';

    /* Set by iso-verify.js when a hash matches two independent mirrors. Session
       scoped on purpose: the claim "you verified an ISO" should not outlive the
       session that verified it. */
    var ISO_VERIFIED_KEY = 'arch_iso_verified';
    var HISTORY_KEY = 'arch_gen_history';
    var HISTORY_SAVED_KEY = 'arch_gen_history_saved';

    function ss(fn, fallback) {
        // sessionStorage throws in private mode in some browsers, and in any
        // sandboxed iframe. Treat it as absent rather than letting it take the
        // whole script down.
        try { return fn(); } catch (_) { return fallback; }
    }

    function isoVerified() {
        return ss(function () { return sessionStorage.getItem(ISO_VERIFIED_KEY) === '1'; }, false);
    }

    function historyCount() {
        return ss(function () {
            var raw = sessionStorage.getItem(HISTORY_KEY);
            if (!raw) return 0;
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.length : 0;
        }, 0);
    }

    function historySaved() {
        return ss(function () { return sessionStorage.getItem(HISTORY_SAVED_KEY) === '1'; }, true);
    }

    /* Pages call this when the user downloads or exports, so the close warning
       stops nagging about work that is no longer only in the tab. */
    window.markHistorySaved = function () {
        ss(function () { sessionStorage.setItem(HISTORY_SAVED_KEY, '1'); });
        refreshHistoryBadge();
    };

    window.markIsoVerified = function () {
        ss(function () { sessionStorage.setItem(ISO_VERIFIED_KEY, '1'); });
        refreshIsoBadge();
    };

    /* ── 1. The control cluster ─────────────────────────────────────────── */

    function buildControls() {
        var header = document.querySelector('header');
        if (!header) return;

        var bar = document.getElementById('header-controls');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'header-controls';
            bar.className = 'js-only';
            header.insertBefore(bar, header.firstChild);
        }
        bar.classList.add('header-controls-left');

        var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

        /* Verify-ISO. First in the row, before history, as requested: it is the
           step that comes before everything else chronologically too. The tick
           reflects whether a verification actually passed in this session — it
           is a status readout, not a checkbox you can tick yourself. */
        if (!document.getElementById('iso-verify-btn')) {
            var iso = document.createElement('a');
            iso.id = 'iso-verify-btn';
            iso.href = 'iso-verify.html';
            iso.className = 'ctrl-icon nav-tooltip';
            iso.setAttribute('aria-label', 'Verify an Arch ISO');
            iso.setAttribute('data-title', '💿 Verify Arch ISO');
            iso.setAttribute('data-desc',
                'Hash an Arch ISO in your browser and check it against two mirrors ' +
                'other than the one that served it. Download the image, its signature ' +
                'and the checksums straight from here. The tick lights up once a ' +
                'verification has passed in this session.');
            iso.innerHTML =
                '<img src="img/icons/arch-guides-32.png" alt="" width="22" height="22" ' +
                'class="ctrl-arch-logo">' +
                '<span class="ctrl-tick" aria-hidden="true">✓</span>';
            bar.insertBefore(iso, bar.firstChild);
        }

        /* Repository. */
        if (!document.getElementById('repo-link-btn')) {
            var gh = document.createElement('a');
            gh.id = 'repo-link-btn';
            gh.href = REPO_URL;
            gh.target = '_blank';
            gh.rel = 'noopener';
            gh.className = 'ctrl-icon nav-tooltip';
            gh.setAttribute('aria-label', 'GitHub repository');
            gh.setAttribute('data-title', '🐙 Source repository');
            gh.setAttribute('data-desc',
                'Every page here, every generated script, the Rust security tools and ' +
                'the manual guides, in one public repository. Opens in a new tab.');
            gh.textContent = '🐙';
            var isoEl = document.getElementById('iso-verify-btn');
            bar.insertBefore(gh, isoEl ? isoEl.nextSibling : bar.firstChild);
        }

        /* History, only where the page can actually show it. A button that
           opens nothing is worse than no button. */
        var hist = document.getElementById('history-btn');
        if (!hist && typeof window.toggleHistoryModal === 'function') {
            hist = document.createElement('button');
            hist.id = 'history-btn';
            hist.type = 'button';
            hist.className = 'ctrl-icon nav-tooltip';
            hist.setAttribute('aria-label', 'Generation history');
            hist.setAttribute('data-title', '🕘 Generation History');
            hist.setAttribute('data-desc',
                'Reload anything you generated in this session. Session-only — no ' +
                'cookies, and it is gone when the tab closes, so export anything you ' +
                'want to keep.');
            hist.textContent = '🕘';
            hist.addEventListener('click', function () { window.toggleHistoryModal(); });
            bar.appendChild(hist);
        }

        /* Tooltip master toggle. tooltip.js owns the behaviour; this only
           guarantees the control exists on pages that never declared one. */
        if (!document.getElementById('toggle-tooltips-btn')) {
            var tt = document.createElement('button');
            tt.id = 'toggle-tooltips-btn';
            tt.type = 'button';
            tt.className = 'ctrl-icon tooltip-always';
            tt.setAttribute('aria-label', 'Toggle tooltips');
            tt.setAttribute('aria-pressed', 'true');
            tt.setAttribute('data-title', 'ℹ️ Tooltips: ON');
            tt.setAttribute('data-desc',
                'Tooltips are ON. Hover on desktop, or tap on mobile, for an ' +
                'explanation of any control. Click to turn them off — this button ' +
                'keeps its own tooltip either way, so you can always find your way back.');
            tt.textContent = 'ℹ️';
            bar.appendChild(tt);
        }

        refreshIsoBadge();
        refreshHistoryBadge();

        /* Do not link the page to itself. */
        [].forEach.call(bar.querySelectorAll('a[href]'), function (a) {
            var target = a.getAttribute('href').toLowerCase();
            if (target === here) a.classList.add('ctrl-current');
        });
    }

    function refreshIsoBadge() {
        var el = document.getElementById('iso-verify-btn');
        if (!el) return;
        var done = isoVerified();
        el.classList.toggle('ctrl-verified', done);
        if (done) {
            el.setAttribute('data-title', '💿 Verify Arch ISO — verified');
        }
    }

    function refreshHistoryBadge() {
        var el = document.getElementById('history-btn');
        if (!el) return;
        var n = historyCount();
        el.classList.toggle('ctrl-unsaved', n > 0 && !historySaved());
        el.setAttribute('data-count', String(n));
    }

    /* ── 2. Do not lose the history by closing the tab ──────────────────── */

    function wireUnloadGuard() {
        window.addEventListener('beforeunload', function (e) {
            if (historyCount() === 0 || historySaved()) return;
            // Browsers show their own wording; the string only has to be
            // non-empty for the prompt to appear at all.
            e.preventDefault();
            e.returnValue = '';
            return '';
        });

        /* Keep the badge honest if another tab or the generator changes it. */
        window.addEventListener('pageshow', refreshHistoryBadge);
        document.addEventListener('arch:history-changed', refreshHistoryBadge);
    }

    /* ── 3. Tooltips, everywhere ────────────────────────────────────────── */

    function ensureTooltips() {
        // tooltip.js binds on DOMContentLoaded. Anything this script injected
        // afterwards needs a rescan, which tooltip.js exposes.
        if (typeof window.refreshTooltips === 'function') {
            window.refreshTooltips();
        } else {
            // tooltip.js may still be loading; try once more on window load.
            window.addEventListener('load', function () {
                if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
            });
        }
    }

    function init() {
        try { buildControls(); } catch (err) { console.error('shared-ui: controls', err); }
        try { wireUnloadGuard(); } catch (err) { console.error('shared-ui: unload', err); }
        try { ensureTooltips(); } catch (err) { console.error('shared-ui: tooltips', err); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
