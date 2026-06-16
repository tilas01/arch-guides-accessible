#[cfg(windows)]
use winapi::um::processthreadsapi::OpenProcessToken;
#[cfg(windows)]
use winapi::um::securitybaseapi::GetTokenInformation;
#[cfg(windows)]
use winapi::um::winnt::{TokenElevation, HANDLE, TOKEN_ELEVATION, TOKEN_QUERY};
#[cfg(windows)]
use std::ptr;

/// Checks if the current process is running with administrative privileges.
pub fn is_elevated() -> bool {
    #[cfg(windows)]
    {
        let mut handle: HANDLE = ptr::null_mut();
        let current_process = unsafe { winapi::um::processthreadsapi::GetCurrentProcess() };
        
        if unsafe { OpenProcessToken(current_process, TOKEN_QUERY, &mut handle) } != 0 {
            let mut elevation: TOKEN_ELEVATION = TOKEN_ELEVATION { TokenIsElevated: 0 };
            let mut size = std::mem::size_of::<TOKEN_ELEVATION>() as u32;
            
            let result = unsafe {
                GetTokenInformation(
                    handle,
                    TokenElevation,
                    &mut elevation as *mut _ as *mut _,
                    size,
                    &mut size,
                )
            };
            
            if result != 0 {
                return elevation.TokenIsElevated != 0;
            }
        }
        false
    }
    
    #[cfg(not(windows))]
    {
        // For non-Windows builds (e.g. testing compilation on Linux), just return true or false
        // UACME is fundamentally a Windows exploit.
        false
    }
}
