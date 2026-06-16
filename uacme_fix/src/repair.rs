#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::RegKey;
use colored::*;

/// Safely removes a hijacked registry key or value.
/// Requires administrative privileges.
pub fn run_repair(target_path: &str, key_name: &str) -> bool {
    #[cfg(windows)]
    {
        // Strip the HKCU\\ prefix if it exists to safely parse the relative path
        let relative_path = if target_path.starts_with("HKCU\\") {
            &target_path[5..]
        } else {
            target_path
        };

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        // Attempt to open the key with write permissions
        match hkcu.open_subkey_with_flags(relative_path, KEY_WRITE) {
            Ok(key) => {
                // If key_name is empty, it means the Default value was hijacked.
                // We should delete the value or the entire subkey if appropriate.
                // UACME usually creates the subkeys (like ms-settings\Shell\Open\command) 
                // inside HKCU which overlay the system HKLM keys. 
                // Deleting the entire relative subkey structure in HKCU is usually the safest remediation.
                
                // Let's attempt to delete the lowest level key (e.g. "command") entirely, 
                // as legitimate binaries read from HKLM.
                drop(key); // Release handle before deletion
                
                match hkcu.delete_subkey_all(relative_path) {
                    Ok(_) => {
                        println!("{} Deleted subkey structure: {}", "[SUCCESS]".green(), target_path);
                        true
                    }
                    Err(e) => {
                        // If we can't delete the whole key, try to delete just the specific value
                        if let Ok(key) = hkcu.open_subkey_with_flags(relative_path, KEY_WRITE) {
                            if let Ok(_) = key.delete_value(key_name) {
                                println!("{} Deleted malicious value '{}' from {}", "[SUCCESS]".green(), key_name, target_path);
                                return true;
                            }
                        }
                        println!("{} Failed to remediate {}: {}", "[ERROR]".red(), target_path, e);
                        false
                    }
                }
            }
            Err(e) => {
                println!("{} Could not open key for writing {}: {}", "[ERROR]".red(), target_path, e);
                false
            }
        }
    }
    
    #[cfg(not(windows))]
    {
        println!("{} Repair operations are only supported on Windows.", "[ERROR]".red());
        false
    }
}
