import re

# Update releases.html
html_path = 'website/releases.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the catch block in releases.html to show a comprehensive static fallback
static_fallback = """
                        const limitMessage = e.message.includes('API Rate Limited') 
                            ? 'GitHub API Rate Limit Exceeded (60 requests/hr for unauthenticated users).' 
                            : 'Unable to fetch the latest release dynamically.';
                        
                        container.innerHTML = `
                            <div class="alert error" style="width:100%; border:1px solid var(--accent-red); background:rgba(247, 118, 142, 0.1);">
                                <h3 style="margin-top:0; color:var(--accent-red);">⚠️ ${limitMessage}</h3>
                                <p style="color:var(--fg-color);">Falling back to static release notes. For live release assets, please visit the GitHub repository directly.</p>
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-top:2rem; margin-bottom:1.5rem;">
                                <h2 style="color:var(--accent-green); margin:0;">Arch Guides Dynamic - Latest Stable</h2>
                                <span style="background:var(--accent-cyan); color:var(--bg-darker); padding:0.3rem 0.8rem; border-radius:20px; font-weight:bold; font-size:0.9rem;">v1.0.0</span>
                            </div>
                            <div class="markdown-body" style="color:var(--fg-color); font-size:0.95rem; line-height:1.6; margin-bottom:2rem;">
                                <h3>Full Static Release</h3>
                                <p>The latest features include:</p>
                                <ul>
                                    <li>Post-Quantum Cryptographic LUKS2 integration.</li>
                                    <li>Libre-OTP PAM, Boot, and SSH MFA.</li>
                                    <li>Custom Tokyo Night Plymouth Boot Screen.</li>
                                    <li>Duress Password Instant Power-off logic.</li>
                                </ul>
                            </div>
                            <h3 style="color:var(--accent-purple); border-top:1px solid var(--border-color); padding-top:1.5rem;">Downloads & Assets</h3>
                            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:1rem;">
                                <a href="https://github.com/tilas01/arch-guides-dynamic/archive/refs/heads/main.zip" class="asset-btn" target="_blank">📦 Download Source Code (.zip)</a>
                                <a href="https://github.com/tilas01/arch-guides-dynamic/releases" class="asset-btn" target="_blank" style="background:var(--bg-color);">🔗 View Releases on GitHub</a>
                                <a href="wiki.html" class="asset-btn" style="background:var(--accent-blue); color:var(--bg-color);">📖 Read Tool Wiki</a>
                            </div>
                        `;
"""
html = re.sub(r'container\.innerHTML = `.*?<div class="alert error".*?</div>\s*`;', static_fallback, html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
