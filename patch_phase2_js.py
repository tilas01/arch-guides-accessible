import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# The extraction of `part` in generateOutput()
extraction_patch = r"""const part = document.getElementById('partitioning').value;
    const enc_cipher = document.getElementById('encryption_cipher')?.value || 'aes-xts-plain64';
    const enc_pq = document.getElementById('encryption_pq')?.value || 'none';
    const has_duress = document.getElementById('arss-panic-password')?.checked || false;"""

text = re.sub(r"const part\s*=\s*document\.getElementById\('partitioning'\)\.value;", extraction_patch, text)

# The bash generation for encryption layering in generateOutput()
# It uses `o += `
# We find: `} else if (part.includes("lvm")) {`
# And: `o += `echo -n "$LUKS_PASS" | cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 - ${partRoot}\n`;`
# Wait, let's just replace the entire partitioning output logic in `script.js`.

# Since the generator is complex and writes line-by-line using `o +=`, let's just look at the exact LUKS bash string.
luks_find = r'o \+= `echo -n "\$LUKS_PASS" \| cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 - \$\{partRoot\}\\n`;'

luks_replace = r"""
        let luksType = part.includes("luks1") ? "luks1" : "luks2";
        let pbkdf = luksType === "luks2" ? "--pbkdf argon2id --iter-time 2000" : "--pbkdf pbkdf2";
        
        let pqWarning = enc_pq === "kyber1024" ? `echo -e "\\e[1;31m[!] WARNING: KYBER-1024 PQ OVERLAY ENABLED (EXPERIMENTAL)\\e[0m"\n` : "";
        o += pqWarning;
        o += `echo -n "$LUKS_PASS" | cryptsetup luksFormat --type ${luksType} --cipher ${enc_cipher} --key-size 512 ${pbkdf} - ${partRoot}\n`;
"""

text = re.sub(luks_find, luks_replace, text)


with open('website/script.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("script.js patched with Phase 2 extraction logic.")
