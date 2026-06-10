document.addEventListener('DOMContentLoaded', () => {
  // Check persistent preference first, then session
  if (
    localStorage.getItem('legal_accepted_permanent') === 'true' ||
    sessionStorage.getItem('legal_accepted') === 'true'
  ) {
    return;
  }

  // Detect mobile vs desktop
  const isMobile =
    window.innerWidth <= 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  const tooltipText = isMobile
    ? 'On mobile, tap any element to see its tooltip. Tap elsewhere to dismiss. Toggle tooltips with the \u2139\uFE0F button in the top-right.'
    : 'On desktop, hover over any element with an \u2139\uFE0F icon or highlighted option to see helpful tooltips. You can toggle tooltips on/off with the \u2139\uFE0F button in the top-right.';

  // --- Build overlay ---
  const overlay = document.createElement('div');
  overlay.id = 'legal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(26,27,38,0.95)',
    zIndex: '9999',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    overflowY: 'auto',
  });

  // --- Build modal ---
  const modal = document.createElement('div');
  Object.assign(modal.style, {
    background: 'var(--bg-color, #1a1b26)',
    border: '1px solid var(--accent-purple, #bb9af7)',
    padding: '1.5rem',
    maxWidth: '620px',
    width: '100%',
    borderRadius: '12px',
    textAlign: 'left',
    boxShadow: '0 0 24px rgba(187,154,247,0.15)',
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--fg-color, #a9b1d6)',
  });

  modal.innerHTML = `
    <h2 style="color:var(--accent-purple, #bb9af7); margin:0 0 1rem 0; font-size:1.4rem; text-align:center;">Welcome to Arch Guides</h2>

    <p style="padding:1rem; margin:0 0 1rem 0; font-size:0.9rem; line-height:1.6; background:var(--bg-lighter, #24283b); border-radius:8px;">
      Arch Guides is an interactive, dynamically customizable Arch Linux installation guide generator. You can use the Generator to create custom install scripts, follow the Wiki for manual installation, or Upload previous configs to restore them.
    </p>

    <div style="padding:1rem; margin:0 0 1rem 0; background:var(--bg-lighter, #24283b); border-radius:8px;">
      <h3 style="color:var(--accent-cyan, #7dcfff); margin:0 0 0.6rem 0; font-size:1rem;">\u2139\uFE0F How Tooltips Work</h3>
      <p style="margin:0; font-size:0.85rem; line-height:1.5;">${tooltipText}</p>
    </div>

    <div style="padding:1rem; margin:0 0 1rem 0; border-left:3px solid var(--accent-red, #f7768e); background:var(--bg-lighter, #24283b); border-radius:0 8px 8px 0; font-size:0.82rem; line-height:1.55;">
      <strong style="color:var(--accent-red, #f7768e); font-size:0.9rem;">\u26A0\uFE0F Disclaimer &amp; Liability Waiver</strong>
      <ol style="padding-left:1.2rem; margin:0.7rem 0 0 0;">
        <li style="margin-bottom:0.5rem;">
          <strong>No Warranty:</strong> All content in tilas01/arch-guides-dynamic, including this website, all scripts, guides, security tools, and related repository contents, is provided &ldquo;AS IS&rdquo; without warranty of any kind.
        </li>
        <li style="margin-bottom:0.5rem;">
          <strong>AI-Assisted Content:</strong> This project was developed with AI assistance. All code has been reviewed by tilas01, but you MUST review all generated scripts before executing them. Test in a VM first.
        </li>
        <li style="margin-bottom:0.5rem;">
          <strong>Full Liability Waiver:</strong> By continuing, you waive all liability claims against the authors for any damage, data loss, or issues arising from the use of this website, repository, scripts, or tools.
        </li>
        <li>
          <strong>No Cookies:</strong> This site uses sessionStorage only for generation history and preferences. No persistent cookies or tracking.
        </li>
      </ol>
    </div>

    <div style="margin-bottom:1.2rem;">
      <label style="cursor:pointer; display:flex; align-items:flex-start; gap:8px; margin-bottom:0.7rem; font-size:0.88rem;">
        <input type="checkbox" id="legal-checkbox" style="width:18px; height:18px; flex-shrink:0; margin-top:2px; accent-color:var(--accent-green, #9ece6a);">
        I have read and accept these terms
      </label>
      <label style="cursor:pointer; display:flex; align-items:flex-start; gap:8px; font-size:0.85rem; color:var(--accent-cyan, #7dcfff);">
        <input type="checkbox" id="legal-dont-prompt" style="width:18px; height:18px; flex-shrink:0; margin-top:2px; accent-color:var(--accent-cyan, #7dcfff);">
        Don&rsquo;t show me this again (current session only &mdash; no cookies stored)
      </label>
    </div>

    <button id="legal-accept-btn" class="btn" style="width:100%; padding:0.7rem; border:none; border-radius:8px; font-family:'JetBrains Mono', monospace; font-size:0.95rem; font-weight:600; background:var(--bg-lighter, #24283b); color:gray; cursor:not-allowed; transition:background 0.2s, color 0.2s;" disabled>Continue</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // --- Wire up interactions ---
  const checkbox = document.getElementById('legal-checkbox');
  const dontPrompt = document.getElementById('legal-dont-prompt');
  const acceptBtn = document.getElementById('legal-accept-btn');

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      acceptBtn.disabled = false;
      acceptBtn.style.background = 'var(--accent-green, #9ece6a)';
      acceptBtn.style.color = '#1a1b26';
      acceptBtn.style.cursor = 'pointer';
    } else {
      acceptBtn.disabled = true;
      acceptBtn.style.background = 'var(--bg-lighter, #24283b)';
      acceptBtn.style.color = 'gray';
      acceptBtn.style.cursor = 'not-allowed';
    }
  });

  acceptBtn.addEventListener('click', () => {
    if (dontPrompt.checked) {
      sessionStorage.setItem('legal_accepted', 'true');
    }
    overlay.remove();
    document.body.style.overflow = '';
  });
});
