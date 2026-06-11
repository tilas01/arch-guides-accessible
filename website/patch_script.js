const fs = require('fs');
let js = fs.readFileSync('website/script.js', 'utf8');

// 1. Add Event Listener for Libre Policy Toggle
const libreLogic = `
// Libre Policy Logic
const libreToggle = document.getElementById('libre_policy_toggle');
if (libreToggle) {
    libreToggle.addEventListener('change', () => {
        document.querySelectorAll('input[name="post_apps"]').forEach(checkbox => {
            const label = checkbox.closest('label');
            if (!label) return;
            const isProprietary = label.innerHTML.includes('[PROPRIETARY]') || label.innerHTML.includes('Proprietary / Non-Libre software');
            
            if (libreToggle.checked && isProprietary) {
                // If policy is ON, and it's proprietary, highlight it red if it's checked
                if (checkbox.checked) {
                    label.style.border = '2px solid var(--accent-red)';
                    label.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
                    label.style.padding = '0.4rem';
                    label.style.borderRadius = '6px';
                } else {
                    label.style.border = '1px solid transparent';
                    label.style.boxShadow = 'none';
                }
            } else {
                // Reset styles
                if (isProprietary) {
                    label.style.border = '1px solid transparent';
                    label.style.boxShadow = 'none';
                }
            }
        });
    });
}

// Add event listener to post_apps to trigger libre logic on click
document.querySelectorAll('input[name="post_apps"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (libreToggle && libreToggle.checked) {
            libreToggle.dispatchEvent(new Event('change'));
        }
    });
});
`;

if (!js.includes('libreToggle.addEventListener')) {
    js += '\n' + libreLogic;
}

const targetStr = 'function generateBashScript() {\\n    let script = `#!/bin/bash\\nset -e\\n`;';
const replacementStr = `function generateBashScript() {
    let script = \`#!/bin/bash\\nset -e\\n\`;
    const verbosity = document.getElementById('verbosity_level') ? document.getElementById('verbosity_level').value : 'normal';
    if (verbosity === 'debug') {
        script += \`set -x # Debug / Verbose mode enabled\\n\`;
    } else if (verbosity === 'quiet') {
        script += \`# Quiet mode: To fully silence, append >/dev/null to script execution\\n\`;
    }`;

// use literal string replacement
js = js.replace('function generateBashScript() {\r\n    let script = `#!/bin/bash\nset -e\n`;', replacementStr);
js = js.replace('function generateBashScript() {\n    let script = `#!/bin/bash\nset -e\n`;', replacementStr);

fs.writeFileSync('website/script.js', js);
console.log('script.js updated.');
