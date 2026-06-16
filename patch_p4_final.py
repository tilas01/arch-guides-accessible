import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

conflict_logic = """
    // Phase 4: Conflict Checks
    const deConf = document.getElementById('desktop_env') ? document.getElementById('desktop_env').value : 'none';
    const rofiSelected = document.querySelector('input[name="post_apps"][value="rofi"]')?.checked;
    
    if (deConf === "duskyos" && rofiSelected) {
        missingFields.push("Conflict: DuskyOS (Custom Tiling WM) relies on its native launcher. Please deselect Rofi to prevent X11 keybind conflicts.");
    }
"""

if "Phase 4: Conflict Checks" not in js:
    js = js.replace('const errorBox = document.getElementById(\'generate-error-box\');', conflict_logic + '\n    const errorBox = document.getElementById(\'generate-error-box\');')

with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

# Update Root README.md
with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

header_links = """
<p align="center">
  <a href="https://tilas01.github.io/arch-guides-dynamic/"><strong>🌐 Open the Interactive Web Generator</strong></a> • 
  <a href="https://tilas01.github.io/arch-guides-dynamic/wiki.html"><strong>📚 Read the Full Documentation Wiki</strong></a>
</p>
"""

if "Open the Interactive Web Generator" not in readme:
    readme = readme.replace('# Arch Guides Dynamic\n', '# Arch Guides Dynamic\n' + header_links)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme)

print("Conflict checks and README links applied.")
