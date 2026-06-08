document.getElementById('install-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const disk = document.getElementById('target-disk').value;
    const part = document.getElementById('partitioning').value;
    const initSys = document.getElementById('init_system').value;
    const boot = document.getElementById('bootloader').value;
    const kernels = document.getElementById('kernel').value;
    const gpu = document.getElementById('gpu').value;
    const dns = document.getElementById('dns').value;

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
    } else if (part === "luks1") {
        output += `cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptroot\n`;
        output += `mkfs.ext4 /dev/mapper/cryptroot\n`;
        output += `mount /dev/mapper/cryptroot /mnt\n`;
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

    let gpuPackages = "";
    if (gpu === "amd") gpuPackages = "mesa xf86-video-amdgpu vulkan-radeon";
    else if (gpu === "nvidia-nouveau") gpuPackages = "mesa xf86-video-nouveau";
    else if (gpu === "nvidia-prop") gpuPackages = "nvidia nvidia-utils";

    output += `## 2. Base Installation, Kernel & GPU\n`;
    output += `\`\`\`bash\n`;
    output += `pacstrap -K /mnt base ${kernels} ${gpuPackages} linux-firmware neovim sudo git\n`;
    output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
    output += `arch-chroot /mnt\n`;
    output += `\`\`\`\n\n`;

    output += `## 3. Initramfs Configuration (${initSys})\n`;
    output += `Edit \`/etc/mkinitcpio.conf\` inside the chroot:\n`;
    output += `\`\`\`bash\n`;
    if (initSys === "systemd") {
        if (part === "unencrypted") {
            output += `HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block filesystems fsck)\n`;
        } else if (part.includes("lvm")) {
            output += `HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt lvm2 filesystems fsck)\n`;
        } else {
            output += `HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)\n`;
        }
    } else {
        // busybox init
        if (part === "unencrypted") {
            output += `HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block filesystems fsck)\n`;
        } else if (part.includes("lvm")) {
            output += `HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt lvm2 filesystems fsck)\n`;
        } else {
            output += `HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt filesystems fsck)\n`;
        }
    }
    output += `mkinitcpio -P\n`;
    output += `\`\`\`\n\n`;

    output += `## 4. Bootloader & Secure Boot (${boot})\n`;
    if (boot.includes("uki")) {
        output += `*Note: You chose UKI. You do not need GRUB or systemd-boot to load the OS, UEFI loads it directly.*\n`;
        output += `\`\`\`bash\n`;
        output += `pacman -S sbsigntools efitools efibootmgr\n`;
        if (boot === "uki-shim") {
            output += `pacman -S shim-signed\n`;
            output += `# Copy shim to EFI and configure it to boot your UKI.\n`;
            output += `cp /usr/share/shim-signed/shimx64.efi /efi/EFI/arch/bootx64.efi\n`;
        } else {
            output += `# Use sbctl or arch-secure-boot.sh to generate Custom Keys and sign the UKI.\n`;
        }
        output += `\`\`\`\n`;
    } else if (boot === "systemd-boot") {
        output += `\`\`\`bash\n`;
        output += `bootctl install --esp-path=/efi\n`;
        output += `\`\`\`\n`;
    } else {
        output += `\`\`\`bash\n`;
        output += `pacman -S grub efibootmgr\n`;
        if (boot === "grub-shim") {
            output += `pacman -S shim-signed\n`;
            output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB --modules="tpm" --disable-shim-lock\n`;
            output += `cp /usr/share/shim-signed/shimx64.efi /efi/EFI/GRUB/bootx64.efi\n`;
        } else {
            output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n`;
        }
        output += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
        output += `\`\`\`\n`;
    }

    output += `\n## 5. DNS Caching Service (${dns})\n`;
    output += `\`\`\`bash\n`;
    if (dns === "unbound") {
        output += `pacman -S unbound\n`;
        output += `systemctl enable unbound\n`;
    } else if (dns === "dnscrypt-proxy") {
        output += `pacman -S dnscrypt-proxy\n`;
        output += `systemctl enable dnscrypt-proxy\n`;
    } else {
        output += `systemctl enable systemd-resolved\n`;
    }
    output += `\`\`\`\n`;

    output += `\n*Guide complete. Ensure networking and passwords are set before rebooting into your tailored environment.*`;

    document.getElementById('generated-guide').textContent = output;
    document.getElementById('output-section').style.display = 'block';
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
});
