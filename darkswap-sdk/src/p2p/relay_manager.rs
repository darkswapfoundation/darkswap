//! Relay Manager for DarkSwap SDK
//!
//! This module provides functionality for connecting to relay servers
//! and establishing connections through them when direct connections are not possible.

use crate::{
    error::Error,
    p2p::{
        circuit_relay::CircuitRelay,
        webrtc_transport::WebRtcTransport,
        PeerId,
    },
    Result,
};
use futures::{
    channel::mpsc,
    prelude::*,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use url::Url;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{MessageEvent, WebSocket};

/// Relay server information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayServer {
    /// Server ID
    pub id: String,
    /// Server URL
    pub url: String,
    /// Server status
    pub status: RelayServerStatus,
    /// Last ping time
    pub last_ping: Option<Instant>,
    /// Ping latency in milliseconds
    pub latency_ms: Option<u64>,
}

/// Relay server status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RelayServerStatus {
    /// Unknown status
    Unknown,
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Disconnected
    Disconnected,
    /// Failed
    Failed,
}

/// Relay connection
#[derive(Debug)]
struct RelayConnection {
    /// Server ID
    server_id: String,
    /// WebSocket connection
    ws: WebSocket,
    /// Peer ID
    peer_id: PeerId,
    /// Connected peers
    connected_peers: HashSet<PeerId>,
    /// Relay circuits
    circuits: HashMap<String, RelayCircuit>,
    /// Last activity time
    last_activity: Instant,
}

/// Relay circuit
#[derive(Debug)]
struct RelayCircuit {
    /// Circuit ID
    id: String,
    /// Source peer ID
    src: PeerId,
    /// Destination peer ID
    dst: PeerId,
    /// Creation time
    created_at: Instant,
    /// Status
    status: RelayCircuitStatus,
    /// Bytes sent
    bytes_sent: u64,
    /// Bytes received
    bytes_received: u64,
}

/// Relay circuit status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RelayCircuitStatus {
    /// Pending
    Pending,
    /// Active
    Active,
    /// Closed
    Closed,
}

/// Relay message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum RelayMessage {
    /// Register with the relay server
    Register {
        /// Peer ID
        peer_id: String,
    },
    /// WebRTC offer
    Offer {
        /// Sender peer ID
        from: String,
        /// Receiver peer ID
        to: String,
        /// SDP offer
        sdp: String,
    },
    /// WebRTC answer
    Answer {
        /// Sender peer ID
        from: String,
        /// Receiver peer ID
        to: String,
        /// SDP answer
        sdp: String,
    },
    /// ICE candidate
    IceCandidate {
        /// Sender peer ID
        from: String,
        /// Receiver peer ID
        to: String,
        /// ICE candidate
        candidate: String,
        /// SDP mid
        sdp_mid: Option<String>,
        /// SDP mline index
        sdp_mline_index: Option<u16>,
    },
    /// Request a relay connection
    RelayRequest {
        /// Sender peer ID
        from: String,
        /// Receiver peer ID
        to: String,
    },
    /// Response to a relay request
    RelayResponse {
        /// Relay ID
        relay_id: String,
        /// Whether the relay request was accepted
        accepted: bool,
        /// Error message if the relay request was rejected
        error: Option<String>,
    },
    /// Create a data channel for a relay connection
    DataChannel {
        /// Peer ID
        peer_id: String,
        /// Relay ID
        relay_id: String,
        /// Channel name
        channel: String,
    },
    /// Send data through a relay connection
    RelayData {
        /// Sender peer ID
        from: String,
        /// Relay ID
        relay_id: String,
        /// Data (base64 encoded)
        data: String,
    },
    /// Close a relay connection
    CloseRelay {
        /// Relay ID
        relay_id: String,
    },
    /// Error message
    Error {
        /// Error message
        message: String,
    },
    /// Ping message
    Ping,
    /// Pong message
    Pong,
}

/// Relay manager configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayManagerConfig {
    /// Relay servers
    pub servers: Vec<RelayServer>,
    /// Connection timeout in seconds
    pub connection_timeout: u64,
    /// Ping interval in seconds
    pub ping_interval: u64,
    /// Reconnect interval in seconds
    pub reconnect_interval: u64,
    /// Maximum reconnect attempts
    pub max_reconnect_attempts: u32,
}

impl Default for RelayManagerConfig {
    fn default() -> Self {
        Self {
            servers: Vec::new(),
            connection_timeout: 30,
            ping_interval: 30,
            reconnect_interval: 5,
            max_reconnect_attempts: 5,
        }
    }
}

