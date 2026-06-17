import re

tooltip_path = 'website/tooltip.js'
with open(tooltip_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Add Libre-OTP mapping
new_mapping = "        'Output Format':                   '?page=architecture.md',\n        '🛡️ Post-Quantum Libre-OTP':       '?page=libre-otp.md',\n"
js = js.replace("        'Output Format':                   '?page=architecture.md',\n", new_mapping)

with open(tooltip_path, 'w', encoding='utf-8') as f:
    f.write(js)
