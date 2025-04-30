//! WebRTC manager for the DarkSwap Relay Server
//!
//! This module provides a WebRTC manager for the DarkSwap Relay Server.
//! It handles WebRTC connections and data channels.

use crate::{
    config::Config,
    error::Error,
    utils,
    Result,
};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::mpsc;
use tracing::{debug, error, info, warn};
use uuid::Uuid;
use webrtc::{
    api::{
        interceptor_registry::register_default_interceptors,
        media_engine::MediaEngine,
        setting_engine::SettingEngine,
        APIBuilder,
    },
    data_channel::{
        data_channel::DataChannel,
        RTCDataChannel,
    },
    ice::{
        ice_server::RTCIceServer,
        network_type::NetworkType,
    },
    ice_transport::ice_connection_state::RTCIceConnectionState,
    interceptor::registry::Registry,
    peer_connection::{
        configuration::RTCConfiguration,
        peer_connection_state::RTCPeerConnectionState,
        RTCPeerConnection,
    },
    sctp::transport::SCTPTransportState,
};

/// Connection ID
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ConnectionId(u64);

impl ConnectionId {
    /// Create a new connection ID
    pub fn new() -> Self {
        use std::sync::atomic::{AtomicU64, Ordering};
        static NEXT_ID: AtomicU64 = AtomicU64::new(0);
        Self(NEXT_ID.fetch_add(1, Ordering::Relaxed))
    }
}

impl std::fmt::Display for ConnectionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// WebRTC connection state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WebRtcConnectionState {
    /// New connection
    New,
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Disconnected
    Disconnected,
    /// Failed
    Failed,
    /// Closed
    Closed,
}

/// WebRTC connection
struct WebRtcConnection {
    /// Connection ID
    id: ConnectionId,
    /// Peer ID
    peer_id: String,
    /// Peer connection
    peer_connection: RTCPeerConnection,
    /// Data channels
    data_channels: HashMap<String, Arc<RTCDataChannel>>,
    /// Connection state
    state: WebRtcConnectionState,
    /// Created timestamp
    created_at: Instant,
    /// Last activity timestamp
    last_activity: Instant,
}

/// WebRTC transport event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WebRtcTransportEvent {
    /// Connection established
    ConnectionEstablished {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: String,
    },
    /// Connection closed
    ConnectionClosed {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: String,
    },
    /// Connection failed
    ConnectionFailed {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: String,
        /// Error message
        error: String,
    },
    /// Data received
    DataReceived {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: String,
        /// Channel label
        channel: String,
        /// Data
        data: Vec<u8>,
    },
    /// Channel opened
    ChannelOpened {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: String,
        /// Channel label
        channel: String,
    },
    /// Channel closed
    ChannelClosed {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: String,
        /// Channel label
        channel: String,
    },
}

/// WebRTC manager
pub struct WebRtcManager {
    /// Configuration
    config: Config,
    /// WebRTC API
    api: webrtc::api::API,
    /// Connections
    connections: Arc<DashMap<ConnectionId, WebRtcConnection>>,
    /// Peer connections
    peer_connections: Arc<DashMap<String, Vec<ConnectionId>>>,
    /// Event sender
    event_sender: mpsc::Sender<WebRtcTransportEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<WebRtcTransportEvent>,
}

impl WebRtcManager {
    /// Create a new WebRTC manager
    pub fn new(
        config: Config,
        event_sender: mpsc::Sender<WebRtcTransportEvent>,
        event_receiver: mpsc::Receiver<WebRtcTransportEvent>,
    ) -> Result<Self> {
        // Create a media engine
        let mut media_engine = MediaEngine::default();
        
        // Create a registry
        let mut registry = Registry::new();
        
        // Register default interceptors
        registry = register_default_interceptors(registry, &mut media_engine)
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Create a setting engine
        let mut setting_engine = SettingEngine::default();
        
        // Set ICE timeouts
        setting_engine.set_ice_timeouts(
            Some(Duration::from_secs(config.webrtc.ice_gathering_timeout)),
            Some(Duration::from_secs(config.webrtc.connection_establishment_timeout)),
            Some(Duration::from_secs(config.webrtc.data_channel_establishment_timeout)),
        );
        
        // Create the API
        let api = APIBuilder::new()
            .with_media_engine(media_engine)
            .with_interceptor_registry(registry)
            .with_setting_engine(setting_engine)
            .build();
        
        Ok(Self {
            config,
            api,
            connections: Arc::new(DashMap::new()),
            peer_connections: Arc::new(DashMap::new()),
            event_sender,
            event_receiver,
        })
    }
    