/// Relay manager
pub struct RelayManager {
    /// Configuration
    config: RelayManagerConfig,
    /// Relay connections
    connections: Arc<RwLock<HashMap<String, RelayConnection>>>,
    /// WebRTC transport
    webrtc_transport: Arc<WebRtcTransport>,
    /// Circuit relay
    circuit_relay: Arc<CircuitRelay>,
    /// Peer ID
    peer_id: PeerId,
    /// Event sender
    event_sender: mpsc::Sender<RelayEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<RelayEvent>,
}

/// Relay event
#[derive(Debug, Clone)]
pub enum RelayEvent {
    /// Server connected
    ServerConnected {
        /// Server ID
        server_id: String,
    },
    /// Server disconnected
    ServerDisconnected {
        /// Server ID
        server_id: String,
    },
    /// Server failed
    ServerFailed {
        /// Server ID
        server_id: String,
        /// Error message
        error: String,
    },
    /// Peer connected
    PeerConnected {
        /// Peer ID
        peer_id: PeerId,
        /// Server ID
        server_id: String,
    },
    /// Peer disconnected
    PeerDisconnected {
        /// Peer ID
        peer_id: PeerId,
        /// Server ID
        server_id: String,
    },
    /// Circuit created
    CircuitCreated {
        /// Circuit ID
        circuit_id: String,
        /// Source peer ID
        src: PeerId,
        /// Destination peer ID
        dst: PeerId,
        /// Server ID
        server_id: String,
    },
    /// Circuit closed
    CircuitClosed {
        /// Circuit ID
        circuit_id: String,
        /// Server ID
        server_id: String,
    },
    /// Data received
    DataReceived {
        /// Circuit ID
        circuit_id: String,
        /// Source peer ID
        src: PeerId,
        /// Data
        data: Vec<u8>,
    },
}

impl RelayManager {
    /// Create a new relay manager
    pub fn new(
        config: RelayManagerConfig,
        webrtc_transport: Arc<WebRtcTransport>,
        circuit_relay: Arc<CircuitRelay>,
        peer_id: PeerId,
    ) -> Self {
        let (tx, rx) = mpsc::channel(100);
        
        Self {
            config,
            connections: Arc::new(RwLock::new(HashMap::new())),
            webrtc_transport,
            circuit_relay,
            peer_id,
            event_sender: tx,
            event_receiver: rx,
        }
    }
    
    /// Start the relay manager
    pub async fn start(&mut self) -> Result<()> {
        // Connect to all relay servers
        for server in &self.config.servers {
            self.connect_to_server(server.clone()).await?;
        }
        
        // Start the ping timer
        let connections = self.connections.clone();
        let ping_interval = self.config.ping_interval;
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(ping_interval));
            
