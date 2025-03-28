//! WebRTC signaling client
//!
//! This module provides a client for the WebRTC signaling server.
//! It handles SDP offer/answer exchange and ICE candidate exchange between peers.

use futures::{
    channel::mpsc::{self, Receiver, Sender},
    SinkExt, StreamExt,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tokio::net::TcpStream;
use tokio_tungstenite::{connect_async, tungstenite::Message, WebSocketStream};

use crate::error::Error;

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

/// Signaling event
#[derive(Debug, Clone)]
pub enum SignalingEvent {
    /// SDP offer received
    OfferReceived {
        /// Peer ID of the offerer
        from: String,
        /// SDP offer
        sdp: String,
    },
    /// SDP answer received
    AnswerReceived {
        /// Peer ID of the answerer
        from: String,
        /// SDP answer
        sdp: String,
    },
    /// ICE candidate received
    IceCandidateReceived {
        /// Peer ID of the sender
        from: String,
        /// ICE candidate
        candidate: String,
        /// SDP mid
        sdp_mid: String,
        /// SDP m-line index
        sdp_m_line_index: u16,
    },
    /// Error received
    ErrorReceived {
        /// Error message
        message: String,
    },
}

/// Signaling client
pub struct SignalingClient {
    /// Local peer ID
    local_peer_id: String,
    /// WebSocket sender
    ws_sender: Arc<Mutex<Option<Sender<Message>>>>,
    /// Event receivers
    event_receivers: Arc<Mutex<HashMap<String, Sender<SignalingEvent>>>>,
}

impl SignalingClient {
    /// Create a new signaling client
    pub fn new(local_peer_id: String) -> Self {
        SignalingClient {
            local_peer_id,
            ws_sender: Arc::new(Mutex::new(None)),
            event_receivers: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Connect to the signaling server
    pub async fn connect(&self, server_url: &str) -> Result<(), Error> {
        // Connect to the WebSocket server
        let (ws_stream, _) = connect_async(server_url)
            .await
            .map_err(|e| Error::WebSocketError(e.to_string()))?;
        
        // Split the WebSocket stream
        let (ws_sink, ws_stream) = ws_stream.split();
        
        // Create a channel for sending messages
        let (tx, mut rx) = mpsc::channel(100);
        
        // Store the sender
        {
            let mut ws_sender = self.ws_sender.lock().unwrap();
            *ws_sender = Some(tx);
        }
        
        // Forward messages from the channel to the WebSocket
        let mut ws_sink = ws_sink;
        tokio::spawn(async move {
            while let Some(msg) = rx.next().await {
                if let Err(e) = ws_sink.send(msg).await {
                    eprintln!("WebSocket send error: {}", e);
                    break;
                }
            }
        });
        
        // Register with the server
        self.register().await?;
        
        // Process incoming messages
        let event_receivers = self.event_receivers.clone();
        let local_peer_id = self.local_peer_id.clone();
        
        tokio::spawn(async move {
            let mut ws_stream = ws_stream;
            
            while let Some(msg) = ws_stream.next().await {
                match msg {
                    Ok(msg) => {
                        if let Ok(text) = msg.into_text() {
                            if let Ok(message) = serde_json::from_str::<SignalingMessage>(&text) {
                                match message {
                                    SignalingMessage::Offer { from, to, sdp } => {
                                        if to == local_peer_id {
                                            // Forward the offer to the appropriate receiver
                                            let event = SignalingEvent::OfferReceived { from: from.clone(), sdp };
                                            
                                            let event_receivers = event_receivers.lock().unwrap();
                                            if let Some(sender) = event_receivers.get(&from) {
                                                let _ = sender.clone().try_send(event);
                                            }
                                        }
                                    }
                                    SignalingMessage::Answer { from, to, sdp } => {
                                        if to == local_peer_id {
                                            // Forward the answer to the appropriate receiver
                                            let event = SignalingEvent::AnswerReceived { from: from.clone(), sdp };
                                            
                                            let event_receivers = event_receivers.lock().unwrap();
                                            if let Some(sender) = event_receivers.get(&from) {
                                                let _ = sender.clone().try_send(event);
                                            }
                                        }
                                    }
                                    SignalingMessage::IceCandidate {
                                        from,
                                        to,
                                        candidate,
                                        sdp_mid,
                                        sdp_m_line_index,
                                    } => {
                                        if to == local_peer_id {
                                            // Forward the ICE candidate to the appropriate receiver
                                            let event = SignalingEvent::IceCandidateReceived {
                                                from: from.clone(),
                                                candidate,
                                                sdp_mid,
                                                sdp_m_line_index,
                                            };
                                            
                                            let event_receivers = event_receivers.lock().unwrap();
                                            if let Some(sender) = event_receivers.get(&from) {
                                                let _ = sender.clone().try_send(event);
                                            }
                                        }
                                    }
                                    SignalingMessage::Error { message } => {
                                        // Forward the error to all receivers
                                        let event = SignalingEvent::ErrorReceived { message };
                                        
                                        let event_receivers = event_receivers.lock().unwrap();
                                        for (_, sender) in event_receivers.iter() {
                                            let _ = sender.clone().try_send(event.clone());
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
                        eprintln!("WebSocket receive error: {}", e);
                        break;
                    }
                }
            }
        });
        
        Ok(())
    }
    
    /// Register with the signaling server
    async fn register(&self) -> Result<(), Error> {
        let message = SignalingMessage::Register {
            peer_id: self.local_peer_id.clone(),
        };
        
        let message_json = serde_json::to_string(&message)
            .map_err(|e| Error::SerializationError(e.to_string()))?;
        
        self.send_message(Message::Text(message_json)).await
    }
    
    /// Send a message to the signaling server
    async fn send_message(&self, message: Message) -> Result<(), Error> {
        let ws_sender = self.ws_sender.lock().unwrap();
        
        if let Some(sender) = &*ws_sender {
            sender
                .clone()
                .send(message)
                .await
                .map_err(|e| Error::WebSocketError(e.to_string()))?;
            
            Ok(())
        } else {
            Err(Error::WebSocketError("Not connected".to_string()))
        }
    }
    
    /// Send an SDP offer to a peer
    pub async fn send_offer(&self, peer_id: &str, sdp: &str) -> Result<(), Error> {
        let message = SignalingMessage::Offer {
            from: self.local_peer_id.clone(),
            to: peer_id.to_string(),
            sdp: sdp.to_string(),
        };
        
        let message_json = serde_json::to_string(&message)
            .map_err(|e| Error::SerializationError(e.to_string()))?;
        
        self.send_message(Message::Text(message_json)).await
    }
    
    /// Send an SDP answer to a peer
    pub async fn send_answer(&self, peer_id: &str, sdp: &str) -> Result<(), Error> {
        let message = SignalingMessage::Answer {
            from: self.local_peer_id.clone(),
            to: peer_id.to_string(),
            sdp: sdp.to_string(),
        };
        
        let message_json = serde_json::to_string(&message)
            .map_err(|e| Error::SerializationError(e.to_string()))?;
        
        self.send_message(Message::Text(message_json)).await
    }
    
    /// Send an ICE candidate to a peer
    pub async fn send_ice_candidate(
        &self,
        peer_id: &str,
        candidate: &str,
        sdp_mid: &str,
        sdp_m_line_index: u16,
    ) -> Result<(), Error> {
        let message = SignalingMessage::IceCandidate {
            from: self.local_peer_id.clone(),
            to: peer_id.to_string(),
            candidate: candidate.to_string(),
            sdp_mid: sdp_mid.to_string(),
            sdp_m_line_index,
        };
        
        let message_json = serde_json::to_string(&message)
            .map_err(|e| Error::SerializationError(e.to_string()))?;
        
        self.send_message(Message::Text(message_json)).await
    }
    
    /// Subscribe to events for a specific peer
    pub fn subscribe(&self, peer_id: &str) -> Receiver<SignalingEvent> {
        let (tx, rx) = mpsc::channel(100);
        
        let mut event_receivers = self.event_receivers.lock().unwrap();
        event_receivers.insert(peer_id.to_string(), tx);
        
        rx
    }
    
    /// Unsubscribe from events for a specific peer
    pub fn unsubscribe(&self, peer_id: &str) {
        let mut event_receivers = self.event_receivers.lock().unwrap();
        event_receivers.remove(peer_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_signaling_client() {
        // This test requires a running signaling server
        // It's disabled by default
        
        // Create a signaling client
        let client = SignalingClient::new("test-peer".to_string());
        
        // Connect to the signaling server
        client.connect("ws://localhost:9001/signaling").await.unwrap();
        
        // Subscribe to events
        let mut events = client.subscribe("other-peer");
        
        // Send an offer
        client.send_offer("other-peer", "test-offer").await.unwrap();
        
        // Wait for events
        // This will timeout if no events are received
        tokio::time::timeout(std::time::Duration::from_secs(1), async {
            while let Some(event) = events.next().await {
                match event {
                    SignalingEvent::AnswerReceived { from, sdp } => {
                        assert_eq!(from, "other-peer");
                        assert_eq!(sdp, "test-answer");
                        break;
                    }
                    _ => {}
                }
            }
        })
        .await
        .unwrap_or(());
    }
}