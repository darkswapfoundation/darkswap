//! Circuit relay implementation for the DarkSwap Relay Server
//!
//! This module provides a circuit relay implementation for the DarkSwap P2P network.
//! It allows peers to connect to each other through a relay when direct connection is not possible.

use crate::{
    config::Config,
    error::Error,
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

/// Circuit ID
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct CircuitId(String);

impl CircuitId {
    /// Create a new circuit ID
    pub fn new() -> Self {
        Self(Uuid::new_v4().to_string())
    }
    
    /// Get the circuit ID as a string
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for CircuitId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl From<&str> for CircuitId {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}

impl std::fmt::Display for CircuitId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Circuit state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CircuitState {
    /// Pending
    Pending,
    /// Active
    Active,
    /// Closed
    Closed,
}

/// Circuit reservation
#[derive(Debug)]
struct CircuitReservation {
    /// Circuit ID
    id: CircuitId,
    /// Source peer ID
    src: String,
    /// Destination peer ID
    dst: String,
    /// Creation time
    created_at: Instant,
    /// Expiration time
    expires_at: Instant,
}

/// Circuit
#[derive(Debug)]
struct Circuit {
    /// Circuit ID
    id: CircuitId,
    /// Source peer ID
    src: String,
    /// Destination peer ID
    dst: String,
    /// Creation time
    created_at: Instant,
    /// Expiration time
    expires_at: Instant,
    /// State
    state: CircuitState,
    /// Bytes sent
    bytes_sent: u64,
    /// Bytes received
    bytes_received: u64,
    /// Last activity time
    last_activity: Instant,
    /// Data channels
    data_channels: HashMap<String, DataChannel>,
}

/// Data channel
#[derive(Debug)]
struct DataChannel {
    /// Channel name
    name: String,
    /// Creation time
    created_at: Instant,
    /// Bytes sent
    bytes_sent: u64,
    /// Bytes received
    bytes_received: u64,
    /// Last activity time
    last_activity: Instant,
}

/// Circuit relay event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CircuitRelayEvent {
    /// Circuit created
    CircuitCreated {
        /// Circuit ID
        id: String,
        /// Source peer ID
        src: String,
        /// Destination peer ID
        dst: String,
    },
    /// Circuit closed
    CircuitClosed {
        /// Circuit ID
        id: String,
    },
    /// Data received
    DataReceived {
        /// Circuit ID
        id: String,
        /// Source peer ID
        src: String,
        /// Data (base64 encoded)
        data: String,
    },
    /// Data channel created
    DataChannelCreated {
        /// Circuit ID
        id: String,
        /// Peer ID
        peer_id: String,
        /// Channel name
        channel: String,
    },
    /// Data channel closed
    DataChannelClosed {
        /// Circuit ID
        id: String,
        /// Channel name
        channel: String,
    },
}

/// Circuit relay manager
pub struct CircuitRelayManager {
    /// Configuration
    config: Config,
    /// Reservations
    reservations: Arc<DashMap<CircuitId, CircuitReservation>>,
    /// Circuits
    circuits: Arc<DashMap<CircuitId, Circuit>>,
    /// Peer circuits
    peer_circuits: Arc<DashMap<String, Vec<CircuitId>>>,
    /// Event sender
    event_sender: mpsc::Sender<CircuitRelayEvent>,
    /// Event receiver
    event_receiver: mpsc::Receiver<CircuitRelayEvent>,
    /// WebRTC event sender
    webrtc_sender: mpsc::Sender<crate::webrtc::WebRtcTransportEvent>,
    /// WebRTC event receiver
    webrtc_receiver: mpsc::Receiver<crate::webrtc::WebRtcTransportEvent>,
}

impl CircuitRelayManager {
    /// Create a new circuit relay manager
    pub fn new(
        config: Config,
        event_sender: mpsc::Sender<CircuitRelayEvent>,
        webrtc_receiver: mpsc::Receiver<crate::webrtc::WebRtcTransportEvent>,
    ) -> Result<Self> {
        let (tx, rx) = mpsc::channel(100);
        
        Ok(Self {
            config,
            reservations: Arc::new(DashMap::new()),
            circuits: Arc::new(DashMap::new()),
            peer_circuits: Arc::new(DashMap::new()),
            event_sender,
            event_receiver: rx,
            webrtc_sender: tx,
            webrtc_receiver,
        })
    }
    
    /// Run the circuit relay manager
    pub async fn run(&mut self) -> Result<()> {
        // Spawn a task to clean up expired reservations
        let reservations = self.reservations.clone();
        let reservation_cleanup_interval = self.config.reservation_cleanup_interval();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(reservation_cleanup_interval);
            
            loop {
                interval.tick().await;
                
                // Get the current time
                let now = Instant::now();
                
                // Find expired reservations
                let expired_reservations: Vec<CircuitId> = reservations
                    .iter()
                    .filter_map(|entry| {
                        if entry.expires_at <= now {
                            Some(entry.id.clone())
                        } else {
                            None
                        }
                    })
                    .collect();
                
                // Remove expired reservations
                for id in expired_reservations {
                    reservations.remove(&id);
                    debug!("Removed expired reservation: {}", id);
                }
            }
        });
        
        // Spawn a task to clean up expired circuits
        let circuits = self.circuits.clone();
        let peer_circuits = self.peer_circuits.clone();
        let circuit_cleanup_interval = self.config.circuit_cleanup_interval();
        let max_circuit_duration = self.config.max_circuit_duration();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(circuit_cleanup_interval);
            
            loop {
                interval.tick().await;
                
                // Get the current time
                let now = Instant::now();
                
                // Find expired circuits
                let expired_circuits: Vec<(CircuitId, String, String)> = circuits
                    .iter()
                    .filter_map(|entry| {
                        if entry.expires_at <= now || entry.state == CircuitState::Closed {
                            Some((entry.id.clone(), entry.src.clone(), entry.dst.clone()))
                        } else {
                            None
                        }
                    })
                    .collect();
                
                // Remove expired circuits
                for (id, src, dst) in expired_circuits {
                    circuits.remove(&id);
                    
                    // Remove the circuit from the peer circuits
                    if let Some(mut peer_circuits_entry) = peer_circuits.get_mut(&src) {
                        peer_circuits_entry.retain(|circuit_id| circuit_id != &id);
                        
                        // If there are no more circuits for this peer, remove the peer
                        if peer_circuits_entry.is_empty() {
                            peer_circuits.remove(&src);
                        }
                    }
                    
                    if let Some(mut peer_circuits_entry) = peer_circuits.get_mut(&dst) {
                        peer_circuits_entry.retain(|circuit_id| circuit_id != &id);
                        
                        // If there are no more circuits for this peer, remove the peer
                        if peer_circuits_entry.is_empty() {
                            peer_circuits.remove(&dst);
                        }
                    }
                    
                    debug!("Removed expired circuit: {}", id);
                }
            }
        });
        
        // Process events
        loop {
            tokio::select! {
                Some(event) = self.event_receiver.recv() => {
                    match event {
                        CircuitRelayEvent::CircuitCreated { id, src, dst } => {
                            // Create a new circuit
                            let circuit_id = CircuitId::from(id);
                            
                            // Check if the circuit already exists
                            if self.circuits.contains_key(&circuit_id) {
                                warn!("Circuit already exists: {}", circuit_id);
                                continue;
                            }
                            
                            // Check if the reservation exists
                            if let Some(reservation) = self.reservations.get(&circuit_id) {
                                // Check if the source and destination match
                                if reservation.src != src || reservation.dst != dst {
                                    warn!("Circuit source or destination mismatch: {}", circuit_id);
                                    continue;
                                }
                                
                                // Create the circuit
                                let now = Instant::now();
                                let circuit = Circuit {
                                    id: circuit_id.clone(),
                                    src: src.clone(),
                                    dst: dst.clone(),
                                    created_at: now,
                                    expires_at: now + max_circuit_duration,
                                    state: CircuitState::Active,
                                    bytes_sent: 0,
                                    bytes_received: 0,
                                    last_activity: now,
                                    data_channels: HashMap::new(),
                                };
                                
                                // Add the circuit
                                self.circuits.insert(circuit_id.clone(), circuit);
                                
                                // Add the circuit to the peer circuits
                                self.peer_circuits
                                    .entry(src.clone())
                                    .or_insert_with(Vec::new)
                                    .push(circuit_id.clone());
                                
                                self.peer_circuits
                                    .entry(dst.clone())
                                    .or_insert_with(Vec::new)
                                    .push(circuit_id.clone());
                                
                                // Remove the reservation
                                self.reservations.remove(&circuit_id);
                                
                                info!("Created circuit: {} from {} to {}", circuit_id, src, dst);
                            } else {
                                warn!("Circuit reservation not found: {}", circuit_id);
                            }
                        }
                        CircuitRelayEvent::CircuitClosed { id } => {
                            // Close the circuit
                            let circuit_id = CircuitId::from(id);
                            
                            if let Some(mut circuit) = self.circuits.get_mut(&circuit_id) {
                                circuit.state = CircuitState::Closed;
                                info!("Closed circuit: {}", circuit_id);
                            } else {
                                warn!("Circuit not found: {}", circuit_id);
                            }
                        }
                        CircuitRelayEvent::DataReceived { id, src, data } => {
                            // Forward the data to the destination
                            let circuit_id = CircuitId::from(id);
                            
                            if let Some(mut circuit) = self.circuits.get_mut(&circuit_id) {
                                // Check if the circuit is active
                                if circuit.state != CircuitState::Active {
                                    warn!("Circuit not active: {}", circuit_id);
                                    continue;
                                }
                                
                                // Check if the source is valid
                                if circuit.src != src && circuit.dst != src {
                                    warn!("Invalid source for circuit: {}", circuit_id);
                                    continue;
                                }
                                
                                // Decode the data
                                let data_bytes = match base64::decode(&data) {
                                    Ok(bytes) => bytes,
                                    Err(e) => {
                                        warn!("Failed to decode data: {}", e);
                                        continue;
                                    }
                                };
                                
                                // Check if the data exceeds the maximum circuit bytes
                                if circuit.bytes_sent + data_bytes.len() as u64 > self.config.relay.max_circuit_bytes {
                                    warn!("Circuit byte limit exceeded: {}", circuit_id);
                                    circuit.state = CircuitState::Closed;
                                    continue;
                                }
                                
                                // Update the circuit stats
                                circuit.bytes_sent += data_bytes.len() as u64;
                                circuit.last_activity = Instant::now();
                                
                                // Determine the destination
                                let dst = if circuit.src == src {
                                    circuit.dst.clone()
                                } else {
                                    circuit.src.clone()
                                };
                                
                                // Forward the data to the destination
                                let event = CircuitRelayEvent::DataReceived {
                                    id: circuit_id.to_string(),
                                    src,
                                    data,
                                };
                                
                                if let Err(e) = self.event_sender.send(event).await {
                                    error!("Failed to forward data: {}", e);
                                }
                                
                                debug!("Forwarded data for circuit: {}", circuit_id);
                            } else {
                                warn!("Circuit not found: {}", circuit_id);
                            }
                        }
                        CircuitRelayEvent::DataChannelCreated { id, peer_id, channel } => {
                            // Create a data channel for the circuit
                            let circuit_id = CircuitId::from(id);
                            
                            if let Some(mut circuit) = self.circuits.get_mut(&circuit_id) {
                                // Check if the circuit is active
                                if circuit.state != CircuitState::Active {
                                    warn!("Circuit not active: {}", circuit_id);
                                    continue;
                                }
                                
                                // Check if the peer is valid
                                if circuit.src != peer_id && circuit.dst != peer_id {
                                    warn!("Invalid peer for circuit: {}", circuit_id);
                                    continue;
                                }
                                
                                // Create the data channel
                                let now = Instant::now();
                                let data_channel = DataChannel {
                                    name: channel.clone(),
                                    created_at: now,
                                    bytes_sent: 0,
                                    bytes_received: 0,
                                    last_activity: now,
                                };
                                
                                // Add the data channel
                                circuit.data_channels.insert(channel.clone(), data_channel);
                                
                                info!("Created data channel {} for circuit: {}", channel, circuit_id);
                            } else {
                                warn!("Circuit not found: {}", circuit_id);
                            }
                        }
                        CircuitRelayEvent::DataChannelClosed { id, channel } => {
                            // Close the data channel
                            let circuit_id = CircuitId::from(id);
                            
                            if let Some(mut circuit) = self.circuits.get_mut(&circuit_id) {
                                // Remove the data channel
                                circuit.data_channels.remove(&channel);
                                
                                info!("Closed data channel {} for circuit: {}", channel, circuit_id);
                            } else {
                                warn!("Circuit not found: {}", circuit_id);
                            }
                        }
                    }
                }
                Some(event) = self.webrtc_receiver.recv() => {
                    // Process WebRTC events
                    debug!("Received WebRTC event: {:?}", event);
                }
                else => {
                    // All channels closed
                    break;
                }
            }
        }
        
        Ok(())
    }
    
    /// Create a circuit
    pub async fn create_circuit(&self, src: &str, dst: &str) -> Result<String> {
        // Check if the source peer has reached the maximum number of circuits
        let src_circuits = self.peer_circuits.get(src).map(|circuits| circuits.len()).unwrap_or(0);
        if src_circuits >= self.config.max_circuits_per_peer() {
            return Err(Error::CircuitLimitExceeded(format!(
                "Source peer {} has reached the maximum number of circuits",
                src
            )));
        }
        
        // Check if the destination peer has reached the maximum number of circuits
        let dst_circuits = self.peer_circuits.get(dst).map(|circuits| circuits.len()).unwrap_or(0);
        if dst_circuits >= self.config.max_circuits_per_peer() {
            return Err(Error::CircuitLimitExceeded(format!(
                "Destination peer {} has reached the maximum number of circuits",
                dst
            )));
        }
        
        // Create a new circuit ID
        let circuit_id = CircuitId::new();
        
        // Create a reservation
        let now = Instant::now();
        let reservation = CircuitReservation {
            id: circuit_id.clone(),
            src: src.to_string(),
            dst: dst.to_string(),
            created_at: now,
            expires_at: now + self.config.reservation_duration(),
        };
        
        // Add the reservation
        self.reservations.insert(circuit_id.clone(), reservation);
        
        // Send a circuit created event
        let event = CircuitRelayEvent::CircuitCreated {
            id: circuit_id.to_string(),
            src: src.to_string(),
            dst: dst.to_string(),
        };
        
        self.event_sender.send(event).await?;
        
        Ok(circuit_id.to_string())
    }
    
    /// Close a circuit
    pub async fn close_circuit(&self, id: &str) -> Result<()> {
        let circuit_id = CircuitId::from(id);
        
        // Check if the circuit exists
        if !self.circuits.contains_key(&circuit_id) {
            return Err(Error::CircuitRelay(format!("Circuit not found: {}", id)));
        }
        
        // Send a circuit closed event
        let event = CircuitRelayEvent::CircuitClosed {
            id: id.to_string(),
        };
        
        self.event_sender.send(event).await?;
        
        Ok(())
    }
    
    /// Create a data channel for a circuit
    pub async fn create_data_channel(&self, peer_id: &str, id: &str, channel: &str) -> Result<()> {
        let circuit_id = CircuitId::from(id);
        
        // Check if the circuit exists
        if !self.circuits.contains_key(&circuit_id) {
            return Err(Error::CircuitRelay(format!("Circuit not found: {}", id)));
        }
        
        // Send a data channel created event
        let event = CircuitRelayEvent::DataChannelCreated {
            id: id.to_string(),
            peer_id: peer_id.to_string(),
            channel: channel.to_string(),
        };
        
        self.event_sender.send(event).await?;
        
        Ok(())
    }
    
    /// Send data through a circuit
    pub async fn send_data(&self, src: &str, id: &str, data: &str) -> Result<()> {
        let circuit_id = CircuitId::from(id);
        
        // Check if the circuit exists
        if !self.circuits.contains_key(&circuit_id) {
            return Err(Error::CircuitRelay(format!("Circuit not found: {}", id)));
        }
        
        // Send a data received event
        let event = CircuitRelayEvent::DataReceived {
            id: id.to_string(),
            src: src.to_string(),
            data: data.to_string(),
        };
        
        self.event_sender.send(event).await?;
        
        Ok(())
    }
    
    /// Get metrics
    pub fn get_metrics(&self) -> (usize, usize, usize) {
        (
            self.circuits.len(),
            self.reservations.len(),
            self.peer_circuits.len(),
        )
    }
}
