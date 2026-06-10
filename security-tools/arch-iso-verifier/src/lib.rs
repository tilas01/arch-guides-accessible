use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{self, BufRead, BufReader, Read};
use std::path::Path;

/// Arch ISO Verifier — validates an Arch Linux ISO against the official SHA256 checksums.
///
/// Usage (via unified binary):
///   arch-rusty-security-suite verify-iso <ISO_PATH> [SHA256SUMS_PATH]
///
/// If SHA256SUMS_PATH is not provided, the user is prompted to enter the expected hash.
pub fn run() {
    let args: Vec<String> = std::env::args().collect();

    // Find our subcommand args — skip until we find "verify-iso", then take the rest
    let sub_args: Vec<&String> = {
        let mut found = false;
        let mut result = vec![];
        for arg in &args {
            if found {
                result.push(arg);
            }
            if arg == "verify-iso" {
                found = true;
            }
        }
        if !found {
            // Direct invocation fallback — use all args after program name
            args.iter().skip(1).collect()
        } else {
            result
        }
    };

    if sub_args.is_empty() {
        println!("Arch ISO Verifier — Part of Arch Rusty Security Suite by tilas01");
        println!();
        println!("Usage:");
        println!("  arch-rusty-security-suite verify-iso <ISO_FILE> [SHA256SUMS_FILE]");
        println!();
        println!("Examples:");
        println!("  arch-rusty-security-suite verify-iso archlinux-2026.06.01-x86_64.iso sha256sums.txt");
        println!("  arch-rusty-security-suite verify-iso archlinux-2026.06.01-x86_64.iso");
        println!();
        println!("If no SHA256SUMS file is given, you will be prompted to paste the expected hash.");
        return;
    }

    let iso_path = &sub_args[0];
    let sums_path = sub_args.get(1).map(|s| s.as_str());

    // Compute SHA-256 of the ISO file
    println!("Computing SHA-256 of {}...", iso_path);
    let computed = match sha256_file(iso_path) {
        Ok(h) => h,
        Err(e) => {
            eprintln!("Error reading ISO file: {}", e);
            std::process::exit(1);
        }
    };
    println!("SHA-256: {}", computed);

    // Get expected hash
    let expected = if let Some(sums_file) = sums_path {
        match find_hash_in_sums(sums_file, iso_path) {
            Ok(Some(h)) => h,
            Ok(None) => {
                eprintln!("ISO filename not found in SHA256SUMS file.");
                std::process::exit(1);
            }
            Err(e) => {
                eprintln!("Error reading SHA256SUMS file: {}", e);
                std::process::exit(1);
            }
        }
    } else {
        // Prompt for manual hash entry
        println!();
        print!("Paste the expected SHA-256 hash: ");
        io::Write::flush(&mut io::stdout()).unwrap();
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        input.trim().to_lowercase()
    };

    // Compare
    println!();
    if computed == expected {
        println!("✓ MATCH — ISO integrity verified successfully.");
        println!("  The file has not been tampered with.");
    } else {
        println!("✗ MISMATCH — ISO integrity check FAILED!");
        println!("  Expected: {}", expected);
        println!("  Got:      {}", computed);
        println!();
        println!("  WARNING: This ISO may have been tampered with. Do NOT use it.");
        std::process::exit(1);
    }
}

/// Compute the SHA-256 hash of a file, reading in 8 KiB chunks.
fn sha256_file(path: &str) -> io::Result<String> {
    let file = File::open(path)?;
    let mut reader = BufReader::with_capacity(8192, file);
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];

    loop {
        let n = reader.read(&mut buf)?;
        if n == 0 { break; }
        hasher.update(&buf[..n]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

/// Search a SHA256SUMS file for a matching filename and return its hash.
/// Lines are expected in the format: <hash>  <filename>
fn find_hash_in_sums(sums_path: &str, iso_path: &str) -> io::Result<Option<String>> {
    let iso_name = Path::new(iso_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let file = File::open(sums_path)?;
    let reader = BufReader::new(file);

    for line in reader.lines() {
        let line = line?;
        let parts: Vec<&str> = line.splitn(2, |c: char| c.is_whitespace()).collect();
        if parts.len() == 2 {
            let hash = parts[0].trim().to_lowercase();
            let name = parts[1].trim().trim_start_matches('*');
            if name == iso_name || name.ends_with(&iso_name) {
                return Ok(Some(hash));
            }
        }
    }

    Ok(None)
}
