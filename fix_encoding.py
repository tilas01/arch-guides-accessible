import os
import re

base_dir = r"C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-accessible"

for root, dirs, files in os.walk(base_dir):
    if ".git" in root: continue
    for file in files:
        if file.endswith(".md"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            new_content = re.sub(r"## \?\? Legal Disclaimer", "## ?? Legal Disclaimer", content)
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
