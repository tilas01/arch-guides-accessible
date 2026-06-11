const fs = require('fs');
let html = fs.readFileSync('website/index.html', 'utf8');

// 1. Add 100% Libre Policy Toggle
const installFormRegex = /<form id="install-form">/;
const libreHtml = `<form id="install-form">
                      <div class="form-group form-step" style="border-left:3px solid var(--accent-green); padding-left:1rem; margin-bottom:1.5rem;" data-title="100% Libre Software Policy" data-desc="If enabled, proprietary software selections will be heavily highlighted in RED to warn you of a policy violation.">
                          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--accent-green); font-weight:bold;">
                              <input type="checkbox" id="libre_policy_toggle" style="margin:0; width:18px; height:18px; accent-color:var(--accent-green);">
                              Enforce 100% Libre Software Policy
                          </label>
                      </div>`;
html = html.replace(installFormRegex, libreHtml);

// 2. Add Script Verbosity Level under global_ask_toggle (Wait, global_ask_toggle is now an animated switch before the .sc upload button).
// The user said: "allow user to chose script verbosity level in selection if using advanced all settings toggle"
// Wait, the "Ask all questions in generator now" toggle just reveals advanced settings like `arss-otp-options` or `snapper_timeline`.
// So we should add the verbosity level at the end of the form, near the bottom, maybe before the Generate button.

const generateBtnRegex = /<div style="font-size: 0\.8rem; margin-top: 0\.5rem; color: var\(--accent-red\); font-weight: bold;">Click anywhere here to teleport to the first invalid field\.<\/div>\s*<\/div>\s*<button type="button" id="generate-btn"/;
const verbosityHtml = `<div class="form-group form-step" id="advanced-verbosity-group" style="display:block;" data-title="Script Verbosity Level" data-desc="Quiet: hides non-critical output. Normal: standard output. Debug/Verbose: prints every executed command (set -x).">
                          <label>Script Verbosity Level (Advanced):</label>
                          <select id="verbosity_level">
                              <option value="normal" selected>Normal</option>
                              <option value="quiet">Quiet</option>
                              <option value="debug">Debug / Verbose</option>
                          </select>
                      </div>
                      <div style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--accent-red); font-weight: bold;">Click anywhere here to teleport to the first invalid field.</div>
                      </div>
                      <button type="button" id="generate-btn"`;

html = html.replace(generateBtnRegex, verbosityHtml);

fs.writeFileSync('website/index.html', html);
console.log('index.html UI updated for Libre policy and Verbosity.');
