use darkswap_p2p::{
    connection_pool::{ConnectionPool, ConnectionPoolConfig},
    webrtc_connection::{WebRtcConnection, WebRtcConnectionManager, DataChannel},
    webrtc_signaling_client::WebRtcSignalingClient,
    Error,
};
use libp2p::PeerId;
use std::{sync::Arc, time::Duration};
use tokio::time;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting WebRTC connection pool example");
    
    // Create a local peer ID
    let local_peer_id = PeerId::random();
    println!("Local peer ID: {}", local_peer_id);
    
    // Create a WebRTC signaling client
    let signaling_client = WebRtcSignalingClient::new(local_peer_id.clone());
    
    // Connect to the signaling server
    println!("Connecting to signaling server...");
    signaling_client.connect("ws://localhost:9001/signaling").await?;
    println!("Connected to signaling server");
    
    // Create a connection pool configuration
    let pool_config = ConnectionPoolConfig {
        max_connections: 10,
        ttl: Duration::from_secs(60),
        max_age: Duration::from_secs(300),
        enable_reuse: true,
    };
    
    // Create a connection pool
    let connection_pool = Arc::new(ConnectionPool::new(pool_config));
    
    // Create a WebRTC connection manager with the connection pool
    let connection_manager = WebRtcConnectionManager::with_connection_pool(
        local_peer_id.clone(),
        Arc::new(signaling_client),
        connection_pool.clone(),
    );
    
    // Create some peer IDs to connect to
    let peer_ids = vec![
        PeerId::random(),
        PeerId::random(),
        PeerId::random(),
    ];
    
    // Create connections to the peers
    println!("Creating connections to peers...");
    for peer_id in &peer_ids {
        println!("Connecting to peer {}...", peer_id);
        
        // Try to get a connection from the pool first
        if let Some(connection) = connection_manager.get_connection(peer_id) {
            println!("Reused existing connection to peer {}", peer_id);
        } else {
            // Create a new connection
            match connection_manager.create_connection(peer_id).await {
                Ok(_) => println!("Connected to peer {}", peer_id),
                Err(e) => println!("Failed to connect to peer {}: {}", peer_id, e),
            }
        }
    }
    
    // Get connection pool statistics
    let stats = connection_manager.get_connection_stats();
    println!("Connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    // Release connections back to the pool
    println!("Releasing connections...");
    for peer_id in &peer_ids {
        connection_manager.release_connection(peer_id);
        println!("Released connection to peer {}", peer_id);
    }
    
    // Get updated connection pool statistics
    let stats = connection_manager.get_connection_stats();
    println!("Updated connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    // Wait a bit
    println!("Waiting for 5 seconds...");
    time::sleep(Duration::from_secs(5)).await;
    
    // Reuse connections
    println!("Reusing connections...");
    for peer_id in &peer_ids {
        if let Some(connection) = connection_manager.get_connection(peer_id) {
            println!("Reused connection to peer {}", peer_id);
        } else {
            println!("No connection available for peer {}", peer_id);
        }
    }
    
    // Get updated connection pool statistics
    let stats = connection_manager.get_connection_stats();
    println!("Updated connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    // Prune the connection pool
    println!("Pruning connection pool...");
    connection_manager.prune_connections();
    
    // Get updated connection pool statistics
    let stats = connection_manager.get_connection_stats();
    println!("Updated connection pool statistics after pruning:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    // Close connections
    println!("Closing connections...");
    for peer_id in &peer_ids {
        match connection_manager.close_connection(peer_id).await {
            Ok(_) => println!("Closed connection to peer {}", peer_id),
            Err(e) => println!("Failed to close connection to peer {}: {}", peer_id, e),
        }
    }
    
    // Get final connection pool statistics
    let stats = connection_manager.get_connection_stats();
    println!("Final connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    println!("WebRTC connection pool example completed");
    
    Ok(())
}