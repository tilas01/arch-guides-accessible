//! Outbound connection monitor — a Little Snitch-style prompt for Linux.
//!
//! Watches for *new* outbound TCP connections, maps each one back to the
//! program that opened it, and — the first time a given program tries to reach
//! the network — asks whether to allow it. The decision is remembered, so the
//! prompt fires once per program, not once per connection.
//!
//! ## What it can and cannot do, stated plainly
//!
//! This observes `/proc/net/tcp{,6}` and resolves owning processes through
//! `/proc/<pid>/fd`. That means it sees a connection once the kernel has a
//! socket for it — it is a *monitor that can react*, not an in-path firewall
//! that holds the packet while you decide. On "deny" it does two things: it
//! kills the offending process, and (if `nft` is available and we are root) it
//! installs a drop rule for the destination so a respawn cannot immediately
//! reconnect. A determined program that reconnects in the millisecond before
//! the kill lands may get one packet out. For hard, before-the-fact blocking
//! you want an nftables policy or opensnitch's kernel module; this is the
//! userland approximation, and it is honest about being one.
//!
//! ## Interface
//!
//! The prompt is abstracted behind [`Prompter`] so the same engine drives a
//! plain-TTY session, an interactive terminal, or the egui GUI. The default is
//! [`TtyPrompter`], which works over SSH and on a bare console with no
//! display server at all — the "or like neither, just CLI TTY" case.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{self, Write};
use std::net::IpAddr;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

/// Where remembered allow/deny decisions live. Under the suite's config dir,
/// 0644 (the rules are not secret), root-owned.
const RULES_FILE: &str = "/etc/arch-security/kernel-watcher/connections.json";

/// A single remembered decision, keyed by the program's executable path.
///
/// Public because it is the return type of the public [`Prompter`] trait, which
/// the GUI implements from another module.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Verdict {
    Allow,
    Deny,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct RuleStore {
    /// exe path -> verdict. Keyed by the resolved binary rather than the PID,
    /// so the answer survives the process restarting.
    programs: HashMap<String, Verdict>,
}

impl RuleStore {
    fn load() -> Self {
        match fs::read_to_string(RULES_FILE) {
            Ok(s) => serde_json::from_str(&s).unwrap_or_default(),
            Err(_) => RuleStore::default(),
        }
    }

    fn save(&self) {
        if let Some(parent) = Path::new(RULES_FILE).parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(self) {
            // Best-effort: a monitor that cannot persist its rules still works,
            // it just asks again next boot.
            let _ = fs::write(RULES_FILE, json);
        }
    }
}

/// One observed outbound connection, already resolved to a program.
#[derive(Debug, Clone)]
pub struct Connection {
    pub pid: i32,
    pub exe: String,
    pub remote_ip: IpAddr,
    pub remote_port: u16,
}

/// How the monitor asks the user. Implemented for the TTY here; the GUI
/// implements the same trait so the engine does not care which is in use.
pub trait Prompter: Send {
    /// Return the user's decision for this program's first connection.
    fn ask(&mut self, conn: &Connection) -> Verdict;

    /// Report an action taken without asking (an already-remembered verdict).
    fn note(&mut self, _msg: &str) {}
}

/// Plain-terminal prompter. Works on a bare console, over SSH, inside tmux —
/// anywhere there is a controlling terminal, with or without a display server.
pub struct TtyPrompter;

