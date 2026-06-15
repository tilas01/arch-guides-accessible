import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Currently the script extracts values like this:
# const target_username = gv('username','archuser');
# const hostname = gv('hostname','archbox');
# const doasMode = gv('doas_mode','doas_only');

# We need to find the `let shellScript = ` template literal and replace the static variable declarations
# with dynamic ones that ask the user if they are empty.

# Wait, instead of regexing the massive template literal, let's just patch the top of `let shellScript = \``
# where we output the variables.
# Actually, the generator injects ${target_username} directly.
# Let's add bash interactive prompts at the very top of `let shellScript = \``

old_shell_start = r"(let shellScript = `.*?#!/bin/bash\n\n)"
new_shell_start = r"""\1# ==========================================
# INTERACTIVE PROMPTS (If omitted in GUI)
# ==========================================
if [ -z "${hostname}" ]; then
    read -p "Enter desired hostname: " HOSTNAME_INPUT
else
    HOSTNAME_INPUT="${hostname}"
fi

if [ -z "${target_username}" ]; then
    read -p "Enter new username: " USERNAME_INPUT
else
    USERNAME_INPUT="${target_username}"
fi

"""

# Wait! The variables in the generated bash script use the JS literals.
# Like `echo "${hostname}" > /mnt/etc/hostname`
# If I change it to `HOSTNAME_INPUT`, I have to change it everywhere in the script.
# Alternatively, I can just modify the JS variable definitions at the top of `generateOutput()`!
# If `gv('username', '')` is empty, set JS `target_username` to `$(read -p "Enter username: " u && echo $u)`?
# No, that will literally write `$(read...)` into `/mnt/etc/hostname`!

# The best way is to modify the top of the generated shell script to define the bash variables, 
# and then use those bash variables. But since `arch-guides-dynamic` might already be injecting `${hostname}` statically everywhere, 
# wait, how did it work in commit 57847b5?
