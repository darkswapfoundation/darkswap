//! DarkSwap Relay Server
//!
//! This crate provides a relay server for the DarkSwap P2P network.
//! It implements circuit relay functionality for WebRTC connections,
//! allowing peers to connect to each other even when behind NATs.

pub mod config;
pub mod error;
pub mod server;
pub mod signaling;
pub mod circuit;
pub mod webrtc;
pub mod metrics;
pub mod utils;

use error::Error;

/// Result type for the relay server
pub type Result<T> = std::result::Result<T, Error>;

/// Version of the relay server
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Name of the relay server
pub const NAME: &str = env!("CARGO_PKG_NAME");

/// Description of the relay server
pub const DESCRIPTION: &str = env!("CARGO_PKG_DESCRIPTION");