impl Prompter for TtyPrompter {
    fn ask(&mut self, conn: &Connection) -> Verdict {
        // If there is no terminal to read from (running as a daemon with no
        // tty), fail SAFE by denying: an unattended machine should not be
        // silently allowing new programs onto the network.
        if !stdin_is_tty() {
            eprintln!(
                "[connection-monitor] {} -> {}:{} — no TTY to prompt on, DENYING by default.",
                conn.exe, conn.remote_ip, conn.remote_port
            );
            return Verdict::Deny;
        }

        println!("\n┌─ New outbound connection ─────────────────────────────");
        println!("│ program : {}", conn.exe);
        println!("│ pid     : {}", conn.pid);
        println!("│ dest    : {}:{}", conn.remote_ip, conn.remote_port);
        println!("└───────────────────────────────────────────────────────");
        loop {
            print!("Allow this program to reach the network? [y]es / [n]o: ");
            let _ = io::stdout().flush();
            let mut line = String::new();
            if io::stdin().read_line(&mut line).is_err() {
                return Verdict::Deny;
            }
            match line.trim().to_lowercase().as_str() {
                "y" | "yes" => return Verdict::Allow,
                "n" | "no" => return Verdict::Deny,
                _ => println!("Please answer y or n."),
            }
        }
    }

    fn note(&mut self, msg: &str) {
        println!("[connection-monitor] {msg}");
    }
}

fn stdin_is_tty() -> bool {
    // std's IsTerminal (stable since 1.70) — no unsafe, no extra dependency.
    use std::io::IsTerminal;
    io::stdin().is_terminal()
}

/// Start the monitor on a background thread with the given prompter.
///
/// Never blocks the caller. The prompter is moved onto the worker thread; the
/// TTY one serialises prompts naturally because it owns stdin.
pub fn start_connection_monitor(prompter: Box<dyn Prompter>) {
    let store = Arc::new(Mutex::new(RuleStore::load()));
    let prompter = Arc::new(Mutex::new(prompter));

    thread::spawn(move || {
        println!("Starting outbound connection monitor (userland).");
        // Connections we have already seen this run, so a long-lived connection
        // is not re-evaluated on every poll. Keyed by the full tuple.
        let mut seen: HashSet<String> = HashSet::new();

        loop {
            for conn in current_outbound_connections() {
                let key = format!(
                    "{}|{}|{}:{}",
                    conn.pid, conn.exe, conn.remote_ip, conn.remote_port
                );
                if seen.contains(&key) {
                    continue;
                }
                seen.insert(key);

                // Loopback and link-local traffic is not "reaching out"; skip it
                // so the user is not asked about local IPC.
                if is_local(&conn.remote_ip) {
                    continue;
                }

                let remembered = {
                    let s = store.lock().unwrap();
                    s.programs.get(&conn.exe).cloned()
                };

                match remembered {
                    Some(Verdict::Allow) => { /* silently permitted */ }
                    Some(Verdict::Deny) => {
                        enforce_deny(&conn, &prompter);
                    }
                    None => {
                        let verdict = {
                            let mut p = prompter.lock().unwrap();
                            p.ask(&conn)
                        };
                        // Remember it, then act.
                        {
                            let mut s = store.lock().unwrap();
                            s.programs.insert(conn.exe.clone(), verdict.clone());
                            s.save();
                        }
                        if verdict == Verdict::Deny {
                            enforce_deny(&conn, &prompter);
                        }
                    }
                }
            }

            // Bound the seen-set so a busy machine does not grow it without
            // limit across a long uptime.
            if seen.len() > 4096 {
                seen.clear();
            }
            thread::sleep(Duration::from_millis(750));
        }
    });
}

fn is_local(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => v4.is_loopback() || v4.is_link_local() || v4.is_unspecified(),
        IpAddr::V6(v6) => v6.is_loopback() || v6.is_unspecified(),
    }
}

/// Deny action: drop the destination via nftables if we can, then stop the
/// process. Order matters — install the block first so a fast respawn is caught.
fn enforce_deny(conn: &Connection, prompter: &Arc<Mutex<Box<dyn Prompter>>>) {
    let blocked = install_drop_rule(&conn.remote_ip);
    let killed = kill_process(conn.pid);

    let mut p = prompter.lock().unwrap();
    p.note(&format!(
        "DENIED {} -> {}:{} — {}{}",
        conn.exe,
        conn.remote_ip,
        conn.remote_port,
        if killed { "process stopped" } else { "process already gone" },
        if blocked {
            ", destination dropped via nftables"
        } else {
            " (no nftables rule installed — need root and nft)"
        }
    ));
}

