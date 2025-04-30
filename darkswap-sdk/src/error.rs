//! Error types for DarkSwap SDK
//!
//! This module provides error types for the DarkSwap SDK.

// Removed unused import
use std::io;
use thiserror::Error;

/// Result type for DarkSwap SDK
pub type Result<T> = std::result::Result<T, Error>;

/// Error type for DarkSwap SDK
#[derive(Error, Debug)]
pub enum Error {
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
    
    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    /// Insufficient balance
    #[error("Insufficient balance")]
    InsufficientBalance,
    /// Invalid amount
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
    
    /// Invalid symbol
    #[error("Invalid symbol")]
    InvalidSymbol,
    
    /// Invalid decimals
    #[error("Invalid decimals")]
    InvalidDecimals,
    
    /// Invalid recipient
    #[error("Invalid recipient")]
    InvalidRecipient,
    
    /// Lock error
    #[error("Lock error")]
    LockError,
    
    /// Rune not found
    #[error("Rune not found")]
    RuneNotFound,
    
    /// Alkane already exists
    #[error("Alkane already exists")]
    AlkaneAlreadyExists,
    
    /// Alkane not found
    #[error("Alkane not found: {0}")]
    AlkaneNotFound(String),
    
    /// Invalid alkane
    #[error("Invalid alkane")]
    InvalidAlkane,
    /// Configuration error
    #[error("Configuration error: {0}")]
    ConfigError(String),
    /// IO error
    #[error("IO error: {0}")]
    IoError(String),
    
    /// Wallet error
    #[error("Wallet error: {0}")]
    WalletError(String),
    
    /// Network error
    #[error("Network error: {0}")]
    NetworkError(String),
    
    /// Order book error
    #[error("Order book error: {0}")]
    OrderBookError(String),
    
    // Removed duplicate OrderbookError variant
    
    /// Trade error
    #[error("Trade error: {0}")]
    TradeError(String),
    
    /// Bridge error
    #[error("Bridge error: {0}")]
    BridgeError(String),
    
    /// Process error
    #[error("Process error: {0}")]
    ProcessError(String),
    
    /// Runtime error
    #[error("Runtime error: {0}")]
    RuntimeError(String),
    
    // SerializationError is already defined above
    
    /// Deserialization error
    #[error("Deserialization error: {0}")]
    DeserializationError(String),
    
    /// Not found error
    #[error("Not found: {0}")]
    NotFoundError(String),
    
    /// Already exists error
    #[error("Already exists: {0}")]
    AlreadyExistsError(String),
    
    /// Invalid argument error
    #[error("Invalid argument: {0}")]
    InvalidArgumentError(String),
    
    /// Permission denied error
    #[error("Permission denied: {0}")]
    PermissionDeniedError(String),
    
    /// Invalid asset type
    #[error("Invalid asset type: {0}")]
    InvalidAssetType(String),
    
    /// Invalid transaction
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),
    
    /// Invalid PSBT
    #[error("Invalid PSBT: {0}")]
    InvalidPsbt(String),
    
    /// Invalid trade state
    #[error("Invalid trade state: {0}")]
    InvalidTradeState(String),
    
    /// Trade not found
    #[error("Trade not found: {0}")]
    TradeNotFound(String),
    
    /// Not a participant
    #[error("Not a participant: {0}")]
    NotParticipant(String),
    
    /// No addresses
    #[error("No addresses")]
    NoAddresses,

    /// Insufficient funds
    #[error("Insufficient funds: {0}")]
    InsufficientFunds(String),

    /// Trade expired
    #[error("Trade expired: {0}")]
    TradeExpired(String),

    /// Not maker
    #[error("Not maker: {0}")]
    NotMaker(String),

    /// Not taker
    #[error("Not taker: {0}")]
    NotTaker(String),
    
    /// Other error
    #[error("Other error: {0}")]
    OtherError(String),
}

impl From<io::Error> for Error {
    fn from(err: io::Error) -> Self {
        Error::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<String> for Error {
    fn from(err: String) -> Self {
        Error::OtherError(err)
    }
}

impl From<&str> for Error {
    fn from(err: &str) -> Self {
        Error::OtherError(err.to_string())
    }
}

impl From<anyhow::Error> for Error {
    fn from(err: anyhow::Error) -> Self {
        Error::OtherError(err.to_string())
    }
}

impl From<crate::wallet::WalletError> for Error {
    fn from(err: crate::wallet::WalletError) -> Self {
        Error::WalletError(err.to_string())
    }
}

impl From<bitcoin::psbt::Error> for Error {
    fn from(err: bitcoin::psbt::Error) -> Self {
        Error::InvalidPsbt(err.to_string())
    }
}