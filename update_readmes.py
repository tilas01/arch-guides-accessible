import os

tools = ["anti-ducky", "anti-evil-maid", "kernel-watcher", "libre-otp", "scarecrow"]
base = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-dynamic\security-tools"

descs = {
    "anti-ducky": "Automated USB HID sandboxing and threat detection. Blocks malicious keystroke injection.",
    "anti-evil-maid": "LUKS boot tampering protection and Evil Maid attack deterrence.",
    "kernel-watcher": "Deep system integrity monitoring. Watches for unauthorized module loading.",
    "libre-otp": "Universal 2FA/OTP integration across the Arch ecosystem.",
    "scarecrow": "Advanced Ring-0 Linux Kernel Module (LKM) for Netfilter logging and Kprobe execution tracking."
}

for t in tools:
    readme_path = os.path.join(base, t, "README.md")
    desc = descs[t]
    title = " ".join([word.capitalize() for word in t.split("-")])
    
    content = f"""<div align="center">
  <img src="img/icon.png" alt="Icon" width="128" height="128">
  <h1>{title}</h1>
  <p><strong>{desc}</strong></p>
</div>

## Features
- Native Arch Linux support (Wayland/Xorg via eframe)
- Minimalist Tokyo Night UI design
- Background root daemon capability

## Usage
Run directly from terminal:
```bash
./{t} --interactive
```
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
