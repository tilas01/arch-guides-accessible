mod admin;
mod audit;
mod repair;
mod interactive;

use clap::Parser;
use colored::*;

#[derive(Parser, Debug)]
#[command(author, version, about = "Secure System Remediation Tool for UACME bypass vectors.", long_about = None)]
struct Args {
    /// Launch the interactive remediation wizard
    #[arg(short, long)]
    interactive: bool,

    /// Audit the system for UACME indicators without making changes
    #[arg(short, long)]
    audit: bool,

    /// Automatically repair all found UACME indicators (requires Admin)
    #[arg(short, long)]
    repair: bool,
}

fn main() {
    let args = Args::parse();

    if args.interactive || (!args.audit && !args.repair) {
        if !admin::is_elevated() {
            println!("{} The interactive remediation wizard requires Administrative privileges.", "[WARNING]".yellow().bold());
            println!("You are currently running as a standard user. Repairs will fail.\n");
        }
        interactive::run();
        return;
    }

    if args.audit {
        println!("{}", "Running UACME Audit...".cyan().bold());
        let findings = audit::run_audit();
        
        if findings.is_empty() {
            println!("{} No indicators found.", "[OK]".green());
        } else {
            println!("{} Found {} indicators:", "[WARNING]".yellow().bold(), findings.len());
            for f in findings.iter() {
                println!(" - {} ({})", f.target_name.red(), f.registry_path);
            }
        }
    }

    if args.repair {
        if !admin::is_elevated() {
            println!("{} Automated repair requires Administrative privileges. Please run as Administrator.", "[FATAL]".red().bold());
            std::process::exit(1);
        }

        println!("{}", "Running UACME Automated Repair...".cyan().bold());
        let findings = audit::run_audit();
        
        if findings.is_empty() {
            println!("{} No indicators found to repair.", "[OK]".green());
            return;
        }

        let mut success_count = 0;
        for finding in findings.iter() {
            if repair::run_repair(&finding.registry_path, &finding.key_name) {
                success_count += 1;
            }
        }
        println!("\nRepair complete. {}/{} fixed.", success_count, findings.len());
    }
}
