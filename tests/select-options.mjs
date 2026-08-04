/* Selects that offer "the same kind of thing" must offer the same options.
 *
 * Written after this was found on a real page: `kernel-main` offered
 * `linux-hardened` and `kernel-backup` did not. So anyone who chose the
 * hardened kernel had no hardened fallback — and the fallback is exactly what
 * boots when the main kernel fails, which is when you least want to be silently
 * dropped onto a kernel without the hardening you asked for.
 *
 * Nothing caught it because every individual select was internally valid. The
 * bug only exists in the *relationship* between two of them, which is the kind
 * of thing that needs an explicit assertion or it drifts the first time someone
 * adds an option to one and not the other.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '../website');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/** Option values of a <select> by id. */
function optionsOf(id) {
    const re = new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`, 'i');
    const m = re.exec(html);
    if (!m) return null;
    return [...m[1].matchAll(/<option[^>]*value="([^"]*)"/g)]
        .map(o => o[1])
        .filter(v => v !== '');           // the disabled placeholder
}

/* Groups that must agree, and what each is allowed to add on top.
   `extra` exists because a fallback legitimately offers "none" and a main
   kernel does not — the point is that no group member may be *missing* a
   kernel the others offer. */
const GROUPS = [
    {
        name: 'kernel selects',
        ids: ['kernel-main', 'kernel-backup'],
        // Every real kernel Arch ships that this project supports.
        required: ['linux', 'linux-lts', 'linux-zen', 'linux-hardened'],
        extra: { 'kernel-backup': ['none'] }
    }
];

let checked = 0;
const problems = [];

for (const g of GROUPS) {
    for (const id of g.ids) {
        const opts = optionsOf(id);
        if (opts === null) {
            problems.push(`${id}: no such <select> in index.html`);
            continue;
        }
        checked++;
        for (const need of g.required) {
            if (!opts.includes(need)) {
                problems.push(
                    `${id} is missing "${need}" — the other ${g.name} offer it, ` +
                    `so choosing it elsewhere leaves this control unable to match`);
            }
        }
        const allowed = new Set([...g.required, ...(g.extra[id] || [])]);
        for (const got of opts) {
            if (!allowed.has(got)) {
                problems.push(`${id} offers unexpected "${got}" — add it to the group or remove it`);
            }
        }
    }
}

console.log(`select-options: ${checked} selects across ${GROUPS.length} group(s), ` +
            `${problems.length} problems`);

if (problems.length) {
    console.error('\nSelects that should agree and do not:\n');
    for (const p of problems) console.error('  ' + p);
    console.error('\nA fallback that cannot offer what the main control offers silently ' +
                  'downgrades the user at the worst moment.');
    process.exit(1);
}
