#!/usr/bin/env python3
"""Serve website/ for local checking, with caching switched off.

A plain `python -m http.server` sends no cache headers, so browsers are free to
hold on to `script.js` and `shared-ui.js` across edits. Cache-busting the HTML
does not bust the JS it pulls in, so the page renders old behaviour under new
markup -- which reads as "the edit did nothing" and has cost real time twice.

Port 8731 belongs to tests/serve.mjs. Binding it here makes the runtime gate
report every page as running nothing, so the default is deliberately elsewhere.
"""

import argparse
import functools
import http.server
import pathlib

TESTS_PORT = 8731


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    repo = pathlib.Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--port", type=int, default=8842)
    ap.add_argument("--directory", default=str(repo / "website"))
    args = ap.parse_args()

    if args.port == TESTS_PORT:
        ap.error(f"port {TESTS_PORT} is reserved for tests/serve.mjs")

    handler = functools.partial(NoStoreHandler, directory=args.directory)
    # Threading matters: a browser holds connections open, and a single-threaded
    # server stops answering as soon as one of them is idle mid-request.
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("", args.port), handler) as httpd:
        print(f"serving {args.directory} on http://localhost:{args.port} (no-store)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
