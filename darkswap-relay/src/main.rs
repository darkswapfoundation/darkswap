//! DarkSwap Relay Server
//!
//! This is the main entry point for the DarkSwap Relay Server.
//! It provides WebRTC signaling and circuit relay functionality for the DarkSwap P2P network.

mod auth;
mod circuit_relay;
mod config;
mod error;
mod metrics;
mod rate_limit;
mod server;
mod signaling;
mod utils;
mod webrtc;

use crate::{
    config::Config,
    error::Error,
    server::Server,
};
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use tracing::{debug, error, info, warn};
use tracing_subscriber::{
    fmt,
    EnvFilter,
};

/// Result type
pub type Result<T> = std::result::Result<T, Error>;

/// DarkSwap Relay Server version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// DarkSwap Relay Server git hash
pub const GIT_HASH: &str = env!("GIT_HASH");

/// DarkSwap Relay Server build date
pub const BUILD_DATE: &str = env!("BUILD_DATE");

/// Command line arguments
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Config file
    #[clap(short, long, value_parser)]
    config: Option<PathBuf>,
    
    /// Subcommand
    #[clap(subcommand)]
    command: Option<Commands>,
}

/// Subcommands
#[derive(Subcommand, Debug)]
enum Commands {
    /// Run the relay server
    Run {
        /// Config file
        #[clap(short, long, value_parser)]
        config: Option<PathBuf>,
    },
    /// Generate a default config file
    GenerateConfig {
        /// Output file
        #[clap(short, long, value_parser)]
        output: PathBuf,
    },
    /// Generate a token
    GenerateToken {
        /// Peer ID
        #[clap(short, long, value_parser)]
        peer_id: String,
        /// Roles
        #[clap(short, long, value_parser)]
        roles: Vec<String>,
        /// Config file
        #[clap(short, long, value_parser)]
        config: Option<PathBuf>,
    },
}

/// Main function
#[tokio::main]
async fn main() -> Result<()> {
    // Parse command line arguments
    let args = Args::parse();
    
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();
    
    // Print version information
    info!("DarkSwap Relay Server v{} ({}) built on {}", VERSION, GIT_HASH, BUILD_DATE);
    
    // Process subcommands
    match args.command {
        Some(Commands::Run { config }) => {
            // Get the config file path
            let config_path = config.or(args.config);
            
            // Load the config
            let config = match config_path {
                Some(path) => {
                    info!("Loading config from {}", path.display());
                    Config::from_file(path)?
                }
                None => {
                    info!("Using default config");
                    Config::default()
                }
            };
            
            // Create the server
            let server = Server::new(config)?;
            
            // Start the server
            server.start().await?;
        }
        Some(Commands::GenerateConfig { output }) => {
            // Create a default config
            let config = Config::default();
            
            // Serialize the config
            let toml = toml::to_string_pretty(&config)?;
            
            // Write the config to the output file
            std::fs::write(&output, toml)?;
            
            info!("Generated config file: {}", output.display());
        }
        Some(Commands::GenerateToken { peer_id, roles, config }) => {
            // Load the config
            let config = match config {
                Some(path) => {
                    info!("Loading config from {}", path.display());
                    Config::from_file(path)?
                }
                None => {
                    info!("Using default config");
                    Config::default()
                }
            };
            
            // Create the auth manager
            let auth_manager = auth::AuthManager::new(config)?;
            
            // Generate the token
            let token = auth_manager.generate_token(&peer_id, roles).await?;
            
            // Print the token
            println!("Token: {}", token.value);
            println!("Expires at: {}", token.expires_at);
        }
        None => {
            // Get the config file path
            let config_path = args.config;
            
            // Load the config
            let config = match config_path {
                Some(path) => {
                    info!("Loading config from {}", path.display());
                    Config::from_file(path)?
                }
                None => {
                    info!("Using default config");
                    Config::default()
                }
            };
            
            // Create the server
            let server = Server::new(config)?;
            
            // Start the server
            server.start().await?;
        }
    }
    
    Ok(())
}