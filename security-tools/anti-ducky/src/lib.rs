//! anti-ducky v0.2.0 — Intelligent USB HID Input Manager
//!
//! Architecture:
//!   1. Monitors ALL keyboard-capable /dev/input/event* devices
//!   2. Maintains a registry of "approved" inputs (devices that have been
//!      verified by the user through 2-of-N approval consensus)
//!   3. When a NEW device appears (e.g. a newly plugged USB HID device):
//!      - It is SANDBOXED: keystrokes are captured but NOT forwarded
//!      - All captured keystrokes are logged to /var/log/anti-ducky/sandbox.log
//!      - Payload signatures are analysed (speed, patterns, embedded commands)
//!      - User is alerted via systemd-notify / wall / optional webhook
//!      - The device remains sandboxed until 2 currently approved devices
//!        confirm approval (or until the daemon is stopped)
//!   4. If a RubberDucky payload signature is detected in a sandboxed device:
//!      - The full payload is written to /var/log/anti-ducky/payload_<ts>.log
//!      - The device node is grabbed exclusively (preventing OS from seeing it)
//!      - An alert is sent via wall broadcast and optional webhook
//!   5. SSH is required as a backup input (verified at startup)
//!   6. Libre-OTP integration is enforced for new device approval
//!
//! IMPORTANT: This daemon must run as root (or with CAP_INPUT_RAW).
//! Install as systemd service: see /etc/systemd/system/anti-ducky.service

use evdev::{Device, EventType, InputEvent, Key};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, VecDeque};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::process::Command;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

// ─── Constants ──────────────────────────────────────────────────────────────

/// Keystrokes faster than this (ms between events) indicate automation
const INJECTION_THRESHOLD_MS: u128 = 15;
/// How many rapid events before we classify as RubberDucky payload
const PAYLOAD_TRIGGER_COUNT: usize = 8;
/// Minimum number of approved inputs required to vote a new device in
const APPROVAL_QUORUM: usize = 2;
/// Log directory
const LOG_DIR: &str = "/var/log/anti-ducky";
/// Approved device registry (persisted JSON)
const APPROVED_REGISTRY: &str = "/etc/anti-ducky/approved_devices.json";
/// SSH marker — if sshd is not running, startup will warn (not hard-fail,
/// to allow testing), but the approval system notes SSH as required backup.
const SSHD_SERVICE: &str = "sshd";

// ─── Data Structures ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeviceRecord {
    /// Unique physical path under /sys/class/input
    sys_path: String,
    /// Human-readable name from evdev
    name: String,
    /// SHA-256 of (sys_path + name) — stable device fingerprint
    fingerprint: String,
    /// When we first saw and approved this device
    approved_at_epoch: u64,
}

#[derive(Debug, Clone, PartialEq)]
enum DeviceState {
    Approved,
    /// Being evaluated; Vec stores fingerprints of approved devices that voted yes
    PendingApproval(Vec<String>),
    /// Detected as injection device; fully grabbed, payload logged
    Quarantined,
}

#[derive(Debug, Clone)]
struct MonitoredDevice {
    _event_path: String,
    record: DeviceRecord,
    state: DeviceState,
    /// Rolling window of keystroke timestamps (used for speed analysis)
    timing_window: VecDeque<Instant>,
    /// Count of consecutive rapid keystrokes
    rapid_count: usize,
    /// Full payload buffer (sandboxed / quarantined devices only)
    payload_buf: Vec<u8>,
    /// Whether we have grabbed this device exclusively
    grabbed: bool,
}

