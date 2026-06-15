// =============================================
// Arch Guides Dynamic - Main Script
// Arch Rusty Security Suite by tilas01
// =============================================

// ---- Form Initialization & "No Selection" Injection ----
document.addEventListener('DOMContentLoaded', () => {

// ---- Full Suite Toggle Logic ----
const fullSuiteToggle = document.getElementById('arss-full-suite-toggle');
if (fullSuiteToggle) {
    fullSuiteToggle.addEventListener('change', (e) => {
        const arssTools = document.querySelectorAll('input[name="arss_tools"]');
        arssTools.forEach(tool => {
            if (e.target.checked) {
                tool.checked = true;
                tool.disabled = true;
                tool.parentElement.setAttribute('title', 'Included and managed automatically by the Full Security Suite.');
                tool.parentElement.style.opacity = '0.7';
            } else {
                tool.disabled = false;
                tool.parentElement.removeAttribute('title');
                tool.parentElement.style.opacity = '1';
            }
        });
    });
}

    
    // Ensure 'No Selection Provided' text is greyed out
    document.querySelectorAll('#install-form select').forEach(sel => {
        if (sel.value === "") sel.style.color = "var(--fg-dim, #888)";
        
        // Trigger immediately on interaction to prevent iOS WebKit ghosting
        const removePlaceholder = function() {
            this.style.color = ""; // Restore normal color
            // Remove the empty option permanently once clicked
            if (this.options[0] && this.options[0].value === "") {
                this.options[0].remove();
            }
            // Remove red border and warning if they exist
            this.style.border = "";
            const warningSpan = this.parentElement.querySelector('.req-warning');
            if (warningSpan) warningSpan.remove();
        };
        sel.addEventListener('mousedown', removePlaceholder);
        sel.addEventListener('touchstart', removePlaceholder, { passive: true });
        sel.addEventListener('change', removePlaceholder);
    });

    document.querySelectorAll('select').forEach(select => {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = "No Selection Provided";
        // Insert at the top
        select.insertBefore(defaultOption, select.firstChild);
    });
});

// ---- Generation History (sessionStorage, clears on reload) ----
const HISTORY_KEY = 'arch_gen_history';

function saveToHistory(mdContent, shContent, format) {
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    history.unshift({ timestamp: (() => {
            const d = new Date();
            const pad = n => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        })(), format, md: mdContent || '', sh: shContent || '' });
    if (history.length > 10) history = history.slice(0, 10);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    updateHistoryTooltip();
}

function renderHistoryPanel() {
    const panel = document.getElementById('history-panel');
    if (!panel) return;
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    if (history.length === 0) {
        panel.innerHTML = '<em style="color:var(--fg-color)">No generations yet this session.</em>';
        return;
    }
    panel.innerHTML = history.map((entry, i) => `
        <div style="border-bottom:1px solid var(--bg-lighter);padding:0.4rem 0;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.82rem;color:var(--accent-cyan)">${entry.timestamp} (${entry.format})</span>
            <button class="btn" style="width:auto;padding:0.25rem 0.6rem;font-size:0.78rem;" onclick="restoreFromHistory(${i})">Restore</button>
        </div>
    `).join('');
}

window.restoreFromHistory = function(idx) {
    let history = [];
    try { history = JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []; } catch(e) {}
    const entry = history[idx];
    if (!entry) return;
    const mdEl = document.getElementById('raw-md-code');
    const shEl = document.getElementById('raw-script-code');
    if (mdEl && entry.md) mdEl.innerText = entry.md;
    if (shEl && entry.sh) shEl.innerText = entry.sh;
    updatePreview();
    if (window.Prism) Prism.highlightAll();
};

window.toggleHistoryModal = function() {
    const modal = document.getElementById('history-modal');
    if (!modal) return;
    const vis = modal.style.display === 'block';
    modal.style.display = vis ? 'none' : 'block';
    if (!vis) renderHistoryPanel();
};


// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Page switching: Generator ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Â Output ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function showOutputPage(mdContent, shContent, format, scContent) {
    // Save to sessionStorage for live.html
    sessionStorage.setItem('live_md', mdContent || '');
    sessionStorage.setItem('live_sh', shContent || '');
    
    // Attempt to split install vs post-install scripts (Fallback split mechanism)
    let postSh = '';
    let mainSh = shContent || '';
    if (shContent && shContent.includes('### POST-INSTALL BOUNDARY ###')) {
        const parts = shContent.split('### POST-INSTALL BOUNDARY ###');
        mainSh = parts[0].trim();
        postSh = parts[1].trim();
    }
    sessionStorage.setItem('live_sh', mainSh);
    sessionStorage.setItem('live_post_sh', postSh);

    // Check if Live Generation Toggle is checked
    const liveToggle = document.getElementById('live_generation_toggle');
    if (liveToggle && liveToggle.checked) {
        window.location.href = "live.html";
        return;
    }

    // Scroll to Live Editor instead of hiding form
    const liveEditor = document.getElementById('live-editor');
    if (liveEditor) {
        liveEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Build dynamic download buttons
    const dlContainer = document.getElementById('download-btns');
    if (dlContainer) {
        dlContainer.innerHTML = '';
        if (mdContent && format !== 'script') {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Markdown Guide');
            b.setAttribute('data-desc', 'Download the generated installation guide as a .md file.');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-cyan);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = 'Ã¢Â¬â€¡ Download .md';
            b.onclick = () => downloadFile(mdContent, 'arch-install-guide.md');
            dlContainer.appendChild(b);
        }
        if (shContent && format !== 'markdown') {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Shell Script');
            b.setAttribute('data-desc', 'Download the generated Bash install script as a .sh file. REVIEW before executing!');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-blue);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = 'Ã¢Â¬â€¡ Download .sh';
            b.onclick = () => downloadFile(shContent, 'arch-install.sh');
            dlContainer.appendChild(b);
        }
        if (scContent) {
            const b = document.createElement('button');
            b.className = 'btn btn-tooltip';
            b.setAttribute('data-title', 'Download Selection Config (.sc)');
            b.setAttribute('data-desc', 'Download your exact form selections as a .sc JSON file so you can restore them later.');
            b.style.cssText = 'width:auto;padding:0.5rem 1.2rem;background:var(--accent-purple);color:var(--bg-color);font-size:0.88rem;';
            b.textContent = 'Ã¢Â¬â€¡ Download .sc';
            b.onclick = () => downloadFile(scContent, 'arch-config.sc');
            dlContainer.appendChild(b);
        }
        if (window.refreshTooltips) window.refreshTooltips();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.returnToGenerator = function() {
    const genArea   = document.querySelector('.layout-container');
    const outputSec = document.getElementById('output-section');
    if (genArea)   genArea.style.display = '';
    if (outputSec) outputSec.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.clearGeneratedOutput = function() {
    const guide     = document.getElementById('generated-guide');
    const dlBtns    = document.getElementById('download-btns');
    if (guide)  guide.innerHTML = '';
    if (dlBtns) dlBtns.innerHTML = '';
    window.returnToGenerator();
};



// ---- Update History Button Tooltip Count ----
function updateHistoryTooltip() {
    const btn = document.getElementById('history-btn');
    if (!btn) return;
    let count = 0;
    try { count = (JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || []).length; } catch(e) {}
    btn.setAttribute('data-desc', count > 0
        ? `View and restore previous generation configs. ${count} previous generation${count !== 1 ? 's' : ''} saved this session.`
        : 'No previous generations this session. Generate a guide to start saving history.'
    );
}

// ---- Utility: Escape HTML ----
const escapeHTML = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- Utility: Strip config comment ----
const stripConfig = (s) => s.replace(/<!--[\s\S]*?-->/g, '').trim();

// ---- Download helper ----
window.downloadFile = function(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ---- Live Preview Updater ----
window.updatePreview = function() {
    const mdEl = document.getElementById('raw-md-code');
    const previewEl = document.getElementById('preview');
    if (!mdEl || !previewEl) return;
    const clean = stripConfig(mdEl.innerText || "");
    if (typeof marked !== 'undefined') {
        previewEl.innerHTML = marked.parse(clean);
        if (window.Prism) Prism.highlightAll();
    }
};

// ====================================================================
// MAIN OUTPUT GENERATOR
// ====================================================================
window.generateOutput = function(auto = false) {
    const gv = (id, def='') => { const e = document.getElementById(id); return e ? e.value : def; };
    const gi = (id, def=1) => { const e = document.getElementById(id); return e ? parseInt(e.value)||def : def; };

    const fw = gv('firmware','uefi');
    const fs = gv('filesystem','btrfs');
    const disk = gv('target-disk','/dev/sda');
    const part = gv('partitioning','luks2');
    const initSys = gv('init_system','systemd');
    const boot = gv('bootloader','uki-custom');
    const kernelMain = gv('kernel-main','linux-hardened');
    const kernelBackup = gv('kernel-backup','linux-zen');
    const software_type = gv('software_type','libre');
    const desktop = gv('desktop','none');
    const displayServer = gv('display_server','auto');
    const swap_size = gv('swap_size','8G');
    const cleanup = gv('cleanup','yes');
    const browser = gv('browser','none');
    const dns = gv('dns','systemd-resolved');
    const format = gv('outputformat','both');
    const user_count = gi('user_count',1);
    const root_ssh = gv('root_ssh','no');
    const otp_sha = gv('otp_sha','sha1');
    const iso_setup = gv('iso_setup','none');
    const cpu_brand = gv('cpu_brand','amd');
    const gpu_brand = gv('gpu_brand','amd');
    const vm_guest = gv('vm_guest','none');
    const auto_updates = gv('auto_updates','no');
    const verbosity_level = gv('verbosity_level','normal');

    const configMode = document.getElementById('global_ask_toggle')?.checked ? 'preconfigured' : 'interactive';
    
    const isoVerify = gv('iso_verify', 'yes');
    const advDoasMode = gv('adv_doas_mode', 'both');
    const advThemeMode = gv('adv_theme_mode', 'tokyonight');
    const advAemMode = gv('adv_aem_mode', '1');
    const advSnapperMode = gv('adv_snapper_mode', 'default');

    const useCustomScripts = gv('use-custom-scripts','no') === 'yes';

    // Checkboxes arrays
    const post_apps = [];
    document.querySelectorAll('input[name="post_apps"]:checked').forEach(cb => post_apps.push(cb.value));

    const arss_tools = [];
    if (useCustomScripts) {
        document.querySelectorAll('input[name="arss_tools"]:checked').forEach(cb => arss_tools.push(cb.value));
    }

    const other_sec_tools = [];
    document.querySelectorAll('input[name="other_sec_tools"]:checked').forEach(cb => other_sec_tools.push(cb.value));

    // ARSS sub-options
    const libreOtpMode = gv('libre_otp_mode','login');
    const otp_recovery = gv('otp_recovery','5');
    const otp_bypass = gv('otp_bypass','0');
    const otp_double = gv('otp_double','no');
    const webhook_provider = gv('webhook_provider','ntfy');
    const webhook_url = gv('webhook_url','');
    const aem_main = gv('aem-kernel-main','linux');
    const aem_backup = gv('aem-kernel-backup','none');

    const configJSON = JSON.stringify(getFormValues(), null, 2);

    // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Validation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const errors = [];
    
    // Clear previous highlights
    document.querySelectorAll('select').forEach(sel => sel.style.border = '');

    // Strict dropdown checking: Only validate truly visible selects
    const requiredSelects = Array.from(document.querySelectorAll('select')).filter(sel => {
        return sel.offsetParent !== null;
    });

    let firstErrorEl = null;

    requiredSelects.forEach(sel => {
        if (!sel.value) {
            const stepName = sel.closest('.form-step')?.getAttribute('data-title') || sel.id;
            errors.push(`<li style="margin-bottom:0.3rem;"><a href="#" style="color:var(--accent-red);text-decoration:underline;font-weight:bold;">${stepName}</a></li>`);
            if (!auto) {
                sel.style.border = '2px solid var(--accent-red)';
            }
            if (!firstErrorEl) firstErrorEl = sel;
        }
    });

    if (fw === "bios" && boot !== "grub") errors.push(`<li style="margin-bottom:0.3rem;"><span style="color:var(--accent-red);font-weight:bold;">Legacy BIOS requires GRUB. UKI/systemd-boot are UEFI only.</span></li>`);
    if (fw === "bios" && part.includes("luks2")) errors.push(`<li style="margin-bottom:0.3rem;"><span style="color:var(--accent-red);font-weight:bold;">GRUB has limited LUKS2 support on BIOS. Use LUKS1.</span></li>`);

    const errorBox = document.getElementById("generate-error-box");
    const errorList = document.getElementById("error-list");
    const errorCount = document.getElementById("error-count");

    // Remove legacy config-errors if it exists
    const legacyErrorDiv = document.getElementById("config-errors");
    if (legacyErrorDiv) legacyErrorDiv.remove();

    if (errors.length > 0) {
        if (auto) return;
        
        if (errorBox && errorList && errorCount) {
            if (errors.length === requiredSelects.length) {
                // Entire form is empty
                errorCount.textContent = errors.length;
                errorList.innerHTML = `<li style="margin-bottom:0.3rem;"><span style="color:var(--accent-red);font-weight:bold;">No input provided! Please configure the generator.</span></li>`;
                errorBox.style.display = 'block';
                errorBox.onclick = null; // No teleporting if completely empty
            } else {
                // Partial selections missing
                errorCount.textContent = errors.length;
                errorList.innerHTML = errors.join("");
                errorBox.style.display = 'block';
                
                // Teleport to first error on click
                errorBox.onclick = () => {
                    if (firstErrorEl) {
                        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstErrorEl.focus();
                    }
                };
            }
            
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback if HTML doesn't have the new box
            let errorDiv = document.createElement("div"); 
            errorDiv.id = "config-errors"; 
            document.getElementById("install-form").prepend(errorDiv);
            errorDiv.innerHTML = `<div class="alert warning" style="border-left-color:var(--accent-red); padding: 0.8rem;"><strong>Ã¢Å¡Â Ã¯Â¸Â  Missing Selections:</strong> <ul>${errors.join("")}</ul></div>`;
            window.scrollTo(0, 0);
        }
        return;
    }
    
    if (errorBox) errorBox.style.display = 'none';

    // Default Profiles Check for Apps & Security
    const hasApps = document.querySelectorAll('input[name="post_apps"]:checked').length > 0;
    const hasSec = document.querySelectorAll('input[name="arss_tools"]:checked').length > 0 || document.querySelectorAll('input[name="other_sec_tools"]:checked').length > 0;
    
    if (!hasApps || !hasSec) {
        if (!confirm("You have not selected any Apps or Security Tools. Default minimal profiles will be automatically applied. Proceed?")) {
            return;
        }
        // Auto-tick minimal defaults if they agreed
        if (!hasApps) {
            const defApps = ['openssh', 'fastfetch'];
            defApps.forEach(val => {
                const cb = document.querySelector(`input[name="post_apps"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        }
        if (!hasSec) {
            const defSec = ['iso-verifier', 'input-guard'];
            defSec.forEach(val => {
                const cb = document.querySelector(`input[name="arss_tools"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        }
    }

    // Partition paths
    let partEfi = disk + (disk.includes("nvme") ? "p1" : "1");
    let partRoot = disk + (disk.includes("nvme") ? "p2" : "2");

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Proprietary Software Analysis ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
    const propAppsDB = {
        'discord': 'Discord is closed-source and tracks user activity. Use WebCord or matrix-bridges for a libre alternative.',
        'steam': 'Steam is a proprietary storefront and DRM client by Valve.',
        'spotify': 'Spotify is a closed-source streaming client with proprietary DRM.',
        'vmware': 'VMware Tools (open-vm-tools is libre, but VMware hypervisor is proprietary).',
        'vbox': 'VirtualBox Extension Pack contains proprietary code (PUEL license).'
    };
    if (gpu_brand === 'nvidia') propAppsDB['nvidia'] = 'NVIDIA drivers contain heavily proprietary closed-source blobs.';

    const selectedPropApps = post_apps.filter(app => propAppsDB[app]);
    if (gpu_brand === 'nvidia') selectedPropApps.push('nvidia');
    if (browser === 'chrome') {
        propAppsDB['chrome'] = 'Google Chrome is proprietary spyware. Chromium or LibreWolf is libre.';
        selectedPropApps.push('chrome');
    }

    // Strict Libre enforcement
    if (software_type === 'libre' && selectedPropApps.length > 0) {
        const reasons = selectedPropApps.map(a => `\n- ${a.toUpperCase()}: ${propAppsDB[a]}`).join('');
        if (!confirm(`⚠ STRICT LIBRE WARNING ⚠\n\nYou selected "Libre + Open Source 100% Only", but have selected software containing proprietary code:\n${reasons}\n\nDo you want to override your Libre setting and allow these proprietary blobs?`)) {
            return;
        }
    }

    // Build output
    function buildOutput(cmdOnly) {
        let o = "";
        // Hidden config (only in raw source, stripped from preview)
        const configObj = getFormValues();
        o += '<!-- CONFIG_START\n' + JSON.stringify(configObj) + '\nCONFIG_END -->\n\n';

        if (!cmdOnly) {
            o += `# Your Custom Arch Linux Installation Guide\n\n`;
            o += `> *Generated for your specific hardware. Review every command before running.*\n\n`;
            o += `## 1. Partitioning & Formatting (${part} + ${fs})\n\`\`\`bash\n`;
        } else {
            o += `#!/bin/bash\n# Arch Rusty Security Suite by tilas01 — Generated Script\n# WARNING: Review ALL commands!\nset -e\n`;
            if (verbosity_level === 'debug') o += `set -x\n`;
            if (verbosity_level === 'quiet') o += `exec >/dev/null\n`;
            o += `\n`;
            o += `export COLOR_BG="\\e[48;2;26;27;38m"\n`;
            o += `export COLOR_FG="\\e[38;2;192;202;245m"\n`;
            o += `export COLOR_RED="\\e[38;2;247;118;142m"\n`;
            o += `export COLOR_BLUE="\\e[38;2;122;162;247m"\n`;
            o += `export COLOR_RESET="\\e[0m"\n`;
            o += `echo -e "\${COLOR_BG}\${COLOR_FG}"\n`;
            o += `clear\n`;
            o += `echo -e "\${COLOR_BLUE}========================================================================\${COLOR_RESET}"\n`;
            o += `echo -e "\${COLOR_BLUE}             ARCH RUSTY SECURITY SUITE Ã¢â‚¬â€ AUTO-INSTALLER                 \${COLOR_RESET}"\n`;
            o += `echo -e "\${COLOR_BLUE}========================================================================\${COLOR_RESET}\n\n"\n`;
            
            if (configMode === 'preconfigured') {
                o += `echo -e "\\e[33m[!] WALK-AWAY AUTOMATION: Collecting Credentials Upfront\\e[0m"\n`;
                o += `echo "This script will cache your passwords into volatile memory to perform a completely unattended installation."\n`;
                o += `echo "All passwords will be securely wiped (unset) immediately upon completion."\n\n`;
                if (part !== "unencrypted") {
                    o += `read -s -p "Enter LUKS Encryption Password: " LUKS_PASS\necho\n`;
                    o += `read -s -p "Confirm LUKS Password: " LUKS_PASS2\necho\n`;
                    o += `if [ "$LUKS_PASS" != "$LUKS_PASS2" ]; then echo "Passwords do not match!"; exit 1; fi\n\n`;
                }
                o += `read -s -p "Enter Root Password: " ROOT_PASS\necho\n`;
                o += `read -s -p "Confirm Root Password: " ROOT_PASS2\necho\n`;
                o += `if [ "$ROOT_PASS" != "$ROOT_PASS2" ]; then echo "Passwords do not match!"; exit 1; fi\n\n`;
                for (let u = 1; u <= user_count; u++) {
                    o += `read -p "Enter Username ${u}: " USER_NAME_${u}\n`;
                    o += `read -s -p "Enter password for $USER_NAME_${u}: " USER_PASS_${u}\necho\n`;
                    o += `read -s -p "Confirm password for $USER_NAME_${u}: " USER_PASS2_${u}\necho\n`;
                    o += `if [ "$USER_PASS_${u}" != "$USER_PASS2_${u}" ]; then echo "Passwords do not match!"; exit 1; fi\n\n`;
                }
                o += `echo -e "\\e[32m[+] Credentials cached securely. Starting unattended installation...\\e[0m"\nsleep 2\n\n`;
            }

            // Jetbrains Mono Setup via pacman (only if baremetal, wait, TTY can only use PSF fonts like terminus)
            o += `pacman -Sy --noconfirm terminus-font\nsetfont ter-v24b\n\n`;
            
            o += `# 1. Partitioning\n`;
        }

        // Partitioning
        if (fw === "uefi") {
            o += `sgdisk -Z ${disk}\nsgdisk -n 1:0:+512M -t 1:ef00 ${disk}\nsgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
            o += `partprobe ${disk}\nsleep 2\nmkfs.fat -F32 ${partEfi}\n`;
        } else {
            o += `sgdisk -Z ${disk}\nsgdisk -n 1:0:+2M -t 1:ef02 ${disk}\nsgdisk -n 2:0:0 -t 2:8300 ${disk}\npartprobe ${disk}\nsleep 2\n`;
        }

        let targetMount = partRoot;
        if (part === "luks1") {
            o += `echo -n "$LUKS_PASS" | cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 - ${partRoot}\n`;
            o += `LUKS_UUID=$(blkid -s UUID -o value ${partRoot})\n`;
            o += `cryptsetup open UUID=$LUKS_UUID cryptroot\n`;
            targetMount = "/dev/mapper/cryptroot";
        } else if (part === "luks2") {
            o += `echo -n "$LUKS_PASS" | cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 - ${partRoot}\n`;
            o += `LUKS_UUID=$(blkid -s UUID -o value ${partRoot})\n`;
            o += `cryptsetup open UUID=$LUKS_UUID cryptroot\n`;
            targetMount = "/dev/mapper/cryptroot";
        } else if (part.includes("lvm")) {
            o += `echo -n "$LUKS_PASS" | cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 - ${partRoot}\n`;
            o += `LUKS_UUID=$(blkid -s UUID -o value ${partRoot})\n`;
            o += `cryptsetup open UUID=$LUKS_UUID cryptlvm\npvcreate /dev/mapper/cryptlvm\nvgcreate vg0 /dev/mapper/cryptlvm\nlvcreate -l 100%FREE vg0 -n root\n`;
            targetMount = "/dev/vg0/root";
        }

        if (fs === "btrfs") {
            o += `mkfs.btrfs -f ${targetMount}\nmount ${targetMount} /mnt\nbtrfs subvolume create /mnt/@\nbtrfs subvolume create /mnt/@home\nbtrfs subvolume create /mnt/@var\nbtrfs subvolume create /mnt/@snapshots\numount /mnt\n`;
            o += `ROOT_UUID=$(blkid -s UUID -o value ${targetMount})\n`;
            o += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@ UUID=$ROOT_UUID /mnt\nmkdir -p /mnt/{home,var,.snapshots}\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@home UUID=$ROOT_UUID /mnt/home\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@var UUID=$ROOT_UUID /mnt/var\nmount -o noatime,compress=zstd,space_cache=v2,subvol=@snapshots UUID=$ROOT_UUID /mnt/.snapshots\n`;
        } else if (fs === "xfs") {
            o += `mkfs.xfs -f ${targetMount}\nROOT_UUID=$(blkid -s UUID -o value ${targetMount})\nmount UUID=$ROOT_UUID /mnt\n`;
        } else {
            o += `mkfs.ext4 ${targetMount}\nROOT_UUID=$(blkid -s UUID -o value ${targetMount})\nmount UUID=$ROOT_UUID /mnt\n`;
        }

        if (fw === "uefi") {
            o += `mkdir -p /mnt/efi\nEFI_UUID=$(blkid -s UUID -o value ${partEfi})\nmount UUID=$EFI_UUID /mnt/efi\n`;
        }

        if (swap_size !== "0") {
            if (fs === "btrfs") o += `btrfs filesystem mkswapfile --size ${swap_size} /mnt/swapfile\n`;
            else o += `fallocate -l ${swap_size} /mnt/swapfile\nchmod 600 /mnt/swapfile\nmkswap /mnt/swapfile\n`;
            o += `swapon /mnt/swapfile\n`;
        }

        if (useCustomScripts && arss_tools.includes("iso-verifier")) {
            if (!cmdOnly) o += `\`\`\`\n\n## ISO Verification\n> *It is highly recommended to verify the Arch ISO integrity before installing.*\n\`\`\`bash\n`;
            o += `curl -sLO https://geo.mirror.pkgbuild.com/iso/latest/sha256sums.txt\n`;
            o += `echo "Verifying ISO Hash..."\n`;
            o += `sha256sum -c sha256sums.txt --ignore-missing || { echo "ISO HASH VERIFICATION FAILED!"; exit 1; }\n`;
        }

        if (!cmdOnly) o += `\`\`\`\n\n## 2. Base Installation\n\`\`\`bash\n`;
        else o += `\n# 2. Base Installation\n`;

        let cpuPkg = cpu_brand === "amd" ? "amd-ucode" : (cpu_brand === "intel" ? "intel-ucode" : "");
        let gpuPkg = "";
        if (gpu_brand === "amd") gpuPkg = "mesa xf86-video-amdgpu vulkan-radeon";
        else if (gpu_brand === "intel") gpuPkg = "mesa xf86-video-intel vulkan-intel";
        else if (gpu_brand === "nvidia") gpuPkg = (software_type === "libre" || software_type === "opensource") ? "mesa xf86-video-nouveau" : "nvidia nvidia-utils";
        else if (gpu_brand === "vm") gpuPkg = "spice-vdagent xf86-video-qxl";

        let vmPkg = vm_guest === "vbox" ? "virtualbox-guest-utils" : (vm_guest === "vmware" ? "open-vm-tools" : (vm_guest === "qemu" ? "qemu-guest-agent" : ""));
        let adminTools = software_type === "libre" ? "opendoas pfetch cronie" : "sudo fastfetch cronie";
        let fsPkg = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");
        let allKernels = kernelMain + " " + kernelMain + "-headers";
        if (kernelBackup !== "none") allKernels += " " + kernelBackup + " " + kernelBackup + "-headers";

        o += `pacstrap -K /mnt base ${allKernels} ${cpuPkg} ${gpuPkg} ${vmPkg} linux-firmware neovim ${adminTools} git ${fsPkg}\n`;
        o += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
          
          if (isoVerify === 'yes') {
              o += `\n# ==========================================\n`;
              o += `# Live ISO Integrity Verifier (Ventoy/Rufus)\n`;
              o += `# ==========================================\n`;
              o += `echo -e "\\e[38;2;122;162;247m>> Verifying booted Arch Linux medium integrity...\\e[0m"\n`;
              o += `pacman-key --init >/dev/null 2>&1 && pacman-key --populate archlinux >/dev/null 2>&1\n`;
              o += `\n# Download latest Arch Linux release signatures\n`;
              o += `curl -sLO https://archlinux.org/iso/latest/archlinux-x86_64.iso.sig\n`;
              o += `\n# Detect boot medium (Ventoy partition vs Rufus/dd block device)\n`;
              o += `BOOT_DEV=$(findmnt -n -o SOURCE /run/archiso/bootmnt || echo "")\n`;
              o += `if [[ -n "$BOOT_DEV" ]]; then\n`;
              o += `  echo "Detected boot device: $BOOT_DEV"\n`;
              o += `  # Attempt to verify the raw block device (Rufus/Balena dd mode)\n`;
              o += `  if gpg --verify archlinux-x86_64.iso.sig "$BOOT_DEV" 2>/dev/null; then\n`;
              o += `    echo -e "\\e[32m[PASS] Integrity Verified! Your booted medium is officially signed by Arch Linux.\\e[0m"\n`;
              o += `  else\n`;
              o += `    echo -e "\\e[33m[WARN] Raw block device verification failed. Checking for Ventoy/ISO files...\\e[0m"\n`;
              o += `    ISO_FILE=$(find /run/archiso/bootmnt -maxdepth 3 -name "archlinux*.iso" 2>/dev/null | head -n 1)\n`;
              o += `    if [[ -n "$ISO_FILE" ]]; then\n`;
              o += `      if gpg --verify archlinux-x86_64.iso.sig "$ISO_FILE"; then\n`;
              o += `        echo -e "\\e[32m[PASS] ISO Integrity Verified! Your booted medium is secure.\\e[0m"\n`;
              o += `      else\n`;
              o += `        echo -e "\\e[31m[ERROR] ISO Signature verification failed! Your boot medium may be compromised.\\e[0m"\n`;
              o += `        read -p "Press Enter to acknowledge and continue at your own risk, or Ctrl+C to abort..." ack\n`;
              o += `      fi\n`;
              o += `    else\n`;
              o += `      echo -e "\\e[33m[WARN] Could not locate base ISO file to verify.\\e[0m"\n`;
              o += `    fi\n`;
              o += `  fi\n`;
              o += `else\n`;
              o += `  echo -e "\\e[33m[WARN] Could not detect archiso bootmnt. Skipping verification.\\e[0m"\n`;
              o += `fi\n`;
          }

        if (cmdOnly) {
            o += `\ncat << 'EOF' > /mnt/chroot_script.sh\n#!/bin/bash\nexport COLOR_BLUE="\\e[38;2;122;162;247m"\nexport COLOR_RESET="\\e[0m"\n`;
            o += `echo -e "\${COLOR_BLUE}>> ENTERING CHROOT: Post-Install Configuration...\${COLOR_RESET}"\n`;
            
                // Interactive prompts for root and user (Passwords are never stored in plaintext)
                o += `\n# Set Root Password\n`;
                if (!cmdOnly) {
                    o += `> **Note:** The passwords below are censored in this guide for your security.\n\n`
                    o += `passwd root\n`;
                } else {
                    o += `echo "root:$ROOT_PASS" | chpasswd\n`;
                }

                for (let u = 1; u <= user_count; u++) {
                    o += `\n# Set User ${u} Account\n`;
                    if (!cmdOnly) {
                        o += `useradd -m -G wheel -s /bin/bash "${gv('user_name_'+u, 'user'+u)}"\n`;
                        o += `passwd "${gv('user_name_'+u, 'user'+u)}"\n`;
                    } else {
                        if (configMode === 'preconfigured') {
                            o += `useradd -m -G wheel -s /bin/bash "$USER_NAME_${u}"\n`;
                            o += `echo "$USER_NAME_${u}:$USER_PASS_${u}" | chpasswd\n`;
                        } else {
                            o += `read -p "Enter Username ${u}: " u${u}\n`;
                            o += `useradd -m -G wheel -s /bin/bash "$u${u}"\n`;
                            o += `read -s -p "Enter password for $u${u}: " upass\necho\n`;
                            o += `read -s -p "Confirm password for $u${u}: " upass2\necho\n`;
                            o += `if [ "$upass" = "$upass2" ]; then echo "$u${u}:$upass" | chpasswd; else echo "Passwords do not match!"; exit 1; fi\n`;
                        }
                    }
                }

            
            o += `echo -e "\\n\\e[38;2;247;118;142m>> Interactive Configuration\\e[0m"\n`;
            
            if (configMode === 'interactive') {
                o += `read -p "Install JetBrains Mono & Terminal Themes? (y/N): " setup_themes\n`;
                o += `if [[ "$setup_themes" =~ ^[Yy]$ ]]; then\n`;
                o += `  pacman -S --noconfirm ttf-jetbrains-mono ttf-jetbrains-mono-nerd\n`;
                o += `  echo "Available Themes: 1) Tokyo Night  2) Dracula  3) Gruvbox  4) Nordic"\n`;
                o += `  read -p "Select Theme (1-4): " theme_sel\n`;
                o += `  case "$theme_sel" in\n`;
                o += `    1) THEME="tokyonight" ;;\n`;
                o += `    2) THEME="dracula" ;;\n`;
                o += `    3) THEME="gruvbox" ;;\n`;
                o += `    4) THEME="nordic" ;;\n`;
                o += `    *) THEME="tokyonight" ;;\n`;
                o += `  esac\n`;
                o += `  echo "Theme $THEME selected (Configuration will be applied via dotfiles / user bashrc)"\n`;
                o += `fi\n`;
            } else {
                o += `\n# Install JetBrains Mono & Theme (Pre-configured)\n`;
                o += `pacman -S --noconfirm ttf-jetbrains-mono ttf-jetbrains-mono-nerd\n`;
                o += `THEME="${advThemeMode}"\n`;
                o += `echo "Theme $THEME selected (Configuration will be applied via dotfiles / user bashrc)"\n`;
            }

        } else {
            o += `arch-chroot /mnt\n`;
        }

        if (software_type === "libre") o += `echo "permit persist :wheel" > /etc/doas.conf\nln -s /usr/bin/doas /usr/bin/sudo\n`;
        else o += `echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel\n`;

        if (!cmdOnly) o += `\`\`\`\n\n## 3. Initramfs\n\`\`\`bash\n`;
        else o += `\n# 3. Initramfs\n`;

        let baseHooks = initSys === "systemd" ? "base systemd autodetect microcode modconf kms keyboard sd-vconsole block" : "base udev autodetect microcode modconf kms keyboard keymap consolefont block";
        let cryptoHook = part !== "unencrypted" ? (initSys === "systemd" ? "sd-encrypt" : "encrypt") : "";
        let lvmHook = part.includes("lvm") ? "lvm2" : "";
        let fsHook = fs === "btrfs" ? "btrfs filesystems fsck" : "filesystems fsck";
        let hooks = [baseHooks, cryptoHook, lvmHook, fsHook].filter(h => h).join(" ");
        o += `sed -i 's/^HOOKS=.*/HOOKS=(${hooks})/' /etc/mkinitcpio.conf\nmkinitcpio -P\n`;

        if (!cmdOnly) o += `\`\`\`\n\n## 4. Bootloader (${boot})\n\`\`\`bash\n`;
        else o += `\n# 4. Bootloader\n`;

        if (fw === "bios" || boot.includes("grub")) {
            o += `pacman -S --noconfirm grub efibootmgr\n`;
            o += fw === "uefi" ? `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n` : `grub-install --target=i386-pc ${disk}\n`;
            if (part !== "unencrypted") {
                o += `LUKS_UUID=$(blkid -s UUID -o value ${partRoot})\n`;
                o += `sed -i "s|^GRUB_CMDLINE_LINUX=.*|GRUB_CMDLINE_LINUX=\\"cryptdevice=UUID=$LUKS_UUID:cryptroot root=/dev/mapper/cryptroot\\"|" /etc/default/grub\n`;
                o += `echo "GRUB_ENABLE_CRYPTODISK=y" >> /etc/default/grub\n`;
            }
            o += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
        } else if (boot.includes("uki")) {
            o += `pacman -S --noconfirm sbsigntools efitools efibootmgr\n`;
            if (boot === "uki-shim") o += `pacman -S --noconfirm shim-signed\ncp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/bootx64.efi\n`;
        } else if (boot === "systemd-boot") {
            o += `bootctl install --esp-path=/efi\n`;
        }

        if (!cmdOnly) o += `\`\`\`\n\n## 5. DNS (${dns})\n\`\`\`bash\n`;
        else o += `\n# 5. DNS\n`;

        if (dns === "unbound") o += `pacman -S --noconfirm unbound\nsystemctl enable unbound\n`;
        else if (dns === "dnscrypt-proxy") o += `pacman -S --noconfirm dnscrypt-proxy\nsystemctl enable dnscrypt-proxy\n`;
        else if (dns === "bind") o += `pacman -S --noconfirm bind\nsystemctl enable named\n`;
        else if (dns === "dnsmasq") o += `pacman -S --noconfirm dnsmasq\nsystemctl enable dnsmasq\n`;
        else o += `systemctl enable systemd-resolved\n`;

        if (!cmdOnly) o += `\`\`\`\n\n## 6. Desktop & Apps\n\`\`\`bash\n`;
        else o += `\n# 6. Desktop & Apps\n`;
        
        o += `\n### POST-INSTALL BOUNDARY ###\n`;

        // AUR
        const needsAUR = post_apps.length > 0 || desktop === "dusky";
        if (needsAUR) {
            o += `pacman -S --noconfirm git base-devel\nuseradd -m -G wheel -s /bin/bash builder\necho "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder\n`;
            o += `su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"\n`;
        }

        // Apps
        const aurApps = ['librewolf','signal','tor-browser','vscodium','timeshift','ungoogled-chromium'];
        const pacApps = {
            firefox:'firefox', neovim:'neovim git ripgrep fd', alacritty:'alacritty',
            zsh:'zsh zsh-completions', thunar:'thunar gvfs thunar-volman', mpv:'mpv',
            obs:'obs-studio', keepassxc:'keepassxc', flatpak:'flatpak',
            chromium:'chromium', kitty:'kitty', git:'git', tmux:'tmux', htop:'htop',
            nautilus:'nautilus', vlc:'vlc', gimp:'gimp', libreoffice:'libreoffice-fresh',
            networkmanager:'networkmanager', bluetooth:'bluez bluez-utils',
            pipewire:'pipewire pipewire-pulse pipewire-alsa wireplumber',
            clamav:'clamav', firejail:'firejail', doas:'opendoas',
            openssh:'openssh', snapper:'snapper snap-pac grub-btrfs',
            pfetch:'pfetch', fastfetch:'fastfetch',
        };
        post_apps.forEach(app => {
            if (app === 'paru') return; // already installed
            if (aurApps.includes(app)) {
                let pkg = app;
                if (app === 'signal') pkg = 'signal-desktop';
                if (app === 'ungoogled-chromium') pkg = 'ungoogled-chromium-bin';
                o += `su - builder -c "paru -S --noconfirm ${pkg}"\n`;
            }
            else if (pacApps[app]) o += `pacman -S --noconfirm ${pacApps[app]}\n`;
        });
        // Post-install service enables & extra setup
        if (post_apps.includes('flatpak')) o += `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo\n`;
        if (post_apps.includes('zsh')) o += `chsh -s /bin/zsh\n`;
        if (post_apps.includes('networkmanager')) o += `systemctl enable --now NetworkManager\n`;
        if (post_apps.includes('bluetooth')) o += `systemctl enable --now bluetooth\n`;
        if (post_apps.includes('pipewire')) o += `systemctl --user enable --now pipewire pipewire-pulse wireplumber\n`;
        if (post_apps.includes('clamav')) o += `freshclam\nsystemctl enable --now clamav-freshclam\n`;
        
        if (post_apps.includes('doas')) {
            o += `\n# Configure Doas\n`;
            o += `echo "permit persist :wheel" > /etc/doas.conf\n`;
            o += `chown -c root:root /etc/doas.conf\n`;
            o += `chmod -c 0400 /etc/doas.conf\n`;
            
            if (configMode === 'interactive') {
                o += `\n# Interactive Doas Wrapper Prompt\n`;
                o += `doas_prompt() {\n`;
                o += `  exec < /dev/tty\n`;
                o += `  echo -e "\\n\\e[38;2;122;162;247m======================================\\e[0m"\n`;
                o += `  echo "Doas Configuration"\n`;
                o += `  echo -e "\\e[38;2;122;162;247m======================================\\e[0m"\n`;
                o += `  read -p "Do you want to fully replace Sudo with a Doas Wrapper? (y/n): " ans\n`;
                o += `  if [[ "$ans" =~ ^[Yy]$ ]]; then\n`;
                o += `    echo "Fully replacing sudo..."\n`;
                o += `    pacman -Rdd --noconfirm sudo || true\n`;
                o += `    cat << 'EOF' > /usr/local/bin/sudo\n#!/bin/bash\n# Doas Wrapper script\nargs=()\nfor arg in "$@"; do\n  if [[ "$arg" == "-E" ]]; then continue; fi\n  if [[ "$arg" == "-i" ]]; then args+=("-s"); continue; fi\n  if [[ "$arg" == "-v" ]]; then doas -C /etc/doas.conf; exit $?; fi\n  args+=("$arg")\ndone\nexec /usr/bin/doas "\${args[@]}"\nEOF\n`;
                o += `    chmod +x /usr/local/bin/sudo\n`;
                o += `    ln -sf /usr/local/bin/sudo /usr/bin/sudo\n`;
                o += `  else\n`;
                o += `    echo "Keeping standard sudo alongside doas."\n`;
                o += `  fi\n`;
                o += `}\n`;
                o += `doas_prompt\n`;
            } else {
                if (advDoasMode === 'replace') {
                    o += `\n# Fully Replace Sudo with Doas Wrapper (Pre-configured)\n`;
                    o += `pacman -Rdd --noconfirm sudo || true\n`;
                    o += `cat << 'EOF' > /usr/local/bin/sudo\n#!/bin/bash\n# Doas Wrapper script\nargs=()\nfor arg in "$@"; do\n  if [[ "$arg" == "-E" ]]; then continue; fi\n  if [[ "$arg" == "-i" ]]; then args+=("-s"); continue; fi\n  if [[ "$arg" == "-v" ]]; then doas -C /etc/doas.conf; exit $?; fi\n  args+=("$arg")\ndone\nexec /usr/bin/doas "\${args[@]}"\nEOF\n`;
                    o += `chmod +x /usr/local/bin/sudo\n`;
                    o += `ln -sf /usr/local/bin/sudo /usr/bin/sudo\n`;
                } else if (advDoasMode === 'remove') {
                    o += `\n# Remove Sudo entirely (Pre-configured)\n`;
                    o += `pacman -Rdd --noconfirm sudo || true\n`;
                }
            }
        }

        // Desktop environments
        const dsXorg = (displayServer === "auto" && (desktop === "dusky" || desktop === "dwm")) || displayServer === "xorg";
        if (desktop === "gnome") { o += `pacman -S --noconfirm gnome gnome-tweaks ${dsXorg ? 'xorg-server' : 'wayland'}\nsystemctl enable gdm\n`; }
        else if (desktop === "kde") { o += `pacman -S --noconfirm plasma-desktop sddm ${dsXorg ? 'xorg-server' : 'wayland'}\nsystemctl enable sddm\n`; }
        else if (desktop === "dwm") { o += `pacman -S --noconfirm xorg-server xorg-xinit base-devel libx11 libxinerama libxft\ngit clone https://git.suckless.org/dwm /usr/local/src/dwm && cd /usr/local/src/dwm && make install\n`; }
        else if (desktop === "dusky") {
            o += dsXorg ? `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\n` : `pacman -S --noconfirm git base-devel wayland xorg-xwayland\n`;
            o += software_type === "libre"
                ? `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && sed -i 's/sudo/doas/g' install.sh && ./install.sh"\n`
                : `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\n`;
        }

        // Browser (from browser dropdown, separate from post_apps)
        if (browser === "librewolf") o += `su - builder -c "paru -S --noconfirm librewolf"\n`;
        else if (browser === "firefox") o += `pacman -S --noconfirm firefox\n`;



        // Hardened OpenSSH setup
        if (post_apps.includes('openssh')) {
            if (!cmdOnly) o += `\`\`\`\n\n### OpenSSH Server Setup (Hardened)\n\`\`\`bash\n`;
            else o += `\n# OpenSSH Ã¢â‚¬â€ Hardened Setup\n`;
            o += `# Generate Ed25519 host keys\n`;
            o += `ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""\n`;
            o += `rm -f /etc/ssh/ssh_host_rsa_key /etc/ssh/ssh_host_dsa_key /etc/ssh/ssh_host_ecdsa_key\n`;
            o += `# Harden sshd_config\n`;
            o += `cat > /etc/ssh/sshd_config << 'SSHD'\n`;
            o += `Port 22\nAddressFamily inet\nListenAddress 0.0.0.0\n`;
            o += `HostKey /etc/ssh/ssh_host_ed25519_key\nKexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org\n`;
            o += `Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com\nMACs hmac-sha2-512-etm@openssh.com\n`;
            o += `PermitRootLogin no\nPasswordAuthentication no\nKbdInteractiveAuthentication no\n`;
            o += `AuthenticationMethods publickey\nPubkeyAuthentication yes\n`;
            o += `X11Forwarding no\nAllowTcpForwarding no\nPermitTunnel no\nGatewayPorts no\n`;
            o += `MaxAuthTries 3\nLoginGraceTime 30\nClientAliveInterval 300\nClientAliveCountMax 2\n`;
            o += `AllowAgentForwarding no\nUsePAM yes\nPrintMotd no\n`;
            o += `SSHD\n`;
            o += `# Generate user SSH key pair (Ed25519)\n`;
            o += `USER_SSH_DIR="/home/$NEWUSER/.ssh"\n`;
            o += `mkdir -p "$USER_SSH_DIR" && chmod 700 "$USER_SSH_DIR"\n`;
            o += `ssh-keygen -t ed25519 -f "$USER_SSH_DIR/id_ed25519" -C "$NEWUSER@arch" -N ""\n`;
            o += `cat "$USER_SSH_DIR/id_ed25519.pub" >> "$USER_SSH_DIR/authorized_keys"\n`;
            o += `chmod 600 "$USER_SSH_DIR/authorized_keys"\nchown -R "$NEWUSER:$NEWUSER" "$USER_SSH_DIR"\n`;
            o += `systemctl enable sshd.service\n`;
            o += `echo "# SSH private key saved: $USER_SSH_DIR/id_ed25519"\n`;
            o += `echo "# Copy id_ed25519 to your client machine before rebooting!"\n`;
            if (!cmdOnly) o += `\`\`\`\n\n> Ã¢Å¡Â Ã¯Â¸Â **Save your SSH private key** (\`~/.ssh/id_ed25519\`) to your client machine before rebooting. Password auth is disabled.\n\n`;
        }

        // Snapper hooks
        if (post_apps.includes('snapper')) {
            o += `# Snapper BTRFS snapshot config\n`;
            o += `snapper -c root create-config /\n`;
            
            if (configMode === 'interactive') {
                o += `\n# Interactive Snapper Timeline Prompt\n`;
                o += `snapper_prompt() {\n`;
                o += `  exec < /dev/tty\n`;
                o += `  echo -e "\\n\\e[38;2;122;162;247m======================================\\e[0m"\n`;
                o += `  echo "Snapper Timeline Configuration"\n`;
                o += `  echo -e "\\e[38;2;122;162;247m======================================\\e[0m"\n`;
                o += `  read -p "Do you want to enable automatic hourly/daily timeline snapshots? (y/n): " ans\n`;
                o += `  if [[ "$ans" =~ ^[Yy]$ ]]; then\n`;
                o += `    echo "Enabling timeline snapshots..."\n`;
                o += `    systemctl enable --now snapper-timeline.timer snapper-cleanup.timer\n`;
                o += `  else\n`;
                o += `    echo "Timeline disabled. Pre/Post pacman snapshots only."\n`;
                o += `  fi\n`;
                o += `}\n`;
                o += `snapper_prompt\n`;
            } else {
                if (advSnapperMode === 'timeline') {
                    o += `systemctl enable --now snapper-timeline.timer snapper-cleanup.timer\n`;
                } else {
                    o += `# Timeline snapshots disabled by user selection.\n`;
                }
            }

            o += `# Install grub-btrfs for rollback menu\n`;
            o += `systemctl enable --now grub-btrfsd.service\n`;
        } else if (fs === "btrfs") {
            o += `snapper -c root create-config /\nsystemctl enable snapper-timeline.timer snapper-cleanup.timer\n`;
        }

        // pfetch / fastfetch shell greeting
        if (post_apps.includes('fastfetch') || post_apps.includes('pfetch')) {
            const fetchCmd = post_apps.includes('fastfetch') ? 'fastfetch' : 'pfetch';
            o += `# Add system info greeting to shell\necho '${fetchCmd}' >> /etc/profile.d/greeting.sh\n`;
        }

        // Dusky OS auto-setup
        if (post_apps.includes('dusky-setup')) {
            if (!cmdOnly) o += `\n### Dusky OS Auto-Setup\n> Watch the [YouTube guide](https://www.youtube.com/watch?v=JmgvSdEIK8c) and read the [dusky repo](https://github.com/dusklinux/dusky) cheatsheet before running.\n\n\`\`\`bash\n`;
            else o += `\n# Dusky OS Auto-Setup (by dusklinux)\n# Watch: https://www.youtube.com/watch?v=JmgvSdEIK8c\n# Repo:  https://github.com/dusklinux/dusky\n`;
            o += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\n`;
            if (!cmdOnly) o += `\`\`\`\n\n> Ã°Å¸â€œâ€¹ **Cheatsheet**: \`/tmp/dusky/cheatsheet.md\` Ã¢â‚¬â€ Hyprland keybinds and workflow\n`;
        }

        if (vm_guest === "vbox") o += `systemctl enable vboxservice.service\n`;
        else if (vm_guest === "vmware") o += `systemctl enable vmtoolsd.service\n`;
        else if (vm_guest === "qemu") o += `systemctl enable qemu-guest-agent.service\n`;
        if (needsAUR) o += `userdel -r builder\nrm -f /etc/sudoers.d/builder\n`;

        // Security tools (now Arch Rusty Security Suite)
        if (useCustomScripts && arss_tools.length > 0) {
            if (!cmdOnly) o += `\`\`\`\n\n## 7. Arch Rusty Security Suite by tilas01\n\`\`\`bash\n`;
            else o += `\n# 7. Arch Rusty Security Suite\n`;
            o += `# Download the latest release from GitHub\n`;
            o += `SUITE_VERSION=$(curl -s "https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)\n`;
            o += `curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64"\n`;
            o += `curl -LO "https://github.com/tilas01/arch-guides-dynamic/releases/download/$SUITE_VERSION/arch-rusty-security-suite-linux-x86_64.sha256"\n`;
            o += `echo "Verifying integrity..."\nsha256sum -c arch-rusty-security-suite-linux-x86_64.sha256\n`;
            o += `chmod +x arch-rusty-security-suite-linux-x86_64\n`;
            o += `cp arch-rusty-security-suite-linux-x86_64 /usr/local/bin/arch-rusty-security-suite\n`;

            if (arss_tools.includes("webhooks")) {
                o += `\n# Configuring Webhooks\nmkdir -p /etc/arch-security/\ncat << 'WH' > /etc/arch-security/webhook.conf\nPROVIDER=${webhook_provider}\nURL=${webhook_url}\nWH\n`;
                o += `arch-rusty-security-suite webhooks --install-service\n`;
            }
            if (arss_tools.includes("libre-otp")) {
                let otpOpts = `--setup --mode ${libreOtpMode} --hash ${otp_sha} --recovery-codes ${otp_recovery}`;
                if (otp_bypass !== "0" && otp_bypass !== "") otpOpts += ` --bypass-uses ${otp_bypass}`;
                if (otp_double === "yes") otpOpts += ` --double-otp`;
                o += `\n# Configuring Libre OTP\narch-rusty-security-suite libre-otp ${otpOpts}\n`;
                o += `\n# Injecting Libre OTP into PAM\n`;
                if (libreOtpMode === "boot" || libreOtpMode === "both" || libreOtpMode === "all") {
                    o += `echo 'auth required pam_exec.so expose_authtok quiet /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/system-auth\n`;
                    o += `echo 'auth required pam_exec.so expose_authtok quiet /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/su\n`;
                    o += `echo 'auth required pam_exec.so expose_authtok quiet /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sudo\n`;
                }
                if (libreOtpMode === "ssh" || libreOtpMode === "both" || libreOtpMode === "all") {
                    o += `echo 'auth required pam_exec.so expose_authtok quiet /usr/local/bin/arch-rusty-security-suite otp' >> /etc/pam.d/sshd\n`;
                }
            }
            if (arss_tools.includes("panic-password")) {
                o += `\n# Configuring Panic Password\narch-rusty-security-suite panic --setup\n`;
            }
            if (arss_tools.includes("evil-maid")) {
                if (cmdOnly) {
                    o += `\n# Configuring Anti-Evil Maid (Interactive)\n`;
                    o += `echo -e "\\n\\e[38;2;247;118;142m>> Anti-Evil Maid Configuration\\e[0m"\n`;
                    o += `echo "Decoy Kernels setup:"\n`;
                    o += `echo "1) 1 Decoy Kernel"\n`;
                    o += `echo "2) 2 Decoy Kernels"\n`;
                    o += `echo "3) Random (Cryptographically secure selection)"\n`;
                    o += `read -p "Select Decoy Mode (1-3): " aem_decoy_mode\n`;
                    o += `case "$aem_decoy_mode" in\n`;
                    o += `  1) DECOY_MODE="--decoy-count 1" ;;\n`;
                    o += `  2) DECOY_MODE="--decoy-count 2" ;;\n`;
                    o += `  3) DECOY_MODE="--decoy-count random" ;;\n`;
                    o += `  *) DECOY_MODE="--decoy-count 1" ;;\n`;
                    o += `esac\n`;
                    o += `arch-rusty-security-suite aem --setup --main-kernel ${aem_main} --backup-kernel ${aem_backup} $DECOY_MODE\n`;
                } else {
                    o += `\n# Configuring Anti-Evil Maid\narch-rusty-security-suite aem --setup --main-kernel ${aem_main} --backup-kernel ${aem_backup} --decoy-count 1\n`;
                }
                
                o += `cat << 'AEM_DAEMON' > /etc/systemd/system/arss-aem.service\n[Unit]\nDescription=ARSS Anti-Evil Maid Daemon\nAfter=network.target\n\n[Service]\nExecStart=/usr/local/bin/arch-rusty-security-suite aem --daemon\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nAEM_DAEMON\n`;
                o += `systemctl enable arss-aem.service\n`;
                
                // Add regular file system hash checks via cron
                o += `cat << 'AEM_HASH' > /usr/local/bin/arss-fs-hash-check.sh\n#!/bin/bash\n`;
                o += `arch-rusty-security-suite aem --fs-hash-check >> /var/log/arss-fs-hash.log 2>&1\nAEM_HASH\n`;
                o += `chmod +x /usr/local/bin/arss-fs-hash-check.sh\n`;
                o += `(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/arss-fs-hash-check.sh") | crontab -\n`;
            }
            if (arss_tools.includes("anti-ducky")) {
                o += `\n# Configuring Input Guard (Anti-Ducky)\narch-rusty-security-suite ducky --approve-current\n`;
            }
            if (arss_tools.includes("hardened-ssh")) {
                o += `\n# Hardening SSH Server\narch-rusty-security-suite ssh --harden\n`;
            }
            if (arss_tools.includes("kloak")) {
                o += `\n# Installing Kloak (Keystroke Anonymisation)\npacman -S --noconfirm kloak\nsystemctl enable kloak\n`;
            }
            if (arss_tools.includes("kernel-watcher")) {
                o += `\n# Configuring Kernel Watcher (Semi-EDR)\nkernel-watcher --setup\n`;
                o += `cat << 'EOF' > /etc/systemd/system/arss-kernel-watcher.service\n[Unit]\nDescription=ARSS Kernel Watcher EDR Daemon\nAfter=network.target\n\n[Service]\nExecStart=/usr/local/bin/kernel-watcher\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF\n`;
                o += `systemctl enable arss-kernel-watcher.service\n`;
            }
            if (arss_tools.includes("scarecrow")) {
                o += `\n# Configuring Libre-Cyber-ScareCrow (Sandbox Spoofing)\n`;
                o += `cat << 'EOF' > /etc/systemd/system/arss-scarecrow.service\n[Unit]\nDescription=Libre-Cyber-ScareCrow Sandbox Spoofing\nAfter=network.target\n\n[Service]\nExecStart=/usr/local/bin/arch-rusty-security-suite scarecrow\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF\n`;
                o += `systemctl enable arss-scarecrow.service\n`;
            }
        }

        // Other Security Tools (independent of ARSS)
        if (otherSecTools !== 'no') {
            if (!cmdOnly) o += `\`\`\`\n\n## 9. Other Security Hardening\n\`\`\`bash\n`;
            else o += `\n# 9. Other Security Tools\n`;
            const installAll = otherSecTools === 'all';
            if (installAll || otherSecTools === 'apparmor') {
                o += `pacman -S --noconfirm apparmor\nsed -i 's/^GRUB_CMDLINE_LINUX="/GRUB_CMDLINE_LINUX="apparmor=1 lsm=landlock,lockdown,yama,apparmor,bpf /' /etc/default/grub\nsystemctl enable apparmor\n`;
            }
            if (installAll || otherSecTools === 'usbguard') {
                o += `pacman -S --noconfirm usbguard\nusbguard generate-policy > /etc/usbguard/rules.conf\nsystemctl enable --now usbguard\n`;
            }
            if (installAll || otherSecTools === 'auditd') {
                o += `pacman -S --noconfirm audit\nsystemctl enable --now auditd\necho '-w /etc/passwd -p wa -k passwd_changes' >> /etc/audit/rules.d/audit.rules\necho '-w /etc/sudoers -p wa -k sudoers_changes' >> /etc/audit/rules.d/audit.rules\n`;
            }
            if (installAll || otherSecTools === 'fail2ban') {
                o += `pacman -S --noconfirm fail2ban\ncat > /etc/fail2ban/jail.local << 'F2B'\n[DEFAULT]\nbantime = 3600\nfindtime = 600\nmaxretry = 3\n[sshd]\nenabled = true\nF2B\nsystemctl enable --now fail2ban\n`;
            }
        }

        if (secTools !== "none") {
            if (!cmdOnly) o += `\`\`\`\n\n## 9. Verify Arch ISO USB Integrity\n\`\`\`bash\n`;
            else o += `\n# 9. ISO Verification\n`;
            o += `# Verify the Arch ISO on USB that was used for this install\n`;
            o += `arch-rusty-security-suite verify-iso /dev/sr0  # or USB path\n`;
        }

        if (auto_updates === "yes" || post_apps.includes("unattended-upgrades")) {
            if (!cmdOnly) o += `\`\`\`\n\n## 10. Auto Updates\n\`\`\`bash\n`;
            else o += `\n# 10. Auto Updates\n`;
            o += `systemctl enable cronie\n`;
            if (post_apps.includes("unattended-upgrades")) {
                o += `su - builder -c "paru -S --noconfirm unattended-upgrades"\n`;
                o += `mkdir -p /etc/unattended-upgrades\n`;
                o += `cat << 'UPCONF' > /etc/unattended-upgrades/unattended-upgrades.conf\n`;
                o += `Unattended-Upgrade::Automatic-Reboot "true";\n`;
                o += `Unattended-Upgrade::Automatic-Reboot-Time "03:00";\n`;
                o += `UPCONF\n`;
                o += `systemctl enable --now unattended-upgrades.timer\n`;
            } else {
                o += `cat << 'CRON_SCRIPT' > /usr/local/bin/auto-update.sh\n#!/bin/bash\n`;
                o += `echo "[$(date)] Starting full system auto-update..." >> /var/log/auto-update.log\n`;
                o += `pacman -Syu --noconfirm >> /var/log/auto-update.log 2>&1\n`;
                o += `if id "builder" >/dev/null 2>&1 && command -v paru >/dev/null 2>&1; then\n`;
                o += `  su - builder -c "paru -Sua --noconfirm" >> /var/log/auto-update.log 2>&1\n`;
                o += `fi\n`;
                o += `echo "[$(date)] System update complete." >> /var/log/auto-update.log\n`;
                o += `# If system is inactive (0 users logged in), reboot to apply kernel/systemd updates\n`;
                o += `if [ "$(who | wc -l)" -eq 0 ]; then\n`;
                o += `  echo "[$(date)] System inactive. Rebooting to apply updates..." >> /var/log/auto-update.log\n`;
                o += `  reboot\n`;
                o += `fi\n`;
                o += `CRON_SCRIPT\nchmod +x /usr/local/bin/auto-update.sh\n(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auto-update.sh") | crontab -\n`;
            }
        }

        // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Download Cheatsheets ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
        if (cmdOnly) {
            o += `\n# Downloading Cheatsheets\n`;
            o += `mkdir -p /home/$u1/cheatsheets\n`;
            o += `curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/arch-commands.md" -o /home/$u1/cheatsheets/arch-commands.md\n`;
            if (desktop === 'dusky') {
                o += `curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/duskyos-hyprland.md" -o /home/$u1/cheatsheets/duskyos-hyprland.md\n`;
            }
            o += `chown -R $u1:$u1 /home/$u1/cheatsheets\n`;
        } else {
            o += `\n### 11. Download Cheatsheets\n\`\`\`bash\nmkdir -p ~/cheatsheets\ncurl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/arch-commands.md" -o ~/cheatsheets/arch-commands.md\n`;
            if (desktop === 'dusky') {
                o += `curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/docs/cheatsheets/duskyos-hyprland.md" -o ~/cheatsheets/duskyos-hyprland.md\n`;
            }
            o += `\`\`\`\n`;
        }

        // Setup Phase 2 Script Rollover
        if (cmdOnly) {
            o += `\ncat << 'ROLLOVER' > /home/$u1/post_boot_setup.sh\n`;
            o += `#!/bin/bash\n`;
            o += `echo -e "\\e[38;2;122;162;247mWelcome to your new Arch Installation!\\e[0m"\n`;
            if (desktop === "dusky") {
                o += `echo "Please log in and run 'Hyprland' to start your desktop environment."\n`;
            }
            o += `echo "Cleaning up installer scripts..."\n`;
            o += `rm -f /home/$u1/post_boot_setup.sh\n`;
            o += `ROLLOVER\n`;
            o += `chmod +x /home/$u1/post_boot_setup.sh\n`;
            o += `chown $u1:$u1 /home/$u1/post_boot_setup.sh\n`;
            // Add execution of rollover to bashrc so it runs on first login
            o += `echo "/home/$u1/post_boot_setup.sh" >> /home/$u1/.bashrc\n`;
            
            o += `EOF\nchmod +x /mnt/chroot_script.sh\narch-chroot /mnt /chroot_script.sh\n`;
            if (cleanup === "yes") o += `arch-chroot /mnt pacman -Scc --noconfirm\nrm -rf /mnt/var/cache/pacman/pkg/* /mnt/tmp/*\n`;
            o += `rm -f /mnt/chroot_script.sh\n`;
            if (configMode === 'preconfigured') {
                o += `echo -e "\\e[33m[!] WALK-AWAY AUTOMATION: Securely wiping credentials from memory...\\e[0m"\n`;
                o += `unset LUKS_PASS LUKS_PASS2 ROOT_PASS ROOT_PASS2\n`;
                for (let u = 1; u <= user_count; u++) {
                    o += `unset USER_NAME_${u} USER_PASS_${u} USER_PASS2_${u}\n`;
                }
            }
            o += `echo -e "\${COLOR_BLUE}>> INSTALL COMPLETE! You may now run 'reboot'\${COLOR_RESET}"\n`;
        } else {
            o += `\`\`\`\n\n---\n*Guide complete. Reboot into your ${desktop !== "none" ? desktop : "TTY"} environment.*\n*Generated by [Arch Guides Dynamic](https://tilas01.github.io/arch-guides-dynamic/) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â by [tilas01](https://github.com/tilas01)*\n`;
        }

        return o;
    }

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Render ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
    // For auto-mode (re-generate on form change): keep output section in whatever state it's in
    // For manual generate: showOutputPage() is called after this function builds the HTML
    const outputSection = document.getElementById('output-section');
    if (auto && outputSection && outputSection.style.display !== 'none') {
        // Stay visible if already showing
    }

    let mdOutput = "", scriptOutput = "";
    if (format === "script" || format === "both") scriptOutput = buildOutput(true);
    if (format === "markdown" || format === "both") mdOutput = buildOutput(false);

    // ISO pre-setup
    let isoHTML = "";
    if (iso_setup === "ssh") isoHTML = `<div class="alert warning"><strong>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¡ Run on Arch ISO first:</strong><pre><code>systemctl start sshd\necho 'root:arch' | chpasswd\nip addr</code></pre></div>`;
    else if (iso_setup === "ssh_curl") isoHTML = `<div class="alert warning"><strong>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¡ Run on Arch ISO first:</strong><pre><code>pacman -Sy --noconfirm curl\nsystemctl start sshd\necho 'root:arch' | chpasswd\nip addr</code></pre></div>`;

    // Ã¢â€â‚¬Ã¢â€â‚¬ Smart Analysis & Proprietary Warnings Ã¢â€â‚¬Ã¢â€â‚¬
    let analysisWarnings = 0;
    let analysisErrors = 0;
    if (selectedPropApps.length > 0 && software_type !== 'libre') {
        let warnStr = `\n\n## Ã¢Å¡Â Ã¯Â¸Â Proprietary Software Notice\n> You have chosen to include software containing proprietary (closed-source) code. Be aware of the following privacy/freedom implications:\n`;
        selectedPropApps.forEach(a => warnStr += `- **${a.toUpperCase()}**: ${propAppsDB[a]}\n`);
        mdOutput += warnStr;
        analysisWarnings += selectedPropApps.length;
    }

    if (selectedPropApps.length > 0 && software_type === 'libre') {
        analysisErrors += 1;
        let conflictStr = `\n\n> [!CAUTION]\n> **LIBRE CONFLICT**: You selected "Fully Libre (Strict)" software type, but included proprietary applications (${selectedPropApps.join(', ')}). Your system will NOT be fully libre!\n`;
        mdOutput += conflictStr;
    }

    let html = isoHTML;

    // ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ BOX 1: Markdown Editor ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬
    if (format === "markdown" || format === "both") {
        html += `
        <div class="output-actions">
            <h3 class="output-title md-edit">ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â  Markdown Guide ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â  Live Editor</h3>
            <div style="display:flex;gap:0.4rem;">
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-md-code').innerText).then(()=>this.textContent='Copied!'); setTimeout(()=>this.textContent='Copy .md',2000)">Copy .md</button>
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-md-code').innerText, 'arch-install.md')">ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¾ .md</button>
            </div>
        </div>
        <pre class="output-box editor-md"><code id="raw-md-code" class="language-markdown" contenteditable="true" oninput="updatePreview()">${escapeHTML(mdOutput)}</code></pre>

        <div class="output-actions">
            <h3 class="output-title md-prev">ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ‚Â Markdown ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Live Preview</h3>
            <h3 class="output-title ssh-cmd">ÃƒÂ°Ã…Â¸Ã¢â‚¬â€œÃ‚Â¥ SSH One-Liner Deploy</h3>
        </div>
        <pre class="output-box oneliner"><code class="language-bash">${escapeHTML(`cat << 'ARCHEOF' > install.sh\n${scriptOutput}\nARCHEOF\nbash install.sh`)}</code></pre>
        `;
    }

    if (format === "script" || format === "both") {
        html += `
        <div class="output-actions" style="margin-top:1.5rem;">
            <h3 class="output-title script-edit">⚡ Bash Script — Live Editor</h3>
            <div style="display:flex;gap:0.4rem;">
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-script-code').innerText).then(()=>this.textContent='Copied!'); setTimeout(()=>this.textContent='Copy .sh',2000)">Copy .sh</button>
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-script-code').innerText, 'arch-install.sh')">💾 .sh</button>
            </div>
        </div>
        <pre class="output-box editor-script"><code id="raw-script-code" class="language-bash" contenteditable="true">${escapeHTML(scriptOutput)}</code></pre>
        `;
    }

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ History + state ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
    document.getElementById('generated-guide').innerHTML = html;
    if (window.Prism) Prism.highlightAll();
    updatePreview();

    if (!auto) {
        saveToHistory(mdOutput, scriptOutput, format);
        
        // Push output into the Live Editor directly
        const uploadEditor = document.getElementById('upload-editor');
        if (uploadEditor) {
            if (format === 'both') {
                uploadEditor.value = mdOutput + '\n\n---\n\n' + scriptOutput;
            } else {
                uploadEditor.value = format === 'script' ? scriptOutput : mdOutput;
            }
            // Trigger input event to update preview
            uploadEditor.dispatchEvent(new Event('input'));
            
            // Show the live editor UI
            document.getElementById('upload-editor-wrapper').style.display = 'block';
            document.getElementById('upload-clear-btn').style.display = 'block';
            
            const statusEl = document.getElementById('upload-status');
            if (statusEl) {
                statusEl.textContent = 'Ã¢Å“â€œ New generation applied to Live Editor.';
                statusEl.style.color = 'var(--accent-green)';
            }
        }

        // Generate .sc config string
        const configJSONText = JSON.stringify(window.getFormValues(), null, 2);
        
        // Inject .sc code block into html
        const scHtml = `
        <div class="output-actions" style="margin-top:1rem;">
            <h3 class="output-title sc-edit" style="color:var(--accent-purple);">Ã¢Å¡â„¢Ã¯Â¸Â Config File (.sc)</h3>
            <div style="display:flex;gap:0.4rem;">
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-sc-code').innerText).then(()=>this.textContent='Copied!'); setTimeout(()=>this.textContent='Copy .sc',2000)">Copy .sc</button>
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;background:var(--accent-purple);color:#000;" onclick="downloadFile(document.getElementById('raw-sc-code').innerText, 'arch-install.sc')">Ã°Å¸â€™Â¾ .sc</button>
            </div>
        </div>
        <pre class="output-box editor-sc"><code id="raw-sc-code" class="language-json" contenteditable="true">${escapeHTML(configJSONText)}</code></pre>
        `;
        document.getElementById('generated-guide').innerHTML += scHtml;
        
        // Populate the download buttons dynamically
        const downloadBtnsContainer = document.getElementById('download-btns');
        if (downloadBtnsContainer) {
            let btnsHTML = '';
            if (format === 'markdown' || format === 'both') {
                btnsHTML += `<button type="button" class="btn tooltip-always" data-title="Ã°Å¸â€œÂ Download Guide" data-desc="Save the step-by-step tutorial as a markdown file." style="width:auto; padding:0.5rem 1.2rem; background:var(--accent-blue); font-size:0.9rem;" onclick="downloadFile(document.getElementById('raw-md-code').innerText, 'arch-install.md')">Ã°Å¸â€™Â¾ .md Guide</button>`;
            }
            if (format === 'script' || format === 'both') {
                btnsHTML += `<button type="button" class="btn tooltip-always" data-title="Ã¢Å¡Â¡ Download Script" data-desc="Save the executable auto-install Bash script." style="width:auto; padding:0.5rem 1.2rem; background:var(--accent-green); color:#000; font-size:0.9rem; font-weight:bold;" onclick="downloadFile(document.getElementById('raw-script-code').innerText, 'arch-install.sh')">Ã°Å¸â€™Â¾ .sh Script</button>`;
            }
            // Always show the .sc config download option
            btnsHTML += `<button type="button" class="btn tooltip-always" data-title="Ã¢Å¡â„¢Ã¯Â¸Â Save Configuration" data-desc="Download your selections as a .sc file so you can upload and restore them later." style="width:auto; padding:0.5rem 1.2rem; background:var(--bg-lighter); border:1px solid var(--accent-cyan); color:var(--accent-cyan); font-size:0.9rem;" onclick="downloadFile(JSON.stringify(window.getFormValues(), null, 2), 'arch-config.sc')">Ã°Å¸â€™Â¾ .sc Config</button>`;
            
            downloadBtnsContainer.innerHTML = btnsHTML;
            if (window.syncTooltipBtn) syncTooltipBtn(); // Re-bind tooltips
        }

        // Ensure Live Preview is visible but do NOT hide generator
        const outputSec = document.getElementById('output-section');
        if (outputSec) {
            outputSec.style.display = 'block';
            // Scroll smoothly to Live Preview
            outputSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// Ã¢â€â‚¬Ã¢â€â‚¬ Form Serialization & Preview Logic Ã¢â€â‚¬Ã¢â€â‚¬
window.getFormValues = function() {
    const data = {
        version: 1,
        generator: "arch-guides-dynamic",
        selects: {},
        inputs: {},
        checkboxes: {}
    };
    document.querySelectorAll('#install-form select').forEach(el => data.selects[el.id] = el.value);
    document.querySelectorAll('#install-form input[type="text"], #install-form input[type="number"]').forEach(el => data.inputs[el.id] = el.value);
    document.querySelectorAll('#install-form input[type="checkbox"]').forEach(el => {
        if (!data.checkboxes[el.name]) data.checkboxes[el.name] = [];
        if (el.checked) data.checkboxes[el.name].push(el.value);
    });
    return data;
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('install-form');
    if (form) {
        form.addEventListener('change', () => {
            const pre = document.getElementById('sc-preview-json');
            if(pre) pre.textContent = JSON.stringify(window.getFormValues(), null, 2);
        });
        // Initial populate
        const pre = document.getElementById('sc-preview-json');
        if(pre) pre.textContent = JSON.stringify(window.getFormValues(), null, 2);
    }

    // Toggle sub-options for Libre-OTP and Doas
    const libreOtpCb = document.getElementById('arss-libre-otp');
    const libreOtpContainer = document.getElementById('arss-otp-options');
    if (libreOtpCb && libreOtpContainer) {
        libreOtpCb.addEventListener('change', () => {
            libreOtpContainer.style.display = libreOtpCb.checked ? 'block' : 'none';
        });
        // Init
        libreOtpContainer.style.display = libreOtpCb.checked ? 'block' : 'none';
    }

    // Modal Config State
    const hiddenStateHtml = `
        <input type="hidden" id="adv_doas_mode" value="both">
        <input type="hidden" id="adv_snapper_mode" value="default">
        <input type="hidden" id="adv_aem_mode" value="1">
        <input type="hidden" id="adv_theme_mode" value="tokyonight">
    `;
    if (!document.getElementById('adv_doas_mode')) {
        document.getElementById('generator-form').insertAdjacentHTML('beforeend', hiddenStateHtml);
    }

    function updateConfigButtons() {
        const doasChecked = document.querySelector('input[name="post_apps"][value="doas"]')?.checked;
        const snapperChecked = document.querySelector('input[name="post_apps"][value="snapper"]')?.checked;
        const aemChecked = document.querySelector('input[name="arss_tools"][value="anti-evil-maid"]')?.checked;
        
        const btnDoas = document.querySelector('.btn-configure[data-app="doas"]');
        const btnSnapper = document.querySelector('.btn-configure[data-app="snapper"]');
        const btnAem = document.querySelector('.btn-configure[data-app="aem"]');
        
        if (btnDoas) btnDoas.style.display = doasChecked ? 'inline-block' : 'none';
        if (btnSnapper) btnSnapper.style.display = snapperChecked ? 'inline-block' : 'none';
        if (btnAem) btnAem.style.display = aemChecked ? 'inline-block' : 'none';
    }

    document.querySelectorAll('input[name="post_apps"], input[name="arss_tools"]').forEach(cb => {
        cb.addEventListener('change', updateConfigButtons);
    });
    updateConfigButtons();

    // Modal Logic
    const modal = document.getElementById('app-config-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalContent = document.getElementById('modal-content-area');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    let currentConfigApp = null;

    document.querySelectorAll('.btn-configure').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentConfigApp = btn.getAttribute('data-app');
            modal.style.display = 'flex';
            
            if (currentConfigApp === 'doas') {
                modalTitle.innerHTML = '⚙️ Configure Doas Wrapper';
                modalDesc.innerHTML = 'Doas Integration Mode. Replace sudo completely or keep both. <a href="wiki.html#advanced-config-doas" target="_blank" style="color:var(--accent-purple);">Wiki Help</a>';
                const currentVal = document.getElementById('adv_doas_mode').value;
                modalContent.innerHTML = `
                    <select id="temp_doas_mode" style="padding:0.5rem; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); border-radius:4px;">
                        <option value="both" ${currentVal==='both'?'selected':''}>Keep Sudo intact alongside Doas</option>
                        <option value="replace" ${currentVal==='replace'?'selected':''}>Fully replace Sudo with Doas wrapper (Symlink)</option>
                        <option value="remove" ${currentVal==='remove'?'selected':''}>Remove Sudo entirely</option>
                    </select>
                `;
            } else if (currentConfigApp === 'snapper') {
                modalTitle.innerHTML = '⚙️ Configure Snapper';
                modalDesc.innerHTML = 'Snapper Timeline Mode. Set how often BTRFS snapshots occur. <a href="wiki.html#advanced-config-snapper" target="_blank" style="color:var(--accent-purple);">Wiki Help</a>';
                const currentVal = document.getElementById('adv_snapper_mode').value;
                modalContent.innerHTML = `
                    <select id="temp_snapper_mode" style="padding:0.5rem; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); border-radius:4px;">
                        <option value="default" ${currentVal==='default'?'selected':''}>Pre/Post Transaction Snapshots Only</option>
                        <option value="timeline" ${currentVal==='timeline'?'selected':''}>Enable Hourly/Daily Timeline Automations</option>
                    </select>
                `;
            } else if (currentConfigApp === 'aem') {
                modalTitle.innerHTML = '⚙️ Configure Anti-Evil Maid';
                modalDesc.innerHTML = 'AEM Decoy Count. Increase for maximum paranoia but slower boot times. <a href="wiki.html#advanced-config-aem" target="_blank" style="color:var(--accent-purple);">Wiki Help</a>';
                const currentVal = document.getElementById('adv_aem_mode').value;
                modalContent.innerHTML = `
                    <select id="temp_aem_mode" style="padding:0.5rem; background:var(--bg-color); color:var(--text-color); border:1px solid var(--border-color); border-radius:4px;">
                        <option value="1" ${currentVal==='1'?'selected':''}>1 Decoy Image (Standard)</option>
                        <option value="2" ${currentVal==='2'?'selected':''}>2 Decoy Images</option>
                        <option value="3" ${currentVal==='3'?'selected':''}>3 Decoy Images (Paranoid)</option>
                    </select>
                `;
            }
        });
    });

    closeModalBtn?.addEventListener('click', () => modal.style.display = 'none');
    saveModalBtn?.addEventListener('click', () => {
        if (currentConfigApp === 'doas') {
            document.getElementById('adv_doas_mode').value = document.getElementById('temp_doas_mode').value;
        } else if (currentConfigApp === 'snapper') {
            document.getElementById('adv_snapper_mode').value = document.getElementById('temp_snapper_mode').value;
        } else if (currentConfigApp === 'aem') {
            document.getElementById('adv_aem_mode').value = document.getElementById('temp_aem_mode').value;
        }
        modal.style.display = 'none';
    });

    // Dynamic Proprietary Highlighting Logic
    const softwareTypeSelect = document.getElementById('software_type');
    const propAppValues = ['firefox', 'chromium', 'signal', 'flatpak'];
    
    function updateProprietaryHighlighting() {
        if (!softwareTypeSelect) return;
        const isLibre = softwareTypeSelect.value === 'libre';
        
        propAppValues.forEach(val => {
            const cb = document.querySelector(`input[name="post_apps"][value="${val}"]`);
            if (cb) {
                const label = cb.closest('label');
                const link = label ? label.querySelector('a') : null;
                if (link) {
                    if (isLibre) {
                        link.style.color = 'var(--accent-red)';
                    } else {
                        link.style.color = 'inherit'; // Reset to standard link color
                    }
                }
            }
        });
    }

    if (softwareTypeSelect) {
        softwareTypeSelect.addEventListener('change', updateProprietaryHighlighting);
        updateProprietaryHighlighting(); // Run on init
    }

    // Full Suite Toggle Logic
    const fullSuiteToggle = document.getElementById('arss-full-suite-toggle');
    const arssToolsGrid = document.getElementById('arss-tools-grid');
    const arssCheckboxes = document.querySelectorAll('input[name="arss_tools"]');
    
    // Store previous states to restore them later
    let previousArssStates = {};
    arssCheckboxes.forEach(cb => { previousArssStates[cb.value] = cb.checked; });

    // Create the notice element
    const fullSuiteNotice = document.createElement('div');
    fullSuiteNotice.style.display = 'none';
    fullSuiteNotice.style.padding = '1rem';
    fullSuiteNotice.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    fullSuiteNotice.style.border = '1px solid var(--accent-blue)';
    fullSuiteNotice.style.borderRadius = '8px';
    fullSuiteNotice.style.color = 'var(--accent-blue)';
    fullSuiteNotice.style.marginTop = '0.5rem';
    fullSuiteNotice.innerHTML = '<strong>Ã°Å¸â€ºÂ¡Ã¯Â¸Â Full Suite Active:</strong> The unified <code>arch-rusty-security-suite</code> binary will be installed. All security modules are included automatically.<br><br><span style="font-size:0.85rem;opacity:0.8;" title="Untoggle \'Using Full Suite\' to select them individually."><em>(Hover for info: Security suite includes this module already. Untoggle to use them individually.)</em></span>';
    
    if (arssToolsGrid) {
        arssToolsGrid.parentNode.insertBefore(fullSuiteNotice, arssToolsGrid.nextSibling);
    }
    
    if (fullSuiteToggle) {
        fullSuiteToggle.addEventListener('change', function() {
            const isChecked = this.checked;
            
            if (isChecked) {
                // Save current state before overriding
                arssCheckboxes.forEach(cb => { previousArssStates[cb.value] = cb.checked; });
                
                // Hide grid, show notice, and UNCHECK them so their sub-options hide and don't block generation validation
                if(arssToolsGrid) arssToolsGrid.style.display = 'none';
                fullSuiteNotice.style.display = 'block';
                
                arssCheckboxes.forEach(cb => {
                    cb.checked = false;
                    cb.dispatchEvent(new Event('change'));
                });
            } else {
                // Show grid, hide notice, and restore previous states
                if(arssToolsGrid) arssToolsGrid.style.display = 'grid';
                fullSuiteNotice.style.display = 'none';
                
                arssCheckboxes.forEach(cb => {
                    cb.checked = previousArssStates[cb.value] || false;
                    cb.dispatchEvent(new Event('change'));
                });
            }
        });
    }

    // Proprietary App Warnings UI
    document.querySelectorAll('input[name="post_apps"]').forEach(cb => {
        if (typeof propAppsDB !== 'undefined' && propAppsDB[cb.value]) {
            const warningSpan = document.createElement('span');
            warningSpan.className = 'prop-warning nav-tooltip';
            warningSpan.setAttribute('data-title', 'Ã¢Å¡Â Ã¯Â¸Â Proprietary Software');
            warningSpan.setAttribute('data-desc', propAppsDB[cb.value]);
            warningSpan.innerHTML = ' <span style="color:var(--accent-red); cursor:help;">Ã¢Å¡Â Ã¯Â¸Â</span>';
            // Insert after the icon
            const iconSpan = cb.parentElement.querySelector('.app-icon');
            if (iconSpan) {
                iconSpan.insertAdjacentElement('afterend', warningSpan);
            }
        }
    });

    // Handle .sc upload
    const scInput = document.getElementById('upload-sc-input');
    if (scInput) {
        scInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.generator !== "arch-guides-dynamic") throw new Error("Invalid format");
                    
                    // Restore Selects
                    if (data.selects) {
                        for (const [id, val] of Object.entries(data.selects)) {
                            const el = document.getElementById(id);
                            if (el) el.value = val;
                        }
                    }
                    // Restore Inputs
                    if (data.inputs) {
                        for (const [id, val] of Object.entries(data.inputs)) {
                            const el = document.getElementById(id);
                            if (el) el.value = val;
                        }
                    }
                    // Restore Checkboxes
                    if (data.checkboxes) {
                        document.querySelectorAll('#install-form input[type="checkbox"]').forEach(cb => cb.checked = false);
                        for (const [name, vals] of Object.entries(data.checkboxes)) {
                            vals.forEach(v => {
                                const cb = document.querySelector(`input[name="${name}"][value="${v}"]`);
                                if (cb) cb.checked = true;
                            });
                        }
                    }
                    // Trigger UI updates
                    document.querySelectorAll('#install-form select').forEach(sel => sel.dispatchEvent(new Event('change')));
                    document.querySelectorAll('#install-form input[type="checkbox"]').forEach(cb => cb.dispatchEvent(new Event('change')));
                    alert('Configuration restored successfully.');
                } catch (err) {
                    alert('Error parsing .sc config file. Is it valid JSON?');
                }
            };
            reader.readAsText(file);
        });
    }
});

