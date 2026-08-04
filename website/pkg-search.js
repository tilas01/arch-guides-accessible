/* Package lookup for the free-text package fields, shared by the Dynamic
 * Generator and the Unix Manual Guide Walkthrough.
 *
 * ── Why this does not search from the page ─────────────────────────────────
 *
 * The obvious design is a live search box calling the two public JSON APIs:
 *
 *   official : https://archlinux.org/packages/search/json/?q=<term>
 *   AUR      : https://aur.archlinux.org/rpc/v5/search/<term>
 *
 * Both work, both are unauthenticated, and **neither sends
 * `Access-Control-Allow-Origin`**. Verified against both endpoints with an
 * `Origin:` header: no CORS header on either, on GET or HEAD. A page served
 * from tilas01.github.io therefore cannot read either response — the browser
 * blocks it before any of our code sees it. This site is static, so there is no
 * server to proxy through, and routing user package queries via a third-party
 * CORS proxy would hand a stranger a log of what everyone is installing.
 *
 * So a live search box here would fail every single time. Shipping one would be
 * exactly the failure this project keeps finding in its own code: a feature that
 * is documented, visible, and wired to nothing.
 *
 * What is offered instead is a search that opens on the site that can actually
 * answer it, in a new tab, for both sources at once. The user gets to the same
 * answer, and the field they came from keeps their place.
 *
 * The verification that matters is not here anyway. Both generators emit a
 * check against the *real* package databases on the machine being installed,
 * which warns and skips rather than aborting. A name this browser could not
 * find may be perfectly valid; the machine is the authority, not us.
 */
(function () {
    'use strict';

    /** Where a human can go and look — these are also the links that 404. */
    function officialUrl(name) {
        return 'https://archlinux.org/packages/?q=' + encodeURIComponent(name);
    }
    function aurUrl(name) {
        return 'https://aur.archlinux.org/packages?K=' + encodeURIComponent(name);
    }

    /**
     * Build the lookup panel for a text input holding space-separated names.
     *
     * Typing a term and pressing Enter (or a button) opens the search on the
     * relevant site. "Add" puts the term into the field, so the flow is: search,
     * find the real name, come back, add it.
     */
    function attach(input, opts) {
        opts = opts || {};
        var doc = input.ownerDocument;
        var win = doc.defaultView;

        function el(tag, cls, text) {
            var e = doc.createElement(tag);
            if (cls) e.className = cls;
            if (text != null) e.textContent = text;
            return e;
        }

        var wrap = el('div', 'pkg-search');
        var row = el('div', 'pkg-search-row');

        var box = el('input', 'pkg-search-box');
        box.type = 'search';
        box.placeholder = 'Package name to look up…';
        box.setAttribute('autocomplete', 'off');
        box.setAttribute('spellcheck', 'false');
        box.setAttribute('aria-label', 'Look up a package name');

        var official = el('button', 'btn pkg-search-go pkg-go-official', 'Official repos ↗');
        official.type = 'button';
        var aur = el('button', 'btn pkg-search-go pkg-go-aur', 'AUR ↗');
        aur.type = 'button';
        var addBtn = el('button', 'btn pkg-add', '+ Add');
        addBtn.type = 'button';

        row.appendChild(box);
        row.appendChild(official);
        row.appendChild(aur);
        row.appendChild(addBtn);

        var note = el('p', 'pkg-search-note',
            'Searches open on archlinux.org and the AUR in a new tab — those sites do not ' +
            'allow this page to read their results directly. Add the exact name once you ' +
            'have it; every name is checked again on the machine at install time, where the ' +
            'real package database is.');

        var warn = el('p', 'pkg-search-note pkg-search-warn',
            'AUR packages are not reviewed by anyone. makepkg runs a PKGBUILD a stranger ' +
            'wrote, as your user, before anything is installed.');

        wrap.appendChild(row);
        wrap.appendChild(note);
        wrap.appendChild(warn);

        function term() { return box.value.trim(); }

        function open(url) {
            if (!term()) { box.focus(); return; }
            // noopener: the opened page must not get a handle on this one.
            if (win && typeof win.open === 'function') {
                win.open(url(term()), '_blank', 'noopener,noreferrer');
            }
        }

        function add() {
            var name = term();
            if (!name) { box.focus(); return; }
            // Same character set the emitters filter on, so nothing gets into
            // the field that would be silently dropped later.
            if (!/^[a-z0-9@._+-]+$/i.test(name)) {
                note.textContent = '"' + name + '" is not a valid package name. ' +
                    'Arch names use letters, digits, and @ . _ + - only.';
                return;
            }
            var have = input.value.split(/\s+/).filter(Boolean);
            if (have.indexOf(name) === -1) have.push(name);
            input.value = have.join(' ');
            box.value = '';
            if (typeof input.dispatchEvent === 'function' && win && win.Event) {
                input.dispatchEvent(new win.Event('input', { bubbles: true }));
            }
        }

        official.addEventListener('click', function () { open(officialUrl); });
        aur.addEventListener('click', function () { open(aurUrl); });
        addBtn.addEventListener('click', add);
        box.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
        });

        if (opts.mount) opts.mount.appendChild(wrap);
        return wrap;
    }

    window.PkgSearch = {
        attach: attach,
        officialUrl: officialUrl,
        aurUrl: aurUrl
    };
})();
