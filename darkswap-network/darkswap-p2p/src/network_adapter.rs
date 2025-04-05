//! Network adapter for the DarkSwap bridge.
//!
//! This module provides an adapter between the bridge and the P2P networking functionality.

use crate::{P2PError, P2PManager, P2PMessage};
use anyhow::Result;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;

/// Message types for network operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessage {
    /// Connect to a peer.
    Connect {
        /// The address of the peer.
        address: String,
    },

    /// Disconnect from a peer.
    Disconnect {
        /// The address of the peer.
        address: String,
    },

    /// Send a message to a peer.
    SendMessage {
        /// The address of the peer.
        address: String,
        /// The message to send.
        message: Vec<u8>,
    },

    /// Broadcast a message to all peers.
    BroadcastMessage {
        /// The message to broadcast.
        message: Vec<u8>,
    },

    /// Get the list of connected peers.
    GetPeers,

    /// Response to a network message.
    Response {
        /// The request ID.
        request_id: String,
        /// The response data.
        data: NetworkResponseData,
    },
}

/// Response data for network messages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkResponseData {
    /// Success response.
    Success,

    /// Error response.
    Error(String),

    /// Peers response.
    Peers(Vec<String>),

    /// Message response.
    Message {
        /// The address of the peer.
        address: String,
        /// The message.
        message: Vec<u8>,
    },
}

/// Network adapter for the DarkSwap bridge.
pub struct NetworkAdapter {
    /// The P2P manager.
    p2p_manager: Arc<Mutex<P2PManager>>,
    /// The Tokio runtime.
    runtime: Runtime,
}

impl NetworkAdapter {
    /// Create a new network adapter.
    pub fn new() -> Result<Self, P2PError> {
        // Create a Tokio runtime
        let runtime = Runtime::new().map_err(|e| P2PError::Other(format!("Failed to create runtime: {}", e)))?;

        // Create a P2P manager
        let p2p_manager = runtime.block_on(async {
            P2PManager::new().await
        })?;

        Ok(Self {
            p2p_manager: Arc::new(Mutex::new(p2p_manager)),
            runtime,
        })
    }

    /// Start the network adapter.
    pub fn start(&self) -> Result<(), P2PError> {
        // Clone the P2P manager
        let p2p_manager = self.p2p_manager.clone();

        // Start the P2P manager in a separate thread
        self.runtime.spawn(async move {
            let mut manager = p2p_manager.lock().unwrap();
            if let Err(e) = manager.start().await {
                error!("P2P manager error: {}", e);
            }
        });

        Ok(())
    }

    /// Handle a network message.
    pub fn handle_message(&self, message: NetworkMessage) -> Result<Option<NetworkMessage>, P2PError> {
        match message {
            NetworkMessage::Connect { address } => {
                info!("Connecting to peer: {}", address);
                let result = self.runtime.block_on(async {
                    let mut manager = self.p2p_manager.lock().unwrap();
                    manager.connect(&address).await
                });

                match result {
                    Ok(_) => {
                        let response = NetworkMessage::Response {
                            request_id: "connect".to_string(),
                            data: NetworkResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = NetworkMessage::Response {
                            request_id: "connect".to_string(),
                            data: NetworkResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            NetworkMessage::Disconnect { address } => {
                info!("Disconnecting from peer: {}", address);
                let result = self.runtime.block_on(async {
                    let mut manager = self.p2p_manager.lock().unwrap();
                    manager.disconnect(&address).await
                });

                match result {
                    Ok(_) => {
                        let response = NetworkMessage::Response {
                            request_id: "disconnect".to_string(),
                            data: NetworkResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = NetworkMessage::Response {
                            request_id: "disconnect".to_string(),
                            data: NetworkResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            NetworkMessage::SendMessage { address, message } => {
                info!("Sending message to peer: {}", address);
                // Convert the message to a P2PMessage
                let p2p_message = match serde_json::from_slice::<P2PMessage>(&message) {
                    Ok(msg) => msg,
                    Err(e) => {
                        let response = NetworkMessage::Response {
                            request_id: "send_message".to_string(),
                            data: NetworkResponseData::Error(format!("Failed to deserialize message: {}", e)),
                        };
                        return Ok(Some(response));
                    }
                };

                let result = self.runtime.block_on(async {
                    let manager = self.p2p_manager.lock().unwrap();
                    manager.send_message(p2p_message, Some(&address)).await
                });

                match result {
                    Ok(_) => {
                        let response = NetworkMessage::Response {
                            request_id: "send_message".to_string(),
                            data: NetworkResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = NetworkMessage::Response {
                            request_id: "send_message".to_string(),
                            data: NetworkResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            NetworkMessage::BroadcastMessage { message } => {
                info!("Broadcasting message to all peers");
                // Convert the message to a P2PMessage
                let p2p_message = match serde_json::from_slice::<P2PMessage>(&message) {
                    Ok(msg) => msg,
                    Err(e) => {
                        let response = NetworkMessage::Response {
                            request_id: "broadcast_message".to_string(),
                            data: NetworkResponseData::Error(format!("Failed to deserialize message: {}", e)),
                        };
                        return Ok(Some(response));
                    }
                };

                let result = self.runtime.block_on(async {
                    let manager = self.p2p_manager.lock().unwrap();
                    manager.send_message(p2p_message, None).await
                });

                match result {
                    Ok(_) => {
                        let response = NetworkMessage::Response {
                            request_id: "broadcast_message".to_string(),
                            data: NetworkResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = NetworkMessage::Response {
                            request_id: "broadcast_message".to_string(),
                            data: NetworkResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            NetworkMessage::GetPeers => {
                info!("Getting list of connected peers");
                let peers = {
                    let manager = self.p2p_manager.lock().unwrap();
                    manager.get_peers()
                };

                let response = NetworkMessage::Response {
                    request_id: "get_peers".to_string(),
                    data: NetworkResponseData::Peers(peers),
                };
                Ok(Some(response))
            }
            NetworkMessage::Response { .. } => {
                // Ignore responses
                Ok(None)
            }
        }
    }

    /// Receive a message from the P2P network.
    pub fn receive_message(&self) -> Result<(P2PMessage, String), P2PError> {
        self.runtime.block_on(async {
            let mut manager = self.p2p_manager.lock().unwrap();
            manager.receive_message().await
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_adapter_creation() {
        let adapter = NetworkAdapter::new();
        assert!(adapter.is_ok());
    }
}