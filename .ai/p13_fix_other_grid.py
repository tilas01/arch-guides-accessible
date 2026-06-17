import re
html_path = 'website/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<div class="app-grid" id="other-security-grid" style="display:grid; grid-template-columns:repeat\(auto-fill, minmax\(220px, 1fr\)\); gap:0\.6rem;">',
              r'<div class="app-grid-container" id="other-security-grid">', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Fixed other-security-grid")
