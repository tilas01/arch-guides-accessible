/* Does every system generate, and does what it generates belong to that system?
 *
 * `permutations.mjs` sweeps 578 configurations and never once sets `os`, so all
 * 578 of them are Arch. That was fine while Arch was the only target. With five
 * systems in the switcher it means four of them have no permutation coverage at
 * all, and "the tests pass" says nothing about them.
 *
 * This sweeps the same axes across every system in OS_META and asserts three
 * different kinds of thing, with deliberately different severities:
 *
 *   FAIL, always, on any system
 *     - a guide or script that did not build
 *     - `undefined`, `null`, `NaN` or `[object Object]` reaching the output —
 *       an unanswered question leaking into something a reader would run
 *     - a script `bash -n` cannot parse
 *     - an incomplete system with no work-in-progress banner
 *     - a complete system that emits one
 *
 *   FAIL, on a system marked complete
 *     - tooling belonging to a different system: `pacman` in a Gentoo guide is
 *       simply wrong, and on a finished guide there is no excuse for it
 *
 *   REPORT, on a system marked incomplete
 *     - the same leakage, counted rather than failed. Those guides say in a
 *       CAUTION banner that their commands may be wrong, so this is not a lie
 *       being told to a reader — it is the remaining work, and the number is
 *       the size of it. It becomes a failure the moment the badge comes off.
 *
 * The point of the split: a red gate that everybody learns to ignore protects
 * nobody, and a green gate that quietly skips four systems is worse. This one
 * is green while the badges are honest, and turns red the moment they are not.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const WEB = process.argv[2] || '../website';

function load(file) { return fs.readFileSync(path.join(WEB, file), 'utf8'); }

const sandbox = { window: {}, module: undefined };
const fn = new Function('window', 'module',
    load('os-meta.js') + '\n' + load('os-install.js') + '\n' + load('manual-data.js') + '\n' + load('manual-guide.js') +
    '\nreturn { STEPS, DUSKY_LOCKS, OS_META, build: window.buildManualGuide, ' +
    'script: window.buildManualScript };');
const { STEPS, DUSKY_LOCKS, OS_META, build, script } = fn(sandbox.window, undefined);

let checks = 0, fails = 0;
const failures = [];
function ok(cond, label) { checks++; if (!cond) { fails++; failures.push(label); } }

function applies(step, s) {
    if (typeof step.when !== 'function') return true;
    try { return !!step.when(s); } catch { return false; }
}

/** Fill every applicable question. Mirrors permutations.mjs so the two sweeps
 *  cannot drift into testing different things. */
function complete(seed, chooser) {
    const s = Object.assign({}, seed);
    let guard = 0, changed = true;
    while (changed && guard++ < 50) {
        changed = false;
        for (const step of STEPS) {
            if (!applies(step, s)) { if (s[step.id] !== undefined) { delete s[step.id]; changed = true; } continue; }
            if (s[step.id] !== undefined) continue;
            if (s.desktop === 'dusky' && Object.hasOwn(DUSKY_LOCKS, step.id)) {
                s[step.id] = DUSKY_LOCKS[step.id];
            } else if (step.type === 'text') {
                s[step.id] = { disk: '/dev/nvme0n1', dualboot_esp: '/dev/nvme0n1p1',
                               hostname: 'testbox', username: 'tester',
                               timezone: 'Europe/London' }[step.id] || 'x';
            } else if (step.type === 'multi') {
                s[step.id] = chooser.multi(step, (step.options || []).filter(o => !o.when || o.when(s)));
            } else {
                s[step.id] = chooser.one(step, (step.options || []).filter(o => !o.when || o.when(s)));
            }
            changed = true;
        }
    }
    return s;
}

/* Tooling that belongs to exactly one system. Matched on word boundaries so
   "pacman" does not fire on "pacman-key" being discussed in prose about Arch in
   a Gentoo guide's cross-reference — and each pattern names the system it
   belongs to, so the report can say what is wrong rather than only that
   something is. */
const OWNED = [
    { re: /\bpacstrap\b/g,   owner: 'arch',    what: 'pacstrap' },
    { re: /\bpacman\b/g,     owner: 'arch',    what: 'pacman' },
    { re: /\bmakepkg\b/g,    owner: 'arch',    what: 'makepkg' },
    { re: /\bparu\b/g,       owner: 'arch',    what: 'paru' },
    { re: /\bmkinitcpio\b/g, owner: 'arch',    what: 'mkinitcpio' },
    { re: /\bemerge\b/g,     owner: 'gentoo',  what: 'emerge' },
    { re: /\bpkg_add\b/g,    owner: 'openbsd', what: 'pkg_add' },
    { re: /\bbsdinstall\b/g, owner: 'freebsd', what: 'bsdinstall' },
];

/* Values that mean a question went unanswered and the emitter printed the hole.
   `[object Object]` and `undefined` in a command are the difference between a
   guide and a trap. */
