import re

def update_html():
    with open('website/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Prism.js to head
    if 'prism.js' not in content:
        content = content.replace('</head>', '    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>\n</head>')

    # Change post_apps from select to checkboxes
    old_post_apps = '''<select id="post_apps">
                            <option value="none" selected>None (Minimal Base System Only)</option>
                            <option value="paru">AUR Helper (paru)</option>
                            <option value="standard">Standard Desktop (Browser, Signal, AUR Helper)</option>
                            <option value="full">Full Productivity & Dev Setup</option>
                        </select>'''
    
    new_post_apps = '''<div id="post_apps_container" style="display:flex; flex-direction:column; gap:0.5rem; background: var(--bg-dark); padding: 1rem; border: 1px solid var(--accent-purple); border-radius:4px;">
                            <label><input type="checkbox" name="post_apps" value="paru" checked> AUR Helper (paru)</label>
                            <label><input type="checkbox" name="post_apps" value="firefox" checked> Firefox Web Browser</label>
                            <label><input type="checkbox" name="post_apps" value="librewolf"> LibreWolf Web Browser</label>
                            <label><input type="checkbox" name="post_apps" value="signal"> Signal Desktop</label>
                            <label><input type="checkbox" name="post_apps" value="neovim" checked> Neovim / Dev Tools</label>
                        </div>'''
    if old_post_apps in content:
        content = content.replace(old_post_apps, new_post_apps)

    # Add Dusky OS integration
    old_desktop = '''<option value="dwm">DWM (Minimal Window Manager)</option>'''
    new_desktop = old_desktop + '\n                            <option value="dusky">Dusky OS (Fully riced fast OS - dusklinux/dusky)</option>'
    if 'dusky' not in content:
        content = content.replace(old_desktop, new_desktop)

    # Add Multi-user account setup
    multi_user_html = '''
                    <div class="form-group form-step" data-title="Multi-User Setup" data-desc="Select the number of regular non-root users. Max 1 root account. Select how you want to use root over SSH.">
                        <label>Regular Non-Root Users (count):</label>
                        <input type="number" id="user_count" min="1" max="5" value="1" style="margin-bottom: 1rem;">
                        
                        <label>Root SSH Access:</label>
                        <select id="root_ssh">
                            <option value="no" selected>No (Only sudo/doas allowed over SSH)</option>
                            <option value="yes">Yes (Allow direct root SSH)</option>
                        </select>
                    </div>
    '''
    if 'Multi-User Setup' not in content:
        content = content.replace('<div class="form-group form-step" data-title="System Cleanup"', multi_user_html + '\n                    <div class="form-group form-step" data-title="System Cleanup"')

    # Add OTP SHA configuration
    otp_sha_html = '''
                        <div class="form-group form-step" id="otp-sha-container" data-title="Libre OTP SHA Algorithm" data-desc="Select the hashing algorithm for OTP. SHA1 is standard.">
                            <label>OTP Hash Algorithm:</label>
                            <select id="otp_sha">
                                <option value="sha1" selected>SHA1 (Default / Highest Compatibility)</option>
                                <option value="sha256">SHA256 (High Security)</option>
                                <option value="sha512">SHA512 (Maximum Security)</option>
                            </select>
                        </div>
    '''
    if 'otp-sha-container' not in content:
        content = content.replace('</select>\n                        </div>\n\n                    <div class="form-group form-step" data-title="Keystroke Anonymisation"', '</select>\n                        </div>\n' + otp_sha_html + '\n                    <div class="form-group form-step" data-title="Keystroke Anonymisation"')

    # Add DNS options
    old_dns = '<option value="dnscrypt-proxy">dnscrypt-proxy (Encrypted proxy)</option>'
    new_dns = old_dns + '\n                            <option value="bind">BIND (Authoritative / Complex)</option>\n                            <option value="dnsmasq">dnsmasq (Lightweight)</option>'
    if 'dnsmasq' not in content:
        content = content.replace(old_dns, new_dns)

    # Add "Arch ISO Network/SSH Setup" dropdown
    ssh_setup_html = '''
                    <div class="form-group form-step" data-title="Arch ISO Setup Utilities" data-desc="Start SSH server on Arch ISO to remotely run this script, and optionally download curl.">
                        <label>Arch ISO Pre-Install Setup:</label>
                        <select id="iso_setup">
                            <option value="none" selected>None (Running locally on ISO)</option>
                            <option value="ssh">Start SSHd & Print Password (Run over SSH)</option>
                            <option value="ssh_curl">Start SSHd + Download curl via pacman</option>
                        </select>
                    </div>
    '''
    if 'Arch ISO Setup Utilities' not in content:
        content = content.replace('<div class="form-group form-step" data-title="Output Format"', ssh_setup_html + '\n                    <div class="form-group form-step" data-title="Output Format"')

    # Output Section wrapping
    content = content.replace('<div class="markdown-body" id="generated-guide"></div>', '<div id="generated-guide"></div>')

    with open('website/index.html', 'w', encoding='utf-8') as f:
        f.write(content)


def update_js():
    with open('website/script.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Read new vars
    new_vars = '''
    const user_count = document.getElementById('user_count') ? document.getElementById('user_count').value : '1';
    const root_ssh = document.getElementById('root_ssh') ? document.getElementById('root_ssh').value : 'no';
    const otp_sha = document.getElementById('otp_sha') ? document.getElementById('otp_sha').value : 'sha1';
    const iso_setup = document.getElementById('iso_setup') ? document.getElementById('iso_setup').value : 'none';
    
    // Get checkboxes for post_apps
    let post_apps = [];
    const appCheckboxes = document.querySelectorAll('input[name="post_apps"]:checked');
    appCheckboxes.forEach((cb) => post_apps.push(cb.value));
    '''
    if 'const user_count =' not in content:
        content = content.replace("const format = document.getElementById('outputformat').value;", "const format = document.getElementById('outputformat').value;\n" + new_vars)

    # Replace old post_apps assignment
    content = re.sub(r"const post_apps = document\.getElementById\('post_apps'\) \? document\.getElementById\('post_apps'\)\.value : 'none';", "// post_apps handled above", content)

    # Update builder output logic for post_apps
    # Old logic: if (post_apps !== "none") ...
    new_post_apps_logic = '''
    if (post_apps.length > 0) {
        if (!cmdOnly) output += `\\n# Installing Post-Install Applications (${post_apps.join(', ')})\\n`;
        output += `pacman -S --noconfirm git base-devel\\n`;
        output += `echo "Setting up temporary build user for AUR..."\\n`;
        output += `useradd -m -G wheel -s /bin/bash builder\\n`;
        output += `echo "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/builder\\n`;
        
        if (post_apps.includes("paru")) {
            output += `su - builder -c "git clone https://aur.archlinux.org/paru.git /tmp/paru && cd /tmp/paru && makepkg -si --noconfirm"\\n`;
        }
        
        let standard_apps = [];
        if (post_apps.includes("firefox")) standard_apps.push("firefox");
        if (post_apps.includes("librewolf")) standard_apps.push("librewolf");
        if (post_apps.includes("signal")) standard_apps.push("signal-desktop");
        if (post_apps.includes("neovim")) standard_apps.push("neovim");
        
        if (standard_apps.length > 0) {
            output += `su - builder -c "paru -S --noconfirm ${standard_apps.join(' ')}"\\n`;
        }
        
        output += `userdel -r builder\\n`;
        output += `rm -f /etc/sudoers.d/builder\\n`;
    }
    '''
    
    content = re.sub(r'if \(post_apps !== "none"\) \{.*?rm -f /etc/sudoers\.d/builder\\n\s*\}', new_post_apps_logic, content, flags=re.DOTALL)

    # Add Dusky OS install logic
    dusky_logic = '''
    } else if (desktop === "dusky") {
        output += `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\\n`;
        output += `su - builder -c "git clone https://github.com/dusklinux/dusky.git /tmp/dusky && cd /tmp/dusky && ./install.sh"\\n`;
    }
    '''
    if 'desktop === "dusky"' not in content:
        content = content.replace('} else if (desktop === "dwm") {', dusky_logic.strip() + '\n    } else if (desktop === "dwm") {')

    # Update ISO setup and CURL output
    output_wrapping = '''
    let isoSetupCmd = "";
    if (iso_setup === "ssh") {
        isoSetupCmd = "systemctl start sshd\\necho 'root:arch' | chpasswd\\n# Now connect via: ssh root@<ip-address>";
    } else if (iso_setup === "ssh_curl") {
        isoSetupCmd = "pacman -Sy --noconfirm curl\\nsystemctl start sshd\\necho 'root:arch' | chpasswd\\n# Now connect via: ssh root@<ip-address>";
    }
    
    let sshDeployCommand = `curl -sL https://YOUR_WEBSITE_URL/install.sh | bash`; // This will be dynamic based on user upload/hosting
    
    let renderedHTML = "";
    
    // Create live syntax-highlighted containers with Tokyo Night scheme and word-wrap
    const wrapStyle = "word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; background: var(--bg-dark); padding: 1.5rem; border: 1px solid var(--accent-purple); border-radius: 8px; max-width: 100%; box-sizing: border-box;";
    
    if (format === "script") {
        let scriptOutput = buildOutput(true);
        renderedHTML = `
            ${isoSetupCmd ? `<div class="alert warning"><strong>Arch ISO Pre-Setup:</strong><br><pre><code>${isoSetupCmd}</code></pre></div>` : ''}
            <div class="alert info">Review the executable bash script below. It is syntax highlighted.</div>
            <h3>Raw Executable Bash Script:</h3>
            <div style="position: relative;">
                <button class="btn" style="position: absolute; top: 10px; right: 10px; width: auto; padding: 0.5rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-script-code').innerText)">Copy</button>
                <pre style="${wrapStyle}"><code id="raw-script-code" class="language-bash" contenteditable="true">${scriptOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; border: 1px solid var(--accent-cyan); border-radius: 8px; background: rgba(125, 207, 255, 0.1);">
                <strong>Interactive Deploy Command (Copy/Paste this into your Arch ISO over SSH):</strong><br>
                <code style="word-wrap: break-word;">cat &lt;&lt; 'EOF' &gt; install.sh<br>${scriptOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}<br>EOF<br>bash install.sh</code>
            </div>
        `;
    } else if (format === "both") {
        let mdOutput = buildOutput(false);
        let scriptOutput = buildOutput(true);
        renderedHTML = `
            ${isoSetupCmd ? `<div class="alert warning"><strong>Arch ISO Pre-Setup:</strong><br><pre><code>${isoSetupCmd}</code></pre></div>` : ''}
            <div class="alert info">You chose BOTH. Below is the Markdown Guide. Underneath it is the Raw Script. <strong>You can edit the code directly in the highlighted boxes!</strong></div>
            
            <div style="display:flex; justify-content: space-between; align-items: center;">
                <h3>Markdown Guide Editor:</h3>
                <button class="btn" style="width: auto; padding: 0.5rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-md-code').innerText)">Copy MD</button>
            </div>
            <textarea id="editor" style="display:none;">${mdOutput}</textarea>
            <pre style="${wrapStyle}"><code id="raw-md-code" class="language-markdown" contenteditable="true">${mdOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
            
            <h3>Live Preview (Generated from Markdown):</h3>
            <div id="preview" style="${wrapStyle} margin-bottom: 2rem;" class="markdown-body"></div>
            
            <div style="display:flex; justify-content: space-between; align-items: center;">
                <h3>Raw Executable Bash Script:</h3>
                <button class="btn" style="width: auto; padding: 0.5rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-script-code').innerText)">Copy Script</button>
            </div>
            <pre style="${wrapStyle}"><code id="raw-script-code" class="language-bash" contenteditable="true">${scriptOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
            
            <div style="margin-top: 1rem; padding: 1rem; border: 1px solid var(--accent-cyan); border-radius: 8px; background: rgba(125, 207, 255, 0.1);">
                <strong>Interactive Deploy Command (Copy/Paste this into your Arch ISO over SSH):</strong><br>
                <code style="word-wrap: break-word;">cat &lt;&lt; 'EOF' &gt; install.sh<br>${scriptOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}<br>EOF<br>bash install.sh</code>
            </div>
        `;
    } else {
        let mdOutput = buildOutput(false);
        renderedHTML = `
            <div class="alert warning">You may edit the markdown guide locally before confirming/saving.</div>
            <div style="display:flex; justify-content: space-between; align-items: center;">
                <h3>Markdown Guide Editor:</h3>
                <button class="btn" style="width: auto; padding: 0.5rem;" onclick="navigator.clipboard.writeText(document.getElementById('raw-md-code').innerText)">Copy MD</button>
            </div>
            <textarea id="editor" style="display:none;">${mdOutput}</textarea>
            <pre style="${wrapStyle}"><code id="raw-md-code" class="language-markdown" contenteditable="true">${mdOutput.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
            <h3>Live Preview:</h3>
            <div id="preview" style="${wrapStyle}" class="markdown-body"></div>
        `;
    }

    document.getElementById('generated-guide').innerHTML = renderedHTML;
    if (window.Prism) Prism.highlightAll();
    '''
    
    # We will replace the entire rendering block at the bottom
    content = re.sub(r'let renderedHTML = "";.*?if \(!auto\) \{', output_wrapping + '\n    if (!auto) {', content, flags=re.DOTALL)

    with open('website/script.js', 'w', encoding='utf-8') as f:
        f.write(content)


if __name__ == '__main__':
    update_html()
    update_js()
    print("Patched successfully!")
