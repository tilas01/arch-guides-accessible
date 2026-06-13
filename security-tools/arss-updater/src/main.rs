#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows in release

use clap::Parser;
use eframe::egui;
use reqwest::blocking::Client;
use serde::Deserialize;
use std::process::Command;
use std::fs;
use std::path::Path;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Run interactively with GUI (Wayland/Xorg)
    #[arg(short, long)]
    interactive: bool,

    /// Check for updates
    #[arg(short, long)]
    check: bool,

    /// Install full suite
    #[arg(long)]
    install_suite: bool,
}

#[derive(Deserialize, Debug)]
struct GithubRelease {
    tag_name: String,
    body: String,
}

fn check_latest_release() -> Result<GithubRelease, Box<dyn std::error::Error>> {
    let client = Client::builder().user_agent("arss-updater").build()?;
    let res = client
        .get("https://api.github.com/repos/tilas01/arch-guides-dynamic/releases/latest")
        .send()?
        .json::<GithubRelease>()?;
    Ok(res)
}

fn get_installed_tools() -> Vec<String> {
    let tools = ["scarecrow", "anti-ducky", "kernel-watcher", "anti-evil-maid", "libre-otp"];
    let mut installed = Vec::new();
    for tool in tools {
        if Path::new(&format!("/usr/local/bin/{}", tool)).exists() {
            installed.push(tool.to_string());
        }
    }
    installed
}

fn uninstall_individual_tools() {
    let tools = get_installed_tools();
    for tool in tools {
        println!("Uninstalling {}...", tool);
        // This is a stub for where the actual systemctl disable/rm logic would go
        let _ = fs::remove_file(format!("/usr/local/bin/{}", tool));
    }
}

fn install_full_suite() {
    println!("Installing Full Arch Rusty Security Suite...");
    // Stub for fetching and installing the suite
}

fn run_cli_mode(args: Args) {
    if args.check {
        match check_latest_release() {
            Ok(release) => println!("Latest Release: {}\n{}", release.tag_name, release.body),
            Err(e) => eprintln!("Failed to check updates: {}", e),
        }
    }

    if args.install_suite {
        let installed = get_installed_tools();
        if !installed.is_empty() {
            println!("Error: Cannot install full suite while individual tools are installed: {:?}", installed);
            println!("Run with --interactive to resolve conflicts, or uninstall manually.");
        } else {
            install_full_suite();
        }
    }
}

struct UpdaterApp {
    installed_tools: Vec<String>,
    latest_release: Option<String>,
    status_msg: String,
}

impl Default for UpdaterApp {
    fn default() -> Self {
        Self {
            installed_tools: get_installed_tools(),
            latest_release: None,
            status_msg: "Ready.".to_string(),
        }
    }
}

impl eframe::App for UpdaterApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading("Arch Rusty Security Suite Updater");
            ui.separator();

            if ui.button("Check for Updates").clicked() {
                match check_latest_release() {
                    Ok(r) => {
                        self.latest_release = Some(r.tag_name);
                        self.status_msg = "Updates checked successfully.".to_string();
                    }
                    Err(_) => {
                        self.status_msg = "Failed to fetch updates.".to_string();
                    }
                }
            }

            if let Some(ref tag) = self.latest_release {
                ui.label(format!("Latest GitHub Release: {}", tag));
            }

            ui.separator();
            ui.heading("Installed Tools");
            if self.installed_tools.is_empty() {
                ui.label("None");
            } else {
                for tool in &self.installed_tools {
                    ui.label(format!("- {}", tool));
                }
            }

            ui.separator();
            if !self.installed_tools.is_empty() {
                ui.label(egui::RichText::new("WARNING: Individual tools installed. Cannot install Full Suite.").color(egui::Color32::RED));
                if ui.button("Uninstall Individual Tools & Install Suite").clicked() {
                    uninstall_individual_tools();
                    install_full_suite();
                    self.installed_tools = get_installed_tools();
                    self.status_msg = "Suite Installed!".to_string();
                }
            } else {
                if ui.button("Install Full Suite").clicked() {
                    install_full_suite();
                    self.status_msg = "Suite Installed!".to_string();
                }
            }

            ui.separator();
            ui.label(format!("Status: {}", self.status_msg));
        });
    }
}

fn main() -> eframe::Result<()> {
    let args = Args::parse();

    if args.interactive || std::env::var("DISPLAY").is_ok() || std::env::var("WAYLAND_DISPLAY").is_ok() {
        let options = eframe::NativeOptions {
            viewport: egui::ViewportBuilder::default().with_inner_size([500.0, 400.0]),
            ..Default::default()
        };
        eframe::run_native(
            "ARSS Updater",
            options,
            Box::new(|_cc| Ok(Box::new(UpdaterApp::default()))),
        )
    } else {
        run_cli_mode(args);
        Ok(())
    }
}
