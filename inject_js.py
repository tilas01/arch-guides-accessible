import re
import os

js_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-dynamic\website\script.js"

with open(js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# 1. Inject the openAppConfigModal function at the end of the file if it doesn't exist
modal_logic = """
// ==========================================
// APP CONFIGURER OVERLAY LOGIC
// ==========================================
function openAppConfigModal(appId) {
    const modal = document.getElementById('app-config-modal');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const contentArea = document.getElementById('modal-content-area');
    
    // Clear previous
    contentArea.innerHTML = '';
    
    // Map app IDs to their specific config UIs
    if (appId === 'libre-otp') {
        title.innerHTML = '⚙️ Libre OTP Configuration';
        desc.innerText = 'Configure your Time-Based One Time Password settings for PAM (sudo, su, ssh).';
        contentArea.innerHTML = `
            <div style="margin-bottom:1rem;">
                <label>OTP Mode:</label>
                <select id="modal_otp_mode" style="width:100%; padding:0.5rem; background:var(--bg-light); border:1px solid var(--accent-blue); color:white; border-radius:4px;">
                    <option value="sudo">sudo only</option>
                    <option value="su">su only</option>
                    <option value="ssh">ssh only</option>
                    <option value="boot">Boot/Login only</option>
                    <option value="both">sudo + ssh</option>
                    <option value="all">All (sudo, su, ssh, boot)</option>
                </select>
            </div>
            <div style="margin-bottom:1rem;">
                <label>Bypass Uses (e.g. 3 uses before requiring OTP):</label>
                <input type="number" id="modal_otp_bypass" value="0" min="0" max="10" style="width:100%; padding:0.5rem; background:var(--bg-light); border:1px solid var(--accent-blue); color:white; border-radius:4px;">
            </div>
        `;
    } else if (appId === 'evil-maid') {
        title.innerHTML = '⚙️ Anti-Evil Maid Configuration';
        desc.innerText = 'Configure decoy kernels and cryptographically secure boot signatures.';
        contentArea.innerHTML = `
            <div style="margin-bottom:1rem;">
                <label>Decoy Kernels:</label>
                <select id="modal_aem_decoy" style="width:100%; padding:0.5rem; background:var(--bg-light); border:1px solid var(--accent-blue); color:white; border-radius:4px;">
                    <option value="1">1 Decoy (Basic)</option>
                    <option value="2">2 Decoys</option>
                    <option value="random">Randomized Decoy Selection</option>
                </select>
            </div>
        `;
    } else {
        // Fallback for apps without specific config logic yet
        title.innerHTML = `⚙️ ${appId} Configuration`;
        desc.innerText = `Advanced configuration for ${appId} is not yet implemented. This app will be installed with default settings.`;
        contentArea.innerHTML = `<p style="color:var(--accent-green);">Marking as configured...</p>`;
    }
    
    modal.style.display = 'flex';
    
    // Save button logic
    document.getElementById('save-modal-btn').onclick = function(e) {
        e.preventDefault();
        // Here we would extract the values from the modal inputs and save them globally
        // For now, we just mark the checkbox as configured
        const cb = document.querySelector(`input[type="checkbox"][value="${appId}"]`);
        if (cb) {
            cb.dataset.configured = "true";
            cb.checked = true; // ensure it's checked
            // Make gear icon green to indicate success
            const gear = cb.parentElement.querySelector('.gear-config-btn');
            if(gear) gear.style.textShadow = '0 0 5px var(--accent-green)';
        }
        modal.style.display = 'none';
    };
}

// Close button logic
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('app-config-modal');
    if (closeBtn && modal) {
        closeBtn.onclick = (e) => {
            e.preventDefault();
            modal.style.display = 'none';
        };
    }
    
    // Auto-open modal when a configurable checkbox is checked
    document.querySelectorAll('input[type="checkbox"][data-requires-config="true"]').forEach(cb => {
        cb.addEventListener('change', function() {
            const gear = this.parentElement.querySelector('.gear-config-btn');
            if (this.checked) {
                if (gear) gear.style.display = 'inline';
                // Only auto-open if not already configured
                if (this.dataset.configured !== "true") {
                    openAppConfigModal(this.value);
                }
            } else {
                if (gear) gear.style.display = 'none';
                this.dataset.configured = "false"; // reset on uncheck
                if(gear) gear.style.textShadow = 'none';
            }
        });
    });
});
"""

if 'openAppConfigModal' not in js_content:
    js_content += "\n" + modal_logic

# 2. Add validation logic into the submit handler
validation_hook = """
    // --- APP CONFIGURATION VALIDATION HOOK ---
    document.querySelectorAll('input[type="checkbox"][data-requires-config="true"]').forEach(cb => {
        if (cb.checked && cb.dataset.configured !== "true") {
            const appName = cb.parentElement.innerText.replace('⚙️', '').replace('ℹ️', '').trim();
            missingFields.push(`App Configuration missing for: ${appName}`);
            cb.parentElement.style.border = "2px solid var(--accent-red)";
            cb.parentElement.style.padding = "5px";
            cb.parentElement.style.borderRadius = "4px";
        } else {
            cb.parentElement.style.border = "none";
        }
    });
    // -----------------------------------------
"""

if 'APP CONFIGURATION VALIDATION HOOK' not in js_content:
    # Inject right before missingFields.length > 0 check
    js_content = js_content.replace(
        "if (missingFields.length > 0) {",
        validation_hook + "\n        if (missingFields.length > 0) {"
    )

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Successfully injected JavaScript modal logic into script.js")
