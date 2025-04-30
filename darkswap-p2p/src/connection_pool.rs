//! WebRTC connection pool
//!
//! This module provides a connection pool for WebRTC connections.
//! It allows for efficient reuse of connections to peers.

use crate::{
    error::Error,
    webrtc_connection::WebRtcConnection,
    Result,
};
use libp2p::PeerId;
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tracing::{debug, info, warn};

/// Connection pool configuration
#[derive(Debug, Clone)]
pub struct ConnectionPoolConfig {
    /// Maximum number of connections to keep in the pool
    pub max_connections: usize,
    /// Time-to-live for idle connections
    pub ttl: Duration,
    /// Maximum age for connections
    pub max_age: Duration,
    /// Whether to enable connection reuse
    pub enable_reuse: bool,
}

impl Default for ConnectionPoolConfig {
    fn default() -> Self {
        Self {
            max_connections: 100,
            ttl: Duration::from_secs(300), // 5 minutes
            max_age: Duration::from_secs(3600), // 1 hour
            enable_reuse: true,
        }
    }
}

/// Connection entry in the pool
struct ConnectionEntry {
    /// The WebRTC connection
    connection: Arc<WebRtcConnection>,
    /// When the connection was created
    created_at: Instant,
    /// When the connection was last used
    last_used: Instant,
    /// Whether the connection is currently in use
    in_use: bool,
}

/// WebRTC connection pool
pub struct ConnectionPool {
    /// Configuration
    config: ConnectionPoolConfig,
    /// Connections by peer ID
    connections: Mutex<HashMap<PeerId, Vec<ConnectionEntry>>>,
    /// Connections currently in use
    in_use: Mutex<HashSet<PeerId>>,
}

impl ConnectionPool {
    /// Create a new connection pool
    pub fn new(config: ConnectionPoolConfig) -> Self {
        Self {
            config,
            connections: Mutex::new(HashMap::new()),
            in_use: Mutex::new(HashSet::new()),
        }
    }

    /// Get a connection to a peer
    pub fn get(&self, peer_id: &PeerId) -> Option<Arc<WebRtcConnection>> {
        // If connection reuse is disabled, return None
        if !self.config.enable_reuse {
            return None;
        }

        let mut connections = self.connections.lock().unwrap();
        let mut in_use = self.in_use.lock().unwrap();

        // Check if we have any connections to this peer
        if let Some(entries) = connections.get_mut(peer_id) {
            // Find an idle connection
            for entry in entries.iter_mut() {
                if !entry.in_use {
                    // Check if the connection is still valid
                    let now = Instant::now();
                    let idle_time = now.duration_since(entry.last_used);
                    let age = now.duration_since(entry.created_at);

                    if idle_time < self.config.ttl && age < self.config.max_age {
                        // Mark the connection as in use
                        entry.in_use = true;
                        entry.last_used = now;
                        in_use.insert(*peer_id);

                        debug!("Reusing connection to peer {}", peer_id);
                        return Some(entry.connection.clone());
                    }
                }
            }
        }

        None
    }

    /// Add a connection to the pool
    pub fn add(&self, peer_id: PeerId, connection: WebRtcConnection) {
        let mut connections = self.connections.lock().unwrap();
        let mut in_use = self.in_use.lock().unwrap();

        // Create the entry
        let entry = ConnectionEntry {
            connection: Arc::new(connection),
            created_at: Instant::now(),
            last_used: Instant::now(),
            in_use: true,
        };

        // Add the connection to the pool
        connections
            .entry(peer_id)
            .or_insert_with(Vec::new)
            .push(entry);

        // Mark the peer as in use
        in_use.insert(peer_id);

        // Prune the pool if necessary
        self.prune_locked(&mut connections);

        debug!("Added connection to peer {} to the pool", peer_id);
    }

    /// Release a connection back to the pool
    pub fn release(&self, peer_id: &PeerId) {
        let mut connections = self.connections.lock().unwrap();
        let mut in_use = self.in_use.lock().unwrap();

        // Check if we have any connections to this peer
        if let Some(entries) = connections.get_mut(peer_id) {
            // Mark all connections as not in use
            for entry in entries.iter_mut() {
                if entry.in_use {
                    entry.in_use = false;
                    entry.last_used = Instant::now();
                }
            }
        }

        // Remove the peer from the in-use set
        in_use.remove(peer_id);

        debug!("Released connection to peer {}", peer_id);
    }

    /// Remove a connection from the pool
    pub fn remove(&self, peer_id: &PeerId) {
        let mut connections = self.connections.lock().unwrap();
        let mut in_use = self.in_use.lock().unwrap();

        // Remove all connections to this peer
        connections.remove(peer_id);

        // Remove the peer from the in-use set
        in_use.remove(peer_id);

        debug!("Removed all connections to peer {}", peer_id);
    }

    /// Prune the connection pool
    pub fn prune(&self) {
        let mut connections = self.connections.lock().unwrap();
        self.prune_locked(&mut connections);
    }

