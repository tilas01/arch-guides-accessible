use evdev::{Device, Key};
use std::time::Instant;
use std::process::Command;

const THRESHOLD_MS: u128 = 20; // 20ms between keystrokes indicates automated injection
const STRIKE_LIMIT: u8 = 10;   // Lock after 10 incredibly fast sequential strikes

fn main() {
    println!("Anti-RubberDucky Daemon Started. Monitoring input devices.");
    
    // Find all keyboard devices
    let mut devices = vec![];
    for i in 0..32 {
        if let Ok(device) = Device::open(format!("/dev/input/event{}", i)) {
            if device.supported_keys().map_or(false, |keys| keys.contains(Key::KEY_ENTER)) {
                devices.push(device);
            }
        }
    }

    if devices.is_empty() {
        println!("No input devices found or no permissions.");
        return;
    }

    let mut last_key_time = Instant::now();
    let mut rapid_strikes = 0;

    // A real implementation would multiplex the devices using epoll. 
    // This is a minimal example for educational/demonstration purposes.
    loop {
        for device in devices.iter_mut() {
            if let Ok(events) = device.fetch_events() {
                for ev in events {
                    if ev.value() == 1 { // Key press
                        let now = Instant::now();
                        let diff = now.duration_since(last_key_time).as_millis();
                        last_key_time = now;

                        if diff < THRESHOLD_MS {
                            rapid_strikes += 1;
                        } else {
                            rapid_strikes = 0; // Reset on human-speed
                        }

                        if rapid_strikes > STRIKE_LIMIT {
                            println!("CRITICAL: RUBBER DUCKY INJECTION DETECTED. LOCKING SYSTEM.");
                            rapid_strikes = 0;
                            // Trigger system lock using loginctl
                            let _ = Command::new("loginctl")
                                .arg("lock-sessions")
                                .spawn();
                        }
                    }
                }
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
}
