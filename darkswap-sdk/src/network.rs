//! P2P networking for DarkSwap
//!
//! This module provides P2P networking functionality for DarkSwap, including
//! WebRTC transport, circuit relay, and message broadcasting.

use crate::error::{Error, Result};
use crate::config::NetworkConfig;
use crate::orderbook::Order;
use crate::types::{OrderId, PeerId, TradeId};
use libp2p::{
    core::{
        muxing::StreamMuxerBox,
        transport::Boxed,
        upgrade,
    },
    gossipsub::{
        self, Gossipsub, GossipsubEvent, GossipsubMessage, MessageAuthenticity, MessageId, Topic,
        ValidationMode,
    },
    identity::Keypair,
    kad::{store::MemoryStore, Kademlia, KademliaEvent},
    mdns::{Mdns, MdnsEvent},
    noise,
    relay,
    swarm::{NetworkBehaviour, SwarmBuilder, SwarmEvent},
    tcp, yamux, Multiaddr, PeerId as LibP2PPeerId, Swarm, Transport,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::mpsc;

/// Network event
#[derive(Debug, Clone)]
pub enum NetworkEvent {
    /// New peer connected
    PeerConnected(PeerId),
    /// Peer disconnected
    PeerDisconnected(PeerId),
    /// Message received
    MessageReceived {
        /// Sender peer ID
        from: PeerId,
        /// Message type
        message: MessageType,
    },
}

/// Message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    /// Order message
    Order(Order),
    /// Cancel order message
    CancelOrder(OrderId),
    /// Trade request message
    TradeRequest(TradeId, PeerId, OrderId),
    /// Trade response message
    TradeResponse(TradeId, bool),
    /// PSBT message
    Psbt(TradeId, Vec<u8>),
    /// Transaction message
    Transaction(TradeId, String),
    /// Ping message
    Ping,
    /// Pong message
    Pong,
}

/// Network behavior
#[derive(NetworkBehaviour)]
struct NetworkBehavior {
    /// Gossipsub for message broadcasting
    gossipsub: Gossipsub,
    /// Kademlia for peer discovery
    kademlia: Kademlia<MemoryStore>,
    /// mDNS for local peer discovery
    mdns: Mdns,
    /// Relay client for NAT traversal
    relay_client: relay::client::Client,
}

/// Network implementation
pub struct Network {
    /// Network configuration
    config: NetworkConfig,
    /// Swarm
    swarm: Option<Swarm<NetworkBehavior>>,
    /// Local peer ID
    local_peer_id: PeerId,
    /// Network keypair
    keypair: Keypair,
    /// Gossipsub topic
    topic: Topic,
    /// Event sender
    event_sender: mpsc::Sender<NetworkEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<NetworkEvent>,
    /// Command sender
    command_sender: mpsc::Sender<NetworkCommand>,
    /// Command receiver
    command_receiver: mpsc::Receiver<NetworkCommand>,
    /// Known peers
    known_peers: Arc<Mutex<HashSet<PeerId>>>,
    /// Connected peers
    connected_peers: Arc<Mutex<HashSet<PeerId>>>,
    /// Response channels
    response_channels: Arc<Mutex<HashMap<String, tokio::sync::oneshot::Sender<Result<MessageType>>>>>,
}

/// Network command
enum NetworkCommand {
    /// Send a message to a specific peer
    SendMessage {
        /// Peer ID to send to
        peer_id: PeerId,
        /// Message to send
        message: MessageType,
        /// Response channel
        response_channel: Option<tokio::sync::oneshot::Sender<Result<()>>>,
    },
    /// Broadcast a message to all peers
    BroadcastMessage {
        /// Message to broadcast
        message: MessageType,
        /// Response channel
        response_channel: Option<tokio::sync::oneshot::Sender<Result<()>>>,
    },
    /// Request a response from a peer
    RequestResponse {
        /// Peer ID to request from
        peer_id: PeerId,
        /// Request message
        request: MessageType,
        /// Response channel
        response_channel: tokio::sync::oneshot::Sender<Result<MessageType>>,
        /// Request ID
        request_id: String,
    },
}

