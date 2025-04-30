//! Signaling server for WebRTC connections
//!
//! This module provides a WebSocket-based signaling server for WebRTC connections.
//! It allows peers to exchange SDP offers/answers and ICE candidates.

use crate::{
    config::Config,
    error::Error,
    webrtc::WebRtcManager,
    circuit::CircuitRelayManager,
    auth::{AuthManager, AuthMiddleware},
    rate_limit::{RateLimitManager, RateLimitMiddleware},
    Result,
};
use axum;
use warp;
use jsonwebtoken;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tokio::sync::mpsc;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// Signaling message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum SignalingMessage {
    /// Register a peer with the signaling server
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

/// Peer connection
struct PeerConnection {
    /// Peer ID
    peer_id: String,
    /// WebSocket sender
    sender: mpsc::Sender<SignalingMessage>,
    /// Last activity timestamp
    last_activity: Instant,
}

/// Signaling server
pub struct SignalingServer {
    /// Configuration
    config: Config,
    /// Peer connections
    peers: Arc<Mutex<HashMap<String, PeerConnection>>>,
    /// Event sender
    event_sender: mpsc::Sender<SignalingMessage>,
    /// Event receiver
    event_receiver: mpsc::Receiver<SignalingMessage>,
    /// WebRTC manager
    webrtc_manager: Arc<WebRtcManager>,
    /// Circuit relay manager
    circuit_manager: Arc<CircuitRelayManager>,
    /// Authentication middleware
    auth_middleware: Option<AuthMiddleware>,
    /// Rate limiting middleware
    rate_limit_middleware: Option<RateLimitMiddleware>,
    /// Authentication enabled flag
    auth_enabled: bool,
    /// Rate limiting enabled flag
    rate_limit_enabled: bool,
}

impl SignalingServer {
    /// Create a new signaling server
    pub fn new(
        config: Config,
        event_sender: mpsc::Sender<SignalingMessage>,
        event_receiver: mpsc::Receiver<SignalingMessage>,
        webrtc_manager: Arc<WebRtcManager>,
        circuit_manager: Arc<CircuitRelayManager>,
    ) -> Result<Self> {
        // Check if authentication is enabled
        let auth_enabled = std::env::var("DARKSWAP_RELAY_ENABLE_AUTHENTICATION")
            .ok()
            .and_then(|s| s.parse::<bool>().ok())
            .unwrap_or(false);
        
        // Check if rate limiting is enabled
        let rate_limit_enabled = std::env::var("DARKSWAP_RELAY_ENABLE_RATE_LIMITING")
            .ok()
            .and_then(|s| s.parse::<bool>().ok())
            .unwrap_or(false);
        
        // Create authentication middleware if enabled
        let auth_middleware = if auth_enabled {
            let auth_manager = Arc::new(AuthManager::new(config.clone())?);
            Some(AuthMiddleware::new(auth_manager))
        } else {
            None
        };
        
        // Create rate limiting middleware if enabled
        let rate_limit_middleware = if rate_limit_enabled {
            let rate_limit_manager = Arc::new(RateLimitManager::new(config.clone())?);
            Some(RateLimitMiddleware::new(rate_limit_manager))
        } else {
            None
        };
        
        Ok(Self {
            config,
            peers: Arc::new(Mutex::new(HashMap::new())),
            event_sender,
            event_receiver,
            webrtc_manager,
            circuit_manager,
            auth_middleware,
            rate_limit_middleware,
            auth_enabled,
            rate_limit_enabled,
        })
    }
    
    /// Run the signaling server
    pub async fn run(self) -> Result<()> {
        // Create router
        let app = Router::new()
            .route("/signaling", get(Self::websocket_handler))
            .with_state(Arc::new(self));
        
        // Get address
        let addr = self.config.signaling_address().parse::<SocketAddr>()?;
        
        // Start the server
        info!("Starting signaling server on {}", addr);
        
        // Start the WebSocket server
        axum::Server::bind(&addr)
            .serve(app.into_make_service())
            .await?;
        
        Ok(())
    }
    
