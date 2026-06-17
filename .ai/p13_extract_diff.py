import subprocess
import re

out = subprocess.check_output(['git', 'log', '-p', 'website/index.html']).decode('utf-8', errors='ignore')
matches = re.findall(r'^[+-].*?Post-Install Apps.*$', out, re.MULTILINE)

# Just write out the diff around "Post-Install Apps" to a file
with open("ui_diff.txt", "w", encoding='utf-8') as f:
    f.write(out[:50000])  # Just write the first 50k chars of the log
