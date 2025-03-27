//! WebRTC connection pool
//!
//! This module provides a connection pool for WebRTC connections.

use crate::error::{Error, Result};
use crate::types::PeerId;
use crate::webrtc_data_channel::WebRtcDataChannel;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// WebRTC connection pool
pub struct WebRtcConnectionPool {
    /// Connections by peer ID
    connections: Arc<Mutex<HashMap<PeerId, PooledConnection>>>,
    /// Maximum pool size
    max_size: usize,
    /// Connection timeout
    timeout: Duration,
}

/// Pooled connection
struct PooledConnection {
    /// Data channel
    channel: WebRtcDataChannel,
    /// Last used time
    last_used: Instant,
}

impl WebRtcConnectionPool {
    /// Create a new connection pool
    pub fn new(max_size: usize, timeout: Duration) -> Self {
        Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
            max_size,
            timeout,
        }
    }
    
    /// Get a connection
    pub fn get_connection(&self, peer_id: &PeerId) -> Result<WebRtcDataChannel> {
        let mut connections = self.connections.lock().unwrap();
        
        // Check if the connection exists
        if let Some(connection) = connections.get_mut(peer_id) {
            // Update last used time
            connection.last_used = Instant::now();
            return Ok(connection.channel.clone());
        }
        
        // Check if the pool is full
        if connections.len() >= self.max_size {
            // Find the oldest connection
            let oldest_peer_id = connections
                .iter()
                .min_by_key(|(_, conn)| conn.last_used)
                .map(|(peer_id, _)| peer_id.clone());
            
            // Remove the oldest connection
            if let Some(oldest_peer_id) = oldest_peer_id {
                connections.remove(&oldest_peer_id);
            }
        }
        
        // Create a new connection
        let channel = WebRtcDataChannel::new(peer_id.clone());
        
        // Add the connection to the pool
        connections.insert(
            peer_id.clone(),
            PooledConnection {
                channel: channel.clone(),
                last_used: Instant::now(),
            },
        );
        
        Ok(channel)
    }
    
    /// Release a connection
    pub fn release_connection(&self, peer_id: &PeerId) {
        // In a real implementation, we might want to do something here
        // For now, we'll just update the last used time
        if let Some(connection) = self.connections.lock().unwrap().get_mut(peer_id) {
            connection.last_used = Instant::now();
        }
    }
    
    /// Clean up expired connections
    pub fn cleanup(&self) {
        let now = Instant::now();
        let mut connections = self.connections.lock().unwrap();
        
        // Remove expired connections
        connections.retain(|_, conn| {
            now.duration_since(conn.last_used) < self.timeout
        });
    }
    
    /// Start the cleanup task
    pub fn start_cleanup_task(&self) {
        let connections_pool = self.clone();
        let timeout = self.timeout;
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(timeout);
            
            loop {
                interval.tick().await;
                connections_pool.cleanup();
            }
        });
    }
    
    /// Get the number of connections
    pub fn connection_count(&self) -> usize {
        self.connections.lock().unwrap().len()
    }
    
    /// Get the maximum pool size
    pub fn max_size(&self) -> usize {
        self.max_size
    }
    
    /// Set the maximum pool size
    pub fn set_max_size(&mut self, max_size: usize) {
        self.max_size = max_size;
    }
    
    /// Get the connection timeout
    pub fn timeout(&self) -> Duration {
        self.timeout
    }
    
    /// Set the connection timeout
    pub fn set_timeout(&mut self, timeout: Duration) {
        self.timeout = timeout;
    }
}

impl Clone for WebRtcConnectionPool {
    fn clone(&self) -> Self {
        Self {
            connections: self.connections.clone(),
            max_size: self.max_size,
            timeout: self.timeout,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[test]
    fn test_connection_pool_creation() {
        let pool = WebRtcConnectionPool::new(10, Duration::from_secs(60));
        
        assert_eq!(pool.max_size(), 10);
        assert_eq!(pool.timeout(), Duration::from_secs(60));
        assert_eq!(pool.connection_count(), 0);
    }
    
    #[test]
    fn test_get_connection() {
        let pool = WebRtcConnectionPool::new(10, Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        let connection = pool.get_connection(&peer_id).unwrap();
        
        assert_eq!(pool.connection_count(), 1);
    }
    
    #[test]
    fn test_connection_pool_max_size() {
        let pool = WebRtcConnectionPool::new(2, Duration::from_secs(60));
        
        // Add 3 connections
        let peer_id1 = PeerId("test1".to_string());
        let peer_id2 = PeerId("test2".to_string());
        let peer_id3 = PeerId("test3".to_string());
        
        let _ = pool.get_connection(&peer_id1).unwrap();
        let _ = pool.get_connection(&peer_id2).unwrap();
        
        // Sleep to ensure the first connection is older
        std::thread::sleep(Duration::from_millis(10));
        
        let _ = pool.get_connection(&peer_id3).unwrap();
        
        // The pool should still have 2 connections
        assert_eq!(pool.connection_count(), 2);
        
        // The oldest connection (peer_id1) should have been removed
        let connections = pool.connections.lock().unwrap();
        assert!(!connections.contains_key(&peer_id1));
        assert!(connections.contains_key(&peer_id2));
        assert!(connections.contains_key(&peer_id3));
    }
    
    #[test]
    fn test_cleanup() {
        let pool = WebRtcConnectionPool::new(10, Duration::from_millis(10));
        
        // Add a connection
        let peer_id = PeerId("test".to_string());
        let _ = pool.get_connection(&peer_id).unwrap();
        
        // Sleep to ensure the connection expires
        std::thread::sleep(Duration::from_millis(20));
        
        // Clean up
        pool.cleanup();
        
        // The pool should be empty
        assert_eq!(pool.connection_count(), 0);
    }
}