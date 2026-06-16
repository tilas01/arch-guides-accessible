import re

with open('website/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add DE / WM Selection right before post_apps
de_html = r"""<div class="form-group form-step" data-title="Desktop Environment" data-desc="Select your primary Desktop Environment or Window Manager. DuskyOS replaces all default WM configs.">
                        <label>Desktop Environment (DE/WM):</label>
                        <select id="desktop_env">
                            <option value="none" selected>None (CLI Only)</option>
                            <option value="duskyos">DuskyOS (Custom Tiling WM)</option>
                            <option value="gnome">GNOME</option>
                            <option value="kde_minimal">KDE Plasma (Minimal)</option>
                            <option value="kde_full">KDE Plasma (Full)</option>
                        </select>
                    </div>

                    <div class="form-group form-step" """

old_post_apps_header = r'<div class="form-group form-step" data-title="Post-Install Apps & Scripts"'
html = html.replace(old_post_apps_header, de_html + 'data-title="Post-Install Apps & Scripts"')

# Add Rofi to AUR apps
rofi_html = r"""<label class="app-item" title="Rofi
--
Window switcher, application launcher and dmenu replacement

Build Integrity: Reproducible
Source: 📁 Arch Extra">
                                <input type="checkbox" name="post_apps" value="rofi" data-requires-config="true" data-configured="false">
                                <span class="app-icon">🔍</span> <a href="https://github.com/davatorium/rofi" target="_blank">Rofi</a> <span class="app-desc">Launcher</span>
                                <span class="gear-config-btn" onclick="event.preventDefault(); openAppConfigModal('rofi')" style="cursor:pointer; margin-left:auto; display:none;">⚙️</span>
                            </label>"""

if 'value="rofi"' not in html:
    aur_header = r'<div class="app-category-header">📦 AUR</div>'
    html = html.replace(aur_header, aur_header + '\n                            ' + rofi_html)

# Add Global Sandboxing Option right after Script Generation Style
sandbox_html = r"""<div class="form-group form-step" data-title="Global App Configuration (Sandboxing)" data-desc="Determine how ALL checked applications above will be handled by Firejail and AppArmor.">
                        <label>Global Sandboxing Policy:</label>
                        <select id="global_sandboxing">
                            <option value="all" selected>Strict: Sandbox ALL Apps</option>
                            <option value="browsers">Medium: Sandbox Browsers & Network Apps Only</option>
                            <option value="none">Off: Do not automatically sandbox apps</option>
                        </select>
                    </div>

                    <div id="sc-preview-section" """

old_sc_preview = r'<div id="sc-preview-section" '
html = html.replace(old_sc_preview, sandbox_html)

with open('website/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("index.html patched with DEs, Rofi, and Global Sandboxing.")
