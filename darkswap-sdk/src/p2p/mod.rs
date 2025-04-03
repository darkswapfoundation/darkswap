//! P2P network module for DarkSwap
//!
//! This module provides P2P networking functionality for DarkSwap, including WebRTC transport,
//! circuit relay, and peer discovery.

use std::collections::HashMap;
use std::sync::Arc;

use anyhow::{Context as AnyhowContext, Result};
use libp2p::core::multiaddr::{Multiaddr, Protocol};
use libp2p::core::PeerId;
use log::{debug, error, info, warn};
use tokio::sync::{mpsc, Mutex, RwLock};

use crate::config::Config;
use crate::types::Event;

pub mod circuit_relay;
pub mod relay_manager;
pub mod webrtc_transport;
use circuit_relay::CircuitRelay;
use relay_manager::{RelayManager, RelayManagerConfig, RelayServer, RelayServerStatus};
use webrtc_transport::{DarkSwapWebRtcTransport, WebRtcSignalingClient};

/// P2P network event
#[derive(Debug)]
pub enum P2PEvent {
    /// Gossipsub event
    Gossipsub(String),
    /// Kademlia event
    Kademlia(String),
    /// MDNS event
    Mdns(String),
    /// Ping event
    Ping(String),
    /// Identify event
    Identify(String),
}

/// P2P network
pub struct P2PNetwork {
    /// Local peer ID
    local_peer_id: PeerId,
    /// WebRTC transport
    webrtc_transport: Option<Arc<DarkSwapWebRtcTransport>>,
    /// WebRTC signaling client
    webrtc_signaling: Option<WebRtcSignalingClient>,
    /// Circuit relay
    circuit_relay: Option<Arc<CircuitRelay>>,
    /// Relay manager
    relay_manager: Option<Arc<RelayManager>>,
    /// Connected peers
    connected_peers: Arc<RwLock<HashMap<PeerId, Multiaddr>>>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
    /// Event receiver
    event_receiver: Arc<RwLock<mpsc::Receiver<Event>>>,
}

impl P2PNetwork {
    /// Create a new P2P network
    pub async fn new(config: &Config) -> Result<Self> {
        // Generate a new keypair
        let keypair = libp2p::identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(keypair.public());

        // Create the event channel
        let (event_sender, event_receiver) = mpsc::channel(100);

        // Create the WebRTC transport
        let webrtc_transport = if config.enable_webrtc {
            Some(Arc::new(DarkSwapWebRtcTransport::new(local_peer_id.clone()).await?))
        } else {
            None
        };

        // Create the WebRTC signaling client
        let webrtc_signaling = if config.enable_webrtc && !config.signaling_servers.is_empty() {
            let signaling_server = &config.signaling_servers[0];
            Some(WebRtcSignalingClient::new(
                local_peer_id.clone(),
                signaling_server.clone(),
            )?)
        } else {
            None
        };

        // Create the circuit relay
        let circuit_relay = if config.enable_circuit_relay {
            Some(Arc::new(CircuitRelay::new(local_peer_id.clone()).await?))
        } else {
            None
        };

        // Create the relay manager
        let relay_manager = if config.enable_relay_manager && webrtc_transport.is_some() {
            let webrtc_transport = webrtc_transport.as_ref().unwrap().clone();
            Some(Arc::new(RelayManager::new(
                local_peer_id.clone(),
                config.network.clone(),
                webrtc_transport,
            )))
        } else {
            None
        };

        Ok(Self {
            local_peer_id,
            webrtc_transport,
            webrtc_signaling,
            circuit_relay,
            relay_manager,
            connected_peers: Arc::new(RwLock::new(HashMap::new())),
            event_sender,
            event_receiver: Arc::new(RwLock::new(event_receiver)),
        })
    }

    /// Start the P2P network
    pub async fn start(&self) -> Result<()> {
        // Start the WebRTC signaling client
        if let Some(signaling) = &self.webrtc_signaling {
            signaling.connect().await?;
        }

        // Start the circuit relay
        if let Some(relay) = &self.circuit_relay {
            relay.start().await?;
        }

        // Start the relay manager
        if let Some(manager) = &self.relay_manager {
            // Connect to relay servers
            // This is just a placeholder for now
        }

        Ok(())
    }

    /// Stop the P2P network
    pub async fn stop(&self) -> Result<()> {
        // Stop the WebRTC signaling client
        if let Some(signaling) = &self.webrtc_signaling {
            signaling.disconnect().await?;
        }

        // Stop the circuit relay
        if let Some(relay) = &self.circuit_relay {
            relay.stop().await?;
        }

        Ok(())
    }

