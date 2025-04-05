//! Message types for the DarkSwap P2P network.

use serde::{Deserialize, Serialize};

/// Message type for the DarkSwap P2P network.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// Request message.
    Request {
        /// Message ID.
        id: String,
        /// Message data.
        data: String,
    },
    /// Response message.
    Response {
        /// Message ID.
        id: String,
        /// Message data.
        data: String,
    },
    /// Error message.
    Error {
        /// Message ID.
        id: String,
        /// Error code.
        code: u32,
        /// Error message.
        message: String,
    },
    /// Ping message.
    Ping {
        /// Message ID.
        id: String,
    },
    /// Pong message.
    Pong {
        /// Message ID.
        id: String,
    },
    /// Order message.
    Order {
        /// Message ID.
        id: String,
        /// Order data.
        data: String,
    },
    /// Trade message.
    Trade {
        /// Message ID.
        id: String,
        /// Trade data.
        data: String,
    },
    /// Cancel message.
    Cancel {
        /// Message ID.
        id: String,
        /// Cancel data.
        data: String,
    },
    /// Orderbook message.
    Orderbook {
        /// Message ID.
        id: String,
        /// Orderbook data.
        data: String,
    },
    /// Peer message.
    Peer {
        /// Message ID.
        id: String,
        /// Peer data.
        data: String,
    },
    /// Discovery message.
    Discovery {
        /// Message ID.
        id: String,
        /// Discovery data.
        data: String,
    },
    /// Relay message.
    Relay {
        /// Message ID.
        id: String,
        /// Relay data.
        data: String,
    },
    /// Custom message.
    Custom {
        /// Message ID.
        id: String,
        /// Message type.
        message_type: String,
        /// Message data.
        data: String,
    },
}