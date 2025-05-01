//! Relay connection pool
//!
//! This module provides a connection pool specifically for relay connections.
//! It combines the connection pool with relay discovery to efficiently manage
//! connections to relay nodes.

use crate::{
    auth::{AuthManager, AuthManagerConfig, AuthMethod, AuthorizationLevel},
    connection_pool::{ConnectionPool, ConnectionPoolConfig, ConnectionPoolStats},
    darkswap_lib::{Error, Result},
    relay_discovery::{RelayDiscoveryManager, RelayDiscoveryConfig, RelayInfo},
    webrtc_connection::{WebRtcConnection, WebRtcConnectionManager},
    webrtc_signaling_client::WebRtcSignalingClient,
    Result,
};
use libp2p::{Multiaddr, PeerId};
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tracing::{debug, info, warn};

/// Relay connection pool configuration
#[derive(Debug, Clone)]
pub struct RelayConnectionPoolConfig {
    /// Connection pool configuration
    pub connection_pool_config: ConnectionPoolConfig,
    /// Relay discovery configuration
    pub relay_discovery_config: RelayDiscoveryConfig,
    /// Authentication configuration
    pub auth_config: Option<AuthManagerConfig>,
    /// Maximum number of relay connections to maintain
    pub max_relay_connections: usize,
    /// Minimum number of relay connections to maintain
    pub min_relay_connections: usize,
    /// Connection check interval
    pub connection_check_interval: Duration,
    /// Whether to automatically connect to relays
    pub auto_connect: bool,
    /// Whether to require relay authentication
    pub require_relay_auth: bool,
    /// Minimum authorization level for relays
    pub min_relay_auth_level: AuthorizationLevel,
}

impl Default for RelayConnectionPoolConfig {
    fn default() -> Self {
        Self {
            connection_pool_config: ConnectionPoolConfig::default(),
            relay_discovery_config: RelayDiscoveryConfig::default(),
            auth_config: None,
            max_relay_connections: 5,
            min_relay_connections: 2,
            connection_check_interval: Duration::from_secs(60),
            auto_connect: true,
            require_relay_auth: false,
            min_relay_auth_level: AuthorizationLevel::Relay,
        }
    }
}

/// Relay connection status
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RelayConnectionStatus {
    /// Not connected
    NotConnected,
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Failed
    Failed(String),
}

/// Relay connection
#[derive(Debug)]
struct RelayConnection {
    /// Relay info
    relay_info: RelayInfo,
    /// Connection status
    status: RelayConnectionStatus,
    /// Last status change timestamp
    last_status_change: Instant,
    /// Connection attempts
    connection_attempts: u32,
    /// Last connection attempt timestamp
    last_connection_attempt: Instant,
}

/// Relay connection pool
pub struct RelayConnectionPool {
    /// Configuration
    config: RelayConnectionPoolConfig,
    /// Connection pool
    connection_pool: Arc<ConnectionPool>,
    /// Relay discovery manager
    relay_discovery: Arc<RelayDiscoveryManager>,
    /// WebRTC connection manager
    connection_manager: Arc<WebRtcConnectionManager>,
    /// Authentication manager
    auth_manager: Option<Arc<AuthManager>>,
    /// Relay connections
    relay_connections: Arc<Mutex<HashMap<PeerId, RelayConnection>>>,
    /// Last connection check timestamp
    last_connection_check: Arc<Mutex<Instant>>,
}

impl RelayConnectionPool {
    /// Create a new relay connection pool
    pub fn new(
        config: RelayConnectionPoolConfig,
        local_peer_id: PeerId,
        signaling_client: Arc<WebRtcSignalingClient>,
    ) -> Self {
        // Create the connection pool
        let connection_pool = Arc::new(ConnectionPool::new(config.connection_pool_config.clone()));
        
        // Create the relay discovery manager
        let relay_discovery = Arc::new(RelayDiscoveryManager::new(config.relay_discovery_config.clone()));
        
        // Create the WebRTC connection manager
        let connection_manager = Arc::new(WebRtcConnectionManager::with_connection_pool(
            local_peer_id,
            signaling_client,
            connection_pool.clone(),
        ));
        
        // Create the authentication manager if configured
        let auth_manager = config.auth_config.as_ref().map(|auth_config| {
            Arc::new(AuthManager::new(auth_config.clone()))
        });
        
        Self {
            config,
            connection_pool,
            relay_discovery,
            connection_manager,
            auth_manager,
            relay_connections: Arc::new(Mutex::new(HashMap::new())),
            last_connection_check: Arc::new(Mutex::new(Instant::now())),
        }
    }
    
