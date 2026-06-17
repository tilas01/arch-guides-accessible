import os

disclaimer = """
## ⚖️ Legal Disclaimer

**USE AT YOUR OWN RISK.**
This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. 
The author (tilas01) is not responsible for any system lockouts, data loss, bricked installations, or damages resulting from the use of this tool. These are advanced security mechanisms that interact directly with the Linux kernel, PAM, and the bootloader. Ensure you have adequate backups, fallback recovery keys, and understand the tools before deploying them in a production environment.
"""

base_dir = 'security-tools'
if os.path.exists(base_dir):
    for tool in os.listdir(base_dir):
        tool_dir = os.path.join(base_dir, tool)
        readme_path = os.path.join(tool_dir, 'README.md')
        
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "Legal Disclaimer" not in content:
                with open(readme_path, 'a', encoding='utf-8') as f:
                    f.write("\n" + disclaimer)
                print(f"Added disclaimer to {readme_path}")
            else:
                print(f"Disclaimer already exists in {readme_path}")
