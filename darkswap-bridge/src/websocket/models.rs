//! Models for WebSocket server
//!
//! This module provides models for the WebSocket server.

use serde::{Deserialize, Serialize};

/// WebSocket client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketClient {
    /// Client ID
    pub id: String,
    /// User ID (if authenticated)
    pub user_id: Option<String>,
    /// Subscribed topics
    pub topics: Vec<String>,
    /// Connected at timestamp
    pub connected_at: u64,
    /// Last activity timestamp
    pub last_activity: u64,
}

/// WebSocket subscription
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketSubscription {
    /// Topic
    pub topic: String,
    /// Client ID
    pub client_id: String,
    /// Subscribed at timestamp
    pub subscribed_at: u64,
}

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WebSocketMessageType {
    /// Wallet status update
    WalletStatus,
    /// Wallet balance update
    WalletBalance,
    /// Network status update
    NetworkStatus,
    /// Order update
    OrderUpdate,
    /// Trade update
    TradeUpdate,
    /// System status update
    SystemStatus,
    /// Error
    Error,
    /// Custom
    Custom(String),
}

impl WebSocketMessageType {
    /// Convert to string
    pub fn to_string(&self) -> String {
        match self {
            WebSocketMessageType::WalletStatus => "wallet_status".to_string(),
            WebSocketMessageType::WalletBalance => "wallet_balance".to_string(),
            WebSocketMessageType::NetworkStatus => "network_status".to_string(),
            WebSocketMessageType::OrderUpdate => "order_update".to_string(),
            WebSocketMessageType::TradeUpdate => "trade_update".to_string(),
            WebSocketMessageType::SystemStatus => "system_status".to_string(),
            WebSocketMessageType::Error => "error".to_string(),
            WebSocketMessageType::Custom(s) => s.clone(),
        }
    }
    
    /// From string
    pub fn from_string(s: &str) -> Self {
        match s {
            "wallet_status" => WebSocketMessageType::WalletStatus,
            "wallet_balance" => WebSocketMessageType::WalletBalance,
            "network_status" => WebSocketMessageType::NetworkStatus,
            "order_update" => WebSocketMessageType::OrderUpdate,
            "trade_update" => WebSocketMessageType::TradeUpdate,
            "system_status" => WebSocketMessageType::SystemStatus,
            "error" => WebSocketMessageType::Error,
            _ => WebSocketMessageType::Custom(s.to_string()),
        }
    }
}

/// WebSocket message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    /// Message type
    pub message_type: WebSocketMessageType,
    /// Message data
    pub data: serde_json::Value,
    /// Timestamp
    pub timestamp: u64,
}