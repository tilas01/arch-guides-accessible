/* ============================================================================
   iso-verify.js — verify an Arch ISO before you install from it.
   ----------------------------------------------------------------------------
   Two ideas drive this page.

   1. The ISO never leaves your machine. Hashing happens here, in your browser,
      over a stream. Nothing is uploaded — this site is static files on GitHub
      Pages and has no server that could receive an upload even if it wanted to.

   2. The image and its checksum must not come from the same host. If one server
      hands you both, then a server that lies about the image can hand you a
      checksum that matches the lie, and every check you run will pass. So the
      page picks one mirror for the image and *different* mirrors, sorted by
      proximity, for the checksums — and requires the independently obtained
      checksums to agree with each other before it agrees with either.
   ========================================================================= */

'use strict';

/* ── Mirrors ────────────────────────────────────────────────────────────────
   A fixed subset of the official Tier 1 list at
   https://archlinux.org/mirrors/status/ — all HTTPS, all fully synced at the
   time of writing. Hardcoded rather than fetched because archlinux.org does not
   send CORS headers, so a static page cannot read its mirror JSON. Re-check the
   official list if one of these goes stale; a dead mirror here is a broken link,
   not a security problem. */
const MIRRORS = [
    { url: 'https://mirror.puzzle.ch/archlinux/',                     cc: 'CH', country: 'Switzerland',   region: 'Europe'   },
    { url: 'https://ftp.spline.inf.fu-berlin.de/mirrors/archlinux/',  cc: 'DE', country: 'Germany',       region: 'Europe'   },
    { url: 'https://mirror.selfnet.de/archlinux/',                    cc: 'DE', country: 'Germany',       region: 'Europe'   },
    { url: 'https://ftp.halifax.rwth-aachen.de/archlinux/',           cc: 'DE', country: 'Germany',       region: 'Europe'   },
    { url: 'https://ftp.fau.de/archlinux/',                           cc: 'DE', country: 'Germany',       region: 'Europe'   },
    { url: 'https://mirrors.n-ix.net/archlinux/',                     cc: 'DE', country: 'Germany',       region: 'Europe'   },
    { url: 'https://archlinux.mirrors.ovh.net/archlinux/',            cc: 'FR', country: 'France',        region: 'Europe'   },
    { url: 'https://mirrors.dotsrc.org/archlinux/',                   cc: 'DK', country: 'Denmark',       region: 'Europe'   },
    { url: 'https://ftp.lysator.liu.se/pub/archlinux/',               cc: 'SE', country: 'Sweden',        region: 'Europe'   },
    { url: 'https://mirror.neuf.no/archlinux/',                       cc: 'NO', country: 'Norway',        region: 'Europe'   },
    { url: 'https://mirror.ams1.nl.leaseweb.net/archlinux/',          cc: 'NL', country: 'Netherlands',   region: 'Europe'   },
    { url: 'https://ftp.rnl.tecnico.ulisboa.pt/pub/archlinux/',       cc: 'PT', country: 'Portugal',      region: 'Europe'   },
    { url: 'https://ftp.ek-cer.hu/pub/mirrors/ftp.archlinux.org/',    cc: 'HU', country: 'Hungary',       region: 'Europe'   },
    { url: 'https://archlinux.nic.cz/archlinux/',                     cc: 'CZ', country: 'Czechia',       region: 'Europe'   },
    { url: 'https://mirrors.rit.edu/archlinux/',                      cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://mirror.umd.edu/archlinux/',                       cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://mirrors.lug.mtu.edu/archlinux/',                  cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://ftp.osuosl.org/pub/archlinux/',                   cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://mirror.sfo12.us.leaseweb.net/archlinux/',         cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://mirror.wdc1.us.leaseweb.net/archlinux/',          cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://arch.mirror.constant.com/',                       cc: 'US', country: 'United States', region: 'America'  },
    { url: 'https://mirror.csclub.uwaterloo.ca/archlinux/',           cc: 'CA', country: 'Canada',        region: 'America'  },
    { url: 'https://archlinux.c3sl.ufpr.br/',                         cc: 'BR', country: 'Brazil',        region: 'America'  },
    { url: 'https://ftp.jaist.ac.jp/pub/Linux/ArchLinux/',            cc: 'JP', country: 'Japan',         region: 'Asia'     },
    { url: 'https://mirrors.ustc.edu.cn/archlinux/',                  cc: 'CN', country: 'China',         region: 'Asia'     },
    { url: 'https://archlinux.cs.nycu.edu.tw/',                       cc: 'TW', country: 'Taiwan',        region: 'Asia'     },
    { url: 'https://download.nus.edu.sg/mirror/archlinux/',           cc: 'SG', country: 'Singapore',     region: 'Asia'     },
    { url: 'https://mirror.isoc.org.il/pub/archlinux/',               cc: 'IL', country: 'Israel',        region: 'Asia'     },
    { url: 'https://mirror.yandex.ru/archlinux/',                     cc: 'RU', country: 'Russia',        region: 'Europe'   },
    { url: 'https://mirror.aarnet.edu.au/pub/archlinux/',             cc: 'AU', country: 'Australia',     region: 'Oceania'  },
    { url: 'https://archlinux.mirror.digitalpacific.com.au/',         cc: 'AU', country: 'Australia',     region: 'Oceania'  },
    { url: 'https://syd.mirror.rackspace.com/archlinux/',             cc: 'AU', country: 'Australia',     region: 'Oceania'  },
    { url: 'https://mirror.2degrees.nz/archlinux/',                   cc: 'NZ', country: 'New Zealand',   region: 'Oceania'  },
    { url: 'https://mirror.fsmg.org.nz/archlinux/',                   cc: 'NZ', country: 'New Zealand',   region: 'Oceania'  }
];

/* Which regions to reach for, in order, once the nearest one is exhausted.
   Oceania has five mirrors here, which is enough for one image source and two
   distinct checksum sources without leaving the region — but the fallback still
   matters when a region has fewer entries than the three the page needs. */
const REGION_ORDER = {
    Oceania: ['Oceania', 'Asia', 'America', 'Europe'],
    Asia:    ['Asia', 'Oceania', 'Europe', 'America'],
    Europe:  ['Europe', 'America', 'Asia', 'Oceania'],
    America: ['America', 'Europe', 'Asia', 'Oceania']
};

/* The release the download page advertised when this was written. The page
   asks the mirror for `latest/` so it keeps working when this moves on; this
   constant only seeds the filename box. */
const KNOWN_RELEASE = '2026.07.01';

/* ── Arch Linux ARM ──────────────────────────────────────────────────────────
   aarch64 is genuinely a different distribution with a different integrity
   story, and the page says so rather than implying parity:

     - There is no ISO. Arch Linux ARM ships per-board **rootfs tarballs** that
       you extract onto prepared storage; there is nothing to write to a stick
       and boot.
     - They are served from a single host, os.archlinuxarm.org, over **HTTP**.
       The split-mirror trick that protects the x86_64 download does not apply,
       because there is no second mirror to cross-check against.
     - Checksums published are **MD5**, which is not collision-resistant. MD5
       still detects a corrupted download; it does not defend against a
       deliberately crafted one. The GPG signature is what does that, so on ARM
       the signature is not optional — it is the only real check.

   Signing key per archlinuxarm.org/about/downloads. Verify it there too. */
const ALARM_BASE = 'http://os.archlinuxarm.org/os/';
const ALARM_KEY_FPR = '68B3 537F 39A3 13B3 E574  D067 7719 3F15 2BDB E6A6';
const ALARM_BOARDS = [
    { id: 'rpi-aarch64',      label: 'Raspberry Pi 3/4/5 (aarch64)',   file: 'ArchLinuxARM-rpi-aarch64-latest.tar.gz' },
    { id: 'rpi-armv7',        label: 'Raspberry Pi 2/3 (armv7)',       file: 'ArchLinuxARM-rpi-armv7-latest.tar.gz' },
    { id: 'aarch64-generic',  label: 'Generic aarch64 (UEFI / EDK2)',  file: 'ArchLinuxARM-aarch64-latest.tar.gz' },
    { id: 'pine64',           label: 'Pine64',                         file: 'ArchLinuxARM-pine64-latest.tar.gz' },
    { id: 'odroid-c2',        label: 'ODROID-C2',                      file: 'ArchLinuxARM-odroid-c2-latest.tar.gz' }
];

/* Fingerprint of the key that signs Arch release ISOs (Pierre Schmitz).
   Printed here so you have a second place to compare it against, but the
   authority is https://archlinux.org/download/ — check it there too. */
const ARCH_SIGNING_FPR = '3E80 CA1A 8B89 F69C BA57  D98A 76A5 EF90 5444 9A5C';

/* ── Region guess ───────────────────────────────────────────────────────────
   "Sorted by closest" here means continent, inferred from the browser's IANA
   time zone. It is not a latency measurement: a static page cannot time a
   cross-origin request it is not allowed to read. Continent is a good enough
   proxy for picking a nearby mirror and is honest about what it knows. */
function guessRegion() {
    let tz = '';
    try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (_) { /* very old browser; fall through to the default */ }

    const zone = tz.split('/')[0];
    if (zone === 'Europe' || zone === 'Atlantic' || zone === 'Africa') return 'Europe';
    if (zone === 'America') return 'America';
    if (zone === 'Asia' || zone === 'Indian') return 'Asia';
    if (zone === 'Australia' || zone === 'Pacific') return 'Oceania';
    return 'Europe';
}

function shuffle(list) {
    const a = list.slice();
    // Fisher-Yates using crypto randomness, so mirror choice is not predictable
    // from a page load. Math.random would be fine for load spreading, but this
    // choice is part of a security story, so it uses the real generator.
    const rnd = new Uint32Array(a.length);
    crypto.getRandomValues(rnd);
    for (let i = a.length - 1; i > 0; i--) {
        const j = rnd[i] % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function hostOf(url) {
    try { return new URL(url).host; } catch (_) { return url; }
}

/**
 * Picks one mirror for the image and two others for the checksums.
 *
 * The two checksum mirrors must be on different hosts from the image mirror
 * *and* from each other. Where possible they are also in different countries,
 * because two mirrors run by the same organisation in the same building are not
 * two independent sources.
 */
function chooseMirrors() {
    const region = guessRegion();
    const tiers = REGION_ORDER[region] || REGION_ORDER.Europe;
    // Nearest tier first, randomised within each tier so load spreads and the
    // choice is not predictable from a page load.
    const ordered = tiers.flatMap(r => shuffle(MIRRORS.filter(m => m.region === r)));

    const image = ordered[0];
    const checks = [];
    for (const m of ordered) {
        if (hostOf(m.url) === hostOf(image.url)) continue;
        if (checks.some(c => hostOf(c.url) === hostOf(m.url))) continue;
        // Prefer a different country for the first checksum source.
        if (checks.length === 0 && m.cc === image.cc &&
            ordered.some(o => o.cc !== image.cc)) continue;
        checks.push(m);
        if (checks.length === 2) break;
    }
    return { region, image, checks };
}

/* ── Streaming SHA-256 ──────────────────────────────────────────────────────
   crypto.subtle.digest cannot stream: it wants the whole file as one
   ArrayBuffer, which for a 1.2 GB ISO means 1.2 GB resident and an out-of-memory
   failure on a phone. This is a plain implementation fed 8 MiB slices, so peak
   memory is the slice, not the file. Slower than native — expect roughly a
   minute for a full ISO — but it finishes on hardware where the native path
   would not start. */
const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

class Sha256 {
    constructor() {
        this.h = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ]);
        this.block = new Uint8Array(64);
        this.view = new DataView(this.block.buffer);
        this.fill = 0;
        this.bytes = 0;           // total length, for the length field
        this.w = new Uint32Array(64);
    }

    _compress(data, offset) {
        const w = this.w;
        for (let i = 0; i < 16; i++) {
            w[i] = (data[offset + i * 4] << 24) | (data[offset + i * 4 + 1] << 16) |
                   (data[offset + i * 4 + 2] << 8) | data[offset + i * 4 + 3];
        }
        for (let i = 16; i < 64; i++) {
            const x = w[i - 15], y = w[i - 2];
            const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
            const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let [a, b, c, d, e, f, g, h] = this.h;
        for (let i = 0; i < 64; i++) {
            const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
            const ch = (e & f) ^ (~e & g);
            const t1 = (h + S1 + ch + SHA256_K[i] + w[i]) | 0;
            const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0;
            d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        const H = this.h;
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0;
        H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    update(chunk) {
        this.bytes += chunk.length;
        let i = 0;

        if (this.fill > 0) {
            const need = 64 - this.fill;
            if (chunk.length < need) {
                this.block.set(chunk, this.fill);
                this.fill += chunk.length;
                return;
            }
            this.block.set(chunk.subarray(0, need), this.fill);
            this._compress(this.block, 0);
            this.fill = 0;
            i = need;
        }
        for (; i + 64 <= chunk.length; i += 64) this._compress(chunk, i);
        if (i < chunk.length) {
            this.block.set(chunk.subarray(i), 0);
            this.fill = chunk.length - i;
        }
    }

    hex() {
        // Pad: 0x80, zeros, then the length in bits as a 64-bit big-endian.
        const bitLen = this.bytes * 8;
        const tail = new Uint8Array(this.fill < 56 ? 64 : 128);
        tail.set(this.block.subarray(0, this.fill), 0);
        tail[this.fill] = 0x80;
        const dv = new DataView(tail.buffer);
        // Number is exact to 2^53, which is 1 PiB of input. Split anyway so the
        // high word is correct rather than accidentally zero.
        dv.setUint32(tail.length - 8, Math.floor(bitLen / 0x100000000), false);
        dv.setUint32(tail.length - 4, bitLen >>> 0, false);
        for (let i = 0; i < tail.length; i += 64) this._compress(tail, i);

        let out = '';
        for (let i = 0; i < 8; i++) out += this.h[i].toString(16).padStart(8, '0');
        return out;
    }
}

const CHUNK = 8 * 1024 * 1024;

/**
 * Hashes a File with SHA-256, reporting progress.
 * Reads through Blob.slice so peak memory is one chunk, not the whole file.
 */
async function hashFile(file, onProgress, shouldAbort) {
    const h = new Sha256();
    let read = 0;
    while (read < file.size) {
        if (shouldAbort && shouldAbort()) return null;
        const slice = file.slice(read, Math.min(read + CHUNK, file.size));
        const buf = new Uint8Array(await slice.arrayBuffer());
        h.update(buf);
        read += buf.length;
        onProgress(read, file.size);
        // Yield so the progress bar actually paints and the tab stays alive.
        await new Promise(r => setTimeout(r, 0));
    }
    return h.hex();
}

/* ── Checksum file parsing ───────────────────────────────────────────────── */

/**
 * Pulls `<64 hex>  <filename>` lines out of a pasted sha256sums.txt.
 * Tolerates the `*filename` binary marker and stray whitespace, and ignores
 * anything that is not a well-formed line rather than guessing.
 */
function parseSums(text) {
    const out = new Map();
    for (const raw of String(text).split(/\r?\n/)) {
        const m = raw.trim().match(/^([0-9a-fA-F]{64})\s+\*?(.+?)\s*$/);
        if (m) out.set(m[2], m[1].toLowerCase());
    }
    return out;
}

/** A bare 64-hex paste is also accepted — people often copy just the hash. */
function looseHash(text) {
    const m = String(text).trim().match(/\b([0-9a-fA-F]{64})\b/);
    return m ? m[1].toLowerCase() : null;
}

function lookup(text, filename) {
    const sums = parseSums(text);
    if (sums.has(filename)) return sums.get(filename);
    // Fall back to a unique .iso entry, then to any bare hash in the paste.
    const isos = [...sums.entries()].filter(([n]) => n.endsWith('.iso'));
    if (isos.length === 1) return isos[0][1];
    return looseHash(text);
}

/* ── UI ─────────────────────────────────────────────────────────────────── */

function el(id) { return document.getElementById(id); }

/* ── When the selected system is not Arch ────────────────────────────────────
   Everything below this point is Arch: Arch mirrors, Arch checksum files, an
   Arch signing key. The other three systems verify their images by genuinely
   different mechanisms — OpenBSD does not use GPG at all, it uses signify(1),
   an Ed25519 scheme with its own container format — so relabelling this page
   would produce instructions that are confidently wrong.

   So when another system is selected the Arch machinery is put away and the
   page says what it can and cannot do, with a link to that project's own
   verification instructions. A page that says "not covered yet" is worth more
   than one that checks the wrong thing and reports success.

   The exact filenames are deliberately not written out here. They change per
   release, and a stale filename in a security instruction is the kind of
   detail somebody works around by skipping the step. */
const OS_VERIFY = {
    gentoo: {
        how: 'Gentoo publishes a digest file alongside each installer image and ' +
             'a detached GPG signature over it, signed by the Gentoo release ' +
             'engineering key. Verify the signature on the digest file first, ' +
             'then check the image against the digest.',
        where: 'https://www.gentoo.org/downloads/',
        whereName: 'gentoo.org/downloads',
        keys: 'https://www.gentoo.org/downloads/signatures/',
        keysName: 'the Gentoo signature and key documentation'
    },
    freebsd: {
        how: 'FreeBSD publishes CHECKSUM files for each release and signs them ' +
             'with the FreeBSD release engineering GPG key. Verify the signature ' +
             'on the CHECKSUM file, then check the image against it.',
        where: 'https://download.freebsd.org/',
        whereName: 'download.freebsd.org',
        keys: 'https://docs.freebsd.org/en/books/handbook/mirrors/',
        keysName: 'the FreeBSD Handbook mirrors and keys chapter'
    },
    openbsd: {
        how: 'OpenBSD does not use GPG. It signs releases with signify(1), an ' +
             'Ed25519 scheme of its own: SHA256.sig holds the signature and the ' +
             'per-release public keys ship in /etc/signify on an installed ' +
             'system. There is no key to import and no gpg --verify step — the ' +
             'command is signify -C, run on a machine that has it.',
        where: 'https://www.openbsd.org/faq/faq4.html',
        whereName: 'the OpenBSD FAQ, section 4',
        keys: 'https://man.openbsd.org/signify',
        keysName: 'signify(1)'
    }
};

function applyIsoOs() {
    if (typeof window.targetOS !== 'function' || !window.OS_META) return;
    const id = window.targetOS();
    const m = window.OS_META[id];
    const isArch = id === 'arch';

    const named = isArch ? 'an Arch' : 'a ' + (m.short || m.label);
    const head = document.querySelector('.iso-head h1');
    if (head) head.textContent = '💿 Verify ' + named + ' image before you install it';
    // The tab title too: a tab reading "Verify an Arch ISO" while the page says
    // it cannot verify a Gentoo one is the sort of small contradiction that
    // makes a reader distrust the part that is correct.
    document.title = 'Verify ' + named + ' image — *nix Install Guides';

    // The Arch-only machinery. Hidden rather than disabled: a mirror picker for
    // Arch mirrors, sitting under a FreeBSD heading, is not made safe by being
    // greyed out.
    ['step-download', 'step-checksums', 'step-verify', 'step-gpg', 'step-write']
        .forEach(sid => { const s = el(sid); if (s) s.hidden = !isArch; });
    const tabs = document.querySelector('.arch-tabs');
    if (tabs) tabs.hidden = !isArch;
    const badge = el('iso-verified-badge');
    if (badge) badge.hidden = !isArch;

    let panel = el('iso-os-elsewhere');
    if (isArch) { if (panel) panel.remove(); return; }

    const spec = OS_VERIFY[id];
    if (!panel) {
        panel = document.createElement('section');
        panel.id = 'iso-os-elsewhere';
        panel.className = 'step warn';
        const main = document.querySelector('main');
        const iso = document.querySelector('.iso-head');
        if (main) main.insertBefore(panel, iso ? iso.nextSibling : main.firstChild);
    }
    panel.innerHTML = '';

    const h = (tag, text, style) => {
        const e = document.createElement(tag);
        if (text) e.textContent = text;
        if (style) e.setAttribute('style', style);
        return e;
    };

    panel.appendChild(h('h2', '🚧 This page cannot verify a ' + (m.short || m.label) +
                              ' image for you'));
    panel.appendChild(h('p',
        'The in-browser verifier is built around Arch: Arch mirrors, Arch checksum ' +
        'files and an Arch signing key. ' + m.label + ' verifies its images by a ' +
        'different mechanism, and running the Arch checks against a ' +
        (m.short || m.label) + ' image would either fail for the wrong reason or, ' +
        'worse, appear to pass. So it is not offered here yet.'));
    panel.appendChild(h('p', spec.how));

    const links = document.createElement('p');
    links.appendChild(document.createTextNode('Download and verification instructions: '));
    const a1 = document.createElement('a');
    a1.href = spec.where; a1.target = '_blank'; a1.rel = 'noopener';
    a1.textContent = spec.whereName;
    links.appendChild(a1);
    links.appendChild(document.createTextNode(' · '));
    const a2 = document.createElement('a');
    a2.href = spec.keys; a2.target = '_blank'; a2.rel = 'noopener';
    a2.textContent = spec.keysName;
    links.appendChild(a2);
    panel.appendChild(links);

    panel.appendChild(h('p',
        'Verifying an Arch image is still available — switch the system in the ' +
        'top-left corner back to Arch Linux and this page becomes the Arch ' +
        'verifier again.', 'font-size:0.85rem;color:var(--fg-dim);'));
}

document.addEventListener('unix:os-changed', applyIsoOs);

function setStatus(node, kind, html) {
    node.className = 'verdict verdict-' + kind;
    node.innerHTML = html;
    node.hidden = false;
}

/* Switch the page between the x86_64 ISO and the Arch Linux ARM tarballs.
   The hashing engine below is architecture-agnostic — a SHA-256 of a file is a
   SHA-256 of a file — so only the sourcing advice, the download links and the
   default filename change. */
function applyArch(arch, picked) {
    const arm = arch === 'aarch64';
    const armBox = el('arm-notice');
    const x86Steps = document.querySelectorAll('[data-arch="x86_64"]');

    x86Steps.forEach(n => { n.hidden = arm; });
    if (armBox) armBox.hidden = !arm;

    document.querySelectorAll('.arch-tab').forEach(b => {
        const on = b.getAttribute('data-value') === arch;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
    });

    const nameBox = el('iso-name');
    const dlIso = el('dl-iso');
    const dlSig = el('dl-sig');
    const dlDir = el('dl-dir');

    if (arm) {
        const board = ALARM_BOARDS.find(b => b.id === (el('arm-board') || {}).value)
                    || ALARM_BOARDS[0];
        if (nameBox) nameBox.value = board.file;
        if (dlIso) { dlIso.href = ALARM_BASE + board.file; dlIso.textContent = '⬇️ Download the rootfs tarball'; }
        if (dlSig) { dlSig.href = ALARM_BASE + board.file + '.sig'; }
        if (dlDir) { dlDir.href = ALARM_BASE; }
        const armFpr = el('arm-fpr');
        if (armFpr) armFpr.textContent = ALARM_KEY_FPR;
    } else {
        const imgBase = picked.image.url.replace(/\/$/, '');
        if (nameBox) nameBox.value = `archlinux-${KNOWN_RELEASE}-x86_64.iso`;
        if (dlIso) { dlIso.href = `${imgBase}/iso/latest/archlinux-x86_64.iso`; dlIso.textContent = '⬇️ Download the ISO'; }
        if (dlSig) { dlSig.href = `${imgBase}/iso/latest/archlinux-x86_64.iso.sig`; }
        if (dlDir) { dlDir.href = `${imgBase}/iso/latest/`; }
    }

    try {
        const u = new URL(location.href);
        u.searchParams.set('arch', arch);
        history.replaceState(null, '', u);
    } catch (_) { /* file:// — not important */ }
}

document.addEventListener('DOMContentLoaded', () => {
    const picked = chooseMirrors();
    const isoName = `archlinux-${KNOWN_RELEASE}-x86_64.iso`;

    el('region-guess').textContent = picked.region;
    el('fpr').textContent = ARCH_SIGNING_FPR;

    /* Architecture tabs. The guides support aarch64, so the verifier must too —
       otherwise someone following the ARM path has nothing to check their
       download against. */
    const boardSel = el('arm-board');
    if (boardSel) {
        ALARM_BOARDS.forEach(b => {
            const o = document.createElement('option');
            o.value = b.id;
            o.textContent = b.label;
            boardSel.appendChild(o);
        });
        boardSel.addEventListener('change', () => applyArch('aarch64', picked));
    }
    document.querySelectorAll('.arch-tab').forEach(btn => {
        btn.addEventListener('click', () => applyArch(btn.getAttribute('data-value'), picked));
    });

    /* Step 1 — the image mirror, with the download startable from here.
       The browser fetches straight from the mirror; nothing routes through this
       site, which has no server to route it through. A cross-origin `download`
       attribute is ignored by every engine, so the file keeps the mirror's
       name — which is what you want, since that name is what the checksum list
       refers to. */
    const imgBase = picked.image.url.replace(/\/$/, '');
    const imgLink = el('image-mirror-link');
    imgLink.href = `${imgBase}/iso/latest/`;
    imgLink.textContent = hostOf(picked.image.url);
    el('image-mirror-country').textContent = picked.image.country;


    /* Step 2 — checksum mirrors, deliberately not the image mirror. */
    const list = el('checksum-mirrors');
    list.innerHTML = '';
    picked.checks.forEach((m, i) => {
        const base = m.url.replace(/\/$/, '');
        const li = document.createElement('li');
        li.innerHTML =
            `<strong>Source ${i + 1}</strong> — ${m.country} ` +
            `(<code>${hostOf(m.url)}</code>)<br>` +
            `<a href="${base}/iso/latest/sha256sums.txt" target="_blank" rel="noopener">sha256sums.txt</a> · ` +
            `<a href="${base}/iso/latest/b2sums.txt" target="_blank" rel="noopener">b2sums.txt</a> · ` +
            `<a href="${base}/iso/latest/" target="_blank" rel="noopener">directory (for the .sig)</a>`;
        list.appendChild(li);
    });

    el('reshuffle').addEventListener('click', () => location.reload());

    /* Step 3 — hash the local file. */
    const fileInput = el('iso-file');
    const drop = el('dropzone');
    const bar = el('progress-bar');
    const barWrap = el('progress-wrap');
    const progressText = el('progress-text');
    const hashOut = el('hash-out');
    const verdict = el('verdict');
    const cancelBtn = el('cancel-hash');

    let aborted = false;
    let running = false;
    let computed = null;
    let chosenName = isoName;

    el('iso-name').value = isoName;

    function compare() {
        if (!computed) return;
        const want = el('iso-name').value.trim() || chosenName;
        const a = lookup(el('sums-a').value, want);
        const b = lookup(el('sums-b').value, want);

        if (!a && !b) {
            setStatus(verdict, 'info',
                '<strong>Hash computed.</strong> Paste the checksum from both ' +
                'mirrors above and this will compare all three.');
            return;
        }
        if (!a || !b) {
            setStatus(verdict, 'warn',
                '<strong>Only one checksum source so far.</strong> ' +
                'One source is not enough: a host that serves you a modified ' +
                'image can serve a checksum that matches it. Paste the other ' +
                'mirror too.');
            return;
        }
        if (a !== b) {
            setStatus(verdict, 'bad',
                '<strong>STOP. The two mirrors disagree with each other.</strong><br>' +
                `Source 1: <code>${a}</code><br>Source 2: <code>${b}</code><br>` +
                'Do not install this image. Two independent mirrors publishing ' +
                'different checksums for the same file means at least one of ' +
                'them is serving something it should not be. Try two other ' +
                'mirrors, and if it persists, report it on the Arch forums.');
            return;
        }
        if (a !== computed) {
            setStatus(verdict, 'bad',
                '<strong>MISMATCH. Do not install this ISO.</strong><br>' +
                `Both mirrors say: <code>${a}</code><br>` +
                `Your file is:     <code>${computed}</code><br>` +
                'The file you have is not the file Arch published. It may be a ' +
                'truncated or corrupted download — re-download and check again ' +
                'before assuming the worst — but do not boot it either way. ' +
                'Check the filename above matches the release you downloaded.');
            return;
        }
        setStatus(verdict, 'good',
            '<strong>Verified.</strong> Your file matches the checksum published ' +
            'by two independent mirrors.<br><code>' + computed + '</code><br><br>' +
            'This proves the file is byte-for-byte what those mirrors serve. It ' +
            'does not prove Arch published it — for that, check the GPG ' +
            'signature in step 4. Do that too.');
        // Lights the tick on the header control, for this session only.
        if (typeof window.markIsoVerified === 'function') window.markIsoVerified();
    }

    async function start(file) {
        if (running) return;
        running = true;
        aborted = false;
        computed = null;
        chosenName = file.name;
        if (/\.iso$/i.test(file.name)) el('iso-name').value = file.name;

        hashOut.textContent = '';
        verdict.hidden = true;
        barWrap.hidden = false;
        cancelBtn.hidden = false;
        bar.style.width = '0%';

        const t0 = performance.now();
        const hex = await hashFile(
            file,
            (done, total) => {
                const pct = (done / total) * 100;
                bar.style.width = pct.toFixed(1) + '%';
                bar.setAttribute('aria-valuenow', pct.toFixed(0));
                progressText.textContent =
                    `${(done / 1048576).toFixed(0)} / ${(total / 1048576).toFixed(0)} MiB ` +
                    `(${pct.toFixed(1)}%)`;
            },
            () => aborted
        );

        running = false;
        cancelBtn.hidden = true;

        if (hex === null) {
            progressText.textContent = 'Cancelled.';
            return;
        }
        const secs = ((performance.now() - t0) / 1000).toFixed(1);
        computed = hex;
        progressText.textContent = `Done in ${secs}s.`;
        hashOut.textContent = hex;
        compare();
    }

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) start(fileInput.files[0]);
    });

    cancelBtn.addEventListener('click', () => { aborted = true; });

    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault();
        drop.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault();
        drop.classList.remove('dragging');
    }));
    drop.addEventListener('drop', e => {
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) start(f);
    });
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });

    ['sums-a', 'sums-b', 'iso-name'].forEach(id =>
        el(id).addEventListener('input', compare));

    // Honour ?arch= so an ARM user can be linked straight to the right mode.
    let wantArch = 'x86_64';
    try {
        const q = new URL(location.href).searchParams.get('arch');
        if (q === 'aarch64' || q === 'x86_64') wantArch = q;
    } catch (_) { /* ignore */ }
    applyArch(wantArch, picked);

    // Last, so it can put away anything the Arch setup above just built.
    applyIsoOs();
});
