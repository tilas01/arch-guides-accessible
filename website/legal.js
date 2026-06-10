document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('legal_accepted') === 'true') {
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'legal-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(26,27,38,0.95); z-index:9999; display:flex; justify-content:center; align-items:center; padding:1rem; overflow-y:auto;';

    const modal = document.createElement('div');
    // Mobile responsive modal width
    modal.style.cssText = 'background:var(--bg-color); border:2px solid var(--accent-red); padding:1.5rem; max-width:600px; width:100%; border-radius:10px; text-align:center; box-shadow: 0 0 20px rgba(255,85,85,0.2); max-height:90vh; overflow-y:auto;';

    modal.innerHTML = `
        <h2 style="color:var(--accent-red); margin-top:0; font-size:1.4rem;">⚠️ Legal & Risk Notice</h2>
        <p style="color:var(--fg-color); text-align:left; font-size:0.9rem; line-height:1.4; margin-bottom:1rem;">
            <strong>1. No Warranty:</strong> Provided "AS IS", without warranty. The authors hold <strong>NO liability</strong> for data loss or damage.<br><br>
            <strong>2. AI-Assisted:</strong> You must <strong>ALWAYS review code</strong> before executing.<br><br>
            <strong>3. Device Support:</strong> Desktop (right-click tooltips), Mobile (tap-to-open tooltips).
        </p>
        <div style="text-align:left; font-size:0.9rem;">
            <label style="cursor:pointer; color:var(--fg-color); display:flex; align-items:flex-start; gap:8px; margin-bottom:0.8rem;">
                <input type="checkbox" id="legal-checkbox" style="width:18px; height:18px; flex-shrink:0; margin-top:2px;">
                I have read and agree to these terms, and understand the risks.
            </label>
            <label style="cursor:pointer; color:var(--accent-cyan); display:flex; align-items:flex-start; gap:8px;" title="Cannot save persistent cookies. This setting only applies to your current browser session.">
                <input type="checkbox" id="legal-dont-prompt" style="width:18px; height:18px; flex-shrink:0; margin-top:2px;">
                Do not prompt me again for this session (No cookies used)
            </label>
        </div>
        <button id="legal-accept-btn" class="btn" style="margin-top:1.2rem; width:100%; background:var(--bg-lighter); color:gray; cursor:not-allowed;" disabled>Accept & Continue</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const checkbox = document.getElementById('legal-checkbox');
    const dontPrompt = document.getElementById('legal-dont-prompt');
    const acceptBtn = document.getElementById('legal-accept-btn');

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            acceptBtn.disabled = false;
            acceptBtn.style.background = 'var(--accent-green)';
            acceptBtn.style.color = '#fff';
            acceptBtn.style.cursor = 'pointer';
        } else {
            acceptBtn.disabled = true;
            acceptBtn.style.background = 'var(--bg-lighter)';
            acceptBtn.style.color = 'gray';
            acceptBtn.style.cursor = 'not-allowed';
        }
    });

    acceptBtn.addEventListener('click', () => {
        if (dontPrompt.checked) {
            sessionStorage.setItem('legal_accepted', 'true');
        }
        document.body.removeChild(overlay);
        document.body.style.overflow = 'auto';
    });
});
