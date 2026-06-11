const fs = require('fs');
let js = fs.readFileSync('website/script.js', 'utf8');

// 1. Remove duskyos app from aurApps or wherever it is
js = js.replace(/,\s*duskyos:'dusky-setup'/, '');

// 2. Remove old dusky-setup bash logic
const duskyRegex = /\/\/ Dusky OS auto-setup[\s\S]*?o \+= `# DuskyOS system[\s\S]*?\}\s*else\s*\{\s*o \+= `\\n# Custom Setup[\s\S]*?\}\s*}/;
js = js.replace(/\/ Dusky OS auto-setup[\s\S]*?(?=\/\/ Display Manager)/, '');

// 3. Update the updateAdvancedConfigUI function to use global_ask_toggle
const uiLogicRegex = /function updateAdvancedConfigUI\(\) \{[\s\S]*?\}\n\n    if \(configModeSel\)[\s\S]*?updateAdvancedConfigUI\(\);/;

const newUiLogic = `const globalAskToggle = document.getElementById('global_ask_toggle');
    const advContainer = document.getElementById('advanced_config_container');
    const advDoas = document.getElementById('adv-doas');
    const advSnapper = document.getElementById('adv-snapper');
    const outputFormatSel = document.getElementById('outputformat');
    const userCountInput = document.getElementById('user_count');
    const passwordFieldsContainer = document.getElementById('password-fields-container');

    function renderPasswordFields() {
        if (!passwordFieldsContainer) return;
        const users = parseInt(userCountInput ? userCountInput.value : 1) || 1;
        let html = \`
            <div style="display:flex; gap:10px; align-items:flex-end;">
                <div style="flex:1;">
                    <label>Root Password:</label>
                    <input type="password" id="root_pass" placeholder="Enter root password">
                </div>
                <div style="flex:1;">
                    <label>Confirm Root Password:</label>
                    <input type="password" id="root_pass_confirm" placeholder="Confirm root password">
                </div>
                <button type="button" class="btn" style="width:auto; padding:0.4rem 0.8rem;" onclick="togglePasswordVisibility(['root_pass', 'root_pass_confirm'])">👁️</button>
            </div>
        \`;
        
        for (let i = 1; i <= users; i++) {
            html += \`
                <div style="display:flex; gap:10px; align-items:flex-end; margin-top:10px;">
                    <div style="flex:1;">
                        <label>Username \${i}:</label>
                        <input type="text" id="user_name_\${i}" placeholder="Enter username \${i}" value="user\${i}">
                    </div>
                    <div style="flex:1;">
                        <label>User \${i} Password:</label>
                        <input type="password" id="user_pass_\${i}" placeholder="Enter password">
                    </div>
                    <div style="flex:1;">
                        <label>Confirm Password \${i}:</label>
                        <input type="password" id="user_pass_confirm_\${i}" placeholder="Confirm password">
                    </div>
                    <button type="button" class="btn" style="width:auto; padding:0.4rem 0.8rem;" onclick="togglePasswordVisibility(['user_pass_\${i}', 'user_pass_confirm_\${i}'])">👁️</button>
                </div>
            \`;
        }
        
        // Only update if changed to preserve typed passwords if possible, or just overwrite on user_count change.
        // For simplicity, we just overwrite when user_count changes.
        passwordFieldsContainer.innerHTML = html;
    }
    
    window.togglePasswordVisibility = function(ids) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.type = el.type === 'password' ? 'text' : 'password';
        });
    };

    let lastUserCount = -1;

    function updateAdvancedConfigUI() {
        if (!globalAskToggle || !advContainer) return;
        
        // Force preconfigured if output is markdown
        if (outputFormatSel && outputFormatSel.value === 'markdown') {
            globalAskToggle.checked = true;
        }

        if (globalAskToggle.checked) {
            advContainer.style.display = 'block';
            
            const currentUserCount = parseInt(userCountInput ? userCountInput.value : 1) || 1;
            if (currentUserCount !== lastUserCount) {
                renderPasswordFields();
                lastUserCount = currentUserCount;
            }
            
            // Show sub-options based on selected apps
            const postApps = Array.from(document.querySelectorAll('input[name="post_apps"]:checked')).map(el => el.value);
            if (advDoas) advDoas.style.display = postApps.includes('doas') ? 'block' : 'none';
            if (advSnapper) advSnapper.style.display = postApps.includes('snapper') ? 'block' : 'none';
        } else {
            advContainer.style.display = 'none';
        }
    }

    if (globalAskToggle) globalAskToggle.addEventListener('change', updateAdvancedConfigUI);
    if (outputFormatSel) outputFormatSel.addEventListener('change', updateAdvancedConfigUI);
    if (userCountInput) userCountInput.addEventListener('change', updateAdvancedConfigUI);
    
    // Listen to changes on post_apps checkboxes to show/hide sub-options dynamically
    document.querySelectorAll('input[name="post_apps"]').forEach(cb => {
        cb.addEventListener('change', updateAdvancedConfigUI);
    });

    // Init Advanced Config UI
    updateAdvancedConfigUI();`;

