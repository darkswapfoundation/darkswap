//! DarkSwap P2P networking library
//!
//! This crate provides the P2P networking functionality for DarkSwap.
//! It includes WebRTC transport for browser compatibility and circuit relay
//! for NAT traversal.

pub mod transport;
pub mod behaviour;
pub mod network;
pub mod circuit_relay;
pub mod error;
pub mod signaling_client;
pub mod webrtc_transport;

pub use network::Network;
pub use error::Error;
pub use webrtc_transport::WebRtcTransport;
pub use webrtc_transport::WebRtcTransport;