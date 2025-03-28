//! Common types for DarkSwap
//!
//! This module provides common types used throughout the DarkSwap SDK.

use std::fmt;
use std::str::FromStr;

use libp2p::core::PeerId;
use serde::{Deserialize, Serialize, Serializer, Deserializer};
use serde::de::{self, Visitor};

/// Asset ID for runes
pub type RuneId = u128;

/// Asset ID for alkanes
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AlkaneId(pub String);

impl fmt::Display for AlkaneId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
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

/// Asset
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Asset {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(RuneId),
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

/// Serializable wrapper for PeerId
#[derive(Debug, Clone)]
pub struct SerializablePeerId(pub PeerId);

impl Serialize for SerializablePeerId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.0.to_string())
    }
}

struct SerializablePeerIdVisitor;

impl<'de> Visitor<'de> for SerializablePeerIdVisitor {
    type Value = SerializablePeerId;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a string representing a PeerId")
    }

    fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        PeerId::from_str(value)
            .map(SerializablePeerId)
            .map_err(|_| de::Error::custom("invalid PeerId"))
    }
}

impl<'de> Deserialize<'de> for SerializablePeerId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(SerializablePeerIdVisitor)
    }
}

/// Event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Event {
    /// Peer connected
    PeerConnected(SerializablePeerId),
    /// Peer disconnected
    PeerDisconnected(SerializablePeerId),
    /// Order created
    OrderCreated(crate::orderbook::Order),
    /// Order updated
    OrderUpdated(crate::orderbook::Order),
    /// Order cancelled
    OrderCancelled(crate::orderbook::OrderId),
    /// Order expired
    OrderExpired(crate::orderbook::OrderId),
    /// Order filled
    OrderFilled(crate::orderbook::OrderId),
    /// Trade created
    TradeCreated(TradeId),
    /// Trade started
    TradeStarted(TradeId),
    /// Trade updated
    TradeUpdated(TradeId),
    /// Trade cancelled
    TradeCancelled(TradeId),
    /// Trade completed
    TradeCompleted(TradeId),
    /// Trade expired
    TradeExpired(TradeId),
    /// Trade failed
    TradeFailed(TradeId),
}

/// Rune
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rune {
    /// Rune ID
    pub id: RuneId,
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