import re

def fix_listeners():
    with open('website/script.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Make the live preview listen to raw-md-code
    old_listener = '''    const editor = document.getElementById('editor');
    if (editor) {
        editor.addEventListener('input', function() {
            if (window.marked && document.getElementById('preview')) {
                document.getElementById('preview').innerHTML = marked.parse(this.value);
            }
        });
    }'''
    
    new_listener = '''    const rawMdCode = document.getElementById('raw-md-code');
    if (rawMdCode) {
        rawMdCode.addEventListener('input', function() {
            if (window.marked && document.getElementById('preview')) {
                document.getElementById('preview').innerHTML = marked.parse(this.innerText);
            }
            // Sync back to hidden textarea if needed for downloads
            const hiddenEditor = document.getElementById('editor');
            if (hiddenEditor) hiddenEditor.value = this.innerText;
        });
    }
    
    const rawScriptCode = document.getElementById('raw-script-code');
    if (rawScriptCode) {
        rawScriptCode.addEventListener('input', function() {
            const hiddenScriptEditor = document.getElementById('script-editor');
            if (hiddenScriptEditor) hiddenScriptEditor.value = this.innerText;
        });
    }'''

    content = content.replace(old_listener, new_listener)

    # We also need to fix the 'Download Script' and 'Download Markdown' buttons to read from the contenteditable blocks
    content = content.replace("document.getElementById('script-editor').value", "(document.getElementById('raw-script-code') ? document.getElementById('raw-script-code').innerText : document.getElementById('script-editor').value)")
    content = content.replace("document.getElementById('editor').value", "(document.getElementById('raw-md-code') ? document.getElementById('raw-md-code').innerText : document.getElementById('editor').value)")

    with open('website/script.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_listeners()
    print("Listeners fixed!")
