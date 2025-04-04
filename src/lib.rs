//! DarkSwap SDK
//!
//! This is the main entry point for the DarkSwap SDK, a decentralized peer-to-peer
//! trading platform for Bitcoin, runes, and alkanes.

pub mod config;
pub mod orderbook;
pub mod p2p;
pub mod trade;
pub mod types;
pub mod wallet;
#[cfg(feature = "wasm")]
pub mod wasm;

use std::sync::Arc;

use anyhow::{Result};
use log::{info};
use tokio::sync::{mpsc, RwLock};

use config::Config;
use orderbook::{Order, OrderId, OrderSide, OrderStatus, Orderbook};
use p2p::{circuit_relay::CircuitRelayManager, webrtc_transport::DarkSwapWebRtcTransport, P2PNetwork};
use trade::{Trade, TradeId, TradeManager};
use types::{Asset, Event};
use wallet::{bdk_wallet::BdkWallet, simple_wallet::SimpleWallet, WalletInterface};

/// DarkSwap SDK
pub struct DarkSwap {
    /// Configuration
    config: Config,
    /// P2P network
    pub network: Option<Arc<RwLock<P2PNetwork>>>,
    /// WebRTC transport
    webrtc_transport: Option<Arc<DarkSwapWebRtcTransport>>,
    /// Circuit relay manager
    circuit_relay: Option<CircuitRelayManager>,
    /// Wallet
    wallet: Option<Arc<dyn WalletInterface + Send + Sync>>,
    /// Orderbook
    orderbook: Option<Arc<Orderbook>>,
    /// Trade manager
    trade_manager: Option<Arc<TradeManager>>,
    /// Event channel
    event_channel: (mpsc::Sender<Event>, mpsc::Receiver<Event>),
}

impl DarkSwap {
    /// Create a new DarkSwap instance
    pub fn new(config: Config) -> Result<Self> {
        // Create event channel
        let (event_sender, event_receiver) = mpsc::channel(100);
        
        Ok(Self {
            config,
            network: None,
            webrtc_transport: None,
            circuit_relay: None,
            wallet: None,
            orderbook: None,
            trade_manager: None,
            event_channel: (event_sender, event_receiver),
        })
    }

    /// Start DarkSwap
    pub async fn start(&mut self) -> Result<()> {
        // Initialize wallet
        self.init_wallet().await?;
        
        // Initialize P2P network
        self.init_network().await?;
        
        // Initialize orderbook
        self.init_orderbook().await?;
        
        // Initialize trade manager
        self.init_trade_manager().await?;
        
        info!("DarkSwap started successfully");
        
        Ok(())
    }

    /// Initialize wallet
    async fn init_wallet(&mut self) -> Result<()> {
        let wallet: Arc<dyn WalletInterface + Send + Sync> = match self.config.wallet.wallet_type.as_str() {
            "bdk" => {
                // Create BDK wallet
                let mnemonic = self.config.wallet.mnemonic.as_deref()
                    .ok_or_else(|| anyhow::anyhow!("Mnemonic required for BDK wallet"))?;
                
                let derivation_path = self.config.wallet.derivation_path.as_deref()
                    .unwrap_or("m/84'/0'/0'/0/0");
                
                let bdk_wallet = BdkWallet::from_mnemonic(
                    mnemonic,
                    None,
                    derivation_path,
                    self.config.bitcoin.network,
                ).await?;
                
                Arc::new(bdk_wallet)
            }
            "simple" | _ => {
                // Create simple wallet
                let simple_wallet = SimpleWallet::new(
                    self.config.wallet.private_key.as_deref(),
                    self.config.bitcoin.network,
                )?;
                
                Arc::new(simple_wallet)
            }
        };
        
        self.wallet = Some(wallet);
        
        info!("Wallet initialized successfully");
        
        Ok(())
    }

    /// Initialize P2P network
    async fn init_network(&mut self) -> Result<()> {
        // Create P2P network
        let network = P2PNetwork::new(&self.config, self.event_channel.0.clone())?;
        let network = Arc::new(RwLock::new(network));
        
        // Start P2P network
        network.write().await.start().await?;
        
        self.network = Some(network);
        
        info!("P2P network initialized successfully");
        
        Ok(())
    }

    /// Initialize orderbook
    async fn init_orderbook(&mut self) -> Result<()> {
        // Get network and wallet
        let network = self.network.as_ref()
            .ok_or_else(|| anyhow::anyhow!("P2P network not initialized"))?;
        
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Wallet not initialized"))?;
        
        // Create orderbook
        let orderbook = Orderbook::new(
            network.clone(),
            wallet.clone(),
            self.event_channel.0.clone(),
        );
        
        let orderbook = Arc::new(orderbook);
        
        // Start orderbook
        orderbook.start().await?;
        
        self.orderbook = Some(orderbook);
        
        info!("Orderbook initialized successfully");
        
        Ok(())
    }

    /// Initialize trade manager
    async fn init_trade_manager(&mut self) -> Result<()> {
        // Get network and wallet
        let network = self.network.as_ref()
            .ok_or_else(|| anyhow::anyhow!("P2P network not initialized"))?;
        
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Wallet not initialized"))?;
        
        // Create trade manager
        let trade_manager = TradeManager::new(
            network.clone(),
            wallet.clone(),
            self.event_channel.0.clone(),
        );
        
        let trade_manager = Arc::new(trade_manager);
        
        // Start trade manager
        trade_manager.start().await?;
        
        self.trade_manager = Some(trade_manager);
        
        info!("Trade manager initialized successfully");
        
        Ok(())
    }

