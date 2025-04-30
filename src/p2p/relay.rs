//! Relay module for DarkSwap
//!
//! This module provides relay functionality for DarkSwap, including relay discovery
//! and relay connection management.

use anyhow::{Context as AnyhowContext, Result};
use darkswap_p2p::{
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig, RelayConnectionStatus},
    relay_discovery::{RelayDiscoveryConfig, RelayInfo},
    connection_pool::ConnectionPoolConfig,
    webrtc_signaling_client::WebRtcSignalingClient,
};
use libp2p::{Multiaddr, PeerId};
use log::{debug, error, info, warn};
use std::{sync::Arc, time::Duration};

/// Relay manager
pub struct RelayManager {
    /// Relay connection pool
    relay_pool: Arc<RelayConnectionPool>,
    /// Local peer ID
    local_peer_id: PeerId,
}

impl RelayManager {
    /// Create a new relay manager
    pub async fn new(
        local_peer_id: PeerId,
        signaling_client: Arc<WebRtcSignalingClient>,
        bootstrap_relays: Vec<Multiaddr>,
    ) -> Result<Self> {
        // Extract peer IDs from bootstrap relay addresses
        let bootstrap_relay_peers = bootstrap_relays
            .iter()
            .filter_map(|addr| {
                let peer_id = extract_peer_id(addr)?;
                Some((peer_id, addr.clone()))
            })
            .collect::<Vec<_>>();
        
        // Create relay discovery configuration
        let relay_discovery_config = RelayDiscoveryConfig {
            bootstrap_relays: bootstrap_relay_peers,
            dht_query_interval: Duration::from_secs(300),
            relay_ttl: Duration::from_secs(3600 * 24),
            max_relays: 100,
            enable_dht_discovery: true,
            enable_mdns_discovery: true,
        };
        
        // Create connection pool configuration
        let connection_pool_config = ConnectionPoolConfig {
            max_connections: 50,
            ttl: Duration::from_secs(3600),
            max_age: Duration::from_secs(3600 * 24),
            enable_reuse: true,
        };
        
        // Create relay connection pool configuration
        let relay_pool_config = RelayConnectionPoolConfig {
            connection_pool_config,
            relay_discovery_config,
            max_relay_connections: 5,
            min_relay_connections: 2,
            connection_check_interval: Duration::from_secs(60),
            auto_connect: true,
        };
        
        // Create relay connection pool
        let relay_pool = RelayConnectionPool::new(
            relay_pool_config,
            local_peer_id.clone(),
            signaling_client,
        );
        
        // Start the relay connection pool
        relay_pool.start().await?;
        
        Ok(Self {
            relay_pool: Arc::new(relay_pool),
            local_peer_id,
        })
    }
    
    /// Connect to a peer through a relay
    pub async fn connect_to_peer(&self, peer_id: &PeerId) -> Result<()> {
        // Try to connect through a relay
        match self.relay_pool.connect_via_relay(peer_id).await {
            Ok(_) => {
                info!("Connected to peer {} through relay", peer_id);
                Ok(())
            }
            Err(e) => {
                warn!("Failed to connect to peer {} through relay: {}", peer_id, e);
                Err(anyhow::anyhow!("Failed to connect to peer through relay: {}", e))
            }
        }
    }
    
    /// Get relay connection status
    pub fn get_relay_status(&self, peer_id: &PeerId) -> RelayConnectionStatus {
        self.relay_pool.get_relay_status(peer_id)
    }
    
    /// Get all relay connections
    pub fn get_relay_connections(&self) -> Vec<(PeerId, RelayConnectionStatus)> {
        self.relay_pool.get_relay_connections()
    }
    
    /// Get the number of connected relays
    pub fn connected_relay_count(&self) -> usize {
        self.relay_pool.connected_relay_count()
    }
    
    /// Add a relay
    pub fn add_relay(&self, peer_id: PeerId, addresses: Vec<Multiaddr>) {
        self.relay_pool.add_relay(peer_id, addresses);
    }
    
    /// Check and maintain relay connections
    pub async fn check_connections(&self) -> Result<()> {
        self.relay_pool.check_connections().await?;
        Ok(())
    }
}

/// Extract peer ID from multiaddr
fn extract_peer_id(addr: &Multiaddr) -> Option<PeerId> {
    use libp2p::core::multiaddr::Protocol;
    
    addr.iter().find_map(|proto| {
        if let Protocol::P2p(hash) = proto {
            Some(PeerId::from_multihash(hash).expect("Valid multihash"))
        } else {
            None
        }
    })
}