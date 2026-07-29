// legal.js — Onboarding: Welcome + Comprehensive Legal Disclaimer
// Uses localStorage only. No cookies. No tracking.
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const LEGAL_KEY   = 'legal_accepted';
  const WELCOME_KEY = 'welcome_seen';
  // Session-scoped acceptance. "I Agree" alone used to set nothing, so agreeing
  // and then navigating anywhere — including via the chooser's own "take me to
  // the index" link — showed the modal again on the next page, with no way out
  // short of ticking "don't show again". Agreeing now holds for the session;
  // "don't show again" is what makes it persist across sessions.
  const SESSION_KEY = 'legal_accepted_session';

  function sessionAccepted() {
    try { return sessionStorage.getItem(SESSION_KEY) === 'true'; }
    catch (_) { return false; }
  }
  function markSessionAccepted() {
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (_) { /* private mode */ }
  }

  const legalDone   = localStorage.getItem(LEGAL_KEY) === 'true';
  const welcomeDone = localStorage.getItem(WELCOME_KEY) === 'true';

  if ((legalDone && welcomeDone) || sessionAccepted()) return;

  // ─── Overlay & modal factory ────────────────────────────────────────────────
  function makeOverlay() {
    const ov = document.createElement('div');
    Object.assign(ov.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'rgba(13,17,23,0.92)',
      zIndex: '10000', display: 'flex', justifyContent: 'center',
      alignItems: 'flex-start', paddingTop: '4vh', paddingBottom: '4vh', overflowY: 'auto',
      backdropFilter: 'blur(6px)', boxSizing: 'border-box'
    });
    return ov;
  }

  function makeModal() {
    const m = document.createElement('div');
    Object.assign(m.style, {
      background: 'var(--bg-color,#1a1b26)',
      border: '1px solid var(--accent-red,#f7768e)',
      padding: '2.5rem',
      maxWidth: '660px', width: '92%',
      borderRadius: '14px',
      textAlign: 'left',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      maxHeight: '90vh', overflowY: 'auto',
      fontFamily: "'Inter','Fira Code',Consolas,sans-serif",
      color: 'var(--fg-color,#a9b1d6)',
      fontSize: '0.9rem', lineHeight: '1.6',
    });
    return m;
  }

  // ─── Main waiver modal ───────────────────────────────────────────────────────
  function showWaiver() {
    const overlay = makeOverlay();
    const modal   = makeModal();

    modal.innerHTML = `
      <!-- Welcome Header -->
      <div style="text-align:center; margin-bottom:1.75rem;">
        <div style="font-size:2.4rem; margin-bottom:0.6rem;">🦀🛡️</div>
        <h2 style="color:var(--accent-cyan,#7dcfff); margin:0; font-size:1.55rem; letter-spacing:0.5px; font-weight:800;">
          Welcome to Arch Guides Dynamic
        </h2>
        <p style="color:#8b949e; font-size:0.82rem; margin:0.5rem 0 0;">
          by <a href="https://github.com/tilas01" target="_blank" style="color:var(--accent-purple,#bb9af7); text-decoration:none;">tilas01</a>
          &nbsp;·&nbsp; Secure. Libre. Modular. Open Source.
        </p>
      </div>

      <!-- Blurb -->
      <div style="background:var(--bg-lighter,#24283b); border-radius:10px; padding:1rem 1.2rem; margin-bottom:1.5rem; font-size:0.85rem; line-height:1.65;">
        <p style="margin:0 0 0.7rem;">
          <strong style="color:var(--accent-green,#9ece6a);">Start by verifying your ISO.</strong>
          That comes before everything else, and the
          <a href="iso-verify.html" style="color:var(--accent-green,#9ece6a);">Verify Arch ISO</a>
          page does it in your browser — the file never leaves your machine, and the
          checksum is taken from mirrors other than the one that served the image, so
          a host that lies about the image cannot also hand you a matching checksum.
        </p>
        <p style="margin:0 0 0.7rem;">
          Then pick whichever suits you. All three cover the same options and produce
          the same install:
        </p>
        <ul style="margin:0 0 0.7rem 1.1rem; padding:0;">
          <li><a href="manual.html" style="color:var(--accent-purple,#bb9af7);"><strong>Manual walkthrough</strong></a>
              — one question at a time, each explaining what it does and what it costs,
              with the guide building itself as you answer. <em>Recommended on a phone.</em></li>
          <li><a href="index.html" style="color:var(--accent-blue,#7aa2f7);"><strong>Generator</strong></a>
              — one form, every option at once, straight to a script and a guide.
              <em>Fastest on a desktop when you already know what you want.</em></li>
          <li><a href="wiki.html" style="color:var(--accent-cyan,#7dcfff);"><strong>Wiki</strong></a>
              — the same install written out longhand, with the decision points as
              branches you choose between. Also in the repository as markdown.</li>
        </ul>
        <p style="margin:0;">
          <a href="site-index.html" style="color:var(--accent-cyan,#7dcfff);"><strong>Index</strong></a>
          searches all of it at once. The
          <a href="security-tools.html" style="color:var(--accent-red,#f7768e);"><strong>security tools</strong></a>
          are optional and several can lock you out — read what each does first.
          Hover, or tap, any labelled element for an explanation; the
          <strong>ℹ️</strong> button top right turns those off and back on.
        </p>
      </div>

      <!-- Legal Disclaimer -->
      <div style="border-top:1px solid var(--border-color,#2d2d3f); padding-top:1.25rem; margin-bottom:1.5rem;">
        <h3 style="color:var(--accent-red,#f7768e); margin-top:0; font-size:1rem;">⚠️ Legal Disclaimer &amp; Liability Waiver</h3>
        <p style="color:var(--fg-color,#a9b1d6); line-height:1.75; font-size:0.83rem; margin:0;">
          By clicking <strong>"I Agree"</strong>, you acknowledge and accept that all content, tools, scripts, binaries,
          documentation, and source code provided on this website and within the GitHub repository
          <a href="https://github.com/tilas01/arch-guides-dynamic" target="_blank"
             style="color:var(--accent-blue,#7aa2f7);">tilas01/arch-guides-dynamic</a> —
          including but not limited to the Arch Guides Dynamic Generator, the Arch Rusty Security Suite (ARSS),
          Anti-Evil-Maid, Anti-Ducky, Kernel Watcher, LibreOTP, and Scarecrow —
          are provided strictly <strong>"AS IS"</strong>, without warranty of any kind, express or implied.
          The author (<strong>tilas01</strong>) expressly disclaims all liability for any direct, indirect,
          incidental, consequential, or punitive damages of any nature, including but not limited to:
          data loss or corruption; system damage, bricking, or unbootable states;
          security breaches or exploits that are not mitigated;
          loss of files due to DoD-grade disk wipe features (such as Panic Password, Anti-Evil-Maid triggers,
          or secure erase routines); conflicts arising from proprietary software, firmware blobs, or third-party
          packages; and any harm arising from following generated installation scripts or guides.
          This software is intended for advanced Linux users who understand the risks involved.
          You assume <strong>full and sole responsibility</strong> for all actions taken using these tools on your systems.
          This project was developed with AI assistance and has been reviewed by tilas01 — you
          <strong>must</strong> review all generated scripts before executing them.
          No cookies, session tracking, or personally identifiable information is collected by this site.
          Generation history is stored exclusively in your local browser session memory and is permanently
          deleted when the tab is closed. Your use of this website and any associated resources
          constitutes your binding agreement to these terms in full.
        </p>
      </div>

      <!-- Two Action Buttons -->
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <button id="legal-agree-btn" class="btn" style="
          background:var(--accent-red,#f7768e); color:#0d1117;
          border:none; width:100%; padding:0.85rem;
          font-size:1rem; font-weight:700; border-radius:8px;
          cursor:pointer; letter-spacing:0.5px; transition:filter 0.2s;">
          ✅ I Agree
        </button>
        <button id="legal-agree-persist-btn" class="btn" style="
          background:var(--bg-darker,#16161e); color:var(--accent-red,#f7768e);
          border:1px solid var(--accent-red,#f7768e); width:100%; padding:0.85rem;
          font-size:0.9rem; font-weight:700; border-radius:8px;
          cursor:pointer; letter-spacing:0.3px; transition:filter 0.2s;">
          ✅ I Agree &amp; Don't Show Again
        </button>
      </div>
      <p style="color:#8b949e; font-size:0.72rem; text-align:center; margin:1rem 0 0;">
        "Don't Show Again" stores a flag in your browser's <code>localStorage</code>. No personal data is saved.
      </p>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // After agreeing, always offer the two ways in. It is the first real
    // decision a visitor has to make, and burying it behind an opt-in checkbox
    // meant most people never saw it — they landed on whichever page happened
    // to be open. The chooser has its own "not now" escape to the site index.
    const dismiss = () => {
      markSessionAccepted();
      overlay.remove();
      showGeneratorJump();
    };

    modal.querySelector('#legal-agree-btn').addEventListener('click', dismiss);

    modal.querySelector('#legal-agree-persist-btn').addEventListener('click', () => {
      localStorage.setItem(LEGAL_KEY, 'true');
      localStorage.setItem(WELCOME_KEY, 'true');
      dismiss();
    });

    // Hover effect
    [modal.querySelector('#legal-agree-btn'), modal.querySelector('#legal-agree-persist-btn')]
      .forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(1.12)');
        btn.addEventListener('mouseleave', () => btn.style.filter = '');
      });
  }

  // ─── Generator jump overlay ─────────────────────────────────────────────────
  // Shown only when the user ticked the shortcut box. Two plain choices, each
  // saying who it is for, so a first-time visitor picks the right one rather
  // than guessing. Right-clicking either card opens its wiki explainer, matching
  // the rest of the site.
  // ─── Where to next ──────────────────────────────────────────────────────────
  // Shown once, after agreeing. Every destination on the site, grouped, each
  // with its own description and tooltip, so a first-time visitor can tell them
  // apart rather than guessing from a name. The two generators are grouped
  // together under "Build an install" because that is the choice people
  // actually have to make; the rest are separate because they are separate
  // things, not variations of one.
  function showGeneratorJump() {
    const overlay = makeOverlay();
    const modal = makeModal();
    modal.style.maxWidth = '760px';
    modal.style.borderColor = 'var(--accent-cyan,#7dcfff)';

    // Fullscreen on a phone: at 92% width inside a scrolling overlay these
    // cards became a cramped strip with the page showing round the edges.
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
      Object.assign(modal.style, {
        width: '100%', maxWidth: '100%', minHeight: '100vh',
        borderRadius: '0', border: 'none', padding: '1.5rem 1.1rem',
      });
      Object.assign(overlay.style, { paddingTop: '0', paddingBottom: '0', alignItems: 'stretch' });
    }

    const GROUPS = [
      {
        heading: '🛠️ Build an install',
        note: 'Both produce the same thing — a bash script and a matching markdown guide. They differ only in how much you decide up front.',
        items: [
          { href: 'index.html', icon: '⚙️', name: 'Dynamic Generator',
            tag: 'recommended on a PC', colour: 'var(--accent-blue,#7aa2f7)',
            desc: 'One form, every option at once. Best if you already know what you want.',
            tip: 'Set every option in a single form and generate a custom Arch install script and guide. Fastest on a desktop.' },
          { href: 'manual.html', icon: '🧭', name: 'Manual Walkthrough',
            tag: 'recommended on mobile', colour: 'var(--accent-purple,#bb9af7)',
            desc: 'One question at a time, everything explained, the guide building as you answer.',
            tip: 'Best on a phone, or if you are not sure yet — it walks you through each choice and says what it costs.' }
        ]
      },
      {
        heading: '🔍 Before you install',
        note: 'Do this first. It comes before everything else.',
        items: [
          { href: 'iso-verify.html', icon: '💿', name: 'Verify Arch ISO',
            tag: 'x86_64 and ARM', colour: 'var(--accent-green,#9ece6a)',
            desc: 'Hash your download in the browser and check it against mirrors other than the one that served it.',
            tip: 'The file never leaves your machine. A host that lies about the image cannot also hand you a matching checksum.' }
        ]
      },
      {
        heading: '📚 Read and explore',
        note: 'The same material, written out — useful whether or not you use a generator.',
        items: [
          { href: 'site-index.html', icon: '🔎', name: 'Index',
            tag: 'search everything', colour: 'var(--accent-cyan,#7dcfff)',
            desc: 'One search box across the wiki, every generator and walkthrough question, the tools and the docs.',
            tip: 'The contents page for the whole project. Start here if you do not know what you are looking for.' },
          { href: 'wiki.html', icon: '📖', name: 'Wiki',
            tag: 'install by hand', colour: 'var(--accent-cyan,#7dcfff)',
            desc: 'Every option explained in full, plus firmware lockdown, dual boot, ARM and AUR safety.',
            tip: 'The install written out longhand, with the decision points as branches you choose between.' },
          { href: 'security-tools.html', icon: '🦀', name: 'Security Tools',
            tag: 'optional', colour: 'var(--accent-red,#f7768e)',
            desc: 'The Rust suite and the vetted third-party hardening tools. Several can lock you out — read first.',
            tip: 'Libre OTP, Input Guard, Anti-Evil Maid, Kernel Watcher and Scarecrow. Reproducible, GPG-signed builds.' },
          { href: 'live.html', icon: '📝', name: 'Live Editor',
            tag: 'edit and download', colour: 'var(--accent-orange,#ff9e64)',
            desc: 'Edit a generated script and guide side by side, browse this session\'s history, and download.',
            tip: 'Already have a generated script or a saved .json config? Load it here.' }
        ]
      }
    ];

    let html = `
      <h2 style="color:var(--accent-cyan,#7dcfff); text-align:center; margin:0 0 0.4rem;">
        Where would you like to start?
      </h2>
      <p style="color:#8b949e; text-align:center; font-size:0.85rem; margin:0 0 1.4rem;">
        Everything here is optional and nothing is hidden — you can reach any of
        these at any time from the header.
      </p>`;

    GROUPS.forEach(g => {
      html += `
        <div style="margin-bottom:1.3rem;">
          <div style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.07em;
                      color:var(--accent-cyan,#7dcfff); margin-bottom:0.2rem;">${g.heading}</div>
          <div style="font-size:0.78rem; color:#8b949e; margin-bottom:0.6rem;">${g.note}</div>
          <div style="display:flex; flex-direction:column; gap:0.55rem;">`;
      g.items.forEach(it => {
        html += `
            <a href="${it.href}" class="jump-card nav-tooltip"
               data-title="${it.icon} ${it.name}" data-desc="${it.tip}"
               style="display:block; text-decoration:none; background:var(--bg-darker,#16161e);
                      border:1px solid ${it.colour}; border-radius:10px; padding:0.8rem 0.95rem;">
              <span style="display:block; font-weight:700; color:${it.colour}; font-size:0.98rem;">
                ${it.icon} ${it.name}
                <span style="font-size:0.7rem; color:var(--accent-green,#9ece6a); font-weight:400;">— ${it.tag}</span>
              </span>
              <span style="display:block; color:var(--fg-color,#a9b1d6); font-size:0.83rem; margin-top:0.25rem; line-height:1.55;">
                ${it.desc}
              </span>
            </a>`;
      });
      html += `</div></div>`;
    });

    html += `
      <button id="jump-skip" style="
        display:block; margin:0.6rem auto 0; background:none; border:none;
        color:#8b949e; font-family:var(--font-mono); font-size:0.82rem;
        text-decoration:underline; cursor:pointer; min-height:44px;">
        Close and browse on my own
      </button>`;

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Closing must never re-open the waiver. Acceptance is already recorded for
    // the session by dismiss(), so this simply lets the page through.
    modal.querySelector('#jump-skip').addEventListener('click', () => {
      document.body.style.overflow = '';
      overlay.remove();
    });
    modal.querySelectorAll('a[href]').forEach(a =>
      a.addEventListener('click', () => { document.body.style.overflow = ''; }));

    if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
  }

  // Show if not dismissed
  showWaiver();
});