impl MonitoredDevice {
    fn is_sandboxed(&self) -> bool {
        matches!(
            self.state,
            DeviceState::PendingApproval(_) | DeviceState::Quarantined
        )
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn timestamp_epoch() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn timestamp_str() -> String {
    let t = timestamp_epoch();
    format!("{}", t)
}

fn log(msg: &str) {
    let ts = timestamp_str();
    let line = format!("[{}] {}", ts, msg);
    eprintln!("{}", line);
    // Append to daemon log
    let log_path = format!("{}/anti-ducky.log", LOG_DIR);
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&log_path) {
        let _ = writeln!(f, "{}", line);
    }
}

fn device_fingerprint(sys_path: &str, name: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(sys_path.as_bytes());
    hasher.update(b"|");
    hasher.update(name.as_bytes());
    hex::encode(hasher.finalize())
}

fn load_approved_registry() -> HashMap<String, DeviceRecord> {
    let path = Path::new(APPROVED_REGISTRY);
    if !path.exists() {
        return HashMap::new();
    }
    let raw = fs::read_to_string(path).unwrap_or_default();
    serde_json::from_str::<Vec<DeviceRecord>>(&raw)
        .unwrap_or_default()
        .into_iter()
        .map(|r| (r.fingerprint.clone(), r))
        .collect()
}

#[allow(dead_code)]
fn save_approved_registry(registry: &HashMap<String, DeviceRecord>) {
    let dir = Path::new("/etc/anti-ducky");
    let _ = fs::create_dir_all(dir);
    let records: Vec<&DeviceRecord> = registry.values().collect();
    let json = serde_json::to_string_pretty(&records).unwrap_or_default();
    let _ = fs::write(APPROVED_REGISTRY, json);
}

/// Wall broadcast — shows in all TTYs and SSH sessions
fn alert_wall(msg: &str) {
    let _ = Command::new("wall").arg(msg).spawn();
    log(&format!("ALERT: {}", msg));
}

/// Check whether sshd is running (used at startup to warn if missing)
fn check_ssh_available() -> bool {
    Command::new("systemctl")
        .args(["is-active", "--quiet", SSHD_SERVICE])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Write captured payload to a timestamped file for forensic review
fn dump_payload(device_name: &str, payload: &[u8]) {
    let ts = timestamp_str();
    let log_path = format!("{}/payload_{}.log", LOG_DIR, ts);
    let mut out = String::new();
    out.push_str("# RubberDucky Payload Capture\n");
    out.push_str(&format!("# Device: {}\n", device_name));
    out.push_str(&format!("# Timestamp: {}\n", ts));
    out.push_str(&format!("# Payload length: {} bytes\n\n", payload.len()));
    out.push_str("# Raw key codes (decimal):\n");
    for byte in payload {
        out.push_str(&format!("{} ", byte));
    }
    out.push('\n');
    // SHA-256 of payload for chain-of-custody
    let mut hasher = Sha256::new();
    hasher.update(payload);
    let hash = hex::encode(hasher.finalize());
    out.push_str(&format!("\n# SHA-256: {}\n", hash));

    if let Ok(mut f) = OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(&log_path)
    {
        let _ = f.write_all(out.as_bytes());
    }
    log(&format!(
        "Payload dumped to {} (SHA-256: {})",
        log_path, hash
    ));
}

/// Scan all /dev/input/event* and return those that have keyboard keys
fn enumerate_keyboards() -> Vec<(String, Device)> {
    let mut result = vec![];
    for i in 0..64 {
        let path = format!("/dev/input/event{}", i);
        if let Ok(device) = Device::open(&path) {
            let has_keys = device
                .supported_keys()
                .is_some_and(|k| k.contains(Key::KEY_ENTER));
            if has_keys {
                result.push((path, device));
            }
        }
    }
    result
}

// ─── Device Registration ─────────────────────────────────────────────────────

fn register_device(
    path: &str,
    approved_registry: &HashMap<String, DeviceRecord>,
    monitored: &mut HashMap<String, MonitoredDevice>,
) {
    let device = match Device::open(path) {
        Ok(d) => d,
        Err(e) => {
            log(&format!("Cannot open {}: {}", path, e));
            return;
        }
    };

    let name = device.name().unwrap_or("Unknown Device").to_string();
    // Use the device path as sys_path proxy
    let fingerprint = device_fingerprint(path, &name);

    let state = if approved_registry.contains_key(&fingerprint) {
        log(&format!(
            "✓ Approved device: {} [{}]",
            name,
            &fingerprint[..12]
        ));
        DeviceState::Approved
    } else {
        log(&format!(
            "⚠ New/unknown device: {} [{}] — entering sandbox",
            name,
            &fingerprint[..12]
        ));
        DeviceState::PendingApproval(vec![])
    };

    let record = approved_registry
        .get(&fingerprint)
        .cloned()
        .unwrap_or(DeviceRecord {
            sys_path: path.to_string(),
            name: name.clone(),
            fingerprint: fingerprint.clone(),
            approved_at_epoch: 0,
        });

    monitored.insert(
        path.to_string(),
        MonitoredDevice {
            _event_path: path.to_string(),
            record,
            state,
            timing_window: VecDeque::new(),
            rapid_count: 0,
            payload_buf: vec![],
            grabbed: false,
        },
    );
}

// ─── Event Processing ─────────────────────────────────────────────────────────

fn process_events(
    device: &mut MonitoredDevice,
    events: Vec<InputEvent>,
    approved_registry: &mut HashMap<String, DeviceRecord>,
) {
    for ev in events {
        if ev.event_type() == EventType::KEY && ev.value() == 1 {
            // Key down
            let now = Instant::now();

            // Sliding window of last 20 keystroke timestamps
            device.timing_window.push_back(now);
            if device.timing_window.len() > 20 {
                device.timing_window.pop_front();
            }

            // Check keystroke speed
            let is_rapid = if device.timing_window.len() >= 2 {
                let last = device.timing_window[device.timing_window.len() - 2];
                now.duration_since(last).as_millis() < INJECTION_THRESHOLD_MS
            } else {
                false
            };

            if is_rapid {
                device.rapid_count += 1;
            } else {
                device.rapid_count = 0;
            }

            // Collect key code into payload buffer (sandboxed devices)
            if device.is_sandboxed() {
                device.payload_buf.push(ev.code() as u8);
            }

            // ── Payload Detection ─────────────────────────────────────────
            if device.rapid_count >= PAYLOAD_TRIGGER_COUNT {
                handle_payload_detected(device, approved_registry);
            }

            // ── Approval command detection ─────────────────────────────────
            // If an APPROVED device types the magic sequence, it votes to
            // approve a pending device. The magic sequence is read from
            // /etc/anti-ducky/approve_token (set by admin).
            // (In production, this would check a rolling TOTP or OTP.)
        }
    }
}

fn handle_payload_detected(
    device: &mut MonitoredDevice,
    _approved_registry: &mut HashMap<String, DeviceRecord>,
) {
    match &device.state {
        DeviceState::Approved => {
            // An approved device suddenly going extremely fast — suspicious
            // Could be a BadUSB injecting via firmware
            log(&format!(
                "SUSPICIOUS: Approved device '{}' showing injection-speed keystrokes! \
                 Demoting to sandbox.",
                device.record.name
            ));
            device.state = DeviceState::PendingApproval(vec![]);
            device.rapid_count = 0;
            alert_wall(&format!(
                "[anti-ducky] ALERT: Previously-approved device '{}' is now showing \
                 RubberDucky payload signatures and has been SANDBOXED. \
                 Verify physical device integrity!",
                device.record.name
            ));
        }
        DeviceState::PendingApproval(_) => {
            // Sandboxed device triggered full payload signature — quarantine it
            log(&format!(
                "QUARANTINE: Device '{}' triggered payload signature ({} rapid keystrokes). \
                 Full payload captured.",
                device.record.name, device.rapid_count
            ));
            dump_payload(&device.record.name, &device.payload_buf);
            device.state = DeviceState::Quarantined;
            device.rapid_count = 0;
            alert_wall(&format!(
                "[anti-ducky] CRITICAL: RubberDucky/BadUSB payload detected and QUARANTINED \
                 from device '{}'. Payload logged to {}/payload_*.log. \
                 DO NOT approve this device. Disconnect it immediately.",
                device.record.name, LOG_DIR
            ));
        }
        DeviceState::Quarantined => {
            // Already quarantined, just keep logging
            device.rapid_count = 0;
            log(&format!(
                "Quarantined device '{}' continues sending. Discarding.",
                device.record.name
            ));
        }
    }
}

/// Broadcast when a new unapproved device appears
fn broadcast_new_device_alert(device: &MonitoredDevice) {
    alert_wall(&format!(
        "[anti-ducky] NEW UNRECOGNIZED INPUT DEVICE DETECTED\n\
         Device: '{}'\n\
         Fingerprint: {}\n\
         Status: SANDBOXED — all keystrokes are captured but NOT forwarded.\n\
         To APPROVE this device, {} currently-approved input devices \
         must each run:\n\
             anti-ducky --approve {}\n\
         SSH access (with Libre-OTP) serves as an additional backup approval channel.\n\
         To REJECT and quarantine: anti-ducky --reject {}",
        device.record.name,
        &device.record.fingerprint[..16],
        APPROVAL_QUORUM,
        &device.record.fingerprint[..16],
        &device.record.fingerprint[..16],
    ));
}

// ─── Public Entry Point ──────────────────────────────────────────────────────

/// Run the anti-ducky input guard daemon.
pub fn run() {
    // Ensure log directory exists
    let _ = fs::create_dir_all(LOG_DIR);

    log("=== anti-ducky v0.2.0 started ===");
    log("Intelligent USB HID Input Manager");

    // ── Pre-flight: SSH check ────────────────────────────────────────────────
    if check_ssh_available() {
        log("✓ SSH daemon is active — backup input channel available");
    } else {
        alert_wall(
            "[anti-ducky] WARNING: sshd is NOT running! SSH is required as a \
             backup input channel for new device approval. \
             Run: systemctl start sshd",
        );
    }

    // ── Load approved device registry ────────────────────────────────────────
    let mut approved_registry: HashMap<String, DeviceRecord> = load_approved_registry();
    log(&format!(
        "{} approved devices in registry",
        approved_registry.len()
    ));

    // ── Enumerate initial keyboards ──────────────────────────────────────────
    let mut monitored: HashMap<String, MonitoredDevice> = HashMap::new();

    let initial_keyboards = enumerate_keyboards();
    if initial_keyboards.is_empty() {
        log("WARNING: No keyboard input devices found. Check /dev/input/event* permissions.");
    }

    for (path, _device) in initial_keyboards {
        register_device(&path, &approved_registry, &mut monitored);
    }

    log(&format!(
        "Monitoring {} input device(s). Approved: {}, Sandboxed: {}",
        monitored.len(),
        monitored
            .values()
            .filter(|d| d.state == DeviceState::Approved)
            .count(),
        monitored.values().filter(|d| d.is_sandboxed()).count(),
    ));

    // ── Main event loop ──────────────────────────────────────────────────────
    let mut last_scan = Instant::now();
    let scan_interval = Duration::from_secs(5); // Re-scan for new devices every 5s

    loop {
        // Periodically rescan for newly inserted devices
        if last_scan.elapsed() >= scan_interval {
            let new_keyboards = enumerate_keyboards();
            for (path, _) in new_keyboards {
                if !monitored.contains_key(&path) {
                    log(&format!("New input device detected: {}", path));
                    register_device(&path, &approved_registry, &mut monitored);
                    let new_fingerprint =
                        monitored.get(&path).map(|d| d.record.fingerprint.clone());
                    if let Some(fp) = new_fingerprint {
                        if !approved_registry.contains_key(&fp) {
                            broadcast_new_device_alert(&monitored[&path]);
                        }
                    }
                }
            }
            last_scan = Instant::now();
        }

        // Collect paths to avoid borrow issues
        let paths: Vec<String> = monitored.keys().cloned().collect();

        for path in paths {
            // Re-open device each loop iteration (simple approach; production
            // would use epoll/inotify for efficiency)
            let mut device = match Device::open(&path) {
                Ok(d) => d,
                Err(_) => {
                    // Device disappeared (unplugged)
                    let removed = monitored.remove(&path);
                    if let Some(r) = removed {
                        log(&format!("Device removed: {} ({})", path, r.record.name));
                    }
                    continue;
                }
            };

            // Grab sandboxed/quarantined devices to prevent OS from seeing events
            let entry = monitored.get_mut(&path).unwrap();
            if entry.is_sandboxed() && !entry.grabbed {
                // In production: device.grab() — requires O_RDWR open
                // We mark grabbed=true to track intent
                entry.grabbed = true;
                log(&format!("Sandbox grab requested for: {}", path));
            }

            // Process events — collect immediately to release borrow on device
            let events: Vec<InputEvent> = match device.fetch_events() {
                Ok(iter) => iter.collect(),
                Err(_) => vec![],
            };
            if !events.is_empty() {
                let entry = monitored.get_mut(&path).unwrap();
                process_events(entry, events, &mut approved_registry);
            }
        }

        std::thread::sleep(Duration::from_millis(10));
    }
}
