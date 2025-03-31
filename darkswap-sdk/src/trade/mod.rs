use std::collections::HashMap;
use std::sync::Arc;

use anyhow::{Context, Result};
use async_trait::async_trait;
use log::info;
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock};
use crate::p2p::P2PNetwork as Network;
use crate::orderbook::{Order, OrderId, OrderSide, OrderStatus};
use crate::types::{Asset, Event, TradeId};

/// Trade module
pub struct TradeModule {
    /// Network module
    network: Arc<RwLock<Network>>,
    
    /// Trades
    trades: Arc<RwLock<HashMap<TradeId, Trade>>>,
    
    /// Trade topic
    trade_topic: String,
    
    /// Event sender
    event_sender: mpsc::Sender<Event>,
    
    /// Wallet
    wallet: Arc<dyn Wallet>,
    
    /// Runes executor
    runes_executor: Arc<dyn RunesExecutor>,
    
    /// Alkanes executor
    alkanes_executor: Arc<dyn AlkanesExecutor>,
}

/// Trade state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeState {
    /// Trade created
    Created,
    
    /// Maker PSBT sent
    MakerPsbtSent,
    
    /// Taker PSBT sent
    TakerPsbtSent,
    
    /// Maker signed
    MakerSigned,
    
    /// Taker signed
    TakerSigned,
    
    /// Trade completed
    Completed,
    
    /// Trade failed
    Failed,
    
    /// Trade canceled
    Canceled,
    
    /// Trade expired
    Expired,
}

/// Trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// Trade ID
    pub id: TradeId,
    
    /// Order ID
    pub order_id: OrderId,
    
    /// Maker peer ID
    pub maker_peer_id: String,
    
    /// Taker peer ID
    pub taker_peer_id: String,
    
    /// Base asset
    pub base_asset: Asset,
    
    /// Quote asset
    pub quote_asset: Asset,
    
    /// Amount
    pub amount: Decimal,
    
    /// Price
    pub price: Decimal,
    
    /// State
    pub state: TradeState,
    
    /// Maker PSBT
    pub maker_psbt: Option<Vec<u8>>,
    
    /// Taker PSBT
    pub taker_psbt: Option<Vec<u8>>,
    
    /// Final PSBT
    pub final_psbt: Option<Vec<u8>>,
    
    /// Transaction ID
    pub txid: Option<String>,
    
    /// Predicate ID
    pub predicate_id: Option<String>,
}

impl Trade {
    /// Create a new trade
    pub fn new(
        order_id: OrderId,
        maker_peer_id: String,
        taker_peer_id: String,
        base_asset: Asset,
        quote_asset: Asset,
        amount: Decimal,
        price: Decimal,
        predicate_id: Option<String>,
    ) -> Self {
        Self {
            id: TradeId(format!("trade-{}", uuid::Uuid::new_v4())),
            order_id,
            maker_peer_id,
            taker_peer_id,
            base_asset,
            quote_asset,
            amount,
            price,
            state: TradeState::Created,
            maker_psbt: None,
            taker_psbt: None,
            final_psbt: None,
            txid: None,
            predicate_id,
        }
    }
    
    /// Update trade state
    pub fn update_state(&mut self, state: TradeState) {
        self.state = state;
    }
}

/// Trade message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeMessage {
    /// Initialize trade
    Initialize {
        /// Trade ID
        trade_id: TradeId,
        
        /// Order ID
        order_id: OrderId,
        
        /// Amount
        amount: Decimal,
    },
    
    /// Send PSBT
    SendPsbt {
        /// Trade ID
        trade_id: TradeId,
        
        /// PSBT
        psbt: Vec<u8>,
    },
    
    /// Sign PSBT
    SignPsbt {
        /// Trade ID
        trade_id: TradeId,
        
        /// Signed PSBT
        signed_psbt: Vec<u8>,
    },
    
    /// Broadcast transaction
    Broadcast {
        /// Trade ID
        trade_id: TradeId,
        
        /// Transaction ID
        txid: String,
    },
    
    /// Cancel trade
    Cancel {
        /// Trade ID
        trade_id: TradeId,
        
        /// Reason
        reason: String,
    },
}

