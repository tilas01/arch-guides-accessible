import sys
import re

with open('website/script.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

target = r"bash install\.sh\`\)}\<\/code\>\<\/pre\>\s*\`;\s*\}"

replacement = r"""bash install.sh`)}</code></pre>
        `;
    }

    if (format === "script" || format === "both") {
        html += `
        <div class="output-actions" style="margin-top:1.5rem;">
            <h3 class="output-title script-edit">⚡ Bash Script — Live Editor</h3>
            <div style="display:flex;gap:0.4rem;">
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-script-code').innerText).then(()=>this.textContent='Copied!'); setTimeout(()=>this.textContent='Copy .sh',2000)">Copy .sh</button>
                <button class="btn" style="width:auto;padding:0.3rem 0.8rem;font-size:0.82rem;background:var(--accent-green);color:#000;" onclick="downloadFile(document.getElementById('raw-script-code').innerText, 'arch-install.sh')">💾 .sh</button>
            </div>
        </div>
        <pre class="output-box editor-script"><code id="raw-script-code" class="language-bash" contenteditable="true">${escapeHTML(scriptOutput)}</code></pre>
        `;
    }"""

if re.search(target, content):
    content = re.sub(target, replacement, content, count=1)
    with open('website/script.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Patched successfully!')
else:
    print('Target not found with regex!')
