/* The Live Editor's preview button, and the globals its page depends on.
 *
 * The bug this exists for: `index.html` and `live.html` both call
 * `window.renderMarkdown`, and neither loaded `markdown.js`. The calls are
 * guarded — `if (typeof window.renderMarkdown === 'function')` — so nothing
 * threw. The preview button switched panes and rendered an empty div, and the
 * generator's live preview was blank, and both failed in total silence.
 *
 * It got that way from a bulk edit that skipped any file already containing the
 * string "markdown.js". Both files mention markdown.js *in a comment*, so the
 * guard matched and the script tag was never added. A grep-based guard testing
 * for a filename is not a test that the file is loaded.
 *
 * So this asserts on behaviour: put markdown in the box, press the button, and
 * check that real elements came out.
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import { serve, loadPage } from './serve.mjs';

const WEB = process.argv[2] || '../website';

let checks = 0;
const failures = [];
const ok = (cond, label) => { checks++; if (!cond) failures.push(label); };

const server = await serve(WEB);

/* ── The Live Editor preview ────────────────────────────────────────────── */
{
    const { window, document: d } = await loadPage(JSDOM, VirtualConsole, server.origin, 'live.html');

    const btn = d.getElementById('preview-toggle-btn');
    const ta = d.getElementById('markdown-editor');
    const pv = d.getElementById('markdown-preview');

    ok(!!btn, 'live.html has no #preview-toggle-btn');
    ok(!!ta, 'live.html has no #markdown-editor');
    ok(!!pv, 'live.html has no #markdown-preview');
    ok(typeof window.toggleMarkdownPreview === 'function',
       'live.html defines no toggleMarkdownPreview()');
    ok(typeof window.renderMarkdown === 'function',
       'live.html calls renderMarkdown but does not load markdown.js');

    if (btn && ta && pv) {
        ta.value = [
            '# Heading',
            '',
            'Text with **bold**, `code`, and a [link](https://example.com).',
            '',
            '- one',
            '- two',
            '',
            '| A | B |',
            '|---|---|',
            '| 1 | 2 |',
            '',
            '```bash',
            'echo hello',
            '```',
        ].join('\n');

        btn.click();
        await new Promise(r => setTimeout(r, 60));

        ok(pv.style.display !== 'none', 'the preview pane stayed hidden after pressing Preview');
        ok(ta.style.display === 'none', 'the textarea stayed visible behind the preview');
        // The failure mode was a pane that switched and showed nothing, so an
        // empty preview is the specific thing to catch.
        ok(pv.innerHTML.trim().length > 0, 'the preview rendered nothing at all');
        ok(!!pv.querySelector('h1'), 'a markdown heading did not render');
        ok(!!pv.querySelector('strong'), 'bold text did not render');
        ok(pv.querySelectorAll('li').length === 2, 'the list did not render as list items');
        ok(!!pv.querySelector('table'), 'the table did not render');
        ok(!!pv.querySelector('pre'), 'the fenced code block did not render');
        ok(pv.querySelectorAll('[class^="tk-"]').length > 0,
           'the code block rendered but was not syntax-highlighted');
        ok(!/\*\*|\[link\]\(/.test(pv.textContent),
           'raw markdown syntax survived into the preview text');
        ok(/Edit/i.test(btn.textContent), 'the button still says Preview while previewing');

        btn.click();
        await new Promise(r => setTimeout(r, 30));
        ok(ta.style.display !== 'none', 'toggling back did not restore the editor');
        ok(/Preview/i.test(btn.textContent), 'the button did not go back to saying Preview');
    }

    window.close();
}

/* ── The generator's live preview uses the same renderer ─────────────────── */
{
    const { window } = await loadPage(JSDOM, VirtualConsole, server.origin, 'index.html');
    ok(typeof window.renderMarkdown === 'function',
       'index.html calls renderMarkdown in updatePreview() but does not load markdown.js');
    ok(typeof window.updatePreview === 'function',
       'index.html defines no updatePreview()');
    window.close();
}

await server.close();

console.log(`live-editor: ${checks} checks, ${failures.length} failed`);
failures.forEach(f => console.log('  x ' + f));
process.exit(failures.length ? 1 : 0);
