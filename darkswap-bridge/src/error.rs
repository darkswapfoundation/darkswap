//! Error types for DarkSwap Bridge
//!
//! This module provides error types for the DarkSwap Bridge.

use std::fmt;
use std::io;
use thiserror::Error;

/// Result type for DarkSwap Bridge
pub type Result<T> = std::result::Result<T, Error>;

/// Error type for DarkSwap Bridge
#[derive(Error, Debug)]
pub enum Error {
    /// IO error
    #[error("IO error: {0}")]
    IoError(String),
    
    /// Configuration error
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    /// Bridge error
    #[error("Bridge error: {0}")]
    BridgeError(String),
    
    /// Wallet adapter error
    #[error("Wallet adapter error: {0}")]
    WalletAdapterError(String),
    
    /// Network adapter error
    #[error("Network adapter error: {0}")]
    NetworkAdapterError(String),
    
    /// IPC error
    #[error("IPC error: {0}")]
    IpcError(String),
    
    /// Message error
    #[error("Message error: {0}")]
    MessageError(String),
    
    /// Storage error
    #[error("Storage error: {0}")]
    StorageError(String),
    
    /// Authentication error
    #[error("Authentication error: {0}")]
    AuthError(String),
    
    /// Integration error
    #[error("Integration error: {0}")]
    IntegrationError(String),
    
    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    /// Deserialization error
    #[error("Deserialization error: {0}")]
    DeserializationError(String),
    
    /// Process error
    #[error("Process error: {0}")]
    ProcessError(String),
    
    /// Timeout error
    #[error("Timeout error: {0}")]
    TimeoutError(String),
    
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
    
    /// API error
    #[error("API error: {0}")]
    ApiError(String),
    
    /// WebSocket error
    #[error("WebSocket error: {0}")]
    WebSocketError(String),
    
    /// Other error
    #[error("Other error: {0}")]
    OtherError(String),
}

impl From<io::Error> for Error {
    fn from(err: io::Error) -> Self {
        Error::IoError(err.to_string())
    }
}

impl From<ipc_channel::Error> for Error {
    fn from(err: ipc_channel::Error) -> Self {
        Error::IpcError(err.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<bincode::Error> for Error {
    fn from(err: bincode::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<toml::de::Error> for Error {
    fn from(err: toml::de::Error) -> Self {
        Error::DeserializationError(err.to_string())
    }
}

impl From<toml::ser::Error> for Error {
    fn from(err: toml::ser::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<reqwest::Error> for Error {
    fn from(err: reqwest::Error) -> Self {
        Error::OtherError(err.to_string())
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