import re
import json

def patch_legal():
    # Update legal.js to use sessionStorage only if they check the "do not prompt" box, and make mobile neat
    new_legal = """document.addEventListener('DOMContentLoaded', () => {
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
"""
    with open('website/legal.js', 'w', encoding='utf-8') as f:
        f.write(new_legal)


def patch_index_html():
    with open('website/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Smart Analysis Div at bottom of form
    analysis_div = '''
        <div id="smart-analysis-container" style="display:none; margin-top: 1rem; margin-bottom: 2rem; padding: 1rem; border-radius: 8px; border: 1px solid var(--accent-red); background: rgba(247, 118, 142, 0.1);">
            <h3 style="color:var(--accent-red); margin-top:0;">Smart Analysis Warnings</h3>
            <ul id="smart-analysis-list" style="color:var(--fg-color); margin-bottom:0;"></ul>
        </div>
    '''
    if 'smart-analysis-container' not in content:
        content = content.replace('<button class="btn" onclick="generateOutput()">Generate Guide & Script</button>', '<button class="btn" onclick="generateOutput()">Generate Guide & Script</button>\n' + analysis_div)

    # Change Software Paradigm options
    old_sw = '''<select id="software_type">
                            <option value="libre">Libre (Strict adherence, doas instead of sudo)</option>
                            <option value="opensource" selected>Open Source (Pragmatic, sudo, non-free firmwares)</option>
                            <option value="proprietary">Proprietary (Nvidia drivers, closed-source apps)</option>
                        </select>'''
    new_sw = '''<select id="software_type">
                            <option value="libre">Libre ONLY strictly (Strict adherence, uses doas instead of sudo)</option>
                            <option value="opensource" selected>Libre + Open Source ONLY (Pragmatic, uses sudo)</option>
                            <option value="proprietary">Okay with Mix and Minimal (Includes Proprietary like Nvidia)</option>
                        </select>'''
    content = content.replace(old_sw, new_sw)

    # Add credits to bottom of body
    credits_html = '''
    <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--bg-lighter); text-align: center; font-size: 0.9rem; color: var(--accent-cyan);">
        <h3>Credits & Acknowledgements</h3>
        <p>Built dynamically with AI. <a href="https://github.com/tilas01/arch-guides-dynamic">tilas01 GitHub Repo</a></p>
        <p>Security Tools: Libre-OTP & Anti-RubberDucky authored by <a href="https://github.com/tilas01">tilas01</a></p>
        <p>Rice & OS: Dusky OS by <a href="https://github.com/dusklinux/dusky">dusklinux</a> | <a href="https://www.youtube.com/watch?v=JmgvSdEIK8c">YouTube Demo</a></p>
        <p>Keystroke Anonymization: <a href="https://github.com/vmonaco/kloak">kloak by vmonaco</a></p>
    </footer>
    '''
    if 'Credits & Acknowledgements' not in content:
        content = content.replace('</body>', credits_html + '\n</body>')

    with open('website/index.html', 'w', encoding='utf-8') as f:
        f.write(content)

def patch_script_js():
    with open('website/script.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update updateInfoPanel to summarize errors and link to wiki
    # We will hook touchstart to open the wiki URL if it's mobile!
    old_infopanel = '''function updateInfoPanel(group, e, force = false) {
    if (!tooltipsEnabled && !force) return;

    const title = group.getAttribute('data-title');
    const desc = group.getAttribute('data-desc');'''
    
    new_infopanel = '''
// Global array for smart analysis
window.smartAnalysisWarnings = [];

function updateInfoPanel(group, e, force = false) {
    if (!tooltipsEnabled && !force) return;

    const title = group.getAttribute('data-title');
    const desc = group.getAttribute('data-desc');
    const warningCount = window.smartAnalysisWarnings.length;
    let warningText = warningCount > 0 ? `<br><br><strong style="color:var(--accent-red);">${warningCount} Warnings. Scroll to bottom to view Smart Analysis reason.</strong>` : '';
'''
    content = content.replace(old_infopanel, new_infopanel)
    
    # Let's add the HTML injection
    content = content.replace("infoPanel.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;", "infoPanel.innerHTML = `<h3>${title}</h3><p>${desc}</p>${warningText}<br><br><small style='color:var(--accent-green);'>Desktop: Right-click to view Wiki<br>Mobile: Tap to view Wiki</small>`;")
    
    # 2. Add Smart Analysis logic and doas auto-replace inside buildOutput!
    # And strip the "Current Configuration" dump from the Markdown output
    # At the top of buildOutput(cmdOnly), we will clear warnings
    build_start = 'function buildOutput(cmdOnly = false) {'
    new_build_start = '''function buildOutput(cmdOnly = false) {
    if (!cmdOnly) window.smartAnalysisWarnings = []; // reset warnings during run
    '''
    content = content.replace(build_start, new_build_start)
    
    # Smart analysis checks (put this right after fetching all variables in buildOutput)
    smart_checks = '''
    // SMART ANALYSIS
    if (!cmdOnly) {
        if (fs === "btrfs" && document.getElementById('swap_size').value === "0") {
            window.smartAnalysisWarnings.push("BTRFS without Swap may prevent hibernation and cause OOM issues.");
        }
        if (software_type === "libre" && gpu_brand === "nvidia") {
            window.smartAnalysisWarnings.push("Libre software paradigm contradicts Proprietary Nvidia graphics.");
        }
        if (desktop === "dusky" && post_apps.includes("paru") === false) {
            window.smartAnalysisWarnings.push("Dusky OS highly recommends enabling paru AUR helper.");
        }
        
        let analysisContainer = document.getElementById('smart-analysis-container');
        let analysisList = document.getElementById('smart-analysis-list');
        if (analysisContainer && analysisList) {
            if (window.smartAnalysisWarnings.length > 0) {
                analysisList.innerHTML = window.smartAnalysisWarnings.map(w => `<li>${w}</li>`).join('');
                analysisContainer.style.display = 'block';
            } else {
                analysisContainer.style.display = 'none';
            }
        }
    }
    '''
    # We'll inject it after `const dns = ...`
    content = content.replace('const dns = document.getElementById(\'dns\') ? document.getElementById(\'dns\').value : \'systemd-resolved\';', 'const dns = document.getElementById(\'dns\') ? document.getElementById(\'dns\').value : \'systemd-resolved\';' + smart_checks)

    # 3. Handle DOAS replacement in DuskyOS script if Libre
    doas_logic = '''
    if (desktop === "dusky") {
        output += `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\\n`;
        if (software_type === "libre") {
            // Auto replace sudo with doas in dusky scripts
            output += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && sed -i 's/sudo/doas/g' install.sh && ./install.sh"\\n`;
        } else {
            output += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\\n`;
        }
    }
    '''
    # Remove the old dusky logic and replace with this
    old_dusky = '''} else if (desktop === "dusky") {
        output += `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\\n`;
        output += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\\n`;
    }'''
    content = content.replace(old_dusky, doas_logic.strip())

    # 4. Remove config reprinting from markdown
    # It looks like: output += `# Current Configuration\n...\n\n`
    config_reprint = r'if \(!cmdOnly\) \{\s*output \+= `# Current Configuration\\n`;.*?output \+= `\\n`;\s*\}'
    content = re.sub(config_reprint, '', content, flags=re.DOTALL)

    # 5. Make the circular boxes better. In `renderedHTML`, wrap editors in circles
    old_wrapstyle = 'const wrapStyle = "word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; background: var(--bg-dark); padding: 1.5rem; border: 1px solid var(--accent-purple); border-radius: 8px; max-width: 100%; box-sizing: border-box;";'
    new_wrapstyle = '''const wrapStyle = "word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; background: #0a0e17; padding: 2rem; border: 2px solid var(--accent-blue); border-radius: 20px; max-width: 100%; box-sizing: border-box; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);";
    const titleStyle = "color: var(--accent-cyan); font-weight: bold; border-bottom: 2px solid var(--accent-blue); padding-bottom: 0.5rem; margin-bottom: 1rem;";'''
    content = content.replace(old_wrapstyle, new_wrapstyle)
    
    content = content.replace('<h3>Raw Executable Bash Script:</h3>', f'<h3 style="{{titleStyle}}">Raw Executable Bash Script:</h3>')
    content = content.replace('<h3>Markdown Guide Editor:</h3>', f'<h3 style="{{titleStyle}}">Markdown Guide Editor:</h3>')
    content = content.replace('<h3>Live Preview (Generated from Markdown):</h3>', f'<h3 style="{{titleStyle}}">Live Preview (Generated from Markdown):</h3>')

    # Add contextmenu and click logic to open Wiki in script.js
    wiki_listeners = '''
// Handle Right Click / Tap on form groups to open Wiki
document.querySelectorAll('.form-step').forEach(group => {
    // Desktop Right Click
    group.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.open('wiki.html#10-generator-selections-and-dusky', '_blank');
    });
    // Mobile Tap (if it doesn't break form inputs)
    // We will hook the label clicks
    const label = group.querySelector('label');
    if (label) {
        label.addEventListener('click', (e) => {
            // Check if mobile
            if (window.innerWidth <= 768) {
                // If they tap the label, go to wiki
                window.open('wiki.html#10-generator-selections-and-dusky', '_blank');
            }
        });
    }
});
'''
    content = content + '\n' + wiki_listeners

    with open('website/script.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_legal()
    patch_index_html()
    patch_script_js()
    print("UI Overhaul complete!")
