document.getElementById('install-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const disk = document.getElementById('target-disk').value;
    const part = document.getElementById('partitioning').value;
    const boot = document.getElementById('bootloader').value;
    const kernels = document.getElementById('kernel').value;

    let partEfi = disk + "1";
    let partRoot = disk + "2";
    if (disk.includes("nvme")) {
        partEfi = disk + "p1";
        partRoot = disk + "p2";
    }

    let output = `# Your Custom Arch Linux Guide\n\n`;
    output += `## 1. Partitioning (${part})\n`;
    output += `\`\`\`bash\n`;
    output += `sgdisk -Z ${disk}\n`;
    output += `sgdisk -n 1:0:+512M -t 1:ef00 ${disk}\n`;
    output += `sgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
    output += `mkfs.fat -F32 ${partEfi}\n`;
    
    if (part === "unencrypted") {
        output += `mkfs.ext4 ${partRoot}\n`;
        output += `mount ${partRoot} /mnt\n`;
    } else if (part === "luks2") {
        output += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptroot\n`;
        output += `mkfs.ext4 /dev/mapper/cryptroot\n`;
        output += `mount /dev/mapper/cryptroot /mnt\n`;
    } else {
        output += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptlvm\n`;
        output += `pvcreate /dev/mapper/cryptlvm\n`;
        output += `vgcreate vg0 /dev/mapper/cryptlvm\n`;
        output += `lvcreate -l 100%FREE vg0 -n root\n`;
        output += `mkfs.ext4 /dev/vg0/root\n`;
        output += `mount /dev/vg0/root /mnt\n`;
    }
    output += `mkdir -p /mnt/efi\nmount ${partEfi} /mnt/efi\n`;
    output += `\`\`\`\n\n`;

    output += `## 2. Base Installation & Kernel\n`;
    output += `\`\`\`bash\n`;
    output += `pacstrap -K /mnt base ${kernels} linux-firmware neovim sudo git\n`;
    output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
    output += `arch-chroot /mnt\n`;
    output += `\`\`\`\n\n`;

    output += `## 3. Bootloader Configuration (${boot})\n`;
    if (boot === "uki-no-grub") {
        output += `*Note: In chroot, install sbctl and configure UKIs. See wiki for Secure Boot key enrollment.*\n`;
        output += `\`\`\`bash\n`;
        output += `pacman -S sbsigntools efitools efibootmgr\n`;
        output += `bootctl install --esp-path=/efi\n`;
        output += `\`\`\`\n`;
    } else if (boot === "systemd-boot") {
        output += `\`\`\`bash\n`;
        output += `bootctl install --esp-path=/efi\n`;
        output += `\`\`\`\n`;
    } else {
        output += `\`\`\`bash\n`;
        output += `pacman -S grub efibootmgr\n`;
        output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n`;
        output += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
        output += `\`\`\`\n`;
    }

    output += `\n*Guide complete. Reboot into your tailored environment.*`;

    document.getElementById('generated-guide').textContent = output;
    document.getElementById('output-section').style.display = 'block';
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
});
