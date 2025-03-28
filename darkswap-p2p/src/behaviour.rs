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
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "DarkSwapEvent")]
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
    let gossipsub_config = GossipsubConfig::default()
        .validation_mode(ValidationMode::Strict)
        .message_id_fn(|message: &libp2p::gossipsub::Message| {
            use std::hash::{Hash, Hasher};
            let mut s = std::collections::hash_map::DefaultHasher::new();
            message.data.hash(&mut s);
            libp2p::gossipsub::MessageId::from(s.finish().to_string())
        });
    
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