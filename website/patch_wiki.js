const fs = require('fs');
let html = fs.readFileSync('website/wiki.html', 'utf8');

const targetStr = `        <h3 id="advanced-config-doas">Doas Integration Mode</h3>`;

const newDocs = `        <h3 id="advanced-config-libre">100% Libre Software Policy</h3>
        <p>If you toggle the <strong>Enforce 100% Libre Software Policy</strong> in the generator, the interface will dynamically audit your selections. Any software containing proprietary or closed-source components (like Discord, Signal, or Flatpak) will be aggressively highlighted with a solid red border. This ensures you do not accidentally violate your own open-source purity requirements.</p>

        <h3 id="advanced-config-verbosity">Script Verbosity Level</h3>
        <ul>
            <li><strong>Quiet:</strong> The script suppresses standard output (stdout) to keep your terminal clean, only printing critical errors.</li>
            <li><strong>Normal:</strong> (Default) Standard terminal output for pacman, pacstrap, and configuration logs.</li>
            <li><strong>Debug / Verbose:</strong> Injects <code>set -x</code> at the top of the generated bash script. This forces bash to print every single command it executes, along with its arguments, directly to the terminal before running it. Crucial for troubleshooting installation failures.</li>
        </ul>

        <h3 id="advanced-config-doas">Doas Integration Mode</h3>`;

html = html.replace(targetStr, newDocs);

// Also add a section in the generator steps if needed. Wait, it's already documented above.

fs.writeFileSync('website/wiki.html', html);
console.log('wiki.html updated.');
