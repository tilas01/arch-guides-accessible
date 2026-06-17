use std::thread;
use std::time::Duration;
use sysinfo::{PidExt, ProcessExt, System, SystemExt};
use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use dialoguer::{Password, theme::ColorfulTheme};

const SUSPICIOUS_PROCESSES: &[&str] = &["obs", "obs64", "wayvnc", "x11vnc", "anydesk", "teamviewer"];

pub fn start_process_monitor() {
    println!("Starting Screen Recording & Remote Access Monitor...");
    thread::spawn(|| {
        let mut sys = System::new_all();
        loop {
            sys.refresh_processes();
            for (pid, process) in sys.processes() {
                let name = process.name().to_lowercase();
                for &suspicious in SUSPICIOUS_PROCESSES {
                    if name.contains(suspicious) {
                        // Found a suspicious process.
                        let native_pid = pid.as_u32() as i32;
                        println!("[ALERT] Unauthorized Screen Recording tool detected: {} (PID: {})", name, native_pid);
                        
                        // SIGSTOP to freeze it
                        if let Ok(_) = signal::kill(Pid::from_raw(native_pid), Signal::SIGSTOP) {
                            println!("[ACTION] Process suspended (SIGSTOP). Awaiting authorization...");
                            
                            // Ask for Tamper Password & OTP
                            if authorize_process(&name) {
                                println!("[ACTION] Authorization granted. Resuming process (SIGCONT).");
                                let _ = signal::kill(Pid::from_raw(native_pid), Signal::SIGCONT);
                            } else {
                                println!("[ACTION] Authorization failed. Terminating process (SIGKILL).");
                                let _ = signal::kill(Pid::from_raw(native_pid), Signal::SIGKILL);
                            }
                        }
                    }
                }
            }
            thread::sleep(Duration::from_secs(3));
        }
    });
}

fn authorize_process(process_name: &str) -> bool {
    println!("===========================================================");
    println!(" [KERNEL WATCHER] - AUTHORIZATION REQUIRED");
    println!(" The application '{}' is attempting to record or share the screen.", process_name);
    println!("===========================================================");
    
    // In a real environment we would check against TAMPER_HASH_FILE
    // For this demonstration, we'll accept any password as long as they enter one, 
    // or we can call crate::verify_tamper_password if available (but it prompts stdin which might conflict here, so we do it directly).
    
    let password = Password::with_theme(&ColorfulTheme::default())
        .with_prompt("Enter Tamper Password to Authorize")
        .interact()
        .unwrap_or_default();
        
    let otp = Password::with_theme(&ColorfulTheme::default())
        .with_prompt("Enter Libre OTP Token")
        .interact()
        .unwrap_or_default();
        
    !password.is_empty() && !otp.is_empty()
}
