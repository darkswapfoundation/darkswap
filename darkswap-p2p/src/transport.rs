//! Transport implementations for darkswap-p2p
//!
//! This module provides transport implementations for darkswap-p2p,
//! including WebRTC transport for browser compatibility.

use libp2p::{
    core::{transport::OrTransport, upgrade},
    dns, noise, tcp, websocket, yamux, Transport,
};
use std::time::Duration;
use crate::webrtc_transport::WebRtcTransport;

/// Build a transport for the current platform
///
/// This function builds a transport for the current platform,
/// using the appropriate transport implementation based on the
/// target platform.
#[cfg(feature = "native")]
pub fn build_transport() -> libp2p::core::transport::Boxed<(libp2p::PeerId, libp2p::core::muxing::StreamMuxerBox)> {
    let tcp_transport = tcp::async_io::Transport::new(tcp::Config::default().nodelay(true))
        .upgrade(upgrade::Version::V1)
        .authenticate(noise::Config::new(&libp2p::identity::Keypair::generate_ed25519()).unwrap())
        .multiplex(yamux::Config::default())
        .timeout(Duration::from_secs(20))
        .boxed();

    let ws_transport = websocket::WsConfig::new(dns::TokioDnsConfig::system(tcp::async_io::Transport::new(tcp::Config::default().nodelay(true))).unwrap())
        .upgrade(upgrade::Version::V1)
        .authenticate(noise::Config::new(&libp2p::identity::Keypair::generate_ed25519()).unwrap())
        .multiplex(yamux::Config::default())
        .timeout(Duration::from_secs(20))
        .boxed();

    OrTransport::new(tcp_transport, ws_transport).boxed()
}

/// Build a transport for the WebAssembly platform
///
/// This function builds a transport for the WebAssembly platform,
/// using the WebSockets transport for browser compatibility.
#[cfg(feature = "wasm")]
pub fn build_wasm_transport() -> libp2p::core::transport::Boxed<(libp2p::PeerId, libp2p::core::muxing::StreamMuxerBox)> {
    let keypair = libp2p::identity::Keypair::generate_ed25519();
    let peer_id = libp2p::PeerId::from(keypair.public());
    
    // Create a WebRTC transport
    let webrtc_transport = WebRtcTransport::new(peer_id.clone());
    
    // Create a WebSocket transport as fallback
    let ws_transport = websocket::WsConfig::new(libp2p::wasm_ext::ffi::websocket_transport())
        .upgrade(upgrade::Version::V1)
        .authenticate(noise::Config::new(&keypair).unwrap())
        .multiplex(yamux::Config::default())
        .timeout(Duration::from_secs(20))
        .boxed();
    
    // Combine WebRTC and WebSocket transports
    OrTransport::new(webrtc_transport, ws_transport).boxed()
}
