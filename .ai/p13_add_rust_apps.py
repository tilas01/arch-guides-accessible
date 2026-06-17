import re

# 1. Update index.html
html_path = 'website/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

ui_html = """
                    <div class="form-group form-step" data-title="Standalone Security Tools" data-desc="Independent, custom-built security tools developed by tilas01. Enable them individually or click the green button to enable all recommended tools." oncontextmenu="window.open('https://github.com/tilas01', '_blank'); return false;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.8rem; flex-wrap:wrap; gap:10px;">
                            <label style="margin:0;">🦀 Rust Security Apps:</label>
                            <button type="button" class="btn nav-tooltip" data-title="Enable Recommended" data-desc="Enables all Arch Security Suite Apps. Highly recommended for maximum security." style="background:var(--accent-green); color:var(--bg-darker); width:auto; padding:0.3rem 0.8rem; font-size:0.85rem; border-radius:4px; font-weight:bold;" onclick="enableAllSecurityApps()">
                                Enable all Arch Security Suite Apps by <a href="https://github.com/tilas01" target="_blank" style="color:var(--bg-darker); text-decoration:underline;">tilas01</a>
                            </button>
                        </div>
                        <div class="checkbox-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:0.6rem;">
                            
                            <label class="app-card" title="Libre-OTP Authenticator">
                                <input type="checkbox" name="post_apps" onchange="if(this.checked) openAppConfigModal('libre-otp')" value="libre-otp" data-requires-config="true" data-configured="false" class="tilas-sec-app">
                                <span class="app-icon">🔑</span> <a href="https://github.com/tilas01/libre-otp" target="_blank">Libre-OTP</a> <span class="app-desc">PAM TOTP</span>
                                <span class="gear-config-btn" onclick="event.preventDefault(); openAppConfigModal('libre-otp')" style="cursor:pointer; margin-left:auto; display:none;">⚙️</span>
                            </label>
                            
                            <label class="app-card" title="Input Guard (Anti-Ducky)">
                                <input type="checkbox" name="post_apps" value="anti-ducky" class="tilas-sec-app">
                                <span class="app-icon">🦆</span> <a href="https://github.com/tilas01/anti-ducky" target="_blank">Anti-Ducky</a> <span class="app-desc">USB Blocker</span>
                            </label>
                            
                            <label class="app-card" title="Anti-Evil Maid">
                                <input type="checkbox" name="post_apps" onchange="if(this.checked) openAppConfigModal('evil-maid')" value="anti-evil-maid" data-requires-config="true" data-configured="false" class="tilas-sec-app">
                                <span class="app-icon">🛡️</span> <a href="https://github.com/tilas01/anti-evil-maid" target="_blank">Anti-Evil Maid</a> <span class="app-desc">Boot Integrity</span>
                                <span class="gear-config-btn" onclick="event.preventDefault(); openAppConfigModal('evil-maid')" style="cursor:pointer; margin-left:auto; display:none;">⚙️</span>
                            </label>
                            
                            <label class="app-card" title="Kernel Watcher (EDR)">
                                <input type="checkbox" name="post_apps" value="kernel-watcher" class="tilas-sec-app">
                                <span class="app-icon">👀</span> <a href="https://github.com/tilas01/kernel-watcher" target="_blank">Kernel Watcher</a> <span class="app-desc">eBPF EDR</span>
                            </label>
                            
                            <label class="app-card" title="ScareCrow (LKM)">
                                <input type="checkbox" name="post_apps" value="scarecrow" class="tilas-sec-app">
                                <span class="app-icon">🎃</span> <a href="https://github.com/tilas01/scarecrow" target="_blank">Scarecrow</a> <span class="app-desc">Decoy LKM</span>
                            </label>

                        </div>
                    </div>

"""

target = '<div id="generate-error-box"'
if target in html and "🦀 Rust Security Apps" not in html:
    html = html.replace(target, ui_html + target)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected HTML successfully.")
else:
    print("Could not inject HTML.")

# 2. Update script.js
js_path = 'website/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

js_code = """
function enableAllSecurityApps() {
    document.querySelectorAll('.tilas-sec-app').forEach(cb => {
        cb.checked = true;
        const evt = new Event('change');
        cb.dispatchEvent(evt);
    });
}
"""
if "enableAllSecurityApps" not in js:
    with open(js_path, 'a', encoding='utf-8') as f:
        f.write("\n" + js_code)
    print("Injected JS successfully.")
else:
    print("JS already present.")
