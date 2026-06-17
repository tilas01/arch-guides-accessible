import re

js_path = 'website/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

target = "// Dusky OS auto-setup"
injection = """
        // Standalone Security Apps
        const secApps = [
            { id: 'libre-otp', name: 'Libre-OTP Authenticator', repo: 'libre-otp' },
            { id: 'anti-ducky', name: 'Input Guard (Anti-Ducky)', repo: 'anti-ducky' },
            { id: 'anti-evil-maid', name: 'Anti-Evil Maid', repo: 'anti-evil-maid' },
            { id: 'kernel-watcher', name: 'Kernel Watcher (EDR)', repo: 'kernel-watcher' },
            { id: 'scarecrow', name: 'ScareCrow (LKM)', repo: 'scarecrow' },
            { id: 'kloak', name: 'Kloak (Keystroke Obfuscator)', repo: 'kloak' }
        ];

        secApps.forEach(app => {
            if (post_apps.includes(app.id)) {
                if (!cmdOnly) o += `\\`\\`\\`\\n\\n### ${app.name} Setup\\n\\`\\`\\`bash\\n`;
                else o += `\\n# Setup ${app.name}\\n`;
                o += `git clone https://github.com/tilas01/${app.repo}.git /opt/${app.repo}\\n`;
                o += `cd /opt/${app.repo}\\n`;
                if (app.id === 'kloak') {
                    o += `make\\nsudo make install\\n`;
                } else {
                    o += `cargo build --release\\nsudo cp target/release/${app.repo} /usr/local/bin/\\n`;
                }
                o += `cd -\\n`;
                if (!cmdOnly) o += `\\`\\`\\`\\n\\n`;
            }
        });

        // Dusky OS auto-setup"""

if target in js and "Standalone Security Apps" not in js:
    js = js.replace(target, injection)
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Injected generator logic successfully.")
else:
    print("Failed to inject generator logic or already exists.")
