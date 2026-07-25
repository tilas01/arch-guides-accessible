# Tests

Three checks, no framework, no build step. They run against `website/` directly,
the same files that get deployed.

```bash
cd tests
npm install
npm test
```

| Check | What it actually proves |
|---|---|
| `permutations.mjs` | Sweeps 578 answer combinations through the manual walkthrough's real data and guide-builder, and asserts on the **content**: the right cipher reaches `cryptsetup`, subvolumes appear only with Btrfs, microcode never on ARM or under a libre policy, the shared EFI partition is never formatted when dual booting, `sbctl` never appears with Secure Boot declined, destructive options always carry their warning. 11,695 assertions. Then hands every one of the 578 generated scripts to `bash -n`. |
| `responsive.mjs` | Loads every page and checks the structural causes of horizontal overflow: fixed pixel widths wider than a phone, `<pre>` and `<table>` without a scroll container, images that cannot shrink, viewport meta that blocks zoom. jsdom does no layout, so this cannot measure real overflow — it catches the things that cause it. |
| `html-validate` | All nine pages, against `.htmlvalidate.json`. Deliberate choices are configured off there (inline styles are used throughout; shared checkbox `name` attributes are how a multi-select group works), so a failure is a real failure. |

## Why these exist

A `SyntaxError` in `script.js` once shipped in twelve consecutive commits. A
classic `<script>` that fails to parse never executes at all, so the generator,
both live-editor load buttons, the history and every tooltip were dead the whole
time — while Pages deployed successfully each time, faithfully publishing a
script that could not run.

`node --check` in CI would have caught that one. These catch the layer beneath
it: code that parses and runs, and produces the wrong thing.
