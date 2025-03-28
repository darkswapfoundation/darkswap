//! WebRTC signaling server implementation
//!
//! This module provides a signaling server implementation for WebRTC connection establishment.
//! It handles SDP offer/answer exchange and ICE candidate exchange between peers.

use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use futures::{
    channel::mpsc::{self, Receiver, Sender},
    SinkExt, StreamExt,
};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use warp::{
    ws::{Message, WebSocket},
    Filter,
};

/// Signaling message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum SignalingMessage {
    /// Register with the signaling server
    Register {
        /// Peer ID
        peer_id: String,
    },
    /// SDP offer
    Offer {
        /// Peer ID of the offerer
        from: String,
        /// Peer ID of the target
        to: String,
        /// SDP offer
        sdp: String,
    },
    /// SDP answer
    Answer {
        /// Peer ID of the answerer
        from: String,
        /// Peer ID of the target
        to: String,
        /// SDP answer
        sdp: String,
    },
    /// ICE candidate
    IceCandidate {
        /// Peer ID of the sender
        from: String,
        /// Peer ID of the target
        to: String,
        /// ICE candidate
        candidate: String,
        /// SDP mid
        sdp_mid: String,
        /// SDP m-line index
        sdp_m_line_index: u16,
    },
    /// Error message
    Error {
        /// Error message
        message: String,
    },
}

/// Client connection
struct Client {
    /// Peer ID
    peer_id: String,
    /// Last seen time
    last_seen: Instant,
    /// Message sender
    sender: Sender<Result<Message, warp::Error>>,
}

/// Signaling server
pub struct SignalingServer {
    /// Clients
    clients: Arc<Mutex<HashMap<String, Client>>>,
    /// Broadcast channel for client events
    client_events: broadcast::Sender<ClientEvent>,
}

/// Client event
#[derive(Debug, Clone)]
enum ClientEvent {
    /// Client connected
    Connected {
        /// Peer ID
        peer_id: String,
    },
    /// Client disconnected
    Disconnected {
        /// Peer ID
        peer_id: String,
    },
}

impl SignalingServer {
    /// Create a new signaling server
    pub fn new() -> Self {
        let (client_events_tx, _) = broadcast::channel(100);
        
        SignalingServer {
            clients: Arc::new(Mutex::new(HashMap::new())),
            client_events: client_events_tx,
        }
    }
    
