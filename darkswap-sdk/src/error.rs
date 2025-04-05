//! Error types for DarkSwap SDK
//!
//! This module provides error types for the DarkSwap SDK.

use std::fmt;
use std::io;
use thiserror::Error;

/// Result type for DarkSwap SDK
pub type Result<T> = std::result::Result<T, Error>;

/// Error type for DarkSwap SDK
#[derive(Error, Debug)]
pub enum Error {
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
    
    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
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