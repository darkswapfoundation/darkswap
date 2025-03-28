//! Trade module for DarkSwap
//!
//! This module provides trade functionality for DarkSwap, including atomic swaps
//! for secure trade execution.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::{Context as AnyhowContext, Result};
use log::{debug, error, info, warn};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::{mpsc, Mutex, RwLock};
use uuid::Uuid;

use crate::orderbook::{Order, OrderId, OrderSide, OrderStatus};
use crate::p2p::P2PNetwork;
use crate::types::{Asset, Event, TradeId};
use crate::wallet::WalletInterface;

/// Trade error
#[derive(Debug, Error)]
pub enum TradeError {
    /// Trade not found
    #[error("Trade not found: {0}")]
    NotFound(TradeId),
    /// Invalid trade state
    #[error("Invalid trade state: {0}")]
    InvalidState(String),
    /// Invalid order
    #[error("Invalid order: {0}")]
    InvalidOrder(String),
    /// Insufficient funds
    #[error("Insufficient funds")]
    InsufficientFunds,
    /// Timeout
    #[error("Timeout")]
    Timeout,
    /// PSBT error
    #[error("PSBT error: {0}")]
    PsbtError(String),
    /// Network error
    #[error("Network error: {0}")]
    NetworkError(String),
    /// Other error
    #[error("Trade error: {0}")]
    Other(String),
}

