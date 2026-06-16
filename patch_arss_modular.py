import re

with open('website/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace Full Suite Toggle with Modular Select All
old_toggle_block = r"""<label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem; padding:0.8rem; background:var(--bg-lighter); border-radius:8px; border:1px solid var(--accent-green); cursor:pointer;">
                                  <input type="checkbox" id="arss-full-suite-toggle" onchange="if(this.checked) openAppConfigModal('arss-full-suite')" data-requires-config="true" data-configured="false" style="width:20px; height:20px; accent-color:var(--accent-green);">
                                  <span><strong>Use Full Suite Binary</strong> (Installs the unified <code>arch-rusty-security-suite</code> binary and enables all features below)</span> <span class="gear-config-btn" onclick="event.preventDefault(); openAppConfigModal('arss-full-suite')" style="cursor:pointer; margin-left:auto; display:none;">⚙️</span>
                              </label>"""

new_toggle_block = r"""<label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem; padding:0.8rem; background:var(--bg-lighter); border-radius:8px; border:1px solid var(--accent-green); cursor:pointer;">
                                  <input type="checkbox" id="arss-select-all-toggle" onchange="document.querySelectorAll('input[name=\'arss_tools\']').forEach(cb => {cb.checked = this.checked; cb.dispatchEvent(new Event('change'));})" style="width:20px; height:20px; accent-color:var(--accent-green);">
                                  <span><strong>Select All Security Tools</strong> (Modular Installation — strictly standalone binaries)</span>
                              </label>"""

if old_toggle_block in html:
    html = html.replace(old_toggle_block, new_toggle_block)
else:
    # Try regex if slight formatting differs
    html = re.sub(r'<label style="display:flex;[^>]*>.*?id="arss-full-suite-toggle".*?</label>', new_toggle_block, html, flags=re.DOTALL)

with open('website/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('website/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove full suite references from script.js
js = js.replace("const fullSuite = document.getElementById('arss-full-suite-toggle')?.checked;", "const fullSuite = false;")
js = js.replace("if (fullSuite || arss_tools.includes('libre-otp')) {", "if (arss_tools.includes('libre-otp')) {")
js = js.replace("if (fullSuite || arss_tools.includes('anti-ducky')) {", "if (arss_tools.includes('anti-ducky')) {")
js = js.replace("if (fullSuite || arss_tools.includes('scarecrow')) {", "if (arss_tools.includes('scarecrow')) {")
js = js.replace("if (fullSuite || arss_tools.includes('kernel-watcher')) {", "if (arss_tools.includes('kernel-watcher')) {")
js = js.replace("if (fullSuite || arss_tools.includes('anti-evil-maid')) {", "if (arss_tools.includes('anti-evil-maid')) {")
js = js.replace("if (fullSuite || arss_tools.includes('panic-password')) {", "if (arss_tools.includes('panic-password')) {")
js = js.replace("if (fullSuite || arss_tools.includes('hardened-ssh')) {", "if (arss_tools.includes('hardened-ssh')) {")

with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Modularized ARSS tools in index.html and script.js")
