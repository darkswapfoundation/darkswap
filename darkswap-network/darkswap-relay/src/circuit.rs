//! Circuit relay implementation for the DarkSwap Relay Server
//!
//! This module implements the circuit relay protocol, which allows peers
//! to connect to each other even when they are behind NATs.

use crate::{
    config::Config,
    error::Error,
    signaling::SignalingMessage,
    Result,
};
use dashmap::DashMap;
use futures::StreamExt;
use std::{sync::Arc, time::Duration};
use tokio::{
    sync::mpsc::{Receiver, Sender},
    time::timeout,
};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

/// Circuit relay connection
#[derive(Debug)]
struct CircuitRelayConnection {
    /// Relay ID
    relay_id: String,
    
    /// Source peer ID
    source_peer_id: String,
    
    /// Target peer ID
    target_peer_id: String,
    
    /// Created timestamp
    created_at: std::time::Instant,
    
    /// Last activity timestamp
    last_activity: std::time::Instant,
    
    /// Data channel for the source peer
    source_channel: Option<String>,
    
    /// Data channel for the target peer
    target_channel: Option<String>,
}

/// Circuit relay manager
pub struct CircuitRelayManager {
    /// Configuration
    config: Config,
    
    /// Sender for circuit relay messages
    circuit_tx: Sender<SignalingMessage>,
    
    /// Receiver for WebRTC messages
    webrtc_rx: Receiver<SignalingMessage>,
    
    /// Active relays
    relays: Arc<DashMap<String, CircuitRelayConnection>>,
    
    /// Peer connections
    peers: Arc<DashMap<String, Vec<String>>>,
}

impl CircuitRelayManager {
    /// Create a new circuit relay manager
    pub fn new(
        config: Config,
        circuit_tx: Sender<SignalingMessage>,
        webrtc_rx: Receiver<SignalingMessage>,
    ) -> Result<Self> {
        Ok(Self {
            config,
            circuit_tx,
            webrtc_rx,
            relays: Arc::new(DashMap::new()),
            peers: Arc::new(DashMap::new()),
        })
    }
    
    /// Run the circuit relay manager
    pub async fn run(&mut self) -> Result<()> {
        info!("Starting circuit relay manager");
        
        // Spawn a task to clean up expired relays
        let relays = self.relays.clone();
        let peer_timeout = self.config.peer_timeout();
        tokio::spawn(async move {
            loop {
                // Sleep for a while
                tokio::time::sleep(Duration::from_secs(10)).await;
                
                // Get the current time
                let now = std::time::Instant::now();
                
                // Find expired relays
                let expired_relays: Vec<String> = relays
                    .iter()
                    .filter_map(|relay| {
                        if now.duration_since(relay.last_activity) > peer_timeout {
                            Some(relay.relay_id.clone())
                        } else {
                            None
                        }
                    })
                    .collect();
                
                // Remove expired relays
                for relay_id in expired_relays {
                    info!("Removing expired relay {}", relay_id);
                    relays.remove(&relay_id);
                }
            }
        });
        
        // Process incoming messages
        while let Some(message) = self.webrtc_rx.recv().await {
            match message {
                SignalingMessage::RelayRequest { from, to } => {
                    // Create a relay
                    match self.create_relay(&from, &to).await {
                        Ok(relay_id) => {
                            // Send a relay response to the requester
                            let response = SignalingMessage::RelayResponse {
                                from: to.clone(),
                                to: from.clone(),
                                accepted: true,
                                relay_id: Some(relay_id),
                            };
                            
                            if let Err(e) = self.circuit_tx.send(response).await {
                                error!("Failed to send relay response: {}", e);
                            }
                        }
                        Err(e) => {
                            // Send an error message
                            let error = SignalingMessage::Error {
                                message: format!("Failed to create relay: {}", e),
                            };
                            
                            if let Err(e) = self.circuit_tx.send(error).await {
                                error!("Failed to send error message: {}", e);
                            }
                        }
                    }
                }
                _ => {
                    // Ignore other messages
                }
            }
        }
        
        Ok(())
    }
    
    /// Create a new relay
    pub async fn create_relay(&self, source_peer_id: &str, target_peer_id: &str) -> Result<String> {
        // Generate a relay ID
        let relay_id = Uuid::new_v4().to_string();
        
        // Create a relay connection
        let relay = CircuitRelayConnection {
            relay_id: relay_id.clone(),
            source_peer_id: source_peer_id.to_string(),
            target_peer_id: target_peer_id.to_string(),
            created_at: std::time::Instant::now(),
            last_activity: std::time::Instant::now(),
            source_channel: None,
            target_channel: None,
        };
        
        // Store the relay
        self.relays.insert(relay_id.clone(), relay);
        
        // Add the relay to the peer connections
        self.add_peer_connection(source_peer_id, &relay_id);
        self.add_peer_connection(target_peer_id, &relay_id);
        
        info!("Created relay {} from {} to {}", relay_id, source_peer_id, target_peer_id);
        
        Ok(relay_id)
    }
    
