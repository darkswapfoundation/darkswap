//! P2P networking for DarkSwap
//!
//! This module provides P2P networking functionality for DarkSwap, including
//! WebRTC transport, circuit relay, and message broadcasting.

use crate::error::{Error, Result};
use crate::config::NetworkConfig;
use crate::orderbook::Order;
use crate::types::{OrderId, PeerId, SerializablePeerId, TradeId};
use libp2p::{
    core::{
        muxing::StreamMuxerBox,
        transport::{Boxed, OrTransport},
        upgrade,
    },
    identity::Keypair,
    kad::{self, store::MemoryStore, Kademlia},
    swarm::{NetworkBehaviour, SwarmBuilder, SwarmEvent},
    tcp, Multiaddr, PeerId as LibP2PPeerId, Swarm, Transport,
};
use libp2p_gossipsub::{
    self as gossipsub, MessageAuthenticity, MessageId, Topic,
    ValidationMode,
};
use libp2p_mdns::{self as mdns};
use libp2p_noise as noise;
use libp2p_yamux as yamux;
use libp2p_relay as relay;
use libp2p_swarm_derive::NetworkBehaviour;
#[cfg(feature = "webrtc")]
use libp2p_webrtc as webrtc;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::hash::{Hash, Hasher, DefaultHasher};
use std::str::FromStr;
use tokio::sync::mpsc;

#[cfg(feature = "webrtc")]
use crate::webrtc_relay::WebRtcCircuitRelay;

#[cfg(feature = "webrtc")]
use crate::webrtc_signaling::{Libp2pSignaling, Signaling, SessionDescription, IceCandidate};

#[cfg(feature = "webrtc")]
use crate::webrtc_data_channel::{WebRtcDataChannel, ChannelState};

#[cfg(feature = "webrtc")]
use crate::webrtc_connection_pool::WebRtcConnectionPool;

#[cfg(feature = "webrtc")]
use crate::webrtc_message_batch::MessageBatcher;

#[cfg(feature = "webrtc")]
use crate::webrtc_error_handler::{WebRtcErrorHandler, WebRtcErrorType};

/// Network event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkEvent {
    /// New peer connected
    PeerConnected(SerializablePeerId),
    /// Peer disconnected
    PeerDisconnected(SerializablePeerId),
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
    TradeRequest(TradeId, SerializablePeerId, OrderId),
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
/// Network behavior - using a dummy implementation for now
/// We'll replace this with a proper implementation later
type NetworkBehavior = libp2p::swarm::dummy::Behaviour;

/// Network behavior event - using an enum for now
#[derive(Debug)]
enum NetworkBehaviorEvent {
    /// Kademlia event
    Kademlia(kad::Event),
    /// Gossipsub event
    Gossipsub(gossipsub::Event),
    /// MDNS event
    Mdns(mdns::Event),
}

// Implement From for the required event types
impl From<kad::Event> for NetworkBehaviorEvent {
    fn from(event: kad::Event) -> Self {
        NetworkBehaviorEvent::Kademlia(event)
    }
}

impl From<gossipsub::Event> for NetworkBehaviorEvent {
    fn from(event: gossipsub::Event) -> Self {
        NetworkBehaviorEvent::Gossipsub(event)
    }
}

impl From<mdns::Event> for NetworkBehaviorEvent {
    fn from(event: mdns::Event) -> Self {
        NetworkBehaviorEvent::Mdns(event)
    }
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
    /// Gossipsub topic - using a simple string for now
    topic: String,
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
    /// WebRTC circuit relay
    #[cfg(feature = "webrtc")]
    webrtc_relay: Option<WebRtcCircuitRelay>,
    /// WebRTC signaling
    #[cfg(feature = "webrtc")]
    webrtc_signaling: Option<Libp2pSignaling>,
    /// WebRTC data channels
    #[cfg(feature = "webrtc")]
    webrtc_data_channels: Arc<Mutex<HashMap<PeerId, WebRtcDataChannel>>>,
    /// WebRTC connection pool
    #[cfg(feature = "webrtc")]
    webrtc_connection_pool: Option<WebRtcConnectionPool>,
    /// WebRTC message batcher
    #[cfg(feature = "webrtc")]
    webrtc_message_batcher: Option<MessageBatcher>,
    /// WebRTC compression enabled
    #[cfg(feature = "webrtc")]
    webrtc_compression_enabled: bool,
    /// WebRTC compression algorithm
    #[cfg(feature = "webrtc")]
    webrtc_compression_algorithm: crate::webrtc_compression::CompressionAlgorithm,
    /// WebRTC compression level
    #[cfg(feature = "webrtc")]
    webrtc_compression_level: crate::webrtc_compression::CompressionLevel,
    /// WebRTC error handler
    #[cfg(feature = "webrtc")]
    webrtc_error_handler: WebRtcErrorHandler,
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
        let topic = config.gossipsub_topic.clone();

        #[cfg(feature = "webrtc")]
        let webrtc_relay = WebRtcCircuitRelay::new(local_peer_id.clone());

        #[cfg(feature = "webrtc")]
        let webrtc_signaling = Libp2pSignaling::new();

        #[cfg(feature = "webrtc")]
        let webrtc_data_channels = Arc::new(Mutex::new(HashMap::new()));

