/* Permutation harness for the manual walkthrough.
 *
 * Loads manual-data.js and manual-guide.js the way the browser does, sweeps a
 * large set of answer combinations, and asserts on the *content* of what comes
 * out — not merely that it did not throw. Then hands every generated script to
 * `bash -n`, because a guide that produces a script bash cannot parse is worse
 * than no script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const WEB = process.argv[2] || 'website';

function load(file) {
    return fs.readFileSync(path.join(WEB, file), 'utf8');
}

// Evaluate both files in one shared scope, as the browser does.
const sandbox = { window: {}, module: undefined };
const fn = new Function('window', 'module',
    load('manual-data.js') + '\n' + load('manual-guide.js') +
    '\nreturn { STEPS, DUSKY_LOCKS, build: window.buildManualGuide, script: window.buildManualScript };');
const { STEPS, DUSKY_LOCKS, build, script } = fn(sandbox.window, undefined);

let checks = 0, fails = 0;
const failures = [];
function ok(cond, label) {
    checks++;
    if (!cond) { fails++; failures.push(label); }
}

function applies(step, s) {
    if (typeof step.when !== 'function') return true;
    return !!step.when(s);
}

/** Fill every applicable question, choosing option `pickIndex` where possible. */
function complete(seed, chooser) {
    const s = Object.assign({}, seed);
    let guard = 0;
    let changed = true;
    while (changed && guard++ < 50) {
        changed = false;
        for (const step of STEPS) {
            if (!applies(step, s)) { if (s[step.id] !== undefined) { delete s[step.id]; changed = true; } continue; }
            if (s[step.id] !== undefined) continue;
            if (s.desktop === 'dusky' && Object.hasOwn(DUSKY_LOCKS, step.id)) {
                s[step.id] = DUSKY_LOCKS[step.id];
            } else if (step.type === 'text') {
                s[step.id] = { disk: '/dev/nvme0n1', dualboot_esp: '/dev/nvme0n1p1',
                               hostname: 'archbox', username: 'tester',
                               timezone: 'Europe/London' }[step.id] || 'x';
            } else if (step.type === 'multi') {
                const opts = (step.options || []).filter(o => !o.when || o.when(s));
                s[step.id] = chooser.multi(step, opts);
            } else {
                const opts = (step.options || []).filter(o => !o.when || o.when(s));
                s[step.id] = chooser.one(step, opts);
            }
            changed = true;
        }
    }
    return s;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archgen-'));
let scriptsChecked = 0;

function assertGuide(s, label) {
    const md = build(s);
    const sh = script(s);

    // ── content assertions ──
    ok(md.includes(s.disk), `${label}: guide never names the target disk`);
    ok(md.includes('## 3. Install the base system'), `${label}: missing install section`);
    ok(md.includes('genfstab'), `${label}: missing genfstab`);
    ok(md.includes(s.hostname), `${label}: hostname absent`);
    ok(md.includes(s.username), `${label}: username absent`);

    // encryption reaches cryptsetup only when encryption was chosen
    const hasCrypt = /cryptsetup luksFormat/.test(md);
    ok(hasCrypt === (s.encryption !== 'none'),
        `${label}: cryptsetup present=${hasCrypt} but encryption=${s.encryption}`);
    if (s.encryption === 'luks2') {
        ok(/--type luks2 --pbkdf argon2id/.test(md), `${label}: luks2 chosen but argon2id not requested`);
    }
    if (s.encryption === 'luks1') {
        ok(/--type luks1/.test(md), `${label}: luks1 chosen but not emitted`);
        ok(!/argon2id/.test(md.split('### Encrypt')[1]?.split('```')[1] || ''),
            `${label}: argon2id emitted for luks1`);
    }

    // the right mkfs
    if (s.filesystem === 'btrfs') ok(/mkfs\.btrfs/.test(md), `${label}: btrfs chosen, mkfs.btrfs missing`);
    if (s.filesystem === 'ext4') ok(/mkfs\.ext4/.test(md), `${label}: ext4 chosen, mkfs.ext4 missing`);
    if (s.filesystem === 'xfs') ok(/mkfs\.xfs/.test(md), `${label}: xfs chosen, mkfs.xfs missing`);
    ok(/subvolume create/.test(md) === (s.filesystem === 'btrfs'),
        `${label}: subvolumes present without btrfs`);

    // snapshots only offered on btrfs
    ok(!(s.snapshots && s.filesystem !== 'btrfs'),
        `${label}: snapshots=${s.snapshots} on ${s.filesystem}`);

    // microcode: never on ARM, never under a libre policy
    const ucode = /(intel-ucode|amd-ucode)/.test(md.split('## 4.')[0]);
    if (s.arch === 'aarch64') ok(!ucode, `${label}: microcode on aarch64`);
    if (s.libre === 'yes') ok(!ucode, `${label}: microcode under a libre policy`);

    // proprietary apps must not survive a libre policy
    if (s.libre === 'yes') {
        const after = md.split('## 8.')[1] || '';
        ok(!/\bsteam\b/.test(after.split('```')[1] || ''), `${label}: steam installed under libre policy`);
        ok(!/\bdiscord\b/.test(after.split('```')[1] || ''), `${label}: discord installed under libre policy`);
    }

    // bootloader branch reaches the right commands
    if (s.arch === 'x86_64') {
        if (s.bootloader === 'grub') ok(/grub-install/.test(md), `${label}: grub chosen, grub-install missing`);
        if (s.bootloader === 'systemd-boot') ok(/bootctl install/.test(md), `${label}: systemd-boot chosen, bootctl missing`);
        if (s.bootloader === 'uki') ok(/\/etc\/kernel\/cmdline/.test(md), `${label}: uki chosen, cmdline missing`);
        if (s.bootloader === 'systemd-boot') ok(/editor no/.test(md), `${label}: systemd-boot without editor no`);
        if (s.secureboot === 'own-keys' && s.bootloader === 'uki') {
            ok(/sbctl enroll-keys/.test(md), `${label}: own keys chosen, sbctl missing`);
        }
        // sbctl must never appear when Secure Boot was declined
        if (s.secureboot === 'off') ok(!/sbctl enroll-keys/.test(md), `${label}: sbctl with secureboot off`);
    } else {
        ok(!/grub-install --target=x86_64/.test(md), `${label}: x86 grub on aarch64`);
        ok(/Arch Linux ARM|archlinuxarm/.test(md), `${label}: aarch64 without any ARM guidance`);
    }

    // dual boot: never format the shared ESP
    if (s.dualboot && s.dualboot !== 'none') {
        ok(!new RegExp('mkfs\\.fat[^\\n]*' + s.dualboot_esp.replace(/\//g, '\\/')).test(md),
            `${label}: formats the shared ESP`);
        ok(/NOT formatted/.test(md), `${label}: dual boot without the ESP warning`);
        if (s.dualboot === 'windows') ok(/powercfg \/h off/.test(md), `${label}: windows dual boot without Fast Startup step`);
        if (s.dualboot === 'windows') ok(/BitLocker|manage-bde/.test(md), `${label}: windows dual boot without BitLocker warning`);
    } else {
        ok(/mkfs\.fat -F32/.test(md), `${label}: single-OS install never formats an ESP`);
    }

    // Dusky locking must actually take effect in the output
    if (s.desktop === 'dusky') {
        for (const [k, v] of Object.entries(DUSKY_LOCKS)) {
            if (STEPS.find(st => st.id === k && applies(st, s))) {
                ok(s[k] === v, `${label}: dusky lock ${k}=${s[k]} expected ${v}`);
            }
        }
        ok(/Dusky is preconfigured/.test(md), `${label}: dusky chosen without the lock explanation`);
        ok(/youtube\.com/.test(md), `${label}: dusky chosen without the video link`);
    }

    // destructive options must always carry a warning
    if (s.buskill === 'shutdown') ok(/cuts power|Unsaved\s+work is gone/i.test(md), `${label}: buskill shutdown without warning`);

    // mirror selection: reflector present on x86, honours https + country
    if (s.arch === 'x86_64') {
        ok(/reflector/.test(md), );
        if (s.mirror_https === 'yes') ok(/--protocol https/.test(md), );
        if (s.mirror_https === 'no') ok(!/--protocol https/.test(md), );
        if (s.mirror_country && s.mirror_country !== 'auto') ok(new RegExp('--country ' + s.mirror_country).test(md), );
        if (s.mirror_country === 'auto') ok(!/--country/.test(md), );
    } else {
        ok(!/reflector/.test(md.split('## 2.')[0]), );
    }

    // the script must be parseable
    const p = path.join(tmp, 'g.sh');
    fs.writeFileSync(p, sh);
    try {
        execFileSync('bash', ['-n', p], { stdio: 'pipe' });
        scriptsChecked++;
    } catch (e) {
        fails++; checks++;
        failures.push(`${label}: bash -n rejected the generated script: ${String(e.stderr || e).slice(0, 300)}`);
    }
    ok(sh.includes('set -Eeuo pipefail'), `${label}: script without strict mode`);
    ok(/Type YES to continue/.test(sh), `${label}: script without the read-it confirmation`);
    if (s.verbosity === 'debug') {
        ok(sh.split(/\r?\n/).some(x => x.startsWith('set -x')),
            `${label}: debug verbosity without set -x`);
    }

    return { md, sh };
}

// ── Sweep ────────────────────────────────────────────────────────────────────
// Every combination of the axes that actually branch the output, with the
// remaining questions filled by first / last / recommended option in rotation.
const AXES = {
    arch: ['x86_64', 'aarch64'],
    dualboot: ['none', 'windows', 'linux', 'arch'],
    encryption: ['luks2', 'luks1', 'none'],
    filesystem: ['btrfs', 'ext4', 'xfs'],
    desktop: ['dusky', 'hyprland', 'dwm', 'none'],
    libre: ['yes', 'no']
};

const strategies = [
    { name: 'first', one: (st, o) => o[0].value, multi: (st, o) => o.length ? [o[0].value] : [] },
    { name: 'last', one: (st, o) => o[o.length - 1].value, multi: (st, o) => o.map(x => x.value) },
    { name: 'rec', one: (st, o) => (o.find(x => x.recommended) || o[0]).value,
      multi: (st, o) => o.filter(x => x.recommended).map(x => x.value) }
];

let n = 0;
for (const arch of AXES.arch)
for (const dualboot of AXES.dualboot)
for (const encryption of AXES.encryption)
for (const filesystem of AXES.filesystem)
for (const desktop of AXES.desktop)
for (const libre of AXES.libre) {
    const strat = strategies[n % strategies.length];
    const seed = { arch, dualboot, encryption, filesystem, desktop, libre };
    const s = complete(seed, strat);
    assertGuide(s, `#${n} ${arch}/${dualboot}/${encryption}/${filesystem}/${desktop}/libre=${libre}/${strat.name}`);
    n++;
}

// Targeted cases the sweep does not reach.
assertGuide(complete({ arch: 'x86_64', dualboot: 'none', encryption: 'luks2', filesystem: 'btrfs',
                       desktop: 'none', libre: 'no', bootloader: 'uki', secureboot: 'own-keys',
                       verbosity: 'debug' }, strategies[2]), 'targeted: uki+ownkeys+debug');
assertGuide(complete({ arch: 'x86_64', dualboot: 'none', encryption: 'none', filesystem: 'ext4',
                       desktop: 'none', libre: 'no', buskill: 'shutdown' }, strategies[2]),
            'targeted: buskill shutdown');

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`permutations: ${n + 2}`);
console.log(`assertions:   ${checks}`);
console.log(`scripts parsed by bash -n: ${scriptsChecked}`);
if (fails) {
    console.log(`\nFAILURES (${fails}):`);
    [...new Set(failures)].slice(0, 40).forEach(f => console.log('  - ' + f));
    process.exit(1);
}
console.log('\nALL PASS');
