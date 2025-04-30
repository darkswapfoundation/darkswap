//! Circuit relay module for the DarkSwap P2P network.

use libp2p::{
    core::Multiaddr,
    relay,
    swarm::NetworkBehaviour,
    PeerId,
};
use libp2p_swarm_derive::NetworkBehaviour;

/// Circuit relay behaviour for the DarkSwap P2P network.
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "CircuitRelayEvent")]
pub struct CircuitRelayBehaviour {
    /// Relay protocol.
    #[behaviour(ignore)]
    relay: relay::Relay,
}

/// Events emitted by the circuit relay behaviour.
#[derive(Debug)]
pub enum CircuitRelayEvent {}

impl CircuitRelayBehaviour {
    /// Create a new circuit relay behaviour.
    pub fn new() -> Self {
        let relay_config = relay::Config::default();
        let relay = relay::Relay::new(relay_config);

        Self { relay }
    }

    /// Add a relay peer.
    pub fn add_relay(&mut self, _peer_id: &PeerId, _addr: &Multiaddr) {
        // In the current version of libp2p, we don't need to explicitly add relay peers
        // as they are discovered through the DHT or other means
    }
}