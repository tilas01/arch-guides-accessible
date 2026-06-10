def patch_index_html():
    with open('website/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add Display Server Dropdown
    display_html = """
            <div class="form-step" data-title="Display Server" data-desc="Choose between modern Wayland or legacy Xorg. Dusky OS and DWM require Xorg.">
                <div class="form-group">
                    <label for="display_server">Display Server Protocol</label>
                    <select id="display_server">
                        <option value="auto">Auto (Depends on DE)</option>
                        <option value="wayland">Wayland (Modern & Secure)</option>
                        <option value="xorg">Xorg (Legacy & Compatible, Minimal Setup)</option>
                    </select>
                </div>
            </div>
    """
    if 'id="display_server"' not in content:
        # Insert before the Web Browser section
        content = content.replace('</select>\n                    </div>\n\n                    <div class="form-group form-step">\n                        <label>Web Browser:', 
                                  '</select>\n                    </div>\n' + display_html + '\n                    <div class="form-group form-step">\n                        <label>Web Browser:')

    # 2. Add Cheatsheets Dropdown to Nav
    cheatsheets_html = """
            <div class="dropdown">
                <a href="#" class="nav-link dropdown-toggle" title="Helpful Cheatsheets">Cheatsheets ▼</a>
                <div class="dropdown-content">
                    <a href="wiki.html#OS-Shortcut--Command-cheatsheet-for-dusky-2026-os-release" onclick="window.open('docs/dusky-cheatsheet.md', '_blank'); return false;">OS Shortcut & Command cheatsheet for dusky 2026 os release</a>
                    <a href="wiki.html#Arch-Command-Cheatsheet" onclick="window.open('docs/helpful-commands.md', '_blank'); return false;">Arch Command Cheatsheet</a>
                </div>
            </div>
    """
    
    # We need to add some basic CSS for dropdown into the html or css
    dropdown_css = """
    <style>
    .dropdown {
        position: relative;
        display: inline-block;
    }
    .dropdown-content {
        display: none;
        position: absolute;
        background-color: var(--bg-darker);
        min-width: 250px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.5);
        z-index: 1;
        border: 1px solid var(--accent-purple);
        border-radius: 5px;
    }
    .dropdown-content a {
        color: var(--fg-color);
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        font-size: 0.9rem;
    }
    .dropdown-content a:hover {
        background-color: var(--bg-lighter);
        color: var(--accent-cyan);
    }
    .dropdown:hover .dropdown-content {
        display: block;
    }
    </style>
    """
    
    if 'class="dropdown"' not in content:
        content = content.replace('</head>', dropdown_css + '\n</head>')
        content = content.replace('<a href="https://github.com/tilas01/arch-guides-dynamic" target="_blank" class="nav-link" title="Project Repository">Repository</a>', '<a href="https://github.com/tilas01/arch-guides-dynamic" target="_blank" class="nav-link" title="Project Repository">Repository</a> | ' + cheatsheets_html)


    with open('website/index.html', 'w', encoding='utf-8') as f:
        f.write(content)

def patch_script_js():
    with open('website/script.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to fetch display_server and apply logic
    if 'const displayServer' not in content:
        content = content.replace("const desktop = document.getElementById('desktop').value;", "const desktop = document.getElementById('desktop').value;\n    const displayServer = document.getElementById('display_server') ? document.getElementById('display_server').value : 'auto';")

    # Smart analysis warning for Wayland + Dusky
    warning_check = '''
        if (displayServer === "wayland" && desktop === "dusky") {
            window.smartAnalysisWarnings.push("Dusky OS is based on X11. Selecting Wayland will conflict and break the OS.");
        }
        if (displayServer === "wayland" && desktop === "dwm") {
            window.smartAnalysisWarnings.push("DWM is strictly X11. Selecting Wayland will break your display manager.");
        }
    '''
    if 'displayServer === "wayland"' not in content:
        content = content.replace("if (desktop === \"dusky\" && post_apps.includes(\"paru\") === false) {", warning_check + "\n        if (desktop === \"dusky\" && post_apps.includes(\"paru\") === false) {")

    # Change Dusky installation to respect displayServer
    old_dusky = 'output += `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\\n`;'
    new_dusky = '''if (displayServer === "wayland") {
            output += `pacman -S --noconfirm git base-devel wayland xorg-xwayland\\n`;
        } else {
            output += `pacman -S --noconfirm git base-devel xorg-server xorg-xinit\\n`;
        }'''
    content = content.replace(old_dusky, new_dusky)

    with open('website/script.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_index_html()
    patch_script_js()
    print("UI Phase 3 complete!")
