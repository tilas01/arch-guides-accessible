const fs = require('fs');
let js = fs.readFileSync('website/script.js', 'utf8');

// 1. Update downloadFile
const downloadFileRegex = /window\.downloadFile = function\(content, filename\) \{/;
const newDownloadFile = `window.downloadFile = function(content, filename) {
    const globalAsk = document.getElementById('global_ask_toggle');
    const censorPass = document.getElementById('censor_passwords');
    if (globalAsk && globalAsk.checked && censorPass && !censorPass.checked) {
        if (!confirm("⚠️ SEVERE SECURITY WARNING: You are downloading a file (" + filename + ") that contains your passwords in PLAINTEXT. This is highly dangerous and unrecommended. Anyone who can read this file can compromise your system. Are you absolutely sure you want to proceed?")) {
            return;
        }
    }`;
js = js.replace(downloadFileRegex, newDownloadFile);

// 2. Update generate-btn acknowledgement logic
const generateBtnLogicRegex = /if \(globalAsk && globalAsk\.checked && censorPass && !censorPass\.checked\) \{[\s\S]*?if \(plainAck && !plainAck\.checked\) \{[\s\S]*?alert\([\s\S]*?\);[\s\S]*?plainAck\.parentElement\.style\.color = "red";[\s\S]*?return;[\s\S]*?\}[\s\S]*?\}/;

const newGenerateBtnLogic = `if (globalAsk && globalAsk.checked && censorPass && !censorPass.checked) {
        if (plainAck && !plainAck.checked) {
            alert("⚠️ Security Warning: You have chosen to store passwords in plaintext. You must check the acknowledgement box before generating.");
            plainAck.parentElement.style.color = "red";
            return;
        }
        
        // Final confirm
        if (!confirm("⚠️ SEVERE SECURITY WARNING: You are generating an installation guide/script with PLAINTEXT passwords. This is highly dangerous and unrecommended. If you proceed, do not share the generated output or screen with anyone. Proceed?")) {
            return;
        }
    }`;

js = js.replace(generateBtnLogicRegex, newGenerateBtnLogic);

fs.writeFileSync('website/script.js', js);
console.log('script.js alert boxes patched successfully.');
