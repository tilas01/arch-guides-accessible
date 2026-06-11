const fs = require('fs');

const path = 'c:/Users/ryder/OneDrive/Documents/git/arch_guides_all_versions/arch-guides-dynamic/website/index.html';
let html = fs.readFileSync(path, 'utf8');

const appData = {
    'paru': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'firefox': { build: 'Proprietary Code Included', src: '📁 Arch Extra', isProp: true, propDesc: 'Contains closed-source telemetry and firmware blobs.' },
    'librewolf': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'tor-browser': { build: 'Reproducible', src: '📁 AUR', isProp: false },
    'chromium': { build: 'Proprietary Code Included', src: '📁 Arch Extra', isProp: true, propDesc: 'Google integration modules contain non-libre code.' },
    'ungoogled-chromium': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'signal': { build: 'Proprietary Electron Blobs', src: '📁 AUR', isProp: true, propDesc: 'The Electron build system relies on closed-source precompiled binaries.' },
    'keepassxc': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'clamav': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'firejail': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'doas': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'neovim': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'alacritty': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'kitty': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'zsh': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'vscodium': { build: 'Mostly Reproducible', src: '📁 AUR', isProp: false },
    'git': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'tmux': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'htop': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'pfetch': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'fastfetch': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'thunar': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'nautilus': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'mpv': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'vlc': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'obs': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'gimp': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'libreoffice': { build: 'Mostly Reproducible', src: '📁 Arch Extra', isProp: false },
    'flatpak': { build: 'Downloads Proprietary Apps', src: '📁 Arch Extra', isProp: true, propDesc: 'Flatpak itself is open-source, but Flathub distributes proprietary binaries like Discord and Spotify.' },
    'unattended-upgrades': { build: 'Reproducible', src: '📁 AUR', isProp: false },
    'timeshift': { build: 'Reproducible', src: '📁 AUR', isProp: false },
    'networkmanager': { build: 'Reproducible', src: '📁 Arch Core', isProp: false },
    'bluetooth': { build: 'Reproducible', src: '📁 Arch Core', isProp: false },
    'pipewire': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'openssh': { build: 'Reproducible', src: '📁 Arch Core', isProp: false },
    'snapper': { build: 'Reproducible', src: '📁 Arch Extra', isProp: false },
    'dusky-setup': { build: 'Reproducible', src: '📁 GitHub / dusklinux', isProp: false }
};

// Revert previous modification first if needed by grabbing the raw title before the " | Build:" injection
// We can just regex out the " | Build:..." part of the title

const appRegex = /<label class="app-item"\s+title="([^"]+)">\s*<input type="checkbox"\s+name="post_apps"\s+value="([^"]+)"([^>]*)>\s*([\s\S]*?)<\/label>/g;

let replaced = html.replace(appRegex, (match, titleAttr, value, inputAttrs, innerContent) => {
    let appInfo = appData[value] || { build: 'Unknown', src: '📁 Unknown', isProp: false };
    
    // Clean old title if it already has the injected data
    let cleanTitle = titleAttr.split(' | Build:')[0].trim();
    
    // Clean old innerContent if it has the ℹ️ emoji
    let cleanInner = innerContent.replace(/<span title="[^"]+"\s*style="cursor:help;\s*margin-left:0\.3rem;">ℹ️<\/span>\s*/, '');
    
    let titleParts = cleanTitle.split(':');
    let appName = titleParts[0].trim();
    let appDesc = titleParts.slice(1).join(':').trim();
    if (!appDesc) appDesc = appName;
    
    // Extract website link
    let linkMatch = cleanInner.match(/href="([^"]+)"/);
    let websiteUrl = linkMatch ? linkMatch[1] : '';
    
    let newTitle = '';
    if (appInfo.isProp) {
        newTitle = `${appName} [PROPRIETARY]\n--\n${appDesc}\n\nWARNING: ${appInfo.propDesc}\nBuild: N/A (Closed Source)\nSource: ${appInfo.src}\nWebsite: ${websiteUrl}`;
    } else {
        newTitle = `${appName}\n--\n${appDesc}\n\nBuild: ${appInfo.build}\nSource: ${appInfo.src}`;
        if (websiteUrl) newTitle += `\nWebsite: ${websiteUrl}`;
    }
    
    let newInnerContent = cleanInner.replace(/(<span class="app-desc">)/, `<span title="${newTitle}" style="cursor:help; margin-left:0.3rem;">ℹ️</span> $1`);
    
    return `<label class="app-item" title="${newTitle}">\n                                <input type="checkbox" name="post_apps" value="${value}"${inputAttrs}>\n                                ${newInnerContent.trim()}\n                            </label>`;
});

fs.writeFileSync(path, replaced);
console.log("Success");
