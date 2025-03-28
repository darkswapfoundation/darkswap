//! Network implementation for darkswap-p2p
//!
//! This module provides the main network implementation for darkswap-p2p,
//! including the Network struct and related functionality.
use crate::{
    behaviour::{new_behaviour, DarkSwapBehaviour, DarkSwapEvent},
    circuit_relay::CircuitRelayEvent,
    error::Error,
    transport::build_transport,
};
use std::str::FromStr;
use void::Void;
use darkswap_support::types::PeerId;
use futures::{
    channel::mpsc,
    prelude::*,
};
use libp2p::{
    core::Multiaddr,
    gossipsub::{GossipsubEvent, IdentTopic, TopicHash},
    swarm::{SwarmBuilder, SwarmEvent},
    PeerId as Libp2pPeerId,
};
use std::{
    collections::{HashMap, HashSet},
    pin::Pin,
    sync::{Arc, Mutex},
    task::{Context, Poll},
    time::Duration,
};
use tokio::time::timeout;

/// Network configuration
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    /// Bootstrap peers
    pub bootstrap_peers: Vec<(PeerId, Multiaddr)>,
    /// Topics to subscribe to
    pub topics: Vec<String>,
    /// Relay peers
    pub relay_peers: Vec<(PeerId, Multiaddr)>,
    /// Connection timeout
    pub connection_timeout: Duration,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        NetworkConfig {
            bootstrap_peers: Vec::new(),
            topics: Vec::new(),
            relay_peers: Vec::new(),
            connection_timeout: Duration::from_secs(30),
        }
    }
}

/// Network event
#[derive(Debug, Clone)]
pub enum NetworkEvent {
    /// Peer connected
    PeerConnected(PeerId),
    /// Peer disconnected
    PeerDisconnected(PeerId),
    /// Message received
    MessageReceived {
        /// Peer ID
        peer_id: PeerId,
        /// Topic
        topic: String,
        /// Message
        message: Vec<u8>,
    },
    /// Relay reserved
    RelayReserved {
        /// Relay peer ID
        relay_peer_id: PeerId,
        /// Reservation ID
        reservation_id: u64,
    },
    /// Connected through relay
    ConnectedThroughRelay {
        /// Relay peer ID
        relay_peer_id: PeerId,
        /// Destination peer ID
        dst_peer_id: PeerId,
    },
}

/// Network implementation
pub struct Network {
    /// Swarm
    swarm: libp2p::swarm::Swarm<DarkSwapBehaviour>,
    /// Local peer ID
    local_peer_id: PeerId,
    /// Connected peers
    connected_peers: HashSet<PeerId>,
    /// Topics
    topics: HashMap<String, TopicHash>,
    /// Event sender
    event_sender: mpsc::Sender<NetworkEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<NetworkEvent>,
    /// Configuration
    config: NetworkConfig,
}

impl Network {
    /// Create a new network
    pub async fn new(config: NetworkConfig) -> Result<Self, Error> {
        // Generate a random keypair
        let keypair = libp2p::identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId(keypair.public().to_peer_id().to_string());
        
        // Create the transport
        let transport = build_transport();
        // Create the behaviour
        let behaviour = match new_behaviour(&local_peer_id, &keypair) {
            Ok(b) => b,
            Err(e) => return Err(Error::Other(format!("Failed to create behaviour: {}", e))),
        };
        
        
        // Create the swarm
        let swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, keypair.public().to_peer_id())
            .build();
        
        // Create the event channel
        let (event_sender, event_receiver) = mpsc::channel(100);
        
        // Create the network
        let mut network = Network {
            swarm,
            local_peer_id,
            connected_peers: HashSet::new(),
            topics: HashMap::new(),
            event_sender,
            event_receiver,
            config,
        };
        
        // Create a clone of the topics and relay peers
        let topics = network.config.topics.clone();
        let relay_peers = network.config.relay_peers.clone();
        
        // Subscribe to topics
        for topic in topics {
            network.subscribe(&topic)?;
        }
        
        // Add relay peers
        for (peer_id, addr) in relay_peers {
            network.swarm.behaviour_mut().circuit_relay.add_relay_peer(peer_id.clone());
            network.dial_peer_with_addr(peer_id, addr).await?;
        }
        