/// Trade state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeState {
    /// Initialized
    Initialized,
    /// Maker PSBT sent
    MakerPsbtSent,
    /// Taker PSBT sent
    TakerPsbtSent,
    /// Maker signed
    MakerSigned,
    /// Taker signed
    TakerSigned,
    /// Completed
    Completed,
    /// Failed
    Failed,
    /// Canceled
    Canceled,
    /// Expired
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
    pub maker_psbt: Option<String>,
    /// Taker PSBT
    pub taker_psbt: Option<String>,
    /// Final PSBT
    pub final_psbt: Option<String>,
    /// Transaction ID
    pub txid: Option<String>,
    /// Created timestamp
    pub created_at: u64,
    /// Updated timestamp
    pub updated_at: u64,
    /// Expiry timestamp
    pub expires_at: u64,
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
        expiry: Option<u64>,
    ) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let expires_at = match expiry {
            Some(expiry) => now + expiry,
            None => now + 3600, // Default expiry: 1 hour
        };
        
        Self {
            id: TradeId(Uuid::new_v4().to_string()),
            order_id,
            maker_peer_id,
            taker_peer_id,
            base_asset,
            quote_asset,
            amount,
            price,
            state: TradeState::Initialized,
            maker_psbt: None,
            taker_psbt: None,
            final_psbt: None,
            txid: None,
            created_at: now,
            updated_at: now,
            expires_at,
        }
    }

    /// Check if the trade is expired
    pub fn is_expired(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        self.expires_at < now
    }

    /// Update the trade state
    pub fn update_state(&mut self, state: TradeState) {
        self.state = state;
        self.updated_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
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
        psbt: String,
    },
    /// Sign PSBT
    SignPsbt {
        /// Trade ID
        trade_id: TradeId,
        /// Signed PSBT
        signed_psbt: String,
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

/// Trade manager
pub struct TradeManager {
    /// Trades
    trades: Arc<RwLock<HashMap<TradeId, Trade>>>,
    /// P2P network
    network: Arc<RwLock<P2PNetwork>>,
    /// Wallet
    wallet: Arc<dyn WalletInterface>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
    /// Trade topic
    trade_topic: String,
}

impl TradeManager {
    /// Create a new trade manager
    pub fn new(
        network: Arc<RwLock<P2PNetwork>>,
        wallet: Arc<dyn WalletInterface>,
        event_sender: mpsc::Sender<Event>,
    ) -> Self {
        Self {
            trades: Arc::new(RwLock::new(HashMap::new())),
            network,
            wallet,
            event_sender,
            trade_topic: "darkswap/trades/v1".to_string(),
        }
    }

    /// Start the trade manager
    pub async fn start(&self) -> Result<()> {
        // Subscribe to trade topic
        let mut network = self.network.write().await;
        network.subscribe(&self.trade_topic).await?;
        
        // Start trade expiry checker
        self.start_expiry_checker().await?;
        
        Ok(())
    }

    /// Start trade expiry checker
    async fn start_expiry_checker(&self) -> Result<()> {
        let trades = self.trades.clone();
        let event_sender = self.event_sender.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            
            loop {
                interval.tick().await;
                
                // Check for expired trades
                let mut trades_write = trades.write().await;
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                for (trade_id, trade) in trades_write.iter_mut() {
                    if trade.expires_at < now && trade.state != TradeState::Completed && 
                       trade.state != TradeState::Failed && trade.state != TradeState::Canceled && 
                       trade.state != TradeState::Expired {
                        // Update trade state
                        trade.update_state(TradeState::Expired);
                        
                        // Send event
                        let _ = event_sender
                            .send(Event::TradeExpired(trade_id.clone()))
                            .await;
                    }
                }
            }
        });
        
        Ok(())
    }

    /// Create a new trade
    pub async fn create_trade(
        &self,
        order: &Order,
        amount: Decimal,
    ) -> Result<Trade> {
        // Check if order is valid
        if order.status != OrderStatus::Open {
            return Err(TradeError::InvalidOrder(format!("Order is not open: {:?}", order.status)).into());
        }
        
        // Check if amount is valid
        if amount <= Decimal::ZERO || amount > order.amount {
            return Err(TradeError::InvalidOrder(format!("Invalid amount: {}", amount)).into());
        }
        
        // Get local peer ID
        let network = self.network.read().await;
        let local_peer_id = network.local_peer_id().to_string();
        
        // Create trade
        let trade = Trade::new(
            order.id.clone(),
            order.maker.clone(),
            local_peer_id,
            order.base_asset.clone(),
            order.quote_asset.clone(),
            amount,
            order.price,
            None,
        );
        
        // Store trade
        let mut trades = self.trades.write().await;
        trades.insert(trade.id.clone(), trade.clone());
        
        // Send event
        let _ = self.event_sender
            .send(Event::TradeStarted(trade.id.clone()))
            .await;
        
        // Send initialize message
        self.send_trade_message(
            &TradeMessage::Initialize {
                trade_id: trade.id.clone(),
                order_id: order.id.clone(),
                amount,
            },
            &order.maker,
        ).await?;
        
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
                // TODO: Implement trade initialization
                // For now, just log a message
                info!("Received trade initialization from {}: {} for order {} with amount {}", 
                      peer_id, trade_id.0, order_id.0, amount);
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
                    
                    // Verify PSBT
                    let is_valid = self.wallet.verify_psbt(&psbt).await?;
                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid maker PSBT".to_string()).into());
                    }
                    
                    // Create taker PSBT
                    let taker_psbt = self.wallet.create_trade_psbt(
                        &trade.id,
                        &trade.order_id,
                        &trade.base_asset,
                        &trade.quote_asset,
                        amount_to_u64(trade.amount)?,
                        price_to_u64(trade.price)?,
                    ).await?;
                    
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
                    
                    // Verify PSBT
                    let is_valid = self.wallet.verify_psbt(&psbt).await?;
                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid taker PSBT".to_string()).into());
                    }
                    
                    // Sign taker PSBT
                    let signed_psbt = self.wallet.sign_psbt(&psbt).await?;
                    
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
                    
                    // Verify signed PSBT
                    let is_valid = self.wallet.verify_psbt(&signed_psbt).await?;
                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid maker signed PSBT".to_string()).into());
                    }
                    
                    // Sign PSBT
                    let final_psbt = self.wallet.sign_psbt(&signed_psbt).await?;
                    trade.final_psbt = Some(final_psbt.clone());
                    
                    // Broadcast transaction
                    let txid = self.wallet.finalize_and_broadcast_psbt(&final_psbt).await?;
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
                    
                    // Verify signed PSBT
                    let is_valid = self.wallet.verify_psbt(&signed_psbt).await?;
                    if !is_valid {
                        trade.update_state(TradeState::Failed);
                        return Err(TradeError::PsbtError("Invalid taker signed PSBT".to_string()).into());
                    }
                    
                    // Sign PSBT
                    let final_psbt = self.wallet.sign_psbt(&signed_psbt).await?;
                    trade.final_psbt = Some(final_psbt.clone());
                    
                    // Broadcast transaction
                    let txid = self.wallet.finalize_and_broadcast_psbt(&final_psbt).await?;
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