    /// Get the relay discovery manager
    pub fn relay_discovery(&self) -> Arc<RelayDiscoveryManager> {
        self.relay_discovery.clone()
    }
    
    /// Get the connection manager
    pub fn connection_manager(&self) -> Arc<WebRtcConnectionManager> {
        self.connection_manager.clone()
    }
    
    /// Get the connection pool
    pub fn connection_pool(&self) -> Arc<ConnectionPool> {
        self.connection_pool.clone()
    }
    
    /// Get connection pool statistics
    pub fn get_connection_stats(&self) -> ConnectionPoolStats {
        self.connection_pool.stats()
    }
    
    /// Get relay connection status
    pub fn get_relay_status(&self, peer_id: &PeerId) -> RelayConnectionStatus {
        let relay_connections = self.relay_connections.lock().unwrap();
        relay_connections
            .get(peer_id)
            .map(|conn| conn.status.clone())
            .unwrap_or(RelayConnectionStatus::NotConnected)
    }
    
    /// Get all relay connections
    pub fn get_relay_connections(&self) -> Vec<(PeerId, RelayConnectionStatus)> {
        let relay_connections = self.relay_connections.lock().unwrap();
        relay_connections
            .iter()
            .map(|(peer_id, conn)| (peer_id.clone(), conn.status.clone()))
            .collect()
    }
    
    /// Get the number of connected relays
    pub fn connected_relay_count(&self) -> usize {
        let relay_connections = self.relay_connections.lock().unwrap();
        relay_connections
            .values()
            .filter(|conn| conn.status == RelayConnectionStatus::Connected)
            .count()
    }
    
    /// Connect to a relay
    pub async fn connect_to_relay(&self, peer_id: &PeerId) -> Result<WebRtcConnection> {
        // Check authentication and authorization if required
        if self.config.require_relay_auth {
            if let Some(auth_manager) = &self.auth_manager {
                // Check if the peer is banned
                if auth_manager.is_banned(peer_id) {
                    return Err(Error::AuthError(format!("Relay {} is banned", peer_id)));
                }
                
                // Check if the peer is authorized for relay
                if !auth_manager.is_authorized(peer_id, self.config.min_relay_auth_level) {
                    return Err(Error::AuthError(format!("Relay {} is not authorized", peer_id)));
                }
            } else {
                return Err(Error::AuthError("Authentication required but no auth manager configured".to_string()));
            }
        }
        
        // Check if we already have a connection to this relay
        {
            let mut relay_connections = self.relay_connections.lock().unwrap();
            if let Some(conn) = relay_connections.get_mut(peer_id) {
                if conn.status == RelayConnectionStatus::Connected {
                    // We're already connected, get the connection from the pool
                    if let Some(connection) = self.connection_manager.get_connection(peer_id) {
                        return Ok(connection);
                    }
                }
                
                // Update connection status
                conn.status = RelayConnectionStatus::Connecting;
                conn.last_status_change = Instant::now();
                conn.connection_attempts += 1;
                conn.last_connection_attempt = Instant::now();
            } else {
                // Get relay info from discovery manager
                if let Some(relay_info) = self.relay_discovery.get_relay(peer_id) {
                    // Add to relay connections
                    relay_connections.insert(
                        peer_id.clone(),
                        RelayConnection {
                            relay_info,
                            status: RelayConnectionStatus::Connecting,
                            last_status_change: Instant::now(),
                            connection_attempts: 1,
                            last_connection_attempt: Instant::now(),
                        },
                    );
                } else {
                    return Err(Error::PeerNotFound(peer_id.to_string()));
                }
            }
        }
        
        // Connect to the relay
        let start_time = Instant::now();
        match self.connection_manager.create_connection(peer_id).await {
            Ok(connection) => {
                // Update relay connection status
                let mut relay_connections = self.relay_connections.lock().unwrap();
                if let Some(conn) = relay_connections.get_mut(peer_id) {
                    conn.status = RelayConnectionStatus::Connected;
                    conn.last_status_change = Instant::now();
                    
                    // Record success with latency
                    let latency_ms = start_time.elapsed().as_millis() as u32;
                    self.relay_discovery.record_success(peer_id, latency_ms);
                }
                
                Ok(connection)
            }
            Err(e) => {
                // Update relay connection status
                let mut relay_connections = self.relay_connections.lock().unwrap();
                if let Some(conn) = relay_connections.get_mut(peer_id) {
                    conn.status = RelayConnectionStatus::Failed(e.to_string());
                    conn.last_status_change = Instant::now();
                    
                    // Record failure
                    self.relay_discovery.record_failure(peer_id);
                }
                
                Err(e)
            }
        }
    }
    
