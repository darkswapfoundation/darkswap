//! Message types for the P2P network.

use darkswap_lib::types::{AssetId, OrderSide, OrderStatus, TradeStatus};
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// A message sent over the P2P network.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// An order message.
    Order(OrderMessage),
    /// A trade message.
    Trade(TradeMessage),
    /// A chat message.
    Chat(ChatMessage),
    /// A ping message.
    Ping,
    /// A pong message.
    Pong,
}

/// An order message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderMessage {
    /// The order ID.
    pub id: String,
    /// The peer ID of the order creator.
    pub peer_id: String,
    /// The base asset.
    pub base_asset: AssetId,
    /// The quote asset.
    pub quote_asset: AssetId,
    /// The order side.
    pub side: OrderSide,
    /// The order amount.
    pub amount: f64,
    /// The order price.
    pub price: f64,
    /// The order status.
    pub status: OrderStatus,
    /// The order creation timestamp.
    pub created_at: u64,
    /// The order expiry duration.
    pub expiry: Duration,
}

/// A trade message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeMessage {
    /// The trade ID.
    pub id: String,
    /// The order ID.
    pub order_id: String,
    /// The maker peer ID.
    pub maker_peer_id: String,
    /// The taker peer ID.
    pub taker_peer_id: String,
    /// The base asset.
    pub base_asset: AssetId,
    /// The quote asset.
    pub quote_asset: AssetId,
    /// The trade amount.
    pub amount: f64,
    /// The trade price.
    pub price: f64,
    /// The trade status.
    pub status: TradeStatus,
    /// The trade creation timestamp.
    pub created_at: u64,
    /// The trade completion timestamp.
    pub completed_at: Option<u64>,
}

/// A chat message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// The message ID.
    pub id: String,
    /// The sender peer ID.
    pub sender_peer_id: String,
    /// The recipient peer ID.
    pub recipient_peer_id: String,
    /// The message content.
    pub content: String,
    /// The message timestamp.
    pub timestamp: u64,
}

impl Message {
    /// Create a new order message.
    pub fn new_order(
        id: String,
        peer_id: String,
        base_asset: AssetId,
        quote_asset: AssetId,
        side: OrderSide,
        amount: f64,
        price: f64,
        status: OrderStatus,
        created_at: u64,
        expiry: Duration,
    ) -> Self {
        Self::Order(OrderMessage {
            id,
            peer_id,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status,
            created_at,
            expiry,
        })
    }

    /// Create a new trade message.
    pub fn new_trade(
        id: String,
        order_id: String,
        maker_peer_id: String,
        taker_peer_id: String,
        base_asset: AssetId,
        quote_asset: AssetId,
        amount: f64,
        price: f64,
        status: TradeStatus,
        created_at: u64,
        completed_at: Option<u64>,
    ) -> Self {
        Self::Trade(TradeMessage {
            id,
            order_id,
            maker_peer_id,
            taker_peer_id,
            base_asset,
            quote_asset,
            amount,
            price,
            status,
            created_at,
            completed_at,
        })
    }

    /// Create a new chat message.
    pub fn new_chat(
        id: String,
        sender_peer_id: String,
        recipient_peer_id: String,
        content: String,
        timestamp: u64,
    ) -> Self {
        Self::Chat(ChatMessage {
            id,
            sender_peer_id,
            recipient_peer_id,
            content,
            timestamp,
        })
    }

    /// Create a new ping message.
    pub fn new_ping() -> Self {
        Self::Ping
    }

    /// Create a new pong message.
    pub fn new_pong() -> Self {
        Self::Pong
    }
}