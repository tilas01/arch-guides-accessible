use clap::Parser;
use libre_otp::run;

use std::process;

/// Libre OTP Authenticator - Arch Security Suite Standalone
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {

}

fn main() {
    let args = Args::parse();

    println!("Starting Libre OTP CLI. Run with --help for options.");
    run();
}
