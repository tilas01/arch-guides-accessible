import re

# 1. Update index.html
html_path = 'website/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Add Libre-OTP section under Security Tools
libre_otp_html = """
                    <!-- ─── Post-Quantum Libre-OTP ─── -->
                    <div class="form-step" 
                         data-title="🛡️ Post-Quantum Libre-OTP" 
                         data-desc="Libre-OTP provides hardware-backed, post-quantum resilient Multi-Factor Authentication. It utilizes SHA-512 and memory zeroization to protect against cold-boot attacks. It can be integrated into the LUKS Boot decryption screen, standard Login (PAM), and SSH."
                         data-wiki="?page=libre-otp.md">
                        <label>Integrate Libre-OTP (MFA):</label>
                        <div class="checkbox-grid">
                            <label class="checkbox-item nav-tooltip" title="Require Libre-OTP token before decrypting LUKS at boot.">
                                <input type="checkbox" name="otp_integration" value="boot" id="otp-boot"> Boot Decryption
                            </label>
                            <label class="checkbox-item nav-tooltip" title="Require Libre-OTP token during standard TTY/Display Manager login.">
                                <input type="checkbox" name="otp_integration" value="login" id="otp-login"> System Login (PAM)
                            </label>
                            <label class="checkbox-item nav-tooltip" title="Require Libre-OTP token for remote SSH access.">
                                <input type="checkbox" name="otp_integration" value="ssh" id="otp-ssh"> SSH Access
                            </label>
                        </div>
                    </div>
"""
html = html.replace('<!-- ─── Other Security Tools ─── -->', libre_otp_html + '\n                    <!-- ─── Other Security Tools ─── -->')

# Update LUKS1 vs LUKS2 warning in the Encryption Options
luks_warning = """
                        <p style="font-size: 0.8rem; color: var(--accent-orange); margin-top: 0.5rem;">
                            <strong>⚠️ LUKS1 vs LUKS2:</strong> LUKS2 uses Argon2id, which is significantly more resistant to post-quantum and GPU brute-force attacks than LUKS1 (PBKDF2). However, <strong>GRUB does not natively support LUKS2 Argon2id</strong>. If using GRUB, you must use LUKS1 or an unencrypted `/boot`. Systemd-boot (UKI) fully supports LUKS2 Argon2id.
                        </p>
"""
html = html.replace('<div id="luks-options"', luks_warning + '<div id="luks-options"')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# 2. Update script.js
script_path = 'website/script.js'
with open(script_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Add Libre-OTP processing to script.js
otp_logic = """
        const otp_integration = [];
        document.querySelectorAll('input[name="otp_integration"]:checked').forEach(cb => otp_integration.push(cb.value));

        if (useCustomScripts && otp_integration.length > 0) {
            o += `\\n# --- Post-Quantum Libre-OTP Installation ---\\n`;
            if (!cmdOnly) o += `\`\`\`\\n\\n## 7. Libre-OTP Post-Quantum Security\\n\`\`\`bash\\n`;
            o += `echo -e "\\${COLOR_BLUE}:: Installing Libre-OTP Post-Quantum MFA\\${COLOR_RESET}"\\n`;
            o += `cargo install libre-otp --git https://github.com/tilas01/arch-guides-dynamic\\n`;
            
            if (otp_integration.includes("boot")) {
                o += `echo -e "\\${COLOR_FG}Configuring LUKS Plymouth boot hook for Tokyo Night...\\${COLOR_RESET}"\\n`;
                o += `\\n# Custom Tokyo Night LUKS Monospace Prompt\\n`;
                o += `pacman -S --noconfirm plymouth\\n`;
                o += `cat << 'PLYMOUTH' > /usr/share/plymouth/themes/tokyonight/tokyonight.plymouth\\n[Plymouth Theme]\\nName=Tokyo Night Monospace\\nDescription=A custom monospace theme with Tokyo Night palette\\nModuleName=script\\n\\n[script]\\nImageDir=/usr/share/plymouth/themes/tokyonight\\nScriptFile=/usr/share/plymouth/themes/tokyonight/tokyonight.script\\nPLYMOUTH\\n`;
                o += `plymouth-set-default-theme -R tokyonight\\n`;
            }
            if (otp_integration.includes("login")) {
                o += `echo -e "\\${COLOR_FG}Integrating Libre-OTP into PAM system-auth...\\${COLOR_RESET}"\\n`;
                o += `sed -i '1i auth required pam_exec.so expose_authtok /usr/local/bin/libre-otp --verify' /etc/pam.d/system-auth\\n`;
            }
            if (otp_integration.includes("ssh")) {
                o += `echo -e "\\${COLOR_FG}Enforcing Libre-OTP for SSH...\\${COLOR_RESET}"\\n`;
                o += `echo "AuthenticationMethods publickey,keyboard-interactive" >> /etc/ssh/sshd_config\\n`;
                o += `echo "ForceCommand /usr/local/bin/libre-otp --ssh" >> /etc/ssh/sshd_config\\n`;
            }
            if (!cmdOnly) o += `\\`\\`\\`\\n\\n\`\`\`bash\\n`;
        }
"""
js = js.replace('// Other Security Tools', otp_logic + '\n        // Other Security Tools')

# Add Decoy/Duress shutdown logic
duress_logic = """
            if (duressOption !== 'none') {
                o += `\\n# --- Decoy/Duress Configuration ---\\n`;
                if (!cmdOnly) o += `\`\`\`\\n\\n## Duress Protection\\n\`\`\`bash\\n`;
                o += `echo -e "\\${COLOR_BLUE}:: Configuring Duress Password Shutdown Logic\\${COLOR_RESET}"\\n`;
                o += `cat << 'DURESS' > /usr/local/bin/duress-trigger.sh\\n#!/bin/bash\\n# If the duress password is used, instantly power off to leave duress mode\\n# and prevent access to the decoy or main system\\necho "Duress password detected! Immediate shutdown."\\nsystemctl poweroff -f\\nDURESS\\n`;
                o += `chmod +x /usr/local/bin/duress-trigger.sh\\n`;
            }
"""
js = js.replace('const userSetupStr =', duress_logic + '\n        const userSetupStr =')

with open(script_path, 'w', encoding='utf-8') as f:
    f.write(js)
