import re
html = open('website/index.html', encoding='utf-8').read()
m = re.search(r'(?i)<div[^>]*id="post_apps_container"[^>]*>', html)
print(m.group(0) if m else 'Not found')
