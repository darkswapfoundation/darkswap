//! Network behaviour for darkswap-p2p
//!
//! This module provides the network behaviour for darkswap-p2p,
//! combining various libp2p protocols into a single behaviour.

use crate::circuit_relay::{CircuitRelayBehaviour, CircuitRelayEvent, RelayConfig};
use darkswap_support::types::PeerId;
use libp2p::{
    gossipsub::{Gossipsub, GossipsubConfig, GossipsubEvent, MessageAuthenticity, ValidationMode},
    identify::{Identify, IdentifyConfig, IdentifyEvent},
    kad::{store::MemoryStore, Kademlia, KademliaConfig, KademliaEvent},
    ping::{Ping, PingConfig, PingEvent},
    swarm::NetworkBehaviour,
};
use std::time::Duration;

/// Combined network behaviour for darkswap-p2p
pub struct DarkSwapBehaviour {
    /// Ping protocol
    pub ping: Ping,
    /// Identify protocol
    pub identify: Identify,
    /// Kademlia DHT
    pub kademlia: Kademlia<MemoryStore>,
    /// GossipSub protocol
    pub gossipsub: Gossipsub,
    /// Circuit relay protocol
    pub circuit_relay: CircuitRelayBehaviour,
}

/// Events emitted by the network behaviour
#[derive(Debug)]
pub enum DarkSwapEvent {
    /// Ping event
    Ping(PingEvent),
    /// Identify event
    Identify(IdentifyEvent),
    /// Kademlia event
    Kademlia(KademliaEvent),
    /// GossipSub event
    Gossipsub(GossipsubEvent),
    /// Circuit relay event
    CircuitRelay(CircuitRelayEvent),
}

impl From<PingEvent> for DarkSwapEvent {
    fn from(event: PingEvent) -> Self {
        DarkSwapEvent::Ping(event)
    }
}

impl From<IdentifyEvent> for DarkSwapEvent {
    fn from(event: IdentifyEvent) -> Self {
        DarkSwapEvent::Identify(event)
    }
}

impl From<KademliaEvent> for DarkSwapEvent {
    fn from(event: KademliaEvent) -> Self {
        DarkSwapEvent::Kademlia(event)
    }
}

impl From<GossipsubEvent> for DarkSwapEvent {
    fn from(event: GossipsubEvent) -> Self {
        DarkSwapEvent::Gossipsub(event)
    }
}

impl From<CircuitRelayEvent> for DarkSwapEvent {
    fn from(event: CircuitRelayEvent) -> Self {
        DarkSwapEvent::CircuitRelay(event)
    }
}

impl NetworkBehaviour for DarkSwapBehaviour {
    type ConnectionHandler = libp2p::swarm::dummy::ConnectionHandler;
    type OutEvent = DarkSwapEvent;

    fn new_handler(&mut self) -> Self::ConnectionHandler {
        libp2p::swarm::dummy::ConnectionHandler
    }

    fn addresses_of_peer(&mut self, peer_id: &libp2p::PeerId) -> Vec<libp2p::Multiaddr> {
        let mut addresses = Vec::new();
        addresses.extend(self.kademlia.addresses_of_peer(peer_id));
        addresses.extend(self.identify.addresses_of_peer(peer_id));
        addresses
    }

    fn inject_connection_established(
        &mut self,
        peer_id: &libp2p::PeerId,
        connection_id: &libp2p::swarm::ConnectionId,
        endpoint: &libp2p::core::ConnectedPoint,
        _failed_addresses: Option<&Vec<libp2p::Multiaddr>>,
        _other_established: usize,
    ) {
        // We need to handle this differently since we can't pass our dummy handler to the sub-behaviors
        // Instead, we'll use the on_connection_established method which is the newer approach
        
        // For now, we'll just log the connection established event
        log::debug!("Connection established with peer: {}", peer_id);
    }
fn inject_connection_closed(
    &mut self,
    peer_id: &libp2p::PeerId,
    connection_id: &libp2p::swarm::ConnectionId,
    endpoint: &libp2p::core::ConnectedPoint,
    _handler: Self::ConnectionHandler,
    remaining_established: usize,
) {
    // We need to handle this differently since we can't pass our dummy handler to the sub-behaviors
    // Instead, we'll use the on_connection_closed method which is the newer approach
    
    // For now, we'll just log the connection closed event
    log::debug!("Connection closed with peer: {}", peer_id);
}
    }

    fn poll(
        &mut self,
        cx: &mut std::task::Context<'_>,
        params: &mut impl libp2p::swarm::PollParameters,
    ) -> std::task::Poll<libp2p::swarm::NetworkBehaviourAction<DarkSwapEvent, libp2p::swarm::dummy::ConnectionHandler>> {
        use std::task::Poll;
        
        // Poll each protocol and convert the events
        // For now, we'll just return Pending since we can't easily convert between the different handler types
        // In a real implementation, we would need to handle each protocol's events separately

        // Check if any protocol has events
        if self.ping.poll(cx, params).is_ready() ||
           self.identify.poll(cx, params).is_ready() ||
           self.kademlia.poll(cx, params).is_ready() ||
           self.gossipsub.poll(cx, params).is_ready() ||
           self.circuit_relay.poll(cx, params).is_ready() {
            // For now, we'll just log that we received an event
            log::debug!("Received an event from a sub-protocol");
        }

        Poll::Pending
    }

/// Create a new DarkSwapBehaviour
pub fn new_behaviour(
    local_peer_id: &PeerId,
    keypair: &libp2p::identity::Keypair,
) -> Result<DarkSwapBehaviour, Box<dyn std::error::Error>> {
    let peer_id = libp2p::PeerId::from_public_key(&keypair.public());
    
    // Create ping behaviour
    let ping = Ping::new(PingConfig::new().with_interval(Duration::from_secs(30)));
    
    // Create identify behaviour
    let identify = Identify::new(IdentifyConfig::new(
        "/darkswap/1.0.0".to_string(),
        keypair.public(),
    ));
    
    // Create Kademlia behaviour
    let store = MemoryStore::new(peer_id);
    let kademlia = Kademlia::new(peer_id, store);
    
    // Create GossipSub behaviour
    let message_id_fn = |message: &libp2p::gossipsub::Message| {
        use std::hash::{Hash, Hasher};
        let mut s = std::collections::hash_map::DefaultHasher::new();
        message.data.hash(&mut s);
        libp2p::gossipsub::MessageId::from(s.finish().to_string())
    };
    
    // Create GossipSub config
    let gossipsub_config = GossipsubConfig::default();
    
    let gossipsub = Gossipsub::new(
        MessageAuthenticity::Signed(keypair.clone()),
        gossipsub_config,
    )?;
    
    // Create circuit relay behaviour
    let circuit_relay = CircuitRelayBehaviour::new(
        local_peer_id.clone(),
        RelayConfig::default(),
    );
    
    Ok(DarkSwapBehaviour {
        ping,
        identify,
        kademlia,
        gossipsub,
        circuit_relay,
    })
}