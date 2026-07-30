/* ============================================================================
   cheatsheets.js — every cheatsheet, as tabs.
   ----------------------------------------------------------------------------
   The cheatsheets already exist as markdown in docs/. Rather than duplicating
   them into HTML (which guarantees the two copies drift), this fetches the
   markdown and renders it, so docs/ stays the single source and the repo-only
   route reads exactly what the site shows.

   Rendering is markdown.js, shared with wiki.html?page= and the Live Editor
   preview, so all three agree and a fix lands once. It escapes before inserting
   any markup: the fetched files are our own, but treating them as untrusted
   costs nothing and means a docs edit cannot introduce script.
   ========================================================================= */

'use strict';

(function () {

    /* Tab order is deliberate: the two purpose-built cheatsheets first, then
       the long combined reference, then the desktop-specific ones. */
    var SHEETS = [
        { id: 'arch',    label: '📦 Arch commands',
          file: 'docs/cheatsheets/arch-commands.md',
          desc: 'pacman, the AUR, systemd, Btrfs snapshots and the security suite.' },
        { id: 'dusky',   label: '🌙 Dusky / Hyprland',
          file: 'docs/cheatsheets/duskyos-hyprland.md',
          desc: 'Every keybind, the advanced commands, and what to do when it misbehaves.' },
        { id: 'full',    label: '📖 Full command reference',
          file: 'docs/helpful-commands.md',
          desc: 'The long one: packages, services, disks, permissions, security auditing, and per-desktop shortcuts.' },
        { id: 'duskyq',  label: '⚡ Dusky quick card',
          file: 'docs/dusky-cheatsheet.md',
          desc: 'The short version, for printing or keeping on a second screen.' }
    ];

    var cache = {};   // file -> raw markdown, so switching tabs refetches nothing

    // Rendering is markdown.js's job now. There were three copies of a
    // markdown renderer on this site — one here, one in live.html, and none at
    // all in wiki.html, whose ?page= handler redirected to the raw .md file
    // instead. One implementation means a fix lands in all three places, and
    // this file no longer carries its own escaping rules to get wrong.
    function render(md) {
        if (typeof window.renderMarkdown !== 'function') {
            // No renderer: show the source as preformatted text rather than a
            // blank tab. Still escaped, still readable, just not styled.
            var pre = document.createElement('pre');
            pre.className = 'md-code';
            pre.textContent = md;
            return pre.outerHTML;
        }
        return window.renderMarkdown(md, { headingPrefix: 'cs-' }).html;
    }

    function el(id) { return document.getElementById(id); }

    function show(sheet) {
        var host = el('cs-content');
        var status = el('cs-status');

        // Reflect the choice in the URL so a tab is shareable and survives reload.
        try {
            var u = new URL(location.href);
            u.searchParams.set('sheet', sheet.id);
            history.replaceState(null, '', u);
        } catch (_) { /* file:// — not important */ }

        [].forEach.call(document.querySelectorAll('.cs-tab'), function (b) {
            var on = b.getAttribute('data-sheet') === sheet.id;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });

        el('cs-desc').textContent = sheet.desc;
        el('cs-source').href = sheet.file;

        function paint(mdText) {
            host.innerHTML = render(mdText);
            host.classList.remove('cs-in');
            // Next frame, so the transition actually runs rather than being
            // collapsed into the same style recalculation.
            requestAnimationFrame(function () { host.classList.add('cs-in'); });
            if (status) status.textContent = '';
            // Highlight the fenced blocks this render just produced. Scoped to
            // the host so it does not re-walk the rest of the page on every
            // tab switch.
            if (typeof window.highlightAll === 'function') window.highlightAll(host);
            wireCopyButtons();
        }

        if (cache[sheet.file]) { paint(cache[sheet.file]); return; }

        if (status) status.textContent = 'Loading…';
        fetch(sheet.file)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function (t) { cache[sheet.file] = t; paint(t); })
            .catch(function (err) {
                host.innerHTML = '';
                if (status) {
                    status.innerHTML = '<strong style="color:var(--accent-orange);">' +
                        'Could not load this cheatsheet.</strong> It is still readable in ' +
                        'the repository: <a href="' + sheet.file + '">' + sheet.file +
                        '</a> (' + esc(err.message) + ')';
                }
            });
    }

    /* A copy button on every code block — the whole point of a cheatsheet is
       getting the command into a terminal. */
    function wireCopyButtons() {
        [].forEach.call(document.querySelectorAll('#cs-content pre.cs-code'), function (pre) {
            if (pre.querySelector('.cs-copy')) return;
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cs-copy';
            b.textContent = 'Copy';
            b.addEventListener('click', function () {
                var code = pre.querySelector('code');
                navigator.clipboard.writeText(code ? code.textContent : '').then(function () {
                    b.textContent = 'Copied';
                    setTimeout(function () { b.textContent = 'Copy'; }, 1400);
                }, function () {
                    b.textContent = 'Blocked';
                    setTimeout(function () { b.textContent = 'Copy'; }, 1800);
                });
            });
            pre.appendChild(b);
        });
    }

    function init() {
        var tabs = el('cs-tabs');
        if (!tabs) return;

        SHEETS.forEach(function (s) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'cs-tab nav-tooltip';
            b.textContent = s.label;
            b.setAttribute('data-sheet', s.id);
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', 'false');
            b.setAttribute('data-title', s.label);
            b.setAttribute('data-desc', s.desc);
            b.addEventListener('click', function () { show(s); });
            tabs.appendChild(b);
        });

        // Left/right arrows move between tabs, as a tablist should.
        tabs.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            var list = [].slice.call(tabs.querySelectorAll('.cs-tab'));
            var at = list.indexOf(document.activeElement);
            if (at === -1) return;
            e.preventDefault();
            var next = list[(at + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
            next.focus();
            next.click();
        });

        var want = null;
        try { want = new URL(location.href).searchParams.get('sheet'); } catch (_) { /* ignore */ }
        var start = SHEETS.filter(function (s) { return s.id === want; })[0] || SHEETS[0];
        show(start);

        if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
