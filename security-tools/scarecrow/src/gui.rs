use eframe::egui;

pub struct Scarecrow {
    log_messages: Vec<String>,
}

impl Default for Scarecrow {
    fn default() -> Self {
        Self {
            log_messages: vec![
                format!("[{}] Connecting to root daemon via IPC...", "scarecrow"),
                format!("[{}] Connected.", "scarecrow"),
            ],
        }
    }
}

impl eframe::App for Scarecrow {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let mut style = (*ctx.style()).clone();
        style.visuals.window_fill = egui::Color32::from_rgb(26, 27, 38);
        style.visuals.panel_fill = egui::Color32::from_rgb(26, 27, 38);
        ctx.set_style(style);

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.heading(
                egui::RichText::new("scarecrow Dashboard")
                    .color(egui::Color32::from_rgb(187, 154, 247))
                    .size(24.0)
            );
            ui.add_space(10.0);

            ui.label(egui::RichText::new("Daemon Logs:").color(egui::Color32::from_rgb(122, 162, 247)));

            egui::ScrollArea::vertical().show(ui, |ui| {
                for msg in &self.log_messages {
                    ui.label(egui::RichText::new(msg).color(egui::Color32::from_rgb(192, 202, 245)).monospace());
                }
            });
        });
    }
}

pub fn start_gui() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([600.0, 400.0])
            .with_title("scarecrow Dashboard"),
        ..Default::default()
    };

    eframe::run_native(
        "scarecrow",
        options,
        Box::new(|_cc| Box::<Scarecrow>::default()),
    )
}
