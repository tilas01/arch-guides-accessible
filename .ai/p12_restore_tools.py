import re
import os

# 1. Update index.html
html_path = 'website/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

standalone_tools_html = """
                    <!-- ─── Tilas01 Standalone Security Tools ─── -->
                    <div class="form-step" 
                         data-title="🦀 Rust Security Apps" 
                         data-desc="Independent, memory-safe security applications written in Rust by tilas01. They integrate deeply with the kernel for intrusion detection, keystroke masking, and LUKS boot protection."
                         data-wiki="?page=tilas-security-tools.md">
                        <label>Install Standalone Rust Security Apps:</label>
                        <div class="checkbox-grid">
                            <label class="checkbox-item nav-tooltip" title="Input Guard (Anti-Ducky): Blocks unauthorized USB HID keystroke injection attacks.">
                                <input type="checkbox" name="rust_sec_apps" value="anti-ducky" id="rust-ducky"> Input Guard (Anti-Ducky)
                            </label>
                            <label class="checkbox-item nav-tooltip" title="Anti-Evil Maid: LUKS boot tampering protection and Evil Maid attack deterrence.">
                                <input type="checkbox" name="rust_sec_apps" value="anti-evil-maid" id="rust-evilmaid"> Anti-Evil Maid
                            </label>
                            <label class="checkbox-item nav-tooltip" title="Kernel Watcher: Deep system integrity monitoring. Watches for unauthorized module loading.">
                                <input type="checkbox" name="rust_sec_apps" value="kernel-watcher" id="rust-kernel"> Kernel Watcher (EDR)
                            </label>
                            <label class="checkbox-item nav-tooltip" title="ScareCrow: Advanced Linux Kernel Module (LKM) for Netfilter logging and Kprobe execution tracking.">
                                <input type="checkbox" name="rust_sec_apps" value="scarecrow" id="rust-scarecrow"> ScareCrow (LKM)
                            </label>
                            <label class="checkbox-item nav-tooltip" title="Kloak: Keystroke anonymization tool created by vmonaco.">
                                <input type="checkbox" name="rust_sec_apps" value="kloak" id="rust-kloak"> Kloak (Anonymizer)
                            </label>
                        </div>
                    </div>
"""
html = html.replace('<!-- ─── Other Security Tools ─── -->', standalone_tools_html + '\n                    <!-- ─── Other Security Tools ─── -->')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# 2. Update script.js
script_path = 'website/script.js'
with open(script_path, 'r', encoding='utf-8') as f:
    js = f.read()

rust_apps_logic = """
        const rust_sec_apps = [];
        document.querySelectorAll('input[name="rust_sec_apps"]:checked').forEach(cb => rust_sec_apps.push(cb.value));

        if (useCustomScripts && rust_sec_apps.length > 0) {
            o += `\\n# --- Standalone Security Applications ---\\n`;
            if (!cmdOnly) o += `\`\`\`\\n\\n## Rust Security Tools\\n\`\`\`bash\\n`;
            
            if (rust_sec_apps.includes("anti-ducky")) {
                o += `echo -e "\\${COLOR_BLUE}:: Installing Input Guard (Anti-Ducky)\\${COLOR_RESET}"\\n`;
                o += `cargo install anti-ducky --git https://github.com/tilas01/arch-guides-dynamic\\n`;
                o += `anti-ducky --approve-current\\n`;
            }
            if (rust_sec_apps.includes("anti-evil-maid")) {
                o += `echo -e "\\${COLOR_BLUE}:: Installing Anti-Evil Maid\\${COLOR_RESET}"\\n`;
                o += `cargo install anti-evil-maid --git https://github.com/tilas01/arch-guides-dynamic\\n`;
                o += `cat << 'AEM_DAEMON' > /etc/systemd/system/anti-evil-maid.service\\n[Unit]\\nDescription=Anti-Evil Maid Daemon\\nAfter=network.target\\n\\n[Service]\\nExecStart=/usr/local/bin/anti-evil-maid --daemon\\nRestart=always\\n\\n[Install]\\nWantedBy=multi-user.target\\nAEM_DAEMON\\n`;
                o += `systemctl enable anti-evil-maid.service\\n`;
            }
            if (rust_sec_apps.includes("kernel-watcher")) {
                o += `echo -e "\\${COLOR_BLUE}:: Installing Kernel Watcher (EDR)\\${COLOR_RESET}"\\n`;
                o += `cargo install kernel-watcher --git https://github.com/tilas01/arch-guides-dynamic\\n`;
                o += `cat << 'EOF' > /etc/systemd/system/kernel-watcher.service\\n[Unit]\\nDescription=Kernel Watcher EDR Daemon\\nAfter=network.target\\n\\n[Service]\\nExecStart=/usr/local/bin/kernel-watcher\\nRestart=always\\n\\n[Install]\\nWantedBy=multi-user.target\\nEOF\\n`;
                o += `systemctl enable kernel-watcher.service\\n`;
            }
            if (rust_sec_apps.includes("scarecrow")) {
                o += `echo -e "\\${COLOR_BLUE}:: Installing ScareCrow (LKM)\\${COLOR_RESET}"\\n`;
                o += `cargo install scarecrow --git https://github.com/tilas01/arch-guides-dynamic\\n`;
                o += `cat << 'EOF' > /etc/systemd/system/scarecrow.service\\n[Unit]\\nDescription=ScareCrow Sandbox Spoofing\\nAfter=network.target\\n\\n[Service]\\nExecStart=/usr/local/bin/scarecrow\\nRestart=always\\n\\n[Install]\\nWantedBy=multi-user.target\\nEOF\\n`;
                o += `systemctl enable scarecrow.service\\n`;
            }
            if (rust_sec_apps.includes("kloak")) {
                o += `echo -e "\\${COLOR_BLUE}:: Installing Kloak\\${COLOR_RESET}"\\n`;
                o += `pacman -S --noconfirm kloak\\n`;
                o += `systemctl enable kloak.service\\n`;
            }
            
            if (!cmdOnly) o += `\\`\\`\\`\\n\\n\`\`\`bash\\n`;
        }
"""
js = js.replace('// Other Security Tools', rust_apps_logic + '\n        // Other Security Tools')

