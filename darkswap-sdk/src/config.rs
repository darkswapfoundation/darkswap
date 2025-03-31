//! Configuration module for DarkSwap
//!
//! This module provides configuration options for the DarkSwap SDK.

use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

use anyhow::{Context, Result};
use libp2p::core::multiaddr::Multiaddr;
use serde::{Deserialize, Serialize};

/// Bitcoin network
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BitcoinNetwork {
    /// Mainnet
    Mainnet,
    /// Testnet
    Testnet,
    /// Regtest
    Regtest,
    /// Signet
    Signet,
}

impl BitcoinNetwork {
    /// Convert to string
    pub fn to_string(&self) -> String {
        match self {
            BitcoinNetwork::Mainnet => "mainnet".to_string(),
            BitcoinNetwork::Testnet => "testnet".to_string(),
            BitcoinNetwork::Regtest => "regtest".to_string(),
            BitcoinNetwork::Signet => "signet".to_string(),
        }
    }
}

/// Bitcoin configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BitcoinConfig {
    /// Bitcoin network
    pub network: BitcoinNetwork,
    /// Electrum server URL
    pub electrum_url: Option<String>,
    /// Fee rate (satoshis per vbyte)
    pub fee_rate: f32,
}

impl Default for BitcoinConfig {
    fn default() -> Self {
        Self {
            network: BitcoinNetwork::Testnet,
            electrum_url: None,
            fee_rate: 5.0,
        }
    }
}

/// P2P configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PConfig {
    /// Listen addresses
    pub listen_addresses: Vec<Multiaddr>,
    /// Bootstrap peers
    pub bootstrap_peers: Vec<Multiaddr>,
    /// Relay servers
    pub relay_servers: Vec<Multiaddr>,
    /// Enable WebRTC
    pub enable_webrtc: bool,
    /// WebRTC ICE servers
    pub ice_servers: Vec<String>,
    /// Signaling server URL
    pub signaling_server_url: Option<String>,
    /// Enable mDNS
    pub enable_mdns: bool,
    /// Enable Kademlia
    pub enable_kademlia: bool,
    /// Enable circuit relay
    pub enable_circuit_relay: bool,
}

impl Default for P2PConfig {
    fn default() -> Self {
        Self {
            listen_addresses: vec![],
            bootstrap_peers: vec![],
            relay_servers: vec![],
            enable_webrtc: true,
            ice_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
            signaling_server_url: Some("wss://signaling.darkswap.io".to_string()),
            enable_mdns: true,
            enable_kademlia: true,
            enable_circuit_relay: true,
        }
    }
}

/// Wallet configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    /// Wallet type
    pub wallet_type: String,
    /// Private key
    pub private_key: Option<String>,
    /// Mnemonic
    pub mnemonic: Option<String>,
    /// Derivation path
    pub derivation_path: Option<String>,
}

impl Default for WalletConfig {
    fn default() -> Self {
        Self {
            wallet_type: "simple".to_string(),
            private_key: None,
            mnemonic: None,
            derivation_path: None,
        }
    }
}

/// Orderbook configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookConfig {
    /// Default order expiry (seconds)
    pub default_order_expiry: u64,
    /// Maximum order expiry (seconds)
    pub max_order_expiry: u64,
    /// Minimum order amount
    pub min_order_amount: String,
    /// Maximum order amount
    pub max_order_amount: String,
}

impl Default for OrderbookConfig {
    fn default() -> Self {
        Self {
            default_order_expiry: 86400, // 24 hours
            max_order_expiry: 604800, // 7 days
            min_order_amount: "0.00000001".to_string(),
            max_order_amount: "1000.0".to_string(),
        }
    }
}

/// Trade configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeConfig {
    /// Default trade expiry (seconds)
    pub default_trade_expiry: u64,
    /// Maximum trade expiry (seconds)
    pub max_trade_expiry: u64,
    /// Trade timeout (seconds)
    pub trade_timeout: u64,
}

impl Default for TradeConfig {
    fn default() -> Self {
        Self {
            default_trade_expiry: 3600, // 1 hour
            max_trade_expiry: 86400, // 24 hours
            trade_timeout: 300, // 5 minutes
        }
    }
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    /// Log level
    pub level: String,
    /// Log file
    pub file: Option<String>,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            file: None,
        }
    }
}

/// Performance configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Enable performance profiling
    pub enabled: bool,
    /// Enable caching
    pub enable_caching: bool,
    /// Cache expiry (seconds)
    pub cache_expiry: u64,
    /// Profile critical paths
    pub profile_critical_paths: bool,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            enable_caching: true,
            cache_expiry: 300, // 5 minutes
            profile_critical_paths: true,
        }
    }
}

/// DarkSwap configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Configuration file path
    #[serde(skip)]
    pub config_path: Option<std::path::PathBuf>,
    /// Bitcoin configuration
    pub bitcoin: BitcoinConfig,
    /// P2P configuration
    pub p2p: P2PConfig,
    /// Wallet configuration
    pub wallet: WalletConfig,
    /// Orderbook configuration
    pub orderbook: OrderbookConfig,
    /// Trade configuration
    pub trade: TradeConfig,
    /// Logging configuration
    pub logging: LoggingConfig,
    /// Performance configuration
    pub performance: PerformanceConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            config_path: None,
            bitcoin: BitcoinConfig::default(),
            p2p: P2PConfig::default(),
            wallet: WalletConfig::default(),
            orderbook: OrderbookConfig::default(),
            trade: TradeConfig::default(),
            logging: LoggingConfig::default(),
            performance: PerformanceConfig::default(),
        }
    }
}

impl Config {
    /// Load configuration from file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let mut file = File::open(&path).context("Failed to open config file")?;
        let mut contents = String::new();
        file.read_to_string(&mut contents).context("Failed to read config file")?;
        
        let mut config: Config = serde_json::from_str(&contents).context("Failed to parse config file")?;
        config.config_path = Some(path.as_ref().to_path_buf());
        
        Ok(config)
    }

    /// Save configuration to file
    pub fn to_file<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let contents = serde_json::to_string_pretty(self).context("Failed to serialize config")?;
        
        let mut file = File::create(&path).context("Failed to create config file")?;
        file.write_all(contents.as_bytes()).context("Failed to write config file")?;
        
        Ok(())
    }
}