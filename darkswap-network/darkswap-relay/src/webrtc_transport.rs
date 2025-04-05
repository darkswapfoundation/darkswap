//! WebRTC transport implementation
//!
//! This module provides a WebRTC transport implementation for libp2p.
//! It uses the browser's native WebRTC API for browser-to-browser communication.

use libp2p::{
    core::{
        muxing::StreamMuxerBox,
        transport::{Boxed, ListenerId, TransportEvent},
        Transport,
    },
    identity::Keypair,
    PeerId,
};
use std::{
    collections::HashMap,
    pin::Pin,
    sync::{Arc, Mutex},
    task::{Context, Poll},
    time::Duration,
};
use tokio::sync::mpsc;

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

/// WebRTC transport
pub struct WebRtcTransport {
    /// Local peer ID
    local_peer_id: PeerId,
    /// Local keypair
    local_key: Keypair,
    /// STUN servers
    stun_servers: Vec<String>,
    /// TURN servers
    turn_servers: Vec<(String, String, String)>, // (url, username, credential)
    /// Active connections
    connections: Arc<Mutex<HashMap<PeerId, ConnectionId>>>,
    /// Event sender
    event_sender: mpsc::Sender<TransportEvent<StreamMuxerBox, std::io::Error>>,
    /// Event receiver
    event_receiver: mpsc::Receiver<TransportEvent<StreamMuxerBox, std::io::Error>>,
}

impl WebRtcTransport {
    /// Create a new WebRTC transport
    pub fn new(
        local_key: Keypair,
        stun_servers: Vec<String>,
        turn_servers: Vec<(String, String, String)>,
    ) -> Self {
        let local_peer_id = PeerId::from(local_key.public());
        let (tx, rx) = mpsc::channel(100);
        
        Self {
            local_peer_id,
            local_key,
            stun_servers,
            turn_servers,
            connections: Arc::new(Mutex::new(HashMap::new())),
            event_sender: tx,
            event_receiver: rx,
        }
    }
    
    /// Add a STUN server
    pub fn add_stun_server(&mut self, url: String) {
        self.stun_servers.push(url);
    }
    
    /// Add a TURN server
    pub fn add_turn_server(&mut self, url: String, username: String, credential: String) {
        self.turn_servers.push((url, username, credential));
    }
    
    /// Get STUN servers
    pub fn stun_servers(&self) -> &[String] {
        &self.stun_servers
    }
    
    /// Get TURN servers
    pub fn turn_servers(&self) -> &[(String, String, String)] {
        &self.turn_servers
    }
    
    /// Create an RTCConfiguration object for WebRTC
    pub fn create_rtc_config(&self) -> serde_json::Value {
        let mut ice_servers = Vec::new();
        
        // Add STUN servers
        for stun_server in &self.stun_servers {
            ice_servers.push(serde_json::json!({
                "urls": stun_server,
            }));
        }
        
        // Add TURN servers
        for (url, username, credential) in &self.turn_servers {
            ice_servers.push(serde_json::json!({
                "urls": url,
                "username": username,
                "credential": credential,
            }));
        }
        
        serde_json::json!({
            "iceServers": ice_servers,
            "iceTransportPolicy": "all",
            "bundlePolicy": "max-bundle",
            "rtcpMuxPolicy": "require",
            "sdpSemantics": "unified-plan",
        })
    }
    
    /// Create a boxed transport
    pub fn boxed(self) -> Boxed<(PeerId, StreamMuxerBox)> {
        // This is a placeholder since we can't actually implement this properly
        // without a lot more code. In a real implementation, we would need to
        // implement the Transport trait for WebRtcTransport.
        unimplemented!("WebRTC transport boxed method not implemented")
    }
}

impl Transport for WebRtcTransport {
    type Output = (PeerId, StreamMuxerBox);
    type Error = std::io::Error;
    type ListenerUpgrade = Pin<Box<dyn futures::Future<Output = Result<Self::Output, Self::Error>> + Send>>;
    type Dial = Pin<Box<dyn futures::Future<Output = Result<Self::Output, Self::Error>> + Send>>;
    
