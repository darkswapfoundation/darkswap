//! Configuration for DarkSwap
//!
//! This module defines the configuration for DarkSwap.

use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

use crate::error::{Error, Result};

/// Configuration for DarkSwap
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Network configuration
    pub network: NetworkConfig,
    /// Bitcoin configuration
    pub bitcoin: BitcoinConfig,
    /// Orderbook configuration
    pub orderbook: OrderbookConfig,
    /// Runes configuration
    pub runes: RunesConfig,
    /// Alkanes configuration
    pub alkanes: AlkanesConfig,
}

impl Config {
    /// Create a new configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Load configuration from file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        // Open file
        let mut file = File::open(path)
            .map_err(|e| Error::ConfigError(format!("Failed to open config file: {}", e)))?;

        // Read file
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| Error::ConfigError(format!("Failed to read config file: {}", e)))?;

        // Parse JSON
        let config = serde_json::from_str(&contents)
            .map_err(|e| Error::ConfigError(format!("Failed to parse config file: {}", e)))?;

        Ok(config)
    }

    /// Save configuration to file
    pub fn to_file<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        // Create parent directory if it doesn't exist
        if let Some(parent) = path.as_ref().parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| Error::ConfigError(format!("Failed to create directory: {}", e)))?;
        }

        // Serialize to JSON
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| Error::ConfigError(format!("Failed to serialize config: {}", e)))?;

        // Write to file
        let mut file = File::create(path)
            .map_err(|e| Error::ConfigError(format!("Failed to create config file: {}", e)))?;
        file.write_all(json.as_bytes())
            .map_err(|e| Error::ConfigError(format!("Failed to write config file: {}", e)))?;

        Ok(())
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            network: NetworkConfig::default(),
            bitcoin: BitcoinConfig::default(),
            orderbook: OrderbookConfig::default(),
            runes: RunesConfig::default(),
            alkanes: AlkanesConfig::default(),
        }
    }
}

/// Network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Listen addresses
    pub listen_addresses: Vec<String>,
    /// Bootstrap peers
    pub bootstrap_peers: Vec<String>,
    /// Gossipsub topic
    pub gossipsub_topic: String,
    /// Gossipsub heartbeat interval in seconds
    pub gossipsub_heartbeat_interval: u64,
    /// Circuit relay enabled
    pub circuit_relay_enabled: bool,
    /// Circuit relay servers
    pub circuit_relay_servers: Vec<String>,
    /// WebRTC enabled
    pub webrtc_enabled: bool,
    /// WebRTC ICE servers
    pub webrtc_ice_servers: Vec<String>,
    /// Maximum number of connections
    pub max_connections: Option<usize>,
    /// Connection timeout in seconds
    pub connection_timeout: Option<u64>,
    /// Message batch size
    pub message_batch_size: Option<usize>,
    /// Message batch timeout in milliseconds
    pub message_batch_timeout: Option<u64>,
    /// Compression enabled
    pub compression_enabled: Option<bool>,
    /// Compression algorithm
    pub compression_algorithm: Option<String>,
    /// Compression level
    pub compression_level: Option<String>,
    /// Maximum retry count for WebRTC errors
    pub max_retry_count: Option<u32>,
    /// Retry interval in milliseconds
    pub retry_interval: Option<u64>,
    /// Error retention period in seconds
    pub error_retention_period: Option<u64>,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addresses: vec![
                "/ip4/0.0.0.0/tcp/0".to_string(),
                "/ip4/0.0.0.0/udp/0/quic-v1".to_string(),
            ],
            bootstrap_peers: vec![
                "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ".to_string(),
                "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN".to_string(),
            ],
            gossipsub_topic: "darkswap/v1".to_string(),
            gossipsub_heartbeat_interval: 10,
            circuit_relay_enabled: true,
            circuit_relay_servers: vec![
                "/ip4/104.131.131.82/tcp/4002/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb".to_string(),
                "/dnsaddr/relay.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN".to_string(),
            ],
            webrtc_enabled: true,
            webrtc_ice_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
            max_connections: Some(100),
            connection_timeout: Some(300), // 5 minutes
            message_batch_size: Some(10),
            message_batch_timeout: Some(100), // 100 milliseconds
            compression_enabled: Some(true),
            compression_algorithm: Some("gzip".to_string()),
            compression_level: Some("default".to_string()),
            max_retry_count: Some(3),
            retry_interval: Some(5000), // 5 seconds
            error_retention_period: Some(3600), // 1 hour
        }
    }
}

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

impl From<BitcoinNetwork> for bitcoin::Network {
    fn from(network: BitcoinNetwork) -> Self {
        match network {
            BitcoinNetwork::Mainnet => bitcoin::Network::Bitcoin,
            BitcoinNetwork::Testnet => bitcoin::Network::Testnet,
            BitcoinNetwork::Regtest => bitcoin::Network::Regtest,
            BitcoinNetwork::Signet => bitcoin::Network::Signet,
        }
    }
}

/// Bitcoin configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BitcoinConfig {
    /// Bitcoin network
    pub network: BitcoinNetwork,
    /// Bitcoin RPC URL
    pub rpc_url: String,
    /// Bitcoin RPC username
    pub rpc_username: String,
    /// Bitcoin RPC password
    pub rpc_password: String,
    /// Fee rate in satoshis per byte
    pub fee_rate: f64,
    /// Minimum confirmations
    pub min_confirmations: u32,
}

impl Default for BitcoinConfig {
    fn default() -> Self {
        Self {
            network: BitcoinNetwork::Testnet,
            rpc_url: "http://localhost:18332".to_string(),
            rpc_username: "bitcoin".to_string(),
            rpc_password: "password".to_string(),
            fee_rate: 1.0,
            min_confirmations: 1,
        }
    }
}

/// Orderbook configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookConfig {
    /// Order expiry in seconds
    pub order_expiry: u64,
    /// Cleanup interval in seconds
    pub cleanup_interval: u64,
}

impl Default for OrderbookConfig {
    fn default() -> Self {
        Self {
            order_expiry: 86400, // 24 hours
            cleanup_interval: 3600, // 1 hour
        }
    }
}

/// Runes configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunesConfig {
    /// Runes enabled
    pub enabled: bool,
    /// Runes API URL
    pub api_url: String,
    /// Runes API key
    pub api_key: String,
    /// Runes cache enabled
    pub cache_enabled: bool,
    /// Runes cache expiry in seconds
    pub cache_expiry: u64,
}

impl Default for RunesConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            api_url: "https://api.runes.com".to_string(),
            api_key: "".to_string(),
            cache_enabled: true,
            cache_expiry: 3600, // 1 hour
        }
    }
}

/// Alkanes configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlkanesConfig {
    /// Alkanes enabled
    pub enabled: bool,
    /// Alkanes API URL
    pub api_url: String,
    /// Alkanes API key
    pub api_key: String,
    /// Alkanes cache enabled
    pub cache_enabled: bool,
    /// Alkanes cache expiry in seconds
    pub cache_expiry: u64,
}

impl Default for AlkanesConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            api_url: "https://api.alkanes.com".to_string(),
            api_key: "".to_string(),
            cache_enabled: true,
            cache_expiry: 3600, // 1 hour
        }
    }
}