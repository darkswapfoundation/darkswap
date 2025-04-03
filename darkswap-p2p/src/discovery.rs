//! Discovery mechanisms for the P2P network.

use libp2p::{
    kad::{store::MemoryStore, Kademlia, KademliaConfig, KademliaEvent},
    swarm::NetworkBehaviour,
    PeerId,
};
use std::collections::HashSet;
use std::time::Duration;

/// Discovery behaviour for the P2P network.
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
    pub async fn new(local_peer_id: PeerId) -> Result<Self, Box<dyn std::error::Error>> {
        // Create a Kademlia DHT
        let store = MemoryStore::new(local_peer_id);
        let mut kademlia_config = KademliaConfig::default();
        kademlia_config.set_query_timeout(Duration::from_secs(5 * 60));
        let mut kademlia = Kademlia::with_config(local_peer_id, store, kademlia_config);

        Ok(Self { kademlia })
    }

    /// Add a known peer to the DHT.
    pub fn add_address(&mut self, peer_id: &PeerId, addr: &libp2p::Multiaddr) {
        self.kademlia.add_address(peer_id, addr.clone());
    }

    /// Get the list of discovered peers.
    pub fn discovered_peers(&self) -> HashSet<PeerId> {
        self.kademlia.kbuckets()
            .flat_map(|bucket| bucket.iter().map(|entry| *entry.node.key.preimage()))
            .collect()
    }

    /// Bootstrap the DHT.
    pub fn bootstrap(&mut self) -> Result<libp2p::kad::QueryId, libp2p::kad::NoKnownPeers> {
        self.kademlia.bootstrap()
    }
}