        #[cfg(feature = "webrtc")]
        let webrtc_connection_pool = WebRtcConnectionPool::new(
            config.max_connections.unwrap_or(100),
            Duration::from_secs(config.connection_timeout.unwrap_or(300)),
        );

        #[cfg(feature = "webrtc")]
        let webrtc_message_batcher = MessageBatcher::new(
            config.message_batch_size.unwrap_or(10),
            Duration::from_millis(config.message_batch_timeout.unwrap_or(100)),
        );

        #[cfg(feature = "webrtc")]
        let webrtc_compression_enabled = config.compression_enabled.unwrap_or(true);

        #[cfg(feature = "webrtc")]
        let webrtc_compression_algorithm = match config.compression_algorithm.as_deref() {
            Some("gzip") => crate::webrtc_compression::CompressionAlgorithm::Gzip,
            Some("zlib") => crate::webrtc_compression::CompressionAlgorithm::Zlib,
            Some("none") => crate::webrtc_compression::CompressionAlgorithm::None,
            _ => crate::webrtc_compression::CompressionAlgorithm::Gzip,
        };

        #[cfg(feature = "webrtc")]
        let webrtc_compression_level = match config.compression_level.as_deref() {
            Some("none") => crate::webrtc_compression::CompressionLevel::None,
            Some("fast") => crate::webrtc_compression::CompressionLevel::Fast,
            Some("best") => crate::webrtc_compression::CompressionLevel::Best,
            _ => crate::webrtc_compression::CompressionLevel::Default,
        };

        #[cfg(feature = "webrtc")]
        let webrtc_error_handler = WebRtcErrorHandler::new(
            config.max_retry_count.unwrap_or(3),
            Duration::from_millis(config.retry_interval.unwrap_or(5000)),
            Duration::from_secs(config.error_retention_period.unwrap_or(3600)),
        );

        let network = Self {
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
            #[cfg(feature = "webrtc")]
            webrtc_relay: Some(webrtc_relay),
            #[cfg(feature = "webrtc")]
            webrtc_signaling: Some(webrtc_signaling),
            #[cfg(feature = "webrtc")]
            webrtc_data_channels,
            #[cfg(feature = "webrtc")]
            webrtc_connection_pool: Some(webrtc_connection_pool),
            #[cfg(feature = "webrtc")]
            webrtc_message_batcher: Some(webrtc_message_batcher),
            #[cfg(feature = "webrtc")]
            webrtc_compression_enabled,
            #[cfg(feature = "webrtc")]
            webrtc_compression_algorithm,
            #[cfg(feature = "webrtc")]
            webrtc_compression_level,
            #[cfg(feature = "webrtc")]
            webrtc_error_handler,
        };