    /// Run the WebRTC manager
    pub async fn run(&mut self) -> Result<()> {
        // Spawn a task to clean up expired connections
        let connections = self.connections.clone();
        let peer_connections = self.peer_connections.clone();
        let event_sender = self.event_sender.clone();
        let connection_timeout = self.config.connection_timeout();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            
            loop {
                interval.tick().await;
                
                // Get the current time
                let now = Instant::now();
                
                // Find expired connections
                let expired_connections: Vec<(ConnectionId, String)> = connections
                    .iter()
                    .filter_map(|entry| {
                        if now.duration_since(entry.last_activity) > connection_timeout {
                            Some((entry.id, entry.peer_id.clone()))
                        } else {
                            None
                        }
                    })
                    .collect();
                
                // Close expired connections
                for (connection_id, peer_id) in expired_connections {
                    // Remove the connection
                    if let Some((_, connection)) = connections.remove(&connection_id) {
                        // Close the peer connection
                        let _ = connection.peer_connection.close().await;
                        
                        // Remove the connection from the peer connections
                        if let Some(mut peer_conns) = peer_connections.get_mut(&peer_id) {
                            peer_conns.retain(|id| *id != connection_id);
                            
                            // If there are no more connections for this peer, remove the peer
                            if peer_conns.is_empty() {
                                peer_connections.remove(&peer_id);
                            }
                        }
                        
                        // Send an event
                        let _ = event_sender.send(WebRtcTransportEvent::ConnectionClosed {
                            connection_id,
                            peer_id,
                        }).await;
                        
                        debug!("Closed expired connection: {}", connection_id);
                    }
                }
            }
        });
        
        // Process events
        while let Some(event) = self.event_receiver.recv().await {
            match event {
                WebRtcTransportEvent::ConnectionEstablished { connection_id, peer_id } => {
                    // Update the connection state
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.state = WebRtcConnectionState::Connected;
                        connection.last_activity = Instant::now();
                        debug!("Connection established: {} ({})", connection_id, peer_id);
                    }
                }
                WebRtcTransportEvent::ConnectionClosed { connection_id, peer_id } => {
                    // Remove the connection
                    if let Some((_, connection)) = self.connections.remove(&connection_id) {
                        // Remove the connection from the peer connections
                        if let Some(mut peer_conns) = self.peer_connections.get_mut(&peer_id) {
                            peer_conns.retain(|id| *id != connection_id);
                            
                            // If there are no more connections for this peer, remove the peer
                            if peer_conns.is_empty() {
                                self.peer_connections.remove(&peer_id);
                            }
                        }
                        
                        debug!("Connection closed: {} ({})", connection_id, peer_id);
                    }
                }
                WebRtcTransportEvent::ConnectionFailed { connection_id, peer_id, error } => {
                    // Update the connection state
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.state = WebRtcConnectionState::Failed;
                        connection.last_activity = Instant::now();
                        warn!("Connection failed: {} ({}): {}", connection_id, peer_id, error);
                    }
                }
                WebRtcTransportEvent::DataReceived { connection_id, peer_id, channel, data } => {
                    // Process the data
                    debug!("Data received: {} ({}) on channel {}: {} bytes", connection_id, peer_id, channel, data.len());
                    
                    // Update the connection activity
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.last_activity = Instant::now();
                    }
                }
                WebRtcTransportEvent::ChannelOpened { connection_id, peer_id, channel } => {
                    // Update the connection activity
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.last_activity = Instant::now();
                        debug!("Channel opened: {} ({}) on channel {}", connection_id, peer_id, channel);
                    }
                }
                WebRtcTransportEvent::ChannelClosed { connection_id, peer_id, channel } => {
                    // Update the connection activity
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.data_channels.remove(&channel);
                        connection.last_activity = Instant::now();
                        debug!("Channel closed: {} ({}) on channel {}", connection_id, peer_id, channel);
                    }
                }
            }
        }
        
        Ok(())
    }
    
    /// Create a new connection
    pub async fn create_connection(&self, peer_id: &str) -> Result<ConnectionId> {
        // Create ICE servers
        let mut ice_servers = vec![];
        
        // Add STUN servers
        for server in &self.config.webrtc.stun_servers {
            ice_servers.push(RTCIceServer {
                urls: vec![server.clone()],
                ..Default::default()
            });
        }
        
        // Add TURN servers
        for server in &self.config.webrtc.turn_servers {
            ice_servers.push(RTCIceServer {
                urls: vec![server.url.clone()],
                username: server.username.clone(),
                credential: server.credential.clone(),
                ..Default::default()
            });
        }
        
        // Create configuration
        let config = RTCConfiguration {
            ice_servers,
            ..Default::default()
        };
        
        // Create peer connection
        let peer_connection = self.api.new_peer_connection(config).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Create connection ID
        let connection_id = ConnectionId::new();
        
        // Set up event handlers
        let event_sender = self.event_sender.clone();
        let peer_id_clone = peer_id.to_string();
        let connection_id_clone = connection_id;
        
        // Handle connection state change
        peer_connection.on_peer_connection_state_change(Box::new(move |state: RTCPeerConnectionState| {
            let event_sender = event_sender.clone();
            let peer_id = peer_id_clone.clone();
            let connection_id = connection_id_clone;
            
            Box::pin(async move {
                match state {
                    RTCPeerConnectionState::Connected => {
                        let _ = event_sender.send(WebRtcTransportEvent::ConnectionEstablished {
                            connection_id,
                            peer_id: peer_id.clone(),
                        }).await;
                    }
                    RTCPeerConnectionState::Failed => {
                        let _ = event_sender.send(WebRtcTransportEvent::ConnectionFailed {
                            connection_id,
                            peer_id: peer_id.clone(),
                            error: "Peer connection failed".to_string(),
                        }).await;
                    }
                    RTCPeerConnectionState::Closed => {
                        let _ = event_sender.send(WebRtcTransportEvent::ConnectionClosed {
                            connection_id,
                            peer_id: peer_id.clone(),
                        }).await;
                    }
                    _ => {}
                }
            })
        }));
        
        // Handle data channel
        let event_sender = self.event_sender.clone();
        let peer_id_clone = peer_id.to_string();
        let connection_id_clone = connection_id;
        
        peer_connection.on_data_channel(Box::new(move |data_channel: Arc<RTCDataChannel>| {
            let event_sender = event_sender.clone();
            let peer_id = peer_id_clone.clone();
            let connection_id = connection_id_clone;
            let channel = data_channel.label().to_string();
            
            // Handle data channel open
            let event_sender_clone = event_sender.clone();
            let peer_id_clone = peer_id.clone();
            let channel_clone = channel.clone();
            
            data_channel.on_open(Box::new(move || {
                let event_sender = event_sender_clone.clone();
                let peer_id = peer_id_clone.clone();
                let channel = channel_clone.clone();
                
                Box::pin(async move {
                    let _ = event_sender.send(WebRtcTransportEvent::ChannelOpened {
                        connection_id,
                        peer_id: peer_id.clone(),
                        channel: channel.clone(),
                    }).await;
                })
            }));
            
            // Handle data channel close
            let event_sender_clone = event_sender.clone();
            let peer_id_clone = peer_id.clone();
            let channel_clone = channel.clone();
            
            data_channel.on_close(Box::new(move || {
                let event_sender = event_sender_clone.clone();
                let peer_id = peer_id_clone.clone();
                let channel = channel_clone.clone();
                
                Box::pin(async move {
                    let _ = event_sender.send(WebRtcTransportEvent::ChannelClosed {
                        connection_id,
                        peer_id: peer_id.clone(),
                        channel: channel.clone(),
                    }).await;
                })
            }));
            
            // Handle data channel message
            let event_sender_clone = event_sender.clone();
            let peer_id_clone = peer_id.clone();
            let channel_clone = channel.clone();
            
            data_channel.on_message(Box::new(move |msg: webrtc::data::Data| {
                let event_sender = event_sender_clone.clone();
                let peer_id = peer_id_clone.clone();
                let channel = channel_clone.clone();
                let data = msg.data.to_vec();
                
                Box::pin(async move {
                    let _ = event_sender.send(WebRtcTransportEvent::DataReceived {
                        connection_id,
                        peer_id: peer_id.clone(),
                        channel: channel.clone(),
                        data,
                    }).await;
                })
            }));
            
            Box::pin(async {})
        }));
        
        // Create the connection
        let connection = WebRtcConnection {
            id: connection_id,
            peer_id: peer_id.to_string(),
            peer_connection,
            data_channels: HashMap::new(),
            state: WebRtcConnectionState::New,
            created_at: Instant::now(),
            last_activity: Instant::now(),
        };
        
        // Add the connection
        self.connections.insert(connection_id, connection);
        
        // Add the connection to the peer connections
        self.peer_connections
            .entry(peer_id.to_string())
            .or_insert_with(Vec::new)
            .push(connection_id);
        
        Ok(connection_id)
    }
    
    /// Create an offer
    pub async fn create_offer(&self, connection_id: ConnectionId) -> Result<String> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Create an offer
        let offer = connection.peer_connection.create_offer(None).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Set the local description
        connection.peer_connection.set_local_description(offer.clone()).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Update the connection activity
        if let Some(mut connection) = self.connections.get_mut(&connection_id) {
            connection.state = WebRtcConnectionState::Connecting;
            connection.last_activity = Instant::now();
        }
        
        Ok(offer.sdp)
    }
    
    /// Set remote description
    pub async fn set_remote_description(&self, connection_id: ConnectionId, sdp: &str, is_offer: bool) -> Result<()> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Create the session description
        let session_description = webrtc::peer_connection::sdp::session_description::RTCSessionDescription {
            sdp_type: if is_offer {
                webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Offer
            } else {
                webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Answer
            },
            sdp: sdp.to_string(),
        };
        
        // Set the remote description
        connection.peer_connection.set_remote_description(session_description).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Update the connection activity
        if let Some(mut connection) = self.connections.get_mut(&connection_id) {
            connection.last_activity = Instant::now();
        }
        
        Ok(())
    }
    
    /// Create an answer
    pub async fn create_answer(&self, connection_id: ConnectionId) -> Result<String> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Create an answer
        let answer = connection.peer_connection.create_answer(None).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Set the local description
        connection.peer_connection.set_local_description(answer.clone()).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Update the connection activity
        if let Some(mut connection) = self.connections.get_mut(&connection_id) {
            connection.last_activity = Instant::now();
        }
        
        Ok(answer.sdp)
    }
    
    /// Add ICE candidate
    pub async fn add_ice_candidate(&self, connection_id: ConnectionId, candidate: &str, sdp_mid: Option<&str>, sdp_mline_index: Option<u16>) -> Result<()> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Create the ICE candidate
        let ice_candidate = webrtc::ice::candidate::RTCIceCandidateInit {
            candidate: candidate.to_string(),
            sdp_mid: sdp_mid.map(|s| s.to_string()),
            sdp_mline_index,
            username_fragment: None,
        };
        
        // Add the ICE candidate
        connection.peer_connection.add_ice_candidate(ice_candidate).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Update the connection activity
        if let Some(mut connection) = self.connections.get_mut(&connection_id) {
            connection.last_activity = Instant::now();
        }
        
        Ok(())
    }
    
    /// Create a data channel
    pub async fn create_data_channel(&self, connection_id: ConnectionId, label: &str, ordered: bool, max_retransmits: Option<u16>) -> Result<()> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Create data channel options
        let mut options = webrtc::data_channel::data_channel_init::RTCDataChannelInit::default();
        options.ordered = ordered;
        options.max_retransmits = max_retransmits;
        
        // Create the data channel
        let data_channel = connection.peer_connection.create_data_channel(label, Some(options)).await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Set up event handlers
        let event_sender = self.event_sender.clone();
        let peer_id = connection.peer_id.clone();
        let channel = label.to_string();
        
        // Handle data channel open
        let event_sender_clone = event_sender.clone();
        let peer_id_clone = peer_id.clone();
        let channel_clone = channel.clone();
        
        data_channel.on_open(Box::new(move || {
            let event_sender = event_sender_clone.clone();
            let peer_id = peer_id_clone.clone();
            let channel = channel_clone.clone();
            
            Box::pin(async move {
                let _ = event_sender.send(WebRtcTransportEvent::ChannelOpened {
                    connection_id,
                    peer_id: peer_id.clone(),
                    channel: channel.clone(),
                }).await;
            })
        }));
        
        // Handle data channel close
        let event_sender_clone = event_sender.clone();
        let peer_id_clone = peer_id.clone();
        let channel_clone = channel.clone();
        
        data_channel.on_close(Box::new(move || {
            let event_sender = event_sender_clone.clone();
            let peer_id = peer_id_clone.clone();
            let channel = channel_clone.clone();
            
            Box::pin(async move {
                let _ = event_sender.send(WebRtcTransportEvent::ChannelClosed {
                    connection_id,
                    peer_id: peer_id.clone(),
                    channel: channel.clone(),
                }).await;
            })
        }));
        
        // Handle data channel message
        let event_sender_clone = event_sender.clone();
        let peer_id_clone = peer_id.clone();
        let channel_clone = channel.clone();
        
        data_channel.on_message(Box::new(move |msg: webrtc::data::Data| {
            let event_sender = event_sender_clone.clone();
            let peer_id = peer_id_clone.clone();
            let channel = channel_clone.clone();
            let data = msg.data.to_vec();
            
            Box::pin(async move {
                let _ = event_sender.send(WebRtcTransportEvent::DataReceived {
                    connection_id,
                    peer_id: peer_id.clone(),
                    channel: channel.clone(),
                    data,
                }).await;
            })
        }));
        
        // Add the data channel to the connection
        if let Some(mut connection) = self.connections.get_mut(&connection_id) {
            connection.data_channels.insert(label.to_string(), data_channel);
            connection.last_activity = Instant::now();
        }
        
        Ok(())
    }
    
    /// Send data through a data channel
    pub async fn send_data(&self, connection_id: ConnectionId, label: &str, data: &[u8]) -> Result<()> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Check if the connection is connected
        if connection.state != WebRtcConnectionState::Connected {
            return Err(Error::Connection(format!("Connection not connected: {}", connection_id)));
        }
        
        // Get the data channel
        let data_channel = connection.data_channels.get(label)
            .ok_or_else(|| Error::DataChannel(format!("Data channel not found: {}", label)))?;
        
        // Send the data
        data_channel.send(&webrtc::data::Data::Binary(data.to_vec())).await
            .map_err(|e| Error::DataChannel(e.to_string()))?;
        
        // Update the connection activity
        if let Some(mut connection) = self.connections.get_mut(&connection_id) {
            connection.last_activity = Instant::now();
        }
        
        Ok(())
    }
    
    /// Close a connection
    pub async fn close_connection(&self, connection_id: ConnectionId) -> Result<()> {
        // Get the connection
        let connection = self.connections.get(&connection_id)
            .ok_or_else(|| Error::ConnectionNotFound(format!("Connection not found: {}", connection_id)))?;
        
        // Close the peer connection
        connection.peer_connection.close().await
            .map_err(|e| Error::WebRtc(e.to_string()))?;
        
        // Remove the connection
        self.connections.remove(&connection_id);
        
        // Remove the connection from the peer connections
        if let Some(mut peer_conns) = self.peer_connections.get_mut(&connection.peer_id) {
            peer_conns.retain(|id| *id != connection_id);
            
            // If there are no more connections for this peer, remove the peer
            if peer_conns.is_empty() {
                self.peer_connections.remove(&connection.peer_id);
            }
        }
        
        // Send an event
        self.event_sender.send(WebRtcTransportEvent::ConnectionClosed {
            connection_id,
            peer_id: connection.peer_id.clone(),
        }).await?;
        
        Ok(())
    }
    
    /// Get metrics
    pub fn get_metrics(&self) -> (usize, usize) {
        (
            self.connections.len(),
            self.peer_connections.len(),
        )
    }
}