    fn listen_on(
        &mut self,
        _id: ListenerId,
        _addr: libp2p::core::Multiaddr,
    ) -> Result<(), libp2p::core::transport::TransportError<Self::Error>> {
        // WebRTC doesn't have a traditional listen address
        // Instead, we use the signaling server to establish connections
        Ok(())
    }
    
    fn remove_listener(&mut self, _id: ListenerId) -> bool {
        // No traditional listeners to remove
        false
    }
    
    fn dial(
        &mut self,
        _addr: libp2p::core::Multiaddr,
    ) -> Result<Self::Dial, libp2p::core::transport::TransportError<Self::Error>> {
        // WebRTC connections are established through the signaling server
        // This method would be called when we want to dial a specific peer
        Err(libp2p::core::transport::TransportError::Other(std::io::Error::new(
            std::io::ErrorKind::Other,
            "WebRTC connections are established through the signaling server",
        )))
    }
    
    fn dial_as_listener(
        &mut self,
        _addr: libp2p::core::Multiaddr,
    ) -> Result<Self::Dial, libp2p::core::transport::TransportError<Self::Error>> {
        // WebRTC doesn't have a traditional dial_as_listener
        Err(libp2p::core::transport::TransportError::Other(std::io::Error::new(
            std::io::ErrorKind::Other,
            "WebRTC doesn't support dial_as_listener",
        )))
    }
    
