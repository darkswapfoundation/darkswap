//! External service integrations for DarkSwap Bridge
//!
//! This module provides integrations with external services such as
//! price feeds, block explorers, and wallet services.

pub mod price_feed;
pub mod block_explorer;
pub mod wallet_service;

use serde::{Deserialize, Serialize};

/// Integration configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationConfig {
    /// Price feed configuration
    pub price_feed: Option<price_feed::PriceFeedConfig>,
    /// Block explorer configuration
    pub block_explorer: Option<block_explorer::BlockExplorerConfig>,
    /// Wallet service configuration
    pub wallet_service: Option<wallet_service::WalletServiceConfig>,
}

impl Default for IntegrationConfig {
    fn default() -> Self {
        Self {
            price_feed: Some(price_feed::PriceFeedConfig::default()),
            block_explorer: Some(block_explorer::BlockExplorerConfig::default()),
            wallet_service: None,
        }
    }
}

/// Integration manager
pub struct IntegrationManager {
    /// Price feed service
    price_feed: Option<price_feed::PriceFeedService>,
    /// Block explorer service
    block_explorer: Option<block_explorer::BlockExplorerService>,
    /// Wallet service
    wallet_service: Option<wallet_service::WalletService>,
}

impl IntegrationManager {
    /// Create a new integration manager
    pub fn new(config: IntegrationConfig) -> Self {
        let price_feed = config.price_feed.map(|cfg| price_feed::PriceFeedService::new(cfg));
        let block_explorer = config.block_explorer.map(|cfg| block_explorer::BlockExplorerService::new(cfg));
        let wallet_service = config.wallet_service.map(|cfg| wallet_service::WalletService::new(cfg));
        
        Self {
            price_feed,
            block_explorer,
            wallet_service,
        }
    }

    /// Start all integration services
    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(price_feed) = &self.price_feed {
            price_feed.start().await?;
        }
        
        Ok(())
    }

    /// Get price feed service
    pub fn price_feed(&self) -> Option<&price_feed::PriceFeedService> {
        self.price_feed.as_ref()
    }

    /// Get block explorer service
    pub fn block_explorer(&self) -> Option<&block_explorer::BlockExplorerService> {
        self.block_explorer.as_ref()
    }

    /// Get wallet service
    pub fn wallet_service(&self) -> Option<&wallet_service::WalletService> {
        self.wallet_service.as_ref()
    }
}