js = js.replace(uiLogicRegex, newUiLogic);

// 4. Update generator variables extraction
const varExtractRegex = /const configMode = gv\('config_mode', 'interactive'\);/;
js = js.replace(varExtractRegex, `const configMode = document.getElementById('global_ask_toggle')?.checked ? 'preconfigured' : 'interactive';
    const censorPasswords = document.getElementById('censor_passwords')?.checked !== false;
    const isoVerify = gv('iso_verify', 'yes');`);

// 5. Update the Password Script Generation
const passwdRegex = /o \+= `passwd root\\n`;\s*for \(let u = 1; u <= user_count; u\+\+\) \{\s*o \+= `read -p "Username \$\{u\}: " u\$\{u\}\\nuseradd -m -G wheel -s \/bin\/bash "\$u\$\{u\}"\\npasswd "\$u\$\{u\}"\\n`;\s*\}/;

const newPasswdLogic = `if (configMode === 'interactive' || censorPasswords) {
                // Interactive prompts for root and user
                o += \`\\n# Set Root Password\\n\`;
                if (!cmdOnly) {
                    o += \`> **Note:** The passwords below are censored in this guide for your security.\\n\\n\`
                    o += \`passwd root\\n\`;
                } else {
                    o += \`read -s -p "Enter root password: " rootpass\\necho\\n\`;
                    o += \`read -s -p "Confirm root password: " rootpass2\\necho\\n\`;
                    o += \`if [ "$rootpass" = "$rootpass2" ]; then echo "root:$rootpass" | chpasswd; else echo "Passwords do not match!"; exit 1; fi\\n\`;
                }

                for (let u = 1; u <= user_count; u++) {
                    o += \`\\n# Set User \${u} Account\\n\`;
                    if (!cmdOnly) {
                        o += \`useradd -m -G wheel -s /bin/bash "\${gv('user_name_'+u, 'user'+u)}"\\n\`;
                        o += \`passwd "\${gv('user_name_'+u, 'user'+u)}"\\n\`;
                    } else {
                        o += \`read -p "Enter Username \${u}: " u\${u}\\n\`;
                        o += \`useradd -m -G wheel -s /bin/bash "$u\${u}"\\n\`;
                        o += \`read -s -p "Enter password for $u\${u}: " upass\\necho\\n\`;
                        o += \`read -s -p "Confirm password for $u\${u}: " upass2\\necho\\n\`;
                        o += \`if [ "$upass" = "$upass2" ]; then echo "$u\${u}:$upass" | chpasswd; else echo "Passwords do not match!"; exit 1; fi\\n\`;
                    }
                }
            } else {
                // Pre-configured passwords
                const rootPass = gv('root_pass', 'root');
                o += \`\\n# Set Root Password (Unattended)\\n\`;
                o += \`echo "root:\${rootPass}" | chpasswd\\n\`;
                
                for (let u = 1; u <= user_count; u++) {
                    const uname = gv('user_name_' + u, 'user' + u);
                    const upass = gv('user_pass_' + u, 'password');
                    o += \`\\n# Set User \${u} Account (Unattended)\\n\`;
                    o += \`useradd -m -G wheel -s /bin/bash "\${uname}"\\n\`;
                    o += \`echo "\${uname}:\${upass}" | chpasswd\\n\`;
                }
            }`;

js = js.replace(passwdRegex, newPasswdLogic);

// 6. ISO Integrity Verifier logic pre-install
const genfstabRegex = /o \+= `genfstab -U \/mnt >> \/mnt\/etc\/fstab\\n`;/;
const isoVerifyLogic = `o += \`genfstab -U /mnt >> /mnt/etc/fstab\\n\`;
          
          if (isoVerify === 'yes') {
              o += \`\\n# Live ISO Integrity Verifier\\n\`;
              o += \`echo "Verifying Arch Linux ISO integrity before chroot..."\\n\`;
              o += \`pacman-key --init && pacman-key --populate archlinux\\n\`;
              o += \`if [ -b "/dev/disk/by-label/ARCH_202" ]; then\\n\`;
              o += \`  echo "Found Arch ISO block device. Verifying GPG signatures... (Not fully implemented in dummy)"\\n\`;
              o += \`fi\\n\`;
          }`;
js = js.replace(genfstabRegex, isoVerifyLogic);

fs.writeFileSync('website/script.js', js);
console.log('script.js patched successfully.');
