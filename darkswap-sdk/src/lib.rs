//! DarkSwap SDK
//!
//! This crate provides the DarkSwap SDK for interacting with the DarkSwap protocol.

#![warn(missing_docs)]
#![warn(rustdoc::missing_doc_code_examples)]

pub mod error;
pub mod network;
pub mod orderbook;
pub mod trade;
pub mod types;
pub mod wallet;
pub mod wasm;
pub mod bridge_integration;

use std::sync::Arc;

use log::{debug, error, info, warn};

use crate::error::{Error, Result};
use crate::network::Network;
use crate::orderbook::OrderBook;
use crate::trade::TradeManager;
use crate::wallet::Wallet;

/// DarkSwap SDK
pub struct DarkSwap {
    /// Wallet
    wallet: Arc<dyn Wallet>,
    /// Network
    network: Arc<dyn Network>,
    /// Order book
    orderbook: Arc<OrderBook>,
    /// Trade manager
    trade_manager: Arc<TradeManager>,
}

impl DarkSwap {
    /// Create a new DarkSwap instance
    pub fn new(
        wallet: Arc<dyn Wallet>,
        network: Arc<dyn Network>,
        orderbook: Arc<OrderBook>,
        trade_manager: Arc<TradeManager>,
    ) -> Self {
        Self {
            wallet,
            network,
            orderbook,
            trade_manager,
        }
    }

    /// Create a new DarkSwap instance with a bridge integration
    pub fn with_bridge(config: bridge_integration::BridgeConfig) -> Result<Self> {
        // Create bridge integration
        let mut bridge = bridge_integration::BridgeIntegration::new(config);
        
        // Start bridge
        tokio::runtime::Runtime::new()
            .map_err(|e| Error::RuntimeError(format!("Failed to create runtime: {}", e)))?
            .block_on(async {
                bridge.start().await
            })?;
        
        // Create components
        let wallet = Arc::new(BridgeWallet::new(bridge.clone()));
        let network = Arc::new(BridgeNetwork::new(bridge.clone()));
        let orderbook = Arc::new(OrderBook::new(network.clone()));
        let trade_manager = Arc::new(TradeManager::new(wallet.clone(), network.clone(), orderbook.clone()));
        
        Ok(Self {
            wallet,
            network,
            orderbook,
            trade_manager,
        })
    }

    /// Get the wallet
    pub fn wallet(&self) -> Arc<dyn Wallet> {
        self.wallet.clone()
    }

    /// Get the network
    pub fn network(&self) -> Arc<dyn Network> {
        self.network.clone()
    }

    /// Get the order book
    pub fn orderbook(&self) -> Arc<OrderBook> {
        self.orderbook.clone()
    }

    /// Get the trade manager
    pub fn trade_manager(&self) -> Arc<TradeManager> {
        self.trade_manager.clone()
    }
}

/// Bridge wallet implementation
struct BridgeWallet {
    /// Bridge integration
    bridge: bridge_integration::BridgeIntegration,
}

impl BridgeWallet {
    /// Create a new bridge wallet
    fn new(bridge: bridge_integration::BridgeIntegration) -> Self {
        Self { bridge }
    }
}

impl Wallet for BridgeWallet {
    // Implement wallet methods using bridge integration
    // ...
}

/// Bridge network implementation
struct BridgeNetwork {
    /// Bridge integration
    bridge: bridge_integration::BridgeIntegration,
}

impl BridgeNetwork {
    /// Create a new bridge network
    fn new(bridge: bridge_integration::BridgeIntegration) -> Self {
        Self { bridge }
    }
}

impl Network for BridgeNetwork {
    // Implement network methods using bridge integration
    // ...
}