    /// Connect to the best available relay
    pub async fn connect_to_best_relay(&self) -> Result<WebRtcConnection> {
        // Get the best relays
        let best_relays = self.relay_discovery.get_best_relays(5);
        if best_relays.is_empty() {
            return Err(Error::NoRelaysAvailable);
        }
        
        // Try to connect to each relay in order
        for relay in best_relays {
            match self.connect_to_relay(&relay.peer_id).await {
                Ok(connection) => return Ok(connection),
                Err(e) => warn!("Failed to connect to relay {}: {}", relay.peer_id, e),
            }
        }
        
        Err(Error::NoRelaysAvailable)
    }
    
    /// Disconnect from a relay
    pub async fn disconnect_from_relay(&self, peer_id: &PeerId) -> Result<()> {
        // Update relay connection status
        {
            let mut relay_connections = self.relay_connections.lock().unwrap();
            if let Some(conn) = relay_connections.get_mut(peer_id) {
                conn.status = RelayConnectionStatus::NotConnected;
                conn.last_status_change = Instant::now();
            }
        }
        
        // Close the connection
        self.connection_manager.close_connection(peer_id).await
    }
    
    /// Check and maintain relay connections
    pub async fn check_connections(&self) -> Result<()> {
        // Check if it's time to check connections
        {
            let mut last_connection_check = self.last_connection_check.lock().unwrap();
            if last_connection_check.elapsed() < self.config.connection_check_interval {
                return Ok(());
            }
            *last_connection_check = Instant::now();
        }
        
        // Count connected relays
        let connected_count = self.connected_relay_count();
        
        // If we have fewer than the minimum, connect to more
        if connected_count < self.config.min_relay_connections && self.config.auto_connect {
            // Calculate how many more we need
            let needed = self.config.min_relay_connections - connected_count;
            
            // Get the best relays that we're not already connected to
            let best_relays = self.relay_discovery.get_best_relays(needed * 2);
            let mut connected = 0;
            
            // Try to connect to each relay until we have enough
            for relay in best_relays {
                // Skip if we're already connected
                if self.get_relay_status(&relay.peer_id) == RelayConnectionStatus::Connected {
                    continue;
                }
                
                // Try to connect
                match self.connect_to_relay(&relay.peer_id).await {
                    Ok(_) => {
                        connected += 1;
                        if connected >= needed {
                            break;
                        }
                    }
                    Err(e) => warn!("Failed to connect to relay {}: {}", relay.peer_id, e),
                }
            }
        }
        
        // If we have more than the maximum, disconnect from some
        if connected_count > self.config.max_relay_connections {
            // Calculate how many to disconnect
            let to_disconnect = connected_count - self.config.max_relay_connections;
            
            // Get all connected relays
            let relay_connections = self.relay_connections.lock().unwrap();
            let mut connected_relays: Vec<(PeerId, f64)> = relay_connections
                .iter()
                .filter(|(_, conn)| conn.status == RelayConnectionStatus::Connected)
                .map(|(peer_id, conn)| (peer_id.clone(), conn.relay_info.score()))
                .collect();
            
            // Sort by score (lowest first)
            connected_relays.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
            
            // Disconnect from the worst relays
            for (peer_id, _) in connected_relays.iter().take(to_disconnect) {
                let _ = self.disconnect_from_relay(peer_id).await;
            }
        }
        
        Ok(())
    }
    
