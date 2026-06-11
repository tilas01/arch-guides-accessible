const fs = require('fs');
let html = fs.readFileSync('website/index.html', 'utf8');

// 1. Extract the global_ask_toggle container
const askToggleRegex = /<div style="display:flex; align-items:center; gap:8px; margin-right:auto;[^>]+data-title="Global Ask Mode"[\s\S]*?<\/label>\s*<\/div>/;
const askMatch = html.match(askToggleRegex);

// 2. Extract the .sc upload button
const scUploadRegex = /<label class="btn nav-tooltip" data-title="Upload Selection Config \(\.sc\)"[\s\S]*?<input type="file" id="upload-sc-input" accept="\.sc" style="display:none">\s*<\/label>/;
const scMatch = html.match(scUploadRegex);

if (askMatch && scMatch) {
    // Remove them from their original locations
    html = html.replace(askToggleRegex, '');
    html = html.replace(scUploadRegex, '');

    // The new toggle block with updated label and tooltip
    const newToggleHtml = `<div style="display:flex; align-items:center; gap:8px; background:var(--bg-darker); padding:0.4rem 0.8rem; border-radius:8px; border:1px solid var(--bg-lighter);" class="nav-tooltip" data-title="Advanced Generator Selections" data-desc="Allows you to set up usernames and advanced app configs (e.g., Doas) that the script would normally prompt for. You must re-generate your output to get the built-in extra information in the markdown guide based on your selections; otherwise, the guide will only explain how to manually implement your choices in full parity with the Wiki.">
        <span style="font-size:0.85rem; color:var(--accent-cyan); font-weight:bold;">Advanced Generator Selections:</span>
        <label class="switch">
            <input type="checkbox" id="global_ask_toggle" checked>
            <span class="slider"></span>
        </label>
    </div>`;

    // The original sc block
    const newScHtml = scMatch[0];

    // Find the Libre Policy container to inject next to it
    const libreRegex = /<div class="form-group form-step" style="border-left:3px solid var\(--accent-green\); padding-left:1rem; margin-bottom:1\.5rem;" data-title="100% Libre Software Policy"[\s\S]*?<\/div>/;
    const libreMatch = html.match(libreRegex);

    if (libreMatch) {
        // We will replace the libre container with a flex row containing all three
        const newTopRowHtml = `<div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; padding:0.5rem; background:var(--bg-lighter); border-radius:8px; border:1px solid var(--border-color);">
            <div style="display:flex; align-items:center; gap:1rem;">
                ${newToggleHtml}
                ${newScHtml}
            </div>
            <div class="nav-tooltip" style="border-left:3px solid var(--accent-green); padding-left:0.8rem;" data-title="100% Libre Software Policy" data-desc="If enabled, proprietary software selections will be heavily highlighted in RED to warn you of a policy violation.">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--accent-green); font-weight:bold; margin:0;">
                    <input type="checkbox" id="libre_policy_toggle" style="margin:0; width:18px; height:18px; accent-color:var(--accent-green);">
                    Enforce 100% Libre Software Policy
                </label>
            </div>
        </div>`;
        
        html = html.replace(libreRegex, newTopRowHtml);
    } else {
        console.log('Libre policy container not found!');
    }
} else {
    console.log('Ask toggle or .sc button not found!');
}

fs.writeFileSync('website/index.html', html);
console.log('index.html updated successfully.');
