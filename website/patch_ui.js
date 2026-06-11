const fs = require('fs');

// 1. Add CSS for the switch
let css = fs.readFileSync('website/style.css', 'utf8');
if (!css.includes('.switch {')) {
    css += `\n
/* Animated Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}
.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--bg-lighter);
  transition: .4s;
  border-radius: 20px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 14px; width: 14px;
  left: 3px; bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: var(--accent-green);
}
input:checked + .slider:before {
  transform: translateX(16px);
}
`;
    fs.writeFileSync('website/style.css', css);
}

// 2. Patch index.html
let html = fs.readFileSync('website/index.html', 'utf8');

// A. Update the waiver points with emojis and add the cookie point
const waiverRegex = /1\. <strong>DoD Disk Wipes:<\/strong>[\s\S]*?mitigated\./;
const newWaiver = `🍪 <strong>Session-Only:</strong> We use no cookies. Generation history resets when the tab closes.<br>
                💥 <strong>DoD Disk Wipes:</strong> Certain features (like Panic Password) permanently destroy data. There is no recovery.<br>
                🔒 <strong>Firmware Lockouts:</strong> Anti-Evil Maid and Libre-OTP will lock you out of your device for 24 hours if triggered.<br>
                ⚖️ <strong>Liability:</strong> The author (tilas01) is not responsible for data loss, system bricking, or targeted attacks failing to be mitigated.`;
html = html.replace(waiverRegex, newWaiver);

// B. Remove global_ask_toggle from top Generator Settings
const oldToggleRegex = /<label class="nav-tooltip" data-title="Global Ask Mode"[\s\S]*?<\/label>/;
html = html.replace(oldToggleRegex, '');

// C. Insert global_ask_toggle animated switch before .sc upload button
const scUploadRegex = /<label class="btn nav-tooltip" data-title="Upload Selection Config \(\.sc\)"/;

const newToggleHtml = `<div style="display:flex; align-items:center; gap:8px; margin-right:auto; background:var(--bg-darker); padding:0.4rem 0.8rem; border-radius:8px; border:1px solid var(--bg-lighter);" class="nav-tooltip" data-title="Global Ask Mode" data-desc="If enabled, all configuration prompts are asked here in the UI. If disabled, the generated script will prompt you live.">
                              <span style="font-size:0.85rem; color:var(--accent-cyan); font-weight:bold;">Ask in UI Generator:</span>
                              <label class="switch">
                                  <input type="checkbox" id="global_ask_toggle" checked>
                                  <span class="slider"></span>
                              </label>
                          </div>
                          <label class="btn nav-tooltip" data-title="Upload Selection Config (.sc)"`;

html = html.replace(scUploadRegex, newToggleHtml);

fs.writeFileSync('website/index.html', html);
console.log('UI updates applied successfully.');