    fn poll(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<TransportEvent<Self::ListenerUpgrade, Self::Error>> {
        // Poll the event receiver
        match self.event_receiver.poll_recv(cx) {
            Poll::Ready(Some(_event)) => {
                // We need to convert the event to the correct type
                // This is a placeholder implementation
                Poll::Pending
            }
            Poll::Ready(None) => Poll::Pending,
            Poll::Pending => Poll::Pending,
        }
    }
    
    fn address_translation(&self, _listen: &libp2p::core::Multiaddr, _observed: &libp2p::core::Multiaddr) -> Option<libp2p::core::Multiaddr> {
        // No address translation needed for WebRTC
        None
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
pub struct WebRtcConnection {
    /// Peer ID
    peer_id: PeerId,
    /// Connection ID
    connection_id: ConnectionId,
    /// RTCPeerConnection
    peer_connection: Option<webrtc::peer_connection::RTCPeerConnection>,
    /// Data channels
    data_channels: HashMap<String, webrtc::data_channel::RTCDataChannel>,
    /// Connection state
    state: WebRtcConnectionState,
    /// Created timestamp
    created_at: std::time::Instant,
    /// Last activity timestamp
    last_activity: std::time::Instant,
    /// Remote description set
    remote_description_set: bool,
    /// Local description set
    local_description_set: bool,
    /// ICE candidates
    ice_candidates: Vec<webrtc::ice::candidate::RTCIceCandidate>,
    /// ICE gathering state
    ice_gathering_complete: bool,
    /// Connection established
    connection_established: bool,
}

impl WebRtcConnection {
    /// Create a new WebRTC connection
    pub fn new(peer_id: PeerId, connection_id: ConnectionId) -> Self {
        Self {
            peer_id,
            connection_id,
            peer_connection: None,
            data_channels: HashMap::new(),
            state: WebRtcConnectionState::New,
            created_at: std::time::Instant::now(),
            last_activity: std::time::Instant::now(),
            remote_description_set: false,
            local_description_set: false,
            ice_candidates: Vec::new(),
            ice_gathering_complete: false,
            connection_established: false,
        }
    }
    
    /// Get the peer ID
    pub fn peer_id(&self) -> &PeerId {
        &self.peer_id
    }
    
    /// Get the connection ID
    pub fn connection_id(&self) -> ConnectionId {
        self.connection_id
    }
    
    /// Get the connection state
    pub fn state(&self) -> WebRtcConnectionState {
        self.state
    }
    
    /// Set the connection state
    pub fn set_state(&mut self, state: WebRtcConnectionState) {
        self.state = state;
        self.last_activity = std::time::Instant::now();
    }
    
    /// Set the peer connection
    pub fn set_peer_connection(&mut self, peer_connection: webrtc::peer_connection::RTCPeerConnection) {
        self.peer_connection = Some(peer_connection);
        self.last_activity = std::time::Instant::now();
    }
    
    /// Get the peer connection
    pub fn peer_connection(&self) -> Option<&webrtc::peer_connection::RTCPeerConnection> {
        self.peer_connection.as_ref()
    }
    
    /// Get the peer connection mutably
    pub fn peer_connection_mut(&mut self) -> Option<&mut webrtc::peer_connection::RTCPeerConnection> {
        self.peer_connection.as_mut()
    }
    
    /// Add a data channel
    pub fn add_data_channel(&mut self, label: String, data_channel: webrtc::data_channel::RTCDataChannel) {
        self.data_channels.insert(label, data_channel);
        self.last_activity = std::time::Instant::now();
    }
    
    /// Get a data channel
    pub fn data_channel(&self, label: &str) -> Option<&webrtc::data_channel::RTCDataChannel> {
        self.data_channels.get(label)
    }
    
    /// Get a data channel mutably
    pub fn data_channel_mut(&mut self, label: &str) -> Option<&mut webrtc::data_channel::RTCDataChannel> {
        self.data_channels.get_mut(label)
    }
    
    /// Get all data channels
    pub fn data_channels(&self) -> &HashMap<String, webrtc::data_channel::RTCDataChannel> {
        &self.data_channels
    }
    
    /// Set the remote description
    pub fn set_remote_description(&mut self, remote_description: bool) {
        self.remote_description_set = remote_description;
        self.last_activity = std::time::Instant::now();
    }
    
    /// Set the local description
    pub fn set_local_description(&mut self, local_description: bool) {
        self.local_description_set = local_description;
        self.last_activity = std::time::Instant::now();
    }
    
    /// Add an ICE candidate
    pub fn add_ice_candidate(&mut self, candidate: webrtc::ice::candidate::RTCIceCandidate) {
        self.ice_candidates.push(candidate);
        self.last_activity = std::time::Instant::now();
    }
    
    /// Set ICE gathering complete
    pub fn set_ice_gathering_complete(&mut self, complete: bool) {
        self.ice_gathering_complete = complete;
        self.last_activity = std::time::Instant::now();
    }
    
    /// Set connection established
    pub fn set_connection_established(&mut self, established: bool) {
        self.connection_established = established;
        self.last_activity = std::time::Instant::now();
    }
    
    /// Check if the connection is ready for data
    pub fn is_ready(&self) -> bool {
        self.state == WebRtcConnectionState::Connected &&
        self.remote_description_set &&
        self.local_description_set &&
        self.connection_established
    }
    
    /// Close the connection
    pub async fn close(&mut self) -> Result<(), std::io::Error> {
        if let Some(peer_connection) = &self.peer_connection {
            if let Err(e) = peer_connection.close().await {
                return Err(std::io::Error::new(std::io::ErrorKind::Other, e.to_string()));
            }
        }
        
        self.state = WebRtcConnectionState::Closed;
        self.last_activity = std::time::Instant::now();
        
        Ok(())
    }
}

/// WebRTC transport manager
pub struct WebRtcTransportManager {
    /// Configuration
    config: crate::config::Config,
    /// Local peer ID
    local_peer_id: PeerId,
    /// Local keypair
    local_key: Keypair,
    /// WebRTC API
    api: webrtc::api::API,
    /// Active connections
    connections: Arc<dashmap::DashMap<ConnectionId, WebRtcConnection>>,
    /// Peer to connection mapping
    peer_connections: Arc<dashmap::DashMap<PeerId, Vec<ConnectionId>>>,
    /// Event sender
    event_sender: mpsc::Sender<WebRtcTransportEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<WebRtcTransportEvent>,
}

/// WebRTC transport event
#[derive(Debug)]
pub enum WebRtcTransportEvent {
    /// Connection established
    ConnectionEstablished {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: PeerId,
    },
    /// Connection closed
    ConnectionClosed {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: PeerId,
    },
    /// Connection failed
    ConnectionFailed {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: PeerId,
        /// Error message
        error: String,
    },
    /// Data received
    DataReceived {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: PeerId,
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
        peer_id: PeerId,
        /// Channel label
        channel: String,
    },
    /// Channel closed
    ChannelClosed {
        /// Connection ID
        connection_id: ConnectionId,
        /// Peer ID
        peer_id: PeerId,
        /// Channel label
        channel: String,
    },
}

impl WebRtcTransportManager {
    /// Create a new WebRTC transport manager
    pub fn new(
        config: crate::config::Config,
        local_key: Keypair,
    ) -> Result<Self, std::io::Error> {
        let local_peer_id = PeerId::from(local_key.public());
        let (tx, rx) = mpsc::channel(100);
        
        // Create a media engine
        let mut media_engine = webrtc::api::media_engine::MediaEngine::default();
        
        // Create a registry
        let mut registry = webrtc::interceptor::registry::Registry::new();
        
        // Register default interceptors
        registry = webrtc::api::interceptor_registry::register_default_interceptors(registry, &mut media_engine)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Create a setting engine
        let mut setting_engine = webrtc::api::setting_engine::SettingEngine::default();
        
        // Set ICE timeouts
        setting_engine.set_ice_timeouts(
            Some(Duration::from_secs(5)),
            Some(Duration::from_secs(25)),
            Some(Duration::from_secs(5)),
        );
        
        // Create the API
        let api = webrtc::api::APIBuilder::new()
            .with_media_engine(media_engine)
            .with_interceptor_registry(registry)
            .with_setting_engine(setting_engine)
            .build();
        
        Ok(Self {
            config,
            local_peer_id,
            local_key,
            api,
            connections: Arc::new(dashmap::DashMap::new()),
            peer_connections: Arc::new(dashmap::DashMap::new()),
            event_sender: tx,
            event_receiver: rx,
        })
    }
    
    /// Run the WebRTC transport manager
    pub async fn run(&mut self) -> Result<(), std::io::Error> {
        // Spawn a task to clean up expired connections
        let connections = self.connections.clone();
        let peer_connections = self.peer_connections.clone();
        let event_sender = self.event_sender.clone();
        let connection_timeout = self.config.connection_timeout();
        
        tokio::spawn(async move {
            loop {
                // Sleep for a while
                tokio::time::sleep(Duration::from_secs(10)).await;
                
                // Get the current time
                let now = std::time::Instant::now();
                
                // Find expired connections
                let expired_connections: Vec<(ConnectionId, WebRtcConnection)> = connections
                    .iter()
                    .filter_map(|entry| {
                        let connection = entry.value();
                        if now.duration_since(connection.last_activity) > connection_timeout {
                            Some((*entry.key(), connection.clone()))
                        } else {
                            None
                        }
                    })
                    .collect();
                
                // Remove expired connections
                for (connection_id, connection) in expired_connections {
                    // Close the connection
                    if let Some(mut conn) = connections.get_mut(&connection_id) {
                        let _ = conn.close().await;
                    }
                    
                    // Remove the connection
                    connections.remove(&connection_id);
                    
                    // Remove the connection from the peer connections
                    if let Some(mut peer_conns) = peer_connections.get_mut(&connection.peer_id) {
                        peer_conns.retain(|id| *id != connection_id);
                        
                        // If there are no more connections for this peer, remove the peer
                        if peer_conns.is_empty() {
                            peer_connections.remove(&connection.peer_id);
                        }
                    }
                    
                    // Send an event
                    let _ = event_sender.send(WebRtcTransportEvent::ConnectionClosed {
                        connection_id,
                        peer_id: connection.peer_id,
                    }).await;
                }
            }
        });
        
        // Process events
        while let Some(event) = self.event_receiver.recv().await {
            match event {
                WebRtcTransportEvent::ConnectionEstablished { connection_id, peer_id } => {
                    // Update the connection state
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.set_state(WebRtcConnectionState::Connected);
                        connection.set_connection_established(true);
                    }
                }
                WebRtcTransportEvent::ConnectionClosed { connection_id, peer_id } => {
                    // Remove the connection
                    self.connections.remove(&connection_id);
                    
                    // Remove the connection from the peer connections
                    if let Some(mut peer_conns) = self.peer_connections.get_mut(&peer_id) {
                        peer_conns.retain(|id| *id != connection_id);
                        
                        // If there are no more connections for this peer, remove the peer
                        if peer_conns.is_empty() {
                            self.peer_connections.remove(&peer_id);
                        }
                    }
                }
                WebRtcTransportEvent::ConnectionFailed { connection_id, peer_id, error } => {
                    // Update the connection state
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.set_state(WebRtcConnectionState::Failed);
                    }
                }
                WebRtcTransportEvent::DataReceived { connection_id, peer_id, channel, data } => {
                    // Process the data
                    // This would normally involve forwarding the data to the appropriate handler
                }
                WebRtcTransportEvent::ChannelOpened { connection_id, peer_id, channel } => {
                    // Update the connection state
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.last_activity = std::time::Instant::now();
                    }
                }
                WebRtcTransportEvent::ChannelClosed { connection_id, peer_id, channel } => {
                    // Update the connection state
                    if let Some(mut connection) = self.connections.get_mut(&connection_id) {
                        connection.data_channels.remove(&channel);
                    }
                }
            }
        }
        
        Ok(())
    }
    
