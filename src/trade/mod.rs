//! Trade module for DarkSwap
//!
//! This module provides trade functionality for DarkSwap, including trade creation,
//! cancellation, and execution.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::{Context as AnyhowContext, Result};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

use crate::orderbook::{Order, OrderId, OrderStatus};
use crate::p2p::P2PNetwork;
use crate::types::{Asset, Event, TradeId};
use crate::wallet::WalletInterface;

/// Trade error
#[derive(Debug, Error)]
pub enum TradeError {
    /// Trade not found
    #[error("Trade not found: {0}")]
    TradeNotFound(TradeId),
    /// Invalid trade
    #[error("Invalid trade: {0}")]
    InvalidTrade(String),
    /// Insufficient funds
    #[error("Insufficient funds")]
    InsufficientFunds,
    /// Invalid amount
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
    /// Invalid price
    #[error("Invalid price: {0}")]
    InvalidPrice(String),
    /// Invalid asset
    #[error("Invalid asset: {0}")]
    InvalidAsset(String),
    /// Trade already exists
    #[error("Trade already exists: {0}")]
    TradeAlreadyExists(TradeId),
    /// Trade expired
    #[error("Trade expired: {0}")]
    TradeExpired(TradeId),
    /// Trade cancelled
    #[error("Trade cancelled: {0}")]
    TradeCancelled(TradeId),
    /// Trade completed
    #[error("Trade completed: {0}")]
    TradeCompleted(TradeId),
    /// Other error
    #[error("Trade error: {0}")]
    Other(String),
}

/// Trade status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Created
    Created,
    /// Accepted
    Accepted,
    /// Rejected
    Rejected,
    /// Cancelled
    Cancelled,
    /// Completed
    Completed,
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
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Trade amount
    pub amount: Decimal,
    /// Trade price
    pub price: Decimal,
    /// Trade status
    pub status: TradeStatus,
    /// Trade creation time
    pub created_at: u64,
    /// Trade expiry time
    pub expires_at: Option<u64>,
    /// Trade maker
    pub maker: String,
    /// Trade taker
    pub taker: String,
}

/// Trade manager
pub struct TradeManager {
    /// P2P network
    network: Arc<RwLock<P2PNetwork>>,
    /// Wallet
    wallet: Arc<dyn WalletInterface + Send + Sync>,
    /// Trades
    trades: RwLock<HashMap<TradeId, Trade>>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
}

impl TradeManager {
    /// Create a new trade manager
    pub fn new(
        network: Arc<RwLock<P2PNetwork>>,
        wallet: Arc<dyn WalletInterface + Send + Sync>,
        event_sender: mpsc::Sender<Event>,
    ) -> Self {
        Self {
            network,
            wallet,
            trades: RwLock::new(HashMap::new()),
            event_sender,
        }
    }

    /// Start the trade manager
    pub async fn start(&self) -> Result<()> {
        // TODO: Implement trade manager start
        Ok(())
    }

    /// Create a trade
    pub async fn create_trade(&self, order: &Order, amount: Decimal) -> Result<Trade> {
        // Validate amount
        if amount <= dec!(0) {
            return Err(TradeError::InvalidAmount(amount.to_string()).into());
        }

        if amount > order.amount - order.filled {
            return Err(TradeError::InvalidAmount(format!(
                "Amount {} exceeds available order amount {}",
                amount,
                order.amount - order.filled
            ))
            .into());
        }

        // Create trade ID
        let trade_id = TradeId(Uuid::new_v4().to_string());

        // Get current time
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .context("Failed to get current time")?
            .as_secs();

        // Calculate expiry time (default: 10 minutes)
        let expires_at = Some(now + 600);

        // Get wallet address
        let taker = self.wallet.get_address().await?;

        // Create trade
        let trade = Trade {
            id: trade_id.clone(),
            order_id: order.id.clone(),
            base_asset: order.base_asset.clone(),
            quote_asset: order.quote_asset.clone(),
            amount,
            price: order.price,
            status: TradeStatus::Created,
            created_at: now,
            expires_at,
            maker: order.maker.clone(),
            taker,
        };

        // Add trade to trades
        self.trades.write().await.insert(trade_id.clone(), trade.clone());

        // Send event
        self.event_sender
            .send(Event::TradeCreated(trade_id.clone()))
            .await
            .context("Failed to send trade created event")?;

        Ok(trade)
    }

    /// Cancel a trade
    pub async fn cancel_trade(&self, trade_id: &TradeId, reason: &str) -> Result<()> {
        // Get trade
        let mut trades = self.trades.write().await;
        let trade = trades
            .get_mut(trade_id)
            .ok_or_else(|| TradeError::TradeNotFound(trade_id.clone()))?;

        // Check if trade is already cancelled
        if trade.status == TradeStatus::Cancelled {
            return Err(TradeError::TradeCancelled(trade_id.clone()).into());
        }

        // Check if trade is already completed
        if trade.status == TradeStatus::Completed {
            return Err(TradeError::TradeCompleted(trade_id.clone()).into());
        }

        // Check if trade is already expired
        if trade.status == TradeStatus::Expired {
            return Err(TradeError::TradeExpired(trade_id.clone()).into());
        }

        // Update trade status
        trade.status = TradeStatus::Cancelled;

        // Send event
        self.event_sender
            .send(Event::TradeCancelled(trade_id.clone()))
            .await
            .context("Failed to send trade cancelled event")?;

        Ok(())
    }

    /// Get a trade by ID
    pub async fn get_trade(&self, trade_id: &TradeId) -> Result<Trade> {
        // Get trade
        let trades = self.trades.read().await;
        let trade = trades
            .get(trade_id)
            .ok_or_else(|| TradeError::TradeNotFound(trade_id.clone()))?;

        Ok(trade.clone())
    }

    /// Get all trades
    pub async fn get_trades(&self) -> Vec<Trade> {
        // Get trades
        let trades = self.trades.read().await;
        trades.values().cloned().collect()
    }

    /// Clean expired trades
    pub async fn clean_expired_trades(&self) -> Result<()> {
        // Get current time
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .context("Failed to get current time")?
            .as_secs();

        // Get trades
        let mut trades = self.trades.write().await;
        let mut expired_trades = Vec::new();

        for (trade_id, trade) in trades.iter_mut() {
            if let Some(expires_at) = trade.expires_at {
                if expires_at <= now && trade.status == TradeStatus::Created {
                    // Trade is expired
                    trade.status = TradeStatus::Expired;
                    expired_trades.push(trade_id.clone());
                }
            }
        }

        // Send events
        for trade_id in expired_trades {
            self.event_sender
                .send(Event::TradeExpired(trade_id))
                .await
                .context("Failed to send trade expired event")?;
        }

        Ok(())
    }

    /// Convert decimal to satoshis
    fn decimal_to_satoshis(amount: Decimal) -> Result<u64> {
        // Convert to satoshis (1 BTC = 100,000,000 satoshis)
        let satoshis = amount * dec!(100_000_000);
        satoshis.to_u64().ok_or_else(|| {
            TradeError::InvalidAmount(format!("Failed to convert {} to satoshis", amount)).into()
        })
    }

    /// Convert satoshis to decimal
    fn satoshis_to_decimal(satoshis: u64) -> Decimal {
        // Convert from satoshis (1 BTC = 100,000,000 satoshis)
        Decimal::from(satoshis) / dec!(100_000_000)
    }
}