    /// Prune the connection pool (with lock already held)
    fn prune_locked(&self, connections: &mut HashMap<PeerId, Vec<ConnectionEntry>>) {
        let now = Instant::now();
        let mut total_connections = 0;

        // Count the total number of connections
        for entries in connections.values() {
            total_connections += entries.len();
        }

        // If we're under the limit, no need to prune
        if total_connections <= self.config.max_connections {
            return;
        }

        // Remove expired connections
        for entries in connections.values_mut() {
            entries.retain(|entry| {
                let idle_time = now.duration_since(entry.last_used);
                let age = now.duration_since(entry.created_at);

                // Keep the connection if it's in use or still valid
                entry.in_use || (idle_time < self.config.ttl && age < self.config.max_age)
            });
        }

        // Remove empty entries
        connections.retain(|_, entries| !entries.is_empty());

        // If we're still over the limit, remove the oldest connections
        let mut total_connections = 0;
        for entries in connections.values() {
            total_connections += entries.len();
        }

        if total_connections > self.config.max_connections {
            // Collect all connections
            let mut all_entries: Vec<(PeerId, usize)> = Vec::new();
            for (peer_id, entries) in connections.iter() {
                for (i, entry) in entries.iter().enumerate() {
                    if !entry.in_use {
                        all_entries.push((*peer_id, i));
                    }
                }
            }

            // Sort by last used time (oldest first)
            all_entries.sort_by(|(peer_id1, i1), (peer_id2, i2)| {
                let entry1 = &connections.get(peer_id1).unwrap()[*i1];
                let entry2 = &connections.get(peer_id2).unwrap()[*i2];
                entry1.last_used.cmp(&entry2.last_used)
            });

            // Remove the oldest connections
            let to_remove = total_connections - self.config.max_connections;
            for (peer_id, i) in all_entries.iter().take(to_remove) {
                if let Some(entries) = connections.get_mut(peer_id) {
                    if *i < entries.len() {
                        entries.remove(*i);
                    }
                }
            }
        }

        // Remove empty entries again
        connections.retain(|_, entries| !entries.is_empty());

        debug!("Pruned connection pool, now has {} connections", total_connections);
    }

    /// Get the number of connections in the pool
    pub fn len(&self) -> usize {
        let connections = self.connections.lock().unwrap();
        let mut count = 0;
        for entries in connections.values() {
            count += entries.len();
        }
        count
    }

    /// Check if the pool is empty
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Get the number of connections in use
    pub fn in_use_count(&self) -> usize {
        let in_use = self.in_use.lock().unwrap();
        in_use.len()
    }

    /// Get statistics about the connection pool
    pub fn stats(&self) -> ConnectionPoolStats {
        let connections = self.connections.lock().unwrap();
        let in_use = self.in_use.lock().unwrap();

        let mut total_connections = 0;
        let mut idle_connections = 0;
        let mut peers = 0;

        for entries in connections.values() {
            peers += 1;
            for entry in entries {
                total_connections += 1;
                if !entry.in_use {
                    idle_connections += 1;
                }
            }
        }

        ConnectionPoolStats {
            total_connections,
            in_use_connections: total_connections - idle_connections,
            idle_connections,
            peers,
            in_use_peers: in_use.len(),
        }
    }
}

/// Connection pool statistics
#[derive(Debug, Clone)]
pub struct ConnectionPoolStats {
    /// Total number of connections in the pool
    pub total_connections: usize,
    /// Number of connections currently in use
    pub in_use_connections: usize,
    /// Number of idle connections
    pub idle_connections: usize,
    /// Number of peers with connections
    pub peers: usize,
    /// Number of peers with connections in use
    pub in_use_peers: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::webrtc_connection::WebRtcConnection;
    use libp2p::PeerId;
    use std::time::Duration;

    #[test]
    fn test_connection_pool() {
        // Create a connection pool
        let config = ConnectionPoolConfig {
            max_connections: 10,
            ttl: Duration::from_secs(60),
            max_age: Duration::from_secs(3600),
            enable_reuse: true,
        };
        let pool = ConnectionPool::new(config);

        // Create some test connections
        let peer_id1 = PeerId::random();
        let peer_id2 = PeerId::random();
        let conn1 = WebRtcConnection::new_mock();
        let conn2 = WebRtcConnection::new_mock();

        // Add the connections to the pool
        pool.add(peer_id1, conn1);
        pool.add(peer_id2, conn2);

        // Check that the connections are in the pool
        assert_eq!(pool.len(), 2);
        assert_eq!(pool.in_use_count(), 2);

        // Release the connections
        pool.release(&peer_id1);
        pool.release(&peer_id2);

        // Check that the connections are still in the pool but not in use
        assert_eq!(pool.len(), 2);
        assert_eq!(pool.in_use_count(), 0);

        // Get a connection
        let conn = pool.get(&peer_id1);
        assert!(conn.is_some());
        assert_eq!(pool.in_use_count(), 1);

        // Remove a connection
        pool.remove(&peer_id1);
        assert_eq!(pool.len(), 1);
        assert_eq!(pool.in_use_count(), 0);

        // Get statistics
        let stats = pool.stats();
        assert_eq!(stats.total_connections, 1);
        assert_eq!(stats.in_use_connections, 0);
        assert_eq!(stats.idle_connections, 1);
        assert_eq!(stats.peers, 1);
        assert_eq!(stats.in_use_peers, 0);
    }
}