#!/usr/bin/env python3
"""
Build the site-wide search index.

The index is generated here rather than assembled in the browser. A page that
fetches eight HTML files and parses them on every visit is slow, fails offline,
and re-does identical work for every visitor; a JSON file built once is none of
those things. Run from the repository root:

    python scripts/gen-search-index.py

Sources
  website/*.html        headings that carry an id, plus the page itself
  website/manual-data.js  every walkthrough question, its help text and its
                          answer options
  docs/**/*.md          headings, linked to the published copy

Output
  website/search-index.json   [{t: title, u: url, s: section, d: description}]

Deterministic: entries are emitted in a stable order, so re-running it produces
no diff unless the content actually changed.
"""

from __future__ import annotations

import html
import json
import os
import re
import sys

PAGE_TITLES = {
    "index.html": "Generator",
    "manual.html": "Manual walkthrough",
    "wiki.html": "Wiki",
    "iso-verify.html": "Verify an ISO",
    "security-tools.html": "Security tools",
    "live.html": "Live editor",
    "releases.html": "Releases",
    "repo.html": "Repository",
    "site-index.html": "Index",
}

# Pages whose headings are navigation furniture rather than content.
SKIP_PAGES = {"site-index.html", "upload.html"}

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def text_of(fragment: str) -> str:
    """Strip tags and collapse whitespace, then unescape entities."""
    return WS_RE.sub(" ", html.unescape(TAG_RE.sub(" ", fragment))).strip()


def snippet(body: str, start: int, limit: int = 180) -> str:
    """A short plain-text description taken from just after a heading."""
    chunk = body[start:start + 2500]
    # Drop script and style blocks before flattening, or their source leaks in.
    chunk = re.sub(r"<(script|style)\b.*?</\1>", " ", chunk, flags=re.S | re.I)
    # First paragraph-ish run of text after the heading.
    m = re.search(r"<p[^>]*>(.*?)</p>", chunk, re.S | re.I)
    text = text_of(m.group(1)) if m else text_of(chunk)
    return (text[:limit].rstrip() + "…") if len(text) > limit else text


def index_html(web: str) -> list[dict]:
    out = []
    for name in sorted(os.listdir(web)):
        if not name.endswith(".html") or name in SKIP_PAGES:
            continue
        page = PAGE_TITLES.get(name, name[:-5].replace("-", " ").title())
        body = open(os.path.join(web, name), encoding="utf-8").read()

        # The page itself.
        desc = ""
        m = re.search(r'<meta name="description" content="([^"]*)"', body)
        if m:
            desc = html.unescape(m.group(1))
        out.append({"t": page, "u": name, "s": "Page", "d": desc})

        # Headings that carry an id, so they can be linked to directly.
        for m in re.finditer(
                r'<(h[1-4])\b([^>]*)>(.*?)</\1>', body, re.S | re.I):
            attrs, inner = m.group(2), m.group(3)
            idm = re.search(r'id="([^"]+)"', attrs)
            if not idm:
                # A heading inside a section that has the id is still linkable.
                sec = body.rfind('<div class="section" id="', 0, m.start())
                sec2 = body.rfind('<section', 0, m.start())
                pos = max(sec, sec2)
                if pos == -1:
                    continue
                idm = re.search(r'id="([^"]+)"', body[pos:pos + 220])
                if not idm:
                    continue
            title = text_of(inner)
            if not title or len(title) < 3:
                continue
            out.append({
                "t": title,
                "u": f"{name}#{idm.group(1)}",
                "s": page,
                "d": snippet(body, m.end()),
            })
    return out


def index_manual(web: str) -> list[dict]:
    """Every walkthrough question, so searching for "swap" finds the question
    that asks about it and not only the wiki section that explains it."""
    path = os.path.join(web, "manual-data.js")
    if not os.path.isfile(path):
        return []
    src = open(path, encoding="utf-8").read()
    out = []
    for m in re.finditer(
            r"\{\s*\n\s*id:\s*'([a-z0-9_]+)',"        # id
            r".*?title:\s*'((?:[^'\\]|\\.)*)'"          # title
            r".*?wiki:\s*'([a-z0-9-]+)'", src, re.S):
        qid, title, wiki = m.group(1), m.group(2), m.group(3)
        title = title.replace("\\'", "'")
        # Pull the help text that follows, for the description.
        help_m = re.search(r"help:\s*((?:'(?:[^'\\]|\\.)*'\s*\+?\s*)+)",
                           src[m.start():m.start() + 3000], re.S)
        desc = ""
        if help_m:
            parts = re.findall(r"'((?:[^'\\]|\\.)*)'", help_m.group(1))
            desc = " ".join(p.replace("\\'", "'") for p in parts).strip()
        out.append({
            "t": title,
            "u": f"manual.html#q-{qid}",
            "s": "Manual walkthrough",
            "d": desc[:200],
        })
    return out


def index_docs(root: str) -> list[dict]:
    out = []
    docs = os.path.join(root, "docs")
    if not os.path.isdir(docs):
        return out
    for dirpath, _dirnames, filenames in os.walk(docs):
        for fn in sorted(filenames):
            if not fn.endswith(".md"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            # docs/ is copied into website/docs/ at deploy time, so the
            # published path drops the leading directory.
            url = rel[len("docs/"):] if rel.startswith("docs/") else rel
            url = "docs/" + url
            body = open(full, encoding="utf-8", errors="replace").read()
            lines = body.split("\n")
            title = fn[:-3].replace("-", " ")
            for line in lines:
                if line.startswith("# "):
                    title = line[2:].strip()
                    break
            out.append({"t": title, "u": url, "s": "Docs",
                        "d": next((l.strip() for l in lines
                                   if l.strip() and not l.startswith(("#", "<", "!", "|"))), "")[:180]})
            for i, line in enumerate(lines):
                if re.match(r"^#{2,3} ", line):
                    heading = line.lstrip("# ").strip()
                    anchor = re.sub(r"[^a-z0-9\s-]", "", heading.lower()).strip()
                    anchor = re.sub(r"\s+", "-", anchor)
                    desc = next((l.strip() for l in lines[i + 1:i + 8]
                                 if l.strip() and not l.startswith(("#", "|", "```"))), "")
                    out.append({"t": heading, "u": f"{url}#{anchor}",
                                "s": f"Docs · {title}", "d": desc[:180]})
    return out


def main() -> int:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web = os.path.join(root, "website")

    entries = index_html(web) + index_manual(web) + index_docs(root)

    # De-duplicate by URL, keeping the first (page-level) entry.
    seen, unique = set(), []
    for e in entries:
        if e["u"] in seen:
            continue
        seen.add(e["u"])
        unique.append(e)

    unique.sort(key=lambda e: (e["s"], e["t"]))

    out = os.path.join(web, "search-index.json")
    with open(out, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(unique, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")

    size = os.path.getsize(out)
    print(f"wrote {len(unique)} entries to website/search-index.json ({size:,} bytes)")
    by_section: dict[str, int] = {}
    for e in unique:
        by_section[e["s"]] = by_section.get(e["s"], 0) + 1
    for k in sorted(by_section):
        print(f"  {by_section[k]:4d}  {k}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