            loop {
                interval.tick().await;
                
                // Send ping to all connected servers
                let mut connections = connections.write().await;
                for (_, connection) in connections.iter_mut() {
                    // Send ping message
                    let ping_msg = RelayMessage::Ping;
                    let json = serde_json::to_string(&ping_msg).unwrap();
                    connection.ws.send_with_str(&json).unwrap_or_else(|e| {
                        warn!("Failed to send ping: {:?}", e);
                    });
                }
            }
        });
        
        // Process events
        while let Some(event) = self.event_receiver.next().await {
            match event {
                RelayEvent::ServerConnected { server_id } => {
                    info!("Connected to relay server: {}", server_id);
                    
                    // Update server status
                    if let Some(server) = self.get_server_mut(&server_id) {
                        server.status = RelayServerStatus::Connected;
                    }
                }
                RelayEvent::ServerDisconnected { server_id } => {
                    info!("Disconnected from relay server: {}", server_id);
                    
                    // Update server status
                    if let Some(server) = self.get_server_mut(&server_id) {
                        server.status = RelayServerStatus::Disconnected;
                    }
                    
                    // Try to reconnect
                    if let Some(server) = self.get_server(&server_id) {
                        let server_clone = server.clone();
                        tokio::spawn(async move {
                            tokio::time::sleep(Duration::from_secs(5)).await;
                            // TODO: Implement reconnection logic
                        });
                    }
                }
                RelayEvent::ServerFailed { server_id, error } => {
                    warn!("Relay server failed: {}: {}", server_id, error);
                    
                    // Update server status
                    if let Some(server) = self.get_server_mut(&server_id) {
                        server.status = RelayServerStatus::Failed;
                    }
                }
                RelayEvent::PeerConnected { peer_id, server_id } => {
                    info!("Peer connected via relay: {}", peer_id);
                    
                    // Add the peer to the connected peers
                    let mut connections = self.connections.write().await;
                    if let Some(connection) = connections.get_mut(&server_id) {
                        connection.connected_peers.insert(peer_id);
                    }
                }
                RelayEvent::PeerDisconnected { peer_id, server_id } => {
                    info!("Peer disconnected from relay: {}", peer_id);
                    
                    // Remove the peer from the connected peers
                    let mut connections = self.connections.write().await;
                    if let Some(connection) = connections.get_mut(&server_id) {
                        connection.connected_peers.remove(&peer_id);
                    }
                }
                RelayEvent::CircuitCreated { circuit_id, src, dst, server_id } => {
                    info!("Circuit created: {} from {} to {}", circuit_id, src, dst);
                    
                    // Add the circuit to the circuits
                    let mut connections = self.connections.write().await;
                    if let Some(connection) = connections.get_mut(&server_id) {
                        connection.circuits.insert(circuit_id.clone(), RelayCircuit {
                            id: circuit_id,
                            src,
                            dst,
                            created_at: Instant::now(),
                            status: RelayCircuitStatus::Active,
                            bytes_sent: 0,
                            bytes_received: 0,
                        });
                    }
                }
                RelayEvent::CircuitClosed { circuit_id, server_id } => {
                    info!("Circuit closed: {}", circuit_id);
                    
                    // Remove the circuit from the circuits
                    let mut connections = self.connections.write().await;
                    if let Some(connection) = connections.get_mut(&server_id) {
                        connection.circuits.remove(&circuit_id);
                    }
                }
                RelayEvent::DataReceived { circuit_id, src, data } => {
                    debug!("Data received from {} via circuit {}: {} bytes", src, circuit_id, data.len());
                    
                    // Forward the data to the circuit relay
                    self.circuit_relay.handle_relay_data(src, circuit_id, data).await?;
                }
            }
        }
        
        Ok(())
    }
    
    /// Connect to a relay server
    pub async fn connect_to_server(&self, server: RelayServer) -> Result<()> {
        // Create a WebSocket connection
        let ws = WebSocket::new(&server.url)?;
        
        // Set up event handlers
        let server_id = server.id.clone();
        let peer_id = self.peer_id.clone();
        let event_sender = self.event_sender.clone();
        let connections = self.connections.clone();
        
        // Handle open event
        let onopen_callback = Closure::wrap(Box::new(move || {
            let server_id = server_id.clone();
            let peer_id = peer_id.clone();
            let event_sender = event_sender.clone();
            
            // Send register message
            let register_msg = RelayMessage::Register {
                peer_id: peer_id.to_string(),
            };
            let json = serde_json::to_string(&register_msg).unwrap();
            
            // Get the WebSocket
            let connections_clone = connections.clone();
            let server_id_clone = server_id.clone();
            
            wasm_bindgen_futures::spawn_local(async move {
                let connections = connections_clone.read().await;
                if let Some(connection) = connections.get(&server_id_clone) {
                    connection.ws.send_with_str(&json).unwrap_or_else(|e| {
                        warn!("Failed to send register message: {:?}", e);
                    });
                }
            });
            
            // Send connected event
            let event = RelayEvent::ServerConnected {
                server_id: server_id.clone(),
            };
            
            wasm_bindgen_futures::spawn_local(async move {
                event_sender.clone().send(event).await.unwrap_or_else(|e| {
                    warn!("Failed to send event: {:?}", e);
                });
            });
        }) as Box<dyn FnMut()>);
        
        ws.set_onopen(Some(onopen_callback.as_ref().unchecked_ref()));
        onopen_callback.forget();
        
        // Handle message event
        let onmessage_callback = Closure::wrap(Box::new(move |e: MessageEvent| {
            let server_id = server_id.clone();
            let event_sender = event_sender.clone();
            
            // Parse the message
            if let Ok(text) = e.data().dyn_into::<js_sys::JsString>() {
                let text = text.as_string().unwrap();
                
                // Parse the message
                match serde_json::from_str::<RelayMessage>(&text) {
                    Ok(msg) => {
                        // Handle the message
                        match msg {
                            RelayMessage::Pong => {
                                // Update the last ping time and latency
                                let connections_clone = connections.clone();
                                let server_id_clone = server_id.clone();
                                
                                wasm_bindgen_futures::spawn_local(async move {
                                    let mut connections = connections_clone.write().await;
                                    if let Some(connection) = connections.get_mut(&server_id_clone) {
                                        connection.last_activity = Instant::now();
                                    }
                                });
                            }
                            RelayMessage::Offer { from, to, sdp } => {
                                // Forward the offer to the WebRTC transport
                                let webrtc_transport = self.webrtc_transport.clone();
                                
                                wasm_bindgen_futures::spawn_local(async move {
                                    webrtc_transport.handle_offer(from, to, sdp).await.unwrap_or_else(|e| {
                                        warn!("Failed to handle offer: {:?}", e);
                                    });
                                });
                            }
                            RelayMessage::Answer { from, to, sdp } => {
                                // Forward the answer to the WebRTC transport
                                let webrtc_transport = self.webrtc_transport.clone();
                                
                                wasm_bindgen_futures::spawn_local(async move {
                                    webrtc_transport.handle_answer(from, to, sdp).await.unwrap_or_else(|e| {
                                        warn!("Failed to handle answer: {:?}", e);
                                    });
                                });
                            }
                            RelayMessage::IceCandidate { from, to, candidate, sdp_mid, sdp_mline_index } => {
                                // Forward the ICE candidate to the WebRTC transport
                                let webrtc_transport = self.webrtc_transport.clone();
                                
                                wasm_bindgen_futures::spawn_local(async move {
                                    webrtc_transport.handle_ice_candidate(from, to, candidate, sdp_mid, sdp_mline_index).await.unwrap_or_else(|e| {
                                        warn!("Failed to handle ICE candidate: {:?}", e);
                                    });
                                });
                            }
                            RelayMessage::RelayResponse { relay_id, accepted, error } => {
                                if accepted {
                                    // Create a circuit
                                    let event = RelayEvent::CircuitCreated {
                                        circuit_id: relay_id.clone(),
                                        src: peer_id.clone(),
                                        dst: peer_id.clone(), // TODO: Get the actual destination peer ID
                                        server_id: server_id.clone(),
                                    };
                                    
                                    wasm_bindgen_futures::spawn_local(async move {
                                        event_sender.clone().send(event).await.unwrap_or_else(|e| {
                                            warn!("Failed to send event: {:?}", e);
                                        });
                                    });
                                } else {
                                    warn!("Relay request rejected: {:?}", error);
                                }
                            }
                            RelayMessage::RelayData { from, relay_id, data } => {
                                // Decode the data
                                match base64::decode(&data) {
                                    Ok(data) => {
                                        // Send data received event
                                        let event = RelayEvent::DataReceived {
                                            circuit_id: relay_id,
                                            src: from.parse().unwrap(),
                                            data,
                                        };
                                        
                                        wasm_bindgen_futures::spawn_local(async move {
                                            event_sender.clone().send(event).await.unwrap_or_else(|e| {
                                                warn!("Failed to send event: {:?}", e);
                                            });
                                        });
                                    }
                                    Err(e) => {
                                        warn!("Failed to decode data: {:?}", e);
                                    }
                                }
                            }
                            RelayMessage::Error { message } => {
                                warn!("Relay server error: {}", message);
                            }
                            _ => {
                                // Ignore other messages
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to parse relay message: {:?}", e);
                    }
                }
            }
        }) as Box<dyn FnMut(MessageEvent)>);
        
        ws.set_onmessage(Some(onmessage_callback.as_ref().unchecked_ref()));
        onmessage_callback.forget();
        
        // Handle close event
        let onclose_callback = Closure::wrap(Box::new(move |_| {
            let server_id = server_id.clone();
            let event_sender = event_sender.clone();
            
            // Send disconnected event
            let event = RelayEvent::ServerDisconnected {
                server_id: server_id.clone(),
            };
            
            wasm_bindgen_futures::spawn_local(async move {
                event_sender.clone().send(event).await.unwrap_or_else(|e| {
                    warn!("Failed to send event: {:?}", e);
                });
            });
        }) as Box<dyn FnMut(JsValue)>);
        
        ws.set_onclose(Some(onclose_callback.as_ref().unchecked_ref()));
        onclose_callback.forget();
        
        // Handle error event
        let onerror_callback = Closure::wrap(Box::new(move |e: JsValue| {
            let server_id = server_id.clone();
            let event_sender = event_sender.clone();
            
            // Send failed event
            let event = RelayEvent::ServerFailed {
                server_id: server_id.clone(),
                error: format!("{:?}", e),
            };
            
            wasm_bindgen_futures::spawn_local(async move {
                event_sender.clone().send(event).await.unwrap_or_else(|e| {
                    warn!("Failed to send event: {:?}", e);
                });
            });
        }) as Box<dyn FnMut(JsValue)>);
        
        ws.set_onerror(Some(onerror_callback.as_ref().unchecked_ref()));
        onerror_callback.forget();
        
        // Create the relay connection
        let connection = RelayConnection {
            server_id: server.id.clone(),
            ws,
            peer_id: self.peer_id.clone(),
            connected_peers: HashSet::new(),
            circuits: HashMap::new(),
            last_activity: Instant::now(),
        };
        
        // Add the connection to the connections map
        let mut connections = self.connections.write().await;
        connections.insert(server.id.clone(), connection);
        
        Ok(())
    }
    
    /// Get a server by ID
    fn get_server(&self, server_id: &str) -> Option<&RelayServer> {
        self.config.servers.iter().find(|s| s.id == server_id)
    }
    
    /// Get a mutable server by ID
    fn get_server_mut(&mut self, server_id: &str) -> Option<&mut RelayServer> {
        self.config.servers.iter_mut().find(|s| s.id == server_id)
    }
    
    /// Connect to a peer via relay
    pub async fn connect_to_peer(&self, peer_id: &PeerId) -> Result<String> {
        // Find a connected relay server
        let connections = self.connections.read().await;
        let server_id = connections.keys().next().ok_or_else(|| Error::NoRelayServers)?;
        let connection = connections.get(server_id).unwrap();
        
        // Send relay request
        let relay_request = RelayMessage::RelayRequest {
            from: self.peer_id.to_string(),
            to: peer_id.to_string(),
        };
        
        let json = serde_json::to_string(&relay_request)?;
        connection.ws.send_with_str(&json)?;
        
        // TODO: Wait for relay response
        
        Ok("relay-id".to_string())
    }
    
    /// Send data to a peer via relay
    pub async fn send_data(&self, peer_id: &PeerId, relay_id: &str, data: &[u8]) -> Result<()> {
        // Find a connected relay server
        let connections = self.connections.read().await;
        let server_id = connections.keys().next().ok_or_else(|| Error::NoRelayServers)?;
        let connection = connections.get(server_id).unwrap();
        
        // Encode the data
        let data_base64 = base64::encode(data);
        
        // Send relay data
        let relay_data = RelayMessage::RelayData {
            from: self.peer_id.to_string(),
            relay_id: relay_id.to_string(),
            data: data_base64,
        };
        
        let json = serde_json::to_string(&relay_data)?;
        connection.ws.send_with_str(&json)?;
        
        Ok(())
    }
    
    /// Close a relay connection
    pub async fn close_relay(&self, relay_id: &str) -> Result<()> {
        // Find a connected relay server
        let connections = self.connections.read().await;
        let server_id = connections.keys().next().ok_or_else(|| Error::NoRelayServers)?;
        let connection = connections.get(server_id).unwrap();
        
        // Send close relay
        let close_relay = RelayMessage::CloseRelay {
            relay_id: relay_id.to_string(),
        };
        
        let json = serde_json::to_string(&close_relay)?;
        connection.ws.send_with_str(&json)?;
        
        Ok(())
    }
    
    /// Get the list of connected peers
    pub async fn get_connected_peers(&self) -> Vec<PeerId> {
        let connections = self.connections.read().await;
        let mut peers = HashSet::new();
        
        for connection in connections.values() {
            peers.extend(connection.connected_peers.iter().cloned());
        }
        
        peers.into_iter().collect()
    }
    
    /// Get the list of active circuits
    pub async fn get_active_circuits(&self) -> Vec<String> {
        let connections = self.connections.read().await;
        let mut circuits = Vec::new();
        
        for connection in connections.values() {
            for (id, circuit) in &connection.circuits {
                if circuit.status == RelayCircuitStatus::Active {
                    circuits.push(id.clone());
                }
            }
        }
        
        circuits
    }
    
    /// Get the list of connected relay servers
    pub fn get_connected_servers(&self) -> Vec<String> {
        self.config.servers
            .iter()
            .filter(|s| s.status == RelayServerStatus::Connected)
            .map(|s| s.id.clone())
            .collect()
    }
}