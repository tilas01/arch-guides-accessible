const fs = require('fs');
let html = fs.readFileSync('website/index.html', 'utf8');

// Inject the new advanced blocks inside advanced_config_container
const targetContainerRegex = /(<div class="form-group" id="adv-doas" style="display:none;">)/;

const newInputs = `
                          <div class="form-group" id="adv-usernames" style="display:none;">
                              <label>System Usernames: <a href="wiki.html#advanced-config-usernames" target="_blank" style="text-decoration:none;"><span title="Teleport to Wiki help" style="cursor:help; margin-left:0.3rem;">ℹ️</span></a></label>
                              <div id="adv-usernames-container" style="display:flex; flex-direction:column; gap:8px;"></div>
                          </div>

                          <div class="form-group" id="adv-theme" style="display:none;">
                              <label>JetBrains Terminal Theme: <a href="wiki.html#advanced-config-themes" target="_blank" style="text-decoration:none;"><span title="Teleport to Wiki help" style="cursor:help; margin-left:0.3rem;">ℹ️</span></a></label>
                              <select id="adv_theme_mode">
                                  <option value="tokyonight">TokyoNight (Default)</option>
                                  <option value="catppuccin">Catppuccin Macchiato</option>
                                  <option value="rosepine">Rosé Pine</option>
                                  <option value="dracula">Dracula</option>
                              </select>
                          </div>

                          <div class="form-group" id="adv-aem" style="display:none;">
                              <label>AEM Decoy Count: <a href="wiki.html#advanced-config-aem" target="_blank" style="text-decoration:none;"><span title="Teleport to Wiki help" style="cursor:help; margin-left:0.3rem;">ℹ️</span></a></label>
                              <select id="adv_aem_mode">
                                  <option value="1">1 Decoy Image (Standard)</option>
                                  <option value="2">2 Decoy Images</option>
                                  <option value="3">3 Decoy Images (Maximum Paranoia)</option>
                              </select>
                          </div>
`;

if (!html.includes('adv-usernames')) {
    html = html.replace(targetContainerRegex, newInputs + '\n$1');
}

fs.writeFileSync('website/index.html', html);
console.log('index.html parity inputs added.');
