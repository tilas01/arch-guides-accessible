import re
import os

html_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-dynamic\website\index.html"

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Regex to find app-items. We look for:
# <label class="app-item"...>
#   <input type="checkbox" name="post_apps" value="...".*>
#   <span class="app-icon">...</span> ...
# </label>

def replacer(match):
    full_match = match.group(0)
    
    # 1. Add data-requires-config="true" to the input checkbox if not already there
    if 'data-requires-config' not in full_match:
        full_match = re.sub(r'(<input type="checkbox" name="(?:post_apps|arss_tools)"[^>]*?)(>)', r'\1 data-requires-config="true" data-configured="false"\2', full_match)
        
    # 2. Add the Gear icon before the closing </label> if it doesn't exist
    if 'gear-config-btn' not in full_match:
        # Extract the value/name of the app for the modal
        val_match = re.search(r'value="([^"]+)"', full_match)
        app_id = val_match.group(1) if val_match else "app"
        
        gear_html = f' <span class="gear-config-btn" onclick="event.preventDefault(); openAppConfigModal(\'{app_id}\')" style="cursor:pointer; margin-left:auto; display:none;">⚙️</span>'
        full_match = re.sub(r'(</label>)', gear_html + r'\n\1', full_match)
        
    # 3. Add explicit repo links based on the title attribute (Website: ... or Source: 📁 AUR)
    # The user wants 📁 or 🌐 under the app or next to it. 
    # The HTML currently has <a href="..."> inside the label for some. We'll leave existing links, 
    # but the gear icon fulfills the main overlay requirement.
    
    return full_match

new_html = re.sub(r'<label class="app-item"[\s\S]*?</label>', replacer, html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Successfully injected UI components into index.html")