    /// Connect to a peer through a relay
    pub async fn connect_via_relay(&self, peer_id: &PeerId) -> Result<WebRtcConnection> {
        // Check if we're already connected to this peer
        if let Some(connection) = self.connection_manager.get_connection(peer_id) {
            return Ok(connection);
        }
        
        // Check authentication for the target peer if required
        if let Some(auth_manager) = &self.auth_manager {
            // Check if the peer is banned
            if auth_manager.is_banned(peer_id) {
                return Err(Error::AuthError(format!("Peer {} is banned", peer_id)));
            }
        }
        
        // Get connected relays
        let relay_connections = self.relay_connections.lock().unwrap();
        let connected_relays: Vec<PeerId> = relay_connections
            .iter()
            .filter(|(_, conn)| conn.status == RelayConnectionStatus::Connected)
            .map(|(peer_id, _)| peer_id.clone())
            .collect();
        
        // If we don't have any connected relays, connect to one
        if connected_relays.is_empty() {
            drop(relay_connections); // Release the lock
            let relay_connection = self.connect_to_best_relay().await?;
            
            // Try to connect through this relay
            // In a real implementation, this would use the circuit relay protocol
            // For now, we'll just create a direct connection
            return self.connection_manager.create_connection(peer_id).await;
        }
        
        // Try each connected relay
        for relay_id in connected_relays {
            // Check if the relay is authorized for relaying if required
            if self.config.require_relay_auth {
                if let Some(auth_manager) = &self.auth_manager {
                    if !auth_manager.is_authorized(&relay_id, self.config.min_relay_auth_level) {
                        warn!("Relay {} is not authorized for relaying", relay_id);
                        continue;
                    }
                }
            }
            
            // In a real implementation, this would use the circuit relay protocol
            // For now, we'll just create a direct connection
            match self.connection_manager.create_connection(peer_id).await {
                Ok(connection) => return Ok(connection),
                Err(e) => warn!("Failed to connect to {} through relay {}: {}", peer_id, relay_id, e),
            }
        }
        
        Err(Error::PeerNotFound(peer_id.to_string()))
    }
    
    /// Add a relay
    pub fn add_relay(&self, peer_id: PeerId, addresses: Vec<Multiaddr>) {
        self.relay_discovery.add_relay(peer_id, addresses);
    }
    
    /// Authenticate a relay
    pub async fn authenticate_relay(&self, peer_id: &PeerId, token: &[u8]) -> Result<()> {
        if let Some(auth_manager) = &self.auth_manager {
            match auth_manager.validate_token(peer_id, token) {
                crate::auth::AuthResult::Success => {
                    // Set the authorization level to Relay
                    auth_manager.set_auth_level(peer_id, self.config.min_relay_auth_level);
                    Ok(())
                }
                crate::auth::AuthResult::Failure(reason) => {
                    Err(Error::AuthError(format!("Authentication failed: {}", reason)))
                }
                crate::auth::AuthResult::Pending => {
                    Err(Error::AuthError("Authentication pending".to_string()))
                }
            }
        } else {
            // If no auth manager is configured, authentication is always successful
            Ok(())
        }
    }
    
    /// Generate an authentication challenge for a relay
    pub async fn generate_relay_challenge(&self, peer_id: &PeerId) -> Result<Vec<u8>> {
        if let Some(auth_manager) = &self.auth_manager {
            let challenge = auth_manager.generate_challenge(peer_id)?;
            Ok(challenge.challenge)
        } else {
            // If no auth manager is configured, return an empty challenge
            Ok(vec![])
        }
    }
    
