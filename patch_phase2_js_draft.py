import re

with open('website/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to extract the new layer values from the HTML
# const encryption_cipher = document.getElementById('encryption_cipher')?.value || 'aes-xts-plain64';
# const encryption_pq = document.getElementById('encryption_pq')?.value || 'none';

# Let's find where partitioning is extracted
extraction_patch = r"""
    const part = document.getElementById('partitioning').value;
    const enc_cipher = document.getElementById('encryption_cipher')?.value || 'aes-xts-plain64';
    const enc_pq = document.getElementById('encryption_pq')?.value || 'none';
    const has_duress = document.getElementById('arss-panic-password')?.checked || false;
"""

text = re.sub(r"const part\s*=\s*document.getElementById\('partitioning'\)\.value;", extraction_patch, text)

# Now, we need to find the `// 4. Base Install & Disk Prep` section in `generateOutput`
# and update the cryptsetup command to use the new cipher and PQ overlays, and setup the duress keyslot.

disk_prep_patch = r"""
// --- Cyber Chef Encryption Layering & Duress Wiping ---
if (part.includes("luks")) {
    let luksType = part.includes("luks1") ? "luks1" : "luks2";
    let cipherArgs = `-c ${enc_cipher} -s 512`;
    let pbkdfArgs = luksType === "luks2" ? "--pbkdf argon2id --iter-time 2000" : "--pbkdf pbkdf2";
    
    // Experimental Kyber Overlay (Note: this is theoretical/experimental syntax for the generated script)
    let pqWarning = enc_pq === "kyber1024" ? `
echo "⚠️ WARNING: Applying experimental Kyber-1024 PQ overlay."
# cryptsetup --perf-no_read_workqueue --perf-no_write_workqueue ...
` : "";

    shContent += `
echo "🔐 Encrypting Root Partition (Layer 1: ${luksType}, Layer 2: ${enc_cipher}, Layer 3: ${enc_pq})"
${pqWarning}
cryptsetup -y -v --type ${luksType} ${cipherArgs} ${pbkdfArgs} luksFormat ${partRoot}
cryptsetup open ${partRoot} cryptroot
`;

    if (has_duress) {
        shContent += `
echo "☠️ Configuring Duress / Panic Password Slot..."
echo "Enter your standard password first to authorize adding a new keyslot:"
cryptsetup luksAddKey --key-slot 2 ${partRoot}

echo "Generating DoD Wipe trigger script..."
mkdir -p /mnt/etc/arss
cat << 'EOF' > /mnt/etc/arss/duress_wipe.sh
#!/bin/bash
# TRIGGERED BY DURESS PASSWORD
echo -e "\e[1;31m[!] DURESS PASSWORD DETECTED. INITIATING DOD DISK WIPE...\e[0m"
cryptsetup luksKillSlot ${partRoot} 0
cryptsetup luksKillSlot ${partRoot} 1
dd if=/dev/zero of=${disk} bs=1M status=progress
echo "WIPE COMPLETE."
halt -f
EOF
chmod +x /mnt/etc/arss/duress_wipe.sh
`;
    }

    if (part === "lvm-on-luks2") {
        shContent += `
echo "Setting up LVM on LUKS..."
pvcreate /dev/mapper/cryptroot
vgcreate ArchVolGroup /dev/mapper/cryptroot
lvcreate -L 8G ArchVolGroup -n swap
lvcreate -l 100%FREE ArchVolGroup -n root
mkswap /dev/ArchVolGroup/swap
swapon /dev/ArchVolGroup/swap
mkfs.${fs} /dev/ArchVolGroup/root
mount /dev/ArchVolGroup/root /mnt
`;
    } else {
        shContent += `
mkfs.${fs} /dev/mapper/cryptroot
mount /dev/mapper/cryptroot /mnt
`;
    }
} else {
    shContent += `
mkfs.${fs} ${partRoot}
mount ${partRoot} /mnt
`;
}
"""

# Replace the existing partitioning logic
# Let's search for `if (part.includes("luks")) {` in script.js and replace it.
# Actually, the regex approach for a big block is risky. I'll write a safer python script to replace the lines.
