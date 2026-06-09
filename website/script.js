document.getElementById('install-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const fw = document.getElementById('firmware').value;
    const fs = document.getElementById('filesystem').value;
    const disk = document.getElementById('target-disk').value;
    const part = document.getElementById('partitioning').value;
    const initSys = document.getElementById('init_system').value;
    const boot = document.getElementById('bootloader').value;
    const kernels = document.getElementById('kernel').value;
    const gpu = document.getElementById('gpu').value;
    const philosophy = document.getElementById('philosophy').value;
    const desktop = document.getElementById('desktop').value;
    const browser = document.getElementById('browser').value;
    const dns = document.getElementById('dns').value;

    let partEfi = disk + "1";
    let partRoot = disk + "2";
    if (disk.includes("nvme")) {
        partEfi = disk + "p1";
        partRoot = disk + "p2";
    }

    let output = `# Your Custom Arch Linux Guide\n\n`;
    
    output += `## 1. Partitioning & Formatting (${part} + ${fs})\n`;
    output += `\`\`\`bash\n`;
    if (fw === "uefi") {
        output += `sgdisk -Z ${disk}\n`;
        output += `sgdisk -n 1:0:+512M -t 1:ef00 ${disk}\n`;
        output += `sgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
        output += `mkfs.fat -F32 ${partEfi}\n`;
    } else {
        output += `sgdisk -Z ${disk}\n`;
        output += `sgdisk -n 1:0:+2M -t 1:ef02 ${disk} # BIOS boot partition\n`;
        output += `sgdisk -n 2:0:0 -t 2:8300 ${disk}\n`;
        partRoot = disk.includes("nvme") ? disk + "p2" : disk + "2";
    }
    
    let targetMount = partRoot;

    if (part === "luks1") {
        output += `cryptsetup luksFormat --type luks1 -c aes-xts-plain64 -s 512 -h sha512 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptroot\n`;
        targetMount = "/dev/mapper/cryptroot";
    } else if (part === "luks2") {
        output += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 --hash sha512 --iter-time 5000 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptroot\n`;
        targetMount = "/dev/mapper/cryptroot";
    } else if (part.includes("lvm")) {
        output += `cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 ${partRoot}\n`;
        output += `cryptsetup open ${partRoot} cryptlvm\n`;
        output += `pvcreate /dev/mapper/cryptlvm\n`;
        output += `vgcreate vg0 /dev/mapper/cryptlvm\n`;
        output += `lvcreate -l 100%FREE vg0 -n root\n`;
        targetMount = "/dev/vg0/root";
    }

    if (fs === "btrfs") {
        output += `mkfs.btrfs -f ${targetMount}\n`;
        output += `mount ${targetMount} /mnt\n`;
        output += `btrfs subvolume create /mnt/@\n`;
        output += `btrfs subvolume create /mnt/@home\n`;
        output += `btrfs subvolume create /mnt/@var\n`;
        output += `btrfs subvolume create /mnt/@snapshots\n`;
        output += `umount /mnt\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@ ${targetMount} /mnt\n`;
        output += `mkdir -p /mnt/{home,var,.snapshots}\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@home ${targetMount} /mnt/home\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@var ${targetMount} /mnt/var\n`;
        output += `mount -o noatime,compress=zstd,space_cache=v2,subvol=@snapshots ${targetMount} /mnt/.snapshots\n`;
    } else if (fs === "xfs") {
        output += `mkfs.xfs -f ${targetMount}\n`;
        output += `mount ${targetMount} /mnt\n`;
    } else {
        output += `mkfs.ext4 ${targetMount}\n`;
        output += `mount ${targetMount} /mnt\n`;
    }

    if (fw === "uefi") {
        output += `mkdir -p /mnt/efi\nmount ${partEfi} /mnt/efi\n`;
    }
    output += `\`\`\`\n\n`;

    let gpuPackages = "";
    if (gpu === "amd") gpuPackages = "mesa xf86-video-amdgpu vulkan-radeon";
    else if (gpu === "nvidia-nouveau") gpuPackages = "mesa xf86-video-nouveau";
    else if (gpu === "nvidia-prop") gpuPackages = "nvidia nvidia-utils";

    let adminTools = philosophy === "libre" ? "opendoas pfetch" : "sudo fastfetch";
    let fsTools = fs === "btrfs" ? "btrfs-progs snapper" : (fs === "xfs" ? "xfsprogs" : "");

    output += `## 2. Base Installation, Kernel & Admin Tools\n`;
    output += `\`\`\`bash\n`;
    output += `pacstrap -K /mnt base ${kernels} ${gpuPackages} linux-firmware neovim ${adminTools} git ${fsTools}\n`;
    output += `genfstab -U /mnt >> /mnt/etc/fstab\n`;
    output += `arch-chroot /mnt\n`;
    
    if (philosophy === "libre") {
        output += `echo "permit persist :wheel" > /etc/doas.conf\n`;
        output += `ln -s /usr/bin/doas /usr/bin/sudo\n`;
    } else {
        output += `echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel\n`;
    }
    output += `\`\`\`\n\n`;

    output += `## 3. Initramfs Configuration (${initSys})\n`;
    output += `Edit \`/etc/mkinitcpio.conf\` inside the chroot:\n`;
    output += `\`\`\`bash\n`;
    
    let baseHooks = initSys === "systemd" 
        ? "base systemd autodetect microcode modconf kms keyboard sd-vconsole block" 
        : "base udev autodetect microcode modconf kms keyboard keymap consolefont block";

    let cryptoHook = "";
    if (part !== "unencrypted") {
        cryptoHook = initSys === "systemd" ? "sd-encrypt" : "encrypt";
    }
    
    let lvmHook = part.includes("lvm") ? "lvm2" : "";
    let fsHook = fs === "btrfs" ? "btrfs filesystems fsck" : "filesystems fsck";

    // Combine hooks neatly
    let allHooks = [baseHooks, cryptoHook, lvmHook, fsHook].filter(h => h).join(" ");
    
    output += `HOOKS=(${allHooks})\n`;
    output += `mkinitcpio -P\n`;
    output += `\`\`\`\n\n`;

    output += `## 4. Bootloader & Secure Boot (${boot})\n`;
    if (fw === "bios" || boot.includes("grub")) {
        output += `\`\`\`bash\n`;
        output += `pacman -S grub efibootmgr\n`;
        if (fw === "uefi") {
            if (boot === "grub-shim") {
                output += `pacman -S shim-signed\n`;
                output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB --modules="tpm" --disable-shim-lock\n`;
                output += `cp /usr/share/shim-signed/shimx64.efi /efi/EFI/GRUB/bootx64.efi\n`;
            } else {
                output += `grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB\n`;
            }
        } else {
            output += `grub-install --target=i386-pc ${disk}\n`;
        }
        output += `grub-mkconfig -o /boot/grub/grub.cfg\n`;
        output += `\`\`\`\n`;
    } else if (boot.includes("uki")) {
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

    output += `\n## 6. Post-Install Apps & Desktop Environment\n`;
    output += `\`\`\`bash\n`;
    if (desktop === "gnome") {
        output += `pacman -S gnome gnome-tweaks\n`;
        output += `systemctl enable gdm\n`;
    } else if (desktop === "kde") {
        output += `pacman -S plasma-desktop sddm\n`;
        output += `systemctl enable sddm\n`;
    } else if (desktop === "dwm") {
        output += `pacman -S xorg-server xorg-xinit base-devel libx11 libxinerama libxft\n`;
        output += `# Compile dwm from source manually\n`;
    }

    if (browser === "librewolf") {
        output += `pacman -S librewolf\n`;
    } else if (browser === "firefox") {
        output += `pacman -S firefox\n`;
    }
    
    if (fs === "btrfs") {
        output += `# Configure Snapper\n`;
        output += `snapper -c root create-config /\n`;
        output += `systemctl enable snapper-timeline.timer snapper-cleanup.timer\n`;
    }
    output += `\`\`\`\n`;

    output += `\n*Guide complete. Ensure networking and passwords are set before rebooting into your tailored environment.*`;

    document.getElementById('generated-guide').textContent = output;
    document.getElementById('output-section').style.display = 'block';
    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
});