    /// Create a new connection
    pub async fn create_connection(&self, peer_id: PeerId) -> Result<ConnectionId, std::io::Error> {
        // Generate a connection ID
        let connection_id = ConnectionId::new();
        
        // Create ICE servers
        let mut ice_servers = vec![];
        
        // Add STUN servers
        for server in &self.config.stun_servers() {
            ice_servers.push(webrtc::ice::ice_server::RTCIceServer {
                urls: vec![server.clone()],
                ..Default::default()
            });
        }
        
        // Add TURN servers
        for server in &self.config.turn_servers() {
            ice_servers.push(webrtc::ice::ice_server::RTCIceServer {
                urls: vec![server.url.clone()],
                username: server.username.clone(),
                credential: server.credential.clone(),
                ..Default::default()
            });
        }
        
        // Create configuration
        let config = webrtc::peer_connection::configuration::RTCConfiguration {
            ice_servers,
            ..Default::default()
        };
        
        // Create peer connection
        let peer_connection = self.api.new_peer_connection(config).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Create a new WebRTC connection
        let mut connection = WebRtcConnection::new(peer_id, connection_id);
        connection.set_peer_connection(peer_connection);
        connection.set_state(WebRtcConnectionState::New);
        
        // Store the connection
        self.connections.insert(connection_id, connection);
        
        // Add the connection to the peer connections
        let mut peer_conns = self.peer_connections
            .entry(peer_id)
            .or_insert_with(Vec::new);
        peer_conns.push(connection_id);
        
        Ok(connection_id)
    }
    
