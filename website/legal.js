// legal.js — Two-step onboarding: Liability Waiver first, then Welcome notice.
// Uses sessionStorage only. No cookies are used on this site.
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const LEGAL_KEY  = 'legal_accepted';
  const WELCOME_KEY = 'welcome_seen';

  const legalDone   = sessionStorage.getItem(LEGAL_KEY) === 'true';
  const welcomeDone = sessionStorage.getItem(WELCOME_KEY) === 'true';

  const isMobile =
    window.innerWidth <= 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  const tooltipHint = isMobile
    ? 'Tap any labelled element for a tooltip. Tap elsewhere to dismiss. Toggle with the ℹ️ button near the banner.'
    : 'Hover any labelled element for a tooltip. Toggle tooltips on/off with the ℹ️ button near the banner.';

  // ─── Shared overlay factory ────────────────────────────────────────────────
  function makeOverlay() {
    const ov = document.createElement('div');
    Object.assign(ov.style, {
      position: 'fixed', inset: '0', background: 'rgba(26,27,38,0.96)',
      zIndex: '10000', display: 'flex', justifyContent: 'center',
      alignItems: 'center', padding: '1rem', overflowY: 'auto',
    });
    return ov;
  }

  function makeModal(borderColor) {
    const m = document.createElement('div');
    Object.assign(m.style, {
      background: 'var(--bg-color,#1a1b26)',
      border: `2px solid ${borderColor}`,
      padding: '1.6rem',
      maxWidth: '600px', width: '100%',
      borderRadius: '14px',
      textAlign: 'left',
      boxShadow: `0 0 32px ${borderColor}33`,
      maxHeight: '90vh', overflowY: 'auto',
      fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
      color: 'var(--fg-color,#a9b1d6)',
      fontSize: '0.9rem', lineHeight: '1.6',
    });
    return m;
  }

  // ─── STEP 1: Liability & Legal Waiver ─────────────────────────────────────
  function showLegal(onAccept) {
    const overlay = makeOverlay();
    const modal   = makeModal('var(--accent-red,#f7768e)');

    modal.innerHTML = `
      <h2 style="color:var(--accent-red,#f7768e);margin:0 0 1rem 0;font-size:1.3rem;text-align:center;">
        ⚠️ Legal Disclaimer &amp; Liability Waiver
      </h2>

      <div style="background:var(--bg-lighter,#24283b);border-radius:8px;padding:1rem;margin-bottom:1rem;font-size:0.83rem;line-height:1.6;">
        <ol style="padding-left:1.2rem;margin:0;">
          <li style="margin-bottom:0.6rem;">
            <strong style="color:var(--heading-color,#c0caf5);">No Warranty.</strong>
            All content in <em>tilas01/arch-guides-dynamic</em> — this website, all scripts,
            guides, security tools, and related repository contents — is provided
            <strong>"AS IS"</strong> without warranty of any kind. Use at your own risk.
          </li>
          <li style="margin-bottom:0.6rem;">
            <strong style="color:var(--heading-color,#c0caf5);">AI-Assisted Content.</strong>
            This project was developed with AI assistance. All output has been reviewed by
            tilas01, but you <strong>MUST review all generated scripts</strong> before
            executing them. Always test in a VM first.
          </li>
          <li style="margin-bottom:0.6rem;">
            <strong style="color:var(--heading-color,#c0caf5);">Full Liability Waiver.</strong>
            By continuing you waive all liability claims against the authors for any
            damage, data loss, or issues arising from use of this website, repository,
            scripts, or tools.
          </li>
          <li>
            <strong style="color:var(--accent-cyan,#7dcfff);">🍪 No Cookies.</strong>
            This site uses <code>sessionStorage</code> only (generation history &amp;
            preferences). No persistent cookies or tracking of any kind are used.
            Your "don't show again" choice is session-scoped and cannot be saved permanently.
          </li>
        </ol>
      </div>

      <div style="margin-bottom:1.2rem;">
        <label style="cursor:pointer;display:flex;align-items:flex-start;gap:8px;margin-bottom:0.7rem;">
          <input type="checkbox" id="legal-cb" style="width:18px;height:18px;flex-shrink:0;margin-top:2px;accent-color:var(--accent-green,#9ece6a);">
          I have read and accept the disclaimer &amp; liability waiver above.
        </label>
        <label style="cursor:pointer;display:flex;align-items:flex-start;gap:8px;color:var(--accent-cyan,#7dcfff);font-size:0.82rem;">
          <input type="checkbox" id="legal-skip" style="width:16px;height:16px;flex-shrink:0;margin-top:3px;accent-color:var(--accent-cyan,#7dcfff);">
          Don't show me this disclaimer again this session (no cookies — resets on tab close)
        </label>
      </div>

      <button id="legal-btn" disabled style="width:100%;padding:0.7rem;border:none;border-radius:8px;
        font-family:'JetBrains Mono',monospace;font-size:0.95rem;font-weight:600;
        background:var(--bg-lighter,#24283b);color:#555;cursor:not-allowed;transition:all 0.2s;">
        Accept &amp; Continue →
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const cb  = modal.querySelector('#legal-cb');
    const skip = modal.querySelector('#legal-skip');
    const btn  = modal.querySelector('#legal-btn');

    cb.addEventListener('change', () => {
      btn.disabled = !cb.checked;
      btn.style.background  = cb.checked ? 'var(--accent-green,#9ece6a)' : 'var(--bg-lighter,#24283b)';
      btn.style.color       = cb.checked ? '#1a1b26' : '#555';
      btn.style.cursor      = cb.checked ? 'pointer' : 'not-allowed';
    });

    btn.addEventListener('click', () => {
      if (!cb.checked) return;
      if (skip.checked) sessionStorage.setItem(LEGAL_KEY, 'true');
      overlay.remove();
      document.body.style.overflow = '';
      onAccept();
    });
  }

  // ─── STEP 2: Welcome Notice ────────────────────────────────────────────────
  function showWelcome() {
    const overlay = makeOverlay();
    const modal   = makeModal('var(--accent-purple,#bb9af7)');

    modal.innerHTML = `
      <h2 style="color:var(--accent-purple,#bb9af7);margin:0 0 1rem 0;font-size:1.3rem;text-align:center;">
        👋 Welcome to Arch Guides
      </h2>

      <div style="background:var(--bg-lighter,#24283b);border-radius:8px;padding:1rem;margin-bottom:1rem;">
        <p style="margin:0;font-size:0.88rem;">
          Arch Guides is an interactive, dynamically customisable Arch Linux installation
          guide generator. Use the <strong style="color:var(--accent-cyan,#7dcfff);">Generator</strong>
          to create a custom install script and guide, follow the
          <strong style="color:var(--accent-cyan,#7dcfff);">Wiki</strong> to configure
          manually, or <strong style="color:var(--accent-cyan,#7dcfff);">Upload</strong>
          a previous config to restore it below the generator.
        </p>
      </div>

      <div style="background:var(--bg-lighter,#24283b);border-radius:8px;padding:1rem;margin-bottom:1rem;">
        <h3 style="color:var(--accent-cyan,#7dcfff);margin:0 0 0.5rem 0;font-size:0.95rem;">ℹ️ Tooltips</h3>
        <p style="margin:0;font-size:0.83rem;">${tooltipHint}</p>
      </div>

      <div style="background:var(--bg-lighter,#24283b);border-radius:8px;padding:1rem;margin-bottom:1.2rem;font-size:0.82rem;">
        <span style="color:var(--accent-cyan,#7dcfff);">🍪 No Cookies:</span>
        This site stores nothing permanently. Generation history and your preferences
        use <code>sessionStorage</code> only — everything clears when you close the tab.
      </div>

      <div style="margin-bottom:1.2rem;">
        <label style="cursor:pointer;display:flex;align-items:flex-start;gap:8px;color:var(--accent-cyan,#7dcfff);font-size:0.82rem;">
          <input type="checkbox" id="welcome-skip" style="width:16px;height:16px;flex-shrink:0;margin-top:3px;accent-color:var(--accent-cyan,#7dcfff);">
          Don't show this welcome message again this session (no cookies — resets on tab close)
        </label>
      </div>

      <button id="welcome-btn" style="width:100%;padding:0.7rem;border:none;border-radius:8px;
        font-family:'JetBrains Mono',monospace;font-size:0.95rem;font-weight:600;
        background:var(--accent-purple,#bb9af7);color:#1a1b26;cursor:pointer;transition:all 0.2s;">
        Get Started →
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const skip = modal.querySelector('#welcome-skip');
    const btn  = modal.querySelector('#welcome-btn');

    btn.addEventListener('click', () => {
      if (skip.checked) sessionStorage.setItem(WELCOME_KEY, 'true');
      overlay.remove();
      document.body.style.overflow = '';
    });
  }

  // ─── Entry point ───────────────────────────────────────────────────────────
  if (!legalDone) {
    // Show legal first; on accept show welcome (unless already seen)
    showLegal(() => { if (!welcomeDone) showWelcome(); });
  } else if (!welcomeDone) {
    showWelcome();
  }
});