// ====================================================================
// UI EVENT HANDLERS
// ====================================================================

function injectNoSelectionProvided() {
    document.querySelectorAll('#install-form select').forEach(select => {
        // Remove existing if any to avoid duplicates
        const existing = Array.from(select.options).find(o => o.value === "");
        if (existing) existing.remove();

        const opt = document.createElement('option');
        opt.value = "";
        opt.text = "No Selection Provided";
        opt.disabled = true;
        opt.selected = true;
        opt.hidden = true; // Hides it from the dropdown list once opened
        select.insertBefore(opt, select.firstChild);

        // Instantly remove on interaction to fix iOS Safari ghosting
        const removePlaceholder = () => {
            const placeholder = Array.from(select.options).find(o => o.value === "");
            if (placeholder) placeholder.remove();
            select.removeEventListener('mousedown', removePlaceholder);
            select.removeEventListener('touchstart', removePlaceholder);
        };
        select.addEventListener('mousedown', removePlaceholder);
        select.addEventListener('touchstart', removePlaceholder);

        // Standard validation cleanup
        select.addEventListener('change', function handler() {
            if (this.value !== "") {
                removePlaceholder();
                this.removeEventListener('change', handler); // Clean up
                // Remove red border if present
                this.style.border = "";
                const warn = this.parentElement.querySelector('.req-warning');
                if (warn) warn.remove();
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', injectNoSelectionProvided);
document.getElementById('generate-btn').addEventListener('click', function(e) {
    e.preventDefault();

    let missingFields = [];
    let totalFields = 0;
    
    document.querySelectorAll('#install-form select').forEach(el => {
        if (!el.disabled && el.offsetParent !== null) {
            totalFields++;
            if (el.value === "") {
                const labelEl = el.parentElement.querySelector('label');
                const fieldName = labelEl ? labelEl.innerText.replace(':', '') : 'Unknown Field';
                missingFields.push(fieldName);
            }
        }
    });

    document.querySelectorAll('input[type="checkbox"][data-requires-config="true"]').forEach(cb => {
        if (cb.checked && cb.dataset.configured !== "true") {
            const appName = cb.parentElement.innerText.replace('⚙️', '').trim();
            missingFields.push(`App Configuration missing for: ${appName}`);
        }
    });

    const errorBox = document.getElementById('generate-error-box');

    if (missingFields.length > 0) {
        if (missingFields.length === totalFields && document.querySelectorAll('input[type="checkbox"][data-requires-config="true"]:checked').length === 0) {
            // No input provided at all
            if(errorBox) {
                errorBox.style.display = 'block';
                errorBox.innerHTML = '<h3 style="color:var(--accent-red);margin:0;">🚨 No Input Provided</h3><p style="margin-bottom:0;">Please make at least one selection before generating.</p>';
                errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        } else {
            // >= 1 selection made
            document.querySelectorAll('#install-form select').forEach(el => {
                if (!el.disabled && el.offsetParent !== null && el.value === "") {
                    el.style.border = "2px solid var(--accent-red)";
                    if (!el.parentElement.querySelector('.req-warning')) {
                        const warn = document.createElement('span');
                        warn.className = 'req-warning';
                        warn.style.color = 'var(--accent-red)';
                        warn.style.marginLeft = '10px';
                        warn.style.fontSize = '0.85rem';
                        warn.style.fontWeight = 'bold';
                        warn.innerText = ' 🚨 Required!';
                        const labelEl = el.parentElement.querySelector('label');
                        if(labelEl) labelEl.appendChild(warn);
                    }
                }
            });

            document.querySelectorAll('input[type="checkbox"][data-requires-config="true"]').forEach(cb => {
                if (cb.checked && cb.dataset.configured !== "true") {
                    cb.parentElement.style.border = "2px solid var(--accent-red)";
                    cb.parentElement.style.padding = "5px";
                    cb.parentElement.style.borderRadius = "4px";
                }
            });

            if(errorBox) {
                errorBox.innerHTML = `<h3 style="color:var(--accent-red); margin-top:0;">🚨 Generation Failed: <span id="error-count">${missingFields.length}</span> Missing Selections</h3><p>Please complete the following required fields to generate your guide:</p><div id="error-list"></div>`;
                const newErrorList = document.getElementById('error-list');
                if(newErrorList) {
                    newErrorList.style.listStyleType = "none";
                    newErrorList.style.paddingLeft = "0";
                    newErrorList.innerHTML = missingFields.map(f => {
                        const safeF = f.replace(/'/g, "\\'");
                        return `<a href="#" style="color:var(--accent-red);text-decoration:underline;font-weight:bold;margin-right:10px;line-height:1.8;" onclick="event.stopPropagation(); const els=Array.from(document.querySelectorAll('#install-form select, input[type=\\'checkbox\\']')); const target=els.find(s=>s.parentElement.innerText.includes('${safeF.split(':')[0].trim()}')); if(target)target.scrollIntoView({behavior:'smooth',block:'center'}); return false;">[${f}]</a>`;
                    }).join(' ');
                }
                errorBox.style.display = 'block';
                errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
    } else {
        if(errorBox) {
            errorBox.style.display = 'none';
            // Restore original error box format incase of future errors
            errorBox.innerHTML = `<h3 style="color:var(--accent-red); margin-top:0;">🚨 Generation Failed: <span id="error-count">0</span> Missing Selections</h3><p>Please complete the following required fields to generate your guide:</p><ul id="error-list"></ul>`;
        }
    }
    
    // Clear any previous global warnings or errors
    window.generateOutput(false);
    
    // Check if Live Generation Toggle is checked
    const liveToggle = document.getElementById('live_generation_toggle');
    if (liveToggle && liveToggle.checked) {
        window.location.href = "live.html";
        return;
    }
    
    // Show output section and hide generator form
    const outSec = document.getElementById('output-section');
    const genForm = document.querySelector('.generator-form');
    if (outSec && genForm) {
        outSec.style.display = 'block';
        genForm.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Ã¢â€â‚¬Ã¢â€â‚¬ Tooltip toggle (emoji button, always-enabled) Ã¢â€â‚¬Ã¢â€â‚¬
let tooltipsEnabled = sessionStorage.getItem('tooltips_enabled') !== 'false';
const tooltipToggleBtn = document.getElementById('toggle-tooltips-btn');

function syncTooltipBtn() {
    if (!tooltipToggleBtn) return;
    const on = window.tooltipsEnabled !== false;
    tooltipToggleBtn.classList.toggle('disabled', !on);
    tooltipToggleBtn.setAttribute('data-title', on ? 'Ã¢â€žÂ¹Ã¯Â¸Â Tooltips: ON' : 'Ã¢â€žÂ¹Ã¯Â¸Â Tooltips: OFF');
    tooltipToggleBtn.setAttribute('data-desc', on
        ? 'Tooltips are ON. Hover (desktop) or tap (mobile) any element for info. Click to disable.'
        : 'Tooltips are OFF. Only Ã¢â€žÂ¹Ã¯Â¸Â and Ã°Å¸â€¢â€œ always show. Click to re-enable.');
}

if (tooltipToggleBtn) {
    syncTooltipBtn();
    tooltipToggleBtn.addEventListener('click', () => {
        const nowOn = !window.tooltipsEnabled;
        if (window.setTooltipsEnabled) window.setTooltipsEnabled(nowOn);
        else { window.tooltipsEnabled = nowOn; sessionStorage.setItem('tooltips_enabled', nowOn); }
        syncTooltipBtn();
    });
}

// wiki map kept for parity (used by unified tooltip.js)
const wikiMap = {
    'Firmware Selection':           '?page=architecture.md',
    'File System Features':         '?page=02-partitioning/luks2.md',
    'Target Installation Disk':     '?page=01-pre-installation.md',
    'Encryption Options':           '?page=02-partitioning/luks2.md',
    'Init System':                  '?page=03-base-installation.md',
    'Bootloader Choice':            '?page=04-bootloaders/uki-no-grub.md',
    'Main Kernel':                  '?page=maintenance.md',
    'Backup Kernel':                '?page=maintenance.md',
    'CPU Architecture':             '?page=03-base-installation.md',
    'GPU Hardware':                 '?page=03-base-installation.md',
    'Virtual Machine Guest Setup':  '?page=03-base-installation.md',
    'Software Type & Graphics Drivers': '?page=10-generator-selections-and-dusky.md',
    'Swap File Size':               '?page=02-partitioning/luks2.md',
    'Post-Install Apps & Scripts':  '?page=10-generator-selections-and-dusky.md',
    'Automatic System Updates':     '?page=07-post-installation.md',
    'Multi-User Setup':             '?page=10-generator-selections-and-dusky.md',
    'System Cleanup':               '?page=07-post-installation.md',
    'Desktop Environment':          '?page=07-post-installation.md',
    'DNS Caching':                  '?page=07-post-installation.md',
    'Display Server':               '?page=xorg-vs-wayland.md',
    'Ã°Å¸Â¦â‚¬ Arch Rusty Security Suite': '?page=security-suite.md',
    'ARSS Ã¢â‚¬â€ Security Tools':        '?page=security-suite.md',
    'Anti-Evil Maid Decoys':        '?page=security-suite.md',
    'Other Security Tools':         '?page=security-suite.md',
};
// Note: updateInfoPanel sidebar removed Ã¢â‚¬â€ unified tooltip.js handles all tooltips

// Back to generator button
const backToGenBtn = document.getElementById('back-to-gen-btn');
if (backToGenBtn) backToGenBtn.addEventListener('click', window.returnToGenerator);

// Clear output button (far right of output bar)
const clearOutputBtn = document.getElementById('clear-output-btn');
if (clearOutputBtn) clearOutputBtn.addEventListener('click', window.clearGeneratedOutput);


// ⬇️ Custom scripts toggle ⬇️
const customScriptsSelect = document.getElementById('use-custom-scripts');
const customScriptsContainer = document.getElementById('custom-scripts-container');
if (customScriptsSelect && customScriptsContainer) {
    customScriptsSelect.addEventListener('change', () => {
        customScriptsContainer.style.display = customScriptsSelect.value === 'yes' ? 'block' : 'none';
    });
}
const securityToolsSelect = document.getElementById('securitytools');
const libreOtpModeContainer = document.getElementById('libre-otp-mode-container');
if (securityToolsSelect && libreOtpModeContainer) {
    securityToolsSelect.addEventListener('change', () => {
        libreOtpModeContainer.style.display = (securityToolsSelect.value === 'libre-otp' || securityToolsSelect.value === 'both') ? 'block' : 'none';
    });
}



// ⬇️ Smart Analysis ⬇️
window.smartAnalysisWarnings = [];
function validateConfigurations() {
    const fw = document.getElementById('firmware')?.value || 'uefi';
    const bootloader = document.getElementById('bootloader');
    const part = document.getElementById('partitioning');
    if (!bootloader || !part) return;

    if (fw === 'bios') {
        Array.from(bootloader.options).forEach(opt => {
            const bad = opt.value.includes('uki') || opt.value === 'systemd-boot';
            opt.disabled = bad;
        });
        if (bootloader.value !== 'grub') bootloader.value = 'grub';
        Array.from(part.options).forEach(opt => { opt.disabled = opt.value === 'luks2'; });
        if (part.value === 'luks2') part.value = 'luks1';
    } else {
        Array.from(bootloader.options).forEach(opt => opt.disabled = false);
        Array.from(part.options).forEach(opt => opt.disabled = false);
    }

    const warnings = [];
    const gpuBrand = document.getElementById('gpu_brand')?.value || 'amd';
    const softwareType = document.getElementById('software_type')?.value || 'libre';
    const desktop = document.getElementById('desktop')?.value || 'none';
    const displayServer = document.getElementById('display_server')?.value || 'auto';

    // ARSS Full Suite Automation Lock
    const suiteToggle = document.getElementById('arss-full-suite-toggle');
    if (suiteToggle) {
        const securityCbs = document.querySelectorAll('input[name="securitytools"]');
        securityCbs.forEach(cb => {
            if (suiteToggle.checked) {
                cb.checked = true;
                cb.disabled = true;
                cb.parentElement.style.opacity = '0.6';
                cb.parentElement.setAttribute('data-desc', 'Locked: Full Suite Binary enabled.');
                cb.parentElement.classList.add('tooltip-always');
            } else {
                cb.disabled = false;
                cb.parentElement.style.opacity = '1';
                cb.parentElement.removeAttribute('data-desc');
            }
        });
    }

    // DuskyOS Automation Lock
    const duskyAppCb = document.querySelector('input[name="post_apps"][value="dusky-setup"]');
    const displayServerSelect = document.getElementById('display_server');
    
    if (desktop === 'dusky') {
        if (duskyAppCb) {
            duskyAppCb.checked = true;
            duskyAppCb.disabled = true;
            duskyAppCb.parentElement.style.opacity = '0.6';
        }
        if (displayServer === 'xorg') {
            alert("Invalid Config: DuskyOS (Hyprland) requires Wayland. Automatically presetting to Wayland.");
            if (displayServerSelect) displayServerSelect.value = 'wayland';
        }
    } else {
        if (duskyAppCb) {
            duskyAppCb.disabled = false;
            duskyAppCb.parentElement.style.opacity = '1';
        }
    }

    if (desktop === 'dwm') {
        if (displayServer === 'wayland') {
            alert("Invalid Config: DWM requires Xorg. Automatically presetting to Xorg.");
            if (displayServerSelect) displayServerSelect.value = 'xorg';
        }
    }

    if (part.value === 'unencrypted') warnings.push("Ã¢Å¡Â Ã¯Â¸Â No encryption Ã¢â‚¬â€ physical access = full compromise.");
    if (gpuBrand === 'nvidia' && softwareType === 'libre') warnings.push("Ã¢Å¡Â Ã¯Â¸Â Nvidia + Libre = Nouveau only. Limited performance.");
    if (displayServer === 'wayland' && (desktop === 'dusky' || desktop === 'dwm')) warnings.push(`Ã¢Å¡Â Ã¯Â¸Â ${desktop} requires X11/Xorg. Wayland will break it.`);

    window.smartAnalysisWarnings = warnings;
    const div = document.getElementById('global-warnings');
    if (div) {
        div.innerHTML = warnings.map(w => `<div class="alert warning" style="margin-bottom:0.4rem;">${w}</div>`).join('');
        div.style.display = warnings.length ? 'block' : 'none';
    }

    if (typeof window.generateOutput === 'function') window.generateOutput(true);
}

validateConfigurations();

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Config restore ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const restoreConfig = sessionStorage.getItem('arch_restore_config');
if (restoreConfig) {
    try {
        const c = JSON.parse(restoreConfig);
        const map = { initSys:'init_system', kernelMain:'kernel-main', kernelBackup:'kernel-backup', secTools:'securitytools', fakeEvilMaid:'fake-evil-maid', format:'outputformat', part:'partitioning', disk:'target-disk', fw:'firmware', fs:'filesystem', boot:'bootloader' };
        Object.keys(c).forEach(k => {
            if (k === 'post_apps' && Array.isArray(c[k])) {
                document.querySelectorAll('input[name="post_apps"]').forEach(cb => cb.checked = c[k].includes(cb.value));
                return;
            }
            const el = document.getElementById(map[k] || k);
            if (el) el.value = c[k];
        });
        sessionStorage.removeItem('arch_restore_config');
    } catch(e) { console.error(e); }
}

// Banner cursor (link already in HTML <a> tag)
const banner = document.querySelector('.banner');
if (banner) banner.style.cursor = 'pointer';

// Update history tooltip on load
updateHistoryTooltip();

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Live Editor / Upload Handler ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
(function initLiveEditor() {
    const fileInput      = document.getElementById('upload-file-input');
    const clearBtn       = document.getElementById('upload-clear-btn');
    const statusEl       = document.getElementById('upload-status');
    const editorWrapper  = document.getElementById('upload-editor-wrapper');
    const filenameEl     = document.getElementById('upload-filename');
    const editor         = document.getElementById('upload-editor');
    const restoreBtn     = document.getElementById('upload-restore-btn');
    const downloadBtn    = document.getElementById('upload-download-btn');
    const restoreBtnAlt  = document.getElementById('upload-restore-btn-alt');
    const restoreWrap    = document.getElementById('upload-restore-btn-wrapper');

    if (!fileInput) return;

    let currentFilename = '';
    let parsedConfig    = null;
    let isValid         = false;

    const VALID_EXTS    = ['.sh', '.md', '.bash', '.txt'];

    function setStatus(msg, color) {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color = color || 'var(--accent-cyan)';
    }

    function tryParseConfig(text) {
        // Look for embedded config comment block
        const m1 = text.match(/<!--\s*CONFIG_START\s*([\s\S]*?)\s*CONFIG_END\s*-->/);
        if (m1) { try { return JSON.parse(m1[1]); } catch(e) {} }
        // Shell script config block
        const m2 = text.match(/###\s*CONFIG_START\s*([\s\S]*?)\s*###\s*CONFIG_END/);
        if (m2) { try { return JSON.parse(m2[1]); } catch(e) {} }
        return null;
    }

    function reset() {
        currentFilename = '';
        parsedConfig    = null;
        isValid         = false;
        if (fileInput)     fileInput.value = '';
        if (clearBtn)      clearBtn.style.display = 'none';
        if (editorWrapper) editorWrapper.style.display = 'none';
        if (restoreWrap)   restoreWrap.style.display = 'none';
        if (editor)        editor.value = '';
        setStatus('');
    }

    function loadFile(file) {
        if (!file) return;

        // Check extension
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!VALID_EXTS.includes(ext)) {
            setStatus('ÃƒÂ¢Ã…Â¡Ã‚Â  Invalid file type. Only .sh, .md, .bash, or .txt files are accepted.', 'var(--accent-red)');
            if (fileInput) fileInput.value = '';
            return;
        }

        currentFilename = file.name;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;

            // Try to parse config
            parsedConfig = tryParseConfig(text);
            isValid = parsedConfig !== null;

            // Populate editor
            if (editor) editor.value = text;
            if (filenameEl) filenameEl.textContent = file.name + (isValid ? '' : ' (no valid config ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â editable only)');

            // Show/hide restore button
            if (restoreBtn)  restoreBtn.style.display  = isValid ? '' : 'none';
            if (restoreWrap) restoreWrap.style.display   = isValid ? '' : 'none';
            if (restoreBtnAlt) restoreBtnAlt.style.display = isValid ? '' : 'none';

            // Show UI
            if (clearBtn)      clearBtn.style.display      = '';
            if (editorWrapper) editorWrapper.style.display  = '';

            if (isValid) {
                setStatus('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Valid config file ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â settings can be restored to the generator.', 'var(--accent-green)');
            } else {
                setStatus('ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¹ No valid config header found. Showing file as editable text only.', 'var(--accent-orange, #ff9e64)');
            }
        };
        reader.readAsText(file);
    }

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Event listeners ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
    if (fileInput) fileInput.addEventListener('change', function() {
        loadFile(this.files[0]);
    });

    if (clearBtn) clearBtn.addEventListener('click', reset);

    // Restore config to generator form
    function doRestore() {
        if (!parsedConfig) return;
        const map = { initSys:'init_system', kernelMain:'kernel-main', kernelBackup:'kernel-backup',
                      secTools:'securitytools', fakeEvilMaid:'fake-evil-maid', format:'outputformat',
                      part:'partitioning', disk:'target-disk', fw:'firmware', fs:'filesystem', boot:'bootloader' };
        Object.keys(parsedConfig).forEach(k => {
            if (k === 'post_apps' && Array.isArray(parsedConfig[k])) {
                document.querySelectorAll('input[name="post_apps"]').forEach(cb => {
                    cb.checked = parsedConfig[k].includes(cb.value);
                });
                return;
            }
            const el = document.getElementById(map[k] || k);
            if (el) el.value = parsedConfig[k];
        });
        setStatus('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Settings restored to generator! Adjust options above then re-generate.', 'var(--accent-green)');
        setTimeout(() => setStatus(isValid ? 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Valid config file loaded.' : '', 'var(--accent-cyan)'), 4000);
        validateConfigurations();
        // Scroll to top of generator
        const form = document.getElementById('install-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    }

    if (restoreBtn)    restoreBtn.addEventListener('click', doRestore);
    if (restoreBtnAlt) restoreBtnAlt.addEventListener('click', doRestore);

    // Download edited file
    if (downloadBtn) downloadBtn.addEventListener('click', () => {
        if (!editor || !currentFilename) return;
        downloadFile(editor.value, currentFilename);
    });

    // Live Editor nav link: smooth scroll to section
    const liveEditorNav = document.getElementById('live-editor-nav');
    if (liveEditorNav) {
        liveEditorNav.addEventListener('click', e => {
            e.preventDefault();
            const sec = document.getElementById('live-editor');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
        });
    }
})();

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Bind Generate Button Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Duplicate listener removed to prevent double-firing and bypassing validation.

const historyBtn = document.getElementById('history-btn');
if (historyBtn) {
    historyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.toggleHistoryModal();
    });
}


// Dynamic document.title on scroll
document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.form-step');
    if (!steps.length) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const title = entry.target.getAttribute('data-title');
                if (title) document.title = 'Arch Guides | ' + title;
            }
        });
    }, { threshold: 0.5 });
    steps.forEach(step => observer.observe(step));
});


// Libre Policy Logic
const libreToggle = document.getElementById('libre_policy_toggle');
if (libreToggle) {
    libreToggle.addEventListener('change', () => {
        document.querySelectorAll('input[name="post_apps"]').forEach(checkbox => {
            const label = checkbox.closest('label');
            if (!label) return;
            const isProprietary = label.innerHTML.includes('[PROPRIETARY]') || label.innerHTML.includes('Proprietary / Non-Libre software');
            
            if (libreToggle.checked && isProprietary) {
                // If policy is ON, and it's proprietary, highlight it red if it's checked
                if (checkbox.checked) {
                    label.style.border = '2px solid var(--accent-red)';
                    label.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
                    label.style.padding = '0.4rem';
                    label.style.borderRadius = '6px';
                } else {
                    label.style.border = '1px solid transparent';
                    label.style.boxShadow = 'none';
                }
            } else {
                // Reset styles
                if (isProprietary) {
                    label.style.border = '1px solid transparent';
                    label.style.boxShadow = 'none';
                }
            }
        });
    });
}

// Add event listener to post_apps to trigger libre logic on click
document.querySelectorAll('input[name="post_apps"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (libreToggle && libreToggle.checked) {
            libreToggle.dispatchEvent(new Event('change'));
        }
    });
});


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

// ====================================================================
// NEW UI TOGGLES (App Configs & Live Editor)
// ====================================================================

window.toggleAppConfig = function(appId) {
    const configDiv = document.getElementById('config-' + appId);
    const containerDiv = document.getElementById('container-' + appId);
    const cb = document.getElementById('arss-' + appId);
    if (!configDiv) return;
    
    // Automatically check the box when opening the config if it's not checked
    if (configDiv.style.display === 'none') {
        configDiv.style.display = 'block';
        if (cb) cb.checked = true;
        if (containerDiv) containerDiv.style.borderColor = "var(--accent-blue)";
    } else {
        configDiv.style.display = 'none';
        if (containerDiv) containerDiv.style.borderColor = "var(--border-color)";
    }
};

window.toggleLiveEditorMode = function() {
    const toggle = document.getElementById('live-preview-toggle');
    const textarea = document.getElementById('live-editor-textarea');
    const preview = document.getElementById('live-editor-preview');
    const code = document.getElementById('live-editor-code');
    
    if (toggle.checked) {
        // Switch to Preview Mode
        textarea.style.display = 'none';
        preview.style.display = 'block';
        code.textContent = textarea.value;
        if (window.Prism) {
            Prism.highlightElement(code);
        }
    } else {
        // Switch to Raw Edit Mode
        preview.style.display = 'none';
        textarea.style.display = 'block';
    }
};

// ====================================================================
// NEW SPA WORKFLOW: History & Modals & File Uploads
// ====================================================================

// Clear Generator Form
window.clearFormSelections = function() {
    document.querySelectorAll('#install-form select').forEach(sel => {
        sel.value = "";
        sel.style.border = "";
        const warn = sel.parentElement.querySelector('.req-warning');
        if (warn) warn.remove();
        
        // Re-inject "No Selection Provided" if missing
        if (!Array.from(sel.options).find(o => o.value === "")) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.text = "No Selection Provided";
            opt.disabled = true;
            opt.selected = true;
            opt.hidden = true;
            sel.insertBefore(opt, sel.firstChild);
        }
    });
    
    document.querySelectorAll('#install-form input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
    });
    
    document.querySelectorAll('input[type="text"]').forEach(input => input.value = "");
    
    const errBox = document.getElementById('generate-error-box');
    if (errBox) errBox.style.display = 'none';
};

// Split Scripts Toggle in Live Editor
window.toggleSplitScripts = function() {
    const toggle = document.getElementById('split-scripts-toggle');
    const postContainer = document.getElementById('live-editor-post-sh-container');
    const titleInstall = document.getElementById('title-install-sh');
    
    if (toggle.checked) {
        // Split Mode
        postContainer.style.display = 'block';
        titleInstall.textContent = "Install Script (.sh)";
    } else {
        // Unified Mode
        postContainer.style.display = 'none';
        titleInstall.textContent = "Unified Install & Post-Install Script (.sh)";
    }
};

// Confirm & Save Live Editor
window.confirmAndSaveLiveEditor = function() {
    // Collect final strings
    const finalMd = document.getElementById('live-editor-textarea-md').value;
    
    let finalSh = document.getElementById('live-editor-textarea-sh').value;
    let finalPost = document.getElementById('live-editor-textarea-post').value;
    
    const isSplit = document.getElementById('split-scripts-toggle').checked;
    if (!isSplit) {
        // Unified Mode: Inject post-install script at the end of the install script
        // with auto-execution and clean-up wrappers
        if (finalPost.trim() !== "") {
            finalSh += "\n\n# ==========================================\n";
            finalSh += "# AUTO-EXECUTING POST-INSTALL SCRIPT\n";
            finalSh += "# ==========================================\n";
            finalSh += "echo 'Running Post-Install Configuration...'\n";
            finalSh += finalPost;
            finalSh += "\n\n# Cleanup and Exit\n";
            finalSh += "echo 'Installation and Post-Install Complete.'\n";
        }
        finalPost = ""; // Clear post since it's unified
    }
    
    // Save to LocalStorage History
    let history = JSON.parse(localStorage.getItem('arss_history') || '[]');
    const newEntry = {
        id: Date.now().toString(),
        timestamp: (() => {
            const d = new Date();
            const pad = n => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        })(),
        md: finalMd,
        sh: finalSh,
        post: finalPost,
        sc: sessionStorage.getItem('last_generated_sc') || '{}'
    };
    
    history.unshift(newEntry);
    
    // Rolling cache: Keep max 10 to avoid quota limits
    if (history.length > 10) {
        history.pop();
    }
    
    try {
        localStorage.setItem('arss_history', JSON.stringify(history));
    } catch(e) {
        alert("Storage quota exceeded! Clearing oldest history items...");
        history = history.slice(0, 5);
        localStorage.setItem('arss_history', JSON.stringify(history));
    }
    
    // Transition to Static Output
    document.getElementById('live-editor').style.display = 'none';
    const outSec = document.getElementById('output-section');
    outSec.style.display = 'block';
    
    // Populate static blocks
    document.getElementById('static-md').querySelector('code').textContent = finalMd;
    document.getElementById('static-install').querySelector('code').textContent = finalSh;
    
    const postContainer = document.getElementById('static-post-container');
    if (!isSplit || !finalPost.trim()) {
        postContainer.style.display = 'none';
        document.getElementById('static-title-install').innerHTML = "⚙️ Unified Install Script (.sh)";
    } else {
        postContainer.style.display = 'block';
        document.getElementById('static-post').querySelector('code').textContent = finalPost;
        document.getElementById('static-title-install').innerHTML = "⚙️ Install Script (.sh)";
    }
    
    if (window.Prism) {
        Prism.highlightElement(document.getElementById('static-md').querySelector('code'));
        Prism.highlightElement(document.getElementById('static-install').querySelector('code'));
        if (isSplit && finalPost.trim()) {
            Prism.highlightElement(document.getElementById('static-post').querySelector('code'));
        }
    }
    
    
    // Render SSH Deployment Commands
    const sshContainer = document.getElementById('ssh-commands-container');
    if (sshContainer) {
        if (!isSplit || !finalPost.trim()) {
            // Unified Mode
            sshContainer.innerHTML = `
                <div style="background:var(--bg-color); border-left:4px solid var(--accent-cyan); padding:0.8rem; border-radius:4px;">
                    <strong style="color:var(--accent-cyan); font-size:0.8rem; display:block; margin-bottom:0.4rem;">1. Transfer & Execute Unified Script:</strong>
                    <code style="color:var(--fg-color); font-family:var(--font-mono); font-size:0.85rem; word-break:break-all;">scp install.sh root@&lt;TARGET-IP&gt;:/root/ && ssh root@&lt;TARGET-IP&gt; "bash /root/install.sh"</code>
                </div>
            `;
        } else {
            // Split Mode
            sshContainer.innerHTML = `
                <div style="background:var(--bg-color); border-left:4px solid var(--accent-cyan); padding:0.8rem; border-radius:4px;">
                    <strong style="color:var(--accent-cyan); font-size:0.8rem; display:block; margin-bottom:0.4rem;">1. Transfer & Execute Install Script:</strong>
                    <code style="color:var(--fg-color); font-family:var(--font-mono); font-size:0.85rem; word-break:break-all;">scp install.sh root@&lt;TARGET-IP&gt;:/root/ && ssh root@&lt;TARGET-IP&gt; "bash /root/install.sh"</code>
                </div>
                <div style="background:var(--bg-color); border-left:4px solid var(--accent-blue); padding:0.8rem; border-radius:4px;">
                    <strong style="color:var(--accent-blue); font-size:0.8rem; display:block; margin-bottom:0.4rem;">2. After Reboot & Login, Transfer & Execute Post-Install Script:</strong>
                    <code style="color:var(--fg-color); font-family:var(--font-mono); font-size:0.85rem; word-break:break-all;">scp post_install.sh &lt;USERNAME&gt;@&lt;TARGET-IP&gt;:~/ && ssh &lt;USERNAME&gt;@&lt;TARGET-IP&gt; "bash ~/post_install.sh"</code>
                </div>
            `;
        }
    }

    window.scrollTo({ top: outSec.offsetTop - 20, behavior: 'smooth' });
};

// Handle Raw File Uploads (.sh / .md)
document.addEventListener('DOMContentLoaded', () => {
    const srcInput = document.getElementById('upload-source-input');
    if (srcInput) {
        srcInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target.result;
                const ext = file.name.split('.').pop().toLowerCase();
                
                // Show Live Editor, hide generator
                document.querySelector('.generator-form').style.display = 'none';
                document.getElementById('live-editor').style.display = 'block';
                
                if (ext === 'md') {
                    document.getElementById('live-editor-textarea-md').value = content;
                } else if (ext === 'sh') {
                    document.getElementById('live-editor-textarea-sh').value = content;
                }
                
                // Switch to raw edit mode
                document.getElementById('live-preview-toggle').checked = false;
                window.toggleLiveEditorMode();
                
                window.scrollTo({ top: document.getElementById('live-editor').offsetTop - 20, behavior: 'smooth' });
            };
            reader.readAsText(file);
        });
    }
});

