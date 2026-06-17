import re

html_path = 'website/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Change <div class="app-grid" id="post_apps_container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:0.6rem;">
# to <div class="app-grid-container" id="post_apps_container">
html = re.sub(r'<div class="app-grid" id="post_apps_container" style="display:grid; grid-template-columns:repeat\(auto-fill, minmax\(220px, 1fr\)\); gap:0\.6rem;">',
              r'<div class="app-grid-container" id="post_apps_container">', html)

# 2. Change <div class="checkbox-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:0.6rem;">
# to <div class="app-grid-container">
html = re.sub(r'<div class="checkbox-grid" style="display:grid; grid-template-columns:repeat\(auto-fill, minmax\(220px, 1fr\)\); gap:0\.6rem;">',
              r'<div class="app-grid-container">', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html layout.")

# 3. Update script.js for enforcement logic and capitalization
js_path = 'website/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

validation_hook = """
    if (fw === "bios" && part.includes("luks2")) errors.push(`<li style="margin-bottom:0.3rem;"><span style="color:var(--accent-red);font-weight:bold;">GRUB has limited LUKS2 support on BIOS. Use LUKS1.</span></li>`);

    // Enforce Required App Configuration
    document.querySelectorAll('input[name="post_apps"]:checked').forEach(cb => {
        if (cb.dataset.requiresConfig === "true" && cb.dataset.configured === "false") {
            const appName = cb.parentElement.querySelector('a')?.innerText || cb.value;
            errors.push(`<li style="margin-bottom:0.3rem;"><span style="color:var(--accent-red);font-weight:bold;">[!] Configuration Required:</span> You must click the ⚙️ gear icon to configure <strong>${appName}</strong> before generating!</li>`);
        }
    });
"""

# Inject validation logic
if "Enforce Required App Configuration" not in js:
    js = js.replace('if (fw === "bios" && part.includes("luks2")) errors.push(`<li style="margin-bottom:0.3rem;"><span style="color:var(--accent-red);font-weight:bold;">GRUB has limited LUKS2 support on BIOS. Use LUKS1.</span></li>`);', validation_hook)

# Fix capitalization in openAppConfigModal
fallback_title = "title.innerHTML = `⚙️ ${appId} Configuration`;"
capitalized_title = "const capId = appId.charAt(0).toUpperCase() + appId.slice(1);\n        title.innerHTML = `⚙️ ${capId} Configuration`;"
if "const capId" not in js:
    js = js.replace(fallback_title, capitalized_title)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated script.js logic.")
