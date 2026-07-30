/* ============================================================================
   shared-ui.js — the parts of the interface that must be identical everywhere.
   ----------------------------------------------------------------------------
   Loaded by every page. Four jobs:

     1. The canonical top navigation, so every page offers the same
        destinations in the same order — hand-copied navs had already drifted.

     2. The persistent control cluster, top right. Built here rather than
        copied into nine HTML files, because a control that exists on eight
        pages and not the ninth is the one a user goes looking for on the ninth.
        Order is fixed: the tooltip switch first, because it is the control that
        explains all the others; then the source repository; then this session's
        generation history.

     3. A warning before you close the tab with unsaved generation history.
        History is sessionStorage, so closing the tab is the moment it is gone
        for good.

     4. Making sure tooltips are actually initialised. tooltip.js does the work;
        this only guarantees it gets a chance to on every page.

   No dependencies, no build step, and it degrades to "nothing happens" rather
   than throwing if a page lacks a piece it expects.
   ========================================================================= */

'use strict';

(function () {
    var REPO_URL = 'https://github.com/tilas01/arch-guides-dynamic';

    /* ── The canonical top navigation ───────────────────────────────────────
       One definition, applied to every page, because hand-copied navs drift:
       an audit found manual.html labelled itself "Manual" instead of "Manual
       Walkthrough" and omitted the Live Editor, site-index.html omitted it too,
       releases.html had three extra entries nobody else had, and live.html,
       repo.html and upload.html had no navigation at all — so the Live Editor
       link appeared to vanish depending on which page you were standing on.

       Rendered here rather than in ten HTML files so that can no longer happen.
       A page that already has a .main-nav has it normalised in place; a page
       with none gets one. */
    var NAV = [
        { href: 'site-index.html',    label: '🔎 Index',
          title: '🔎 Index',
          desc: 'The contents page for the whole project, with a search box that looks through the wiki, every generator and walkthrough question, the security tools, the cheatsheets and the docs at once.' },
        { href: 'index.html',         label: '⚙️ Generator',
          title: '⚙️ Dynamic Generator',
          desc: 'Set every option in one form and generate a custom Arch install script and guide. Fastest on a desktop when you already know what you want.' },
        { href: 'manual.html',        label: '🧭 Manual Walkthrough',
          title: '🧭 Manual Walkthrough',
          desc: 'One question at a time, every option explained, the guide building as you answer. Same output as the generator. Recommended on mobile, or if you are not yet sure what you want.' },
        // Live Editor sits directly after the two generators because that is
        // where their output goes — the three are one flow, and separating them
        // with the reference pages made the editor look like an unrelated tool.
        { href: 'live.html',          label: '📝 Live Editor',
          title: '📝 Live Editor',
          desc: 'Edit a generated script and guide side by side, browse this session\'s generation history, and download the results.' },
        { href: 'iso-verify.html',    label: '💿 Verify Arch ISO',
          title: '💿 Verify Arch ISO',
          desc: 'Hash an Arch ISO in your browser and compare it against checksums from mirrors other than the one that served the image. Nothing is uploaded.' },
        { href: 'security-tools.html', label: '🦀 Security Tools',
          title: '🦀 Arch Security Tools',
          desc: 'Every Rust security tool explained, with live release statistics, plus the vetted third-party hardening tools.' },
        { href: 'wiki.html',          label: '📖 Wiki',
          title: '📖 Wiki / Documentation',
          desc: 'Every option explained in full, plus firmware lockdown, dual boot, ARM, AUR safety and the cheatsheets.' },
        // Cheatsheets last, deliberately: it is what you reach for after the
        // system is installed, not while you are deciding how to install it.
        { href: 'cheatsheets.html',   label: '📋 Cheatsheets',
          title: '📋 Cheatsheets',
          desc: 'Every cheatsheet in one tabbed page: Arch and pacman, the AUR, systemd, Btrfs snapshots, LUKS, the Rust security suite, and Dusky and Hyprland keybinds. Searchable and copyable.' }
    ];

    function currentPage() {
        return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    }

    function buildNav(header) {
        var here = currentPage();
        var nav = header.querySelector('nav.main-nav');
        if (!nav) {
            // Pages with no nav at all (live.html, repo.html, upload.html) get
            // one, so every page reaches every other page.
            nav = document.createElement('nav');
            nav.className = 'main-nav';
            var banner = header.querySelector('.banner-link');
            var byline = document.getElementById('site-byline');
            var after = byline || banner;
            if (after && after.parentNode) after.parentNode.insertBefore(nav, after.nextSibling);
            else header.appendChild(nav);
        }
        nav.setAttribute('aria-label', 'Site');
        nav.innerHTML = '';

        NAV.forEach(function (item, i) {
            if (i) {
                var sep = document.createElement('span');
                sep.className = 'nav-sep';
                sep.textContent = '|';
                nav.appendChild(sep);
            }
            var a = document.createElement('a');
            a.className = 'nav-link nav-tooltip';
            a.href = item.href;
            a.textContent = item.label;
            a.setAttribute('data-title', item.title);
            a.setAttribute('data-desc', item.desc);
            // Mark, but do not disable, the page you are on: it stays clickable
            // so it doubles as a reload, and the colour says where you are.
            if (item.href.toLowerCase() === here) {
                a.setAttribute('aria-current', 'page');
                a.style.color = 'var(--accent-cyan)';
            }
            nav.appendChild(a);
        });
    }

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
        if (!header) {
            // live.html, releases.html and repo.html were written without a
            // <header>, which is exactly why they ended up with no navigation
            // and the Live Editor link appeared to vanish on them. Create one
            // rather than bailing, so every page gets the same header.
            header = document.createElement('header');
            document.body.insertBefore(header, document.body.firstChild);
        }

        var bar = document.getElementById('header-controls');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'header-controls';
            bar.className = 'js-only';
            header.insertBefore(bar, header.firstChild);
        }
        var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

        /* Tooltip master toggle, first in the row. tooltip.js owns the
           behaviour; this only guarantees the control exists on pages that
           never declared one. It is the one control that must always be
           reachable, because it is the one that explains all the others. */
        var tt = document.getElementById('toggle-tooltips-btn');
        if (!tt) {
            tt = document.createElement('button');
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
        }
        bar.appendChild(tt);

        /* Source repository. A drawn octopus rather than the GitHub mark: that
           logo is a trademark, and a pixel one matches the rest of the set. */
        var gh = document.getElementById('repo-link-btn');
        if (!gh) {
            gh = document.createElement('a');
            gh.id = 'repo-link-btn';
            gh.href = REPO_URL;
            gh.target = '_blank';
            gh.rel = 'noopener';
            gh.className = 'ctrl-icon nav-tooltip';
            gh.setAttribute('aria-label', 'Source repository');
            gh.setAttribute('data-title', '🐙 Source repository');
            gh.setAttribute('data-desc',
                'Every page here, every generated script, the Rust security tools and ' +
                'the manual guides, in one public repository. Opens in a new tab.');
            gh.innerHTML = '<img src="img/icons/source-repo-32.png" alt="" ' +
                           'width="22" height="22" class="ctrl-pixel">';
        }
        bar.appendChild(gh);

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
        }
        if (hist) bar.appendChild(hist);

        /* Fixed left-to-right order, applied after building so it does not
           depend on which controls a page already declared in its own HTML:
           verify-ISO, history, tooltips, repository. The octopus sits furthest
           right, with the tooltip switch immediately to its left. */
        ['iso-verify-btn', 'history-btn', 'toggle-tooltips-btn', 'repo-link-btn']
            .forEach(function (id) {
                var el = document.getElementById(id);
                if (el && el.parentNode === bar) bar.appendChild(el);
            });

        buildByline(header);
        buildNav(header);

        refreshHistoryBadge();

        /* Do not link the page to itself. */
        [].forEach.call(bar.querySelectorAll('a[href]'), function (a) {
            var target = a.getAttribute('href').toLowerCase();
            if (target === here) a.classList.add('ctrl-current');
        });
    }

    /* The verified badge lives on the ISO page itself, not in the navigation.
       A tick in a nav bar has to be explained; a tick next to the Arch mark on
       the page that does the verifying explains itself. It is a status readout,
       lit only after a hash has matched two independent mirrors in this
       session, so it is not something you can tick yourself. */
    function refreshIsoBadge() {
        var badge = document.getElementById('iso-verified-badge');
        if (!badge) return;
        var done = isoVerified();
        badge.classList.toggle('is-verified', done);
        var label = badge.querySelector('.iso-badge-label');
        if (label) {
            label.textContent = done
                ? 'Verified this session'
                : 'Not verified yet';
        }
    }

    function refreshHistoryBadge() {
        var el = document.getElementById('history-btn');
        if (!el) return;
        var n = historyCount();
        el.classList.toggle('ctrl-unsaved', n > 0 && !historySaved());
        el.setAttribute('data-count', String(n));
    }

    /* "by tilas01 on GitHub" beneath the banner, linking where the octopus
       links. Added here rather than in each page's HTML so it cannot end up on
       some pages and not others. */
    function buildByline(header) {
        if (document.getElementById('site-byline')) return;
        var banner = header.querySelector('.banner-link');
        if (!banner) return;
        var a = document.createElement('a');
        a.id = 'site-byline';
        a.href = REPO_URL;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'nav-tooltip';
        a.textContent = 'by tilas01 on GitHub';
        a.setAttribute('data-title', 'by tilas01 on GitHub');
        a.setAttribute('data-desc',
            'Written and maintained by tilas01. Opens the source repository — ' +
            'the same place the octopus goes.');
        banner.parentNode.insertBefore(a, banner.nextSibling);
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
        try { refreshIsoBadge(); } catch (err) { console.error('shared-ui: iso badge', err); }
        try { wireUnloadGuard(); } catch (err) { console.error('shared-ui: unload', err); }
        try { ensureTooltips(); } catch (err) { console.error('shared-ui: tooltips', err); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
