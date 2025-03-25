//! DarkSwap SDK
//!
//! This is the main entry point for the DarkSwap SDK, a decentralized peer-to-peer
//! trading platform for Bitcoin, runes, and alkanes.

pub mod config;
pub mod error;
pub mod types;
pub mod network;
pub mod orderbook;
pub mod trade;
pub mod bitcoin_utils;
pub mod runes;
pub mod alkanes;

#[cfg(feature = "wasm")]
pub mod wasm;

use crate::config::Config;
use crate::error::{Error, Result};
use crate::network::{Network, NetworkEvent};
use crate::orderbook::{Order, OrderSide, OrderStatus, Orderbook};
use crate::trade::{Trade, TradeStatus};
use crate::types::{Asset, OrderId, PeerId, RuneId, AlkaneId, TradeId};
pub use crate::types::Event;
use crate::bitcoin_utils::{BitcoinWallet, PsbtUtils, SimpleWallet};
use crate::runes::{Rune, RuneTransfer, ThreadSafeRuneProtocol};
use crate::alkanes::{Alkane, AlkaneTransfer, ThreadSafeAlkaneProtocol};

use bitcoin::{Address, Network as BitcoinNetwork, OutPoint, Transaction, TxOut};
use rust_decimal::Decimal;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

/// DarkSwap SDK
pub struct DarkSwap {
    /// Configuration
    config: Config,
    /// Network
    network: Option<Network>,
    /// Orderbook
    orderbook: Arc<Mutex<Orderbook>>,
    /// Bitcoin wallet
    wallet: Option<Box<dyn BitcoinWallet>>,
    /// Runes protocol
    runes_protocol: Option<ThreadSafeRuneProtocol>,
    /// Alkanes protocol
    alkanes_protocol: Option<ThreadSafeAlkaneProtocol>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
    /// Event receiver
    event_receiver: mpsc::Receiver<Event>,
}

impl DarkSwap {
    /// Create a new DarkSwap instance
    pub fn new(config: Config) -> Result<Self> {
        let (event_sender, event_receiver) = mpsc::channel(100);

        Ok(Self {
            config,
            network: None,
            orderbook: Arc::new(Mutex::new(Orderbook::new())),
            wallet: None,
            runes_protocol: None,
            alkanes_protocol: None,
            event_sender,
            event_receiver,
        })
    }

    /// Start DarkSwap
    pub async fn start(&mut self) -> Result<()> {
        // Create network
        let mut network = Network::new(&self.config.network)?;

        // Start network
        network.start().await?;

        // Store network
        self.network = Some(network);

        // Initialize wallet
        if self.wallet.is_none() {
            let wallet = SimpleWallet::new(self.config.bitcoin.network.into())?;
            self.wallet = Some(Box::new(wallet));
        }

        // Initialize runes protocol
        if self.runes_protocol.is_none() {
            let runes_protocol = ThreadSafeRuneProtocol::new(self.config.bitcoin.network.into());
            self.runes_protocol = Some(runes_protocol);
        }

        // Initialize alkanes protocol
        if self.alkanes_protocol.is_none() {
            let alkanes_protocol = ThreadSafeAlkaneProtocol::new(self.config.bitcoin.network.into());
            self.alkanes_protocol = Some(alkanes_protocol);
        }

        // Start event loop
        self.start_event_loop();

        Ok(())
    }

    /// Stop DarkSwap
    pub async fn stop(&mut self) -> Result<()> {
        // Stop network
        if let Some(network) = &mut self.network {
            network.stop().await?;
        }

        // Clear network
        self.network = None;

        Ok(())
    }

    /// Get the next event
    pub async fn next_event(&mut self) -> Option<Event> {
        self.event_receiver.recv().await
    }

