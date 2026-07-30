/* The shared markdown renderer, and the promise that no link lands on raw .md.
 *
 * Two things are being guarded.
 *
 * 1. Injection. Every document this renders is fetched at runtime from docs/,
 *    and those documents are full of shell, angle brackets and HTML-looking
 *    text. Correctness here is asserted by parsing the output and asking the DOM
 *    what elements and attributes actually exist — not by grepping the string
 *    for "onerror", which passes happily on escaped text and fails happily on
 *    harmless prose.
 *
 * 2. Raw markdown as a destination. wiki.html's ?page= handler used to do
 *    `location.replace('docs/' + page)`, so 26 right-click targets and every
 *    docs link on the index dropped the reader onto an unstyled .md file. The
 *    renderer exists so that cannot happen; this asserts nothing reintroduces
 *    a link straight to one.
 */
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const WEB = process.argv[2] || '../website';
const read = f => fs.readFileSync(path.join(WEB, f), 'utf8');

let checks = 0;
const failures = [];
const ok = (cond, label) => { checks++; if (!cond) failures.push(label); };

/* ── Load the renderer the way a page does ─────────────────────────────────── */
const sandbox = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
sandbox.window.eval(read('markdown.js'));
const render = sandbox.window.renderMarkdown;
ok(typeof render === 'function', 'markdown.js does not expose window.renderMarkdown');
ok(typeof sandbox.window.renderMarkdownInto === 'function',
   'markdown.js does not expose window.renderMarkdownInto');

/** Parse rendered HTML and report what the browser would actually build. */
function inspect(html) {
    const d = new JSDOM('<div id="h"></div>');
    d.window.document.getElementById('h').innerHTML = html;
    const els = [...d.window.document.querySelectorAll('#h *')];
    return {
        tags: els.map(e => e.tagName),
        eventAttrs: els.flatMap(e => [...e.attributes].filter(a => /^on/i.test(a.name)).map(a => a.name)),
        hrefs: els.filter(e => e.tagName === 'A').map(e => e.getAttribute('href') || ''),
        srcs: els.filter(e => e.tagName === 'IMG').map(e => e.getAttribute('src') || ''),
        doc: d.window.document.getElementById('h'),
    };
}

/* ── 1. Injection ──────────────────────────────────────────────────────────── */
const HOSTILE = [
    'Raw danger: <script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<iframe src="https://evil.example"></iframe>',
    '<svg onload=alert(1)></svg>',
    'a < b && c > d',
    '[click me](javascript:alert(1))',
    '[click me](JaVaScRiPt:alert(1))',
    '![pic](javascript:alert(2))',
    '[ok](data:text/html;base64,PHNjcmlwdD4=)',
    '`<script>alert(1)</script>`',
    '| <script>x</script> | b |\n|---|---|\n| c | d |',
];

for (const src of HOSTILE) {
    const { tags, eventAttrs, hrefs, srcs } = inspect(render(src).html);
    const label = JSON.stringify(src.slice(0, 40));
    ok(!tags.includes('SCRIPT'), `${label} produced a <script> element`);
    ok(!tags.includes('IFRAME'), `${label} produced an <iframe> element`);
    ok(eventAttrs.length === 0, `${label} produced event attributes: ${eventAttrs.join(',')}`);
    ok(!hrefs.some(h => /^\s*(javascript|data|vbscript):/i.test(h)),
       `${label} produced a live scripting URL: ${hrefs.join(' ')}`);
    ok(!srcs.some(s => /^\s*(javascript|data|vbscript):/i.test(s)),
       `${label} produced a scripting img src: ${srcs.join(' ')}`);
}

/* Fenced code is verbatim: nothing inside it may be reinterpreted. */
const fenced = render('```bash\n**not bold** and <b>not bold</b> and `x`\n```').html;
const fi = inspect(fenced);
ok(!fi.tags.includes('STRONG'), 'markdown inside a fenced block was interpreted as markdown');
ok(!fi.tags.includes('B'), 'HTML inside a fenced block became a real element');
ok(/language-bash/.test(fenced), 'a fenced block carries no language- class for the highlighter');

/* ── 2. The features the docs actually use ─────────────────────────────────── */
const rich = render([
    '# Title', '', 'Text with **bold** and `code`.', '',
    '> [!WARNING]', '> Destroys data.', '',
    '> [!TIP]', '> Read first.', '',
    '> [!NOTE]', '> Worth knowing.', '',
    '> [!IMPORTANT]', '> Do not skip.', '',
    '> [!CAUTION]', '> Careful.', '',
    '| A | B |', '|---|---|', '| 1 | 2 |', '',
    '- one', '- two', '',
    '1. first', '2. second', '',
    '---', '',
    '<kbd>Super</kbd> + <kbd>Q</kbd>', '',
    '[Arch Wiki](https://wiki.archlinux.org/)',
].join('\n'));

ok(/<h1 id="title">/.test(rich.html), 'headings get no id, so nothing can deep-link into a rendered doc');
ok(rich.headings.length === 1 && rich.headings[0].id === 'title',
   'the heading list is not returned, so a rendered doc cannot build its own contents');
