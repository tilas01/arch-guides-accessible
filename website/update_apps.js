const fs = require('fs');

const path = 'c:/Users/ryder/OneDrive/Documents/git/arch_guides_all_versions/arch-guides-dynamic/website/index.html';
let html = fs.readFileSync(path, 'utf8');

const buildDefs = {
    '100% Reproducible': '100% Reproducible (Verifiable from Source - Bit-for-bit identical)',
    'Mostly Reproducible': 'Mostly Reproducible (Safe & verifiable, minor CI metadata differences)',
    'Non-Reproducible': 'Non-Reproducible (Requires trusting the developer or CI system)',
    'Proprietary': 'Proprietary / Closed Source (Requires trusting the distributor)'
};

const appData = {
    'paru': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'firefox': { build: 'Proprietary', src: '📁 Arch Extra', isProp: true, propDesc: 'Contains closed-source telemetry and firmware blobs.' },
    'librewolf': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'tor-browser': { build: '100% Reproducible', src: '📁 AUR', isProp: false },
    'chromium': { build: 'Proprietary', src: '📁 Arch Extra', isProp: true, propDesc: 'Google integration modules contain non-libre code.' },
    'ungoogled-chromium': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'signal': { build: 'Non-Reproducible', src: '📁 AUR', isProp: true, propDesc: 'The Electron build system relies on closed-source precompiled binaries.' },
    'keepassxc': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'clamav': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'firejail': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'doas': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false, isRecommended: true },
    'neovim': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'alacritty': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'kitty': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'zsh': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'vscodium': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'git': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'tmux': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'htop': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'pfetch': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'fastfetch': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'thunar': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'nautilus': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'mpv': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'vlc': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'obs': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'gimp': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'libreoffice': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'flatpak': { build: 'Proprietary', src: '📁 Arch Extra', isProp: true, propDesc: 'Flatpak itself is open-source, but Flathub distributes proprietary binaries like Discord and Spotify.' },
    'unattended-upgrades': { build: '100% Reproducible', src: '📁 AUR', isProp: false },
    'timeshift': { build: '100% Reproducible', src: '📁 AUR', isProp: false },
    'networkmanager': { build: '100% Reproducible', src: '📁 Arch Core', isProp: false },
    'bluetooth': { build: '100% Reproducible', src: '📁 Arch Core', isProp: false },
    'pipewire': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false },
    'openssh': { build: '100% Reproducible', src: '📁 Arch Core', isProp: false },
    'snapper': { build: '100% Reproducible', src: '📁 Arch Extra', isProp: false, isRecommended: true },
    'dusky-setup': { build: '100% Reproducible', src: '📁 GitHub / dusklinux', isProp: false }
};

const appRegex = /<label class="app-item"\s+title="([^"]+)">\s*<input type="checkbox"\s+name="post_apps"\s+value="([^"]+)"([^>]*)>\s*([\s\S]*?)<\/label>/g;

let replaced = html.replace(appRegex, (match, titleAttr, value, inputAttrs, innerContent) => {
    let appInfo = appData[value] || { build: 'Unknown', src: '📁 Unknown', isProp: false };
    
    // Clean old title
    let cleanTitle = titleAttr.split(' | Build:')[0].trim();
    if (cleanTitle.includes('[PROPRIETARY]')) {
        cleanTitle = cleanTitle.split('[PROPRIETARY]')[0].trim();
    }
    
    // Clean old innerContent
    let cleanInner = innerContent.replace(/<span title="[^"]+"\s*style="cursor:help;\s*margin-left:0\.3rem;">ℹ️<\/span>\s*/, '');
    
    let titleParts = cleanTitle.split(':');
    let appName = titleParts[0].trim();
    let appDesc = titleParts.slice(1).join(':').trim();
    if (!appDesc) appDesc = appName;
    
    let linkMatch = cleanInner.match(/href="([^"]+)"/);
    let websiteUrl = linkMatch ? linkMatch[1] : '';
    
    let buildStr = buildDefs[appInfo.build] || appInfo.build;
    
    let newTitle = '';
    let recStr = appInfo.isRecommended ? '⭐ RECOMMENDED\n' : '';
    if (appInfo.isProp) {
        newTitle = `${appName} [PROPRIETARY]\n--\n${appDesc}\n\nWARNING: ${appInfo.propDesc}\n\nBuild Integrity: ${buildStr}\nSource: ${appInfo.src}\nWebsite: ${websiteUrl}`;
    } else {
        newTitle = `${appName}\n--\n${recStr}${appDesc}\n\nBuild Integrity: ${buildStr}\nSource: ${appInfo.src}`;
        if (websiteUrl) newTitle += `\nWebsite: ${websiteUrl}`;
    }
    
    let newInnerContent = cleanInner.replace(/(<span class="app-desc">)/, `<span title="${newTitle}" style="cursor:help; margin-left:0.3rem;">ℹ️</span> $1`);
    
    return `<label class="app-item" title="${newTitle}">\n                                <input type="checkbox" name="post_apps" value="${value}"${inputAttrs}>\n                                ${newInnerContent.trim()}\n                            </label>`;
});

fs.writeFileSync(path, replaced);
console.log("Success");
