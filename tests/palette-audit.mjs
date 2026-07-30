/* Every colour on the site comes from the Tokyo Night palette, or it is a bug.
 *
 * Drift is invisible in review and obvious in use. wiki.html redefined
 * --border-color to #414868, so the same bordered element was one colour on the
 * wiki and a different colour on every other page. live.html and releases.html
 * carried GitHub's #30363d and #e6edf3. The Live Editor's markdown preview set
 * its own #1c2128 / #79c0ff on every element inline. None of that is visible
 * unless you happen to have two pages open side by side.
 *
 * The rule: a colour literal in a stylesheet, a style attribute or a JS string
 * must be one of the palette values below. Everything else names a variable.
 */
import fs from 'node:fs';
import path from 'node:path';

const WEB = process.argv[2] || '../website';

/* The palette, as declared in style.css :root, plus the neutrals the design
   legitimately uses for shadows, overlays and the one pure-white icon. */
const PALETTE = new Set([
    '#1a1b26', '#13141c', '#16161e', '#24283b',   // backgrounds
    '#a9b1d6', '#7f88ad', '#c0caf5',              // foregrounds
    '#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a',   // accents
    '#f7768e', '#ff9e64', '#e0af68',
    '#2d2d3f', '#2f3450',                         // borders
    '#0d1117', '#565f89', '#8b949e',              // editor chrome, dim text
    '#6b7394', '#8b95bd',                         // comment token, high-contrast variant
    '#000', '#000000', '#fff', '#ffffff',         // shadows, overlays, the info icon
]);

/* (?<!&) so HTML numeric entities such as &#128278; are not read as colours —
   "128278" is six valid hex digits and matched before this guard was added. */
const HEX = /(?<!&)#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

/* Comments are stripped: several of them name the off-palette colours that were
   removed, and a note explaining a fix must not fail the check it documents. */
const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '');

const offenders = new Map();   // colour -> Set of "file:line"
let scanned = 0;

const files = fs.readdirSync(WEB).filter(f => /\.(html|js|css)$/.test(f));
for (const f of files) {
    scanned++;
    const raw = fs.readFileSync(path.join(WEB, f), 'utf8');
    // Strip comments per line so line numbers stay meaningful.
    const clean = stripComments(raw).split('\n');
    clean.forEach((line, i) => {
        for (const m of line.matchAll(HEX)) {
            let h = m[0].toLowerCase();
            if (h.length === 4) h = '#' + [...h.slice(1)].map(c => c + c).join('');
            if (PALETTE.has(h) || PALETTE.has(m[0].toLowerCase())) continue;
            if (!offenders.has(h)) offenders.set(h, new Set());
            offenders.get(h).add(`${f}:${i + 1}`);
        }
    });
}

/* A page must not redefine a palette variable to a different value — that is the
   specific failure that made the wiki's borders a different colour. */
const declared = new Map();    // var name -> Map(value -> Set of files)
for (const f of files) {
    const raw = stripComments(fs.readFileSync(path.join(WEB, f), 'utf8'));
    for (const m of raw.matchAll(/(--[a-z][\w-]*)\s*:\s*([^;{}]+);/g)) {
        const name = m[1], value = m[2].trim().toLowerCase();
        if (!declared.has(name)) declared.set(name, new Map());
        const byValue = declared.get(name);
        if (!byValue.has(value)) byValue.set(value, new Set());
        byValue.get(value).add(f);
    }
}

const conflicts = [];
for (const [name, byValue] of declared) {
    if (byValue.size < 2) continue;
    // Only report variables style.css owns; a page-local variable such as
    // --editor-bg is allowed to be defined only where it is used.
    const inStylesheet = [...byValue.values()].some(s => s.has('style.css'));
    if (!inStylesheet) continue;
    conflicts.push(`${name} is declared with ${byValue.size} different values: ` +
        [...byValue].map(([v, fs_]) => `"${v}" in ${[...fs_].join(', ')}`).join('  |  '));
}

const total = [...offenders.values()].reduce((n, s) => n + s.size, 0);
console.log(`palette-audit: ${scanned} files, ${total} off-palette literals, ` +
            `${conflicts.length} variable conflicts`);
for (const [h, places] of [...offenders].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`  x ${h}  (${places.size})  ${[...places].slice(0, 5).join(', ')}`);
}
for (const c of conflicts) console.log('  x ' + c);

process.exit(total || conflicts.length ? 1 : 0);