// Generation History Modal Logic
window.openHistoryModal = function() {
    const modal = document.getElementById('history-modal');
    const list = document.getElementById('history-list');
    modal.style.display = 'flex';
    
    const history = JSON.parse(localStorage.getItem('arss_history') || '[]');
    if (history.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--fg-color); opacity:0.7;">No history available.</p>';
        return;
    }
    
    list.innerHTML = history.map(h => `
        <div style="background:var(--bg-color); border:1px solid var(--border-color); padding:1rem; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                <strong style="color:var(--accent-blue);">${h.timestamp}</strong>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button class="btn" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="downloadString('${btoa(unescape(encodeURIComponent(h.md)))}', 'arch_guide.md')">📄 Guide</button>
                <button class="btn" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="downloadString('${btoa(unescape(encodeURIComponent(h.sh)))}', 'install.sh')">⚙️ Install</button>
                ${h.post ? `<button class="btn" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="downloadString('${btoa(unescape(encodeURIComponent(h.post)))}', 'post_install.sh')">🚀 Post</button>` : ''}
                <button class="btn" style="padding:0.3rem 0.8rem; font-size:0.8rem; background:var(--bg-lighter);" onclick="downloadString('${btoa(unescape(encodeURIComponent(h.sc)))}', 'config.sc')">📦 Config</button>
            </div>
        </div>
    `).join('');
};

window.clearHistory = function() {
    if (confirm("Are you sure you want to clear all generation history?")) {
        localStorage.removeItem('arss_history');
        openHistoryModal(); // refresh
    }
};

window.downloadString = function(b64, filename) {
    const text = decodeURIComponent(escape(atob(b64)));
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
};

window.downloadContentStatic = function(id, filename) {
    const content = document.getElementById(id).querySelector('code').textContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
};

window.downloadAllOutput = function() {
    alert("In a real environment, this would zip the currently displayed .md and .sh files. Use the individual buttons for now.");
};
