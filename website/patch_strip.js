const fs = require('fs');

// 1. Patch index.html
let html = fs.readFileSync('website/index.html', 'utf8');

// Remove the censor_passwords checkbox and plaintext_ack container
const censorRegex = /<div class="form-group" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid var\(--bg-lighter\);">[\s\S]*?<\/div>\s*<div id="password-fields-container"[\s\S]*?<\/div>/;

// Replace with empty string
html = html.replace(censorRegex, '');

fs.writeFileSync('website/index.html', html);
console.log('index.html stripped of plaintext logic.');

// 2. Patch script.js
let js = fs.readFileSync('website/script.js', 'utf8');

// Remove the UI logic for renderPasswordFields
const renderPassRegex = /function renderPasswordFields\(\) \{[\s\S]*?\}\s*window\.togglePasswordVisibility[\s\S]*?\};\s*let lastUserCount = -1;/;
js = js.replace(renderPassRegex, '');

// Remove the call to renderPasswordFields inside updateAdvancedConfigUI
const updateUiRegex = /const currentUserCount = parseInt\(userCountInput \? userCountInput\.value : 1\) \|\| 1;\s*if \(currentUserCount !== lastUserCount\) \{\s*renderPasswordFields\(\);\s*lastUserCount = currentUserCount;\s*\}/;
js = js.replace(updateUiRegex, '');

// Remove the plaintext_ack check in generate-btn
const ackRegex = /\/\/ Check plaintext password acknowledgement[\s\S]*?if \(globalAsk && globalAsk\.checked && censorPass && !censorPass\.checked\) \{[\s\S]*?alert\([\s\S]*?\);[\s\S]*?plainAck\.parentElement\.style\.color = "red";[\s\S]*?return;[\s\S]*?\}[\s\S]*?\}/;
js = js.replace(ackRegex, '');

// Remove the censorPasswords variable extract
const censorVarRegex = /const censorPasswords = document\.getElementById\('censor_passwords'\)\?\.checked !== false;/;
js = js.replace(censorVarRegex, '');

// Force password generation logic to ALWAYS use interactive read -s
const passwdGenRegex = /if \(configMode === 'interactive' \|\| censorPasswords\) \{[\s\S]*?\} else \{\s*\/\/ Pre-configured passwords[\s\S]*?\}\s*\}/;

const alwaysInteractivePasswd = `
                // Interactive prompts for root and user (Passwords are never stored in plaintext)
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
`;

js = js.replace(passwdGenRegex, alwaysInteractivePasswd);

fs.writeFileSync('website/script.js', js);
console.log('script.js stripped of plaintext logic.');

// 3. Patch wiki.html
let wiki = fs.readFileSync('website/wiki.html', 'utf8');

const wikiPassRegex = /<h3 id="advanced-config-passwords">Secure Password Handling<\/h3>[\s\S]*?<\/ul>\s*<\/section>/;
const wikiSafePass = `<h3 id="advanced-config-passwords">Secure Password Handling</h3>
        <p>Passwords are <strong>never</strong> stored in the UI or inside the generated scripts for your security. Regardless of the Configuration Mode you choose:</p>
        <ul>
            <li><strong>Markdown Guide:</strong> Passwords are ALWAYS censored (displayed as <code>*******</code>) because Markdown files are static text and should never contain plaintext secrets.</li>
            <li><strong>Bash Script:</strong> The script will always use secure, echoing-disabled <code>read -s -p</code> prompts to ask you for passwords live in the terminal during execution.</li>
        </ul>
    </section>`;

wiki = wiki.replace(wikiPassRegex, wikiSafePass);
fs.writeFileSync('website/wiki.html', wiki);
console.log('wiki.html updated.');
