//! DarkSwap SDK
//!
//! This crate provides the DarkSwap SDK, a library for interacting with the DarkSwap protocol.

#![cfg_attr(not(feature = "std"), no_std)]

use crate::wallet::{Wallet, WalletInterface};

#[cfg(feature = "std")]
pub mod alkanes;
pub mod config;
pub mod error;
pub mod network;
pub mod orderbook;
pub mod p2p;
pub mod runes;
pub mod trade;
pub mod types;
pub mod wallet;

// Register the modules
pub mod bitcoin_utils;
pub mod runestone;

#[cfg(feature = "wasm")]
pub mod wasm;

// Temporarily comment out bridge feature until it's added to Cargo.toml
// #[cfg(feature = "bridge")]
// pub mod bridge_integration;

use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use std::time::Duration;

use config::Config;
use error::{Error, Result};
use orderbook::{Order, OrderSide};
use p2p::P2PNetwork;
use rust_decimal::Decimal;
use types::{Asset, Event, OrderId, TradeId};
use wallet::simple_wallet::SimpleWallet;

/// DarkSwap
pub struct DarkSwap {
    /// Configuration
    pub config: Config,
    /// P2P network
    pub network: Arc<RwLock<P2PNetwork>>,
    /// Wallet
    pub wallet: Arc<SimpleWallet>,
    /// Orderbook
    pub orderbook: Arc<orderbook::Orderbook>,
}

impl DarkSwap {
    /// Create a new DarkSwap instance
    pub fn new(config: Config) -> Result<Self> {
        // Create a wallet
        let wallet = Arc::new(SimpleWallet::new(None, config.wallet.bitcoin_network)?);

        // Create an orderbook
        // Create event channel
        let (event_sender, _event_receiver) = mpsc::channel(100);
        
        // Create orderbook with required parameters
        let orderbook = Arc::new(orderbook::Orderbook::new(
            wallet.clone(),
            event_sender,
            Duration::from_secs(config.orderbook.cleanup_interval),
        ));

        // Create a P2P network
        let network = Arc::new(RwLock::new(P2PNetwork::default()));

        Ok(Self {
            config,
            network,
            wallet,
            orderbook,
        })
    }

    /// Start DarkSwap
    pub async fn start(&mut self) -> Result<()> {
        // Start the P2P network
        let network = self.network.write().await;
        network.start().await?;

        Ok(())
    }

    /// Stop DarkSwap
    pub async fn stop(&mut self) -> Result<()> {
        // Stop the P2P network
        let network = self.network.write().await;
        network.stop().await?;

        Ok(())
    }

    /// Get the next event
    pub async fn next_event(&self) -> Result<Option<Event>> {
        // Create a channel for events
        let (_sender, mut receiver) = mpsc::channel::<Event>(100);

        // Wait for an event
        let event = receiver.recv().await;

        Ok(event)
    }

    /// Get the wallet address
    pub async fn get_address(&self) -> Result<bitcoin::Address> {
        let address_str = Wallet::get_address(&*self.wallet)?;
        use std::str::FromStr;
        let wrapper = bitcoin_utils::AddressWrapper::from_str(&address_str)
            .map_err(|e| Error::WalletError(format!("Failed to parse address: {}", e)))?;
        Ok(wrapper.0)
        // Line removed as it's replaced by the code above
    }

    /// Get the wallet balance
    pub async fn get_balance(&self) -> Result<u64> {
        Wallet::get_balance(&*self.wallet).map_err(|e| Error::WalletError(e.to_string()))
    }

    /// Get the asset balance
    pub async fn get_asset_balance(&self, asset: &Asset) -> Result<u64> {
        WalletInterface::get_asset_balance(&*self.wallet, asset).await.map_err(|e| Error::WalletError(e.to_string()))
    }

    /// Create an order
    pub async fn create_order(
        &self,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        maker_address: String,
        expiry: std::time::Duration,
    ) -> Result<orderbook::Order> {
        // Create an order
        let _order_id = OrderId::new();
        let order = self.orderbook.create_order(
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            maker_address,
            expiry,
        ).await?;

        Ok(order)
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &OrderId) -> Result<()> {
        self.orderbook.cancel_order(order_id).await.map_err(|e| Error::OrderBookError(e.to_string())).map(|_| ())
    }

    /// Take an order
    pub async fn take_order(&self, order_id: &OrderId, _amount: Decimal) -> Result<TradeId> {
        // Get the order
        let _order = self.orderbook.get_order(order_id).await.map_err(|e| Error::OrderBookError(e.to_string()))?;

        // Create a trade ID
        let trade_id = TradeId::new();

        Ok(trade_id)
    }

    /// Get the best bid and ask prices
    pub async fn get_best_bid_ask(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<(Option<Decimal>, Option<Decimal>)> {
        let best_bid = self.orderbook.get_best_bid_price(base_asset, quote_asset).await.map_err(|e| Error::OrderBookError(e.to_string()))?;
        let best_ask = self.orderbook.get_best_ask_price(base_asset, quote_asset).await.map_err(|e| Error::OrderBookError(e.to_string()))?;

        Ok((best_bid, best_ask))
    }

    /// Create a BTC/Rune order
    pub async fn create_btc_rune_order(
        &self,
        rune_id: u64,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry_seconds: Option<u64>,
    ) -> Result<Order> {
        // Create the base and quote assets
        let base_asset = Asset::Rune(rune_id);
        let quote_asset = Asset::Bitcoin;

        // Convert expiry seconds to Duration
        let expiry = match expiry_seconds {
            Some(seconds) => std::time::Duration::from_secs(seconds),
            None => std::time::Duration::from_secs(3600), // Default to 1 hour
        };

        // Create the order
        self.create_order(
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            "".to_string(), // Empty maker address for now
            expiry,
        ).await
    }

    /// Get BTC/Rune orders
    pub async fn get_btc_rune_orders(&self, rune_id: u64) -> Result<Vec<Order>> {
        // Create the base and quote assets
        let base_asset = Asset::Rune(rune_id);
        let quote_asset = Asset::Bitcoin;

        // Get orders
        self.orderbook.get_orders(Some(base_asset), Some(quote_asset), None, None).await.map_err(|e| Error::OrderBookError(e.to_string()))
    }

    /// Get the best bid and ask prices for BTC/Rune
    pub async fn get_btc_rune_best_bid_ask(&self, rune_id: u64) -> Result<(Option<Decimal>, Option<Decimal>)> {
        // Create the base and quote assets
        let base_asset = Asset::Rune(rune_id);
        let quote_asset = Asset::Bitcoin;

        // Get the best bid and ask prices
        self.get_best_bid_ask(&base_asset, &quote_asset).await
    }

    /// Get an order by ID
    pub async fn get_order(&self, order_id: &OrderId) -> Result<Order> {
        self.orderbook.get_order(order_id).await.map_err(|e| Error::OrderBookError(e.to_string()))
    }
}