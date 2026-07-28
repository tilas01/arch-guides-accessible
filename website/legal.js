// legal.js — Onboarding: Welcome + Comprehensive Legal Disclaimer
// Uses localStorage only. No cookies. No tracking.
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const LEGAL_KEY   = 'legal_accepted';
  const WELCOME_KEY = 'welcome_seen';

  const legalDone   = localStorage.getItem(LEGAL_KEY) === 'true';
  const welcomeDone = localStorage.getItem(WELCOME_KEY) === 'true';

  if (legalDone && welcomeDone) return;

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
  function showGeneratorJump() {
    const overlay = makeOverlay();
    const modal = makeModal();
    modal.style.maxWidth = '620px';
    // Fullscreen on a phone: at 92% width inside a scrolling overlay the two
    // cards ended up as a cramped strip with the page showing round the edges.
    // A choice this consequential should fill the screen on the device where
    // it is hardest to read.
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
      Object.assign(modal.style, {
        width: '100%', maxWidth: '100%', minHeight: '100vh',
        borderRadius: '0', border: 'none', padding: '1.5rem 1.1rem',
      });
      Object.assign(overlay.style, { paddingTop: '0', paddingBottom: '0', alignItems: 'stretch' });
    }
    modal.innerHTML = `
      <h2 style="color:var(--accent-cyan,#7dcfff); text-align:center; margin:0 0 0.4rem;">
        Which way in?
      </h2>
      <p style="color:#8b949e; text-align:center; font-size:0.88rem; margin:0 0 1.3rem;">
        Both produce the same install — a bash script and a matching markdown
        guide. They differ only in how much you decide up front.
      </p>
      <div style="display:flex; flex-direction:column; gap:0.8rem;">
        <a href="index.html" id="jump-dynamic" class="nav-tooltip" data-title="⚙️ Dynamic Generator"
           data-desc="A single form. Set every option and generate. Fastest when you already know what you want, and most comfortable on a desktop."
           style="display:block; text-decoration:none; background:var(--bg-darker,#16161e);
           border:1px solid var(--accent-blue,#7aa2f7); border-radius:10px; padding:1rem 1.1rem;">
          <span style="display:block; font-weight:700; color:var(--accent-blue,#7aa2f7); font-size:1.05rem;">
            ⚙️ Dynamic Generator <span style="font-size:0.72rem; color:var(--accent-green,#9ece6a);">— recommended on a PC</span>
          </span>
          <span style="display:block; color:var(--fg-color,#a9b1d6); font-size:0.85rem; margin-top:0.3rem;">
            One form, every option at once. Best if you already know what you want.
          </span>
        </a>
        <a href="manual.html" id="jump-manual" class="nav-tooltip" data-title="🧭 Manual Walkthrough"
           data-desc="One question at a time, each explained, with the guide building as you answer. Best on mobile, or if you are not yet sure what you want."
           style="display:block; text-decoration:none; background:var(--bg-darker,#16161e);
           border:1px solid var(--accent-purple,#bb9af7); border-radius:10px; padding:1rem 1.1rem;">
          <span style="display:block; font-weight:700; color:var(--accent-purple,#bb9af7); font-size:1.05rem;">
            🧭 Manual Walkthrough <span style="font-size:0.72rem; color:var(--accent-green,#9ece6a);">— recommended on mobile</span>
          </span>
          <span style="display:block; color:var(--fg-color,#a9b1d6); font-size:0.85rem; margin-top:0.3rem;">
            One step at a time, everything explained. Best on a phone, or if you
            are not sure yet — it walks you through each choice.
          </span>
        </a>
      </div>
      <button id="jump-skip" style="
        display:block; margin:1.1rem auto 0; background:none; border:none;
        color:#8b949e; font-family:var(--font-mono); font-size:0.82rem;
        text-decoration:underline; cursor:pointer;">
        Not now — take me to the site index
      </button>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const leave = (href) => {
      document.body.style.overflow = '';
      if (href) window.location.href = href;
      else overlay.remove();
    };
    modal.querySelector('#jump-skip').addEventListener('click', () => leave('site-index.html'));
    // The two cards are real links; let them navigate, but restore scroll first.
    modal.querySelectorAll('a[href]').forEach(a =>
      a.addEventListener('click', () => { document.body.style.overflow = ''; }));

    if (typeof window.refreshTooltips === 'function') window.refreshTooltips();
  }

  // Show if not dismissed
  showWaiver();
});
