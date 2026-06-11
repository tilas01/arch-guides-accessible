const fs = require('fs');
let html = fs.readFileSync('website/index.html', 'utf8');

// 1. Remove duskyos
html = html.replace(/<option value="duskyos">DuskyOS Setup.*?<\/option>/g, '');

// 2. Remove old config_mode
const oldConfigMode = /<div class="form-group form-step" data-title="Configuration Mode"[^>]*>[\s\S]*?<\/select>\s*<\/div>/;
html = html.replace(oldConfigMode, '');

// 3. Insert global toggle next to Upload .sc config
const uploadScRegex = /<h3 style="margin:0; color:var\(--accent-cyan\); font-size:1.1rem;">Generator Settings<\/h3>\s*<label class="btn nav-tooltip"/;

const newToggleHtml = `<div style="display:flex; align-items:center; gap:10px;">
                          <h3 style="margin:0; color:var(--accent-cyan); font-size:1.1rem;">Generator Settings</h3>
                          <label class="nav-tooltip" data-title="Global Ask Mode" data-desc="If enabled, all configuration and password prompts are asked here in the UI. If disabled, the generated script will prompt you live." style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:0.9rem; background:var(--bg-darker); padding:0.3rem 0.6rem; border-radius:6px; border:1px solid var(--accent-blue);">
                              <input type="checkbox" id="global_ask_toggle" checked style="margin:0;"> Ask all questions in generator now
                          </label>
                      </div>
                      <label class="btn nav-tooltip"`;

html = html.replace(uploadScRegex, newToggleHtml);

// 4. Update the Advanced Config Container to rely on global_ask_toggle and add Password Fields
const advancedConfigRegex = /<div id="advanced_config_container"[^>]*>[\s\S]*?(?=<div class="form-group form-step" data-title="Script Generation Style")/;

const newAdvancedConfig = `<div id="advanced_config_container" style="display:none; padding:15px; border-left:4px solid var(--accent-blue); background:rgba(122,162,247,0.05); margin-bottom:1.5rem;">
                        <h4 style="margin-top:0; margin-bottom:10px;"><span class="icon">⚙️</span> Advanced App Configuration & Security</h4>
                        <p style="font-size:0.8rem; color:var(--text-color); opacity:0.8; margin-bottom:15px;">Configure app sub-options and set system passwords securely.</p>
                        
                        <div class="form-group" style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid var(--bg-lighter);">
                            <label style="display:flex; align-items:center; gap:5px;">
                                <input type="checkbox" id="censor_passwords" checked style="margin:0;">
                                Censor passwords in Bash script (Recommended - Requires manual entry live)
                            </label>
                        </div>

                        <div id="password-fields-container" style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid var(--bg-lighter);">
                            <!-- Passwords will be injected here by JS -->
                        </div>

                        <div class="form-group" id="adv-doas" style="display:none;">
                            <label>Doas Integration Mode: <a href="wiki.html#advanced-config-doas" target="_blank" style="text-decoration:none;"><span title="Teleport to Wiki help" style="cursor:help; margin-left:0.3rem;">ℹ️</span></a></label>
                            <select id="adv_doas_mode">
                                <option value="both">Keep Sudo intact alongside Doas</option>
                                <option value="replace">Fully replace Sudo with Doas wrapper</option>
                                <option value="remove">Remove Sudo entirely (no wrapper)</option>
                            </select>
                        </div>

                        <div class="form-group" id="adv-snapper" style="display:none;">
                            <label>Snapper Timeline Mode: <a href="wiki.html#advanced-config-snapper" target="_blank" style="text-decoration:none;"><span title="Teleport to Wiki help" style="cursor:help; margin-left:0.3rem;">ℹ️</span></a></label>
                            <select id="adv_snapper_mode">
                                <option value="default">Pre/Post Transaction Snapshots Only</option>
                                <option value="timeline">Enable Hourly/Daily Timeline</option>
                            </select>
                        </div>
                    </div>
                    `;

html = html.replace(advancedConfigRegex, newAdvancedConfig);

// 5. Add Live ISO Verify toggle under iso_setup
const isoSetupRegex = /<option value="ssh_curl">SSHd \+ curl<\/option>\s*<\/select>\s*<\/div>/;
const newIsoSetup = `<option value="ssh_curl">SSHd + curl</option>
                        </select>
                    </div>

                    <div class="form-group form-step" data-title="Live ISO Verifier" data-desc="Automatically checks the integrity of your booted Arch ISO (supports Ventoy/Rufus) using official GPG signatures before pacstrap begins.">
                        <label>Verify Live ISO Integrity:</label>
                        <select id="iso_verify">
                            <option value="yes" selected>Yes, automatically verify my boot media</option>
                            <option value="no">No, skip verification</option>
                        </select>
                    </div>`;

html = html.replace(isoSetupRegex, newIsoSetup);

fs.writeFileSync('website/index.html', html);
console.log('index.html patched successfully.');
