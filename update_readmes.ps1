$tools = @("anti-ducky", "anti-evil-maid", "kernel-watcher", "libre-otp", "scarecrow")
$base = "C:\Users\ryder\OneDrive\Documents\git\arch_guides_all_versions\arch-guides-dynamic\security-tools"

$descs = @{
    "anti-ducky" = "Automated USB HID sandboxing and threat detection. Blocks malicious keystroke injection."
    "anti-evil-maid" = "LUKS boot tampering protection and Evil Maid attack deterrence."
    "kernel-watcher" = "Deep system integrity monitoring. Watches for unauthorized module loading."
    "libre-otp" = "Universal 2FA/OTP integration across the Arch ecosystem."
    "scarecrow" = "Advanced Ring-0 Linux Kernel Module (LKM) for Netfilter logging and Kprobe execution tracking."
}

foreach ($t in $tools) {
    $readme = "$base\$t\README.md"
    $desc = $descs[$t]
    $title = ($t -split "-" | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join " "
    
    $content = "<div align='center'>`n  <img src='img/icon.png' alt='Icon' width='128' height='128'>`n  <h1>$title</h1>`n  <p><strong>$desc</strong></p>`n</div>`n`n## Features`n- Native Arch Linux support (Wayland/Xorg via eframe)`n- Minimalist Tokyo Night UI design`n- Background root daemon capability`n`n## Usage`nRun directly from terminal:`n```bash`n./$t --interactive`n```"
    Set-Content -Path $readme -Value $content
}
