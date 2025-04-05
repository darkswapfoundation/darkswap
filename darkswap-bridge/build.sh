#!/bin/bash

# Build script for DarkSwap Bridge

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
RELEASE=false
ALL=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --release)
      RELEASE=true
      shift
      ;;
    --all)
      ALL=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --release  Build in release mode"
      echo "  --all      Build all components"
      echo "  --clean    Clean before building"
      echo "  -h, --help Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Clean if requested
if [ "$CLEAN" = true ]; then
  echo -e "${YELLOW}Cleaning...${NC}"
  cargo clean
fi

# Build options
BUILD_OPTS=""
if [ "$RELEASE" = true ]; then
  BUILD_OPTS="--release"
  echo -e "${YELLOW}Building in release mode...${NC}"
else
  echo -e "${YELLOW}Building in debug mode...${NC}"
fi

# Build the bridge
echo -e "${GREEN}Building DarkSwap Bridge...${NC}"
cargo build $BUILD_OPTS

# Create darkswap-bridge-wallet and darkswap-bridge-network crates if they don't exist
if [ "$ALL" = true ]; then
  # Check if darkswap-bridge-wallet exists
  if [ ! -d "$SCRIPT_DIR/darkswap-bridge-wallet" ]; then
    echo -e "${YELLOW}Creating darkswap-bridge-wallet crate...${NC}"
    mkdir -p "$SCRIPT_DIR/darkswap-bridge-wallet/src"
    
    # Create Cargo.toml
    cat > "$SCRIPT_DIR/darkswap-bridge-wallet/Cargo.toml" << EOF
[package]
name = "darkswap-bridge-wallet"
version = "0.1.0"
edition = "2021"
description = "Wallet component for DarkSwap Bridge"
authors = ["DarkSwap Team"]
license = "MIT"

