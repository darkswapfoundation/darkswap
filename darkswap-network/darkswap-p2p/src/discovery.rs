//! Discovery module for the DarkSwap P2P network.

use libp2p::{
    kad::{store::MemoryStore, Kademlia, KademliaConfig, KademliaEvent},
    swarm::NetworkBehaviour,
    PeerId,
};
use libp2p_swarm_derive::NetworkBehaviour;

/// Discovery behaviour for the DarkSwap P2P network.
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "DiscoveryEvent")]
pub struct DiscoveryBehaviour {
    kademlia: Kademlia<MemoryStore>,
}

/// Events emitted by the discovery behaviour.
#[derive(Debug)]
pub enum DiscoveryEvent {
    /// Kademlia event.
    Kademlia(KademliaEvent),
}

impl From<KademliaEvent> for DiscoveryEvent {
    fn from(event: KademliaEvent) -> Self {
        Self::Kademlia(event)
    }
}

impl DiscoveryBehaviour {
    /// Create a new discovery behaviour.
    pub fn new(local_peer_id: PeerId) -> Self {
        // Create a Kademlia DHT
        let store = MemoryStore::new(local_peer_id);
        let mut kademlia_config = KademliaConfig::default();
        kademlia_config.set_query_timeout(std::time::Duration::from_secs(5 * 60));
        let kademlia = Kademlia::with_config(local_peer_id, store, kademlia_config);

        Self { kademlia }
    }

    /// Bootstrap the DHT.
    pub fn bootstrap(&mut self) -> Result<libp2p::kad::QueryId, libp2p::kad::NoKnownPeers> {
        self.kademlia.bootstrap()
    }

    /// Add a known peer to the DHT.
    pub fn add_address(&mut self, peer_id: &PeerId, addr: &libp2p::Multiaddr) {
        self.kademlia.add_address(peer_id, addr.clone());
    }
}