    /// Handle WebSocket connections
    async fn websocket_handler(
        ws: WebSocketUpgrade,
        State(state): State<Arc<Self>>,
    ) -> impl IntoResponse {
        ws.on_upgrade(|socket| Self::handle_socket(socket, state))
    }
    
    /// Handle a WebSocket connection
    async fn handle_socket(socket: WebSocket, state: Arc<Self>) {
        let (mut sender, mut receiver) = socket.split();
        
        // Create a channel for sending messages to the WebSocket
        let (tx, mut rx) = mpsc::channel::<SignalingMessage>(100);
        
        // Generate a temporary peer ID
        let temp_peer_id = Uuid::new_v4().to_string();
        
        // Apply rate limiting if enabled
        if state.rate_limit_enabled {
            if let Some(rate_limit) = &state.rate_limit_middleware {
                if !rate_limit.allow_connection(&temp_peer_id) {
                    // Send an error message
                    let error_msg = SignalingMessage::Error {
                        message: "Rate limit exceeded for connections".to_string(),
                    };
                    let json = serde_json::to_string(&error_msg).unwrap();
                    let _ = sender.send(Message::Text(json)).await;
                    
                    // Close the connection
                    let _ = sender.send(Message::Close(None)).await;
                    return;
                }
            }
        }
        
        // Spawn a task to forward messages from the channel to the WebSocket
        let mut send_task = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                let json = serde_json::to_string(&msg).unwrap();
                if sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        });
        
        // Generate a temporary peer ID
        let temp_peer_id = Uuid::new_v4().to_string();
        
        // Add the peer to the peers map
        {
            let mut peers = state.peers.lock().unwrap();
            peers.insert(
                temp_peer_id.clone(),
                PeerConnection {
                    peer_id: temp_peer_id.clone(),
                    sender: tx.clone(),
                    last_activity: Instant::now(),
                },
            );
        }
        
        // Process incoming messages
        let mut peer_id = temp_peer_id.clone();
        
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    // Apply rate limiting if enabled
                    if state.rate_limit_enabled {
                        if let Some(rate_limit) = &state.rate_limit_middleware {
                            if !rate_limit.allow_message(&peer_id) {
                                // Send an error message
                                let error_msg = SignalingMessage::Error {
                                    message: "Rate limit exceeded for messages".to_string(),
                                };
                                let _ = tx.send(error_msg).await;
                                continue;
                            }
                        }
                    }
                    
                    // Parse the message
                    let msg: SignalingMessage = match serde_json::from_str(&text) {
                        Ok(msg) => msg,
                        Err(e) => {
                            warn!("Failed to parse signaling message: {}", e);
                            let error_msg = SignalingMessage::Error {
                                message: format!("Failed to parse message: {}", e),
                            };
                            let _ = tx.send(error_msg).await;
                            continue;
                        }
                    };
                    
                    // Process the message
                    match msg {
                        SignalingMessage::Register { peer_id: new_peer_id } => {
                            // Apply authentication if enabled
                            if state.auth_enabled {
                                if let Some(auth) = &state.auth_middleware {
                                    // Extract token from the message
                                    if let Some(token) = crate::auth::AuthManager::extract_token_from_message(&text) {
                                        match auth.authenticate(&token).await {
                                            Ok(_) => {
                                                // Authentication successful
                                                debug!("Authentication successful for peer {}", new_peer_id);
                                            }
                                            Err(e) => {
                                                // Authentication failed
                                                warn!("Authentication failed for peer {}: {}", new_peer_id, e);
                                                let error_msg = SignalingMessage::Error {
                                                    message: format!("Authentication failed: {}", e),
                                                };
                                                let _ = tx.send(error_msg).await;
                                                continue;
                                            }
                                        }
                                    } else {
                                        // No token provided
                                        warn!("No authentication token provided for peer {}", new_peer_id);
                                        let error_msg = SignalingMessage::Error {
                                            message: "Authentication required".to_string(),
                                        };
                                        let _ = tx.send(error_msg).await;
                                        continue;
                                    }
                                }
                            }
                            
                            // Update the peer ID
                            {
                                let mut peers = state.peers.lock().unwrap();
                                if let Some(conn) = peers.remove(&peer_id) {
                                    peers.insert(
                                        new_peer_id.clone(),
                                        PeerConnection {
                                            peer_id: new_peer_id.clone(),
                                            sender: conn.sender,
                                            last_activity: Instant::now(),
                                        },
                                    );
                                }
                            }
                            
                            peer_id = new_peer_id;
                            info!("Peer registered: {}", peer_id);
                        }
                        SignalingMessage::Offer { from, to, sdp } => {
                            // Forward the offer to the target peer
                            if let Some(conn) = state.peers.lock().unwrap().get(&to) {
                                let offer_msg = SignalingMessage::Offer {
                                    from: from.clone(),
                                    to: to.clone(),
                                    sdp: sdp.clone(),
                                };
                                let _ = conn.sender.send(offer_msg).await;
                                debug!("Forwarded offer from {} to {}", from, to);
                            } else {
                                warn!("Peer not found: {}", to);
                                let error_msg = SignalingMessage::Error {
                                    message: format!("Peer not found: {}", to),
                                };
                                let _ = tx.send(error_msg).await;
                            }
                        }
                        SignalingMessage::Answer { from, to, sdp } => {
                            // Forward the answer to the target peer
                            if let Some(conn) = state.peers.lock().unwrap().get(&to) {
                                let answer_msg = SignalingMessage::Answer {
                                    from: from.clone(),
                                    to: to.clone(),
                                    sdp: sdp.clone(),
                                };
                                let _ = conn.sender.send(answer_msg).await;
                                debug!("Forwarded answer from {} to {}", from, to);
                            } else {
                                warn!("Peer not found: {}", to);
                                let error_msg = SignalingMessage::Error {
                                    message: format!("Peer not found: {}", to),
                                };
                                let _ = tx.send(error_msg).await;
                            }
                        }
                        SignalingMessage::IceCandidate { from, to, candidate, sdp_mid, sdp_mline_index } => {
                            // Forward the ICE candidate to the target peer
                            if let Some(conn) = state.peers.lock().unwrap().get(&to) {
                                let ice_msg = SignalingMessage::IceCandidate {
                                    from: from.clone(),
                                    to: to.clone(),
                                    candidate: candidate.clone(),
                                    sdp_mid: sdp_mid.clone(),
                                    sdp_mline_index,
                                };
                                let _ = conn.sender.send(ice_msg).await;
                                debug!("Forwarded ICE candidate from {} to {}", from, to);
                            } else {
                                warn!("Peer not found: {}", to);
                                let error_msg = SignalingMessage::Error {
                                    message: format!("Peer not found: {}", to),
                                };
                                let _ = tx.send(error_msg).await;
                            }
                        }
                        SignalingMessage::RelayRequest { from, to } => {
                            // Create a relay connection
                            match state.circuit_manager.create_circuit(&from, &to).await {
                                Ok(relay_id) => {
                                    // Send the relay response to the requester
                                    let response_msg = SignalingMessage::RelayResponse {
                                        relay_id: relay_id.clone(),
                                        accepted: true,
                                        error: None,
                                    };
                                    let _ = tx.send(response_msg).await;
                                    
                                    // Send the relay request to the target peer
                                    if let Some(conn) = state.peers.lock().unwrap().get(&to) {
                                        let request_msg = SignalingMessage::RelayRequest {
                                            from: from.clone(),
                                            to: to.clone(),
                                        };
                                        let _ = conn.sender.send(request_msg).await;
                                        
                                        // Send the relay response to the target peer
                                        let response_msg = SignalingMessage::RelayResponse {
                                            relay_id,
                                            accepted: true,
                                            error: None,
                                        };
                                        let _ = conn.sender.send(response_msg).await;
                                    }
                                    
                                    debug!("Created relay connection from {} to {}", from, to);
                                }
                                Err(e) => {
                                    warn!("Failed to create relay connection: {}", e);
                                    let error_msg = SignalingMessage::RelayResponse {
                                        relay_id: String::new(),
                                        accepted: false,
                                        error: Some(e.to_string()),
                                    };
                                    let _ = tx.send(error_msg).await;
                                }
                            }
                        }
                        SignalingMessage::DataChannel { peer_id, relay_id, channel } => {
                            // Create a data channel for the relay connection
                            match state.circuit_manager.create_data_channel(&peer_id, &relay_id, &channel).await {
                                Ok(()) => {
                                    debug!("Created data channel {} for relay {}", channel, relay_id);
                                }
                                Err(e) => {
                                    warn!("Failed to create data channel: {}", e);
                                    let error_msg = SignalingMessage::Error {
                                        message: format!("Failed to create data channel: {}", e),
                                    };
                                    let _ = tx.send(error_msg).await;
                                }
                            }
                        }
                        SignalingMessage::RelayData { from, relay_id, data } => {
                            // Apply bandwidth rate limiting if enabled
                            if state.rate_limit_enabled {
                                if let Some(rate_limit) = &state.rate_limit_middleware {
                                    // Get the data size in bytes
                                    let data_size = data.len() as u32;
                                    
                                    if !rate_limit.allow_bandwidth(&from, data_size) {
                                        // Send an error message
                                        let error_msg = SignalingMessage::Error {
                                            message: "Rate limit exceeded for bandwidth".to_string(),
                                        };
                                        let _ = tx.send(error_msg).await;
                                        continue;
                                    }
                                }
                            }
                            
                            // Send data through the relay connection
                            match state.circuit_manager.send_data(&from, &relay_id, &data).await {
                                Ok(()) => {
                                    debug!("Sent data through relay {}", relay_id);
                                }
                                Err(e) => {
                                    warn!("Failed to send data through relay: {}", e);
                                    let error_msg = SignalingMessage::Error {
                                        message: format!("Failed to send data through relay: {}", e),
                                    };
                                    let _ = tx.send(error_msg).await;
                                }
                            }
                        }
                        SignalingMessage::CloseRelay { relay_id } => {
                            // Close the relay connection
                            match state.circuit_manager.close_circuit(&relay_id).await {
                                Ok(()) => {
                                    debug!("Closed relay connection {}", relay_id);
                                }
                                Err(e) => {
                                    warn!("Failed to close relay connection: {}", e);
                                    let error_msg = SignalingMessage::Error {
                                        message: format!("Failed to close relay connection: {}", e),
                                    };
                                    let _ = tx.send(error_msg).await;
                                }
                            }
                        }
                        SignalingMessage::Ping => {
                            // Send a pong message
                            let pong_msg = SignalingMessage::Pong;
                            let _ = tx.send(pong_msg).await;
                        }
                        _ => {
                            warn!("Unhandled signaling message: {:?}", msg);
                        }
                    }
                    
                    // Update the last activity timestamp
                    if let Some(conn) = state.peers.lock().unwrap().get_mut(&peer_id) {
                        conn.last_activity = Instant::now();
                    }
                }
                Message::Binary(_) => {
                    warn!("Received binary message, ignoring");
                }
                Message::Ping(_) => {
                    // Send a pong message
                    let _ = sender.send(Message::Pong(vec![])).await;
                }
                Message::Pong(_) => {
                    // Ignore pong messages
                }
                Message::Close(_) => {
                    break;
                }
            }
        }
        
        // Remove the peer from the peers map
        {
            let mut peers = state.peers.lock().unwrap();
            peers.remove(&peer_id);
        }
        
        // Cancel the send task
        send_task.abort();
        
        info!("Peer disconnected: {}", peer_id);
    }
    
    /// Get the number of connected peers
    pub fn get_peer_count(&self) -> usize {
        self.peers.lock().unwrap().len()
    }
    
    /// Get the list of connected peers
    pub fn get_peers(&self) -> Vec<String> {
        self.peers.lock().unwrap().keys().cloned().collect()
    }
    
    /// Clean up inactive peers
    pub fn cleanup_inactive_peers(&self) {
        let mut peers = self.peers.lock().unwrap();
        let now = Instant::now();
        let timeout = Duration::from_secs(self.config.security.peer_timeout);
        
        peers.retain(|_, conn| {
            now.duration_since(conn.last_activity) < timeout
        });
    }
}