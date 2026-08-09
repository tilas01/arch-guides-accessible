/* The website and the installer must agree about which tools work where.
 *
 * `scripts/install-security-suite.sh` decides what actually gets installed on a
 * machine. `website/os-install.js` decides what the site offers and what it
 * says about the rest. They are two copies of one fact, and they cannot read
 * each other: the installer runs where there is no website, the website runs
 * where there is no installer.
 *
 * A disagreement is not cosmetic. If the site offers a tool the installer
 * refuses, the reader picks it, generates a script, and finds out on the
 * machine. If the site hides one the installer supports, they never learn it
 * exists. Either way the defect is invisible until somebody is mid-install.
 *
 * Fails rather than skips when it cannot read either side. A check that quietly
 * tests nothing reads as a pass, which this repository has been bitten by.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || '..';
const INSTALLER = path.join(ROOT, 'scripts', 'install-security-suite.sh');
const OS_INSTALL = path.join(ROOT, 'website', 'os-install.js');

let checks = 0, fails = 0;
const problems = [];
function ok(cond, msg) { checks++; if (!cond) { fails++; problems.push(msg); } }

// ── Read the installer's matrix ──────────────────────────────────────────────
let sh = '';
try { sh = fs.readFileSync(INSTALLER, 'utf8'); } catch (_) { sh = ''; }
ok(sh.length > 0, `Could not read ${INSTALLER}. Treated as a failure, not a skip.`);

const fromInstaller = {};
for (const m of sh.matchAll(/readonly SUPPORT_(\w+)="([^"]+)"/g)) {
    const os = m[1];
    fromInstaller[os] = {};
    for (const pair of m[2].trim().split(/\s+/)) {
        const [tool, state] = pair.split('=');
        if (tool && state) fromInstaller[os][tool] = state;
    }
}
ok(Object.keys(fromInstaller).length > 0,
   'No SUPPORT_* tables found in the installer, so nothing was compared.');

// ── Read the website's table ─────────────────────────────────────────────────
let js = '';
try { js = fs.readFileSync(OS_INSTALL, 'utf8'); } catch (_) { js = ''; }
ok(js.length > 0, `Could not read ${OS_INSTALL}. Treated as a failure, not a skip.`);

const sandbox = { window: {} };
let fromSite = {};
try {
    new Function('window', js + '\nreturn 0;')(sandbox.window);
    fromSite = sandbox.window.TOOL_SUPPORT || {};
} catch (e) {
    ok(false, `os-install.js did not evaluate: ${e.message}`);
}
ok(Object.keys(fromSite).length > 0,
   'window.TOOL_SUPPORT is empty or missing, so nothing was compared.');

// ── Compare, in both directions ──────────────────────────────────────────────
const allOses = new Set([...Object.keys(fromInstaller), ...Object.keys(fromSite)]);
for (const os of allOses) {
    const a = fromInstaller[os];
    const b = fromSite[os];
    ok(!!a, `${os}: the website lists it but the installer has no SUPPORT_${os} table`);
    ok(!!b, `${os}: the installer has SUPPORT_${os} but the website's TOOL_SUPPORT does not`);
    if (!a || !b) continue;

    const tools = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const tool of tools) {
        ok(a[tool] !== undefined,
           `${os}/${tool}: on the website, absent from the installer's table`);
        ok(b[tool] !== undefined,
           `${os}/${tool}: in the installer, absent from the website's table`);
        if (a[tool] === undefined || b[tool] === undefined) continue;
        ok(a[tool] === b[tool],
           `${os}/${tool}: installer says "${a[tool]}", website says "${b[tool]}" — ` +
           `one of them is telling a reader something that will not happen`);
    }
}

// ── Anything not a plain "yes" owes a reason ─────────────────────────────────
// A bare "no" or "partial" in the interface teaches nobody anything, and
// "partial" especially: it matters enormously which half works.
const reasonFor = sandbox.window.osToolReason;
ok(typeof reasonFor === 'function',
   'os-install.js exposes no osToolReason(), so no reason could be checked.');
if (typeof reasonFor === 'function') {
    for (const [os, tools] of Object.entries(fromSite)) {
        for (const [tool, state] of Object.entries(tools)) {
            if (state === 'yes') continue;
            const why = reasonFor(os, tool);
            ok(typeof why === 'string' && why.length > 0,
               `${os}/${tool} is "${state}" with no reason given — ` +
               `say which half works, or why it cannot`);
        }
    }
}

console.log(`tool-support: ${checks} checks across ${allOses.size} systems, ${fails} failed`);

if (fails) {
    console.error('\nTool-support problems:\n');
    for (const p of problems) console.error('  - ' + p);
    console.error('\nThe website and scripts/install-security-suite.sh describe the same\n' +
                  'facts to two different audiences. When they disagree, the reader finds\n' +
                  'out on the machine.');
    process.exit(1);
}
process.exit(0);
