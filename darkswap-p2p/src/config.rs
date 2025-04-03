//! Configuration for the P2P network.

use std::time::Duration;

/// Configuration for the P2P network.
#[derive(Debug, Clone)]
pub struct Config {
    /// The addresses to listen on.
    pub listen_addresses: Vec<String>,
    /// The bootstrap peers.
    pub bootstrap_peers: Vec<String>,
    /// The relay servers.
    pub relay_servers: Vec<String>,
    /// The node ID.
    pub node_id: Option<String>,
    /// Whether to enable WebRTC.
    pub enable_webrtc: bool,
    /// Whether to enable circuit relay.
    pub enable_circuit_relay: bool,
    /// Whether to enable DHT.
    pub enable_dht: bool,
    /// Whether to enable GossipSub.
    pub enable_gossipsub: bool,
    /// The ping interval.
    pub ping_interval: Duration,
    /// The connection timeout.
    pub connection_timeout: Duration,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            listen_addresses: vec!["/ip4/0.0.0.0/tcp/9000".to_string()],
            bootstrap_peers: vec![],
            relay_servers: vec![],
            node_id: None,
            enable_webrtc: true,
            enable_circuit_relay: true,
            enable_dht: true,
            enable_gossipsub: true,
            ping_interval: Duration::from_secs(30),
            connection_timeout: Duration::from_secs(60),
        }
    }
}