ok(!/\[!/.test(rich.html),
   'GitHub alert syntax is still being rendered literally as "[!TIP]" text');
for (const cls of ['md-warning', 'md-tip', 'md-note', 'md-important', 'md-caution']) {
    ok(rich.html.includes(cls), `alert type ${cls} is not rendered as a callout`);
}
ok(/<table class="md-table">/.test(rich.html) && /<th>A<\/th>/.test(rich.html),
   'tables do not render, or the first row is not treated as a header');
ok(/<ul>\s*<li>one<\/li>/.test(rich.html), 'unordered lists do not render');
ok(/<ol>\s*<li>first<\/li>/.test(rich.html), 'ordered lists do not render as <ol>');
ok(/<hr>/.test(rich.html), 'horizontal rules do not render');
ok(/<kbd>Super<\/kbd>/.test(rich.html), '<kbd> is escaped instead of rendered');
ok(/rel="noopener"/.test(rich.html), 'external links carry no rel="noopener"');

/* Real documents, not just synthetic ones: every doc the site links to must
   render without throwing and produce something. A doc that renders to nothing
   is a blank page where an explanation should be. */
const docsDir = path.join(WEB, 'docs');
let rendered = 0;
function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!e.name.endsWith('.md')) continue;
        const text = fs.readFileSync(p, 'utf8');
        if (text.trim().length < 20) continue;
        let res;
        try { res = render(text); } catch (err) {
            failures.push(`${e.name} threw while rendering: ${err.message}`); checks++; continue;
        }
        rendered++;
        const rel = path.relative(WEB, p).replace(/\\/g, '/');
        ok(res.html.trim().length > 0, `${rel} renders to nothing`);
        const ins = inspect(res.html);
        ok(!ins.tags.includes('SCRIPT'), `${rel} produced a <script> element`);
        ok(ins.eventAttrs.length === 0, `${rel} produced event attributes`);
    }
}
if (fs.existsSync(docsDir)) walk(docsDir);

/* ── 3. Nothing may link straight to raw markdown ──────────────────────────── */
// A path straight to a .md file. `wiki.html?page=x.md` also ends in .md but is
// the rendered route, so only flag hrefs with no query string.
const RAW_MD = /href="((?:\.{0,2}\/)?(?:[\w.-]+\/)*[\w.-]+\.md(?:#[^"?]*)?)"/g;
for (const f of fs.readdirSync(WEB).filter(x => x.endsWith('.html'))) {
    const src = read(f);
    for (const m of src.matchAll(RAW_MD)) {
        checks++;
        failures.push(`${f} links straight to raw markdown: ${m[1]} — route it through ` +
                      `wiki.html?page= or cheatsheets.html?sheet=`);
    }
}

/* And the handler that serves ?page= must render, not redirect. */
// Strip comments first: this file and markdown.js both *describe* the old
// redirect in prose, and matching that text made the check fail on its own
// documentation.
const wiki = read('wiki.html');
const wikiCode = wiki.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
ok(!/location\.replace\(\s*['"]docs\/['"]\s*\+/.test(wikiCode),
   'wiki.html?page= redirects to the raw .md file again instead of rendering it');
ok(/renderMarkdownInto|renderMarkdown/.test(wiki),
   'wiki.html never calls the markdown renderer, so ?page= cannot render anything');

/* Every ?page= target named anywhere on the site must exist. */
// Comments are stripped first: a note explaining that a stale target was
// removed must not read as that target still being linked.
const stripComments = src => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '');

const PAGE_RE = /[?&]page=([\w./-]+\.md)/g;
const seenPages = new Set();
for (const f of fs.readdirSync(WEB).filter(x => /\.(html|js)$/.test(x))) {
    for (const m of stripComments(read(f)).matchAll(PAGE_RE)) seenPages.add(m[1]);
}
for (const doc of seenPages) {
    ok(fs.existsSync(path.join(WEB, 'docs', doc)),
       `?page=${doc} is linked but website/docs/${doc} does not exist`);
}

/* Every ?sheet= target must be a real tab in cheatsheets.js. */
const sheetIds = new Set([...read('cheatsheets.js').matchAll(/\{\s*id:\s*'([\w-]+)'/g)].map(m => m[1]));
const SHEET_RE = /[?&]sheet=([\w-]+)/g;
for (const f of fs.readdirSync(WEB).filter(x => /\.(html|js)$/.test(x))) {
    for (const m of stripComments(read(f)).matchAll(SHEET_RE)) {
        ok(sheetIds.has(m[1]),
           `${f} links to ?sheet=${m[1]}, which is not a tab in cheatsheets.js ` +
           `(have: ${[...sheetIds].join(', ')})`);
    }
}

console.log(`markdown-render: ${checks} checks, ${failures.length} failed`);
console.log(`  ${rendered} real documents rendered, ${seenPages.size} ?page= targets, ` +
            `${sheetIds.size} cheatsheet tabs`);
failures.forEach(f => console.log('  x ' + f));
process.exit(failures.length ? 1 : 0);
