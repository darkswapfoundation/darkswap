//! Common types for DarkSwap
//!
//! This module contains common types used throughout the DarkSwap SDK.

use std::fmt;
use std::str::FromStr;

use anyhow::Result;
use libp2p::core::PeerId;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::orderbook::{Order, OrderId};

/// Trade ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TradeId(pub String);

impl fmt::Display for TradeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Alkane ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AlkaneId(pub String);

/// Asset type
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Asset {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(u128),
    /// Alkane
    Alkane(AlkaneId),
}

impl fmt::Display for Asset {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Asset::Bitcoin => write!(f, "BTC"),
            Asset::Rune(id) => write!(f, "RUNE:{:x}", id),
            Asset::Alkane(id) => write!(f, "ALKANE:{}", id.0),
        }
    }
}

impl FromStr for Asset {
    type Err = AssetError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "BTC" {
            return Ok(Asset::Bitcoin);
        }

        if let Some(rune_id) = s.strip_prefix("RUNE:") {
            let id = u128::from_str_radix(rune_id, 16)
                .map_err(|_| AssetError::InvalidRuneId(rune_id.to_string()))?;
            return Ok(Asset::Rune(id));
        }

        if let Some(alkane_id) = s.strip_prefix("ALKANE:") {
            return Ok(Asset::Alkane(AlkaneId(alkane_id.to_string())));
        }

        Err(AssetError::InvalidAsset(s.to_string()))
    }
}

/// Asset error
#[derive(Debug, Error)]
pub enum AssetError {
    /// Invalid asset
    #[error("Invalid asset: {0}")]
    InvalidAsset(String),
    /// Invalid rune ID
    #[error("Invalid rune ID: {0}")]
    InvalidRuneId(String),
    /// Invalid alkane ID
    #[error("Invalid alkane ID: {0}")]
    InvalidAlkaneId(String),
}

/// Rune
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rune {
    /// Rune ID
    pub id: u128,
    /// Rune symbol
    pub symbol: String,
    /// Rune name
    pub name: String,
    /// Rune decimals
    pub decimals: u8,
    /// Rune supply
    pub supply: u64,
    /// Rune limit
    pub limit: u64,
}

/// Alkane
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alkane {
    /// Alkane ID
    pub id: AlkaneId,
    /// Alkane symbol
    pub symbol: String,
    /// Alkane name
    pub name: String,
    /// Alkane decimals
    pub decimals: u8,
    /// Alkane supply
    pub supply: u64,
    /// Alkane limit
    pub limit: u64,
}

/// Event
#[derive(Debug, Clone)]
pub enum Event {
    /// Peer connected
    PeerConnected(PeerId),
    /// Peer disconnected
    PeerDisconnected(PeerId),
    /// Order created
    OrderCreated(Order),
    /// Order updated
    OrderUpdated(Order),
    /// Order cancelled
    OrderCancelled(OrderId),
    /// Order expired
    OrderExpired(OrderId),
    /// Order filled
    OrderFilled(OrderId),
    /// Trade created
    TradeCreated(TradeId),
    /// Trade updated
    TradeUpdated(TradeId),
    /// Trade cancelled
    TradeCancelled(TradeId),
    /// Trade completed
    TradeCompleted(TradeId),
    /// Trade expired
    TradeExpired(TradeId),
}