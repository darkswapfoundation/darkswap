//! Build script for the DarkSwap Relay Server
//!
//! This script sets up the build environment and generates version information.

use chrono::Utc;
use std::{
    env,
    fs,
    path::Path,
    process::Command,
};

/// Main function
fn main() {
    // Get the current date
    let now = Utc::now();
    let build_date = now.format("%Y-%m-%d %H:%M:%S").to_string();
    
    // Get the git hash
    let git_hash = get_git_hash().unwrap_or_else(|| "unknown".to_string());
    
    // Set environment variables
    println!("cargo:rustc-env=BUILD_DATE={}", build_date);
    println!("cargo:rustc-env=GIT_HASH={}", git_hash);
    
    // Rerun if the build script changes
    println!("cargo:rerun-if-changed=build.rs");
    
    // Create the certs directory if it doesn't exist
    let out_dir = env::var("OUT_DIR").unwrap();
    let certs_dir = Path::new(&out_dir).join("certs");
    fs::create_dir_all(&certs_dir).unwrap();
}

/// Get the git hash
fn get_git_hash() -> Option<String> {
    let output = Command::new("git")
        .args(&["rev-parse", "--short", "HEAD"])
        .output()
        .ok()?;
    
    if output.status.success() {
        let hash = String::from_utf8(output.stdout).ok()?;
        Some(hash.trim().to_string())
    } else {
        None
    }
}