    /// Create an order
    pub async fn create_order(
        &self,
        base_asset: Asset,
        quote_asset: Asset,
        side: crate::orderbook::OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<crate::types::Order> {
        // Check if network is initialized
        let network = self.network.as_ref()
            .ok_or_else(|| Error::NetworkError("Network not initialized".to_string()))?;

        // Create order
        let order_id = OrderId(Uuid::new_v4().to_string());
        let peer_id = network.local_peer_id();
        let expiry_seconds = expiry.unwrap_or(self.config.orderbook.order_expiry);

        // Create orderbook::Order
        let orderbook_order = crate::orderbook::Order::new(
            peer_id,
            base_asset.clone(),
            quote_asset.clone(),
            side,
            amount,
            price,
            expiry_seconds,
        );

        // Convert to types::Order for events
        let order = crate::types::Order {
            id: orderbook_order.id.clone(),
            maker: orderbook_order.maker.clone(),
            base_asset,
            quote_asset,
            side: match side {
                crate::orderbook::OrderSide::Buy => crate::types::OrderSide::Buy,
                crate::orderbook::OrderSide::Sell => crate::types::OrderSide::Sell,
            },
            amount,
            price,
            status: crate::types::OrderStatus::Open,
            timestamp: orderbook_order.timestamp,
            expiry: orderbook_order.expiry,
        };

        // Clone orderbook_order for broadcasting
        let orderbook_order_clone = orderbook_order.clone();
        
        // Add order to orderbook
        {
            let mut orderbook = self.orderbook.lock().await;
            orderbook.add_order(orderbook_order);
        }

        // Broadcast order - use orderbook_order_clone for network message
        network.broadcast_message(crate::network::MessageType::Order(orderbook_order_clone)).await?;

        // Send event
        let _ = self.event_sender.send(Event::OrderCreated(order.clone())).await;

        Ok(order)
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &OrderId) -> Result<()> {
        // Check if network is initialized
        let network = self.network.as_ref()
            .ok_or_else(|| Error::NetworkError("Network not initialized".to_string()))?;

        // Get order from orderbook
        let mut order = {
            let mut orderbook = self.orderbook.lock().await;
            
            let order = orderbook.get_order(order_id)
                .ok_or_else(|| Error::OrderNotFound(order_id.to_string()))?
                .clone();
            
            // Check if order is open
            if order.status != OrderStatus::Open {
                return Err(Error::OrderNotOpen);
            }
            
            // Check if order belongs to this peer
            if order.maker != network.local_peer_id() {
                return Err(Error::InvalidOrder("Order does not belong to this peer".to_string()));
            }
            
            // Cancel order
            orderbook.cancel_order(order_id)?;
            
            order
        };
        
        // Update order status
        order.cancel();
        
        // Broadcast cancellation
        network.broadcast_message(crate::network::MessageType::CancelOrder(order_id.clone())).await?;
        
        // Send event
        let _ = self.event_sender.send(Event::OrderCanceled(order_id.clone())).await;
        
        Ok(())
    }

    /// Take an order
    pub async fn take_order(&self, order_id: &OrderId, amount: Decimal) -> Result<crate::types::Trade> {
        // Check if network is initialized
        let network = self.network.as_ref()
            .ok_or_else(|| Error::NetworkError("Network not initialized".to_string()))?;

        // Get order from orderbook
        let order = {
            let orderbook = self.orderbook.lock().await;
            
            orderbook.get_order(order_id)
                .ok_or_else(|| Error::OrderNotFound(order_id.to_string()))?
                .clone()
        };
        
        // Check if order is open
        if order.status != OrderStatus::Open {
            return Err(Error::OrderNotOpen);
        }
        
        // Check if amount is valid
        if amount <= Decimal::ZERO || amount > order.amount {
            return Err(Error::InvalidTradeAmount);
        }
        
        // Create trade using trade::Trade
        let trade_impl = crate::trade::Trade::new(&order, network.local_peer_id(), amount);
        
        // Convert to types::Trade for events
        let trade = crate::types::Trade {
            id: trade_impl.id.clone(),
            order_id: trade_impl.order_id.clone(),
            maker: trade_impl.maker.clone(),
            taker: trade_impl.taker.clone(),
            base_asset: trade_impl.base_asset.clone(),
            quote_asset: trade_impl.quote_asset.clone(),
            side: match trade_impl.side {
                crate::orderbook::OrderSide::Buy => crate::types::OrderSide::Buy,
                crate::orderbook::OrderSide::Sell => crate::types::OrderSide::Sell,
            },
            amount: trade_impl.amount,
            price: trade_impl.price,
            status: crate::types::TradeStatus::Pending,
            timestamp: trade_impl.timestamp,
            txid: trade_impl.txid.clone(),
        };
        
        // Send trade request to maker
        let trade_request = crate::network::MessageType::TradeRequest(
            trade_impl.id.clone(),
            network.local_peer_id(),
            order_id.clone(),
        );
        
        network.send_message(order.maker.clone(), trade_request).await?;
        
        // Send event
        let _ = self.event_sender.send(Event::TradeStarted(trade.clone())).await;
        
        Ok(trade)
    }

    /// Get orders for a given asset pair
    pub async fn get_orders(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<Vec<Order>> {
        let orderbook = self.orderbook.lock().await;
        
        Ok(orderbook.get_orders(base_asset, quote_asset))
    }

    /// Get the best bid and ask for a given asset pair
    pub async fn get_best_bid_ask(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<(Option<Decimal>, Option<Decimal>)> {
        let orderbook = self.orderbook.lock().await;
        
        Ok(orderbook.get_best_bid_ask(base_asset, quote_asset))
    }

    /// Register a rune
    pub fn register_rune(&self, rune: Rune) -> Result<()> {
        let runes_protocol = self.runes_protocol.as_ref()
            .ok_or_else(|| Error::RuneError("Runes protocol not initialized".to_string()))?;
        
        runes_protocol.register_rune(rune)
    }

    /// Get a rune by ID
    pub fn get_rune(&self, rune_id: &RuneId) -> Result<Option<Rune>> {
        let runes_protocol = self.runes_protocol.as_ref()
            .ok_or_else(|| Error::RuneError("Runes protocol not initialized".to_string()))?;
        
        runes_protocol.get_rune(rune_id)
    }

    /// Get all runes
    pub fn get_runes(&self) -> Result<Vec<Rune>> {
        let runes_protocol = self.runes_protocol.as_ref()
            .ok_or_else(|| Error::RuneError("Runes protocol not initialized".to_string()))?;
        
        runes_protocol.get_runes()
    }

    /// Create a rune transfer
    pub async fn create_rune_transfer(
        &self,
        rune_id: &RuneId,
        to: &Address,
        amount: u64,
        memo: Option<String>,
    ) -> Result<Transaction> {
        // Check if runes protocol is initialized
        let runes_protocol = self.runes_protocol.as_ref()
            .ok_or_else(|| Error::RuneError("Runes protocol not initialized".to_string()))?;
        
        // Check if wallet is initialized
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| Error::WalletError("Wallet not initialized".to_string()))?;
        
        // Get from address
        let from = wallet.get_address(0)?;
        
        // Create transfer - convert addresses to NetworkUnchecked
        let from_unchecked = bitcoin::Address::new(from.network, from.payload.clone());
        let to_unchecked = bitcoin::Address::new(to.network, to.payload.clone());
        
        let transfer = runes_protocol.create_transfer(rune_id, &from_unchecked, &to_unchecked, amount, memo)?;
        
        // Get UTXOs
        let utxos = wallet.get_utxos()?;
        
        // Create transaction
        let tx = runes_protocol.create_transaction(
            &transfer,
            utxos,
            &from,
            self.config.bitcoin.fee_rate,
        )?;
        
        Ok(tx)
    }

    /// Register an alkane
    pub fn register_alkane(&self, alkane: Alkane) -> Result<()> {
        let alkanes_protocol = self.alkanes_protocol.as_ref()
            .ok_or_else(|| Error::AlkaneError("Alkanes protocol not initialized".to_string()))?;
        
        alkanes_protocol.register_alkane(alkane)
    }

    /// Get an alkane by ID
    pub fn get_alkane(&self, alkane_id: &AlkaneId) -> Result<Option<Alkane>> {
        let alkanes_protocol = self.alkanes_protocol.as_ref()
            .ok_or_else(|| Error::AlkaneError("Alkanes protocol not initialized".to_string()))?;
        
        alkanes_protocol.get_alkane(alkane_id)
    }

    /// Get all alkanes
    pub fn get_alkanes(&self) -> Result<Vec<Alkane>> {
        let alkanes_protocol = self.alkanes_protocol.as_ref()
            .ok_or_else(|| Error::AlkaneError("Alkanes protocol not initialized".to_string()))?;
        
        alkanes_protocol.get_alkanes()
    }

    /// Create an alkane transfer
    pub async fn create_alkane_transfer(
        &self,
        alkane_id: &AlkaneId,
        to: &Address,
        amount: u64,
        memo: Option<String>,
    ) -> Result<Transaction> {
        // Check if alkanes protocol is initialized
        let alkanes_protocol = self.alkanes_protocol.as_ref()
            .ok_or_else(|| Error::AlkaneError("Alkanes protocol not initialized".to_string()))?;
        
        // Check if wallet is initialized
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| Error::WalletError("Wallet not initialized".to_string()))?;
        
        // Get from address
        let from = wallet.get_address(0)?;
        
        // Create transfer - convert addresses to NetworkUnchecked
        let from_unchecked = bitcoin::Address::new(from.network, from.payload.clone());
        let to_unchecked = bitcoin::Address::new(to.network, to.payload.clone());
        
        let transfer = alkanes_protocol.create_transfer(alkane_id, &from_unchecked, &to_unchecked, amount, memo)?;
        
        // Get UTXOs
        let utxos = wallet.get_utxos()?;
        
        // Create transaction
        let tx = alkanes_protocol.create_transaction(
            &transfer,
            utxos,
            &from,
            self.config.bitcoin.fee_rate,
        )?;
        
        Ok(tx)
    }

    /// Start the event loop
    fn start_event_loop(&self) -> Result<()> {
        // Clone what we need for the event loop
        let network = self.network.clone();
        let orderbook = self.orderbook.clone();
        let event_sender = self.event_sender.clone();
        let runes_protocol = self.runes_protocol.clone();
        let alkanes_protocol = self.alkanes_protocol.clone();

        // Instead of spawning a task, we'll start a background task in a separate function
        // This avoids the Send requirement for the Network type
        self.start_network_event_handler(network, event_sender, runes_protocol, alkanes_protocol);

        Ok(())
    }

    /// Start a background task to handle network events
    fn start_network_event_handler(
        &self,
        network: Option<network::Network>,
        event_sender: tokio::sync::mpsc::Sender<Event>,
        runes_protocol: Option<ThreadSafeRuneProtocol>,
        alkanes_protocol: Option<ThreadSafeAlkaneProtocol>,
    ) -> Result<()> {
        // Create a new thread to handle network events
        std::thread::spawn(move || {
            // Create a new tokio runtime for this thread
            let rt = match tokio::runtime::Runtime::new() {
                Ok(rt) => rt,
                Err(e) => {
                    eprintln!("Failed to create tokio runtime: {}", e);
                    return;
                }
            };
            
            // Run the async code in the new runtime
            rt.block_on(async {
                if let Some(mut network) = network {
                    let mut network_events = network.event_receiver().await;

                    while let Some(event) = network_events.recv().await {
                        match event {
                            network::NetworkEvent::PeerConnected(peer_id) => {
                                // Send peer connected event
                                let _ = event_sender.send(Event::Network(types::NetworkEvent::PeerConnected(peer_id.clone()))).await;
                            }
                            network::NetworkEvent::PeerDisconnected(peer_id) => {
                                // Send peer disconnected event
                                let _ = event_sender.send(Event::Network(types::NetworkEvent::PeerDisconnected(peer_id.clone()))).await;
                            }
                            network::NetworkEvent::MessageReceived { from, message } => {
                                // Handle message
                                match message {
                                    crate::network::MessageType::Order(order) => {
                                        // We can't access self.orderbook here, so we'll just log the order
                                        println!("Received order: {:?}", order);

                                        // Convert orderbook::Order to types::Order
                                        // First convert the side enum
                                        let types_side = match order.side {
                                            orderbook::OrderSide::Buy => types::OrderSide::Buy,
                                            orderbook::OrderSide::Sell => types::OrderSide::Sell,
                                        };
                                        
                                        // Then convert the status enum
                                        let types_status = match order.status {
                                            orderbook::OrderStatus::Open => types::OrderStatus::Open,
                                            orderbook::OrderStatus::Filled => types::OrderStatus::Filled,
                                            orderbook::OrderStatus::Canceled => types::OrderStatus::Canceled,
                                            orderbook::OrderStatus::Expired => types::OrderStatus::Expired,
                                        };
                                        
                                        // Create the types::Order with the correct fields
                                        let types_order = types::Order {
                                            id: order.id.clone(),
                                            maker: order.maker.clone(),
                                            base_asset: order.base_asset.clone(),
                                            quote_asset: order.quote_asset.clone(),
                                            side: types_side,
                                            price: order.price.clone(),
                                            amount: order.amount.clone(),
                                            status: types_status,
                                            timestamp: order.timestamp,
                                            expiry: order.expiry,
                                        };
                                        
                                        // Send order created event
                                        let _ = event_sender.send(Event::OrderCreated(types_order)).await;
                                    }
                                    crate::network::MessageType::CancelOrder(order_id) => {
                                        // We can't access self.orderbook here, so we'll just log the order cancellation
                                        println!("Received order cancellation: {:?}", order_id);

                                        // Send order canceled event
                                        let _ = event_sender.send(Event::OrderCanceled(order_id)).await;
                                    }
                                    crate::network::MessageType::TradeRequest(trade_id, taker, order_id) => {
                                        // Handle trade request
                                        // In a real implementation, this would validate the trade request
                                        // and respond with a trade response
                                        // For now, we'll just send a trade response
                                        let _ = network.send_message(
                                            taker.clone(),
                                            crate::network::MessageType::TradeResponse(trade_id, true),
                                        ).await;
                                    }
                                    crate::network::MessageType::TradeResponse(trade_id, accepted) => {
                                        // Handle trade response
                                        // In a real implementation, this would update the trade status
                                        // and proceed with the trade if accepted
                                        // For now, we'll just log the response
                                        println!("Trade response: {} {}", trade_id, if accepted { "accepted" } else { "rejected" });
                                    }
                                    crate::network::MessageType::Psbt(trade_id, psbt_bytes) => {
                                        // Handle PSBT
                                        // In a real implementation, this would validate and sign the PSBT
                                        // For now, we'll just log the PSBT
                                        println!("PSBT received for trade {}: {} bytes", trade_id, psbt_bytes.len());
                                    }
                                    crate::network::MessageType::Transaction(trade_id, txid) => {
                                        // Handle transaction
                                        // In a real implementation, this would validate and broadcast the transaction
                                        // For now, we'll just log the transaction
                                        println!("Transaction received for trade {}: {}", trade_id, txid);
                                    }
                                    crate::network::MessageType::Ping => {
                                        // Respond with pong
                                        let _ = network.send_message(
                                            from.clone(),
                                            crate::network::MessageType::Pong,
                                        ).await;
                                    }
                                    crate::network::MessageType::Pong => {
                                        // Handle pong
                                        // For now, we'll just log the pong
                                        println!("Pong received from {}", from);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });
        
        Ok(())
    }
}