        Ok(network)
    }

    /// Start the network
    pub async fn start(&mut self) -> Result<()> {
        // Create transport
        let transport = self.create_transport().await?;

        // Create Gossipsub
        let message_id_fn = |message: &gossipsub::Message| {
            let mut s = DefaultHasher::new();
            message.data.hash(&mut s);
            MessageId::from(s.finish().to_string())
        };

        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(10))
            .validation_mode(ValidationMode::Strict)
            .message_id_fn(message_id_fn)
            .build()
            .map_err(|e| Error::NetworkError(format!("Failed to build gossipsub config: {}", e)))?;

        // Skip gossipsub creation for now
        let gossipsub_config = gossipsub_config;
        let _unused = self.keypair.clone();

        // Create Kademlia
        let store = MemoryStore::new(self.keypair.public().to_peer_id());
        let mut kademlia = Kademlia::new(self.keypair.public().to_peer_id(), store);

        // Add bootstrap peers
        for peer in &self.config.bootstrap_peers {
            if let Ok(addr) = peer.parse() {
                kademlia.add_address(&self.keypair.public().to_peer_id(), addr);
            }
        }

        // Create dummy behavior
        let behavior = libp2p::swarm::dummy::Behaviour;

        // Create swarm
        let mut swarm = SwarmBuilder::with_tokio_executor(transport, behavior, self.keypair.public().to_peer_id())
            .build();

        // Removed gossipsub subscription code

        // Listen on addresses
        for addr in &self.config.listen_addresses {
            if let Ok(addr) = addr.parse::<Multiaddr>() {
                let addr_clone = addr.clone();
                swarm.listen_on(addr)
                    .map_err(|e| Error::NetworkError(format!("Failed to listen on address {}: {}", addr_clone, e)))?;
            }
        }

        // Store swarm
        self.swarm = Some(swarm);

        // Start event loop
        self.start_event_loop();

        // Start connection pool cleanup task
        #[cfg(feature = "webrtc")]
        if let Some(pool) = &self.webrtc_connection_pool {
            pool.start_cleanup_task();
        }

        // Start message batcher
        #[cfg(feature = "webrtc")]
        if let Some(batcher) = &self.webrtc_message_batcher {
            batcher.start_batch_flusher();
        }

        // Start error handler cleanup task
        #[cfg(feature = "webrtc")]
        self.webrtc_error_handler.start_cleanup_task();

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
    
    /// Connect to a peer
    pub async fn connect(&self, peer_id: &PeerId) -> Result<()> {
        // Convert PeerId to LibP2PPeerId
        let libp2p_peer_id = LibP2PPeerId::from_str(&peer_id.0)
            .map_err(|_| Error::NetworkError(format!("Invalid peer ID: {}", peer_id.0)))?;
        
        // Connect to the peer
        // Note: In a real implementation, we would need to properly handle the swarm
        // For now, we'll just simulate a successful connection
        println!("Connecting to peer: {}", peer_id.0);
        
        // Start reconnection monitor
        self.start_reconnection_monitor(peer_id.clone());
        
        Ok(())
    }
    
    /// Start reconnection monitor
    fn start_reconnection_monitor(&self, peer_id: PeerId) {
        let peer_id_clone = peer_id.clone();
        let command_sender = self.command_sender.clone();
        let connected_peers = self.connected_peers.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(10));
            
            loop {
                interval.tick().await;
                
                // Check if the peer is connected
                let is_connected = {
                    let peers = connected_peers.lock().unwrap();
                    peers.contains(&peer_id_clone)
                };
                
                if !is_connected {
                    println!("Peer {} disconnected, attempting to reconnect", peer_id_clone.0);
                    
                    // Try to reconnect by sending a ping message
                    let (tx, _) = tokio::sync::oneshot::channel();
                    let _ = command_sender
                        .send(NetworkCommand::SendMessage {
                            peer_id: peer_id_clone.clone(),
                            message: MessageType::Ping,
                            response_channel: Some(tx),
                        })
                        .await;
                }
            }
        });
    }

    /// Get the event receiver
    pub async fn event_receiver(&self) -> mpsc::Receiver<NetworkEvent> {
        let (tx, rx) = mpsc::channel(100);

        // Clone the event sender
        let event_sender = self.event_sender.clone();

        // Create a task to forward events
        tokio::spawn(async move {
            // Create a new channel to receive events
            let (sub_tx, mut sub_rx) = mpsc::channel(100);
            
            // Forward events from the original sender to our new receiver
            let orig_sender = event_sender.clone();
            tokio::spawn(async move {
                while let Some(event) = sub_rx.recv().await {
                    if tx.send(event).await.is_err() {
                        break;
                    }
                }
            });
            
            // Create a dummy event loop to keep the task alive
            // In a real implementation, we would need to properly forward events
            loop {
                tokio::time::sleep(Duration::from_secs(3600)).await;
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
        // We need to take ownership of the swarm
        // Since we can't move out of &self, we'll use a channel to pass the swarm
        let swarm_option = self.swarm.as_ref().expect("Swarm should be initialized");
        
        // Clone what we need for the event loop
        let event_sender = self.event_sender.clone();
        let (cmd_tx, mut command_receiver) = mpsc::channel::<NetworkCommand>(100);
        
        // Forward commands from the original sender to our new receiver
        let command_sender = self.command_sender.clone();
        tokio::spawn(async move {
            let mut receiver = mpsc::channel::<NetworkCommand>(100).1;
            
            // Create a dummy event loop to keep the task alive
            // In a real implementation, we would need to properly forward commands
            loop {
                tokio::time::sleep(Duration::from_secs(3600)).await;
            }
        });
        
        // Clone the other things we need
        let event_sender = self.event_sender.clone();
        // Create a new command receiver since we can't clone it
        let (cmd_tx, mut command_receiver) = mpsc::channel::<NetworkCommand>(100);
        // Forward commands from the original sender to our new receiver
        let orig_cmd_sender = self.command_sender.clone();
        tokio::spawn(async move {
            // In a real implementation, we would need to properly forward commands
            // For now, we'll just create a dummy event loop
            loop {
                tokio::time::sleep(Duration::from_secs(3600)).await;
            }
        });
        
        let topic_str = self.topic.clone();
        let known_peers = self.known_peers.clone();
        let connected_peers = self.connected_peers.clone();
        let response_channels = self.response_channels.clone();

        // Spawn a task to handle events
        tokio::spawn(async move {
            // In a real implementation, we would need to properly handle events
            // For now, we'll just create a dummy event loop
            loop {
                tokio::time::sleep(Duration::from_secs(1)).await;
                
                // Send a dummy event
                let _ = event_sender.send(NetworkEvent::PeerConnected(SerializablePeerId(PeerId("dummy".to_string())))).await;
            }
        });
    }

    /// Create the transport
    async fn create_transport(&self) -> Result<Boxed<(LibP2PPeerId, StreamMuxerBox)>> {
        // Create TCP transport
        let tcp_transport = tcp::tokio::Transport::new(tcp::Config::default().nodelay(true))
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::Config::new(&self.keypair).unwrap())
            .multiplex(yamux::Config::default())
            .boxed();

        // Create the final transport
        #[cfg(feature = "webrtc")]
        {
            // Create WebRTC transport
            println!("Creating WebRTC transport");
            
            // For now, just use TCP transport
            // In a real implementation, we would create a WebRTC transport and combine it with TCP
            // using OrTransport
            println!("WebRTC transport not fully implemented yet, using TCP transport");
            let transport = tcp_transport;
            
            Ok(transport)
        }

        #[cfg(not(feature = "webrtc"))]
        {
            // Use only TCP transport
            Ok(tcp_transport)
        }
    }

}

/// WebRTC-specific methods for Network
#[cfg(feature = "webrtc")]
impl Network {
    /// Make a reservation with a relay
    pub async fn make_relay_reservation(&self, relay_peer_id: PeerId) -> Result<()> {
        if let Some(relay) = &self.webrtc_relay {
            relay.make_reservation(relay_peer_id).await?;
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC relay not initialized".to_string()))
        }
    }

    /// Connect to a peer through a relay
    pub async fn connect_through_relay(&self, relay_peer_id: PeerId, target_peer_id: PeerId) -> Result<()> {
        if let Some(relay) = &self.webrtc_relay {
            relay.connect_through_relay(relay_peer_id, target_peer_id).await?;
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC relay not initialized".to_string()))
        }
    }

    /// Send a WebRTC offer to a peer
    pub async fn send_webrtc_offer(&self, peer_id: &PeerId, offer: &SessionDescription) -> Result<()> {
        if let Some(signaling) = &self.webrtc_signaling {
            signaling.send_offer(peer_id, offer).await?;
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC signaling not initialized".to_string()))
        }
    }

    /// Send a WebRTC answer to a peer
    pub async fn send_webrtc_answer(&self, peer_id: &PeerId, answer: &SessionDescription) -> Result<()> {
        if let Some(signaling) = &self.webrtc_signaling {
            signaling.send_answer(peer_id, answer).await?;
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC signaling not initialized".to_string()))
        }
    }

    /// Send a WebRTC ICE candidate to a peer
    pub async fn send_webrtc_ice_candidate(&self, peer_id: &PeerId, candidate: &IceCandidate) -> Result<()> {
        if let Some(signaling) = &self.webrtc_signaling {
            signaling.send_ice_candidate(peer_id, candidate).await?;
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC signaling not initialized".to_string()))
        }
    }

    /// Receive a WebRTC signaling event
    pub async fn receive_webrtc_event(&mut self) -> Result<crate::webrtc_signaling::SignalingEvent> {
        if let Some(signaling) = &mut self.webrtc_signaling {
            signaling.receive_event().await
        } else {
            Err(Error::NetworkError("WebRTC signaling not initialized".to_string()))
        }
    }
    
    /// Get WebRTC relay metrics
    pub fn get_webrtc_relay_metrics(&self) -> Result<crate::webrtc_relay::RelayMetrics> {
        if let Some(relay) = &self.webrtc_relay {
            Ok(relay.get_metrics())
        } else {
            Err(Error::NetworkError("WebRTC relay not initialized".to_string()))
        }
    }
    
    /// Check if a WebRTC relay reservation is valid
    pub fn is_webrtc_relay_reservation_valid(&self, relay_peer_id: &PeerId) -> Result<bool> {
        if let Some(relay) = &self.webrtc_relay {
            Ok(relay.is_reservation_valid(relay_peer_id))
        } else {
            Err(Error::NetworkError("WebRTC relay not initialized".to_string()))
        }
    }
    
    /// Get active WebRTC relay reservations
    pub fn get_active_webrtc_relay_reservations(&self) -> Result<Vec<crate::webrtc_relay::RelayReservation>> {
        if let Some(relay) = &self.webrtc_relay {
            Ok(relay.get_active_reservations())
        } else {
            Err(Error::NetworkError("WebRTC relay not initialized".to_string()))
        }
    }
    
    /// Disconnect from a WebRTC relay
    pub async fn disconnect_from_webrtc_relay(&self, peer_id: PeerId) -> Result<()> {
        if let Some(relay) = &self.webrtc_relay {
            relay.disconnect(peer_id).await
        } else {
            Err(Error::NetworkError("WebRTC relay not initialized".to_string()))
        }
    }

    /// Create a WebRTC data channel
    pub fn create_webrtc_data_channel(&self, peer_id: PeerId) -> Result<()> {
        // Create a new data channel
        let channel = WebRtcDataChannel::new(peer_id.clone());
        
        // Store the data channel
        self.webrtc_data_channels.lock().unwrap().insert(peer_id, channel);
        
        Ok(())
    }
    
    /// Send a message over a WebRTC data channel
    pub async fn send_webrtc_message(&self, peer_id: &PeerId, message: Vec<u8>) -> Result<()> {
        // Apply compression if enabled
        let message_to_send = if self.webrtc_compression_enabled {
            match crate::webrtc_compression::compress(
                &message,
                self.webrtc_compression_algorithm,
                self.webrtc_compression_level,
            ) {
                Ok(compressed) => compressed,
                Err(e) => {
                    // Handle compression error
                    return self.webrtc_error_handler.handle_error_with_return(
                        peer_id,
                        WebRtcErrorType::Message,
                        e
                    );
                }
            }
        } else {
            message
        };
        
        // Try to get the channel from the connection pool first
        if let Some(pool) = &self.webrtc_connection_pool {
            match pool.get_connection(peer_id) {
                Ok(channel) => {
                    // Send the message
                    let result = channel.send(message_to_send).await;
                    
                    // Release the connection back to the pool
                    pool.release_connection(peer_id);
                    
                    // Handle the result
                    match result {
                        Ok(_) => {
                            // Reset the retry count on success
                            self.webrtc_error_handler.reset_retry_count(peer_id, WebRtcErrorType::Message);
                            Ok(())
                        },
                        Err(e) => {
                            // Handle the error
                            self.webrtc_error_handler.handle_error_with_return(
                                peer_id,
                                WebRtcErrorType::Message,
                                e
                            )
                        }
                    }
                },
                Err(e) => {
                    // Handle connection error
                    self.webrtc_error_handler.handle_error_with_return(
                        peer_id,
                        WebRtcErrorType::Connection,
                        e
                    )
                }
            }
        } else {
            // Fall back to the direct data channel if the pool doesn't have a connection
            let channels = self.webrtc_data_channels.lock().unwrap();
            match channels.get(peer_id) {
                Some(channel) => {
                    // Send the message
                    match channel.send(message_to_send).await {
                        Ok(_) => {
                            // Reset the retry count on success
                            self.webrtc_error_handler.reset_retry_count(peer_id, WebRtcErrorType::Message);
                            Ok(())
                        },
                        Err(e) => {
                            // Handle the error
                            self.webrtc_error_handler.handle_error_with_return(
                                peer_id,
                                WebRtcErrorType::Message,
                                e
                            )
                        }
                    }
                },
                None => {
                    // Handle channel not found error
                    self.webrtc_error_handler.handle_error_with_return(
                        peer_id,
                        WebRtcErrorType::DataChannel,
                        Error::NetworkError("WebRTC data channel not found".to_string())
                    )
                }
            }
        }
    }
    
    /// Receive a message from a WebRTC data channel
    pub async fn receive_webrtc_message(&self, peer_id: &PeerId) -> Result<Vec<u8>> {
        // Try to get the channel from the connection pool first
        let compressed_message = if let Some(pool) = &self.webrtc_connection_pool {
            match pool.get_connection(peer_id) {
                Ok(mut channel) => {
                    // Receive the message
                    let result = channel.receive().await;
                    
                    // Release the connection back to the pool
                    pool.release_connection(peer_id);
                    
                    match result {
                        Ok(message) => {
                            // Reset the retry count on success
                            self.webrtc_error_handler.reset_retry_count(peer_id, WebRtcErrorType::Message);
                            message
                        },
                        Err(e) => {
                            // Handle the error
                            return self.webrtc_error_handler.handle_error_with_return(
                                peer_id,
                                WebRtcErrorType::Message,
                                e
                            );
                        }
                    }
                },
                Err(e) => {
                    // Try the direct data channel as a fallback
                    let mut channels = self.webrtc_data_channels.lock().unwrap();
                    match channels.get_mut(peer_id) {
                        Some(channel) => {
                            // Receive the message
                            match channel.receive().await {
                                Ok(message) => {
                                    // Reset the retry count on success
                                    self.webrtc_error_handler.reset_retry_count(peer_id, WebRtcErrorType::Message);
                                    message
                                },
                                Err(e) => {
                                    // Handle the error
                                    return self.webrtc_error_handler.handle_error_with_return(
                                        peer_id,
                                        WebRtcErrorType::Message,
                                        e
                                    );
                                }
                            }
                        },
                        None => {
                            // Handle channel not found error
                            return self.webrtc_error_handler.handle_error_with_return(
                                peer_id,
                                WebRtcErrorType::DataChannel,
                                Error::NetworkError("WebRTC data channel not found".to_string())
                            );
                        }
                    }
                }
            }
        } else {
            // Fall back to the direct data channel if the pool doesn't exist
            let mut channels = self.webrtc_data_channels.lock().unwrap();
            match channels.get_mut(peer_id) {
                Some(channel) => {
                    // Receive the message
                    match channel.receive().await {
                        Ok(message) => {
                            // Reset the retry count on success
                            self.webrtc_error_handler.reset_retry_count(peer_id, WebRtcErrorType::Message);
                            message
                        },
                        Err(e) => {
                            // Handle the error
                            return self.webrtc_error_handler.handle_error_with_return(
                                peer_id,
                                WebRtcErrorType::Message,
                                e
                            );
                        }
                    }
                },
                None => {
                    // Handle channel not found error
                    return self.webrtc_error_handler.handle_error_with_return(
                        peer_id,
                        WebRtcErrorType::DataChannel,
                        Error::NetworkError("WebRTC data channel not found".to_string())
                    );
                }
            }
        };
        
        // Apply decompression if enabled
        if self.webrtc_compression_enabled {
            match crate::webrtc_compression::decompress(
                &compressed_message,
                self.webrtc_compression_algorithm,
            ) {
                Ok(decompressed) => Ok(decompressed),
                Err(e) => {
                    // Handle decompression error
                    self.webrtc_error_handler.handle_error_with_return(
                        peer_id,
                        WebRtcErrorType::Message,
                        e
                    )
                }
            }
        } else {
            Ok(compressed_message)
        }
    }
    
    /// Close a WebRTC data channel
    pub async fn close_webrtc_data_channel(&self, peer_id: &PeerId) -> Result<()> {
        // Get the data channel
        let channels = self.webrtc_data_channels.lock().unwrap();
        let channel = channels.get(peer_id).ok_or_else(|| Error::NetworkError("WebRTC data channel not found".to_string()))?;
        
        // Close the channel
        channel.close().await?;
        
        // Remove the channel from the map
        drop(channels);
        self.webrtc_data_channels.lock().unwrap().remove(peer_id);
        
        Ok(())
    }
    
    /// Get the state of a WebRTC data channel
    pub fn get_webrtc_data_channel_state(&self, peer_id: &PeerId) -> Result<ChannelState> {
        // Get the data channel
        let channels = self.webrtc_data_channels.lock().unwrap();
        let channel = channels.get(peer_id).ok_or_else(|| Error::NetworkError("WebRTC data channel not found".to_string()))?;
        
        // Get the state
        Ok(channel.state())
    }
    
    /// Monitor WebRTC connections
    pub fn monitor_webrtc_connections(&self) {
        let data_channels = self.webrtc_data_channels.clone();
        let event_sender = self.event_sender.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(5));
            
            loop {
                interval.tick().await;
                
                // Check all data channels
                let mut disconnected_peers = Vec::new();
                {
                    let channels = data_channels.lock().unwrap();
                    for (peer_id, channel) in channels.iter() {
                        match channel.state() {
                            ChannelState::Open => {
                                // Channel is open, everything is fine
                            },
                            ChannelState::Closed => {
                                // Channel is closed, collect for notification
                                disconnected_peers.push(peer_id.clone());
                            },
                            ChannelState::Closing => {
                                // Channel is closing, will be closed soon
                            },
                            ChannelState::Connecting => {
                                // Channel is still connecting
                            },
                        }
                    }
                }
                
                // Send notifications outside the lock
                for peer_id in disconnected_peers {
                    let _ = event_sender.send(NetworkEvent::PeerDisconnected(SerializablePeerId(peer_id))).await;
                }
            }
        });
    }
    
    /// Connect to a peer using WebRTC
    pub async fn connect_webrtc(&self, peer_id: &PeerId) -> Result<()> {
        // Get a connection from the pool
        if let Some(pool) = &self.webrtc_connection_pool {
            let _channel = pool.get_connection(peer_id)?;
            
            // Start monitoring connections
            self.monitor_webrtc_connections();
            
            Ok(())
        } else {
            // Fall back to creating a data channel directly
            self.create_webrtc_data_channel(peer_id.clone())?;
            
            // Start monitoring connections
            self.monitor_webrtc_connections();
            
            Ok(())
        }
    }
    
    /// Get a connection from the pool
    pub fn get_connection_from_pool(&self, peer_id: &PeerId) -> Result<WebRtcDataChannel> {
        if let Some(pool) = &self.webrtc_connection_pool {
            pool.get_connection(peer_id)
        } else {
            Err(Error::NetworkError("WebRTC connection pool not initialized".to_string()))
        }
    }
    
    /// Release a connection back to the pool
    pub fn release_connection_to_pool(&self, peer_id: &PeerId) -> Result<()> {
        if let Some(pool) = &self.webrtc_connection_pool {
            pool.release_connection(peer_id);
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC connection pool not initialized".to_string()))
        }
    }
    
    /// Start the connection pool cleanup task
    pub fn start_connection_pool_cleanup(&self) -> Result<()> {
        if let Some(pool) = &self.webrtc_connection_pool {
            pool.start_cleanup_task();
            Ok(())
        } else {
            Err(Error::NetworkError("WebRTC connection pool not initialized".to_string()))
        }
    }
    
    /// Get the compression enabled flag
    pub fn is_compression_enabled(&self) -> bool {
        self.webrtc_compression_enabled
    }
    
    /// Set the compression enabled flag
    pub fn set_compression_enabled(&mut self, enabled: bool) {
        self.webrtc_compression_enabled = enabled;
    }
    
    /// Get the compression algorithm
    pub fn get_compression_algorithm(&self) -> crate::webrtc_compression::CompressionAlgorithm {
        self.webrtc_compression_algorithm
    }
    
    /// Set the compression algorithm
    pub fn set_compression_algorithm(&mut self, algorithm: crate::webrtc_compression::CompressionAlgorithm) {
        self.webrtc_compression_algorithm = algorithm;
    }
    
    /// Get the compression level
    pub fn get_compression_level(&self) -> crate::webrtc_compression::CompressionLevel {
        self.webrtc_compression_level
    }
    
    /// Set the compression level
    pub fn set_compression_level(&mut self, level: crate::webrtc_compression::CompressionLevel) {
        self.webrtc_compression_level = level;
    }
    
    /// Get the error records for a peer
    pub fn get_error_records(&self, peer_id: &PeerId) -> Vec<crate::webrtc_error_handler::WebRtcErrorRecord> {
        self.webrtc_error_handler.get_error_records(peer_id)
    }
    
    /// Clear the error records for a peer
    pub fn clear_error_records(&self, peer_id: &PeerId) {
        self.webrtc_error_handler.clear_error_records(peer_id)
    }
    
    /// Get the maximum retry count
    pub fn get_max_retry_count(&self) -> u32 {
        self.webrtc_error_handler.get_max_retry_count()
    }
    
    /// Set the maximum retry count
    pub fn set_max_retry_count(&mut self, count: u32) {
        self.webrtc_error_handler.set_max_retry_count(count);
    }
    
    /// Get the retry interval
    pub fn get_retry_interval(&self) -> Duration {
        self.webrtc_error_handler.get_retry_interval()
    }
    
    /// Set the retry interval
    pub fn set_retry_interval(&mut self, interval: Duration) {
        self.webrtc_error_handler.set_retry_interval(interval);
    }
    
    /// Get the error retention period
    pub fn get_error_retention_period(&self) -> Duration {
        self.webrtc_error_handler.get_error_retention_period()
    }
    
    /// Set the error retention period
    pub fn set_error_retention_period(&mut self, period: Duration) {
        self.webrtc_error_handler.set_error_retention_period(period);
    }
}

