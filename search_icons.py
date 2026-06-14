import sys

with open('website/wiki.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

count = text.count('\u2139')
print(f"Found {count} info icons in wiki.html")

if count > 0:
    text = text.replace('\u2139\ufe0f', '')
    text = text.replace('\u2139', '')
    with open('website/wiki.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Removed info icons from wiki.html")
