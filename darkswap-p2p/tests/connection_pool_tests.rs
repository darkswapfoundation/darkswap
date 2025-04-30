use darkswap_p2p::{
    connection_pool::{ConnectionPool, ConnectionPoolConfig},
    webrtc_connection::{WebRtcConnection, DataChannel, ConnectionState, IceConnectionState, SignalingState},
};
use libp2p::PeerId;
use std::{collections::HashMap, time::Duration};

#[tokio::test]
async fn test_connection_pool_basic() {
    // Create a connection pool configuration
    let config = ConnectionPoolConfig {
        max_connections: 10,
        ttl: Duration::from_secs(60),
        max_age: Duration::from_secs(3600),
        enable_reuse: true,
    };
    
    // Create a connection pool
    let pool = ConnectionPool::new(config);
    
    // Create some test connections
    let peer_id1 = PeerId::random();
    let peer_id2 = PeerId::random();
    
    let conn1 = create_test_connection(peer_id1.clone());
    let conn2 = create_test_connection(peer_id2.clone());
    
    // Add the connections to the pool
    pool.add(peer_id1.clone(), conn1);
    pool.add(peer_id2.clone(), conn2);
    
    // Check that the connections are in the pool
    assert_eq!(pool.len(), 2);
    assert_eq!(pool.in_use_count(), 2);
    
    // Get statistics
    let stats = pool.stats();
    assert_eq!(stats.total_connections, 2);
    assert_eq!(stats.in_use_connections, 2);
    assert_eq!(stats.idle_connections, 0);
    assert_eq!(stats.peers, 2);
    assert_eq!(stats.in_use_peers, 2);
    
    // Release the connections
    pool.release(&peer_id1);
    pool.release(&peer_id2);
    
    // Check that the connections are still in the pool but not in use
    assert_eq!(pool.len(), 2);
    assert_eq!(pool.in_use_count(), 0);
    
    // Get updated statistics
    let stats = pool.stats();
    assert_eq!(stats.total_connections, 2);
    assert_eq!(stats.in_use_connections, 0);
    assert_eq!(stats.idle_connections, 2);
    assert_eq!(stats.peers, 2);
    assert_eq!(stats.in_use_peers, 0);
    
    // Get a connection
    let conn = pool.get(&peer_id1);
    assert!(conn.is_some());
    assert_eq!(pool.in_use_count(), 1);
    
    // Remove a connection
    pool.remove(&peer_id1);
    assert_eq!(pool.len(), 1);
    assert_eq!(pool.in_use_count(), 0);
}

#[tokio::test]
async fn test_connection_pool_pruning() {
    // Create a connection pool configuration with short TTL
    let config = ConnectionPoolConfig {
        max_connections: 5,
        ttl: Duration::from_millis(100), // Very short TTL for testing
        max_age: Duration::from_secs(3600),
        enable_reuse: true,
    };
    
    // Create a connection pool
    let pool = ConnectionPool::new(config);
    
    // Add several connections
    for _ in 0..10 {
        let peer_id = PeerId::random();
        let conn = create_test_connection(peer_id.clone());
        pool.add(peer_id, conn);
        pool.release(&peer_id);
    }
    
    // Check that the pool has been pruned to max_connections
    assert_eq!(pool.len(), 5);
    
    // Wait for TTL to expire
    tokio::time::sleep(Duration::from_millis(200)).await;
    
    // Prune the pool
    pool.prune();
    
    // Check that all connections have been pruned
    assert_eq!(pool.len(), 0);
}

#[tokio::test]
async fn test_connection_pool_reuse_disabled() {
    // Create a connection pool configuration with reuse disabled
    let config = ConnectionPoolConfig {
        max_connections: 10,
        ttl: Duration::from_secs(60),
        max_age: Duration::from_secs(3600),
        enable_reuse: false,
    };
    
    // Create a connection pool
    let pool = ConnectionPool::new(config);
    
    // Create a test connection
    let peer_id = PeerId::random();
    let conn = create_test_connection(peer_id.clone());
    
    // Add the connection to the pool
    pool.add(peer_id.clone(), conn);
    
    // Release the connection
    pool.release(&peer_id);
    
    // Try to get the connection
    let conn = pool.get(&peer_id);
    assert!(conn.is_none());
}

#[tokio::test]
async fn test_connection_pool_max_age() {
    // Create a connection pool configuration with short max age
    let config = ConnectionPoolConfig {
        max_connections: 10,
        ttl: Duration::from_secs(60),
        max_age: Duration::from_millis(100), // Very short max age for testing
        enable_reuse: true,
    };
    
    // Create a connection pool
    let pool = ConnectionPool::new(config);
    
    // Create a test connection
    let peer_id = PeerId::random();
    let conn = create_test_connection(peer_id.clone());
    
    // Add the connection to the pool
    pool.add(peer_id.clone(), conn);
    
    // Release the connection
    pool.release(&peer_id);
    
    // Wait for max age to expire
    tokio::time::sleep(Duration::from_millis(200)).await;
    
    // Try to get the connection
    let conn = pool.get(&peer_id);
    assert!(conn.is_none());
    
    // Prune the pool
    pool.prune();
    
    // Check that the connection has been pruned
    assert_eq!(pool.len(), 0);
}

// Helper function to create a test connection
fn create_test_connection(peer_id: PeerId) -> WebRtcConnection {
    let mut data_channels = HashMap::new();
    let data_channel = DataChannel::new("data".to_string(), true);
    data_channels.insert("data".to_string(), data_channel);
    
    WebRtcConnection {
        peer_id,
        data_channels,
        state: ConnectionState::Connected,
        ice_connection_state: IceConnectionState::Connected,
        signaling_state: SignalingState::Stable,
    }
}