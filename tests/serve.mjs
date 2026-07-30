/* A static file server for the tests, because file:// is not good enough.
 *
 * The jsdom tests used to load pages with `JSDOM.fromFile(page, { url:
 * 'http://localhost:8731/' + page })`. That combination is a trap: jsdom
 * resolves every relative <script src> and <link href> against the `url`
 * option, so it tried to fetch them over HTTP from a port with nothing
 * listening. Every script failed to load, jsdom reported it as
 * "Could not load script", and the audit filtered that message out as a jsdom
 * gap — so a page with *nothing running on it* was reported as having no
 * runtime errors. The counts in the audit output were the only clue, and they
 * quietly drifted down as pages gained scripts.
 *
 * Serving for real fixes that, and it is also the only way to test the parts of
 * the site that use fetch() — the cheatsheet tabs, wiki.html?page=, the search
 * index. On a file:// origin fetch is blocked outright, so those paths were
 * completely untested.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md':   'text/markdown; charset=utf-8',
    '.txt':  'text/plain; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.ico':  'image/x-icon',
};

/**
 * Serve `root` on an ephemeral port.
 * @returns {Promise<{origin: string, close: () => Promise<void>, missing: string[]}>}
 */
export async function serve(root) {
    const abs = path.resolve(root);
    // Anything requested that does not exist. A test can assert this is empty,
    // which catches a page referencing a file that was renamed or never added.
    const missing = [];

    const server = http.createServer((req, res) => {
        let rel;
        try {
            rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        } catch {
            res.writeHead(400).end('bad path');
            return;
        }
        if (rel.endsWith('/')) rel += 'index.html';

        // Never serve outside the root, however the path is spelled.
        const file = path.join(abs, rel);
        if (!file.startsWith(abs)) { res.writeHead(403).end('forbidden'); return; }

        fs.readFile(file, (err, buf) => {
            if (err) {
                // A directory request without a trailing slash is common in the
                // docs tree; try its index before calling it missing.
                fs.readFile(path.join(file, 'index.html'), (err2, buf2) => {
                    if (err2) {
                        missing.push(rel);
                        res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
                    } else {
                        res.writeHead(200, { 'content-type': TYPES['.html'] }).end(buf2);
                    }
                });
                return;
            }
            res.writeHead(200, {
                'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
                'cache-control': 'no-store',
            }).end(buf);
        });
    });

    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();

    return {
        origin: `http://127.0.0.1:${port}`,
        missing,
        close: () => new Promise(r => server.close(r)),
    };
}

/**
 * Load a page from a running server into jsdom, with fetch wired to it.
 * Resolves once the page has settled.
 */
export async function loadPage(JSDOM, VirtualConsole, origin, page, { wait = 900 } = {}) {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => errors.push(String(e.message || e).split('\n')[0]));
    vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

    const dom = await JSDOM.fromURL(`${origin}/${page}`, {
        runScripts: 'dangerously',
        resources: 'usable',
        pretendToBeVisual: true,
        virtualConsole: vc,
    });

    // jsdom has no fetch of its own. The site feature-detects it and degrades
    // gracefully, which is correct in a browser but means the fetch paths go
    // untested unless one is supplied. Node's fetch against the real server is
    // the closest thing to what a browser does.
    //
    // Same-origin only, deliberately. security-tools.html and repo.html call
    // api.github.com for live release statistics; letting the suite do that
    // would make it depend on the network, burn an unauthenticated rate limit
    // that is shared across a whole CI runner, and leave requests in flight
    // after the test closed the window — which is how "Cannot read properties
    // of undefined (reading 'getElementById')" appeared, from a callback firing
    // against a torn-down document. Refusing the request instead exercises the
    // page's own failure path, which is the branch worth testing anyway.
    dom.window.fetch = (input, init) => {
        const href = typeof input === 'string' ? input : (input && input.url) || '';
        const url = new URL(href, `${origin}/${page}`);
        if (url.origin !== origin) {
            return Promise.reject(new TypeError(
                `blocked cross-origin fetch to ${url.origin} — tests are offline by design`));
        }
        return fetch(url.toString(), init);
    };

    await new Promise(r => setTimeout(r, wait));
    return { dom, window: dom.window, document: dom.window.document, errors };
}
