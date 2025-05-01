//! Configuration module for DarkSwap
//!
//! This module provides configuration options for DarkSwap.

use serde::{Serialize, Deserialize};

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

impl Default for BitcoinNetwork {
    fn default() -> Self {
        BitcoinNetwork::Testnet
    }
}

/// DarkSwap configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DarkSwapConfig {
    /// Bitcoin network
    pub bitcoin_network: BitcoinNetwork,
    /// Relay URL
    pub relay_url: String,
    /// Bootstrap peers
    pub bootstrap_peers: Vec<String>,
    /// Debug mode
    pub debug: bool,
}

impl Default for DarkSwapConfig {
    fn default() -> Self {
        Self {
            bitcoin_network: BitcoinNetwork::default(),
            relay_url: "wss://relay.darkswap.io".to_string(),
            bootstrap_peers: vec![],
            debug: false,
        }
    }
}

/// P2P configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PConfig {
    /// Listen address
    pub listen_address: String,
    /// Bootstrap peers
    pub bootstrap_peers: Vec<String>,
    /// Enable mDNS
    pub enable_mdns: bool,
    /// Enable Kademlia
    pub enable_kad: bool,
}

impl Default for P2PConfig {
    fn default() -> Self {
        Self {
            listen_address: "/ip4/0.0.0.0/tcp/0".to_string(),
            bootstrap_peers: vec![],
            enable_mdns: true,
            enable_kad: true,
        }
    }
}

/// WebRTC configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCConfig {
    /// STUN servers
    pub stun_servers: Vec<String>,
    /// TURN servers
    pub turn_servers: Vec<String>,
    /// Signaling server
    pub signaling_server: String,
}

impl Default for WebRTCConfig {
    fn default() -> Self {
        Self {
            stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
            turn_servers: vec![],
            signaling_server: "wss://signaling.darkswap.io".to_string(),
        }
    }
}

/// Wallet configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletConfig {
    /// Bitcoin network
    pub bitcoin_network: BitcoinNetwork,
    /// Wallet type (simple, bdk)
    pub wallet_type: String,
    /// Mnemonic
    pub mnemonic: Option<String>,
    /// Password
    pub password: Option<String>,
    /// Electrum server
    pub electrum_server: String,
}

impl Default for WalletConfig {
    fn default() -> Self {
        Self {
            bitcoin_network: BitcoinNetwork::default(),
            wallet_type: "simple".to_string(),
            mnemonic: None,
            password: None,
            electrum_server: "ssl://electrum.blockstream.info:60002".to_string(),
        }
    }
}

/// Main configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// DarkSwap configuration
    pub darkswap: DarkSwapConfig,
    /// P2P configuration
    pub p2p: P2PConfig,
    /// WebRTC configuration
    pub webrtc: WebRTCConfig,
    /// Wallet configuration
    pub wallet: WalletConfig,
    /// Orderbook configuration
    pub orderbook: OrderbookConfig,
    /// Trade configuration
    pub trade: TradeConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            darkswap: DarkSwapConfig::default(),
            p2p: P2PConfig::default(),
            webrtc: WebRTCConfig::default(),
            wallet: WalletConfig::default(),
            orderbook: OrderbookConfig::default(),
            trade: TradeConfig::default(),
        }
    }
}

/// Orderbook configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookConfig {
    /// Order expiry time in seconds
    pub order_expiry: u64,
    /// Order cleanup interval in seconds
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

/// Trade configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeConfig {
    /// Trade expiry time in seconds
    pub trade_expiry: u64,
    /// Trade cleanup interval in seconds
    pub cleanup_interval: u64,
}

impl Default for TradeConfig {
    fn default() -> Self {
        Self {
            trade_expiry: 3600, // 1 hour
            cleanup_interval: 300, // 5 minutes
        }
    }
}