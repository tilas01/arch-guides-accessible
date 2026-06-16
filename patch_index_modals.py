import re

with open('website/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove Global Sandboxing Block
html = re.sub(r'<div class="form-group form-step" data-title="Global App Configuration.*?</div>\s*<div id="sc-preview-section"', '<div id="sc-preview-section"', html, flags=re.DOTALL)

# 2. Add config attributes and auto-open to ALL standard apps in post_apps
# Find all inputs with name="post_apps"
def add_config_attrs(match):
    full_input = match.group(0)
    # Don't touch if it already has requires-config (security apps)
    if 'data-requires-config="true"' in full_input:
        # Just ensure auto-open
        if 'onchange=' not in full_input:
            val = re.search(r'value="([^"]+)"', full_input).group(1)
            full_input = full_input.replace('value=', f'onchange="if(this.checked) openAppConfigModal(\'{val}\')" value=')
        return full_input
    
    val_match = re.search(r'value="([^"]+)"', full_input)
    if not val_match: return full_input
    val = val_match.group(1)
    
    return full_input.replace('>', f' data-requires-config="true" data-configured="false" onchange="if(this.checked) openAppConfigModal(\'{val}\')">')

html = re.sub(r'<input type="checkbox" name="post_apps"[^>]+>', add_config_attrs, html)

# 3. We also need to add the Gear icon next to all of them so they can be reopened
def add_gear_icon(match):
    full_label = match.group(0)
    if 'gear-config-btn' in full_label: return full_label # already has gear
    
    val_match = re.search(r'value="([^"]+)"', full_label)
    if not val_match: return full_label
    val = val_match.group(1)
    
    gear_html = f'<span class="gear-config-btn" onclick="event.preventDefault(); openAppConfigModal(\'{val}\')" style="cursor:pointer; margin-left:auto; display:none;">⚙️</span>'
    return full_label.replace('</label>', f' {gear_html}\n</label>')

html = re.sub(r'<label class="app-item".*?</label>', add_gear_icon, html, flags=re.DOTALL)

# 4. Generate Modals for all apps
apps = ["firefox", "librewolf", "tor", "chromium", "neovim", "libreoffice", "rofi"] # Standard apps that need modals
modals_html = ""
for app in apps:
    modals_html += f"""
    <!-- {app} Config Modal -->
    <div id="modal-{app}" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeAppConfigModal('{app}')">×</span>
            <h3 style="font-family: monospace; color: #bb9af7; margin-top:0;">{app.capitalize()} Configuration</h3>
            <p>Configure sandboxing and Firejail rules for {app}.</p>
            <div class="form-group">
                <label>Sandboxing Strategy:</label>
                <select id="config-{app}-sandbox">
                    <option value="" selected>No Selection Provided</option>
                    <option value="none">No Sandbox (Native Execution)</option>
                    <option value="specific">Sandbox Specifically (firejail {app})</option>
                    <option value="all">Sandbox All Apps (firecfg --add-users)</option>
                </select>
            </div>
            <button class="btn" style="width:100%; margin-top:1rem;" onclick="saveAppConfig('{app}')">Save Configuration</button>
        </div>
    </div>
    """

if 'id="modal-firefox"' not in html:
    html = html.replace('<!-- Anti-Ducky Config Modal -->', modals_html + '\n    <!-- Anti-Ducky Config Modal -->')

with open('website/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("index.html rewritten with auto-opening modals and app-specific config.")
