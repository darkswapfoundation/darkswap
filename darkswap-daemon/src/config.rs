use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Configuration for the daemon
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// API configuration
    pub api: ApiConfig,
    /// P2P configuration
    pub p2p: P2PConfig,
    /// Bitcoin configuration
    pub bitcoin: BitcoinConfig,
    /// Logging configuration
    pub log: LogConfig,
    /// Rate limiting configuration
    pub rate_limit: RateLimitConfig,
    /// Authentication configuration
    pub auth: AuthConfig,
    /// Data directory
    pub data_dir: String,
}

/// API configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    /// The address to listen on
    pub listen_address: String,
    /// Whether to enable CORS
    pub enable_cors: bool,
    /// The allowed origins for CORS
    pub cors_allowed_origins: Vec<String>,
    /// Whether to enable HTTPS
    pub enable_https: bool,
    /// The path to the SSL certificate
    pub ssl_cert_path: String,
    /// The path to the SSL key
    pub ssl_key_path: String,
}

/// P2P configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PConfig {
    /// The addresses to listen on
    pub listen_addresses: Vec<String>,
    /// The bootstrap peers
    pub bootstrap_peers: Vec<String>,
    /// The relay servers
    pub relay_servers: Vec<String>,
    /// The node ID
    pub node_id: Option<String>,
    /// Whether to enable WebRTC
    pub enable_webrtc: bool,
    /// Whether to enable circuit relay
    pub enable_circuit_relay: bool,
    /// Whether to enable DHT
    pub enable_dht: bool,
    /// Whether to enable GossipSub
    pub enable_gossipsub: bool,
}

/// Bitcoin configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BitcoinConfig {
    /// The Bitcoin network
    pub network: String,
    /// The Bitcoin RPC URL
    pub rpc_url: Option<String>,
    /// The Bitcoin RPC username
    pub rpc_username: Option<String>,
    /// The Bitcoin RPC password
    pub rpc_password: Option<String>,
    /// The Bitcoin wallet type
    pub wallet_type: String,
    /// The Bitcoin wallet path
    pub wallet_path: Option<String>,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogConfig {
    /// The log level
    pub level: String,
    /// Whether to log to a file
    pub log_to_file: bool,
    /// The log file path
    pub log_file_path: Option<String>,
    /// Whether to log request bodies
    pub log_request_body: bool,
    /// Whether to log response bodies
    pub log_response_body: bool,
    /// The maximum body size to log
    pub max_body_size: usize,
    /// The paths to exclude from logging
    pub exclude_paths: Vec<String>,
    /// The paths to include in logging
    pub include_paths: Vec<String>,
}

/// Rate limiting configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    /// The maximum number of requests allowed per window
    pub limit: u32,
    /// The window duration in seconds
    pub window: u64,
    /// Whether to use a sliding window
    pub sliding_window: bool,
    /// The paths to exclude from rate limiting
    pub exclude_paths: Vec<String>,
    /// The paths to include in rate limiting
    pub include_paths: Vec<String>,
    /// The limit for authenticated users
    pub authenticated_limit: u32,
}

/// Authentication configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    /// The secret key for JWT signing
    pub secret_key: String,
    /// The token expiration time in seconds
    pub token_expiration: u64,
    /// The paths to exclude from authentication
    pub exclude_paths: Vec<String>,
    /// The paths to include in authentication
    pub include_paths: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            api: ApiConfig {
                listen_address: "127.0.0.1:3000".to_string(),
                enable_cors: true,
                cors_allowed_origins: vec!["*".to_string()],
                enable_https: false,
                ssl_cert_path: "".to_string(),
                ssl_key_path: "".to_string(),
            },
            p2p: P2PConfig {
                listen_addresses: vec!["/ip4/0.0.0.0/tcp/9000".to_string()],
                bootstrap_peers: vec![],
                relay_servers: vec![],
                node_id: None,
                enable_webrtc: true,
                enable_circuit_relay: true,
                enable_dht: true,
                enable_gossipsub: true,
            },
            bitcoin: BitcoinConfig {
                network: "testnet".to_string(),
                rpc_url: None,
                rpc_username: None,
                rpc_password: None,
                wallet_type: "simple".to_string(),
                wallet_path: None,
            },
            log: LogConfig {
                level: "info".to_string(),
                log_to_file: false,
                log_file_path: None,
                log_request_body: false,
                log_response_body: false,
                max_body_size: 1024,
                exclude_paths: vec!["/health".to_string()],
                include_paths: vec![],
            },
            rate_limit: RateLimitConfig {
                limit: 100,
                window: 60,
                sliding_window: true,
                exclude_paths: vec!["/health".to_string()],
                include_paths: vec![],
                authenticated_limit: 1000,
            },
            auth: AuthConfig {
                secret_key: "default_secret_key".to_string(),
                token_expiration: 86400, // 24 hours
                exclude_paths: vec!["/health".to_string(), "/auth/login".to_string()],
                include_paths: vec![],
            },
            data_dir: "./data".to_string(),
        }
    }
}

impl Config {
    /// Load the configuration from a file
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let config_str = fs::read_to_string(path)?;
        let config: Config = serde_json::from_str(&config_str)?;
        Ok(config)
    }

    /// Save the configuration to a file
    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<(), Box<dyn std::error::Error>> {
        let config_str = serde_json::to_string_pretty(self)?;
        fs::write(path, config_str)?;
        Ok(())
    }

    /// Create a default configuration file if it doesn't exist
    pub fn create_default<P: AsRef<Path>>(path: P) -> Result<(), Box<dyn std::error::Error>> {
        if !path.as_ref().exists() {
            let config = Config::default();
            config.save(path)?;
        }
        Ok(())
    }
}