impl Network {
    /// Create a new network
    pub fn new(config: &NetworkConfig) -> Result<Self> {
        // Create keypair
        let keypair = Keypair::generate_ed25519();
        let local_peer_id = PeerId(keypair.public().to_peer_id().to_string());

        // Create channels
        let (event_sender, event_receiver) = mpsc::channel(100);
        let (command_sender, command_receiver) = mpsc::channel(100);

        // Create gossipsub topic
        let topic = Topic::new(config.gossipsub_topic.clone());

        Ok(Self {
            config: config.clone(),
            swarm: None,
            local_peer_id,
            keypair,
            topic,
            event_sender,
            event_receiver,
            command_sender,
            command_receiver,
            known_peers: Arc::new(Mutex::new(HashSet::new())),
            connected_peers: Arc::new(Mutex::new(HashSet::new())),
            response_channels: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Start the network
    pub async fn start(&mut self) -> Result<()> {
        // Create transport
        let transport = self.create_transport().await?;

        // Create gossipsub
        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(self.config.gossipsub_heartbeat_interval))
            .validation_mode(ValidationMode::Strict)
            .message_id_fn(|message: &GossipsubMessage| {
                let mut s = DefaultHasher::new();
                message.data.hash(&mut s);
                MessageId::from(s.finish().to_string())
            })
            .build()
            .map_err(|e| Error::NetworkError(format!("Failed to build gossipsub config: {}", e)))?;

        let gossipsub = Gossipsub::new(
            MessageAuthenticity::Signed(self.keypair.clone()),
            gossipsub_config,
        )
        .map_err(|e| Error::NetworkError(format!("Failed to create gossipsub: {}", e)))?;

        // Create Kademlia
        let store = MemoryStore::new(self.keypair.public().to_peer_id());
        let mut kademlia = Kademlia::new(self.keypair.public().to_peer_id(), store);

        // Add bootstrap peers
        for peer in &self.config.bootstrap_peers {
            if let Ok(addr) = peer.parse() {
                kademlia.add_address(&self.keypair.public().to_peer_id(), addr);
            }
        }

        // Create mDNS
        let mdns = Mdns::new(Default::default())
            .await
            .map_err(|e| Error::NetworkError(format!("Failed to create mDNS: {}", e)))?;

        // Create relay client
        let relay_client = relay::client::Client::new(self.keypair.public().to_peer_id());

        // Create behavior
        let behavior = NetworkBehavior {
            gossipsub,
            kademlia,
            mdns,
            relay_client,
        };

        // Create swarm
        let mut swarm = SwarmBuilder::with_tokio_executor(transport, behavior, self.keypair.public().to_peer_id())
            .build();

        // Subscribe to gossipsub topic
        swarm.behaviour_mut().gossipsub.subscribe(&self.topic)
            .map_err(|e| Error::NetworkError(format!("Failed to subscribe to gossipsub topic: {}", e)))?;

        // Listen on addresses
        for addr in &self.config.listen_addresses {
            if let Ok(addr) = addr.parse() {
                swarm.listen_on(addr)
                    .map_err(|e| Error::NetworkError(format!("Failed to listen on address {}: {}", addr, e)))?;
            }
        }

        // Store swarm
        self.swarm = Some(swarm);

        // Start event loop
        self.start_event_loop();

        Ok(())
    }

    /// Stop the network
    pub async fn stop(&mut self) -> Result<()> {
        // Clear swarm
        self.swarm = None;

        Ok(())
    }

    /// Get the local peer ID
    pub fn local_peer_id(&self) -> PeerId {
        self.local_peer_id.clone()
    }

    /// Get the event receiver
    pub async fn event_receiver(&self) -> mpsc::Receiver<NetworkEvent> {
        let (tx, rx) = mpsc::channel(100);

        // Clone the event sender
        let event_sender = self.event_sender.clone();

        // Create a task to forward events
        tokio::spawn(async move {
            while let Some(event) = event_sender.subscribe().recv().await {
                if tx.send(event).await.is_err() {
                    break;
                }
            }
        });

        rx
    }

    /// Send a message to a specific peer
    pub async fn send_message(&self, peer_id: PeerId, message: MessageType) -> Result<()> {
        let (tx, rx) = tokio::sync::oneshot::channel();

        self.command_sender
            .send(NetworkCommand::SendMessage {
                peer_id,
                message,
                response_channel: Some(tx),
            })
            .await
            .map_err(|_| Error::NetworkError("Failed to send command".to_string()))?;

        rx.await
            .map_err(|_| Error::NetworkError("Failed to receive response".to_string()))?
    }

    /// Broadcast a message to all peers
    pub async fn broadcast_message(&self, message: MessageType) -> Result<()> {
        let (tx, rx) = tokio::sync::oneshot::channel();

        self.command_sender
            .send(NetworkCommand::BroadcastMessage {
                message,
                response_channel: Some(tx),
            })
            .await
            .map_err(|_| Error::NetworkError("Failed to send command".to_string()))?;

        rx.await
            .map_err(|_| Error::NetworkError("Failed to receive response".to_string()))?
    }

    /// Request a response from a peer
    pub async fn request_response(&self, peer_id: PeerId, request: MessageType) -> Result<MessageType> {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let request_id = uuid::Uuid::new_v4().to_string();

        self.command_sender
            .send(NetworkCommand::RequestResponse {
                peer_id,
                request,
                response_channel: tx,
                request_id,
            })
            .await
            .map_err(|_| Error::NetworkError("Failed to send command".to_string()))?;

        rx.await
            .map_err(|_| Error::NetworkError("Failed to receive response".to_string()))?
    }

    /// Start the event loop
    fn start_event_loop(&self) {
        // Clone what we need for the event loop
        let mut swarm = self.swarm.clone().unwrap();
        let event_sender = self.event_sender.clone();
        let mut command_receiver = self.command_receiver.clone();
        let topic = self.topic.clone();
        let known_peers = self.known_peers.clone();
        let connected_peers = self.connected_peers.clone();
        let response_channels = self.response_channels.clone();

        // Spawn a task to handle events
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    event = swarm.next_event() => {
                        match event {
                            SwarmEvent::Behaviour(NetworkBehaviourEvent::Gossipsub(GossipsubEvent::Message {
                                propagation_source,
                                message_id,
                                message,
                            })) => {
                                // Deserialize message
                                if let Ok(message_type) = serde_json::from_slice::<MessageType>(&message.data) {
                                    // Convert peer ID
                                    let from = PeerId(propagation_source.to_string());

                                    // Send event
                                    let _ = event_sender.send(NetworkEvent::MessageReceived {
                                        from: from.clone(),
                                        message: message_type.clone(),
                                    }).await;

                                    // Check if this is a response to a request
                                    let mut response_channels = response_channels.lock().unwrap();
                                    if let Some(tx) = response_channels.remove(&message_id.to_string()) {
                                        let _ = tx.send(Ok(message_type));
                                    }
                                }
                            }
                            SwarmEvent::Behaviour(NetworkBehaviourEvent::Mdns(MdnsEvent::Discovered(list))) => {
                                for (peer_id, _) in list {
                                    // Add to known peers
                                    let mut known_peers = known_peers.lock().unwrap();
                                    known_peers.insert(PeerId(peer_id.to_string()));
                                }
                            }
                            SwarmEvent::Behaviour(NetworkBehaviourEvent::Kademlia(KademliaEvent::OutboundQueryCompleted { result, .. })) => {
                                // Handle Kademlia query results
                            }
                            SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                                // Add to connected peers
                                let mut connected_peers = connected_peers.lock().unwrap();
                                let peer_id = PeerId(peer_id.to_string());
                                connected_peers.insert(peer_id.clone());

                                // Send event
                                let _ = event_sender.send(NetworkEvent::PeerConnected(peer_id)).await;
                            }
                            SwarmEvent::ConnectionClosed { peer_id, .. } => {
                                // Remove from connected peers
                                let mut connected_peers = connected_peers.lock().unwrap();
                                let peer_id = PeerId(peer_id.to_string());
                                connected_peers.remove(&peer_id);

                                // Send event
                                let _ = event_sender.send(NetworkEvent::PeerDisconnected(peer_id)).await;
                            }
                            _ => {}
                        }
                    }
                    command = command_receiver.recv() => {
                        if let Some(command) = command {
                            match command {
                                NetworkCommand::SendMessage { peer_id, message, response_channel } => {
                                    // Serialize message
                                    let data = serde_json::to_vec(&message).unwrap_or_default();

                                    // Convert peer ID
                                    let peer_id = LibP2PPeerId::from_str(&peer_id.0).unwrap_or_default();

                                    // Send message
                                    let result = swarm.behaviour_mut().gossipsub.publish(topic.clone(), data);

                                    // Send response
                                    if let Some(tx) = response_channel {
                                        let _ = tx.send(result.map_err(|e| Error::NetworkError(format!("Failed to send message: {}", e))));
                                    }
                                }
                                NetworkCommand::BroadcastMessage { message, response_channel } => {
                                    // Serialize message
                                    let data = serde_json::to_vec(&message).unwrap_or_default();

                                    // Broadcast message
                                    let result = swarm.behaviour_mut().gossipsub.publish(topic.clone(), data);

                                    // Send response
                                    if let Some(tx) = response_channel {
                                        let _ = tx.send(result.map_err(|e| Error::NetworkError(format!("Failed to broadcast message: {}", e))));
                                    }
                                }
                                NetworkCommand::RequestResponse { peer_id, request, response_channel, request_id } => {
                                    // Serialize message
                                    let data = serde_json::to_vec(&request).unwrap_or_default();

                                    // Convert peer ID
                                    let peer_id = LibP2PPeerId::from_str(&peer_id.0).unwrap_or_default();

                                    // Store response channel
                                    let mut response_channels = response_channels.lock().unwrap();
                                    response_channels.insert(request_id, response_channel);

                                    // Send message
                                    let _ = swarm.behaviour_mut().gossipsub.publish(topic.clone(), data);
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /// Create the transport
    async fn create_transport(&self) -> Result<Boxed<(LibP2PPeerId, StreamMuxerBox)>> {
        // Create TCP transport
        let tcp_transport = tcp::tokio::Transport::new(tcp::Config::default().nodelay(true))
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::NoiseAuthenticated::xx(&self.keypair).unwrap())
            .multiplex(yamux::YamuxConfig::default())
            .boxed();

        // TODO: Add WebRTC transport when available

        Ok(tcp_transport)
    }
}

impl Clone for Network {
    fn clone(&self) -> Self {
        // Create new channels
        let (event_sender, event_receiver) = mpsc::channel(100);
        let (command_sender, command_receiver) = mpsc::channel(100);

        Self {
            config: self.config.clone(),
            swarm: None, // Swarm cannot be cloned
            local_peer_id: self.local_peer_id.clone(),
            keypair: self.keypair.clone(),
            topic: self.topic.clone(),
            event_sender,
            event_receiver,
            command_sender,
            command_receiver,
            known_peers: self.known_peers.clone(),
            connected_peers: self.connected_peers.clone(),
            response_channels: self.response_channels.clone(),
        }
    }
}

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::str::FromStr;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::NetworkConfig;

    #[tokio::test]
    async fn test_network_creation() {
        let config = NetworkConfig::default();
        let network = Network::new(&config).unwrap();

        assert_eq!(network.config.gossipsub_topic, "darkswap/v1");
        assert!(!network.local_peer_id.0.is_empty());
    }
}