    /// Create an offer
    pub async fn create_offer(&self, connection_id: ConnectionId) -> Result<String, std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Get the peer connection
        let peer_connection = connection.peer_connection_mut()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Peer connection not found"))?;
        
        // Create an offer
        let offer = peer_connection.create_offer(None).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Set the local description
        peer_connection.set_local_description(offer.clone()).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Update the connection state
        connection.set_state(WebRtcConnectionState::Connecting);
        connection.set_local_description(true);
        
        // Return the SDP
        Ok(offer.sdp)
    }
    
    /// Set remote description
    pub async fn set_remote_description(&self, connection_id: ConnectionId, sdp: String, is_offer: bool) -> Result<(), std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Get the peer connection
        let peer_connection = connection.peer_connection_mut()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Peer connection not found"))?;
        
        // Create the session description
        let session_description = webrtc::peer_connection::sdp::session_description::RTCSessionDescription {
            sdp_type: if is_offer {
                webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Offer
            } else {
                webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Answer
            },
            sdp,
        };
        
        // Set the remote description
        peer_connection.set_remote_description(session_description).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Update the connection state
        connection.set_remote_description(true);
        
        Ok(())
    }
    
    /// Create an answer
    pub async fn create_answer(&self, connection_id: ConnectionId) -> Result<String, std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Get the peer connection
        let peer_connection = connection.peer_connection_mut()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Peer connection not found"))?;
        
        // Create an answer
        let answer = peer_connection.create_answer(None).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Set the local description
        peer_connection.set_local_description(answer.clone()).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Update the connection state
        connection.set_local_description(true);
        
        // Return the SDP
        Ok(answer.sdp)
    }
    
    /// Add ICE candidate
    pub async fn add_ice_candidate(&self, connection_id: ConnectionId, candidate: String, sdp_mid: Option<String>, sdp_mline_index: Option<u16>) -> Result<(), std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Get the peer connection
        let peer_connection = connection.peer_connection_mut()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Peer connection not found"))?;
        
        // Create the ICE candidate
        let ice_candidate = webrtc::ice::candidate::RTCIceCandidateInit {
            candidate,
            sdp_mid,
            sdp_mline_index,
            username_fragment: None,
        };
        
        // Add the ICE candidate
        peer_connection.add_ice_candidate(ice_candidate).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        Ok(())
    }
    
    /// Create a data channel
    pub async fn create_data_channel(&self, connection_id: ConnectionId, label: &str, ordered: bool, max_retransmits: Option<u16>) -> Result<(), std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Get the peer connection
        let peer_connection = connection.peer_connection_mut()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Peer connection not found"))?;
        
        // Create data channel options
        let mut options = webrtc::data_channel::data_channel_init::RTCDataChannelInit::default();
        options.ordered = ordered;
        options.max_retransmits = max_retransmits;
        
        // Create the data channel
        let data_channel = peer_connection.create_data_channel(label, Some(options)).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Add the data channel to the connection
        connection.add_data_channel(label.to_string(), data_channel);
        
        Ok(())
    }
    
    /// Send data through a data channel
    pub async fn send_data(&self, connection_id: ConnectionId, label: &str, data: &[u8]) -> Result<(), std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Check if the connection is ready
        if !connection.is_ready() {
            return Err(std::io::Error::new(std::io::ErrorKind::NotConnected, "Connection not ready"));
        }
        
        // Get the data channel
        let data_channel = connection.data_channel_mut(label)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Data channel not found"))?;
        
        // Send the data
        data_channel.send(&webrtc::data::Data::Binary(data.to_vec())).await
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        
        // Update the last activity timestamp
        connection.last_activity = std::time::Instant::now();
        
        Ok(())
    }
    
    /// Close a connection
    pub async fn close_connection(&self, connection_id: ConnectionId) -> Result<(), std::io::Error> {
        // Get the connection
        let mut connection = self.connections.get_mut(&connection_id)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Connection not found"))?;
        
        // Close the connection
        connection.close().await?;
        
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
        let _ = self.event_sender.send(WebRtcTransportEvent::ConnectionClosed {
            connection_id,
            peer_id: connection.peer_id,
        }).await;
        
        Ok(())
    }
    
    /// Get active connections
    pub fn get_active_connections(&self) -> Vec<(ConnectionId, PeerId, WebRtcConnectionState)> {
        self.connections
            .iter()
            .map(|entry| {
                let connection = entry.value();
                (*entry.key(), connection.peer_id, connection.state)
            })
            .collect()
    }
    
    /// Get connection by peer ID
    pub fn get_connection_by_peer(&self, peer_id: &PeerId) -> Option<ConnectionId> {
        if let Some(peer_conns) = self.peer_connections.get(peer_id) {
            peer_conns.first().copied()
        } else {
            None
        }
    }
    
    /// Get connection state
    pub fn get_connection_state(&self, connection_id: ConnectionId) -> Option<WebRtcConnectionState> {
        if let Some(connection) = self.connections.get(&connection_id) {
            Some(connection.state)
        } else {
            None
        }
    }
    
    /// Get connection metrics
    pub fn get_metrics(&self) -> (usize, usize) {
        (
            self.connections.len(),
            self.peer_connections.len(),
        )
    }
}