[dependencies]
bitcoin = "0.30"
bdk = { version = "0.28", default-features = false, features = ["keys-bip39"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
env_logger = "0.10"
clap = { version = "4.3", features = ["derive"] }
tokio = { version = "1.28", features = ["full"] }
ipc-channel = "0.16"
EOF
    
    # Create lib.rs
    cat > "$SCRIPT_DIR/darkswap-bridge-wallet/src/lib.rs" << EOF
//! DarkSwap Bridge wallet component
//!
//! This crate provides the wallet functionality for DarkSwap Bridge.

#![warn(missing_docs)]
#![warn(rustdoc::missing_doc_code_examples)]

/// Wallet implementation
pub mod wallet;
EOF
    
    # Create wallet.rs
    cat > "$SCRIPT_DIR/darkswap-bridge-wallet/src/wallet.rs" << EOF
//! Wallet implementation for DarkSwap Bridge
//!
//! This module provides the wallet implementation for DarkSwap Bridge.

use bdk::bitcoin::Network;
use bdk::database::MemoryDatabase;
use bdk::template::Bip84;
use bdk::wallet::AddressIndex;
use bdk::{SignOptions, SyncOptions, Wallet};

/// Wallet error
#[derive(Debug, thiserror::Error)]
pub enum WalletError {
    /// BDK error
    #[error("BDK error: {0}")]
    BdkError(#[from] bdk::Error),
    
    /// Other error
    #[error("Other error: {0}")]
    OtherError(String),
}

/// Wallet result
pub type Result<T> = std::result::Result<T, WalletError>;

/// Simple wallet implementation
pub struct SimpleWallet {
    /// Inner BDK wallet
    wallet: Wallet<MemoryDatabase>,
}

impl SimpleWallet {
    /// Create a new wallet
    pub fn new(mnemonic: &str, network: Network) -> Result<Self> {
        let wallet = Wallet::new(
            Bip84(mnemonic, bdk::bitcoin::KeychainKind::External),
            None,
            network,
            MemoryDatabase::default(),
        )?;
        
        Ok(Self { wallet })
    }
    
    /// Get a new address
    pub fn get_address(&self) -> Result<String> {
        let address = self.wallet.get_address(AddressIndex::New)?;
        Ok(address.to_string())
    }
    
    /// Sync the wallet
    pub fn sync(&self) -> Result<()> {
        // In a real implementation, this would sync with the blockchain
        Ok(())
    }
}
EOF
    
    # Create main.rs
    cat > "$SCRIPT_DIR/darkswap-bridge-wallet/src/main.rs" << EOF
//! DarkSwap Bridge wallet component executable
//!
//! This is the main executable for the DarkSwap Bridge wallet component.

use clap::Parser;
use log::info;

/// Command line arguments
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Log level
    #[clap(short, long, default_value = "info")]
    log_level: String,
}

fn main() {
    // Parse command line arguments
    let args = Args::parse();
    
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(&args.log_level))
        .init();
    
    info!("DarkSwap Bridge wallet component");
}
EOF
  fi
  
  # Check if darkswap-bridge-network exists
  if [ ! -d "$SCRIPT_DIR/darkswap-bridge-network" ]; then
    echo -e "${YELLOW}Creating darkswap-bridge-network crate...${NC}"
    mkdir -p "$SCRIPT_DIR/darkswap-bridge-network/src"
    
    # Create Cargo.toml
    cat > "$SCRIPT_DIR/darkswap-bridge-network/Cargo.toml" << EOF
[package]
name = "darkswap-bridge-network"
version = "0.1.0"
edition = "2021"
description = "Network component for DarkSwap Bridge"
authors = ["DarkSwap Team"]
license = "MIT"

[dependencies]
libp2p = { version = "0.52", features = ["tcp", "dns", "websocket", "noise", "yamux", "ping", "identify", "kad", "gossipsub", "mdns"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
env_logger = "0.10"
clap = { version = "4.3", features = ["derive"] }
tokio = { version = "1.28", features = ["full"] }
ipc-channel = "0.16"
EOF
    
    # Create lib.rs
    cat > "$SCRIPT_DIR/darkswap-bridge-network/src/lib.rs" << EOF
//! DarkSwap Bridge network component
//!
//! This crate provides the network functionality for DarkSwap Bridge.

#![warn(missing_docs)]
#![warn(rustdoc::missing_doc_code_examples)]

/// Network implementation
pub mod network;
EOF
    
    # Create network.rs
    cat > "$SCRIPT_DIR/darkswap-bridge-network/src/network.rs" << EOF
//! Network implementation for DarkSwap Bridge
//!
//! This module provides the network implementation for DarkSwap Bridge.

use libp2p::core::transport::Transport;
use libp2p::core::upgrade;
use libp2p::identity::Keypair;
use libp2p::noise;
use libp2p::swarm::SwarmBuilder;
use libp2p::tcp::TokioTcpConfig;
use libp2p::yamux;
use libp2p::{PeerId, Swarm};
use std::error::Error;

/// Network error
#[derive(Debug, thiserror::Error)]
pub enum NetworkError {
    /// LibP2P error
    #[error("LibP2P error: {0}")]
    LibP2PError(String),
    
    /// Other error
    #[error("Other error: {0}")]
    OtherError(String),
}

/// Network result
pub type Result<T> = std::result::Result<T, NetworkError>;

/// Simple network implementation
pub struct SimpleNetwork {
    /// LibP2P swarm
    swarm: Swarm<libp2p::ping::Behaviour>,
}

impl SimpleNetwork {
    /// Create a new network
    pub async fn new() -> Result<Self> {
        // Create a random key for our identity
        let local_key = Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_key.public());
        
        // Create a transport
        let transport = TokioTcpConfig::new()
            .nodelay(true)
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::NoiseAuthenticated::xx(&local_key).unwrap())
            .multiplex(yamux::YamuxConfig::default())
            .boxed();
        
        // Create a ping network behaviour
        let behaviour = libp2p::ping::Behaviour::new(libp2p::ping::Config::new());
        
        // Create a swarm
        let swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, local_peer_id).build();
        
        Ok(Self { swarm })
    }
    
    /// Start listening on the given address
    pub async fn listen_on(&mut self, addr: &str) -> Result<()> {
        let addr = addr.parse().map_err(|e| NetworkError::OtherError(e.to_string()))?;
        self.swarm.listen_on(addr).map_err(|e| NetworkError::LibP2PError(e.to_string()))?;
        Ok(())
    }
    
    /// Connect to a peer
    pub async fn connect(&mut self, addr: &str) -> Result<()> {
        let addr = addr.parse().map_err(|e| NetworkError::OtherError(e.to_string()))?;
        self.swarm.dial(addr).map_err(|e| NetworkError::LibP2PError(e.to_string()))?;
        Ok(())
    }
}
EOF
    
    # Create main.rs
    cat > "$SCRIPT_DIR/darkswap-bridge-network/src/main.rs" << EOF
//! DarkSwap Bridge network component executable
//!
//! This is the main executable for the DarkSwap Bridge network component.

use clap::Parser;
use log::info;

/// Command line arguments
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    /// Log level
    #[clap(short, long, default_value = "info")]
    log_level: String,
}

#[tokio::main]
async fn main() {
    // Parse command line arguments
    let args = Args::parse();
    
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(&args.log_level))
        .init();
    
    info!("DarkSwap Bridge network component");
}
EOF
  fi
  
  # Build the wallet and network components
  echo -e "${GREEN}Building DarkSwap Bridge wallet component...${NC}"
  (cd "$SCRIPT_DIR/darkswap-bridge-wallet" && cargo build $BUILD_OPTS)
  
  echo -e "${GREEN}Building DarkSwap Bridge network component...${NC}"
  (cd "$SCRIPT_DIR/darkswap-bridge-network" && cargo build $BUILD_OPTS)
fi

echo -e "${GREEN}Build completed successfully!${NC}"