/// Trade error
#[derive(Debug, thiserror::Error)]
pub enum TradeError {
    /// Trade not found
    #[error("Trade not found: {0}")]
    NotFound(TradeId),
    
    /// Invalid state
    #[error("Invalid state: {0}")]
    InvalidState(String),
    
    /// PSBT error
    #[error("PSBT error: {0}")]
    PsbtError(String),
}

/// Wallet trait
#[async_trait]
pub trait Wallet: Send + Sync {
    /// Create trade PSBT
    async fn create_trade_psbt(
        &self,
        trade_id: &TradeId,
        order_id: &OrderId,
        base_asset: &Asset,
        quote_asset: &Asset,
        amount: u64,
        price: u64,
    ) -> Result<Vec<u8>>;
    
    /// Verify PSBT
    async fn verify_psbt(&self, psbt: &[u8]) -> Result<bool>;
    
    /// Sign PSBT
    async fn sign_psbt(&self, psbt: &[u8]) -> Result<Vec<u8>>;
    
    /// Finalize and broadcast PSBT
    async fn finalize_and_broadcast_psbt(&self, psbt: &[u8]) -> Result<String>;
}

/// Runes executor trait
#[async_trait]
pub trait RunesExecutor: Send + Sync {
    /// Create rune trade PSBT
    async fn create_rune_trade_psbt(&self, trade: &Trade, is_maker: bool) -> Result<Vec<u8>>;
    
    /// Verify rune trade PSBT
    async fn verify_rune_trade_psbt(&self, psbt: &[u8], trade: &Trade) -> Result<bool>;
    
    /// Sign rune trade PSBT
    async fn sign_rune_trade_psbt(&self, psbt: &[u8]) -> Result<Vec<u8>>;
    
    /// Finalize and broadcast rune trade PSBT
    async fn finalize_and_broadcast_rune_trade_psbt(&self, psbt: &[u8]) -> Result<String>;
}

/// Alkanes executor trait
#[async_trait]
pub trait AlkanesExecutor: Send + Sync {
    /// Create alkane trade PSBT
    async fn create_alkane_trade_psbt(&self, trade: &Trade, is_maker: bool) -> Result<Vec<u8>>;
    
    /// Verify alkane trade PSBT
    async fn verify_alkane_trade_psbt(&self, psbt: &[u8], trade: &Trade) -> Result<bool>;
    
    /// Sign alkane trade PSBT
    async fn sign_alkane_trade_psbt(&self, psbt: &[u8]) -> Result<Vec<u8>>;
    
    /// Finalize and broadcast alkane trade PSBT
    async fn finalize_and_broadcast_alkane_trade_psbt(&self, psbt: &[u8]) -> Result<String>;
}

impl TradeModule {
    /// Create a new trade module
    pub fn new(
        network: Arc<RwLock<Network>>,
        event_sender: mpsc::Sender<Event>,
        wallet: Arc<dyn Wallet>,
        runes_executor: Arc<dyn RunesExecutor>,
        alkanes_executor: Arc<dyn AlkanesExecutor>,
    ) -> Self {
        Self {
            network,
            trades: Arc::new(RwLock::new(HashMap::new())),
            trade_topic: "darkswap/trade".to_string(),
            event_sender,
            wallet,
            runes_executor,
            alkanes_executor,
        }
    }
    
    /// Initialize trade module
    pub async fn init(&self) -> Result<()> {
        // Subscribe to trade topic
        let mut network = self.network.write().await;
        network.subscribe(&self.trade_topic).await?;
        
        Ok(())
    }
    
