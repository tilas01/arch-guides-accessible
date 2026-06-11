const fs = require('fs');
let js = fs.readFileSync('website/script.js', 'utf8');

// 1. Fetching the values
const fetchRegex = /const advDoasMode = gv\('adv_doas_mode', 'both'\);/;
const fetchReplacement = `const advDoasMode = gv('adv_doas_mode', 'both');
    const advThemeMode = gv('adv_theme_mode', 'tokyonight');
    const advAemMode = gv('adv_aem_mode', '1');`;
js = js.replace(fetchRegex, fetchReplacement);

// 2. Handling the Jetbrains Theme in Pre-configured mode
const themeRegex = /o \+= \`read -p "Install JetBrains Mono & Terminal Themes\? \(y\/N\): " setup_themes\\n\`;\s*o \+= \`if \[\[ "\$setup_themes" =~ \^\[Yy\]\$ \]\]; then\\n\`;\s*o \+= \`  pacman -S --noconfirm ttf-jetbrains-mono ttf-jetbrains-mono-nerd\\n\`;\s*o \+= \`  echo "Available Themes: 1\) Tokyo Night  2\) Dracula  3\) Gruvbox  4\) Nordic"\\n\`;\s*o \+= \`  read -p "Select Theme \(1-4\): " theme_sel\\n\`;\s*o \+= \`  case "\$theme_sel" in\\n\`;\s*o \+= \`    1\) THEME="tokyonight" ;;\\n\`;\s*o \+= \`    2\) THEME="dracula" ;;\\n\`;\s*o \+= \`    3\) THEME="gruvbox" ;;\\n\`;\s*o \+= \`    4\) THEME="nordic" ;;\\n\`;\s*o \+= \`    \*\) THEME="tokyonight" ;;\\n\`;\s*o \+= \`  esac\\n\`;\s*o \+= \`  echo "Theme \$THEME selected \(Configuration will be applied via dotfiles \/ user bashrc\)"\\n\`;\s*o \+= \`fi\\n\`;/;

const newThemeLogic = `
            if (configMode === 'interactive') {
                o += \`read -p "Install JetBrains Mono & Terminal Themes? (y/N): " setup_themes\\n\`;
                o += \`if [[ "$setup_themes" =~ ^[Yy]$ ]]; then\\n\`;
                o += \`  pacman -S --noconfirm ttf-jetbrains-mono ttf-jetbrains-mono-nerd\\n\`;
                o += \`  echo "Available Themes: 1) Tokyo Night  2) Dracula  3) Gruvbox  4) Nordic"\\n\`;
                o += \`  read -p "Select Theme (1-4): " theme_sel\\n\`;
                o += \`  case "$theme_sel" in\\n\`;
                o += \`    1) THEME="tokyonight" ;;\\n\`;
                o += \`    2) THEME="dracula" ;;\\n\`;
                o += \`    3) THEME="gruvbox" ;;\\n\`;
                o += \`    4) THEME="nordic" ;;\\n\`;
                o += \`    *) THEME="tokyonight" ;;\\n\`;
                o += \`  esac\\n\`;
                o += \`  echo "Theme $THEME selected (Configuration will be applied via dotfiles / user bashrc)"\\n\`;
                o += \`fi\\n\`;
            } else {
                o += \`\\n# Install JetBrains Mono & Theme (Pre-configured)\\n\`;
                o += \`pacman -S --noconfirm ttf-jetbrains-mono ttf-jetbrains-mono-nerd\\n\`;
                o += \`THEME="\${advThemeMode}"\\n\`;
                o += \`echo "Theme $THEME selected (Configuration will be applied via dotfiles / user bashrc)"\\n\`;
            }
`;

js = js.replace(themeRegex, newThemeLogic);

// 3. Handling AEM Decoy in Pre-configured mode
const aemRegex = /o \+= \`read -p "Select Decoy Mode \(1-3\): " aem_decoy_mode\\n\`;\s*o \+= \`case "\$aem_decoy_mode" in\\n\`;\s*o \+= \`  1\) DECOY_MODE="--decoy-count 1" ;;\\n\`;\s*o \+= \`  2\) DECOY_MODE="--decoy-count 2" ;;\\n\`;\s*o \+= \`  3\) DECOY_MODE="--decoy-count 3" ;;\\n\`;\s*o \+= \`  \*\) DECOY_MODE="--decoy-count 1" ;;\\n\`;\s*o \+= \`esac\\n\`;/;

const newAemLogic = `
                if (configMode === 'interactive') {
                    o += \`read -p "Select Decoy Mode (1-3): " aem_decoy_mode\\n\`;
                    o += \`case "$aem_decoy_mode" in\\n\`;
                    o += \`  1) DECOY_MODE="--decoy-count 1" ;;\\n\`;
                    o += \`  2) DECOY_MODE="--decoy-count 2" ;;\\n\`;
                    o += \`  3) DECOY_MODE="--decoy-count 3" ;;\\n\`;
                    o += \`  *) DECOY_MODE="--decoy-count 1" ;;\\n\`;
                    o += \`esac\\n\`;
                } else {
                    o += \`DECOY_MODE="--decoy-count \${advAemMode}"\\n\`;
                }
`;

js = js.replace(aemRegex, newAemLogic);

// 4. Update UI toggles function
const updateUIRegex = /if \(advDoas\) advDoas\.style\.display = postApps\.includes\('doas'\) \? 'block' : 'none';\s*if \(advSnapper\) advSnapper\.style\.display = postApps\.includes\('snapper'\) \? 'block' : 'none';/;

const newUpdateUILogic = `if (advDoas) advDoas.style.display = postApps.includes('doas') ? 'block' : 'none';
            if (advSnapper) advSnapper.style.display = postApps.includes('snapper') ? 'block' : 'none';
            
            const advTheme = document.getElementById('adv-theme');
            const advAem = document.getElementById('adv-aem');
            const advUsernames = document.getElementById('adv-usernames');
            
            if (advTheme) advTheme.style.display = postApps.includes('jb_mono') ? 'block' : 'none';
            if (advAem) advAem.style.display = Array.from(document.querySelectorAll('input[name="arss_tools"]:checked')).map(el=>el.value).includes('anti-evil-maid') ? 'block' : 'none';
            
            if (advUsernames) {
                advUsernames.style.display = 'block';
                const container = document.getElementById('adv-usernames-container');
                const count = parseInt(document.getElementById('user_count').value) || 1;
                
                // Only redraw if count changed
                if (container && container.children.length !== count) {
                    container.innerHTML = '';
                    for (let i=1; i<=count; i++) {
                        container.innerHTML += \`<div style="display:flex; align-items:center; gap:8px;">
                            <label style="width:100px; font-size:0.85rem;">User \${i} Name:</label>
                            <input type="text" id="user_name_\${i}" value="user\${i}" style="padding:0.3rem; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--fg-color);">
                        </div>\`;
                    }
                }
            }
`;

js = js.replace(updateUIRegex, newUpdateUILogic);

// Add listener to arss_tools so AEM triggers
const arssListener = `
    document.querySelectorAll('input[name="arss_tools"]').forEach(cb => {
        cb.addEventListener('change', updateAdvancedConfigUI);
    });
`;
if (!js.includes('input[name="arss_tools"]')) {
    js = js.replace(/document\.querySelectorAll\('input\[name="post_apps"\]'\)\.forEach\(cb => {/, arssListener + '\n    document.querySelectorAll(\'input[name="post_apps"]\').forEach(cb => {');
}

fs.writeFileSync('website/script.js', js);
console.log('script.js parity logics added.');
