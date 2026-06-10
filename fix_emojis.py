import os
import glob

def fix_emojis():
    files = glob.glob('docs/**/*.md', recursive=True) + glob.glob('website/**/*.html', recursive=True) + ['README.md']
    
    for filepath in files:
        if os.path.isfile(filepath):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            if '??' in content:
                content = content.replace('## ?? Legal Disclaimer', '## ⚖️ Legal Disclaimer')
                content = content.replace('## ??? Legal Disclaimer', '## ⚖️ Legal Disclaimer')
                content = content.replace('> *?? AI-Generated', '> *⚠️ AI-Generated')
                content = content.replace('> *??? AI-Generated', '> *⚠️ AI-Generated')
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

if __name__ == '__main__':
    fix_emojis()
    print("Fixed emojis!")
