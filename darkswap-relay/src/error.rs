//! Error types for the DarkSwap Relay Server
//!
//! This module provides error types for the relay server.

use std::{
    io,
    result,
};
use thiserror::Error;
use jsonwebtoken;
use toml;
use webrtc;
use axum;
use warp;
use prometheus;

/// Result type
pub type Result<T> = result::Result<T, Error>;

/// Error type
#[derive(Error, Debug)]
pub enum Error {
    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    
    /// TOML error
    #[error("TOML error: {0}")]
    Toml(#[from] toml::de::Error),
    
    /// JSON error
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    
    /// WebRTC error
    #[error("WebRTC error: {0}")]
    WebRtc(String),
    
    /// Circuit relay error
    #[error("Circuit relay error: {0}")]
    CircuitRelay(String),
    
    /// Connection error
    #[error("Connection error: {0}")]
    Connection(String),
    
    /// Data channel error
    #[error("Data channel error: {0}")]
    DataChannel(String),
    
    /// Connection not found
    #[error("Connection not found: {0}")]
    ConnectionNotFound(String),
    
    /// Circuit limit exceeded
    #[error("Circuit limit exceeded: {0}")]
    CircuitLimitExceeded(String),
    
    /// Permission denied
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    /// Rate limit exceeded
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),
    
    /// Authentication error
    #[error("Authentication error: {0}")]
    Authentication(String),
    
    /// Prometheus error
    #[error("Prometheus error: {0}")]
    Prometheus(#[from] prometheus::Error),
    
    /// Other error
    #[error("Other error: {0}")]
    Other(String),
}

impl From<&str> for Error {
    fn from(s: &str) -> Self {
        Error::Other(s.to_string())
    }
}

impl From<String> for Error {
    fn from(s: String) -> Self {
        Error::Other(s)
    }
}

impl From<webrtc::Error> for Error {
    fn from(e: webrtc::Error) -> Self {
        Error::WebRtc(e.to_string())
    }
}

impl From<axum::Error> for Error {
    fn from(e: axum::Error) -> Self {
        Error::Other(e.to_string())
    }
}

impl From<warp::Error> for Error {
    fn from(e: warp::Error) -> Self {
        Error::Other(e.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for Error {
    fn from(e: jsonwebtoken::errors::Error) -> Self {
        Error::Authentication(e.to_string())
    }
}