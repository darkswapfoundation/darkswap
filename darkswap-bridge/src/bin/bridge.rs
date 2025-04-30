//! DarkSwap Bridge executable
//!
//! This is the main executable for the DarkSwap Bridge.

use clap::Parser;
use log::{error, info};

use darkswap_bridge::config::Config;
use darkswap_bridge::DarkSwapBridge;

/// Command line arguments
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Path to the configuration file
    #[clap(short, long)]
    config: Option<String>,
    
    /// Run as a server
    #[clap(short, long)]
    server: bool,
    
    /// Log level
    #[clap(short, long, default_value = "info")]
    log_level: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Parse command line arguments
    let args = Args::parse();
    
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(&args.log_level))
        .init();
    
    // Load configuration
    let config = if let Some(config_path) = args.config {
        info!("Loading configuration from {}", config_path);
        Config::load(config_path)?
    } else {
        info!("Loading default configuration");
        Config::load_or_default()?
    };
    
    // Create bridge
    let bridge = DarkSwapBridge::new(config).await?;
    
    // Start bridge
    bridge.start().await?;
    
    if args.server {
        info!("Running as server");
        
        // Keep the process running
        tokio::signal::ctrl_c().await?;
        info!("Received Ctrl+C, shutting down");
        
        // Stop bridge
        bridge.stop().await?;
    }
    
    Ok(())
}