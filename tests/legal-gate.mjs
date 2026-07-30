/* The welcome dialog is a gate, and a gate that can be walked around is not one.
 *
 * Two things have to hold. Continue must be genuinely unavailable until both
 * boxes are ticked — not merely styled to look unavailable, since a button that
 * only *looks* disabled still fires on click and on Enter. And every document
 * the dialog asks people to agree to has to actually exist and actually say
 * something; a waiver link that 404s means every visitor ticked a box about a
 * document nobody could read.
 *
 * The dialog also used to offer "I Agree & Don't Show Again", which turned
 * agreement into a stored preference. That is gone deliberately; this asserts it
 * stays gone.
 */
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { serve, loadPage } from './serve.mjs';

const WEB = process.argv[2] || '../website';
const read = f => fs.readFileSync(path.join(WEB, f), 'utf8');

let checks = 0;
const failures = [];
const ok = (cond, label) => { checks++; if (!cond) failures.push(label); };

/* ── 1. The agreements exist, and are not placeholders ─────────────────────── */
const AGREEMENTS = ['LEGAL-WAIVER.txt', 'LICENSE.txt', 'LICENCE-PLAIN-ENGLISH.txt'];
for (const f of AGREEMENTS) {
  const p = path.join(WEB, 'user-agreements', f);
  ok(fs.existsSync(p), `user-agreements/${f} does not exist — the dialog links to a 404`);
  if (fs.existsSync(p)) {
    ok(fs.readFileSync(p, 'utf8').trim().length > 400,
      `user-agreements/${f} is too short to be the real document`);
  }
}

// The served licence is a copy. If it drifts, people tick a box agreeing to
// terms that are not the repository's terms.
const repoLicence = fs.readFileSync(path.join(WEB, '..', 'LICENSE'), 'utf8');
const servedLicence = fs.readFileSync(path.join(WEB, 'user-agreements', 'LICENSE.txt'), 'utf8');
ok(repoLicence === servedLicence,
  'website/user-agreements/LICENSE.txt has drifted from LICENSE — the site is serving different terms');

/* ── 2. The dialog itself ──────────────────────────────────────────────────── */
// Over real HTTP: with the previous `fromFile` plus a fake http `url`, legal.js
// itself never loaded, so every assertion below was made against a page that had
// no dialog on it at all.
const server = await serve(WEB);
const loaded = await loadPage(JSDOM, VirtualConsole, server.origin, 'site-index.html');
const { window, document: doc } = loaded;
const pageErrors = loaded.errors.filter(e =>
  !/Could not load link|Could not parse CSS|Not implemented/i.test(e));

const waiver  = doc.getElementById('legal-ck-waiver');
const licence = doc.getElementById('legal-ck-licence');
const cont    = doc.getElementById('legal-continue-btn');

ok(!!waiver,  'the dialog has no disclaimer checkbox');
ok(!!licence, 'the dialog has no licence checkbox');
ok(!!cont,    'the dialog has no Continue button');

ok(!doc.getElementById('legal-agree-btn'),
  '"I Agree" is back — agreement is meant to be the two ticks, not a button');
ok(!doc.getElementById('legal-agree-persist-btn'),
  '"I Agree & Don\'t Show Again" is back — it made agreement a stored preference');

if (waiver && licence && cont) {
  const gone = () => !doc.body.contains(cont);

  ok(cont.disabled, 'Continue starts enabled — the gate is open before anything is ticked');

  // Clicking a disabled button must do nothing. This is the check that
  // distinguishes a real gate from one that is only greyed out.
  cont.click();
  ok(!gone(), 'clicking a disabled Continue dismissed the dialog anyway');

  const setChecked = (el, v) => {
    el.checked = v;
    el.dispatchEvent(new window.Event('change', { bubbles: true }));
  };

  setChecked(waiver, true);
  ok(cont.disabled, 'Continue enabled with only the disclaimer ticked');
  cont.click();
  ok(!gone(), 'Continue worked with only one box ticked');

  setChecked(waiver, false);
  setChecked(licence, true);
  ok(cont.disabled, 'Continue enabled with only the licence ticked');

  // Un-ticking has to close the gate again, or the state is write-once.
  setChecked(waiver, true);
  ok(!cont.disabled, 'Continue still disabled with both boxes ticked');
  setChecked(licence, false);
  ok(cont.disabled, 'un-ticking a box left Continue enabled');

  setChecked(licence, true);
  ok(!cont.disabled, 'Continue did not re-enable after re-ticking');

  // Green when live, grey when not — the user asked for exactly this, and the
  // cursor changes too so the state does not rest on colour alone.
  ok(/9ece6a|accent-green/i.test(cont.style.background),
    `enabled Continue is not green (background: ${cont.style.background})`);
  ok(cont.style.cursor === 'pointer', 'enabled Continue does not show a pointer cursor');

  // Toggling must not leave the border half-specified. Assigning `borderColor`
  // alone overwrote the `border` shorthand already in the style attribute and
  // dropped the line style with it: Chrome showed 13 empty longhands and a
  // 0.67px UA hairline instead of 1px, so the button's box shifted every time it
  // was toggled. jsdom serialises the same loss as `border: 1px <colour>` with
  // no style keyword, so checking the declaration catches it in both.
  const borderDecl = /border:\s*([^;]+)/.exec(cont.getAttribute('style') || '');
  ok(!!borderDecl, 'the enabled Continue has no border declaration at all');
  ok(borderDecl && /\b(solid|dashed|dotted|none)\b/.test(borderDecl[1]),
     `the enabled Continue's border lost its line style ("${borderDecl && borderDecl[1]}") — ` +
     `set the border shorthand, not borderColor alone`);
  ok(!/border-[a-z-]+:\s*;/.test(cont.getAttribute('style') || ''),
     'enabling Continue left empty border longhands in the style attribute');
  setChecked(licence, false);
  ok(!/9ece6a|accent-green/i.test(cont.style.background), 'disabled Continue is still green');
  ok(cont.style.cursor === 'not-allowed', 'disabled Continue does not show a not-allowed cursor');
  setChecked(licence, true);

  cont.click();
  await new Promise(r => setTimeout(r, 20));
  ok(gone(), 'Continue with both boxes ticked did not dismiss the dialog');

  // And it must not come back on the next page of the same session. This is the
  // loop that used to trap people: agreeing set nothing, so every navigation
  // re-asked, and the only escape was the "don't show again" button.
  ok(window.sessionStorage.getItem('legal_accepted_session') === 'true',
    'agreeing did not record acceptance for the session — the dialog will loop on the next page');
}

/* ── 3. The links point at the documents ───────────────────────────────────── */
const legal = read('legal.js');
for (const f of AGREEMENTS) {
  // Through the renderer, not straight at the .txt. Ticking a box and then
  // reading what you agreed to should not drop you on an unstyled plain-text
  // file — the same complaint as the docs links, somewhere it matters more.
  ok(legal.includes('wiki.html?page=user-agreements/' + f),
    `legal.js does not link to ${f} through the wiki renderer`);
  ok(!new RegExp(`["']user-agreements/${f.replace(/\./g, '\\.')}["']`).test(legal),
    `legal.js still links straight at the raw ${f}`);
}
ok(/Both boxes below are required/.test(legal),
  'the dialog no longer says that both ticks are required');

ok(pageErrors.length === 0, `the dialog threw: ${pageErrors[0] || ''}`);
window.close();
await server.close();

console.log(`legal-gate: ${checks} checks, ${failures.length} failed`);
failures.forEach(f => console.log('  ✗ ' + f));
process.exit(failures.length ? 1 : 0);
