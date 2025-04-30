//! Configuration for DarkSwap Bridge
//!
//! This module provides configuration structures and functions for the DarkSwap Bridge.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::error::{Error, Result};
use crate::integrations::IntegrationConfig;

/// DarkSwap Bridge configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Bridge configuration
    pub bridge: BridgeConfig,
    /// Integration configuration
    pub integration: Option<IntegrationConfig>,
    /// API configuration
    pub api: Option<ApiConfig>,
    /// WebSocket configuration
    pub websocket: Option<WebSocketConfig>,
}

/// Bridge configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeConfig {
    /// Path to the wallet adapter executable
    pub wallet_adapter_path: String,
    /// Path to the network adapter executable
    pub network_adapter_path: String,
    /// Path to the storage directory
    pub storage_dir: String,
    /// Whether to automatically start the wallet and network adapters
    pub auto_start: bool,
    /// Whether to automatically connect to peers
    pub auto_connect: bool,
}

/// API configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiConfig {
    /// Address to bind to
    pub bind_address: String,
    /// Whether to enable authentication
    pub enable_auth: bool,
    /// JWT secret
    pub jwt_secret: Option<String>,
    /// CORS allowed origins
    pub cors_allowed_origins: Option<Vec<String>>,
    /// Rate limit requests per minute
    pub rate_limit: Option<u32>,
}

/// WebSocket configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketConfig {
    /// Address to bind to
    pub bind_address: String,
    /// Whether to enable authentication
    pub enable_auth: bool,
    /// JWT secret
    pub jwt_secret: Option<String>,
    /// Ping interval in seconds
    pub ping_interval: Option<u64>,
    /// Maximum message size in bytes
    pub max_message_size: Option<usize>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            bridge: BridgeConfig::default(),
            integration: Some(IntegrationConfig::default()),
            api: Some(ApiConfig::default()),
            websocket: Some(WebSocketConfig::default()),
        }
    }
}

impl Default for BridgeConfig {
    fn default() -> Self {
        Self {
            wallet_adapter_path: "darkswap-wallet-adapter".to_string(),
            network_adapter_path: "darkswap-network-adapter".to_string(),
            storage_dir: "./storage".to_string(),
            auto_start: true,
            auto_connect: true,
        }
    }
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            bind_address: "127.0.0.1:3000".to_string(),
            enable_auth: true,
            jwt_secret: None,
            cors_allowed_origins: None,
            rate_limit: Some(60),
        }
    }
}

impl Default for WebSocketConfig {
    fn default() -> Self {
        Self {
            bind_address: "127.0.0.1:3001".to_string(),
            enable_auth: true,
            jwt_secret: None,
            ping_interval: Some(30),
            max_message_size: Some(1024 * 1024), // 1 MB
        }
    }
}

impl Config {
    /// Load configuration from a file
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = fs::read_to_string(path)
            .map_err(|e| Error::ConfigError(format!("Failed to read config file: {}", e)))?;
        
        let config: Config = toml::from_str(&content)
            .map_err(|e| Error::ConfigError(format!("Failed to parse config file: {}", e)))?;
        
        Ok(config)
    }

    /// Save configuration to a file
    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let content = toml::to_string_pretty(self)
            .map_err(|e| Error::ConfigError(format!("Failed to serialize config: {}", e)))?;
        
        fs::write(path, content)
            .map_err(|e| Error::ConfigError(format!("Failed to write config file: {}", e)))?;
        
        Ok(())
    }

    /// Get the default configuration file path
    pub fn default_path() -> PathBuf {
        let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push("darkswap");
        path.push("bridge");
        path.push("config.toml");
        path
    }

    /// Load configuration from the default path, or create a default configuration if the file doesn't exist
    pub fn load_or_default() -> Result<Self> {
        let path = Self::default_path();
        
        if path.exists() {
            Self::load(&path)
        } else {
            let config = Self::default();
            
            // Create parent directories if they don't exist
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| Error::ConfigError(format!("Failed to create config directory: {}", e)))?;
            }
            
            // Save default configuration
            config.save(&path)?;
            
            Ok(config)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.bridge.wallet_adapter_path, "darkswap-wallet-adapter");
        assert_eq!(config.bridge.network_adapter_path, "darkswap-network-adapter");
        assert_eq!(config.bridge.storage_dir, "./storage");
        assert!(config.bridge.auto_start);
        assert!(config.bridge.auto_connect);
        assert!(config.integration.is_some());
        assert!(config.api.is_some());
        assert!(config.websocket.is_some());
    }
    
    #[test]
    fn test_save_load_config() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("config.toml");
        
        let config = Config::default();
        config.save(&path).unwrap();
        
        let loaded_config = Config::load(&path).unwrap();
        assert_eq!(loaded_config.bridge.wallet_adapter_path, config.bridge.wallet_adapter_path);
        assert_eq!(loaded_config.bridge.network_adapter_path, config.bridge.network_adapter_path);
        assert_eq!(loaded_config.bridge.storage_dir, config.bridge.storage_dir);
        assert_eq!(loaded_config.bridge.auto_start, config.bridge.auto_start);
        assert_eq!(loaded_config.bridge.auto_connect, config.bridge.auto_connect);
    }
}