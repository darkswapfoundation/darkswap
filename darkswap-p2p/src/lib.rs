//! DarkSwap P2P Networking
//!
//! This library provides P2P networking functionality for the DarkSwap platform.

pub mod auth;
pub mod behaviour;
pub mod circuit_relay;
pub mod config;
pub mod connection_pool;
pub mod discovery;
pub mod encryption;
pub mod message;
pub mod metrics;
pub mod network;
pub mod protocol;
pub mod relay_connection_pool;
pub mod relay_discovery;
pub mod transport;
pub mod webrtc_connection;
pub mod webrtc_signaling_client;

/// Re-export common types from darkswap-lib
pub use darkswap_lib::{Error, Result};

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Library name
pub const NAME: &str = env!("CARGO_PKG_NAME");

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}