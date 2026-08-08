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
/* The mirror pool follows the selected system. Everything downstream — the
   image host, the two independent checksum hosts, the reshuffle button — works
   the same way on every system; only the list it draws from changes. */
function activeMirrors() {
    const { spec } = isoSpec();
    return (spec.mirrors && spec.mirrors.length) ? spec.mirrors : MIRRORS;
}

function chooseMirrors() {
    const region = guessRegion();
    const tiers = REGION_ORDER[region] || REGION_ORDER.Europe;
    // Nearest tier first, randomised within each tier so load spreads and the
    // choice is not predictable from a page load.
    const pool = activeMirrors();
    const ordered = tiers.flatMap(r => shuffle(pool.filter(m => m.region === r)));
    // A system with a single official host has no regional spread to sort;
    // fall back to the whole pool rather than producing an empty list.
    if (!ordered.length) ordered.push(...pool);

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

/* -- Every system, verified the same way ------------------------------------
   This page used to be Arch-only, and briefly told anyone on another system
   that it could not help them. That was the wrong answer: the mechanic here is
   not Arch-specific at all. It is

     1. hash the image locally, in the browser, so the file never moves;
     2. take the published checksum from mirrors OTHER than the one that served
        the image, so a single dishonest operator cannot supply a matching pair;
     3. check the signature over the checksum file, with the key fingerprint
        pinned here rather than taken from whatever the download host offers.

   All of that generalises. What differs per system is the mirror list, the file
   names, the hash, and how the signature is made -- and those are data, so they
   live in a table.

   The one genuine divergence is stated rather than papered over: OpenBSD does
   not use GPG. It signs with signify(1), an Ed25519 scheme of its own, so the
   command and the key are different in kind, not merely in name. Raspberry Pi
   OS is the other: one official host and no detached signature at all.

   Mirror lists come from each project's own published list. They are hardcoded
   because none of these hosts send CORS headers, so a static page cannot read
   their mirror JSON -- a dead entry here is a broken link, not a security
   problem. */

const OS_IMAGES = {
    arch: {
        release: KNOWN_RELEASE,
        mirrors: MIRRORS,
        dir: 'iso/latest/',
        image: 'archlinux-x86_64.iso',
        localName: 'archlinux-' + KNOWN_RELEASE + '-x86_64.iso',
        sums: 'sha256sums.txt',
        algo: 'SHA-256',
        sigFile: 'archlinux-x86_64.iso.sig',
        sigKind: 'gpg',
        fpr: ARCH_SIGNING_FPR,
        verifyCmd: 'gpg --verify archlinux-x86_64.iso.sig archlinux-x86_64.iso',
        sumsCmd: 'sha256sum -c sha256sums.txt --ignore-missing',
        downloadPage: 'https://archlinux.org/download/',
        docs: 'https://wiki.archlinux.org/title/Installation_guide'
    },

    gentoo: {
        /* Gentoo publishes a rolling "current" directory rather than a dated
           release, so the file name carries a timestamp that changes weekly.
           Read the exact name from the listing; a stale one hardcoded here
           would simply 404. */
        release: 'current',
        mirrors: [
            { url: 'https://distfiles.gentoo.org/',                        cc: 'XX', country: 'Gentoo master',  region: 'Global' },
            { url: 'https://mirror.leaseweb.com/gentoo/',                  cc: 'NL', country: 'Netherlands',    region: 'Europe' },
            { url: 'https://ftp.fau.de/gentoo/',                           cc: 'DE', country: 'Germany',        region: 'Europe' },
            { url: 'https://mirrors.kernel.org/gentoo/',                   cc: 'US', country: 'United States',  region: 'Americas' },
            { url: 'https://gentoo.osuosl.org/',                           cc: 'US', country: 'United States',  region: 'Americas' },
            { url: 'https://mirror.csclub.uwaterloo.ca/gentoo-distfiles/',  cc: 'CA', country: 'Canada',         region: 'Americas' },
            { url: 'https://mirrors.mit.edu/gentoo-distfiles/',            cc: 'US', country: 'United States',  region: 'Americas' },
            { url: 'https://mirror.aarnet.edu.au/pub/gentoo/',             cc: 'AU', country: 'Australia',      region: 'Oceania' },
            { url: 'https://ftp.jaist.ac.jp/pub/Linux/Gentoo/',            cc: 'JP', country: 'Japan',          region: 'Asia' }
        ],
        dir: 'releases/amd64/autobuilds/current-install-amd64-minimal/',
        image: null,
        localName: 'install-amd64-minimal-<timestamp>.iso',
        sums: 'install-amd64-minimal-<timestamp>.iso.sha256',
        algo: 'SHA-256',
        sigFile: 'install-amd64-minimal-<timestamp>.iso.asc',
        sigKind: 'gpg',
        fpr: '13EB BDBE DE7A 1277 5DFD  B1BA BB57 2E0E 2D18 2910',
        recvKey: 'gpg --keyserver hkps://keys.gentoo.org --recv-keys 13EBBDBEDE7A12775DFDB1BABB572E0E2D182910',
        verifyCmd: 'gpg --verify install-amd64-minimal-<timestamp>.iso.asc',
        sumsCmd: 'sha256sum -c install-amd64-minimal-<timestamp>.iso.sha256',
        note: 'Gentoo signs the digest file, so verifying that signature and then ' +
              'checking the image against the digest covers both steps. The ' +
              'timestamp changes with every weekly build, so take the exact file ' +
              'name from the directory listing rather than typing it from memory.',
        downloadPage: 'https://www.gentoo.org/downloads/',
        docs: 'https://wiki.gentoo.org/wiki/Handbook:AMD64'
    },

    freebsd: {
        release: '14.4',
        mirrors: [
            { url: 'https://download.freebsd.org/',            cc: 'XX', country: 'FreeBSD CDN',     region: 'Global' },
            { url: 'https://ftp.freebsd.org/pub/FreeBSD/',     cc: 'US', country: 'United States',   region: 'Americas' },
            { url: 'https://ftp2.de.freebsd.org/pub/FreeBSD/', cc: 'DE', country: 'Germany',         region: 'Europe' },
            { url: 'https://ftp.uk.freebsd.org/pub/FreeBSD/',  cc: 'GB', country: 'United Kingdom',  region: 'Europe' },
            { url: 'https://ftp.nl.freebsd.org/pub/FreeBSD/',  cc: 'NL', country: 'Netherlands',     region: 'Europe' },
            { url: 'https://ftp.jp.freebsd.org/pub/FreeBSD/',  cc: 'JP', country: 'Japan',           region: 'Asia' },
            { url: 'https://ftp.au.freebsd.org/pub/FreeBSD/',  cc: 'AU', country: 'Australia',       region: 'Oceania' }
        ],
        dir: 'releases/amd64/amd64/ISO-IMAGES/14.4/',
        image: 'FreeBSD-14.4-RELEASE-amd64-disc1.iso.xz',
        localName: 'FreeBSD-14.4-RELEASE-amd64-disc1.iso.xz',
        sums: 'CHECKSUM.SHA256-FreeBSD-14.4-RELEASE-amd64',
        algo: 'SHA-256',
        sigFile: 'CHECKSUM.SHA256-FreeBSD-14.4-RELEASE-amd64.asc',
        sigKind: 'gpg',
        /* Deliberately not a fingerprint written from memory. FreeBSD publishes
           its release-engineering keys in the Handbook appendix, and a wrong
           fingerprint printed with authority is worse than none at all. */
        fpr: null,
        keyPage: 'https://docs.freebsd.org/en/books/handbook/pgpkeys/',
        verifyCmd: 'gpg --verify CHECKSUM.SHA256-FreeBSD-14.4-RELEASE-amd64.asc',
        sumsCmd: 'sha256 -c <hash> FreeBSD-14.4-RELEASE-amd64-disc1.iso.xz',
        note: 'Releases 14.3, 15.0 and 15.1 sit beside 14.4 under ISO-IMAGES and ' +
              'follow the same naming with the version changed. Take the release ' +
              'engineering key fingerprint from the Handbook appendix linked below ' +
              'rather than from any download page.',
        downloadPage: 'https://www.freebsd.org/where/',
        docs: 'https://docs.freebsd.org/en/books/handbook/'
    },

    openbsd: {
        release: '7.9',
        mirrors: [
            { url: 'https://cdn.openbsd.org/pub/OpenBSD/',       cc: 'XX', country: 'OpenBSD CDN',     region: 'Global' },
            { url: 'https://ftp.openbsd.org/pub/OpenBSD/',       cc: 'CA', country: 'Canada',          region: 'Americas' },
            { url: 'https://mirrors.sonic.net/pub/OpenBSD/',     cc: 'US', country: 'United States',   region: 'Americas' },
            { url: 'https://ftp.nluug.nl/pub/OpenBSD/',          cc: 'NL', country: 'Netherlands',     region: 'Europe' },
            { url: 'https://ftp.spline.de/pub/OpenBSD/',         cc: 'DE', country: 'Germany',         region: 'Europe' },
            { url: 'https://www.mirrorservice.org/pub/OpenBSD/', cc: 'GB', country: 'United Kingdom',  region: 'Europe' },
            { url: 'https://mirrors.dotsrc.org/pub/OpenBSD/',    cc: 'DK', country: 'Denmark',         region: 'Europe' },
            { url: 'https://ftp.icm.edu.pl/pub/OpenBSD/',        cc: 'PL', country: 'Poland',          region: 'Europe' },
            { url: 'https://ftp.jaist.ac.jp/pub/OpenBSD/',       cc: 'JP', country: 'Japan',           region: 'Asia' },
            { url: 'https://mirror.aarnet.edu.au/pub/OpenBSD/',  cc: 'AU', country: 'Australia',       region: 'Oceania' }
        ],
        dir: '7.9/amd64/',
        image: 'install79.iso',
        localName: 'install79.iso',
        sums: 'SHA256',
        algo: 'SHA-256',
        sigFile: 'SHA256.sig',
        sigKind: 'signify',
        fpr: null,
        keyFile: '/etc/signify/openbsd-79-base.pub',
        verifyCmd: 'signify -Cp /etc/signify/openbsd-79-base.pub -x SHA256.sig install79.iso',
        sumsCmd: 'sha256 -C SHA256 install79.iso',
        note: 'OpenBSD does not use GPG anywhere in this path. signify(1) is ' +
              'Ed25519 with its own container format, the key is a file that ships ' +
              'in /etc/signify on an installed system rather than something you ' +
              'fetch from a keyserver, and signify -C checks the image against the ' +
              'signed SHA256 list in a single step. A signify package on another ' +
              'operating system may not carry the key.',
        downloadPage: 'https://www.openbsd.org/faq/faq4.html',
        docs: 'https://www.openbsd.org/faq/'
    },

    raspios: {
        release: 'current',
        /* One official host, and that is the honest position rather than a
           shortcoming to hide. Raspberry Pi runs no mirror network for OS images
           and publishes no detached signature, so the two-source rule this page
           is built on cannot be applied. Saying so is the point: checking a hash
           against the same host that served the image proves the download
           completed, and nothing more. */
        mirrors: [
            { url: 'https://downloads.raspberrypi.com/', cc: 'XX',
              country: 'Raspberry Pi (official, single host)', region: 'Global' }
        ],
        dir: 'raspios_arm64/images/',
        image: null,
        localName: '<date>-raspios-<release>-arm64.img.xz',
        sums: null,
        algo: 'SHA-256',
        sigFile: null,
        sigKind: 'none',
        fpr: null,
        verifyCmd: null,
        sumsCmd: 'sha256sum <date>-raspios-<release>-arm64.img.xz',
        singleSource: true,
        note: 'Raspberry Pi publishes the SHA-256 for each image on its software ' +
              'page, labelled "SHA256 file integrity hash", and publishes no ' +
              'signature. There is also only one official host, so the checksum ' +
              'cannot be taken from an independent source the way it can for every ' +
              'other system here. Raspberry Pi Imager downloads and writes the image ' +
              'and verifies what it wrote to the card, which is a different ' +
              'guarantee from verifying the publisher.',
        downloadPage: 'https://www.raspberrypi.com/software/operating-systems/',
        docs: 'https://www.raspberrypi.com/documentation/'
    }
};

/** The spec for whichever system is selected. Always resolves to something. */
let lastPick = null;

function isoSpec() {
    const id = (typeof window.targetOS === 'function') ? window.targetOS() : 'arch';
    return { id: id, spec: OS_IMAGES[id] || OS_IMAGES.arch };
}

function applyIsoOs() {
    if (typeof window.targetOS !== 'function' || !window.OS_META) return;
    const { id, spec } = isoSpec();
    const m = window.OS_META[id];
    const isArch = id === 'arch';

    // "a OpenBSD" reads wrong. The article follows the sound of the name, not
    // a rule about the letter, so it is chosen from the actual set of names.
    const VOWEL_SOUND = /^(a|e|i|o|u|Arch|OpenBSD)/;
    const short = m.short || m.label;
    const named = (VOWEL_SOUND.test(short) ? 'an ' : 'a ') + short;
    const head = document.querySelector('.iso-head h1');
    const noun = m.media === 'ISO' ? 'ISO' : 'image';
    if (head) head.textContent = '💿 Verify ' + named + ' ' + noun + ' before you install it';
    document.title = 'Verify ' + named + ' ' + noun + ' — *nix Install Guides';

    /* The architecture tabs are Arch's own: x86_64 against Arch Linux ARM, which
       is a separate project with separate mirrors and its own signing key. No
       other system here splits that way, so the tabs belong to Arch alone. */
    const tabs = document.querySelector('.arch-tabs');
    if (tabs) tabs.hidden = !isArch;
    const armBox = el('arm-notice');
    if (armBox && !isArch) armBox.hidden = true;
    document.querySelectorAll('[data-arch="x86_64"]').forEach(n => { if (!isArch) n.hidden = false; });

    // Every step stays on for every system — this page verifies all of them now.
    ['step-download', 'step-checksums', 'step-verify', 'step-write']
        .forEach(sid => { const s = el(sid); if (s) s.hidden = false; });

    /* The signature step differs in kind, not only in wording: GPG for three
       systems, signify for OpenBSD, and nothing published for Raspberry Pi OS.
       Hidden only in the last case, because there is no signature to check. */
    const gpgStep = el('step-gpg');
    if (gpgStep) gpgStep.hidden = spec.sigKind === 'none';

    const badge = el('iso-verified-badge');
    if (badge) {
        badge.hidden = false;
        const img = badge.querySelector('img');
        if (img) img.src = 'img/icons/' + m.slug + '-64.png';
    }

    // The file name the reader is checking, and where it comes from.
    const nameBox = el('iso-name');
    if (nameBox && !isArch) nameBox.value = spec.localName;

    const base = (spec.mirrors[0] || {}).url || '';
    const dirUrl = base.replace(/\/$/, '') + '/' + spec.dir;
    if (!isArch) {
        const dlIso = el('dl-iso');
        const dlSig = el('dl-sig');
        const dlDir = el('dl-dir');
        if (dlIso) {
            dlIso.href = spec.image ? dirUrl + spec.image : dirUrl;
            dlIso.textContent = spec.image ? '⬇️ Download the image' : '⬇️ Open the image directory';
        }
        if (dlSig) {
            dlSig.hidden = !spec.sigFile;
            if (spec.sigFile) dlSig.href = dirUrl + spec.sigFile;
        }
        if (dlDir) dlDir.href = dirUrl;
    }

    // The signing key, stated for whichever mechanism this system uses.
    const fprBox = el('fpr');
    if (fprBox) {
        if (spec.fpr) fprBox.textContent = spec.fpr;
        else if (spec.keyFile) fprBox.textContent = spec.keyFile;
        else fprBox.textContent = 'published by the project — see the link below';
    }

    renderIsoOsPanel(id, spec, m);
    renderMirrorPanels();
}

/* What this system publishes, what to run, and where its documentation says so.
   Built rather than written into the HTML because it changes with the switcher,
   and a stale copy in the markup is how a page ends up describing one system
   while verifying another. */
/* Steps 1 and 2: which host serves the image, and which two independent hosts
   the checksums come from. Rebuilt on every system change rather than once on
   load — they were rendered from Arch's mirror list at startup, so choosing
   FreeBSD relabelled the page around links that still pointed into an Arch
   mirror's iso/latest directory.

   The image host and the checksum hosts are drawn from the same shuffled pool
   and are always different entries: that separation is the whole point of the
   page, and it holds for every system that has more than one host. */
function renderMirrorPanels() {
    const { spec } = isoSpec();
    const picked = chooseMirrors();
    lastPick = picked;

    const regionBox = el('region-guess');
    if (regionBox) regionBox.textContent = picked.region;

    const imgBase = picked.image.url.replace(/\/$/, '') + '/' + spec.dir;
    const imgLink = el('image-mirror-link');
    if (imgLink) {
        imgLink.href = imgBase;
        imgLink.textContent = hostOf(picked.image.url);
    }
    const country = el('image-mirror-country');
    if (country) country.textContent = picked.image.country;

    const list = el('checksum-mirrors');
    if (!list) return;
    list.innerHTML = '';

    if (spec.singleSource) {
        const li = document.createElement('li');
        li.innerHTML =
            '<strong>Only one official source.</strong> ' +
            hostOf(spec.mirrors[0].url) +
            ' is the single host for these images, so there is no second, ' +
            'independent place to take the checksum from. See the note above.';
        list.appendChild(li);
        return;
    }

    picked.checks.forEach((mir, i) => {
        const base = mir.url.replace(/\/$/, '') + '/' + spec.dir;
        const li = document.createElement('li');
        const sums = spec.sums
            ? `<a href="${base}${spec.sums}" target="_blank" rel="noopener">${spec.sums}</a> · ` : '';
        const sig = spec.sigFile
            ? `<a href="${base}${spec.sigFile}" target="_blank" rel="noopener">${spec.sigFile}</a> · ` : '';
        li.innerHTML =
            `<strong>Source ${i + 1}</strong> — ${mir.country} ` +
            `(<code>${hostOf(mir.url)}</code>)<br>` + sums + sig +
            `<a href="${base}" target="_blank" rel="noopener">directory listing</a>`;
        list.appendChild(li);
    });
}

function renderIsoOsPanel(id, spec, m) {
    let panel = el('iso-os-detail');
    if (!panel) {
        panel = document.createElement('section');
        panel.id = 'iso-os-detail';
        panel.className = 'step';
        const main = document.querySelector('main');
        const anchor = el('step-download');
        if (main && anchor) main.insertBefore(panel, anchor);
        else if (main) main.appendChild(panel);
    }
    panel.className = 'step' + (spec.singleSource ? ' warn' : '');
    panel.innerHTML = '';

    const h = (tag, text, cls) => {
        const e = document.createElement(tag);
        if (text) e.textContent = text;
        if (cls) e.className = cls;
        return e;
    };
    const row = (k, v) => {
        if (!v) return null;
        const p = document.createElement('p');
        p.style.margin = '0.25rem 0';
        p.appendChild(h('strong', k + ': '));
        const code = document.createElement('code');
        code.textContent = v;
        p.appendChild(code);
        return p;
    };

    panel.appendChild(h('h2', 'What ' + m.label + ' publishes'));

    [
        row('Image', spec.localName),
        row('Checksums', spec.sums),
        row('Hash', spec.algo),
        row('Signature', spec.sigFile ||
            (spec.sigKind === 'none' ? 'none published' : null)),
        row('Signed with', spec.sigKind === 'gpg' ? 'GPG'
            : spec.sigKind === 'signify' ? 'signify(1) — Ed25519, not GPG' : null),
        row('Check the checksum', spec.sumsCmd),
        row('Check the signature', spec.verifyCmd),
        row('Fetch the key', spec.recvKey)
    ].forEach(n => { if (n) panel.appendChild(n); });

    if (spec.note) {
        const note = h('p', spec.note);
        note.style.cssText = 'margin-top:0.8rem; line-height:1.6;';
        panel.appendChild(note);
    }

    if (spec.singleSource) {
        const warn = h('p');
        warn.style.cssText = 'margin-top:0.8rem; color:var(--accent-orange); line-height:1.6;';
        warn.appendChild(h('strong', 'The two-source rule cannot apply here. '));
        warn.appendChild(document.createTextNode(
            'Every other system on this page lets you take the checksum from a host ' +
            'other than the one that served the image. This one does not, so a match ' +
            'tells you the download is intact — not that the download was genuine.'));
        panel.appendChild(warn);
    }

    const links = document.createElement('p');
    links.style.cssText = 'margin-top:0.8rem; font-size:0.85rem;';
    const a = (href, text) => {
        const e = document.createElement('a');
        e.href = href; e.target = '_blank'; e.rel = 'noopener'; e.textContent = text;
        return e;
    };
    links.appendChild(document.createTextNode('Official: '));
    links.appendChild(a(spec.downloadPage, 'downloads'));
    links.appendChild(document.createTextNode(' · '));
    links.appendChild(a(spec.docs, m.docsName || 'documentation'));
    if (spec.keyPage) {
        links.appendChild(document.createTextNode(' · '));
        links.appendChild(a(spec.keyPage, 'signing keys'));
    }
    panel.appendChild(links);
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
        // lastPick, not the load-time selection: the pool is reshuffled on
        // every system change, so the argument captured at page load goes stale.
        const imgBase = (lastPick || picked).image.url.replace(/\/$/, '');
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

    renderMirrorPanels();

    /* Reshuffle in place rather than reloading. Pressing it repeatedly is the
       point — watching the hosts actually change is what makes the two-source
       rule believable — and a full reload threw away a hash already computed. */
    el('reshuffle').addEventListener('click', renderMirrorPanels);

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
