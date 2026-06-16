# UACME Secure Remediation Tool (`uacme_fix`)

`uacme_fix` is a highly specialized, memory-safe Rust utility designed to audit and remediate systems that have been compromised by User Account Control (UAC) bypass attacks, specifically targeting vectors popularized by the [UACME framework](https://github.com/hfiref0x/UACME).

## Features
- **Comprehensive Auditing:** Scans known COM Hijacking and Registry key manipulation vectors used to bypass UAC.
- **Secure Remediation:** Safely restores hijacked keys to system defaults.
- **Memory Safety:** Implements strict cryptographic `zeroize` practices to securely overwrite sensitive file paths or commands stored in memory after use.
- **Interactive Wizard:** Launch with `-i` or `--interactive` for a step-by-step terminal UI.

## Usage

### Interactive Mode
Launch the step-by-step remediation wizard:
```powershell
uacme_fix.exe --interactive
```

### Automated Auditing
Scan the system and report findings without making any changes:
```powershell
uacme_fix.exe --audit
```

### Automated Repair
Automatically delete and remediate all discovered hijack vectors (Requires Administrator Privileges):
```powershell
uacme_fix.exe --repair
```

## Security & Reproducibility
This utility is built with rigorous integrity guarantees. Every release on GitHub is compiled deterministically via GitHub Actions, hashed via SHA256, and GPG signed by the author to prevent supply-chain attacks.