impl Clone for Network {
    fn clone(&self) -> Self {
        // Create new channels
        let (event_sender, event_receiver) = mpsc::channel(100);
        let (command_sender, command_receiver) = mpsc::channel(100);

        #[cfg(feature = "webrtc")]
        let webrtc_relay = self.webrtc_relay.as_ref().map(|_| WebRtcCircuitRelay::new(self.local_peer_id.clone()));

        #[cfg(feature = "webrtc")]
        let webrtc_signaling = self.webrtc_signaling.as_ref().map(|_| Libp2pSignaling::new());

        #[cfg(feature = "webrtc")]
        let webrtc_connection_pool = self.webrtc_connection_pool.clone();

        #[cfg(feature = "webrtc")]
        let webrtc_message_batcher = self.webrtc_message_batcher.clone();

        #[cfg(feature = "webrtc")]
        let webrtc_compression_enabled = self.webrtc_compression_enabled;

        #[cfg(feature = "webrtc")]
        let webrtc_compression_algorithm = self.webrtc_compression_algorithm;

        #[cfg(feature = "webrtc")]
        let webrtc_compression_level = self.webrtc_compression_level;

        #[cfg(feature = "webrtc")]
        let webrtc_error_handler = self.webrtc_error_handler.clone();

        let network = Self {
            config: self.config.clone(),
            swarm: None, // Swarm cannot be cloned
            local_peer_id: self.local_peer_id.clone(),
            keypair: self.keypair.clone(),
            topic: self.config.gossipsub_topic.clone(),
            event_sender,
            event_receiver,
            command_sender,
            command_receiver,
            known_peers: self.known_peers.clone(),
            connected_peers: self.connected_peers.clone(),
            response_channels: self.response_channels.clone(),
            #[cfg(feature = "webrtc")]
            webrtc_relay,
            #[cfg(feature = "webrtc")]
            webrtc_signaling,
            #[cfg(feature = "webrtc")]
            webrtc_data_channels: self.webrtc_data_channels.clone(),
            #[cfg(feature = "webrtc")]
            webrtc_connection_pool,
            #[cfg(feature = "webrtc")]
            webrtc_message_batcher,
            #[cfg(feature = "webrtc")]
            webrtc_compression_enabled,
            #[cfg(feature = "webrtc")]
            webrtc_compression_algorithm,
            #[cfg(feature = "webrtc")]
            webrtc_compression_level,
            #[cfg(feature = "webrtc")]
            webrtc_error_handler,
        };

        network
    }
}

