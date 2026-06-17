import re

html_path = 'website/wiki.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

advanced_config_section = """
    <div class="section" id="app-config">
        <h2><span class="icon">⚙️</span> Advanced App Configuration</h2>
        <p>Some applications, particularly advanced security tools and system utilities, require manual configuration before generation. When you select an app that requires configuration, a ⚙️ gear icon will appear. You <strong>must</strong> click this gear icon to set your preferences, otherwise the generator will block script creation.</p>
        
        <h3 id="advanced-config-doas">Doas Wrapper Modes</h3>
        <ul>
            <li><strong>Keep Sudo:</strong> Installs Doas alongside Sudo. Safe, but retains the larger attack surface of Sudo.</li>
            <li><strong>Replace Sudo (Symlink):</strong> Removes Sudo and symlinks the <code>sudo</code> command to <code>doas</code>. Recommended for maximum compatibility with AUR helpers.</li>
            <li><strong>Remove Sudo:</strong> Completely removes Sudo. Most secure, but some scripts expecting <code>sudo</code> may fail.</li>
        </ul>

        <h3 id="advanced-config-snapper">Snapper Timeline</h3>
        <ul>
            <li><strong>Pre/Post Only:</strong> Takes snapshots only when pacman installs/updates packages. Saves disk space.</li>
            <li><strong>Enable Timeline:</strong> Automatically takes hourly/daily snapshots of the entire filesystem. Recommended for development machines.</li>
        </ul>

        <h3 id="advanced-config-aem">Anti-Evil Maid (AEM) Decoys</h3>
        <ul>
            <li><strong>1 Decoy:</strong> Standard protection. Places a decoy kernel and bootloader config to verify physical integrity.</li>
            <li><strong>2-3 Decoys (Paranoid):</strong> Increases the cryptographic difficulty of replacing the kernel, at the cost of significantly longer boot times.</li>
        </ul>
        
        <h3 id="advanced-config-libre-otp">Libre-OTP PAM Modes</h3>
        <ul>
            <li>Allows you to hook Time-Based One-Time Passwords (TOTP) directly into system-level operations like <code>sudo</code>, <code>su</code>, SSH logins, and even LUKS decrypt sequences on boot.</li>
        </ul>
    </div>
"""

if "Advanced App Configuration" not in html:
    html = html.replace('</body>', advanced_config_section + '\n</body>')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected wiki content successfully.")
else:
    print("Wiki content already exists.")
