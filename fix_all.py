import os
import re
from PIL import Image, ImageDraw

original_path = r"C:\Users\ryder\.gemini\antigravity-cli\brain\db63dba7-e955-406b-a27f-53e964a28d91\arch_banner_1780923400262.png"
output_path = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible\img\banner.png"

# Revert to good crop and apply rounded corners
im = Image.open(original_path).convert("RGBA")
bbox = (39, 230, 985, 717)
cropped = im.crop(bbox)

radius = 25
mask = Image.new("L", cropped.size, 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle((0, 0, cropped.size[0], cropped.size[1]), radius=radius, fill=255)
cropped.putalpha(mask)
cropped.save(output_path, "PNG")
print("Banner fixed and rounded.")

base_dir = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible"

def get_header(depth):
    img_path = "../" * depth + "img/banner.png" if depth > 0 else "img/banner.png"
    return f"""<img src="{img_path}" width="100%" alt="Arch Guides Banner">

# Arch Guides: Accessible & Modular
**The ultimate, dynamically customizable, and highly secure guide to installing Arch Linux.**

## ?? Legal Disclaimer & AI Notice
> *?? AI-Generated Content & Security Warning: Approximately 95% of the content in this repository has been generated, refactored, and formatted by AI, with manual curation by tilas01 and drawing from max-baz. While designed for modularity and high security, you are solely responsible for reviewing every command before execution. We strongly recommend testing in a VM and cross-referencing with the Arch Wiki. Provided "AS IS". Licensed under the MIT License.*

---

## Arch Dynamic Installation Setup Guide

"""

for root, dirs, files in os.walk(base_dir):
    if ".git" in root: continue
    for file in files:
        if file.endswith(".md"):
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, base_dir)
            depth = rel_path.count(os.sep)
            
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            content = re.sub(r'<img src=".*?img/banner\.png".*?>\s*', "", content)
            content = re.sub(r'# Arch Guides: Accessible & Modular\s*', "", content)
            content = re.sub(r'\*\*The ultimate, dynamically customizable.*?Arch Linux.\*\*\s*', "", content)
            content = re.sub(r'## ?? Legal Disclaimer & AI Notice\s*', "", content)
            content = re.sub(r'> \*?? AI-Generated Content.*?\*\s*', "", content)
            content = re.sub(r'## Arch Dynamic Installation Setup Guide\s*', "", content)
            content = re.sub(r'## Dynamic Setup Guide\s*', "", content)
            
            content = content.lstrip("-\n \t")
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(get_header(depth) + content)

print("Markdown files injected.")