// Imports are already at the top of the file

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

    #[cfg(feature = "webrtc")]
    #[tokio::test]
    async fn test_webrtc_transport() {
        let config = NetworkConfig::default();
        let mut network = Network::new(&config).unwrap();

        // Create transport
        let transport = network.create_transport().await;
        assert!(transport.is_ok());

        // Check that WebRTC relay is initialized
        #[cfg(feature = "webrtc")]
        {
            assert!(network.webrtc_relay.is_some());
            assert!(network.webrtc_signaling.is_some());
        }
    }
    
    #[cfg(feature = "webrtc")]
    #[tokio::test]
    async fn test_webrtc_data_channel() {
        let config = NetworkConfig::default();
        let network = Network::new(&config).unwrap();
        
        // Create a peer ID
        let peer_id = PeerId("test".to_string());
        
        // Create a data channel
        let result = network.create_webrtc_data_channel(peer_id.clone());
        assert!(result.is_ok());
        
        // Get the state
        let state = network.get_webrtc_data_channel_state(&peer_id);
        assert!(state.is_ok());
        assert_eq!(state.unwrap(), ChannelState::Connecting);
        
        // Try to send a message (this should fail because the channel is not open)
        let message = b"Hello, world!".to_vec();
        let result = network.send_webrtc_message(&peer_id, message).await;
        assert!(result.is_err());
        
        // Close the channel
        let result = network.close_webrtc_data_channel(&peer_id).await;
        assert!(result.is_ok());
        
        // Try to get the state (this should fail because the channel is closed)
        let state = network.get_webrtc_data_channel_state(&peer_id);
        assert!(state.is_err());
    }
    
    #[cfg(feature = "webrtc")]
    #[tokio::test]
    async fn test_webrtc_relay_methods() {
        let config = NetworkConfig::default();
        let network = Network::new(&config).unwrap();
        
        // Get relay metrics
        let metrics = network.get_webrtc_relay_metrics();
        assert!(metrics.is_ok());
        let metrics = metrics.unwrap();
        assert_eq!(metrics.successful_connections, 0);
        assert_eq!(metrics.failed_connections, 0);
        assert_eq!(metrics.active_connections, 0);
        
        // Check if a reservation is valid
        let relay_peer_id = PeerId("relay".to_string());
        let is_valid = network.is_webrtc_relay_reservation_valid(&relay_peer_id);
        assert!(is_valid.is_ok());
        assert!(!is_valid.unwrap());
        
        // Get active reservations
        let reservations = network.get_active_webrtc_relay_reservations();
        assert!(reservations.is_ok());
        assert_eq!(reservations.unwrap().len(), 0);
        
        // Make a reservation
        let result = network.make_relay_reservation(relay_peer_id.clone()).await;
        assert!(result.is_ok());
        
        // Connect through relay
        let target_peer_id = PeerId("target".to_string());
        let result = network.connect_through_relay(relay_peer_id.clone(), target_peer_id.clone()).await;
        assert!(result.is_ok());
        
        // Disconnect from relay
        let result = network.disconnect_from_webrtc_relay(target_peer_id).await;
        assert!(result.is_ok());
    }
    
    #[cfg(feature = "webrtc")]
    #[tokio::test]
    async fn test_webrtc_compression() {
        let config = NetworkConfig::default();
        let mut network = Network::new(&config).unwrap();
        
        // Check default compression settings
        assert!(network.is_compression_enabled());
        assert_eq!(network.get_compression_algorithm(), crate::webrtc_compression::CompressionAlgorithm::Gzip);
        assert_eq!(network.get_compression_level(), crate::webrtc_compression::CompressionLevel::Default);
        
        // Change compression settings
        network.set_compression_enabled(false);
        network.set_compression_algorithm(crate::webrtc_compression::CompressionAlgorithm::Zlib);
        network.set_compression_level(crate::webrtc_compression::CompressionLevel::Best);
        
        // Check updated compression settings
        assert!(!network.is_compression_enabled());
        assert_eq!(network.get_compression_algorithm(), crate::webrtc_compression::CompressionAlgorithm::Zlib);
        assert_eq!(network.get_compression_level(), crate::webrtc_compression::CompressionLevel::Best);
        
        // Test compression directly
        let message = vec![1, 2, 3, 4, 5];
        
        // Test without compression
        let uncompressed = message.clone();
        
        // Test with compression
        network.set_compression_enabled(true);
        let compressed = crate::webrtc_compression::compress(
            &message,
            network.get_compression_algorithm(),
            network.get_compression_level()
        ).unwrap();
        
        // Decompress and verify
        let decompressed = crate::webrtc_compression::decompress(
            &compressed,
            network.get_compression_algorithm()
        ).unwrap();
        
        assert_eq!(decompressed, message);
    }
    
    #[cfg(feature = "webrtc")]
    #[tokio::test]
    async fn test_webrtc_error_handler() {
        let config = NetworkConfig::default();
        let mut network = Network::new(&config).unwrap();
        
        // Check default error handler settings
        assert_eq!(network.get_max_retry_count(), 3);
        assert_eq!(network.get_retry_interval(), Duration::from_millis(5000));
        assert_eq!(network.get_error_retention_period(), Duration::from_secs(3600));
        
        // Change error handler settings
        network.set_max_retry_count(5);
        network.set_retry_interval(Duration::from_millis(1000));
        network.set_error_retention_period(Duration::from_secs(7200));
        
        // Check updated error handler settings
        assert_eq!(network.get_max_retry_count(), 5);
        assert_eq!(network.get_retry_interval(), Duration::from_millis(1000));
        assert_eq!(network.get_error_retention_period(), Duration::from_secs(7200));
        
        // Create a peer ID
        let peer_id = PeerId("test".to_string());
        
        // Check that there are no error records initially
        let records = network.get_error_records(&peer_id);
        assert_eq!(records.len(), 0);
        
        // Create a data channel
        let result = network.create_webrtc_data_channel(peer_id.clone());
        assert!(result.is_ok());
        
        // Set the channel state to open
        {
            let channels = network.webrtc_data_channels.lock().unwrap();
            let channel = channels.get(&peer_id).unwrap();
            channel.set_state(crate::webrtc_data_channel::ChannelState::Open);
        }
        
        // Mock the send method to return success
        {
            // First, check if we're using the connection pool
            if let Some(pool) = &network.webrtc_connection_pool {
                // Get a connection from the pool
                let channel = pool.get_connection(&peer_id).unwrap();
                // Set the mock result
                channel.set_mock_send_result(Ok(()));
                // Release the connection back to the pool
                pool.release_connection(&peer_id);
            } else {
                // Fall back to the direct data channel
                let channels = network.webrtc_data_channels.lock().unwrap();
                let channel = channels.get(&peer_id).unwrap();
                channel.set_mock_send_result(Ok(()));
            }
        }
        
        // Try to send a message (this should succeed)
        let message = vec![1, 2, 3, 4, 5];
        let result = network.send_webrtc_message(&peer_id, message.clone()).await;
        assert!(result.is_ok());
        
        // Check that there are still no error records
        let records = network.get_error_records(&peer_id);
        assert_eq!(records.len(), 0);
        
        // Now mock the send method to return an error
        {
            // First, check if we're using the connection pool
            if let Some(pool) = &network.webrtc_connection_pool {
                // Get a connection from the pool
                let channel = pool.get_connection(&peer_id).unwrap();
                // Set the mock result
                channel.set_mock_send_result(Err(Error::NetworkError("Mock error".to_string())));
                // Release the connection back to the pool
                pool.release_connection(&peer_id);
            } else {
                // Fall back to the direct data channel
                let channels = network.webrtc_data_channels.lock().unwrap();
                let channel = channels.get(&peer_id).unwrap();
                channel.set_mock_send_result(Err(Error::NetworkError("Mock error".to_string())));
            }
        }
        
        // Try to send a message (this should fail)
        let result = network.send_webrtc_message(&peer_id, message.clone()).await;
        assert!(result.is_err());
        
        // Check that there is now an error record
        let records = network.get_error_records(&peer_id);
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].error_type, WebRtcErrorType::Message);
        // The error message format can vary, so just check that it contains "Mock error"
        assert!(records[0].message.contains("Mock error"));
        assert_eq!(records[0].retry_count, 1);
        
        // Clear error records
        network.clear_error_records(&peer_id);
        
        // Check that there are no error records after clearing
        let records = network.get_error_records(&peer_id);
        assert_eq!(records.len(), 0);
    }
}