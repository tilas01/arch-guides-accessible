/* ============================================================================
   highlight.js — syntax highlighting, in the site's own palette.
   ----------------------------------------------------------------------------
   Self-contained on purpose. GitHub Pages serves this over a strict origin and
   the whole point of the project is that you can read every line before you run
   it — pulling a highlighter off a CDN would mean asking people to trust a
   third party's minified bundle to render the very scripts they are being told
   to audit. It would also break the moment the CDN did, and this site has to
   work from a USB stick in a live environment with no network.

   So: a small tokeniser, five grammars, no dependencies, no build step.

   Two rules it must never break.

     1. Escape before inserting. Highlighted text includes hostnames, usernames
        and disk paths the user typed. Tokens are matched against the RAW source
        and escaped as they are wrapped, never the other way round — escaping
        first and then matching is how highlighters end up matching inside
        &quot; and producing broken markup.

     2. textContent must still be the exact original. Every copy button on this
        site reads textContent, and a copy button that returns something other
        than what is on screen would hand someone a subtly different install
        script. The wrapping only adds <span>s; it changes no characters.
   ========================================================================= */

'use strict';

(function () {

    /* Highlighting a 6,000-line generated script produces tens of thousands of
       spans and janks the page for no benefit — nobody reads that by eye. Above
       this, the block is left as plain monospace text, which is still correct,
       just uncoloured. */
    var MAX_CHARS = 120000;

    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ── Grammars ───────────────────────────────────────────────────────────
       Each is an ordered list. First match at a position wins, so comments and
       strings must come before anything that could match inside them. */

    var GRAMMARS = {
        bash: [
            ['comment',  /#[^\n]*/],
            // Heredoc bodies are matched whole so their contents are not
            // re-tokenised as shell — a config file inside a heredoc is not
            // shell, and colouring it as such is worse than leaving it plain.
            ['string',   /<<-?\s*'?([A-Za-z_][A-Za-z0-9_]*)'?[\s\S]*?^\s*\1\s*$/m],
            ['string',   /"(?:\\.|[^"\\])*"/],
            ['string',   /'(?:[^'])*'/],
            ['variable', /\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*|\$[0-9@*?#!$]/],
            ['keyword',  /\b(?:if|then|elif|else|fi|for|while|until|do|done|case|esac|in|function|select|return|break|continue|local|export|readonly|declare|set|shift|trap|exit|source)\b/],
            ['builtin',  /\b(?:pacman|pacstrap|paru|yay|makepkg|genfstab|arch-chroot|mkinitcpio|systemctl|localectl|timedatectl|hwclock|useradd|usermod|passwd|groupadd|chsh|cryptsetup|mkfs|mkswap|swapon|mount|umount|lsblk|blkid|sgdisk|parted|fdisk|btrfs|bootctl|grub-install|grub-mkconfig|efibootmgr|sbctl|reflector|curl|wget|gpg|sha256sum|b2sum|ssh-keygen|ufw|iptables|firewall-cmd|chmod|chown|chattr|mkdir|rmdir|cp|mv|rm|ln|cat|tee|sed|awk|grep|find|tar|git|echo|printf|read|sleep|reboot|shutdown|dd|sync|lsusb|lspci|uname|hostnamectl|ln|install|nano|vim|less)\b/],
            ['number',   /\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b/],
            ['operator', /&&|\|\||[|&;<>()](?![^\s])|[=!<>]=|[-+*/%|&<>!=]/],
            ['flag',     /(?:^|\s)(--?[A-Za-z][\w-]*)/],
        ],

        markdown: [
            ['md-fence',  /^```[\s\S]*?^```/m],
            ['md-head',   /^#{1,6}[^\n]*/m],
            ['md-quote',  /^>[^\n]*/m],
            ['md-rule',   /^(?:---+|\*\*\*+|___+)\s*$/m],
            ['md-code',   /`[^`\n]+`/],
            ['md-link',   /!?\[[^\]\n]*\]\([^)\n]*\)/],
            ['md-bold',   /\*\*[^*\n]+\*\*|__[^_\n]+__/],
            ['md-em',     /(?<![*\w])\*[^*\n]+\*(?![*\w])/],
            ['md-list',   /^\s*(?:[-*+]|\d+\.)\s/m],
            ['md-table',  /^\s*\|[^\n]*\|\s*$/m],
        ],

        ini: [
            ['comment',  /[#;][^\n]*/],
            ['md-head',  /^\s*\[[^\]\n]*\]/m],
            ['string',   /"(?:\\.|[^"\\])*"|'(?:[^'])*'/],
            ['keyword',  /^\s*[A-Za-z_][\w.\- ]*(?=\s*=)/m],
            ['number',   /\b\d+(?:\.\d+)?\b/],
            ['operator', /=/],
        ],

        json: [
            ['comment',  /\/\/[^\n]*/],
            ['keyword',  /"(?:\\.|[^"\\])*"(?=\s*:)/],
            ['string',   /"(?:\\.|[^"\\])*"/],
            ['number',   /-?\b\d+(?:\.\d+)?(?:[eE][-+]?\d+)?\b/],
            ['builtin',  /\b(?:true|false|null)\b/],
            ['operator', /[{}[\],:]/],
        ],

        diff: [
            ['diff-add', /^\+[^\n]*/m],
            ['diff-del', /^-[^\n]*/m],
            ['md-head',  /^@@[^\n]*@@/m],
        ],
    };

    // Aliases, so a block can be labelled with whatever its author called it.
    var ALIASES = {
        sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', terminal: 'bash',
        md: 'markdown', mkd: 'markdown',
        conf: 'ini', config: 'ini', toml: 'ini', cfg: 'ini', desktop: 'ini',
        patch: 'diff',
    };

    var LABELS = {
        bash: 'bash', markdown: 'markdown', ini: 'config', json: 'json',
        diff: 'diff', text: 'text',
    };

    /** Build one combined sticky regex per grammar, cached. */
    var compiled = {};
    function compile(lang) {
        if (compiled[lang]) return compiled[lang];
        var rules = GRAMMARS[lang];
        if (!rules) return (compiled[lang] = null);
        var names = [];
        var source = rules.map(function (r) {
            names.push(r[0]);
            // Each rule becomes one group. Any groups inside a rule become
            // non-capturing so the group index stays 1:1 with the rule index —
            // except bash's heredoc, which needs its backreference, so it is
            // handled by matching the whole thing and ignoring the inner group.
            return '(' + r[1].source + ')';
        }).join('|');
        var flags = 'gm';
        // Some rules use lookbehind; every engine this site targets supports it,
        // but fall back to a grammar without them rather than throwing and
        // taking the whole file with it.
        var re;
        try {
            re = new RegExp(source, flags);
        } catch (_) {
            return (compiled[lang] = null);
        }
        return (compiled[lang] = { re: re, names: names, rules: rules });
    }

    /**
     * Highlight `code` as `lang`, returning HTML.
     * Everything not matched by a rule is emitted escaped and unwrapped.
     */
    function highlight(code, lang) {
        lang = ALIASES[lang] || lang;
        var g = compile(lang);
        if (!g) return esc(code);

        var out = '';
        var last = 0;
        var m;
        g.re.lastIndex = 0;

        while ((m = g.re.exec(code)) !== null) {
            // A rule that can match empty would spin forever.
            if (m[0] === '') { g.re.lastIndex++; continue; }

            // Which alternative fired? Groups are 1:1 with rules, and a rule's
            // own inner groups follow it, so walk from the front and take the
            // first defined one whose index maps to a rule.
            var type = null, idx = 0, count = 0;
            for (var i = 0; i < g.rules.length; i++) {
                count++;
                if (m[count] !== undefined) { type = g.names[i]; idx = count; break; }
                // Skip over this rule's own capture groups.
                count += countGroups(g.rules[i][1].source);
            }
            if (type === null) { g.re.lastIndex = m.index + m[0].length; continue; }

            out += esc(code.slice(last, m.index));

            // The `flag` rule deliberately captures leading whitespace so it
            // only matches a real argument; emit that whitespace unwrapped.
            var text = m[0];
            if (type === 'flag') {
                var lead = text.length - text.replace(/^\s+/, '').length;
                out += esc(text.slice(0, lead));
                text = text.slice(lead);
            }

            // A double-quoted shell string still expands variables, and in a
            // real script that is where nearly all of them are — "$DISK",
            // "${DISK}p2". Leaving them the flat colour of the string makes the
            // one thing worth spotting in a partitioning command invisible.
            // Single quotes expand nothing, so they stay flat, which is exactly
            // the distinction worth showing.
            var inner = (lang === 'bash' && type === 'string' && text.charAt(0) === '"')
                ? escWithVars(text)
                : esc(text);

            out += '<span class="tk-' + type + '">' + inner + '</span>';
            last = m.index + m[0].length;
            g.re.lastIndex = last;
        }
        out += esc(code.slice(last));
        return out;
    }

    var VAR_RE = /\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_]*|\$[0-9@*?#!$]/g;

    /** Escape `s`, wrapping any shell expansions found inside it. */
    function escWithVars(s) {
        var out = '', last = 0, m;
        VAR_RE.lastIndex = 0;
        while ((m = VAR_RE.exec(s)) !== null) {
            out += esc(s.slice(last, m.index));
            out += '<span class="tk-variable">' + esc(m[0]) + '</span>';
            last = m.index + m[0].length;
        }
        return out + esc(s.slice(last));
    }

    /** Capture groups in a pattern source, ignoring (?: (?= (?! (?<= and \( . */
    function countGroups(src) {
        var n = 0;
        for (var i = 0; i < src.length; i++) {
            if (src[i] === '\\') { i++; continue; }
            if (src[i] === '[') {                     // skip character classes
                while (i < src.length && src[i] !== ']') {
                    if (src[i] === '\\') i++;
                    i++;
                }
                continue;
            }
            if (src[i] === '(' && src[i + 1] !== '?') n++;
        }
        return n;
    }

    /* ── Applying it to the page ────────────────────────────────────────────
       A block is anything with a language- class, plus <pre class="cmd">, which
       predates this file and is always shell. */

    function langOf(el) {
        var cls = (el.className || '') + ' ' + ((el.parentElement && el.parentElement.className) || '');
        var m = /(?:language|lang)-([\w+-]+)/.exec(cls);
        if (m) return m[1].toLowerCase();
        if (/\bcmd\b/.test(cls)) return 'bash';
        return el.getAttribute('data-lang') || 'text';
    }

    /**
     * Highlight one <pre>/<code>. Idempotent: a block already done is skipped,
     * so this is safe to call again after the page adds content.
     */
    function highlightElement(el) {
        if (!el || el.dataset.tkDone === '1') return;
        var code = el.textContent;
        el.dataset.tkDone = '1';

        var lang = ALIASES[langOf(el)] || langOf(el);
        var pre = el.tagName === 'PRE' ? el : el.closest('pre');

        if (pre) {
            pre.classList.add('tk');
            // The label sits on the <pre> as an attribute rather than an
            // element, so it cannot end up inside anyone's clipboard.
            pre.setAttribute('data-tk-lang', LABELS[lang] || lang);
        }

        if (!GRAMMARS[lang] || code.length > MAX_CHARS) return;
        el.innerHTML = highlight(code, lang);
    }

    /** Highlight everything in `root` (default: the document). */
    function highlightAll(root) {
        var scope = root || document;
        var blocks = scope.querySelectorAll(
            'pre code[class*="language-"], pre code[class*="lang-"], ' +
            'code[class*="language-"], code[data-lang], pre.cmd, pre[data-lang]');
        Array.prototype.forEach.call(blocks, highlightElement);
    }

    /**
     * Replace a block's contents with `code`, highlighted. This is the entry
     * point for generated output — the generator and the live editor rewrite
     * their panes constantly, and re-running highlightAll() over a page would
     * skip them because they are already marked done.
     */
    function setCode(el, code, lang) {
        if (!el) return;
        el.dataset.tkDone = '0';
        el.textContent = code;
        if (lang) el.className = (el.className || '').replace(/\b(?:language|lang)-[\w+-]+/g, '').trim()
                                 + ' language-' + lang;
        highlightElement(el);
    }

    window.tkHighlight = highlight;
    window.highlightAll = highlightAll;
    window.highlightElement = highlightElement;
    window.setHighlightedCode = setCode;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { highlightAll(); });
    } else {
        highlightAll();
    }
})();
