//! Error types for DarkSwap
//!
//! This module defines the error types used throughout the DarkSwap SDK.

use thiserror::Error;

/// Result type for DarkSwap
pub type Result<T> = std::result::Result<T, Error>;

/// Error type for DarkSwap
#[derive(Error, Debug)]
pub enum Error {
    /// Configuration error
    #[error("Configuration error: {0}")]
    ConfigError(String),

    /// Network error
    #[error("Network error: {0}")]
    NetworkError(String),

    /// Orderbook error
    #[error("Orderbook error: {0}")]
    OrderbookError(String),

    /// Trade error
    #[error("Trade error: {0}")]
    TradeError(String),

    /// Bitcoin error
    #[error("Bitcoin error: {0}")]
    BitcoinError(String),

    /// Wallet error
    #[error("Wallet error: {0}")]
    WalletError(String),

    /// Invalid asset
    #[error("Invalid asset: {0}")]
    InvalidAsset(String),

    /// Invalid order side
    #[error("Invalid order side: {0}")]
    InvalidOrderSide(String),

    /// Invalid order
    #[error("Invalid order: {0}")]
    InvalidOrder(String),

    /// Invalid trade
    #[error("Invalid trade: {0}")]
    InvalidTrade(String),

    /// Invalid transaction
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),

    /// Invalid amount
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),

    /// Invalid trade amount
    #[error("Invalid trade amount")]
    InvalidTradeAmount,

    /// Insufficient funds
    #[error("Insufficient funds")]
    InsufficientFunds,
    
    /// Insufficient balance
    #[error("Insufficient balance")]
    InsufficientBalance,

    /// Order not found
    #[error("Order not found: {0}")]
    OrderNotFound(String),

    /// Trade not found
    #[error("Trade not found: {0}")]
    TradeNotFound(String),

    /// Order not open
    #[error("Order not open")]
    OrderNotOpen,

    /// Rune error
    #[error("Rune error: {0}")]
    RuneError(String),
    
    /// Rune not found
    #[error("Rune not found")]
    RuneNotFound,
    
    /// Invalid rune
    #[error("Invalid rune")]
    InvalidRune,
    
    /// Invalid symbol
    #[error("Invalid symbol")]
    InvalidSymbol,
    
    /// Invalid decimals
    #[error("Invalid decimals")]
    InvalidDecimals,
    
    /// Invalid recipient
    #[error("Invalid recipient")]
    InvalidRecipient,

    /// Rune lock error
    #[error("Rune lock error")]
    RuneLockError,

    /// Alkane error
    #[error("Alkane error: {0}")]
    AlkaneError(String),
    
    /// Alkane not found
    #[error("Alkane not found: {0}")]
    AlkaneNotFound(String),
    
    /// Alkane already exists
    #[error("Alkane already exists")]
    AlkaneAlreadyExists,
    
    /// Invalid alkane
    #[error("Invalid alkane")]
    InvalidAlkane,
    
    /// Invalid name
    #[error("Invalid name")]
    InvalidName,
    
    /// Invalid description
    #[error("Invalid description")]
    InvalidDescription,
    
    /// Invalid icon
    #[error("Invalid icon")]
    InvalidIcon,
    
    /// Invalid metadata
    #[error("Invalid metadata")]
    InvalidMetadata,

    /// Alkane lock error
    #[error("Alkane lock error")]
    AlkaneLockError,
    
    /// Lock error
    #[error("Lock error")]
    LockError,
    
    /// Serialization error
    #[error("Serialization error")]
    SerializationError,

    /// Trade lock error
    #[error("Trade lock error")]
    TradeLockError,
    
    /// Invalid runestone
    #[error("Invalid runestone: {0}")]
    InvalidRunestone(String),

    /// Orderbook lock error
    #[error("Orderbook lock error")]
    OrderbookLockError,

    /// WASM error
    #[error("WASM error: {0}")]
    WasmError(String),

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// JSON error
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// Bitcoin consensus error
    #[error("Bitcoin consensus error: {0}")]
    BitcoinConsensusError(String),

    /// Bitcoin hashes error
    #[error("Bitcoin hashes error: {0}")]
    BitcoinHashesError(String),

    /// Bitcoin secp256k1 error
    #[error("Bitcoin secp256k1 error: {0}")]
    BitcoinSecp256k1Error(String),

    /// Bitcoin address error
    #[error("Bitcoin address error: {0}")]
    BitcoinAddressError(String),

    /// Bitcoin script error
    #[error("Bitcoin script error: {0}")]
    BitcoinScriptError(String),

    /// Bitcoin PSBT error
    #[error("Bitcoin PSBT error: {0}")]
    BitcoinPsbtError(String),

    /// Decimal error
    #[error("Decimal error: {0}")]
    DecimalError(String),

    /// Compression error
    #[error("Compression error: {0}")]
    CompressionError(String),

    /// Invalid PSBT
    #[error("Invalid PSBT")]
    InvalidPsbt,

    /// Unknown error
    #[error("Unknown error: {0}")]
    UnknownError(String),
}

impl From<bitcoin::psbt::Error> for Error {
    fn from(error: bitcoin::psbt::Error) -> Self {
        Error::BitcoinPsbtError(error.to_string())
    }
}

impl From<bitcoin::util::address::Error> for Error {
    fn from(error: bitcoin::util::address::Error) -> Self {
        Error::BitcoinAddressError(error.to_string())
    }
}

impl From<bitcoin::util::key::Error> for Error {
    fn from(error: bitcoin::util::key::Error) -> Self {
        Error::BitcoinError(error.to_string())
    }
}

impl From<rust_decimal::Error> for Error {
    fn from(error: rust_decimal::Error) -> Self {
        Error::DecimalError(error.to_string())
    }
}

impl From<String> for Error {
    fn from(error: String) -> Self {
        Error::UnknownError(error)
    }
}

impl From<&str> for Error {
    fn from(error: &str) -> Self {
        Error::UnknownError(error.to_string())
    }
}

// Add From implementation for libp2p ConnectionDenied
// Commented out because ConnectionDenied is not available in the current version of libp2p
// impl From<libp2p::swarm::ConnectionDenied> for Error {
//     fn from(error: libp2p::swarm::ConnectionDenied) -> Self {
//         Error::NetworkError(format!("Connection denied: {:?}", error))
//     }
// }

// Note: We don't need to implement From<std::io::Error> for Error
// because it's already implemented by the thiserror derive macro