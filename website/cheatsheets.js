/* ============================================================================
   cheatsheets.js — every cheatsheet, as tabs.
   ----------------------------------------------------------------------------
   The cheatsheets already exist as markdown in docs/. Rather than duplicating
   them into HTML (which guarantees the two copies drift), this fetches the
   markdown and renders it, so docs/ stays the single source and the repo-only
   route reads exactly what the site shows.

   The renderer is deliberately small — headings, code fences, inline code,
   tables, lists, links, bold. That is the whole vocabulary these files use. A
   full markdown library would be ~50 KB to gain features no cheatsheet needs.

   Everything is escaped before any markup is added, so a stray `<` in a command
   cannot become an element. The fetched files are our own, but treating them as
   untrusted costs nothing and means a future editor cannot accidentally
   introduce script through a docs edit.
   ========================================================================= */

'use strict';

(function () {

    /* Tab order is deliberate: the two purpose-built cheatsheets first, then
       the long combined reference, then the desktop-specific ones. */
    var SHEETS = [
        { id: 'arch',    label: '📦 Arch commands',
          file: 'docs/cheatsheets/arch-commands.md',
          desc: 'pacman, the AUR, systemd, Btrfs snapshots and the security suite.' },
        { id: 'dusky',   label: '🌙 DuskyOS / Hyprland',
          file: 'docs/cheatsheets/duskyos-hyprland.md',
          desc: 'Every keybind, the advanced commands, and what to do when it misbehaves.' },
        { id: 'full',    label: '📖 Full command reference',
          file: 'docs/helpful-commands.md',
          desc: 'The long one: packages, services, disks, permissions, security auditing, and per-desktop shortcuts.' },
        { id: 'duskyq',  label: '⚡ DuskyOS quick card',
          file: 'docs/dusky-cheatsheet.md',
          desc: 'The short version, for printing or keeping on a second screen.' }
    ];

    var cache = {};   // file -> raw markdown, so switching tabs refetches nothing

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* Inline formatting, applied only to already-escaped text. */
    function inline(t) {
        return t
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
                // Only http(s) and relative links; never javascript: or data:.
                if (/^(https?:)?\/\//.test(href) || /^[\w./#-]+$/.test(href)) {
                    var ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
                    return '<a href="' + href + '"' + ext + '>' + label + '</a>';
                }
                return label;
            });
    }

    function render(md) {
        var out = [], lines = md.split(/\r?\n/);
        var inCode = false, inTable = false, inList = false;

        function closeBlocks() {
            if (inList) { out.push('</ul>'); inList = false; }
            if (inTable) { out.push('</tbody></table></div>'); inTable = false; }
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            // Fenced code
            var fence = line.match(/^```(\w*)\s*$/);
            if (fence) {
                if (inCode) { out.push('</code></pre>'); inCode = false; }
                else {
                    closeBlocks();
                    out.push('<pre class="cs-code"><code data-lang="' + esc(fence[1] || '') + '">');
                    inCode = true;
                }
                continue;
            }
            if (inCode) { out.push(esc(line)); continue; }

            // Tables: | a | b |  with a --- separator row
            if (/^\s*\|/.test(line)) {
                var cells = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');
                if (/^[\s|:-]+$/.test(line)) continue;   // separator row
                if (!inTable) {
                    closeBlocks();
                    out.push('<div class="cs-tablewrap"><table class="cs-table"><tbody>');
                    inTable = true;
                }
                out.push('<tr>' + cells.map(function (c) {
                    return '<td>' + inline(esc(c.trim())) + '</td>';
                }).join('') + '</tr>');
                continue;
            }
            if (inTable && line.trim() === '') { closeBlocks(); continue; }

            // Headings
            var h = line.match(/^(#{1,4})\s+(.*)$/);
            if (h) {
                closeBlocks();
                var lvl = h[1].length;
                var text = inline(esc(h[2]));
                var id = h[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                out.push('<h' + lvl + ' id="cs-' + esc(id) + '">' + text + '</h' + lvl + '>');
                continue;
            }

            // Lists
            if (/^\s*[-*]\s+/.test(line)) {
                if (!inList) { closeBlocks(); out.push('<ul>'); inList = true; }
                out.push('<li>' + inline(esc(line.replace(/^\s*[-*]\s+/, ''))) + '</li>');
                continue;
            }

            if (line.trim() === '') { closeBlocks(); continue; }

            closeBlocks();
            out.push('<p>' + inline(esc(line)) + '</p>');
        }
        if (inCode) out.push('</code></pre>');
        closeBlocks();
        return out.join('\n');
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
