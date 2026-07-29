/* Every right-click-to-wiki target must resolve.
 *
 * Guards the bug this was written for: two handlers in script.js built wiki
 * anchors by slugifying a control's visible text ("Firmware Selection" ->
 * #firmware-selection). None of the 54 slugs matched an id in wiki.html, so
 * every right-click landed at the top of the wiki instead of the section the
 * user asked for — silently, because a missing fragment is not an error.
 */
import fs from 'node:fs';
import path from 'node:path';

const WEB = process.argv[2] || '../website';
const read = f => fs.readFileSync(path.join(WEB, f), 'utf8');
const wiki = read('wiki.html');
const ids = new Set([...wiki.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

let bad = [], checked = 0;

// 1. tooltip.js curated map
const t = read('tooltip.js');
const block = t.slice(t.indexOf('const WIKI = {'), t.indexOf('};', t.indexOf('const WIKI = {')));
for (const m of block.matchAll(/'([^']+)':\s*'([^']+)'/g)) {
  const [, key, frag] = m; checked++;
  if (frag.startsWith('?page=')) {
    const doc = frag.slice(6);
    if (!fs.existsSync(path.join(WEB, 'docs', doc))) bad.push(`tooltip WIKI["${key}"] -> docs/${doc} missing`);
  } else if (frag.startsWith('#') && !ids.has(frag.slice(1))) {
    bad.push(`tooltip WIKI["${key}"] -> ${frag} missing anchor`);
  }
}

// 2. data-wiki overrides anywhere
for (const f of fs.readdirSync(WEB).filter(x => x.endsWith('.html'))) {
  for (const m of read(f).matchAll(/data-wiki="([^"]+)"/g)) {
    const frag = m[1]; checked++;
    if (frag.startsWith('#') && !ids.has(frag.slice(1))) bad.push(`${f}: data-wiki=${frag} missing anchor`);
    else if (frag.startsWith('?page=') && !fs.existsSync(path.join(WEB, 'docs', frag.slice(6))))
      bad.push(`${f}: data-wiki=${frag} missing doc`);
  }
}

// 3. walkthrough question -> wiki anchors
const md = read('manual-data.js');
for (const m of md.matchAll(/wiki:\s*'([a-z0-9_-]+)'/g)) {
  checked++;
  if (!ids.has(m[1])) bad.push(`manual-data.js: wiki:'${m[1]}' missing anchor in wiki.html`);
}

// 4. nothing may reintroduce slug-guessing
const s = read('script.js');
if (/window\.open\('wiki\.html#'\s*\+\s*(encodeURIComponent\()?[a-zA-Z]/.test(s)) {
  bad.push("script.js builds a wiki anchor from a variable — slug-guessing has returned");
}

console.log(`wiki targets checked: ${checked}`);
if (bad.length) { console.log(`\nBROKEN (${bad.length}):`); bad.forEach(b => console.log('  ' + b)); process.exit(1); }
console.log('All right-click wiki targets resolve.');
