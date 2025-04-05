//! DarkSwap Bridge - A bridge layer for DarkSwap to resolve dependency conflicts
//!
//! This crate provides a bridge layer that enables communication between
//! the wallet and networking components of DarkSwap, which have conflicting
//! dependencies. The bridge uses inter-process communication (IPC) to allow
//! these components to run in separate processes while still communicating
//! with each other.

#![warn(missing_docs)]
#![warn(rustdoc::missing_doc_code_examples)]

pub mod auth;
pub mod bridge;
pub mod config;
pub mod error;
pub mod integrations;
pub mod ipc;
pub mod message;
pub mod storage;
pub mod utils;
pub mod api;
pub mod websocket;

use std::net::SocketAddr;
use std::sync::Arc;

use log::{debug, error, info, warn};
use tokio::sync::Mutex;

use crate::bridge::Bridge;
use crate::config::Config;
use crate::error::Result;
use crate::integrations::IntegrationManager;
use crate::api::ApiServer;
use crate::websocket::WebSocketServer;

/// DarkSwap Bridge instance
pub struct DarkSwapBridge {
    /// Bridge instance
    bridge: Arc<Mutex<Bridge>>,
    /// Integration manager
    integration_manager: Arc<IntegrationManager>,
    /// API server
    api_server: Option<ApiServer>,
    /// WebSocket server
    websocket_server: Option<WebSocketServer>,
    /// Configuration
    config: Config,
}

impl DarkSwapBridge {
    /// Create a new DarkSwap Bridge instance
    pub async fn new(config: Config) -> Result<Self> {
        info!("Initializing DarkSwap Bridge");
        
        // Create integration manager
        let integration_config = config.integration.clone().unwrap_or_default();
        let integration_manager = Arc::new(IntegrationManager::new(integration_config));
        
        // Start integration services
        integration_manager.start().await?;
        
        // Create bridge
        let bridge = Arc::new(Mutex::new(Bridge::new(config.bridge.clone())?));
        
        // Create API server if enabled
        let api_server = if let Some(ref api_config) = config.api {
            let addr: SocketAddr = api_config.bind_address.parse()
                .map_err(|e| error::Error::ConfigError(format!("Invalid API bind address: {}", e)))?;
            
            Some(ApiServer::new(bridge.clone(), addr))
        } else {
            None
        };
        
        // Create WebSocket server if enabled
        let websocket_server = if let Some(ref ws_config) = config.websocket {
            let addr: SocketAddr = ws_config.bind_address.parse()
                .map_err(|e| error::Error::ConfigError(format!("Invalid WebSocket bind address: {}", e)))?;
            
            Some(WebSocketServer::new(bridge.clone(), addr))
        } else {
            None
        };
        
        Ok(Self {
            bridge,
            integration_manager,
            api_server,
            websocket_server,
            config,
        })
    }

    /// Start the bridge
    pub async fn start(&self) -> Result<()> {
        info!("Starting DarkSwap Bridge");
        
        // Start the bridge
        let mut bridge = self.bridge.lock().await;
        bridge.start().await?;
        drop(bridge);
        
        // Start API server if enabled
        if let Some(ref api_server) = self.api_server {
            tokio::spawn(async move {
                if let Err(e) = api_server.start().await {
                    error!("API server error: {}", e);
                }
            });
        }
        
        // Start WebSocket server if enabled
        if let Some(ref websocket_server) = self.websocket_server {
            tokio::spawn(async move {
                if let Err(e) = websocket_server.start().await {
                    error!("WebSocket server error: {}", e);
                }
            });
        }
        
        Ok(())
    }

    /// Stop the bridge
    pub async fn stop(&self) -> Result<()> {
        info!("Stopping DarkSwap Bridge");
        
        // Stop the bridge
        let mut bridge = self.bridge.lock().await;
        bridge.stop().await?;
        
        Ok(())
    }

    /// Get the bridge instance
    pub fn bridge(&self) -> Arc<Mutex<Bridge>> {
        self.bridge.clone()
    }

    /// Get the integration manager
    pub fn integration_manager(&self) -> Arc<IntegrationManager> {
        self.integration_manager.clone()
    }

    /// Get the API server
    pub fn api_server(&self) -> Option<&ApiServer> {
        self.api_server.as_ref()
    }

    /// Get the WebSocket server
    pub fn websocket_server(&self) -> Option<&WebSocketServer> {
        self.websocket_server.as_ref()
    }

    /// Get the configuration
    pub fn config(&self) -> &Config {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::BridgeConfig;
    
    #[tokio::test]
    async fn test_create_bridge() {
        let config = Config {
            bridge: BridgeConfig {
                wallet_adapter_path: "darkswap-wallet-adapter".to_string(),
                network_adapter_path: "darkswap-network-adapter".to_string(),
                storage_dir: "./storage".to_string(),
                auto_start: false,
                auto_connect: false,
            },
            integration: None,
            api: None,
            websocket: None,
        };
        
        let bridge = DarkSwapBridge::new(config).await;
        assert!(bridge.is_ok());
    }
}