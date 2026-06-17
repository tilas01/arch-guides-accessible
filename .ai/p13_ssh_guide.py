import re

html_path = 'website/live.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

ssh_guide = """
            <div class="alert info" style="margin-top:2rem;">
                <h3 style="margin-top:0;">🛡️ Pre-Secure SSH Setup Guide</h3>
                <p>Before executing the scripts on a remote machine, ensure your SSH connection is configured correctly:</p>
                <ul style="margin-top:0.5rem; margin-bottom:0;">
                    <li>1. Boot the target machine into the Arch ISO.</li>
                    <li>2. Set a root password: <code>passwd</code></li>
                    <li>3. Start the SSH daemon: <code>systemctl start sshd</code></li>
                    <li>4. Find the target IP: <code>ip a</code></li>
                    <li>5. Connect from this machine: <code>ssh root@&lt;target-ip&gt;</code></li>
                    <li>6. Copy and execute the <strong>Install Script</strong> block above.</li>
                </ul>
            </div>
"""

html = html.replace('<strong>GPG Signature Check:</strong> The scripts above dynamically embed GPG integrity checks. Always verify signatures before executing remote scripts.\n            </div>', '<strong>GPG Signature Check:</strong> The scripts above dynamically embed GPG integrity checks. Always verify signatures before executing remote scripts.\n            </div>\n' + ssh_guide)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