    /// Verify a relay's response to an authentication challenge
    pub async fn verify_relay_challenge_response(&self, peer_id: &PeerId, response: &[u8]) -> Result<()> {
        if let Some(auth_manager) = &self.auth_manager {
            match auth_manager.verify_challenge_response(peer_id, response) {
                crate::auth::AuthResult::Success => {
                    // Set the authorization level to Relay
                    auth_manager.set_auth_level(peer_id, self.config.min_relay_auth_level);
                    Ok(())
                }
                crate::auth::AuthResult::Failure(reason) => {
                    Err(Error::AuthError(format!("Challenge verification failed: {}", reason)))
                }
                crate::auth::AuthResult::Pending => {
                    Err(Error::AuthError("Challenge verification pending".to_string()))
                }
            }
        } else {
            // If no auth manager is configured, verification is always successful
            Ok(())
        }
    }
    
    /// Start the relay connection pool
    pub async fn start(&self) -> Result<()> {
        // Connect to bootstrap relays
        for (peer_id, _) in &self.config.relay_discovery_config.bootstrap_relays {
            let _ = self.connect_to_relay(peer_id).await;
        }
        
        // Start a background task to check connections periodically
        if self.config.auto_connect {
            let pool = self.clone();
            tokio::spawn(async move {
                loop {
                    tokio::time::sleep(pool.config.connection_check_interval).await;
                    if let Err(e) = pool.check_connections().await {
                        warn!("Error checking relay connections: {}", e);
                    }
                    
                    // Prune expired authentication tokens and challenges
                    if let Some(auth_manager) = &pool.auth_manager {
                        auth_manager.prune_expired();
                    }
                }
            });
        }
        
        // If we have an auth manager, prune expired tokens and challenges
        if let Some(auth_manager) = &self.auth_manager {
            auth_manager.prune_expired();
        }
        
        Ok(())
    }
}

impl Clone for RelayConnectionPool {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            connection_pool: self.connection_pool.clone(),
            relay_discovery: self.relay_discovery.clone(),
            connection_manager: self.connection_manager.clone(),
            auth_manager: self.auth_manager.clone(),
            relay_connections: self.relay_connections.clone(),
            last_connection_check: self.last_connection_check.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[tokio::test]
    async fn test_relay_connection_pool() {
        // Create a local peer ID
        let local_peer_id = PeerId::random();
        
        // Create a WebRTC signaling client
        let signaling_client = Arc::new(WebRtcSignalingClient::new(local_peer_id.clone()));
        
        // Create a relay connection pool configuration
        let config = RelayConnectionPoolConfig {
            max_relay_connections: 3,
            min_relay_connections: 1,
            connection_check_interval: Duration::from_millis(100),
            auto_connect: false, // Disable auto-connect for testing
            ..Default::default()
        };
        
        // Create a relay connection pool
        let pool = RelayConnectionPool::new(config, local_peer_id, signaling_client);
        
        // Add some relays
        let relay_id1 = PeerId::random();
        let relay_id2 = PeerId::random();
        let addr1 = "/ip4/127.0.0.1/tcp/8000".parse::<Multiaddr>().unwrap();
        let addr2 = "/ip4/127.0.0.1/tcp/8001".parse::<Multiaddr>().unwrap();
        
        pool.add_relay(relay_id1.clone(), vec![addr1]);
        pool.add_relay(relay_id2.clone(), vec![addr2]);
        
        // Check initial state
        assert_eq!(pool.connected_relay_count(), 0);
        assert_eq!(pool.get_relay_status(&relay_id1), RelayConnectionStatus::NotConnected);
        
        // Start the pool
        pool.start().await.unwrap();
        
        // Check connections
        pool.check_connections().await.unwrap();
        
        // Get relay connections
        let connections = pool.get_relay_connections();
        assert_eq!(connections.len(), 0); // No connections yet since auto-connect is disabled
        
        // Get connection stats
        let stats = pool.get_connection_stats();
        assert_eq!(stats.total_connections, 0);
    }
}