    /// Stop DarkSwap
    pub async fn stop(&mut self) -> Result<()> {
        // Stop P2P network
        if let Some(network) = &self.network {
            network.write().await.stop().await?;
        }
        
        // Clear state
        self.network = None;
        self.webrtc_transport = None;
        self.circuit_relay = None;
        self.wallet = None;
        self.orderbook = None;
        self.trade_manager = None;
        
        info!("DarkSwap stopped successfully");
        
        Ok(())
    }

    /// Wait for the next event
    pub async fn next_event(&mut self) -> Option<Event> {
        self.event_channel.1.recv().await
    }

    /// Create an order
    pub async fn create_order(
        &self,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: rust_decimal::Decimal,
        price: rust_decimal::Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        let orderbook = self.orderbook.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Orderbook not initialized"))?;
        
        orderbook.create_order(base_asset, quote_asset, side, amount, price, expiry).await
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &OrderId) -> Result<()> {
        let orderbook = self.orderbook.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Orderbook not initialized"))?;
        
        orderbook.cancel_order(order_id).await
    }

    /// Get an order by ID
    pub async fn get_order(&self, order_id: &OrderId) -> Result<Order> {
        let orderbook = self.orderbook.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Orderbook not initialized"))?;
        
        orderbook.get_order(order_id).await
    }

    /// Get orders for a pair
    pub async fn get_orders(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<Vec<Order>> {
        let orderbook = self.orderbook.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Orderbook not initialized"))?;
        
        orderbook.get_orders(base_asset, quote_asset).await
    }

    /// Get best bid and ask for a pair
    pub async fn get_best_bid_ask(
        &self,
        base_asset: &Asset,
        quote_asset: &Asset,
    ) -> Result<(Option<rust_decimal::Decimal>, Option<rust_decimal::Decimal>)> {
        let orderbook = self.orderbook.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Orderbook not initialized"))?;
        
        orderbook.get_best_bid_ask(base_asset, quote_asset).await
    }

    /// Take an order
    pub async fn take_order(
        &self,
        order_id: &OrderId,
        amount: rust_decimal::Decimal,
    ) -> Result<Trade> {
        // Get order
        let orderbook = self.orderbook.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Orderbook not initialized"))?;
        
        let order = orderbook.get_order(order_id).await?;
        
        // Create trade
        let trade_manager = self.trade_manager.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Trade manager not initialized"))?;
        
        trade_manager.create_trade(&order, amount).await
    }

    /// Get a trade by ID
    pub async fn get_trade(&self, trade_id: &TradeId) -> Result<Trade> {
        let trade_manager = self.trade_manager.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Trade manager not initialized"))?;
        
        trade_manager.get_trade(trade_id).await
    }

    /// Get all trades
    pub async fn get_trades(&self) -> Result<Vec<Trade>> {
        let trade_manager = self.trade_manager.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Trade manager not initialized"))?;
        
        Ok(trade_manager.get_trades().await)
    }

    /// Cancel a trade
    pub async fn cancel_trade(&self, trade_id: &TradeId, reason: &str) -> Result<()> {
        let trade_manager = self.trade_manager.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Trade manager not initialized"))?;
        
        trade_manager.cancel_trade(trade_id, reason).await
    }

    /// Get wallet address
    pub async fn get_address(&self) -> Result<String> {
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Wallet not initialized"))?;
        
        wallet.get_address().await
    }

    /// Get wallet balance
    pub async fn get_balance(&self) -> Result<u64> {
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Wallet not initialized"))?;
        
        wallet.get_balance().await
    }

    /// Get asset balance
    pub async fn get_asset_balance(&self, asset: &Asset) -> Result<u64> {
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Wallet not initialized"))?;
        
        wallet.get_asset_balance(asset).await
    }

    /// Get runes
    pub async fn get_runes(&self) -> Result<Vec<types::Rune>> {
        // TODO: Implement rune lookup
        Ok(vec![])
    }

    /// Get rune by ID
    pub async fn get_rune(&self, _rune_id: u128) -> Result<Option<types::Rune>> {
        // TODO: Implement rune lookup
        Ok(None)
    }

    /// Get alkanes
    pub async fn get_alkanes(&self) -> Result<Vec<types::Alkane>> {
        // TODO: Implement alkane lookup
        Ok(vec![])
    }

    /// Get alkane by ID
    pub async fn get_alkane(&self, _alkane_id: &types::AlkaneId) -> Result<Option<types::Alkane>> {
        // TODO: Implement alkane lookup
        Ok(None)
    }

    /// Subscribe to events
    pub async fn subscribe_to_events(&self) -> mpsc::Receiver<Event> {
        let (sender, receiver) = mpsc::channel(100);
        
        // Clone the event sender
        let mut event_receiver = self.event_channel.1.resubscribe();
        
        // Spawn a task to forward events
        tokio::spawn(async move {
            while let Some(event) = event_receiver.recv().await {
                let _ = sender.send(event).await;
            }
        });
        
        receiver
    }
}