import re

# 1. Fix CSS
css_path = 'website/style.css'
with open(css_path, 'a', encoding='utf-8') as f:
    f.write("\n\n/* ─── Checkbox Grid ─── */\n.checkbox-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n    gap: 12px;\n    margin-top: 10px;\n}\n.checkbox-item {\n    display: flex;\n    align-items: center;\n    font-size: 0.9rem;\n}\n")

# 2. Fix JS syntax error in script.js openAppConfigModal
js_path = 'website/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

fixed_modal_logic = """
    // Map app IDs to their specific config UIs
    if (appId === 'libre-otp') {
        title.innerHTML = '⚙️ Libre OTP Configuration';
"""
js = js.replace('    // Map app IDs to their specific config UIs\n        title.innerHTML = \'⚙️ Libre OTP Configuration\';', fixed_modal_logic)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Add file upload to live.html
html_path = 'website/live.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

upload_ui = """
            <div class="output-actions" style="background:var(--bg-lighter); padding:1rem; border-radius:8px; margin-bottom:2rem; border:1px solid var(--border-color);">
                <div>
                    <h3 style="margin-top:0; color:var(--accent-purple);">Upload File (.md / .sh)</h3>
                    <p style="font-size:0.85rem; color:var(--fg-color);">Load an existing guide or script into the editor.</p>
                </div>
                <input type="file" id="file-uploader" accept=".md,.sh" style="background:var(--bg-darker); padding:0.5rem; border:1px solid var(--accent-blue); border-radius:4px; color:var(--fg-color);">
            </div>
"""

html = html.replace('<section id="output-section" style="width:100%;">', '<section id="output-section" style="width:100%;">\n' + upload_ui)

upload_js = """
        document.getElementById('file-uploader').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                const content = evt.target.result;
                if (file.name.endsWith('.md')) {
                    document.getElementById('raw-md-code').textContent = content;
                } else if (file.name.endsWith('.sh')) {
                    // Check if it's a post-install script (heuristic)
                    if (content.includes('post_install')) {
                        document.getElementById('raw-post-script-code').textContent = content;
                    } else {
                        document.getElementById('raw-script-code').textContent = content;
                    }
                }
                if (window.Prism) Prism.highlightAll();
            };
            reader.readAsText(file);
        });
"""

html = html.replace('});\n\n        function downloadContent', '});\n\n' + upload_js + '\n        function downloadContent')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