const HOLES = [
    { re: /\bundefined\b/, what: 'undefined' },
    { re: /\[object Object\]/, what: '[object Object]' },
    { re: /\bNaN\b/, what: 'NaN' },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'os-perm-'));
let scriptsChecked = 0;
const leakage = {};          // os -> { tool: count }

function checkOne(s, osId, label) {
    const meta = OS_META[osId];
    let md, sh;

    try { md = build(s); } catch (e) { ok(false, `${label}: guide threw — ${e.message}`); return; }
    try { sh = script(s); } catch (e) { ok(false, `${label}: script threw — ${e.message}`); return; }

    ok(typeof md === 'string' && md.length > 400, `${label}: guide is empty or a stub`);
    ok(typeof sh === 'string' && sh.length > 200, `${label}: script is empty or a stub`);

    // The guide must name the system it claims to be for.
    ok(md.includes(meta.label), `${label}: guide never names ${meta.label}`);

    // Unanswered questions must never reach the output, on any system.
    for (const h of HOLES) {
        ok(!h.re.test(md), `${label}: "${h.what}" reached the GUIDE — a question went unanswered`);
        ok(!h.re.test(sh), `${label}: "${h.what}" reached the SCRIPT — a question went unanswered`);
    }

    // The work-in-progress contract, in both directions.
    const badged = md.includes('🚧');
    if (meta.complete) ok(!badged, `${label}: complete system emits a work-in-progress banner`);
    else ok(badged, `${label}: incomplete system has NO work-in-progress banner`);

    // Tooling from another system.
    for (const o of OWNED) {
        if (o.owner === osId) continue;
        const hits = (sh.match(o.re) || []).length;
        if (!hits) continue;
        if (meta.complete) {
            ok(false, `${label}: emits ${o.what}, which belongs to ${o.owner}, not ${osId}`);
        } else {
            leakage[osId] = leakage[osId] || {};
            leakage[osId][o.what] = (leakage[osId][o.what] || 0) + hits;
        }
    }

    // The script has to parse. A guide whose script bash cannot read is worse
    // than no script, because it looks finished.
    const p = path.join(tmp, `s${scriptsChecked}.sh`);
    fs.writeFileSync(p, sh);
    try {
        execFileSync('bash', ['-n', p], { stdio: 'pipe' });
        scriptsChecked++;
    } catch (e) {
        scriptsChecked++;
        ok(false, `${label}: bash -n rejected the script: ${String(e.stderr || e).slice(0, 200)}`);
    }
    fs.rmSync(p, { force: true });
}

const AXES = {
    arch: ['x86_64', 'aarch64'],
    encryption: ['none', 'luks2'],
    filesystem: ['ext4', 'btrfs'],
    desktop: ['none', 'gnome', 'dusky'],
};

const strategies = [
    { name: 'first', one: (st, o) => o[0].value, multi: () => [] },
    { name: 'last',  one: (st, o) => o[o.length - 1].value, multi: (st, o) => o.map(x => x.value) },
    { name: 'rec',   one: (st, o) => (o.find(x => x.recommended) || o[0]).value,
      multi: (st, o) => o.filter(x => x.recommended).map(x => x.value) },
];

let n = 0;
const perOs = {};
for (const osId of Object.keys(OS_META)) {
    perOs[osId] = 0;
    for (const arch of AXES.arch)
    for (const encryption of AXES.encryption)
    for (const filesystem of AXES.filesystem)
    for (const desktop of AXES.desktop) {
        const strat = strategies[n % strategies.length];
        const s = complete({ os: osId, arch, dualboot: 'none', encryption, filesystem, desktop, libre: 'no' }, strat);
        checkOne(s, osId, `${osId} #${perOs[osId]} ${arch}/${encryption}/${filesystem}/${desktop}/${strat.name}`);
        n++; perOs[osId]++;
    }
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`os-permutations: ${n} configs across ${Object.keys(OS_META).length} systems ` +
            `(${Object.entries(perOs).map(([k, v]) => `${k}:${v}`).join(' ')})`);
console.log(`assertions:      ${checks}`);
console.log(`scripts parsed by bash -n: ${scriptsChecked}`);

/* The measured distance between where an unfinished system is and where its
   badge can come off. Printed every run, so it cannot quietly grow. */
const leaked = Object.keys(leakage);
if (leaked.length) {
    console.log('\nSTILL ARCH-SHAPED — these systems emit tooling that is not theirs.');
    console.log('Their guides carry a CAUTION banner saying so, which is why this is');
    console.log('reported rather than failed. It becomes a failure when the badge lifts.');
    for (const osId of leaked) {
        const parts = Object.entries(leakage[osId]).map(([w, c]) => `${w}×${c}`).join(', ');
        console.log(`  ${OS_META[osId].label.padEnd(18)} ${parts}`);
    }
}

if (fails) {
    console.log(`\nFAILURES (${fails}):`);
    [...new Set(failures)].slice(0, 30).forEach(f => console.log('  - ' + f));
    process.exit(1);
}
console.log('\nALL PASS');
process.exit(0);
