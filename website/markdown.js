/* ============================================================================
   markdown.js — the one markdown renderer on this site.
   ----------------------------------------------------------------------------
   There were three before this: a private one in cheatsheets.js, a chain of
   .replace() calls in live.html, and — worst — none at all in wiki.html, whose
   `?page=` handler did `location.replace('docs/' + page)`. That last one is why
   right-clicking an option, or following a docs link from the index, dropped the
   reader onto a raw markdown file: grey Times New Roman, no navigation, no way
   back, nothing that looked like the site they were just on.

   So this renders instead of redirecting, and it is shared so a fix lands
   everywhere at once.

   Deliberately not a CommonMark implementation. It covers what the documents in
   docs/ actually use, and it is ~9 KB rather than the ~50 KB of a full library —
   on a page whose job is to load fast in a live environment over a stranger's
   wifi, that difference is the whole argument.

   The one rule it must not break: **escape first**. Every document here is
   fetched at runtime, and one of them will eventually contain a `<` that is
   meant to be a less-than sign. Fenced blocks are lifted out before anything
   else runs so their contents cannot be reinterpreted as markdown, and
   everything else is escaped before a single tag is inserted.
   ========================================================================= */

'use strict';

(function () {

    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /** A stable, readable anchor for a heading. */
    function slug(text) {
        return String(text).toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 60);
    }

    /* GitHub's alert syntax. The docs use these six and they were rendering as
       literal "[!TIP]" text inside an ordinary blockquote, which reads as a
       typo. Each maps to a tinted callout in the site palette. */
    var ALERTS = {
        NOTE:      { cls: 'md-note',      icon: 'ℹ️', label: 'Note' },
        TIP:       { cls: 'md-tip',       icon: '💡', label: 'Tip' },
        IMPORTANT: { cls: 'md-important', icon: '❗', label: 'Important' },
        WARNING:   { cls: 'md-warning',   icon: '⚠️', label: 'Warning' },
        CAUTION:   { cls: 'md-caution',   icon: '🛑', label: 'Caution' },
        DANGER:    { cls: 'md-caution',   icon: '🛑', label: 'Danger' }
    };

    /** Inline formatting. `s` must already be escaped. */
    function inline(s) {
        return s
            // Images before links — an image is a link with a ! in front, and
            // the link rule would otherwise eat it and leave a stray !.
            .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
                function (_, alt, src) {
                    return /^(?:https?:)?\/\/|^[\w./-]+$/.test(src)
                        ? '<img src="' + src + '" alt="' + alt + '" loading="lazy">'
                        : alt;
                })
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, text, href) {
                // Only http(s), fragments and relative paths. A javascript: or
                // data: URL in a fetched document must not become a live link.
                if (!/^(?:https?:\/\/|#|[\w./?=&%-]+$)/i.test(href)) return text;
                var ext = /^https?:\/\//i.test(href);
                return '<a href="' + href + '"' +
                       (ext ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a>';
            })
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
            .replace(/(^|\s)__([^_]+)__/g, '$1<strong>$2</strong>')
            .replace(/~~([^~]+)~~/g, '<del>$1</del>')
            // <kbd> is written literally in the cheatsheets and is safe, so put
            // it back after escaping rather than showing &lt;kbd&gt;.
            .replace(/&lt;kbd&gt;/g, '<kbd>').replace(/&lt;\/kbd&gt;/g, '</kbd>')
            .replace(/&lt;br&gt;|&lt;br\s*\/&gt;/g, '<br>');
    }

    /**
     * Render markdown to HTML.
     * @param {string} md
     * @param {{headingIds?: boolean, headingPrefix?: string}} [opts]
     */
    function render(md, opts) {
        opts = opts || {};
        var prefix = opts.headingPrefix || '';
        var out = [];
        var headings = [];
        var lines = String(md).replace(/\r\n?/g, '\n').split('\n');

        /* Soft wraps have to be joined before anything else looks at the text.
           Every document in docs/ is hard-wrapped at about 80 columns, so a
           single sentence is three or four source lines. Treating each line as
           its own block turned one paragraph into three <p>s and — worse — cut
           list items in half: the first line became the <li> and the rest
           became loose paragraphs sitting outside the list, unindented and
           visually detached from the bullet they belong to.

           A line continues the previous one unless it starts something new. */
        function startsBlock(l) {
            return l.trim() === ''                       // blank
                || /^\s*```/.test(l)                     // fence
                || /^#{1,6}\s/.test(l)                   // heading
                || /^\s*>/.test(l)                       // quote or alert
                || /^\s*(?:[-*+]|\d+\.)\s/.test(l)       // list item
                || /^\s*\|/.test(l)                      // table row
                || /^\s*(?:---+|\*\*\*+|___+)\s*$/.test(l) // rule
                || /^\s{4,}\S/.test(l);                  // indented block
        }

        var joined = [];
        var fenced = false;
        for (var j = 0; j < lines.length; j++) {
            var cur = lines[j];
            if (/^\s*```/.test(cur)) fenced = !fenced;
            // Inside a fence every line is literal — joining would corrupt the
            // code. Same for a table, where each row is its own line.
            if (fenced || /^\s*\|/.test(cur)) { joined.push(cur); continue; }

            var prev = joined.length ? joined[joined.length - 1] : null;
            if (prev === null || prev.trim() === '' || cur.trim() === '') { joined.push(cur); continue; }

            var prevQuote = /^\s*>/.test(prev);
            var curQuote  = /^\s*>/.test(cur);

            if (prevQuote && curQuote) {
                // A blockquote wrapped over several lines. Join unless the
                // previous line was only the alert marker — "> [!WARNING]" has
                // to stay on its own so the label renders as a label rather
                // than as the first words of the sentence.
                if (/^\s*>\s*\[!\w+\]\s*$/.test(prev)) { joined.push(cur); continue; }
                joined[joined.length - 1] = prev + ' ' + cur.replace(/^\s*>\s?/, '').trim();
                continue;
            }

            // A plain continuation line extends whatever it follows — a
            // paragraph, or a list item, so the rest of the sentence stays
            // inside the bullet instead of falling out below it.
            if (!startsBlock(cur) && (!startsBlock(prev) || /^\s*(?:[-*+]|\d+\.)\s/.test(prev))) {
                joined[joined.length - 1] = prev + ' ' + cur.trim();
                continue;
            }

            joined.push(cur);
        }
        lines = joined;

        var inCode = false, inList = false, listTag = 'ul', inTable = false, inQuote = null;

        function closeList()  { if (inList)  { out.push('</' + listTag + '>'); inList = false; } }
        function closeTable() { if (inTable) { out.push('</tbody></table></div>'); inTable = false; } }
        function closeQuote() { if (inQuote) { out.push('</div>'); inQuote = null; } }
        function closeAll()   { closeList(); closeTable(); closeQuote(); }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            /* Fenced code. Taken verbatim: nothing inside is markdown. The
               language- class is what highlight.js keys off. */
            var fence = /^\s*```+\s*([\w+-]*)\s*$/.exec(line);
            if (fence) {
                if (inCode) { out.push('</code></pre>'); inCode = false; }
                else {
                    closeAll();
                    var lang = fence[1] || 'text';
                    out.push('<pre class="md-code"><code class="language-' + esc(lang) +
                             '" data-lang="' + esc(lang) + '">');
                    inCode = true;
                }
                continue;
            }
            if (inCode) { out.push(esc(line)); continue; }

            /* Headings, with anchors so the wiki and the index can deep-link
               into a rendered document. */
            var h = /^(#{1,6})\s+(.*)$/.exec(line);
            if (h) {
                closeAll();
                var lvl = h[1].length;
                var raw = h[2].replace(/\s*#+\s*$/, '');
                var id = prefix + slug(raw);
                headings.push({ level: lvl, text: raw, id: id });
                out.push('<h' + lvl + ' id="' + esc(id) + '">' + inline(esc(raw)) + '</h' + lvl + '>');
                continue;
            }

            if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) { closeAll(); out.push('<hr>'); continue; }

            /* Blockquotes and GitHub alerts. */
            var q = /^\s*>\s?(.*)$/.exec(line);
            if (q) {
                var body = q[1];
                var alert = /^\[!(\w+)\]\s*(.*)$/.exec(body);
                if (alert && ALERTS[alert[1].toUpperCase()]) {
                    closeAll();
                    var a = ALERTS[alert[1].toUpperCase()];
                    inQuote = a.cls;
                    out.push('<div class="md-alert ' + a.cls + '">' +
                             '<span class="md-alert-head">' + a.icon + ' ' + a.label + '</span>');
                    if (alert[2]) out.push('<p>' + inline(esc(alert[2])) + '</p>');
                    continue;
                }
                if (!inQuote) { closeList(); closeTable(); inQuote = 'md-quote';
                                out.push('<div class="md-alert md-quote">'); }
                if (body.trim()) out.push('<p>' + inline(esc(body)) + '</p>');
                continue;
            }
            if (inQuote && line.trim() === '') { closeQuote(); continue; }

            /* Tables: a row of pipes, with a --- separator that is not emitted.
               Cells in the first row become headers. */
            if (/^\s*\|.*\|\s*$/.test(line)) {
                if (/^[\s|:-]+$/.test(line)) continue;
                var cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
                var head = false;
                if (!inTable) {
                    closeList(); closeQuote();
                    out.push('<div class="md-tablewrap"><table class="md-table"><tbody>');
                    inTable = true;
                    // Header row if the next line is the separator.
                    head = /^[\s|:-]+$/.test(lines[i + 1] || '');
                }
                out.push('<tr>' + cells.map(function (c) {
                    var tag = head ? 'th' : 'td';
                    return '<' + tag + '>' + inline(esc(c.trim())) + '</' + tag + '>';
                }).join('') + '</tr>');
                continue;
            }
            if (inTable && line.trim() === '') { closeTable(); continue; }

            /* Lists. Ordered and unordered, one level — the documents here do
               not nest deeper, and guessing at nesting produces worse output
               than not attempting it. */
            var li = /^\s*(?:([-*+])|(\d+)\.)\s+(.*)$/.exec(line);
            if (li) {
                var wantTag = li[1] ? 'ul' : 'ol';
                if (inList && listTag !== wantTag) closeList();
                if (!inList) { closeTable(); closeQuote(); listTag = wantTag;
                               out.push('<' + wantTag + '>'); inList = true; }
                out.push('<li>' + inline(esc(li[3])) + '</li>');
                continue;
            }

            if (line.trim() === '') { closeAll(); continue; }

            closeAll();
            out.push('<p>' + inline(esc(line)) + '</p>');
        }

        if (inCode) out.push('</code></pre>');
        closeAll();

        return { html: out.join('\n'), headings: headings };
    }

    /**
     * Fetch a markdown document and render it into `host`.
     * Resolves to the heading list, or rejects with a reason worth showing.
     */
    function renderInto(host, url, opts) {
        if (!host) return Promise.reject(new Error('no host element'));
        if (typeof fetch !== 'function') {
            // Old engine, or a file:// origin where fetch is blocked. Say so and
            // hand over the direct link rather than showing an empty page.
            return Promise.reject(new Error('no-fetch'));
        }
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.text();
        }).then(function (text) {
            /* A .txt file is not markdown and must not be parsed as it. The
               waiver and the licence are hard-wrapped plain text where the
               wrapping is load-bearing — running them through the markdown
               renderer would join their lines, turn "  a. data loss" into a
               list, and make the numbered clauses of a legal document reflow.
               Shown verbatim, in the site's own frame and typeface. */
            if (/\.txt(?:[?#]|$)/i.test(url)) {
                var pre = document.createElement('pre');
                pre.className = 'md-plaintext';
                pre.textContent = text;
                host.innerHTML = '';
                host.appendChild(pre);
                if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
                return [];
            }
            var res = render(text, opts);
            host.innerHTML = res.html;
            if (typeof window.highlightAll === 'function') window.highlightAll(host);
            if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
            return res.headings;
        });
    }

    window.renderMarkdown = render;
    window.renderMarkdownInto = renderInto;
})();
