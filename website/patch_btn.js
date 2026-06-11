const fs = require('fs');

let html = fs.readFileSync('website/index.html', 'utf8');

// The original .sc upload button
const uploadScRegex = /<label class="btn nav-tooltip" data-title="Upload Selection Config \(\.sc\)"[^>]*>[\s\S]*?<input type="file" id="upload-sc-input" accept="\.sc" style="display:none">\s*<\/label>/;
const scMatch = html.match(uploadScRegex);

if (scMatch) {
    let scBtn = scMatch[0];
    // Remove it from its current location
    html = html.replace(uploadScRegex, '');

    // The target location
    const liveEditorUploadRegex = /<input type="file" id="upload-file-input" accept="\.sh,\.md,\.bash,\.txt" style="display:none">\s*<\/label>/;
    
    // Insert after the .sh upload button
    html = html.replace(liveEditorUploadRegex, `$&
                          ${scBtn}`);
                          
    fs.writeFileSync('website/index.html', html);
    console.log('index.html patched: moved .sc upload button.');
} else {
    console.log('Could not find .sc upload button.');
}