/// Install an nftables drop rule for a destination address. Best-effort: needs
/// root and `nft`. Returns whether the rule was installed.
fn install_drop_rule(ip: &IpAddr) -> bool {
    // A dedicated table so our rules are easy to list and flush, and cannot be
    // confused with the user's own firewall policy.
    let family = match ip {
        IpAddr::V4(_) => "ip",
        IpAddr::V6(_) => "ip6",
    };
    // Ensure table + chain exist. Ignore errors from the create calls: they
    // fail harmlessly if the objects already exist.
    let _ = Command::new("nft")
        .args(["add", "table", family, "kw_block"])
        .status();
    let _ = Command::new("nft")
        .args([
            "add", "chain", family, "kw_block", "output",
            "{", "type", "filter", "hook", "output", "priority", "0", ";", "}",
        ])
        .status();

    let addr = ip.to_string();
    Command::new("nft")
        .args([
            "add", "rule", family, "kw_block", "output",
            if family == "ip" { "ip" } else { "ip6" },
            "daddr", &addr, "drop",
        ])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// SIGKILL the offending process. SIGKILL rather than SIGTERM: a program the
/// user just refused network access to does not get to run a shutdown handler
/// that might phone home first.
fn kill_process(pid: i32) -> bool {
    #[cfg(target_os = "linux")]
    {
        use nix::sys::signal::{self, Signal};
        use nix::unistd::Pid;
        signal::kill(Pid::from_raw(pid), Signal::SIGKILL).is_ok()
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = pid;
        false
    }
}

/// Snapshot every current outbound TCP connection, resolved to its program.
///
/// Parses /proc/net/tcp and tcp6, keeps rows in the ESTABLISHED or SYN_SENT
/// state (an outbound connection in progress or up), then maps the socket inode
/// to a pid+exe by scanning /proc/<pid>/fd. That scan is the expensive part, so
/// it is only done when there is at least one connection to resolve.
fn current_outbound_connections() -> Vec<Connection> {
    let mut rows = Vec::new();
    rows.extend(parse_proc_net("/proc/net/tcp", false));
    rows.extend(parse_proc_net("/proc/net/tcp6", true));
    if rows.is_empty() {
        return Vec::new();
    }

    let inode_to_proc = build_inode_map();
    rows.into_iter()
        .filter_map(|row| {
            inode_to_proc.get(&row.inode).map(|(pid, exe)| Connection {
                pid: *pid,
                exe: exe.clone(),
                remote_ip: row.remote_ip,
                remote_port: row.remote_port,
            })
        })
        .collect()
}

struct NetRow {
    remote_ip: IpAddr,
    remote_port: u16,
    inode: u64,
}

/// TCP states we care about, from include/net/tcp_states.h.
const TCP_ESTABLISHED: &str = "01";
const TCP_SYN_SENT: &str = "02";

fn parse_proc_net(path: &str, v6: bool) -> Vec<NetRow> {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };
    let mut out = Vec::new();
    for line in content.lines().skip(1) {
        let f: Vec<&str> = line.split_whitespace().collect();
        // Layout: sl local_address rem_address st ... inode
        if f.len() < 10 {
            continue;
        }
        let state = f[3];
        if state != TCP_ESTABLISHED && state != TCP_SYN_SENT {
            continue;
        }
        let (ip, port) = match parse_addr(f[2], v6) {
            Some(v) => v,
            None => continue,
        };
        let inode: u64 = match f[9].parse() {
            Ok(i) => i,
            Err(_) => continue,
        };
        out.push(NetRow {
            remote_ip: ip,
            remote_port: port,
            inode,
        });
    }
    out
}

