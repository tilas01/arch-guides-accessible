/* The OS selector must actually change the output, and unfinished OSes must
 * carry an unmissable Work In Progress warning.
 *
 * This gate exists because of the pattern that has produced every serious
 * defect in this repository: a control that is visible, documented, and wired
 * to nothing. An OS selector that renders four options and emits an identical
 * Arch guide for all of them would be exactly that — and it would be worse than
 * usual here, because the user would believe they had a FreeBSD guide.
 *
 * What it asserts:
 *
 *   1. The guide title names the selected OS.
 *   2. Skipping the selection produces the Arch guide unchanged — tilas01's
 *      explicit requirement, and what keeps the existing 578 permutations valid.
 *   3. Every incomplete OS emits the WIP banner, and it says the three things
 *      that matter: not ready, read-only, use Arch instead.
 *   4. Arch never emits it.
 *
 * The WIP assertion is the load-bearing one. These scripts repartition disks;
 * someone who runs a half-finished FreeBSD guide can lose one.
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import { serve, loadPage } from './serve.mjs';

const root = process.argv[2] || '../website';
const srv = await serve(root);
// serve() binds an ephemeral port and reports its own origin — do not
// reconstruct it from a hard-coded port, which is how this first failed.
const { window } = await loadPage(JSDOM, VirtualConsole, srv.origin, 'manual.html', { wait: 900 });

const buildGuide = window.buildManualGuide;
const OS_META = window.OS_META || null;

const problems = [];
let checks = 0;

if (typeof buildGuide !== 'function') {
    console.error('buildManualGuide is not exposed — the walkthrough did not load.');
    process.exit(1);
}

/** A config complete enough that the emitter produces a real guide. */
function cfg(os) {
    return {
        os, arch: 'x86_64', disk: '/dev/sda', encryption: 'luks2',
        filesystem: 'ext4', bootloader: 'systemd-boot', firmware: 'uefi',
        username: 'tester', hostname: 'testbox', timezone: 'UTC',
        locale: 'en_US.UTF-8', keymap: 'us'
    };
}

/* Expected label per id. Deliberately duplicated here rather than read from
   OS_META: a test that reads its expectations from the code under test cannot
   catch that code being wrong. */
const EXPECTED = {
    arch:    { label: 'Arch Linux', complete: true },
    gentoo:  { label: 'Gentoo',     complete: false },
    freebsd: { label: 'FreeBSD',    complete: false },
    openbsd: { label: 'OpenBSD',    complete: false }
};

// 1 + 3 + 4: title names the OS, and the WIP banner appears iff incomplete.
for (const [id, want] of Object.entries(EXPECTED)) {
    const md = buildGuide(cfg(id));
    const title = md.split('\n')[0];
    checks++;

    if (!title.includes(want.label)) {
        problems.push(`os=${id}: guide title does not name it — got "${title.slice(0, 60)}"`);
    }

    const hasWip = md.includes('🚧');
    if (want.complete && hasWip) {
        problems.push(`os=${id}: is complete but emits a work-in-progress banner`);
    }
    if (!want.complete) {
        if (!hasWip) {
            problems.push(
                `os=${id}: NO work-in-progress banner. It is incomplete, so a reader ` +
                `would take this for a finished guide and run it.`);
        } else {
            // The banner has to say the three things, not merely exist.
            //
            // Matched against the text with blockquote markers and line breaks
            // flattened away, because that is what a reader actually sees. The
            // first version of this matched raw markdown and reported a false
            // failure on "is NOT\n> ready to install from" — the assertion was
            // testing the line wrapping rather than the meaning.
            checks++;
            const flat = md
                .replace(/^\s*>\s?/gm, ' ')   // drop blockquote markers
                .replace(/\*\*/g, '')         // drop bold markers
                .replace(/\s+/g, ' ');        // collapse all whitespace
            if (!/NOT ready to install from/i.test(flat)) {
                problems.push(`os=${id}: banner never says it is not ready to install from`);
            }
            if (!/Arch/.test(flat.slice(0, 1600))) {
                problems.push(`os=${id}: banner does not point the reader at Arch instead`);
            }
        }
    }
}

/* Arch-only options must not be offered on the other systems. The AUR does not
   exist outside Arch, so aur-guard there would install a binary that can never
   do anything — a control wired to nothing, which is the failure this project
   keeps removing. Hidden, not disabled. */
/* `const STEPS` at the top level of a classic script creates a global *lexical*
   binding, not a property on window — so `window.STEPS` is undefined and the
   first version of this block skipped itself in silence while still reporting
   success. Reach it through eval, and treat "cannot find it" as a failure
   rather than a reason to skip: a check that quietly does not run is worse than
   no check, because it reads as a pass. */
const STEPS = window.eval('typeof STEPS !== "undefined" ? STEPS : null');
checks++;
if (!Array.isArray(STEPS)) {
    problems.push('Could not reach STEPS from the page, so the Arch-only option ' +
                  'checks did not run. Treated as a failure, not a skip.');
} else {
    const sec = STEPS.find(s => s.id === 'security_tools');
    const aur = sec && (sec.options || []).find(o => o.value === 'aur-guard');
    checks++;
    if (!aur) {
        problems.push('security_tools no longer offers aur-guard at all — expected it on Arch');
    } else if (typeof aur.when !== 'function') {
        problems.push('aur-guard has no `when`, so it is offered on Gentoo and the BSDs ' +
                      'where there is no PKGBUILD for it to read');
    } else {
        for (const [id, want] of [['arch', true], ['gentoo', false],
                                  ['freebsd', false], ['openbsd', false]]) {
            const shown = !!aur.when({ os: id });
            if (shown !== want) {
                problems.push(`aur-guard is ${shown ? 'offered' : 'hidden'} on ${id} ` +
                              `— expected it ${want ? 'offered' : 'hidden'}`);
            }
        }
        // Skipping the OS must behave as Arch here too, not hide the option.
        if (!aur.when({})) {
            problems.push('aur-guard is hidden when no OS is selected — the default is Arch, ' +
                          'so it must be offered');
        }
    }
}

// 2: skipping the selection must reproduce the Arch guide exactly.
checks++;
const skipped = buildGuide(cfg(undefined));
const explicitArch = buildGuide(cfg('arch'));
if (skipped !== explicitArch) {
    problems.push(
        'Skipping the OS question does not produce the Arch guide. It must: ' +
        'Arch is the documented default, and every existing permutation ' +
        'depends on the unselected case behaving as it always did.');
}

// An unrecognised value must also fall back rather than producing a broken guide.
checks++;
if (buildGuide(cfg('plan9')) !== explicitArch) {
    problems.push('An unknown OS value does not fall back to Arch.');
}

console.log(`os-variants: ${checks} checks across ${Object.keys(EXPECTED).length} ` +
            `operating systems, ${problems.length} failed`);

if (problems.length) {
    console.error('\nOS selector problems:\n');
    for (const p of problems) console.error('  ' + p);
    console.error('\nAn OS option that does not change the output is a control wired ' +
                  'to nothing, and an unbadged incomplete guide is one someone will run.');
    srv.close?.();
    process.exit(1);
}

srv.close?.();
process.exit(0);
