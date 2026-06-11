const fs = require('fs');
let html = fs.readFileSync('website/wiki.html', 'utf8');

// 1. Remove API rate limit span and update UI headers
const headerTarget = /<span id="api-rate-limit".*?<\/span>/g;
html = html.replace(headerTarget, '');

// 2. Rewrite the javascript for the API
const scriptTarget = /<script>[\s\S]*?<\/script>/;
const newScript = `<script>
        document.addEventListener('DOMContentLoaded', async () => {
            const container = document.getElementById('live-releases-container');
            const fallbackHTML = \`<div style="padding:1rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-lighter);">
                <h4 style="color:var(--accent-cyan); margin-top:0;">Offline / Direct Fallback Downloads</h4>
                <p>GitHub API rate limit exceeded or connection failed. You can directly install the tools via cargo:</p>
                <ul>
                    <li><code>cargo install arch-rusty-security-suite --git https://github.com/tilas01/arch-guides-dynamic</code></li>
                    <li><code>cargo install libre-otp --git https://github.com/tilas01/arch-guides-dynamic</code></li>
                    <li><code>cargo install kernel-watcher --git https://github.com/tilas01/arch-guides-dynamic</code></li>
                    <li><code>cargo install anti-ducky --git https://github.com/tilas01/arch-guides-dynamic</code></li>
                </ul>
                <p><a href="https://github.com/tilas01/arch-guides-dynamic/releases" target="_blank" style="color:var(--accent-purple); font-weight:bold;">Or click here to manually view releases on GitHub.</a></p>
            </div>\`;

            try {
                const response = await fetch('https://api.github.com/repos/tilas01/arch-guides-dynamic/releases');
                
                if (!response.ok) {
                    container.innerHTML = fallbackHTML;
                    return;
                }
                const data = await response.json();
                
                if (data.length === 0) {
                    container.innerHTML = '<p style="color:#8b949e;">No releases published yet.</p>';
                    return;
                }

                let htmlContent = '<ul style="list-style:none; padding:0; margin:0;">';
                data.slice(0, 5).forEach(release => {
                    const date = new Date(release.published_at).toLocaleDateString();
                    let assetLinks = '';
                    
                    if (release.assets && release.assets.length > 0) {
                        assetLinks = '<div style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.5rem;">';
                        release.assets.forEach(asset => {
                            assetLinks += \`<a href="\${asset.browser_download_url}" style="background:var(--bg-darker); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem; border:1px solid var(--border-color); color:var(--accent-blue); text-decoration:none;">⬇️ \${asset.name}</a>\`;
                        });
                        assetLinks += '</div>';
                    }

                    htmlContent += \`<li style="margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color);">
                        <strong style="color:var(--accent-blue); font-size:1.1rem;">\${release.name || release.tag_name}</strong> 
                        <span style="font-size:0.85rem; color:#8b949e; margin-left:1rem;">📅 \${date}</span>
                        <div style="margin-top:0.3rem;">
                            <a href="\${release.html_url}" target="_blank" style="color:var(--accent-purple); text-decoration:none;">View Release Notes &rarr;</a>
                        </div>
                        \${assetLinks}
                    </li>\`;
                });
                htmlContent += '</ul>';
                container.innerHTML = htmlContent;
            } catch (err) {
                container.innerHTML = fallbackHTML;
            }
        });
    </script>`;
html = html.replace(scriptTarget, newScript);

// 3. Add missing Wiki Explanations for Usernames, Themes, AEM
const advancedConfigTarget = /<h3 id="advanced-config-doas">Doas Integration Mode<\/h3>/;
const missingExplanations = `
        <h3 id="advanced-config-usernames">System Usernames</h3>
        <p>Instead of relying on the script to prompt you interactively during the build, you can pre-define the exact system usernames you want created directly in the generator. This ensures the output markdown guide accurately reflects your target state.</p>

        <h3 id="advanced-config-themes">JetBrains Terminal Themes</h3>
        <p>If you selected to install JetBrains Mono and Terminal Themes, you can pick your preferred color palette (TokyoNight, Catppuccin, Rosé Pine, Dracula) here. The script will automatically deploy the corresponding dotfiles for your shell.</p>

        <h3 id="advanced-config-aem">AEM Decoy Count</h3>
        <p>Anti-Evil Maid secures your /boot partition by verifying decoy kernels. You can select how many decoy images to generate. <strong>1 Decoy</strong> is standard. <strong>3 Decoys</strong> is for maximum paranoia but increases boot time slightly as more checksums must be validated.</p>

        <h3 id="advanced-config-doas">Doas Integration Mode</h3>`;

html = html.replace(advancedConfigTarget, missingExplanations);

fs.writeFileSync('website/wiki.html', html);
console.log('wiki.html updated with API fallback and missing guides.');
