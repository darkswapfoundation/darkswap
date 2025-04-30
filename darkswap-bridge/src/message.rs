//! Message types for DarkSwap Bridge
//!
//! This module provides message types for communication between the bridge
//! and the wallet and network adapters.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Message type for communication between components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// Wallet message
    Wallet(WalletMessage),
    /// Network message
    Network(NetworkMessage),
    /// System message
    System(SystemMessage),
    /// Response message
    Response(ResponseMessage),
    /// Error message
    Error(ErrorMessage),
}

/// Wallet message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WalletMessage {
    /// Create a new wallet
    CreateWallet {
        /// Wallet name
        name: String,
        /// Wallet passphrase
        passphrase: String,
    },
    /// Open an existing wallet
    OpenWallet {
        /// Wallet name
        name: String,
        /// Wallet passphrase
        passphrase: String,
    },
    /// Close the current wallet
    CloseWallet,
    /// Get wallet status
    GetStatus,
    /// Get wallet balance
    GetBalance,
    /// Create a new address
    CreateAddress,
    /// Get addresses
    GetAddresses,
    /// Send a transaction
    SendTransaction {
        /// Recipient address
        recipient: String,
        /// Amount in satoshis
        amount: u64,
        /// Fee rate in satoshis per byte
        fee_rate: f64,
    },
    /// Get transaction history
    GetTransactions,
    /// Get UTXO set
    GetUtxos,
    /// Sign a message
    SignMessage {
        /// Message to sign
        message: String,
        /// Address to sign with
        address: String,
    },
    /// Verify a signature
    VerifySignature {
        /// Message that was signed
        message: String,
        /// Address that signed the message
        address: String,
        /// Signature to verify
        signature: String,
    },
}

/// Network message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessage {
    /// Connect to a peer
    Connect {
        /// Peer address
        address: String,
    },
    /// Disconnect from a peer
    Disconnect {
        /// Peer address
        address: String,
    },
    /// Get network status
    GetStatus,
    /// Get connected peers
    GetPeers,
    /// Send a message to a peer
    SendMessage {
        /// Peer address
        peer: String,
        /// Message to send
        message: Vec<u8>,
    },
    /// Broadcast a message to all peers
    BroadcastMessage {
        /// Message to broadcast
        message: Vec<u8>,
    },
    /// Create an order
    CreateOrder {
        /// Order type (buy or sell)
        order_type: OrderType,
        /// Asset to sell
        sell_asset: String,
        /// Amount to sell
        sell_amount: u64,
        /// Asset to buy
        buy_asset: String,
        /// Amount to buy
        buy_amount: u64,
    },
    /// Cancel an order
    CancelOrder {
        /// Order ID
        order_id: String,
    },
    /// Take an order
    TakeOrder {
        /// Order ID
        order_id: String,
    },
    /// Get orders
    GetOrders,
    /// Get trades
    GetTrades,
    /// Accept a trade
    AcceptTrade {
        /// Trade ID
        trade_id: String,
    },
    /// Reject a trade
    RejectTrade {
        /// Trade ID
        trade_id: String,
    },
    /// Execute a trade
    ExecuteTrade {
        /// Trade ID
        trade_id: String,
    },
    /// Confirm a trade
    ConfirmTrade {
        /// Trade ID
        trade_id: String,
    },
    /// Cancel a trade
    CancelTrade {
        /// Trade ID
        trade_id: String,
    },
}

/// System message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemMessage {
    /// Ping message
    Ping,
    /// Pong message
    Pong,
    /// Shutdown message
    Shutdown,
    /// Restart message
    Restart,
    /// Save settings
    SaveSettings {
        /// Settings to save
        settings: serde_json::Value,
    },
    /// Load settings
    LoadSettings,
    /// Reset settings to default
    ResetSettings,
}