with open(script_path, 'w', encoding='utf-8') as f:
    f.write(js)


# 3. Create tilas-security-tools.md in docs
md_path = 'website/docs/tilas-security-tools.md'
with open(md_path, 'w', encoding='utf-8') as f:
    f.write("""# 🦀 Rust Security Apps

The following are individual, standalone security applications authored by tilas01 to provide granular, specific hardening for Arch Linux.

### Input Guard (Anti-Ducky)
Input Guard is a daemon that monitors the Linux kernel input subsystem (`/dev/input/event*`) for keystroke injection attacks typically executed by malicious USB devices (like the Hak5 Rubber Ducky). It fingerprints the speed and cadence of typing, and aggressively sandboxes or drops the USB interface if the input speed wildly exceeds human capabilities.

### Anti-Evil Maid
Protects against physical tampering of the `/boot` partition. This daemon hashes your LUKS header, bootloader payload, and initramfs, securely sealing those checksums with your TPM 2.0 module. Upon boot, it verifies the hashes before prompting for decryption, deterring "Evil Maid" attacks where an attacker modifies the bootloader to steal your password.

### Kernel Watcher (EDR)
An advanced Endpoint Detection and Response (EDR) agent that leverages eBPF and `kprobes` to actively monitor unauthorized kernel module loading, anomalous system calls, and attempts to modify `/proc/kcore` or `kallsyms`.

### ScareCrow (LKM)
A highly specialized Linux Kernel Module (LKM) that creates deceptive hooks and decoys at Ring-0. It leverages Netfilter to spoof active services on unused ports to trap automated scanners, and uses Kprobes to log execution of sensitive binaries without userspace evasion.

### Kloak
Kloak (created by vmonaco) is a keystroke anonymizer that adds random delays to keyboard events. This defeats keystroke biometric profiling, where advanced trackers identify you based on the unique timing patterns of your typing.
""")

# 4. Update tooltip.js
tooltip_path = 'website/tooltip.js'
with open(tooltip_path, 'r', encoding='utf-8') as f:
    tt = f.read()

new_mapping = "        '🛡️ Post-Quantum Libre-OTP':       '?page=libre-otp.md',\n        '🦀 Rust Security Apps':           '?page=tilas-security-tools.md',\n"
tt = tt.replace("        '🛡️ Post-Quantum Libre-OTP':       '?page=libre-otp.md',\n", new_mapping)

with open(tooltip_path, 'w', encoding='utf-8') as f:
    f.write(tt)

# 5. Make sure the .ai directory exists and script is moved
if not os.path.exists('.ai'):
    os.makedirs('.ai')
