//! Discovery mechanisms for the P2P network.

use libp2p::{
    kad::{store::MemoryStore, Kademlia, KademliaConfig, KademliaEvent},
    mdns::{self, Mdns, MdnsConfig},
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
    mdns: Mdns,
}

/// Events emitted by the discovery behaviour.
#[derive(Debug)]
pub enum DiscoveryEvent {
    /// Kademlia event.
    Kademlia(KademliaEvent),
    /// mDNS event.
    Mdns(mdns::Event),
}

impl From<KademliaEvent> for DiscoveryEvent {
    fn from(event: KademliaEvent) -> Self {
        Self::Kademlia(event)
    }
}

impl From<mdns::Event> for DiscoveryEvent {
    fn from(event: mdns::Event) -> Self {
        Self::Mdns(event)
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

        // Create an mDNS discovery service
        let mdns = Mdns::new(MdnsConfig::default()).await?;

        Ok(Self { kademlia, mdns })
    }

    /// Add a known peer to the DHT.
    pub fn add_address(&mut self, peer_id: &PeerId, addr: &libp2p::Multiaddr) {
        self.kademlia.add_address(peer_id, addr.clone());
    }

    /// Get the list of discovered peers.
    pub fn discovered_peers(&self) -> HashSet<PeerId> {
        self.mdns.discovered_nodes().collect()
    }

    /// Bootstrap the DHT.
    pub fn bootstrap(&mut self) -> Result<libp2p::kad::QueryId, libp2p::kad::NoKnownPeers> {
        self.kademlia.bootstrap()
    }
}