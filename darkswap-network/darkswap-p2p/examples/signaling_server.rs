//! WebRTC signaling server example
//!
//! This example demonstrates how to create a simple WebRTC signaling server
//! for peer-to-peer communication using WebSockets.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{
    accept_async,
    tungstenite::Message,
};
use warp::Filter;

/// Signaling message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
enum SignalingMessage {
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

/// Connected peer
struct ConnectedPeer {
    /// Peer ID
    peer_id: String,
    /// WebSocket sender
    sender: tokio::sync::mpsc::UnboundedSender<Message>,
}

/// Signaling server state
struct SignalingServer {
    /// Connected peers
    peers: HashMap<String, ConnectedPeer>,
}

impl SignalingServer {
    /// Create a new signaling server
    fn new() -> Self {
        SignalingServer {
            peers: HashMap::new(),
        }
    }
    
    /// Register a peer
    fn register_peer(&mut self, peer_id: String, sender: tokio::sync::mpsc::UnboundedSender<Message>) {
        println!("Registering peer: {}", peer_id);
        
        self.peers.insert(
            peer_id.clone(),
            ConnectedPeer {
                peer_id,
                sender,
            },
        );
    }
    
    /// Unregister a peer
    fn unregister_peer(&mut self, peer_id: &str) {
        println!("Unregistering peer: {}", peer_id);
        
        self.peers.remove(peer_id);
    }
    
    /// Forward a message to a peer
    fn forward_message(&self, to: &str, message: &SignalingMessage) -> Result<(), String> {
        if let Some(peer) = self.peers.get(to) {
            let message_json = serde_json::to_string(message)
                .map_err(|e| format!("Failed to serialize message: {}", e))?;
            
            peer.sender.send(Message::Text(message_json))
                .map_err(|e| format!("Failed to send message: {}", e))?;
            
            Ok(())
        } else {
            Err(format!("Peer not found: {}", to))
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    // Create the signaling server
    let server = Arc::new(Mutex::new(SignalingServer::new()));
    
    // Create a TCP listener
    let addr = "127.0.0.1:9001".parse::<SocketAddr>()?;
    let listener = TcpListener::bind(&addr).await?;
    
    println!("Signaling server listening on: {}", addr);
    
    // Accept connections
    while let Ok((stream, _)) = listener.accept().await {
        // Clone the server for the connection handler
        let server = server.clone();
        
        // Handle the connection
        tokio::spawn(async move {
            if let Err(e) = handle_connection(server, stream).await {
                eprintln!("Error handling connection: {}", e);
            }
        });
    }
    
    Ok(())
}

/// Handle a WebSocket connection
async fn handle_connection(
    server: Arc<Mutex<SignalingServer>>,
    stream: TcpStream,
) -> Result<(), Box<dyn std::error::Error>> {
    // Accept the WebSocket connection
    let ws_stream = accept_async(stream).await?;
    println!("WebSocket connection established");
    
    // Split the WebSocket stream
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    
    // Create a channel for sending messages to the WebSocket
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
    
    // Peer ID (will be set when the peer registers)
    let mut peer_id = None;
    
    // Forward messages from the channel to the WebSocket
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Err(e) = ws_sender.send(msg).await {
                eprintln!("WebSocket send error: {}", e);
                break;
            }
        }
    });
    
    // Process incoming messages
    while let Some(msg) = ws_receiver.next().await {
        match msg {
            Ok(msg) => {
                if let Message::Text(text) = msg {
                    // Parse the message
                    match serde_json::from_str::<SignalingMessage>(&text) {
                        Ok(message) => {
                            match message {
                                SignalingMessage::Register { peer_id: id } => {
                                    // Register the peer
                                    let mut server = server.lock().unwrap();
                                    server.register_peer(id.clone(), tx.clone());
                                    peer_id = Some(id);
                                }
                                SignalingMessage::Offer { from, to, sdp } => {
                                    // Forward the offer to the target peer
                                    let server = server.lock().unwrap();
                                    
                                    match server.forward_message(&to, &message) {
                                        Ok(_) => {
                                            println!("Forwarded offer from {} to {}", from, to);
                                        }
                                        Err(e) => {
                                            eprintln!("Failed to forward offer: {}", e);
                                            
                                            // Send an error message back to the sender
                                            let error_message = SignalingMessage::Error {
                                                message: e,
                                            };
                                            
                                            let error_json = serde_json::to_string(&error_message)?;
                                            tx.send(Message::Text(error_json))?;
                                        }
                                    }
                                }
                                SignalingMessage::Answer { from, to, sdp } => {
                                    // Forward the answer to the target peer
                                    let server = server.lock().unwrap();
                                    
                                    match server.forward_message(&to, &message) {
                                        Ok(_) => {
                                            println!("Forwarded answer from {} to {}", from, to);
                                        }
                                        Err(e) => {
                                            eprintln!("Failed to forward answer: {}", e);
                                            
                                            // Send an error message back to the sender
                                            let error_message = SignalingMessage::Error {
                                                message: e,
                                            };
                                            
                                            let error_json = serde_json::to_string(&error_message)?;
                                            tx.send(Message::Text(error_json))?;
                                        }
                                    }
                                }
                                SignalingMessage::IceCandidate { from, to, candidate, sdp_mid, sdp_m_line_index } => {
                                    // Forward the ICE candidate to the target peer
                                    let server = server.lock().unwrap();
                                    
                                    match server.forward_message(&to, &message) {
                                        Ok(_) => {
                                            println!("Forwarded ICE candidate from {} to {}", from, to);
                                        }
                                        Err(e) => {
                                            eprintln!("Failed to forward ICE candidate: {}", e);
                                            
                                            // Send an error message back to the sender
                                            let error_message = SignalingMessage::Error {
                                                message: e,
                                            };
                                            
                                            let error_json = serde_json::to_string(&error_message)?;
                                            tx.send(Message::Text(error_json))?;
                                        }
                                    }
                                }
                                _ => {
                                    // Ignore other messages
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to parse message: {}", e);
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("WebSocket receive error: {}", e);
                break;
            }
        }
    }
    
    // Unregister the peer when the connection is closed
    if let Some(id) = peer_id {
        let mut server = server.lock().unwrap();
        server.unregister_peer(&id);
    }
    
    Ok(())
}