/// Response message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResponseMessage {
    /// Success response with no data
    Success,
    /// Success response with data
    SuccessWithData(serde_json::Value),
    /// Wallet status response
    WalletStatus {
        /// Whether the wallet is connected
        connected: bool,
        /// Whether the wallet is open
        open: bool,
        /// Wallet name (if open)
        name: Option<String>,
    },
    /// Wallet balance response
    WalletBalance {
        /// Confirmed balance in satoshis
        confirmed: u64,
        /// Unconfirmed balance in satoshis
        unconfirmed: u64,
    },
    /// Address response
    Address {
        /// Address
        address: String,
    },
    /// Addresses response
    Addresses {
        /// Addresses
        addresses: Vec<String>,
    },
    /// Transaction response
    Transaction {
        /// Transaction ID
        txid: String,
    },
    /// Transactions response
    Transactions {
        /// Transactions
        transactions: Vec<Transaction>,
    },
    /// UTXOs response
    Utxos {
        /// UTXOs
        utxos: Vec<Utxo>,
    },
    /// Signature response
    Signature {
        /// Signature
        signature: String,
    },
    /// Verification response
    Verification {
        /// Whether the signature is valid
        valid: bool,
    },
    /// Network status response
    NetworkStatus {
        /// Whether the network is connected
        connected: bool,
        /// Number of connected peers
        peer_count: usize,
    },
    /// Peers response
    Peers {
        /// Connected peers
        peers: Vec<String>,
    },
    /// Message sent response
    MessageSent,
    /// Message broadcast response
    MessageBroadcast,
    /// Order created response
    OrderCreated {
        /// Order ID
        order_id: String,
    },
    /// Order cancelled response
    OrderCancelled {
        /// Order ID
        order_id: String,
    },
    /// Orders response
    Orders {
        /// Orders
        orders: Vec<Order>,
    },
    /// Trade proposed response
    TradeProposed {
        /// Trade ID
        trade_id: String,
    },
    /// Trade accepted response
    TradeAccepted {
        /// Trade ID
        trade_id: String,
    },
    /// Trade rejected response
    TradeRejected {
        /// Trade ID
        trade_id: String,
    },
    /// Trade executed response
    TradeExecuted {
        /// Trade ID
        trade_id: String,
        /// Transaction ID
        txid: String,
    },
    /// Trade confirmed response
    TradeConfirmed {
        /// Trade ID
        trade_id: String,
    },
    /// Trade cancelled response
    TradeCancelled {
        /// Trade ID
        trade_id: String,
    },
    /// Trades response
    Trades {
        /// Trades
        trades: Vec<Trade>,
    },
    /// Settings response
    Settings {
        /// Settings
        settings: serde_json::Value,
    },
}

/// Error message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorMessage {
    /// Error code
    pub code: ErrorCode,
    /// Error message
    pub message: String,
}

/// Error code
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorCode {
    /// Invalid request
    InvalidRequest,
    /// Authentication error
    AuthError,
    /// Wallet error
    WalletError,
    /// Network error
    NetworkError,
    /// System error
    SystemError,
    /// Not found
    NotFound,
    /// Already exists
    AlreadyExists,
    /// Invalid argument
    InvalidArgument,
    /// Permission denied
    PermissionDenied,
    /// Internal error
    InternalError,
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderType {
    /// Buy order
    Buy,
    /// Sell order
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

/// Transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    /// Transaction ID
    pub txid: String,
    /// Amount in satoshis
    pub amount: i64,
    /// Recipient address
    pub recipient: String,
    /// Transaction timestamp
    pub timestamp: u64,
    /// Transaction status
    pub status: TransactionStatus,
}

/// Transaction status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransactionStatus {
    /// Pending
    Pending,
    /// Confirmed
    Confirmed,
    /// Failed
    Failed,
}

impl fmt::Display for TransactionStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TransactionStatus::Pending => write!(f, "pending"),
            TransactionStatus::Confirmed => write!(f, "confirmed"),
            TransactionStatus::Failed => write!(f, "failed"),
        }
    }
}

/// UTXO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Utxo {
    /// Transaction ID
    pub txid: String,
    /// Output index
    pub vout: u32,
    /// Amount in satoshis
    pub amount: u64,
    /// Address
    pub address: String,
    /// Confirmations
    pub confirmations: u64,
}

/// Order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    /// Order ID
    pub id: String,
    /// Order type
    pub order_type: OrderType,
    /// Asset to sell
    pub sell_asset: String,
    /// Amount to sell
    pub sell_amount: u64,
    /// Asset to buy
    pub buy_asset: String,
    /// Amount to buy
    pub buy_amount: u64,
    /// Peer ID
    pub peer_id: String,
    /// Order timestamp
    pub timestamp: u64,
    /// Order status
    pub status: OrderStatus,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open
    Open,
    /// Filled
    Filled,
    /// Cancelled
    Cancelled,
}

impl fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderStatus::Open => write!(f, "open"),
            OrderStatus::Filled => write!(f, "filled"),
            OrderStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// Trade ID
    pub id: String,
    /// Order ID
    pub order_id: String,
    /// Amount
    pub amount: u64,
    /// Initiator
    pub initiator: String,
    /// Counterparty
    pub counterparty: String,
    /// Trade timestamp
    pub timestamp: u64,
    /// Trade status
    pub status: TradeStatus,
}

/// Trade status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeStatus {
    /// Proposed
    Proposed,
    /// Accepted
    Accepted,
    /// Rejected
    Rejected,
    /// Executing
    Executing,
    /// Confirmed
    Confirmed,
    /// Cancelled
    Cancelled,
}

impl fmt::Display for TradeStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TradeStatus::Proposed => write!(f, "proposed"),
            TradeStatus::Accepted => write!(f, "accepted"),
            TradeStatus::Rejected => write!(f, "rejected"),
            TradeStatus::Executing => write!(f, "executing"),
            TradeStatus::Confirmed => write!(f, "confirmed"),
            TradeStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}