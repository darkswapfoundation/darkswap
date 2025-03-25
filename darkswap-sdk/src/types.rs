//! Common types for DarkSwap
//!
//! This module defines common types used throughout the DarkSwap SDK.

use serde::{Deserialize, Serialize};
use std::fmt;
use std::hash::{Hash, Hasher};

/// Peer ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PeerId(pub String);

impl fmt::Display for PeerId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Order ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct OrderId(pub String);

impl OrderId {
    /// Create a new order ID
    pub fn new() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }
}

impl fmt::Display for OrderId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::str::FromStr for OrderId {
    type Err = crate::error::Error;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        Ok(OrderId(s.to_string()))
    }
}

/// Trade ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TradeId(pub String);

impl TradeId {
    /// Create a new trade ID
    pub fn new() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }
}

impl fmt::Display for TradeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Rune ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct RuneId(pub String);

impl fmt::Display for RuneId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
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

/// Asset type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Asset {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(RuneId),
    /// Alkane
    Alkane(AlkaneId),
}

impl PartialEq for Asset {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Asset::Bitcoin, Asset::Bitcoin) => true,
            (Asset::Rune(id1), Asset::Rune(id2)) => id1 == id2,
            (Asset::Alkane(id1), Asset::Alkane(id2)) => id1 == id2,
            _ => false,
        }
    }
}

impl Eq for Asset {}

impl Hash for Asset {
    fn hash<H: Hasher>(&self, state: &mut H) {
        match self {
            Asset::Bitcoin => {
                0.hash(state);
                "BTC".hash(state);
            }
            Asset::Rune(id) => {
                1.hash(state);
                id.hash(state);
            }
            Asset::Alkane(id) => {
                2.hash(state);
                id.hash(state);
            }
        }
    }
}

impl fmt::Display for Asset {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Asset::Bitcoin => write!(f, "BTC"),
            Asset::Rune(id) => write!(f, "RUNE:{}", id),
            Asset::Alkane(id) => write!(f, "ALKANE:{}", id),
        }
    }
}

impl std::str::FromStr for Asset {
    type Err = crate::error::Error;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        if s == "BTC" {
            return Ok(Asset::Bitcoin);
        }

        if let Some(id) = s.strip_prefix("RUNE:") {
            return Ok(Asset::Rune(RuneId(id.to_string())));
        }

        if let Some(id) = s.strip_prefix("ALKANE:") {
            return Ok(Asset::Alkane(AlkaneId(id.to_string())));
        }

        Err(crate::error::Error::InvalidAsset(s.to_string()))
    }
}

/// Event type
#[derive(Debug, Clone)]
pub enum Event {
    /// Network event
    Network(NetworkEvent),
    /// Order created
    OrderCreated(Order),
    /// Order canceled
    OrderCanceled(OrderId),
    /// Order filled
    OrderFilled(OrderId),
    /// Trade started
    TradeStarted(Trade),
    /// Trade completed
    TradeCompleted(Trade),
    /// Trade failed
    TradeFailed(Trade),
}

/// Network event
#[derive(Debug, Clone)]
pub enum NetworkEvent {
    /// Peer connected
    PeerConnected(PeerId),
    /// Peer disconnected
    PeerDisconnected(PeerId),
    /// Message received
    MessageReceived {
        /// Sender peer ID
        from: PeerId,
        /// Message type
        message_type: String,
    },
}

/// Order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    /// Order ID
    pub id: OrderId,
    /// Maker
    pub maker: PeerId,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Side
    pub side: OrderSide,
    /// Amount
    pub amount: rust_decimal::Decimal,
    /// Price
    pub price: rust_decimal::Decimal,
    /// Status
    pub status: OrderStatus,
    /// Timestamp
    pub timestamp: u64,
    /// Expiry
    pub expiry: u64,
}

/// Order side
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy
    Buy,
    /// Sell
    Sell,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open
    Open,
    /// Filled
    Filled,
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
    /// Maker
    pub maker: PeerId,
    /// Taker
    pub taker: PeerId,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Side
    pub side: OrderSide,
    /// Amount
    pub amount: rust_decimal::Decimal,
    /// Price
    pub price: rust_decimal::Decimal,
    /// Status
    pub status: TradeStatus,
    /// Timestamp
    pub timestamp: u64,
    /// Transaction ID
    pub txid: Option<String>,
}

/// Trade status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Pending
    Pending,
    /// Completed
    Completed,
    /// Failed
    Failed,
}

impl Order {
    /// Create a new order
    pub fn new(
        id: OrderId,
        maker: PeerId,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: rust_decimal::Decimal,
        price: rust_decimal::Decimal,
        expiry: u64,
    ) -> Self {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            id,
            maker,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status: OrderStatus::Open,
            timestamp,
            expiry,
        }
    }

    /// Check if the order is expired
    pub fn is_expired(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        self.expiry > 0 && now > self.timestamp + self.expiry
    }

    /// Check if the order can match with another order
    pub fn can_match(&self, other: &Order) -> bool {
        // Check if orders are on opposite sides
        if self.side == other.side {
            return false;
        }

        // Check if orders are for the same assets
        if self.base_asset != other.base_asset || self.quote_asset != other.quote_asset {
            return false;
        }

        // Check if orders are open
        if self.status != OrderStatus::Open || other.status != OrderStatus::Open {
            return false;
        }

        // Check if prices match
        match self.side {
            OrderSide::Buy => self.price >= other.price,
            OrderSide::Sell => self.price <= other.price,
        }
    }

    /// Fill the order
    pub fn fill(&mut self) {
        self.status = OrderStatus::Filled;
    }

    /// Cancel the order
    pub fn cancel(&mut self) {
        self.status = OrderStatus::Canceled;
    }

    /// Expire the order
    pub fn expire(&mut self) {
        self.status = OrderStatus::Expired;
    }
}

impl Trade {
    /// Create a new trade
    pub fn new(
        order: &Order,
        taker: PeerId,
        amount: rust_decimal::Decimal,
    ) -> Self {
        let id = TradeId(uuid::Uuid::new_v4().to_string());
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            id,
            order_id: order.id.clone(),
            maker: order.maker.clone(),
            taker,
            base_asset: order.base_asset.clone(),
            quote_asset: order.quote_asset.clone(),
            side: order.side,
            amount,
            price: order.price,
            status: TradeStatus::Pending,
            timestamp,
            txid: None,
        }
    }

    /// Complete the trade
    pub fn complete(&mut self) {
        self.status = TradeStatus::Completed;
    }

    /// Fail the trade
    pub fn fail(&mut self) {
        self.status = TradeStatus::Failed;
    }

    /// Set the transaction ID
    pub fn set_txid(&mut self, txid: String) {
        self.txid = Some(txid);
    }
}