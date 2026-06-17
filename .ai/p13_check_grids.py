import re
html = open('website/index.html', encoding='utf-8').read()
m1 = re.search(r'(?i)<div[^>]*id="other-security-grid"[^>]*>', html)
print(m1.group(0) if m1 else 'other-security-grid Not found')

m2 = re.search(r'(?i)<div[^>]*class="checkbox-grid"[^>]*>', html)
print(m2.group(0) if m2 else 'checkbox-grid Not found')