    /// Start the signaling server
    pub async fn start(&self, port: u16) -> Result<(), Box<dyn std::error::Error>> {
        let clients = self.clients.clone();
        let client_events = self.client_events.clone();
        
        // Start the cleanup task
        let cleanup_clients = clients.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(60)).await;
                Self::cleanup_clients(cleanup_clients.clone());
            }
        });
        
        // WebSocket route
        let ws_route = warp::path("signaling")
            .and(warp::ws())
            .and(warp::any().map(move || clients.clone()))
            .and(warp::any().map(move || client_events.clone()))
            .map(|ws: warp::ws::Ws, clients, client_events| {
                ws.on_upgrade(move |socket| Self::handle_connection(socket, clients, client_events))
            });
        
        // Start the server
        warp::serve(ws_route).run(([0, 0, 0, 0], port)).await;
        
        Ok(())
    }
    
    /// Handle a new WebSocket connection
    async fn handle_connection(
        ws: WebSocket,
        clients: Arc<Mutex<HashMap<String, Client>>>,
        client_events: broadcast::Sender<ClientEvent>,
    ) {
        let (mut ws_tx, mut ws_rx) = ws.split();
        let (tx, mut rx) = mpsc::channel(100);
        
        // Forward messages from the channel to the WebSocket
        tokio::spawn(async move {
            while let Some(message) = rx.next().await {
                if let Err(e) = ws_tx.send(message).await {
                    eprintln!("WebSocket send error: {}", e);
                    break;
                }
            }
        });
        
        // Process incoming messages
        let mut peer_id = None;
        
        while let Some(result) = ws_rx.next().await {
            match result {
                Ok(msg) => {
                    if let Ok(text) = msg.to_str() {
                        if let Ok(message) = serde_json::from_str::<SignalingMessage>(text) {
                            match message {
                                SignalingMessage::Register { peer_id: id } => {
                                    peer_id = Some(id.clone());
                                    
                                    // Register the client
                                    let mut clients = clients.lock().unwrap();
                                    clients.insert(
                                        id.clone(),
                                        Client {
                                            peer_id: id.clone(),
                                            last_seen: Instant::now(),
                                            sender: tx.clone(),
                                        },
                                    );
                                    
                                    // Notify about the new client
                                    let _ = client_events.send(ClientEvent::Connected { peer_id: id });
                                    
                                    // Send confirmation
                                    let response = SignalingMessage::Register { peer_id: id };
                                    let response_json = serde_json::to_string(&response).unwrap();
                                    let _ = tx.send(Ok(Message::text(response_json))).await;
                                }
                                SignalingMessage::Offer { from, to, sdp } => {
                                    // Update last seen time
                                    if let Some(peer_id) = &peer_id {
                                        if let Some(client) = clients.lock().unwrap().get_mut(peer_id) {
                                            client.last_seen = Instant::now();
                                        }
                                    }
                                    
                                    // Forward the offer to the target
                                    let clients = clients.lock().unwrap();
                                    if let Some(client) = clients.get(&to) {
                                        let message = SignalingMessage::Offer {
                                            from,
                                            to,
                                            sdp,
                                        };
                                        let message_json = serde_json::to_string(&message).unwrap();
                                        let _ = client.sender.clone().send(Ok(Message::text(message_json))).await;
                                    } else {
                                        // Target not found
                                        let error = SignalingMessage::Error {
                                            message: format!("Peer {} not found", to),
                                        };
                                        let error_json = serde_json::to_string(&error).unwrap();
                                        let _ = tx.send(Ok(Message::text(error_json))).await;
                                    }
                                }
                                SignalingMessage::Answer { from, to, sdp } => {
                                    // Update last seen time
                                    if let Some(peer_id) = &peer_id {
                                        if let Some(client) = clients.lock().unwrap().get_mut(peer_id) {
                                            client.last_seen = Instant::now();
                                        }
                                    }
                                    
                                    // Forward the answer to the target
                                    let clients = clients.lock().unwrap();
                                    if let Some(client) = clients.get(&to) {
                                        let message = SignalingMessage::Answer {
                                            from,
                                            to,
                                            sdp,
                                        };
                                        let message_json = serde_json::to_string(&message).unwrap();
                                        let _ = client.sender.clone().send(Ok(Message::text(message_json))).await;
                                    } else {
                                        // Target not found
                                        let error = SignalingMessage::Error {
                                            message: format!("Peer {} not found", to),
                                        };
                                        let error_json = serde_json::to_string(&error).unwrap();
                                        let _ = tx.send(Ok(Message::text(error_json))).await;
                                    }
                                }
                                SignalingMessage::IceCandidate {
                                    from,
                                    to,
                                    candidate,
                                    sdp_mid,
                                    sdp_m_line_index,
                                } => {
                                    // Update last seen time
                                    if let Some(peer_id) = &peer_id {
                                        if let Some(client) = clients.lock().unwrap().get_mut(peer_id) {
                                            client.last_seen = Instant::now();
                                        }
                                    }
                                    
                                    // Forward the ICE candidate to the target
                                    let clients = clients.lock().unwrap();
                                    if let Some(client) = clients.get(&to) {
                                        let message = SignalingMessage::IceCandidate {
                                            from,
                                            to,
                                            candidate,
                                            sdp_mid,
                                            sdp_m_line_index,
                                        };
                                        let message_json = serde_json::to_string(&message).unwrap();
                                        let _ = client.sender.clone().send(Ok(Message::text(message_json))).await;
                                    } else {
                                        // Target not found
                                        let error = SignalingMessage::Error {
                                            message: format!("Peer {} not found", to),
                                        };
                                        let error_json = serde_json::to_string(&error).unwrap();
                                        let _ = tx.send(Ok(Message::text(error_json))).await;
                                    }
                                }
                                _ => {
                                    // Ignore other messages
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("WebSocket error: {}", e);
                    break;
                }
            }
        }
        
        // Client disconnected
        if let Some(id) = peer_id {
            let mut clients = clients.lock().unwrap();
            clients.remove(&id);
            
            // Notify about the disconnected client
            let _ = client_events.send(ClientEvent::Disconnected { peer_id: id });
        }
    }
    
    /// Clean up inactive clients
    fn cleanup_clients(clients: Arc<Mutex<HashMap<String, Client>>>) {
        let mut clients = clients.lock().unwrap();
        let now = Instant::now();
        let timeout = Duration::from_secs(300); // 5 minutes
        
        clients.retain(|_, client| now.duration_since(client.last_seen) < timeout);
    }
    
    /// Get the list of connected peers
    pub fn get_connected_peers(&self) -> HashSet<String> {
        let clients = self.clients.lock().unwrap();
        clients.keys().cloned().collect()
    }
    
    /// Check if a peer is connected
    pub fn is_peer_connected(&self, peer_id: &str) -> bool {
        let clients = self.clients.lock().unwrap();
        clients.contains_key(peer_id)
    }
    
    /// Subscribe to client events
    pub fn subscribe_to_client_events(&self) -> broadcast::Receiver<ClientEvent> {
        self.client_events.subscribe()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_signaling_server() {
        let server = SignalingServer::new();
        
        // Start the server in a separate task
        let server_handle = tokio::spawn(async move {
            server.start(8765).await.unwrap();
        });
        
        // Wait for the server to start
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        // Connect to the server
        let (ws, _) = tokio_tungstenite::connect_async("ws://localhost:8765/signaling")
            .await
            .unwrap();
        
        // Register with the server
        let register_message = SignalingMessage::Register {
            peer_id: "test-peer".to_string(),
        };
        let register_json = serde_json::to_string(&register_message).unwrap();
        
        // TODO: Send the register message and verify the response
        
        // Clean up
        server_handle.abort();
    }
}