import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the Global Sandboxing Execution logic that I added earlier
js = re.sub(r'// Phase 4: Global Sandboxing Policy Execution.*?}\s*// Phase 4: Right-Click', '// Phase 4: Right-Click', js, flags=re.DOTALL)

# Add logic to process the specific app sandboxing configs
app_sandbox_logic = r"""
        // Phase 4: Specific App Sandboxing Execution
        if (post_apps.length > 0) {
            post_apps.forEach(app => {
                const confEl = document.getElementById(`config-${app}-sandbox`);
                if (confEl && confEl.value !== "" && confEl.value !== "none") {
                    o += `\n# --- Sandboxing for ${app} ---\n`;
                    o += `arch-chroot /mnt pacman -S --noconfirm firejail apparmor\n`;
                    if (confEl.value === "all") {
                        o += `arch-chroot /mnt firecfg --add-users $(ls /mnt/home)\n`;
                    }
                    o += `arch-chroot /mnt ln -sf /usr/bin/firejail /usr/local/bin/${app}\n`;
                }
            });
        }
"""
if "Phase 4: Specific App Sandboxing Execution" not in js:
    js = js.replace('if (arss_tools.length > 0) {', app_sandbox_logic + '\n        if (arss_tools.length > 0) {')

with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("script.js patched with App-Specific Sandboxing Modal checking.")
