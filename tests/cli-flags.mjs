/* Every CLI flag the site, docs and installer tell people to run must actually
 * exist in the crate that is supposed to accept it.
 *
 * This gate exists because the same bug shipped SEVEN times:
 *
 *   anti-evil-maid --setup            main.rs accepted only --interactive, so
 *                                     every generated install script failed on
 *                                     the line that records the boot baseline
 *   anti-evil-maid --decoy-password   never existed, and put the password on
 *                                     argv where ps shows it to every local user
 *   anti-evil-maid --duress-password  same
 *   anti-ducky --approve-current      never existed
 *   kernel-watcher --setup            run_setup() existed; clap never exposed it
 *   scarecrow --setup                 init_scarecrow() existed; clap never
 *                                     exposed it
 *   libre-otp --ssh / --reseal /      none existed; the initramfs one meant the
 *     --install-initramfs-hook /      boot prompt was never installed at all
 *     --setup-tamper-check
 *
 * Every one of them looked fine in review, passed every existing test, and
 * failed only on a real Arch machine at install time — which is the worst place
 * to find out. A documented flag that does not exist is indistinguishable from
 * a working feature until someone tries it.
 *
 * The check is deliberately dumb: scrape `<tool> --flag` out of everything a
 * user might follow, then confirm the string appears in that crate's source.
 * It cannot prove the flag WORKS, only that something claims to handle it —
 * which is exactly the gap that let these through.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '..');
const toolsDir = path.join(root, 'security-tools');

const TOOLS = fs.readdirSync(toolsDir).filter(d =>
    fs.existsSync(path.join(toolsDir, d, 'Cargo.toml')));

/* Places a user could copy a command out of. */
const SEARCH_DIRS = ['website', 'docs', 'scripts'];
const SEARCH_EXT = new Set(['.js', '.html', '.md', '.sh', '.yml', '.yaml']);

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
            walk(p, out);
        } else if (SEARCH_EXT.has(path.extname(e.name))) {
            out.push(p);
        }
    }
    return out;
}

/* Source for a crate: main.rs and lib.rs. libre-otp parses argv by hand rather
   than with clap derive, so checking only main.rs would report false failures
   on flags that do exist. */
function crateSource(tool) {
    let src = '';
    for (const f of ['src/main.rs', 'src/lib.rs']) {
        const p = path.join(toolsDir, tool, f);
        if (fs.existsSync(p)) src += fs.readFileSync(p, 'utf8');
    }
    // READMEs are documentation, not implementation — deliberately not included.
    return src;
}

/* clap derive turns `--set-unlock-pin` into a field named `set_unlock_pin`, so
   both spellings count as the flag being handled. */
function isHandled(src, flag) {
    const bare = flag.replace(/^--/, '');
    const field = bare.replace(/-/g, '_');
    return src.includes(`"${flag}"`) ||               // hand-rolled argv match
           src.includes(`"${bare}"`) ||               // clap long = "..."
           new RegExp(`\\b${field}\\s*:\\s*(bool|Option)`).test(src) ||
           new RegExp(`\\b${field}\\b`).test(src) && src.includes('#[arg(');
}

/* Flags clap provides for free. */
const BUILT_IN = new Set(['--help', '--version']);

const files = SEARCH_DIRS.flatMap(d => walk(path.join(root, d)));
const problems = [];
let checked = 0;

// Also scan the tool READMEs — they are the first thing a user reads.
for (const t of TOOLS) {
    const rp = path.join(toolsDir, t, 'README.md');
    if (fs.existsSync(rp)) files.push(rp);
}

for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const tool of TOOLS) {
        const re = new RegExp(`\\b${tool}\\s+(--[a-z][a-z0-9-]*)`, 'g');
        let m;
        while ((m = re.exec(text)) !== null) {
            const flag = m[1];
            if (BUILT_IN.has(flag)) continue;

            // Two kinds of mention are not a claim that the flag works:
            //
            //   1. A source comment. The history of these bugs is written down
            //      in comments next to the fixed code, deliberately, and that
            //      prose must not fail the gate.
            //   2. Documentation that explicitly opts out with `cli-flags:allow`
            //      — used where user-facing prose has to name a flag in order
            //      to explain that it never existed.
            //
            // This replaced a heuristic that scanned surrounding prose for
            // phrases like "does not exist". That version could be silenced by
            // accident: a genuine reintroduction sitting near an old
            // explanatory comment inherited the exemption, and a self-test
            // proved it — reintroducing `anti-ducky --approve-current` next to
            // its own historical note did not fail the gate. A regression
            // detector that an unrelated nearby comment can switch off is not a
            // regression detector, so the exemption is now something a person
            // has to write on purpose.
            const lineStart = text.lastIndexOf('\n', m.index) + 1;
            let lineEnd = text.indexOf('\n', m.index);
            if (lineEnd < 0) lineEnd = text.length;
            const line = text.slice(lineStart, lineEnd);

            const isComment = /^\s*(\/\/|\/\*|\*|#(?!!)|<!--)/.test(line);
            if (isComment || line.includes('cli-flags:allow')) continue;

            checked++;
            if (!isHandled(crateSource(tool), flag)) {
                problems.push(
                    `${path.relative(root, file)}: "${tool} ${flag}" — ` +
                    `nothing in security-tools/${tool}/src handles it`);
            }
        }
    }
}

const unique = [...new Set(problems)];
console.log(`cli-flags: ${checked} documented invocations across ` +
            `${TOOLS.length} crates, ${unique.length} unhandled`);

if (unique.length) {
    console.error('\nDocumented flags that no crate accepts:\n');
    for (const p of unique) console.error('  ' + p);
    console.error('\nEither implement the flag or correct the documentation. ' +
                  'A flag that only exists in the docs fails on the user\'s machine.');
    process.exit(1);
}
