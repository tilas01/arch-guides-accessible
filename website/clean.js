const fs = require('fs');
let html = fs.readFileSync('website/index.html', 'utf8');

// Strip all the ℹ️ spans
html = html.replace(/<span title="[^"]+" style="cursor:help;\s*margin-left:0\.3rem;">ℹ️<\/span>\s*/g, '');

// Clean all label titles back to their original state (split by | Build: or [PROPRIETARY])
html = html.replace(/(<label class="app-item"\s+title=")([^"]+)(")/g, (match, prefix, title, suffix) => {
    let clean = title.split(' | Build:')[0];
    clean = clean.split(' [PROPRIETARY]')[0];
    clean = clean.split('\n--\n')[0]; // Because I changed the format to \n--\n
    // Now I need to recover the description. I lost it! 
    return prefix + clean + suffix;
});

fs.writeFileSync('website/index.html', html);
console.log('Cleaned');
