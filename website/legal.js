document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('legal_accepted') === 'true') {
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'legal-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(26,27,38,0.95); z-index:9999; display:flex; justify-content:center; align-items:center; padding:1rem; overflow-y:auto;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-color); border:2px solid var(--accent-red); padding:2rem; max-width:600px; border-radius:10px; text-align:center; box-shadow: 0 0 20px rgba(255,85,85,0.2);';

    modal.innerHTML = `
        <h2 style="color:var(--accent-red); margin-top:0;">⚠️ Legal Disclaimer & Warning</h2>
        <p style="color:var(--fg-color); text-align:left; font-size:0.95rem; line-height:1.5;">
            By using this website, its documentation, or any generated scripts, you explicitly agree to the following terms:<br><br>
            <strong>1. No Warranty or Liability:</strong> All content, scripts, and software are provided "AS IS", without warranty of any kind. Inside the <strong>tilas01/arch-guides-dynamic github repository</strong> and on this website, there is absolutely <strong>NO accountability</strong> and <strong>NO liability</strong> for any data loss, system damage, or security breaches.<br><br>
            <strong>2. AI-Assisted Content:</strong> This website, its repositories, and its generated configurations were built with the assistance of AI. You must <strong>ALWAYS review code and commands</strong> before executing them on your machine.<br><br>
            <strong>Features & Mobile Support:</strong><br>
            • <strong>Interactive Generator:</strong> Customize and download your Arch Linux install script and markdown guide.<br>
            • <strong>Dynamic Wiki & Uploads:</strong> View full documentation and restore previous sessions.<br>
            • <strong>Device Support:</strong> Fully supported on Desktop (right-click tooltips) and Mobile (tap-to-open tooltips). Mobile users have access to all features except precise mouse-tracking.
        </p>
        <div style="margin-top:1.5rem; text-align:left;">
            <label style="cursor:pointer; color:var(--fg-color); display:flex; align-items:center; gap:10px;">
                <input type="checkbox" id="legal-checkbox" style="width:20px; height:20px;">
                I have read and agree to these terms, and I understand the risks.
            </label>
        </div>
        <button id="legal-accept-btn" class="btn" style="margin-top:1.5rem; width:100%; background:var(--bg-lighter); color:gray; cursor:not-allowed;" disabled>Accept & Continue</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const checkbox = document.getElementById('legal-checkbox');
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
        localStorage.setItem('legal_accepted', 'true');
        document.body.removeChild(overlay);
        document.body.style.overflow = 'auto';
    });
});
