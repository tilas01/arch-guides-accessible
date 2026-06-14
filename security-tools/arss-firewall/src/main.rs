use eframe::egui;
use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;
#[cfg(target_os = "linux")]
use aya::Bpf;

struct FirewallApp {
    blocked_ips: Arc<Mutex<Vec<String>>>,
    allowed_ips: Arc<Mutex<Vec<String>>>,
    pending_prompts: Arc<Mutex<Vec<String>>>,
}

impl Default for FirewallApp {
    fn default() -> Self {
        Self {
            blocked_ips: Arc::new(Mutex::new(Vec::new())),
            allowed_ips: Arc::new(Mutex::new(vec!["127.0.0.1".into(), "1.1.1.1".into()])),
            pending_prompts: Arc::new(Mutex::new(vec!["104.21.43.12 (HTTP)".into()])),
        }
    }
}

impl eframe::App for FirewallApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("🦀 ARSS Little Snitch Firewall");
            ui.separator();

            ui.label("Manage kernel-level eBPF packet filters.");
            ui.add_space(10.0);

            ui.heading("Pending Connections");
            let mut pending = self.pending_prompts.lock().unwrap();
            if pending.is_empty() {
                ui.label("No pending connections.");
            } else {
                let mut to_remove = None;
                for (i, conn) in pending.iter().enumerate() {
                    ui.horizontal(|ui| {
                        ui.label(format!("Incoming/Outgoing connection: {}", conn));
                        if ui.button("Allow").clicked() {
                            self.allowed_ips.lock().unwrap().push(conn.clone());
                            to_remove = Some(i);
                        }
                        if ui.button("Block").clicked() {
                            self.blocked_ips.lock().unwrap().push(conn.clone());
                            to_remove = Some(i);
                        }
                    });
                }
                if let Some(i) = to_remove {
                    pending.remove(i);
                }
            }

            ui.add_space(20.0);
            ui.heading("Allowed Rules");
            for ip in self.allowed_ips.lock().unwrap().iter() {
                ui.label(format!("✔️ {}", ip));
            }

            ui.add_space(10.0);
            ui.heading("Blocked Rules");
            for ip in self.blocked_ips.lock().unwrap().iter() {
                ui.label(format!("❌ {}", ip));
            }
        });
    }
}

fn main() -> Result<(), eframe::Error> {
    env_logger::init();
    
    // Initialize async runtime
    let rt = Runtime::new().expect("Failed to build tokio runtime");
    
    rt.block_on(async {
        println!("Loading eBPF firewall programs...");
        // Here we would load the eBPF bytecode:
        // let mut bpf = Bpf::load(include_bytes_aligned!("../../kernel-ebpf/arss-firewall-ebpf")).unwrap();
        // and attach XDP/TC programs
    });

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([600.0, 400.0]),
        ..Default::default()
    };

    eframe::run_native(
        "ARSS Firewall",
        options,
        Box::new(|_cc| Box::<FirewallApp>::default()),
    )
}
