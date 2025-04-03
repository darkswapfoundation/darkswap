//! Transport functionality for the P2P network.

use libp2p::{
    core::transport::OrTransport,
    identity::Keypair,
    noise,
    tcp::GenTcpConfig,
    websocket::WsConfig,
    yamux, Transport,
};
use std::time::Duration;

/// Create a transport for the P2P network.
pub fn create_transport(
    keypair: &Keypair,
) -> Result<libp2p::core::transport::Boxed<(libp2p::PeerId, libp2p::core::muxing::StreamMuxerBox)>, Box<dyn std::error::Error>> {
    // Create a TCP transport
    let tcp_transport = GenTcpConfig::default().nodelay(true);

    // Create a WebSocket transport
    let ws_transport = WsConfig::new(GenTcpConfig::default().nodelay(true));

    // Combine the transports
    let transport = OrTransport::new(tcp_transport, ws_transport);

    // Add authentication and multiplexing
    let noise_keys = noise::Keypair::<noise::X25519Spec>::new()
        .into_authentic(keypair)
        .expect("Signing libp2p-noise static DH keypair failed.");

    Ok(transport
        .upgrade(libp2p::core::upgrade::Version::V1)
        .authenticate(noise::NoiseConfig::xx(noise_keys).into_authenticated())
        .multiplex(yamux::YamuxConfig::default())
        .timeout(Duration::from_secs(20))
        .boxed())
}

/// Create a WebRTC transport for the P2P network.
#[cfg(feature = "webrtc")]
pub fn create_webrtc_transport(
    keypair: &Keypair,
) -> Result<libp2p::core::transport::Boxed<(libp2p::PeerId, libp2p::core::muxing::StreamMuxerBox)>, Box<dyn std::error::Error>> {
    use libp2p_webrtc::{Certificate, WebRtcConfig, WebRtcTransport};

    // Generate a self-signed certificate for WebRTC
    let certificate = Certificate::generate(&mut rand::thread_rng())?;

    // Create a WebRTC transport
    let webrtc_transport = WebRtcTransport::new(WebRtcConfig::new(), certificate);

    // Add authentication and multiplexing
    let noise_keys = noise::Keypair::<noise::X25519Spec>::new()
        .into_authentic(keypair)
        .expect("Signing libp2p-noise static DH keypair failed.");

    Ok(webrtc_transport
        .upgrade(libp2p::core::upgrade::Version::V1)
        .authenticate(noise::NoiseConfig::xx(noise_keys).into_authenticated())
        .multiplex(yamux::YamuxConfig::default())
        .timeout(Duration::from_secs(20))
        .boxed())
}
