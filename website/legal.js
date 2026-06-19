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
        <p style="margin:0;">
          Arch Guides Dynamic is an interactive, fully customisable Arch Linux installation guide generator.
          Use the <strong style="color:var(--accent-cyan,#7dcfff);">Generator</strong> to create a personalised install script and markdown guide,
          follow the <strong style="color:var(--accent-cyan,#7dcfff);">Wiki</strong> for manual configuration,
          or download the <strong style="color:var(--accent-purple,#bb9af7);">Arch Rusty Security Suite</strong> binaries to harden your system.
          Hover (or tap) any labelled element for a detailed tooltip.
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

    modal.querySelector('#legal-agree-btn').addEventListener('click', () => {
      overlay.remove();
      document.body.style.overflow = '';
    });

    modal.querySelector('#legal-agree-persist-btn').addEventListener('click', () => {
      localStorage.setItem(LEGAL_KEY, 'true');
      localStorage.setItem(WELCOME_KEY, 'true');
      overlay.remove();
      document.body.style.overflow = '';
    });

    // Hover effect
    [modal.querySelector('#legal-agree-btn'), modal.querySelector('#legal-agree-persist-btn')]
      .forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(1.12)');
        btn.addEventListener('mouseleave', () => btn.style.filter = '');
      });
  }

  // Show if not dismissed
  showWaiver();
});
