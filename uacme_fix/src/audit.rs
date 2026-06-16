#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::RegKey;
use zeroize::Zeroize;

/// Represents a known UAC bypass target.
pub struct UacmeTarget {
    pub name: &'static str,
    pub path: &'static str,
    pub key_name: &'static str,
    pub expected_default: Option<&'static str>,
}

/// A comprehensive list of the most common registry keys hijacked by UACME methods.
pub const TARGETS: &[UacmeTarget] = &[
    UacmeTarget {
        name: "Method 33 / 43 (fodhelper.exe)",
        path: "Software\\Classes\\ms-settings\\Shell\\Open\\command",
        key_name: "", // Default value
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 33 (fodhelper.exe) - DelegateExecute",
        path: "Software\\Classes\\ms-settings\\Shell\\Open\\command",
        key_name: "DelegateExecute",
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 34 (DiskCleanup)",
        path: "Environment",
        key_name: "windir",
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 41 (ComputerDefaults.exe)",
        path: "Software\\Classes\\ms-settings\\Shell\\Open\\command",
        key_name: "",
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 53 (sdclt.exe)",
        path: "Software\\Classes\\Folder\\shell\\open\\command",
        key_name: "",
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 53 (sdclt.exe) - DelegateExecute",
        path: "Software\\Classes\\Folder\\shell\\open\\command",
        key_name: "DelegateExecute",
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 70 (wsreset.exe)",
        path: "Software\\Classes\\AppX82a6gwre4fdg37wtpt6vflrvddrcxgky\\Shell\\open\\command",
        key_name: "",
        expected_default: None,
    },
    UacmeTarget {
        name: "Method 70 (wsreset.exe) - DelegateExecute",
        path: "Software\\Classes\\AppX82a6gwre4fdg37wtpt6vflrvddrcxgky\\Shell\\open\\command",
        key_name: "DelegateExecute",
        expected_default: None,
    },
];

/// A finding from the audit process.
pub struct AuditFinding {
    pub target_name: String,
    pub registry_path: String,
    pub key_name: String,
    pub malicious_payload: String,
}

impl Drop for AuditFinding {
    fn drop(&mut self) {
        // Zeroize memory for sensitive payload paths/commands
        self.malicious_payload.zeroize();
    }
}

/// Scans the registry for UACME indicators of compromise.
pub fn run_audit() -> Vec<AuditFinding> {
    let mut findings = Vec::new();
    
    #[cfg(windows)]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        
        for target in TARGETS {
            if let Ok(key) = hkcu.open_subkey_with_flags(target.path, KEY_READ) {
                // Check if the specific value exists
                if let Ok(mut value) = key.get_value::<String, _>(target.key_name) {
                    if !value.trim().is_empty() {
                        findings.push(AuditFinding {
                            target_name: target.name.to_string(),
                            registry_path: format!("HKCU\\{}", target.path),
                            key_name: target.key_name.to_string(),
                            malicious_payload: value.clone(),
                        });
                    }
                    value.zeroize();
                }
            }
        }
    }

    findings
}
