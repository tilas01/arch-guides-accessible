import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to inject the Duress script creation if has_duress is true.
# Let's find where we close the cryptroot `o += \`cryptsetup open ${partRoot} cryptroot\\n\`;`
duress_find = r'(o \+= `cryptsetup open \$\{partRoot\} cryptroot\\n`;)'

duress_replace = r"""\1

        if (has_duress) {
            o += `\necho "☠️ Configuring Duress & Decoy Slots..."\n`;
            o += `echo "Assigning Decoy keyslot (Slot 1)..."\n`;
            o += `cryptsetup luksAddKey --key-slot 1 ${partRoot}\n`;
            o += `echo "Assigning Duress keyslot (Slot 2)..."\n`;
            o += `cryptsetup luksAddKey --key-slot 2 ${partRoot}\n`;

            o += `\necho "Generating DoD Duress Wipe Trigger..."\n`;
            o += `mkdir -p /mnt/etc/arss\n`;
            o += `cat << 'EOF' > /mnt/etc/arss/duress_wipe.sh\n`;
            o += `#!/bin/bash\n`;
            o += `echo -e "\\e[1;31m[!] DURESS PASSWORD DETECTED. INITIATING DOD DISK WIPE...\\e[0m"\n`;
            o += `cryptsetup luksKillSlot ${partRoot} 0\n`;
            o += `cryptsetup luksKillSlot ${partRoot} 1\n`;
            o += `cryptsetup luksKillSlot ${partRoot} 2\n`;
            o += `dd if=/dev/zero of=${disk} bs=1M status=progress\n`;
            o += `echo "WIPE COMPLETE."\n`;
            o += `halt -f\n`;
            o += `EOF\n`;
            o += `chmod +x /mnt/etc/arss/duress_wipe.sh\n`;
        }
"""

text = re.sub(duress_find, duress_replace, text)


with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("script.js patched with Duress logic.")