        Ok(network)
    }
    
    /// Get the local peer ID
    pub fn local_peer_id(&self) -> &PeerId {
        &self.local_peer_id
    }
    
    /// Get the connected peers
    pub fn connected_peers(&self) -> &HashSet<PeerId> {
        &self.connected_peers
    }
    /// Subscribe to a topic
    pub fn subscribe(&mut self, topic: &str) -> Result<(), Error> {
        let topic_obj = IdentTopic::new(topic);
        let topic_hash = topic_obj.hash();
        match self.swarm.behaviour_mut().gossipsub.subscribe(&topic_obj) {
            Ok(_) => {
                self.topics.insert(topic.to_string(), topic_hash);
                Ok(())
            },
            Err(e) => Err(Error::Other(format!("Failed to subscribe to topic: {}", e))),
        }
    }
    
    /// Unsubscribe from a topic
    pub fn unsubscribe(&mut self, topic: &str) -> Result<(), Error> {
        if let Some(topic_hash) = self.topics.remove(topic) {
            let topic_obj = IdentTopic::new(topic);
            match self.swarm.behaviour_mut().gossipsub.unsubscribe(&topic_obj) {
                Ok(_) => Ok(()),
                Err(e) => Err(Error::Other(format!("Failed to unsubscribe from topic: {}", e))),
            }
        } else {
            Ok(()) // Not subscribed, so nothing to do
        }
    }
    
    /// Publish a message to a topic
    pub async fn publish(&mut self, topic: &str, message: Vec<u8>) -> Result<(), Error> {
        // Check if we're subscribed to the topic
        if !self.topics.contains_key(topic) {
            return Err(Error::Other(format!("Not subscribed to topic: {}", topic)));
        }
        
        // Create a topic object
        let topic_obj = IdentTopic::new(topic);
        
        // Publish the message
        match self.swarm.behaviour_mut().gossipsub.publish(topic_obj, message) {
            Ok(_) => Ok(()),
            Err(e) => Err(Error::Other(format!("Failed to publish message: {}", e))),
        }
    }
    
    /// Dial a peer with a multiaddress
    pub async fn dial_peer_with_addr(&mut self, peer_id: &PeerId, addr: &Multiaddr) -> Result<(), Error> {
        let libp2p_peer_id = parse_peer_id(&peer_id.0)?;
        let peer_addr = addr.clone().with(libp2p::multiaddr::Protocol::P2p(libp2p_peer_id.into()));
        // Dial the peer
        let dial_result = self.swarm.dial(peer_addr.clone());
        if let Err(e) = dial_result {
            return Err(Error::from(e));
        }
        
        // Wait for the connection to be established
        tokio::time::sleep(self.config.connection_timeout).await;
        .map_err(|e| Error::from(e))?;
        
        Ok(())
    }
    
    /// Connect to a peer through a relay
    pub async fn connect_through_relay(
        &mut self,
        relay_peer_id: &PeerId,
        dst_peer_id: &PeerId,
    ) -> Result<(), Error> {
        // Make a reservation with the relay
        let reservation = self.swarm.behaviour_mut().circuit_relay.make_reservation(relay_peer_id).await?;
        
        // Connect through the relay
        self.swarm.behaviour_mut().circuit_relay.connect_through_relay(
            relay_peer_id,
            dst_peer_id,
            reservation.reservation_id,
        ).await?;
        
        Ok(())
    }
    
    /// Listen on the given address
    pub async fn listen_on(&mut self, addr: &str) -> Result<(), Error> {
        let multiaddr = match addr.parse::<Multiaddr>() {
            Ok(addr) => addr,
            Err(e) => return Err(Error::Other(format!("Invalid multiaddr: {}", e))),
        };
        
        match self.swarm.listen_on(multiaddr) {
            Ok(_) => Ok(()),
            Err(e) => Err(Error::Other(format!("Failed to listen on address: {}", e))),
        }
    }
    
    /// Get the next event
    pub async fn next_event(&mut self) -> Option<NetworkEvent> {
        self.event_receiver.next().await
    }
    
    /// Run the network event loop
    pub async fn run(&mut self) -> Result<(), Error> {
        loop {
            tokio::select! {
                swarm_event = self.swarm.select_next_some() => {
                    self.handle_swarm_event(swarm_event).await?;
                }
                _ = futures::future::pending::<()>() => {
                    break;
                }
            }
        }
        
        Ok(())
    }
    
    /// Handle a swarm event
    async fn handle_swarm_event(&mut self, event: SwarmEvent<DarkSwapEvent, void::Void>) -> Result<(), Error> {
        match event {
            SwarmEvent::Behaviour(DarkSwapEvent::Gossipsub(GossipsubEvent::Message {
                propagation_source,
                message_id: _,
                message,
            })) => {
                // Find the topic name
                let topic_name = self.topics.iter()
                    .find_map(|(name, hash)| if hash == &message.topic { Some(name.clone()) } else { None })
                    .unwrap_or_else(|| message.topic.to_string());
                
                // Convert the peer ID
                let peer_id = PeerId(propagation_source.to_string());
                
                // Send the message event
                self.event_sender.send(NetworkEvent::MessageReceived {
                    peer_id,
                    topic: topic_name,
                    message: message.data,
                }).await
                .map_err(|e| Error::Other(format!("Failed to send event: {}", e)))?;
            }
            SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                let peer_id = PeerId(peer_id.to_string());
                self.connected_peers.insert(peer_id.clone());
                
                // Send the peer connected event
                self.event_sender.send(NetworkEvent::PeerConnected(peer_id)).await
                    .map_err(|e| Error::Other(format!("Failed to send event: {}", e)))?;
            }
            SwarmEvent::ConnectionClosed { peer_id, .. } => {
                let peer_id = PeerId(peer_id.to_string());
                self.connected_peers.remove(&peer_id);
                
                // Send the peer disconnected event
                self.event_sender.send(NetworkEvent::PeerDisconnected(peer_id)).await
                    .map_err(|e| Error::Other(format!("Failed to send event: {}", e)))?;
            }
            SwarmEvent::Behaviour(DarkSwapEvent::CircuitRelay(CircuitRelayEvent::Reserved {
                relay_peer_id,
                reservation_id,
            })) => {
                // Send the relay reserved event
                self.event_sender.send(NetworkEvent::RelayReserved {
                    relay_peer_id,
                    reservation_id,
                }).await
                .map_err(|e| Error::Other(format!("Failed to send event: {}", e)))?;
            }
            SwarmEvent::Behaviour(DarkSwapEvent::CircuitRelay(CircuitRelayEvent::Connected {
                relay_peer_id,
                dst_peer_id,
            })) => {
                // Send the connected through relay event
                self.event_sender.send(NetworkEvent::ConnectedThroughRelay {
                    relay_peer_id,
                    dst_peer_id,
                }).await
                .map_err(|e| Error::Other(format!("Failed to send event: {}", e)))?;
            }
            _ => {}
        }
        
        Ok(())
    }
}

// Helper function to parse a PeerId string
fn parse_peer_id(s: &str) -> Result<Libp2pPeerId, Error> {
    s.parse()
        .map_err(|e| Error::Other(format!("Invalid peer ID: {}", e)))
}