/// Parse a /proc/net-style `HEXADDR:HEXPORT` field. The address bytes are in
/// host byte order per 32-bit word, which is why v4 reverses the four octets.
fn parse_addr(s: &str, v6: bool) -> Option<(IpAddr, u16)> {
    let (addr_hex, port_hex) = s.split_once(':')?;
    let port = u16::from_str_radix(port_hex, 16).ok()?;

    if !v6 {
        let raw = u32::from_str_radix(addr_hex, 16).ok()?;
        // Stored little-endian: the low byte is the first octet.
        let octets = raw.to_le_bytes();
        Some((IpAddr::from(octets), port))
    } else {
        if addr_hex.len() != 32 {
            return None;
        }
        let mut bytes = [0u8; 16];
        // Four 32-bit words, each little-endian within itself.
        for word in 0..4 {
            let word_hex = &addr_hex[word * 8..word * 8 + 8];
            let w = u32::from_str_radix(word_hex, 16).ok()?;
            let le = w.to_le_bytes();
            bytes[word * 4..word * 4 + 4].copy_from_slice(&le);
        }
        Some((IpAddr::from(bytes), port))
    }
}

/// Map socket inode -> (pid, exe) by walking /proc/<pid>/fd. A socket fd is a
/// symlink reading `socket:[<inode>]`.
fn build_inode_map() -> HashMap<u64, (i32, String)> {
    let mut map = HashMap::new();
    let proc = match fs::read_dir("/proc") {
        Ok(d) => d,
        Err(_) => return map,
    };
    for entry in proc.flatten() {
        let pid: i32 = match entry.file_name().to_string_lossy().parse() {
            Ok(p) => p,
            Err(_) => continue, // not a pid directory
        };
        let fd_dir = format!("/proc/{pid}/fd");
        let fds = match fs::read_dir(&fd_dir) {
            Ok(d) => d,
            Err(_) => continue, // process gone, or not ours to read
        };
        let mut exe: Option<String> = None;
        for fd in fds.flatten() {
            if let Ok(target) = fs::read_link(fd.path()) {
                let t = target.to_string_lossy();
                if let Some(rest) = t.strip_prefix("socket:[") {
                    if let Some(num) = rest.strip_suffix(']') {
                        if let Ok(inode) = num.parse::<u64>() {
                            let e = exe.get_or_insert_with(|| resolve_exe(pid));
                            map.insert(inode, (pid, e.clone()));
                        }
                    }
                }
            }
        }
    }
    map
}

/// The program behind a pid, as its resolved executable path. Falls back to the
/// comm name if the exe link cannot be read (kernel threads, races).
fn resolve_exe(pid: i32) -> String {
    if let Ok(path) = fs::read_link(format!("/proc/{pid}/exe")) {
        return path.to_string_lossy().into_owned();
    }
    fs::read_to_string(format!("/proc/{pid}/comm"))
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| format!("pid:{pid}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_ipv4_little_endian() {
        // 0100007F:0035 is 127.0.0.1:53 in /proc/net/tcp encoding.
        let (ip, port) = parse_addr("0100007F:0035", false).unwrap();
        assert_eq!(ip.to_string(), "127.0.0.1");
        assert_eq!(port, 53);
    }

    #[test]
    fn parses_ipv4_public() {
        // 08080808 -> 8.8.8.8, port 01BB -> 443.
        let (ip, port) = parse_addr("08080808:01BB", false).unwrap();
        assert_eq!(ip.to_string(), "8.8.8.8");
        assert_eq!(port, 443);
    }

    #[test]
    fn loopback_is_local() {
        assert!(is_local(&"127.0.0.1".parse().unwrap()));
        assert!(is_local(&"::1".parse().unwrap()));
        assert!(!is_local(&"8.8.8.8".parse().unwrap()));
    }

    #[test]
    fn rejects_malformed_addr() {
        assert!(parse_addr("nothex:0035", false).is_none());
        assert!(parse_addr("0100007F", false).is_none());
    }
}
