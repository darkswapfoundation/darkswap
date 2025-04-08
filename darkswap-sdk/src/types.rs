//! Common types for DarkSwap
//!
//! This module provides common types used throughout DarkSwap.

use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Event {
    /// Order created
    OrderCreated {
        /// Order ID
        order_id: OrderId,
    },
    /// Order matched
    OrderMatched {
        /// Order ID
        order_id: OrderId,
        /// Trade ID
        trade_id: TradeId,
    },
    /// Order cancelled
    OrderCancelled {
        /// Order ID
        order_id: OrderId,
    },
    /// Order expired
    OrderExpired {
        /// Order ID
        order_id: OrderId,
    },
    /// Trade created
    TradeCreated {
        /// Trade ID
        trade_id: TradeId,
    },
    /// Trade completed
    TradeCompleted {
        /// Trade ID
        trade_id: TradeId,
    },
    /// Trade cancelled
    TradeCancelled {
        /// Trade ID
        trade_id: TradeId,
    },
    /// Trade failed
    TradeFailed {
        /// Trade ID
        trade_id: TradeId,
        /// Error
        error: String,
    },
    /// Peer connected
    PeerConnected {
        /// Peer ID
        peer_id: String,
    },
    /// Peer disconnected
    PeerDisconnected {
        /// Peer ID
        peer_id: String,
    },
    /// Error
    Error {
        /// Error
        error: String,
    },
}

/// Order ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct OrderId(pub String);

impl fmt::Display for OrderId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl OrderId {
    /// Create a new order ID
    pub fn new() -> Self {
        Self(Uuid::new_v4().to_string())
    }
}

/// Trade ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TradeId(pub String);

impl fmt::Display for TradeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl TradeId {
    /// Create a new trade ID
    pub fn new() -> Self {
        Self(Uuid::new_v4().to_string())
    }
}

/// Asset
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Asset {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(u64),
    /// Alkane
    Alkane(AlkaneId),
}

impl fmt::Display for Asset {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Asset::Bitcoin => write!(f, "BTC"),
            Asset::Rune(id) => write!(f, "RUNE:{:x}", id),
            Asset::Alkane(id) => write!(f, "ALKANE:{}", id),
        }
    }
}

impl FromStr for Asset {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "BTC" {
            return Ok(Asset::Bitcoin);
        }

        if let Some(rune_id) = s.strip_prefix("RUNE:") {
            let id = u64::from_str_radix(rune_id, 16)
                .map_err(|_| format!("Invalid rune ID: {}", rune_id))?;
            return Ok(Asset::Rune(id));
        }

        if let Some(alkane_id) = s.strip_prefix("ALKANE:") {
            let id = AlkaneId::from_str(alkane_id)
                .map_err(|_| format!("Invalid alkane ID: {}", alkane_id))?;
            return Ok(Asset::Alkane(id));
        }

        Err(format!("Invalid asset: {}", s))
    }
}

// Implement Ord for Asset
impl Ord for Asset {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        match (self, other) {
            (Asset::Bitcoin, Asset::Bitcoin) => std::cmp::Ordering::Equal,
            (Asset::Bitcoin, _) => std::cmp::Ordering::Less,
            (_, Asset::Bitcoin) => std::cmp::Ordering::Greater,
            (Asset::Rune(a), Asset::Rune(b)) => a.cmp(b),
            (Asset::Rune(_), Asset::Alkane(_)) => std::cmp::Ordering::Less,
            (Asset::Alkane(_), Asset::Rune(_)) => std::cmp::Ordering::Greater,
            (Asset::Alkane(a), Asset::Alkane(b)) => a.0.cmp(&b.0),
        }
    }
}

// Implement PartialOrd for Asset
impl PartialOrd for Asset {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

/// Alkane ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AlkaneId(pub String);

impl fmt::Display for AlkaneId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl FromStr for AlkaneId {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(s.to_string()))
    }
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderType {
    /// Buy
    Buy,
    /// Sell
    Sell,
}

impl fmt::Display for OrderType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderType::Buy => write!(f, "buy"),
            OrderType::Sell => write!(f, "sell"),
        }
    }
}

impl FromStr for OrderType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "buy" => Ok(OrderType::Buy),
            "sell" => Ok(OrderType::Sell),
            _ => Err(format!("Invalid order type: {}", s)),
        }
    }
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open
    Open,
    /// Matched
    Matched,
    /// Completed
    Completed,
    /// Cancelled
    Cancelled,
    /// Expired
    Expired,
}

impl fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderStatus::Open => write!(f, "open"),
            OrderStatus::Matched => write!(f, "matched"),
            OrderStatus::Completed => write!(f, "completed"),
            OrderStatus::Cancelled => write!(f, "cancelled"),
            OrderStatus::Expired => write!(f, "expired"),
        }
    }
}

impl FromStr for OrderStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "open" => Ok(OrderStatus::Open),
            "matched" => Ok(OrderStatus::Matched),
            "completed" => Ok(OrderStatus::Completed),
            "cancelled" => Ok(OrderStatus::Cancelled),
            "expired" => Ok(OrderStatus::Expired),
            _ => Err(format!("Invalid order status: {}", s)),
        }
    }
}

/// Trade status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Created
    Created,
    /// Accepted
    Accepted,
    /// Completed
    Completed,
    /// Cancelled
    Cancelled,
    /// Failed
    Failed,
}

impl fmt::Display for TradeStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TradeStatus::Created => write!(f, "created"),
            TradeStatus::Accepted => write!(f, "accepted"),
            TradeStatus::Completed => write!(f, "completed"),
            TradeStatus::Cancelled => write!(f, "cancelled"),
            TradeStatus::Failed => write!(f, "failed"),
        }
    }
}

impl FromStr for TradeStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "created" => Ok(TradeStatus::Created),
            "accepted" => Ok(TradeStatus::Accepted),
            "completed" => Ok(TradeStatus::Completed),
            "cancelled" => Ok(TradeStatus::Cancelled),
            "failed" => Ok(TradeStatus::Failed),
            _ => Err(format!("Invalid trade status: {}", s)),
        }
    }
}