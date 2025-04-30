//! Error types for the DarkSwap library.

use thiserror::Error;

/// DarkSwap library error type.
#[derive(Debug, Error)]
pub enum Error {
    /// IO error.
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON error.
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// Bitcoin error.
    #[error("Bitcoin error: {0}")]
    Bitcoin(String),

    /// Rune error.
    #[error("Rune error: {0}")]
    Rune(String),

    /// Alkane error.
    #[error("Alkane error: {0}")]
    Alkane(String),

    /// Wallet error.
    #[error("Wallet error: {0}")]
    Wallet(String),

    /// P2P error.
    #[error("P2P error: {0}")]
    P2P(String),

    /// Trade error.
    #[error("Trade error: {0}")]
    Trade(String),

    /// Order error.
    #[error("Order error: {0}")]
    Order(String),

    /// Authentication error.
    #[error("Authentication error: {0}")]
    Authentication(String),

    /// Authorization error.
    #[error("Authorization error: {0}")]
    Authorization(String),

    /// Validation error.
    #[error("Validation error: {0}")]
    Validation(String),

    /// Database error.
    #[error("Database error: {0}")]
    Database(String),

    /// External service error.
    #[error("External service error: {0}")]
    ExternalService(String),

    /// Configuration error.
    #[error("Configuration error: {0}")]
    Configuration(String),

    /// Not found error.
    #[error("Not found: {0}")]
    NotFound(String),

    /// Conflict error.
    #[error("Conflict: {0}")]
    Conflict(String),

    /// Internal error.
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Result type for the DarkSwap library.
pub type Result<T> = std::result::Result<T, Error>;