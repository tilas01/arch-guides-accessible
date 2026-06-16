import os

tools = {
    "anti-ducky": ("Anti-Ducky USB Blocker", "A Rust-based background daemon that enforces a strict USB whitelist upon screen lock, preventing Rubber Ducky / BadUSB keystroke injection attacks. Supports dynamic udev rules and quorum-based emergency unlocks."),
    "anti-evil-maid": ("Anti-Evil Maid Integrator", "Automated toolkit that records TPM PCRs, EFI variables, and the `boot` partition structure to detect Evil Maid / physical tampering attacks on next boot. Integrates with Libre-OTP for verifiable boot screens."),
    "kernel-watcher": ("Kernel Watcher (SIGSTOP)", "Rust-based eBPF/Process monitor that actively hunts for unauthorized screen recorders (OBS, WayVNC) and suspends them via SIGSTOP until an interactive Libre-OTP or Tamper Password authorization is provided."),
    "libre-otp": ("Libre-OTP Authenticator", "A completely offline, dependency-free Rust implementation of TOTP. Seeds deterministic hardware hashes into your LUKS bootloader, generating a physical 6-digit code on boot matching your smartphone to verify system integrity."),
    "scarecrow": ("Scarecrow Decoy System", "Creates a fully convincing, fake Windows/Linux environment when a Duress PIN is entered. Simultaneously triggers a background 20-pass DoD shred (`blkdiscard` + `shred`) of the physical LUKS header, permanently destroying all real data.")
}

for folder, (title, desc) in tools.items():
    readme_path = f"security-tools/{folder}/README.md"
    content = f"# {title}\n\n![Icon](img/icon.png)\n\n![Banner](img/banner.png)\n\n{desc}\n"
    
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {readme_path}")
