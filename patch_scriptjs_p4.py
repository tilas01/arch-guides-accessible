import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Right Click Teleport
right_click_js = """
// Phase 4: Right-Click Teleport to Wiki
document.addEventListener('contextmenu', function(e) {
    let target = e.target.closest('.app-item, .app-card, .form-step label');
    if (target) {
        e.preventDefault();
        let input = target.querySelector('input, select');
        let id = input ? (input.id || input.name || input.value) : '';
        if (id) {
            window.open('wiki.html#' + id, '_blank');
        } else {
            // Fallback to text content
            let text = target.innerText.split('\\n')[0].replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
            window.open('wiki.html#' + text, '_blank');
        }
    }
});
"""
if "Right-Click Teleport to Wiki" not in js:
    js += "\n" + right_click_js

# 2. Desktop Environment logic in generateScript()
de_vars_js = """
        const desktopEnv = document.getElementById('desktop_env') ? document.getElementById('desktop_env').value : 'none';
        const globalSandboxing = document.getElementById('global_sandboxing') ? document.getElementById('global_sandboxing').value : 'all';
"""
if "const desktopEnv" not in js:
    js = js.replace('const userCount = document.getElementById(\'user_count\').value;', 'const userCount = document.getElementById(\'user_count\').value;' + de_vars_js)

# 3. Apply DE / WM Logic + Dusky OS conflict resolution
de_logic = r"""
        // Phase 4: Desktop Environment & DuskyOS Injection
        let dePkg = "";
        let deEnableCmd = "";
        
        if (desktopEnv === "duskyos") {
            dePkg = "duskyos xorg-server xorg-xinit";
            deEnableCmd = `echo "exec duskyos" > /mnt/home/$(ls /mnt/home | head -n 1)/.xinitrc\n`;
            o += `\n# --- DuskyOS WM Override ---\n`;
            o += `echo "Installing DuskyOS (Custom Tiling WM)..."\n`;
        } else if (desktopEnv === "gnome") {
            dePkg = "gnome gdm";
            deEnableCmd = `arch-chroot /mnt systemctl enable gdm\n`;
            o += `\n# --- GNOME DE ---\n`;
        } else if (desktopEnv === "kde_minimal") {
            dePkg = "plasma-desktop sddm";
            deEnableCmd = `arch-chroot /mnt systemctl enable sddm\n`;
            o += `\n# --- KDE Plasma (Minimal) ---\n`;
        } else if (desktopEnv === "kde_full") {
            dePkg = "plasma sddm kde-applications";
            deEnableCmd = `arch-chroot /mnt systemctl enable sddm\n`;
            o += `\n# --- KDE Plasma (Full) ---\n`;
        }
        
        if (dePkg !== "") {
            o += `arch-chroot /mnt pacman -S --noconfirm ${dePkg}\n`;
            if (deEnableCmd !== "") o += deEnableCmd;
        }
"""
if "Phase 4: Desktop Environment" not in js:
    js = js.replace('if (post_apps.length > 0) {', de_logic + '\n        if (post_apps.length > 0) {')

# 4. Global Sandboxing logic for regular apps
sandbox_logic = r"""
        // Phase 4: Global Sandboxing Policy Execution
        if (globalSandboxing !== "none" && post_apps.length > 0) {
            o += `\n# --- Global Sandboxing Execution (${globalSandboxing.toUpperCase()}) ---\n`;
            o += `arch-chroot /mnt pacman -S --noconfirm firejail apparmor\n`;
            o += `arch-chroot /mnt systemctl enable apparmor\n`;
            
            post_apps.forEach(app => {
                const browsers = ['firefox', 'librewolf', 'tor', 'chromium'];
                if (globalSandboxing === "all" || (globalSandboxing === "browsers" && browsers.includes(app))) {
                    o += `arch-chroot /mnt firecfg --add-users $(ls /mnt/home)\n`;
                    o += `arch-chroot /mnt ln -sf /usr/bin/firejail /usr/local/bin/${app}\n`;
                }
            });
        }
"""
if "Phase 4: Global Sandboxing" not in js:
    # Inject it right after post_apps loop
    js = js.replace('if (arss_tools.length > 0) {', sandbox_logic + '\n        if (arss_tools.length > 0) {')

with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("script.js patched with Phase 4 features (DEs, DuskyOS, Right-Click, Sandboxing).")