    /// Connect to a peer
    pub async fn connect(&self, peer_id: &PeerId, addr: &Multiaddr) -> Result<()> {
        // Check if we're already connected
        let mut connected_peers = self.connected_peers.write().await;
        if connected_peers.contains_key(peer_id) {
            return Ok(());
        }

        // Try to connect via WebRTC
        if let Some(transport) = &self.webrtc_transport {
            if let Ok(()) = transport.connect(peer_id).await {
                connected_peers.insert(peer_id.clone(), addr.clone());
                return Ok(());
            }
        }

        // Try to connect via circuit relay
        if let Some(relay) = &self.circuit_relay {
            if let Ok(()) = relay.connect(peer_id, addr).await {
                connected_peers.insert(peer_id.clone(), addr.clone());
                return Ok(());
            }
        }

        // Try to connect via relay manager
        if let Some(manager) = &self.relay_manager {
            if let Ok(_) = manager.connect_to_peer(peer_id).await {
                connected_peers.insert(peer_id.clone(), addr.clone());
                return Ok(());
            }
        }

        Err(anyhow::anyhow!("Failed to connect to peer"))
    }

    /// Disconnect from a peer
    pub async fn disconnect(&self, peer_id: &PeerId) -> Result<()> {
        // Remove from connected peers
        let mut connected_peers = self.connected_peers.write().await;
        connected_peers.remove(peer_id);

        Ok(())
    }

    /// Send data to a peer
    pub async fn send_data(&self, peer_id: &PeerId, data: &[u8]) -> Result<()> {
        // Check if we're connected
        let connected_peers = self.connected_peers.read().await;
        if !connected_peers.contains_key(peer_id) {
            return Err(anyhow::anyhow!("Not connected to peer"));
        }

        // Try to send via WebRTC
        if let Some(transport) = &self.webrtc_transport {
            if let Ok(()) = transport.send_message(peer_id, &String::from_utf8_lossy(data)).await {
                return Ok(());
            }
        }

        // Try to send via circuit relay
        if let Some(relay) = &self.circuit_relay {
            if let Ok(()) = relay.send_data(peer_id, data).await {
                return Ok(());
            }
        }

        // Try to send via relay manager
        if let Some(manager) = &self.relay_manager {
            // Get the relay ID
            let relay_id = "relay-id"; // This is just a placeholder
            if let Ok(()) = manager.send_data(peer_id, relay_id, data).await {
                return Ok(());
            }
        }

        Err(anyhow::anyhow!("Failed to send data to peer"))
    }

    /// Get the local peer ID
    pub fn local_peer_id(&self) -> PeerId {
        self.local_peer_id.clone()
    }

    /// Get the connected peers
    pub async fn connected_peers(&self) -> HashMap<PeerId, Multiaddr> {
        self.connected_peers.read().await.clone()
    }

    /// Extract the peer ID from a multiaddr
    fn extract_peer_id(addr: &Multiaddr) -> Option<PeerId> {
        addr.iter().find_map(|proto| match proto {
            Protocol::P2p(hash) => {
                Some(PeerId::from_multihash(hash).expect("Valid multihash"))
            }
            _ => None,
        })
    }
}

/// Circuit relay manager
pub struct CircuitRelayManager {
    /// Local peer ID
    local_peer_id: PeerId,
    /// Circuit relay
    circuit_relay: Arc<CircuitRelay>,
    /// Connected relays
    connected_relays: Arc<RwLock<HashMap<PeerId, Multiaddr>>>,
}

impl CircuitRelayManager {
    /// Create a new circuit relay manager
    pub fn new(local_peer_id: PeerId, circuit_relay: Arc<CircuitRelay>) -> Self {
        Self {
            local_peer_id,
            circuit_relay,
            connected_relays: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Connect to a relay
    pub async fn connect_to_relay(&self, relay_peer_id: PeerId, relay_addr: Multiaddr) -> Result<()> {
        // Check if we're already connected
        let mut connected_relays = self.connected_relays.write().await;
        if connected_relays.contains_key(&relay_peer_id) {
            return Ok(());
        }

        // Connect to the relay
        self.circuit_relay.connect_to_relay(&relay_peer_id, &relay_addr).await?;

        // Add to connected relays
        connected_relays.insert(relay_peer_id, relay_addr);

        Ok(())
    }

    /// Disconnect from a relay
    pub async fn disconnect_from_relay(&self, relay_peer_id: &PeerId) -> Result<()> {
        // Check if we're connected
        let mut connected_relays = self.connected_relays.write().await;
        if !connected_relays.contains_key(relay_peer_id) {
            return Ok(());
        }

        // Disconnect from the relay
        self.circuit_relay.disconnect_from_relay(relay_peer_id).await?;

        // Remove from connected relays
        connected_relays.remove(relay_peer_id);

        Ok(())
    }

    /// Get the connected relays
    pub async fn connected_relays(&self) -> HashMap<PeerId, Multiaddr> {
        self.connected_relays.read().await.clone()
    }
}