    /// Create a new trade
    pub async fn create_trade(
        &self,
        order_id: &OrderId,
        taker_peer_id: String,
        amount: Decimal,
    ) -> Result<Trade> {
        // Get the order
        let order = self.get_order_by_id(order_id).await?;
        
        // Get local peer ID
        let network = self.network.read().await;
        let local_peer_id = network.local_peer_id().to_string();
        
        // Create a new trade
        let trade = Trade::new(
            order_id.clone(),
            order.maker.clone(),
            taker_peer_id,
            order.base_asset.clone(),
            order.quote_asset.clone(),
            amount,
            order.price,
            None,
        );
        
        // Store the trade
        let mut trades = self.trades.write().await;
        trades.insert(trade.id.clone(), trade.clone());
        
        // Send initialize message
        self.send_trade_message(
            &TradeMessage::Initialize {
                trade_id: trade.id.clone(),
                order_id: order_id.clone(),
                amount,
            },
            &order.maker,
        ).await?;
        
        // Send event
        let _ = self.event_sender
            .send(Event::TradeCreated(trade.id.clone()))
            .await;
        
        Ok(trade)
    }
    
    /// Handle trade message
    pub async fn handle_trade_message(
        &self,
        message: TradeMessage,
        peer_id: &str,
    ) -> Result<()> {
        match message {
            TradeMessage::Initialize { trade_id, order_id, amount } => {
                // Get the order
                let order = self.get_order_by_id(&order_id).await?;
                
                // Create a new trade
                let trade = Trade::new(
                    order_id,
                    peer_id.to_string(),
                    self.network.read().await.local_peer_id().to_string(),
                    order.base_asset.clone(),
                    order.quote_asset.clone(),
                    amount,
                    order.price,
                    None,
                );
                
                // Store the trade
                let mut trades = self.trades.write().await;
                trades.insert(trade.id.clone(), trade.clone());
                
                // Send event
                let _ = self.event_sender
                    .send(Event::TradeStarted(trade.id.clone()))
                    .await;
                
                // Create a PSBT based on the asset type
                let psbt = match (&order.base_asset, &order.quote_asset) {
                    (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                        // Create a rune trade PSBT
                        self.runes_executor.create_rune_trade_psbt(&trade, true).await?
                    }
                    (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                        // Create an alkane trade PSBT
                        self.alkanes_executor.create_alkane_trade_psbt(&trade, true).await?
                    }
                    _ => {
                        // Create a regular trade PSBT
                        self.wallet.create_trade_psbt(
                            &trade.id,
                            &trade.order_id,
                            &trade.base_asset,
                            &trade.quote_asset,
                            amount_to_u64(trade.amount)?,
                            price_to_u64(trade.price)?,
                        ).await?
                    }
                };
                
                // Update trade state
                let mut trades = self.trades.write().await;
                let trade = trades.get_mut(&trade_id)
                    .ok_or_else(|| TradeError::NotFound(trade_id.clone()))?;
                trade.maker_psbt = Some(psbt.clone());
                trade.update_state(TradeState::MakerPsbtSent);
                
                // Send PSBT
                self.send_trade_message(
                    &TradeMessage::SendPsbt {
                        trade_id: trade.id.clone(),
                        psbt,
                    },
                    peer_id,
                ).await?;
            }
            TradeMessage::SendPsbt { trade_id, psbt } => {
                // Get trade
                let mut trades = self.trades.write().await;
                let trade = trades.get_mut(&trade_id)
                    .ok_or_else(|| TradeError::NotFound(trade_id.clone()))?;
                
                // Check if peer is maker or taker
                if peer_id == trade.maker_peer_id {
                    // Maker sent PSBT
                    trade.maker_psbt = Some(psbt.clone());
                    trade.update_state(TradeState::MakerPsbtSent);
                    
                    // Verify PSBT based on the asset type
                    let is_valid = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Verify rune trade PSBT
                            self.runes_executor.verify_rune_trade_psbt(&psbt, trade).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Verify alkane trade PSBT
                            self.alkanes_executor.verify_alkane_trade_psbt(&psbt, trade).await?
                        }
                        _ => {
                            // Verify regular trade PSBT
                            self.wallet.verify_psbt(&psbt).await?
                        }
                    };

                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid maker PSBT".to_string()).into());
                    }
                    
                    // Create taker PSBT based on the asset type
                    let taker_psbt = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Create a rune trade PSBT
                            self.runes_executor.create_rune_trade_psbt(trade, false).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Create an alkane trade PSBT
                            self.alkanes_executor.create_alkane_trade_psbt(trade, false).await?
                        }
                        _ => {
                            // Create a regular trade PSBT
                            self.wallet.create_trade_psbt(
                                &trade.id,
                                &trade.order_id,
                                &trade.base_asset,
                                &trade.quote_asset,
                                amount_to_u64(trade.amount)?,
                                price_to_u64(trade.price)?,
                            ).await?
                        }
                    };
                    
                    trade.taker_psbt = Some(taker_psbt.clone());
                    trade.update_state(TradeState::TakerPsbtSent);
                    
                    // Send taker PSBT
                    self.send_trade_message(
                        &TradeMessage::SendPsbt {
                            trade_id: trade.id.clone(),
                            psbt: taker_psbt,
                        },
                        &trade.maker_peer_id,
                    ).await?;
                } else if peer_id == trade.taker_peer_id {
                    // Taker sent PSBT
                    trade.taker_psbt = Some(psbt.clone());
                    trade.update_state(TradeState::TakerPsbtSent);
                    
                    // Verify PSBT based on the asset type
                    let is_valid = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Verify rune trade PSBT
                            self.runes_executor.verify_rune_trade_psbt(&psbt, trade).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Verify alkane trade PSBT
                            self.alkanes_executor.verify_alkane_trade_psbt(&psbt, trade).await?
                        }
                        _ => {
                            // Verify regular trade PSBT
                            self.wallet.verify_psbt(&psbt).await?
                        }
                    };

                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid taker PSBT".to_string()).into());
                    }
                    
                    // Sign taker PSBT based on the asset type
                    let signed_psbt = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Sign rune trade PSBT
                            self.runes_executor.sign_rune_trade_psbt(&psbt).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Sign alkane trade PSBT
                            self.alkanes_executor.sign_alkane_trade_psbt(&psbt).await?
                        }
                        _ => {
                            // Sign regular trade PSBT
                            self.wallet.sign_psbt(&psbt).await?
                        }
                    };
                    
                    // Send signed PSBT
                    self.send_trade_message(
                        &TradeMessage::SignPsbt {
                            trade_id: trade.id.clone(),
                            signed_psbt,
                        },
                        &trade.taker_peer_id,
                    ).await?;
                    
                    trade.update_state(TradeState::MakerSigned);
                } else {
                    return Err(TradeError::InvalidState(format!("Unknown peer ID: {}", peer_id)).into());
                }
            }
            TradeMessage::SignPsbt { trade_id, signed_psbt } => {
                // Get trade
                let mut trades = self.trades.write().await;
                let trade = trades.get_mut(&trade_id)
                    .ok_or_else(|| TradeError::NotFound(trade_id.clone()))?;
                
                // Check if peer is maker or taker
                if peer_id == trade.maker_peer_id {
                    // Maker signed PSBT
                    trade.update_state(TradeState::MakerSigned);
                    
                    // Verify signed PSBT based on the asset type
                    let is_valid = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Verify rune trade PSBT
                            self.runes_executor.verify_rune_trade_psbt(&signed_psbt, trade).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Verify alkane trade PSBT
                            self.alkanes_executor.verify_alkane_trade_psbt(&signed_psbt, trade).await?
                        }
                        _ => {
                            // Verify regular trade PSBT
                            self.wallet.verify_psbt(&signed_psbt).await?
                        }
                    };

                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid maker signed PSBT".to_string()).into());
                    }
                    
                    // Sign PSBT based on the asset type
                    let final_psbt = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Sign rune trade PSBT
                            self.runes_executor.sign_rune_trade_psbt(&signed_psbt).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Sign alkane trade PSBT
                            self.alkanes_executor.sign_alkane_trade_psbt(&signed_psbt).await?
                        }
                        _ => {
                            // Sign regular trade PSBT
                            self.wallet.sign_psbt(&signed_psbt).await?
                        }
                    };
                    trade.final_psbt = Some(final_psbt.clone());
                    
                    // Broadcast transaction based on the asset type
                    let txid = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Finalize and broadcast rune trade PSBT
                            self.runes_executor.finalize_and_broadcast_rune_trade_psbt(&final_psbt).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Finalize and broadcast alkane trade PSBT
                            self.alkanes_executor.finalize_and_broadcast_alkane_trade_psbt(&final_psbt).await?
                        }
                        _ => {
                            // Finalize and broadcast regular trade PSBT
                            self.wallet.finalize_and_broadcast_psbt(&final_psbt).await?
                        }
                    };
                    trade.txid = Some(txid.clone());
                    
                    // Update trade state
                    trade.update_state(TradeState::Completed);
                    
                    // Send broadcast message
                    self.send_trade_message(
                        &TradeMessage::Broadcast {
                            trade_id: trade.id.clone(),
                            txid,
                        },
                        &trade.maker_peer_id,
                    ).await?;
                    
                    // Send event
                    let _ = self.event_sender
                        .send(Event::TradeCompleted(trade.id.clone()))
                        .await;
                } else if peer_id == trade.taker_peer_id {
                    // Taker signed PSBT
                    trade.update_state(TradeState::TakerSigned);
                    
                    // Verify signed PSBT based on the asset type
                    let is_valid = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Verify rune trade PSBT
                            self.runes_executor.verify_rune_trade_psbt(&signed_psbt, trade).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Verify alkane trade PSBT
                            self.alkanes_executor.verify_alkane_trade_psbt(&signed_psbt, trade).await?
                        }
                        _ => {
                            // Verify regular trade PSBT
                            self.wallet.verify_psbt(&signed_psbt).await?
                        }
                    };

                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid taker signed PSBT".to_string()).into());
                    }
                    
                    // Sign PSBT based on the asset type
                    let final_psbt = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Sign rune trade PSBT
                            self.runes_executor.sign_rune_trade_psbt(&signed_psbt).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Sign alkane trade PSBT
                            self.alkanes_executor.sign_alkane_trade_psbt(&signed_psbt).await?
                        }
                        _ => {
                            // Sign regular trade PSBT
                            self.wallet.sign_psbt(&signed_psbt).await?
                        }
                    };
                    trade.final_psbt = Some(final_psbt.clone());
                    
                    // Broadcast transaction based on the asset type
                    let txid = match (&trade.base_asset, &trade.quote_asset) {
                        (Asset::Rune(_), _) | (_, Asset::Rune(_)) => {
                            // Finalize and broadcast rune trade PSBT
                            self.runes_executor.finalize_and_broadcast_rune_trade_psbt(&final_psbt).await?
                        }
                        (Asset::Alkane(_), _) | (_, Asset::Alkane(_)) => {
                            // Finalize and broadcast alkane trade PSBT
                            self.alkanes_executor.finalize_and_broadcast_alkane_trade_psbt(&final_psbt).await?
                        }
                        _ => {
                            // Finalize and broadcast regular trade PSBT
                            self.wallet.finalize_and_broadcast_psbt(&final_psbt).await?
                        }
                    };
                    trade.txid = Some(txid.clone());
                    
                    // Update trade state
                    trade.update_state(TradeState::Completed);
                    
                    // Send broadcast message
                    self.send_trade_message(
                        &TradeMessage::Broadcast {
                            trade_id: trade.id.clone(),
                            txid,
                        },
                        &trade.taker_peer_id,
                    ).await?;
                    
                    // Send event
                    let _ = self.event_sender
                        .send(Event::TradeCompleted(trade.id.clone()))
                        .await;
                } else {
                    return Err(TradeError::InvalidState(format!("Unknown peer ID: {}", peer_id)).into());
                }
            }
            TradeMessage::Broadcast { trade_id, txid } => {
                // Get trade
                let mut trades = self.trades.write().await;
                let trade = trades.get_mut(&trade_id)
                    .ok_or_else(|| TradeError::NotFound(trade_id.clone()))?;
                
                // Update trade
                trade.txid = Some(txid);
                trade.update_state(TradeState::Completed);
                
                // Send event
                let _ = self.event_sender
                    .send(Event::TradeCompleted(trade.id.clone()))
                    .await;
            }
            TradeMessage::Cancel { trade_id, reason } => {
                // Get trade
                let mut trades = self.trades.write().await;
                let trade = trades.get_mut(&trade_id)
                    .ok_or_else(|| TradeError::NotFound(trade_id.clone()))?;
                
                // Update trade
                trade.update_state(TradeState::Canceled);
                
                // Send event
                let _ = self.event_sender
                    .send(Event::TradeFailed(trade.id.clone()))
                    .await;
                
                info!("Trade {} canceled by {}: {}", trade_id.0, peer_id, reason);
            }
        }
        
        Ok(())
    }

    /// Send trade message
    async fn send_trade_message(
        &self,
        message: &TradeMessage,
        peer_id: &str,
    ) -> Result<()> {
        // Serialize message
        let message_data = serde_json::to_vec(message)
            .context("Failed to serialize trade message")?;
        
        // Publish message to trade topic
        let mut network = self.network.write().await;
        network.publish(&self.trade_topic, message_data).await?;
        
        Ok(())
    }

    /// Get trade by ID
    pub async fn get_trade(&self, trade_id: &TradeId) -> Result<Trade> {
        let trades = self.trades.read().await;
        trades.get(trade_id)
            .cloned()
            .ok_or_else(|| TradeError::NotFound(trade_id.clone()).into())
    }

    /// Get all trades
    pub async fn get_trades(&self) -> Vec<Trade> {
        let trades = self.trades.read().await;
        trades.values().cloned().collect()
    }

    /// Cancel trade
    pub async fn cancel_trade(&self, trade_id: &TradeId, reason: &str) -> Result<()> {
        // Get trade
        let mut trades = self.trades.write().await;
        let trade = trades.get_mut(trade_id)
            .ok_or_else(|| TradeError::NotFound(trade_id.clone()))?;
        
        // Check if trade can be canceled
        if trade.state == TradeState::Completed || trade.state == TradeState::Failed || 
           trade.state == TradeState::Canceled || trade.state == TradeState::Expired {
            return Err(TradeError::InvalidState(format!("Cannot cancel trade in state: {:?}", trade.state)).into());
        }
        
        // Update trade
        trade.update_state(TradeState::Canceled);
        
        // Send cancel message
        let network = self.network.read().await;
        let local_peer_id = network.local_peer_id().to_string();
        
        // Determine recipient
        let recipient = if local_peer_id == trade.maker_peer_id {
            &trade.taker_peer_id
        } else {
            &trade.maker_peer_id
        };
        
        // Send message
        self.send_trade_message(
            &TradeMessage::Cancel {
                trade_id: trade_id.clone(),
                reason: reason.to_string(),
            },
            recipient,
        ).await?;
        
        // Send event
        let _ = self.event_sender
            .send(Event::TradeFailed(trade.id.clone()))
            .await;
        
        Ok(())
    }

    /// Get order by ID
    async fn get_order_by_id(&self, order_id: &OrderId) -> Result<Order> {
        // In a real implementation, we would get the order from the orderbook
        // For now, just create a dummy order
        let order = Order {
            id: order_id.clone(),
            maker: "maker_peer_id".to_string(),
            base_asset: Asset::Bitcoin,
            quote_asset: Asset::Bitcoin,
            side: OrderSide::Buy,
            amount: Decimal::new(1, 0),
            price: Decimal::new(1, 0),
            status: OrderStatus::Open,
            timestamp: 0,
            expiry: 0,
        };

        Ok(order)
    }
}

/// Convert Decimal amount to u64
fn amount_to_u64(amount: Decimal) -> Result<u64> {
    // Convert to satoshis (multiply by 100,000,000)
    let satoshis = amount * Decimal::from(100_000_000);
    
    // Convert to u64
    satoshis.to_u64()
        .ok_or_else(|| anyhow::anyhow!("Failed to convert amount to u64"))
}

/// Convert Decimal price to u64
fn price_to_u64(price: Decimal) -> Result<u64> {
    // Convert to satoshis (multiply by 100,000,000)
    let satoshis = price * Decimal::from(100_000_000);
    
    // Convert to u64
    satoshis.to_u64()
        .ok_or_else(|| anyhow::anyhow!("Failed to convert price to u64"))
}
