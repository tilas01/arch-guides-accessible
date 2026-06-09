# ðŸ›ï¸ Architecture & Generation Logic

The `arch-guides-dynamic` deployment framework relies on a fully client-side, zero-backend architecture to generate highly secure and precisely customized Arch Linux deployment environments.

## How the Website Generator Works

The Interactive Generator (`website/index.html` and `website/script.js`) works locally in your browser to build the installation pipeline. No server requests are made to parse your data, guaranteeing privacy.

1. **Input Parameters:** The user selects hardware variables (UEFI vs BIOS), encryption thresholds (LUKS2, LUKS1), filesystems (BTRFS, Ext4), driver philosophy (Libre, Open Source), and output formatting.
2. **Dynamic Injection:** The Javascript engine analyzes these vectors and generates custom CLI routines. For instance, if `Libre` is selected, `sudo` is automatically stripped from the `pacstrap` process and `opendoas` is installed, configured, and persistently linked.
3. **Advanced Security Tools Integration:** The system leverages our natively built Rust binaries in `/security-tools`. When selected, the generator natively injects the compilation and configuration pipeline for `anti-ducky` (Keystroke Injection Mitigation) and `libre-otp` (PAM-compatible Multi-Factor Authentication).
4. **Rendering:** Using `marked.js`, the generator can drop the resulting payload into a live, editable Markdown interface directly within the browser, or output raw Bash execution scripts for headless deployment.

## Native Rust Security Tools

Instead of relying on bloated, proprietary modules, this framework maintains its own suite of Rust-native security tools available during deployment:

### ðŸ¦† Anti-RubberDucky Daemon
A daemon that interfaces directly with `/dev/input/eventX`. It profiles keystroke intervals using sub-millisecond precision (`THRESHOLD_MS=20`). If anomalous speeds are detectedâ€”symptomatic of malicious USB injection attacksâ€”it immediately forces a `loginctl lock-sessions` intervention.

### ðŸ” Libre-OTP
A native CLI OTP Authenticator utilizing the `totp-rs` algorithms. It requires zero network connectivity and generates secure Base32 Shared Secrets. It can be implemented inside `/etc/pam.d/system-login` or SSH configurations to mandate a fully open-source, non-proprietary 2FA mechanism before granting shell access.
