use std::io::{self, Write};
use colored::*;
use crate::audit;
use crate::repair;

/// Prompts the user for a yes/no response.
fn prompt_yes_no(question: &str) -> bool {
    loop {
        print!("{} [y/N]: ", question.cyan().bold());
        io::stdout().flush().unwrap();
        
        let mut input = String::new();
        if io::stdin().read_line(&mut input).is_ok() {
            let input = input.trim().to_lowercase();
            if input == "y" || input == "yes" {
                return true;
            } else if input == "n" || input == "no" || input.is_empty() {
                return false;
            }
        }
        println!("Please enter 'y' or 'n'.");
    }
}

/// Runs the interactive CLI wizard.
pub fn run() {
    println!("{}", "=======================================================".blue());
    println!("{}", "   UACME SECURE REMEDIATION TOOL (INTERACTIVE MODE)    ".blue().bold());
    println!("{}", "=======================================================\n".blue());
    
    println!("Scanning system for UAC bypass indicators...\n");
    let findings = audit::run_audit();
    
    if findings.is_empty() {
        println!("{} No UACME bypass indicators found. Your system appears clean.", "[OK]".green());
        return;
    }
    
    println!("{} Found {} potential UACME bypass indicators!\n", "[WARNING]".yellow().bold(), findings.len());
    
    for (i, finding) in findings.iter().enumerate() {
        println!("{}. Vector: {}", i + 1, finding.target_name.red());
        println!("   Registry Path: {}", finding.registry_path);
        println!("   Value Name:    {}", if finding.key_name.is_empty() { "(Default)" } else { &finding.key_name });
        println!("   Payload:       {}", finding.malicious_payload.yellow());
        println!();
    }
    
    if prompt_yes_no("Do you want to remediate (delete) these malicious registry entries?") {
        println!("\nStarting remediation...\n");
        let mut success_count = 0;
        
        for finding in findings.iter() {
            if repair::run_repair(&finding.registry_path, &finding.key_name) {
                success_count += 1;
            }
        }
        
        println!("\nRemediation complete. Successfully removed {}/{} threats.", success_count, findings.len());
    } else {
        println!("\nRemediation aborted by user.");
    }
}