    /// Add a relay to a peer's connections
    fn add_peer_connection(&self, peer_id: &str, relay_id: &str) {
        // Get or create the peer's connections
        let mut connections = self.peers
            .entry(peer_id.to_string())
            .or_insert_with(Vec::new);
        
        // Add the relay ID
        connections.push(relay_id.to_string());
    }
    
    /// Remove a relay from a peer's connections
    fn remove_peer_connection(&self, peer_id: &str, relay_id: &str) {
        // Get the peer's connections
        if let Some(mut connections) = self.peers.get_mut(peer_id) {
            // Remove the relay ID
            connections.retain(|id| id != relay_id);
        }
    }
    
    /// Handle a peer connection
    pub fn peer_connected(&self, peer_id: &str) -> Result<()> {
        // Create an entry for the peer
        self.peers.entry(peer_id.to_string()).or_insert_with(Vec::new);
        
        info!("Peer {} connected to circuit relay", peer_id);
        
        Ok(())
    }
    
    /// Handle a peer disconnection
    pub fn peer_disconnected(&self, peer_id: &str) -> Result<()> {
        // Get the peer's connections
        if let Some(connections) = self.peers.get(peer_id) {
            // Clone the connections
            let connections = connections.clone();
            
            // Remove the peer
            self.peers.remove(peer_id);
            
            // Remove all relays for the peer
            for relay_id in connections {
                if let Some(mut relay) = self.relays.get_mut(&relay_id) {
                    // Check if the peer is the source or target
                    if relay.source_peer_id == peer_id {
                        // Remove the source channel
                        relay.source_channel = None;
                        
                        // Check if the target channel is also gone
                        if relay.target_channel.is_none() {
                            // Remove the relay
                            self.relays.remove(&relay_id);
                        }
                    } else if relay.target_peer_id == peer_id {
                        // Remove the target channel
                        relay.target_channel = None;
                        
                        // Check if the source channel is also gone
                        if relay.source_channel.is_none() {
                            // Remove the relay
                            self.relays.remove(&relay_id);
                        }
                    }
                }
            }
        }
        
        info!("Peer {} disconnected from circuit relay", peer_id);
        
        Ok(())
    }
    
    /// Set the data channel for a relay
    pub fn set_data_channel(&self, relay_id: &str, peer_id: &str, channel: &str) -> Result<()> {
        // Get the relay
        if let Some(mut relay) = self.relays.get_mut(relay_id) {
            // Check if the peer is the source or target
            if relay.source_peer_id == peer_id {
                // Set the source channel
                relay.source_channel = Some(channel.to_string());
            } else if relay.target_peer_id == peer_id {
                // Set the target channel
                relay.target_channel = Some(channel.to_string());
            } else {
                return Err(Error::PeerNotFound(peer_id.to_string()));
            }
            
            // Update the last activity timestamp
            relay.last_activity = std::time::Instant::now();
            
            Ok(())
        } else {
            Err(Error::ConnectionNotFound(relay_id.to_string()))
        }
    }
    
    /// Relay data from one peer to another
    pub async fn relay_data(&self, relay_id: &str, from_peer_id: &str, data: &[u8]) -> Result<()> {
        // Get the relay
        if let Some(mut relay) = self.relays.get_mut(relay_id) {
            // Update the last activity timestamp
            relay.last_activity = std::time::Instant::now();
            
            // Check if the peer is the source or target
            if relay.source_peer_id == from_peer_id {
                // Check if the target channel is set
                if let Some(channel) = &relay.target_channel {
                    // Relay the data to the target
                    // This would normally involve sending the data through the WebRTC data channel
                    // but for now we'll just log it
                    debug!("Relaying {} bytes from {} to {} via {}", data.len(), from_peer_id, relay.target_peer_id, relay_id);
                    Ok(())
                } else {
                    Err(Error::ConnectionNotFound(format!("Target channel for relay {}", relay_id)))
                }
            } else if relay.target_peer_id == from_peer_id {
                // Check if the source channel is set
                if let Some(channel) = &relay.source_channel {
                    // Relay the data to the source
                    // This would normally involve sending the data through the WebRTC data channel
                    // but for now we'll just log it
                    debug!("Relaying {} bytes from {} to {} via {}", data.len(), from_peer_id, relay.source_peer_id, relay_id);
                    Ok(())
                } else {
                    Err(Error::ConnectionNotFound(format!("Source channel for relay {}", relay_id)))
                }
            } else {
                Err(Error::PeerNotFound(from_peer_id.to_string()))
            }
        } else {
            Err(Error::ConnectionNotFound(relay_id.to_string()))
        }
    }
}