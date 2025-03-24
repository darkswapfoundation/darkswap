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

    /// Insufficient funds
    #[error("Insufficient funds")]
    InsufficientFunds,

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

    /// Rune lock error
    #[error("Rune lock error")]
    RuneLockError,

    /// Alkane error
    #[error("Alkane error: {0}")]
    AlkaneError(String),

    /// Alkane lock error
    #[error("Alkane lock error")]
    AlkaneLockError,

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
    BitcoinConsensusError(#[from] bitcoin::consensus::Error),

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

    /// Unknown error
    #[error("Unknown error: {0}")]
    UnknownError(String),
}

impl From<bitcoin::psbt::Error> for Error {
    fn from(error: bitcoin::psbt::Error) -> Self {
        Error::BitcoinPsbtError(error.to_string())
    }
}

impl From<bitcoin::address::Error> for Error {
    fn from(error: bitcoin::address::Error) -> Self {
        Error::BitcoinAddressError(error.to_string())
    }
}

impl From<bitcoin::key::Error> for Error {
    fn from(error: bitcoin::key::Error) -> Self {
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