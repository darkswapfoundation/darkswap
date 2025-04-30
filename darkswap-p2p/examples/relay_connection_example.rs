use darkswap_p2p::{
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig, RelayConnectionStatus},
    relay_discovery::{RelayDiscoveryConfig},
    connection_pool::ConnectionPoolConfig,
    webrtc_signaling_client::WebRtcSignalingClient,
    Error,
};
use libp2p::{Multiaddr, PeerId};
use std::{sync::Arc, time::Duration};
use tokio::time;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting relay connection pool example");
    
    // Create a local peer ID
    let local_peer_id = PeerId::random();
    println!("Local peer ID: {}", local_peer_id);
    
    // Create a WebRTC signaling client
    let signaling_client = Arc::new(WebRtcSignalingClient::new(local_peer_id.clone()));
    
    // Connect to the signaling server
    println!("Connecting to signaling server...");
    signaling_client.connect("ws://localhost:9001/signaling").await?;
    println!("Connected to signaling server");
    
    // Create some test relay peer IDs and addresses
    let relay_id1 = PeerId::random();
    let relay_id2 = PeerId::random();
    let relay_id3 = PeerId::random();
    
    let relay_addr1 = "/ip4/127.0.0.1/tcp/9002".parse::<Multiaddr>()?;
    let relay_addr2 = "/ip4/127.0.0.1/tcp/9003".parse::<Multiaddr>()?;
    let relay_addr3 = "/ip4/127.0.0.1/tcp/9004".parse::<Multiaddr>()?;
    
    // Create relay discovery configuration
    let relay_discovery_config = RelayDiscoveryConfig {
        bootstrap_relays: vec![
            (relay_id1.clone(), relay_addr1.clone()),
            (relay_id2.clone(), relay_addr2.clone()),
        ],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false, // Disable for this example
        enable_mdns_discovery: false, // Disable for this example
    };
    
    // Create connection pool configuration
    let connection_pool_config = ConnectionPoolConfig {
        max_connections: 10,
        ttl: Duration::from_secs(300),
        max_age: Duration::from_secs(3600),
        enable_reuse: true,
    };
    
    // Create relay connection pool configuration
    let relay_pool_config = RelayConnectionPoolConfig {
        connection_pool_config,
        relay_discovery_config,
        max_relay_connections: 3,
        min_relay_connections: 1,
        connection_check_interval: Duration::from_secs(10),
        auto_connect: true,
    };
    
    // Create relay connection pool
    let relay_pool = RelayConnectionPool::new(
        relay_pool_config,
        local_peer_id.clone(),
        signaling_client,
    );
    
    // Add another relay
    relay_pool.add_relay(relay_id3.clone(), vec![relay_addr3.clone()]);
    
    // Start the relay connection pool
    println!("Starting relay connection pool...");
    relay_pool.start().await?;
    println!("Relay connection pool started");
    
    // Wait for connections to be established
    println!("Waiting for relay connections to be established...");
    time::sleep(Duration::from_secs(2)).await;
    
    // Check relay connections
    let connections = relay_pool.get_relay_connections();
    println!("Relay connections:");
    for (peer_id, status) in &connections {
        println!("  {}: {:?}", peer_id, status);
    }
    
    // Get connection stats
    let stats = relay_pool.get_connection_stats();
    println!("Connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    // Try to connect to a peer through a relay
    let peer_id = PeerId::random();
    println!("Connecting to peer {} through relay...", peer_id);
    match relay_pool.connect_via_relay(&peer_id).await {
        Ok(_) => println!("Connected to peer {} through relay", peer_id),
        Err(e) => println!("Failed to connect to peer {} through relay: {}", peer_id, e),
    }
    
    // Try to connect to the best relay
    println!("Connecting to best relay...");
    match relay_pool.connect_to_best_relay().await {
        Ok(connection) => println!("Connected to best relay: {}", connection.peer_id),
        Err(e) => println!("Failed to connect to best relay: {}", e),
    }
    
    // Check connections again
    println!("Checking connections...");
    relay_pool.check_connections().await?;
    
    // Get updated relay connections
    let connections = relay_pool.get_relay_connections();
    println!("Updated relay connections:");
    for (peer_id, status) in &connections {
        println!("  {}: {:?}", peer_id, status);
    }
    
    // Get updated connection stats
    let stats = relay_pool.get_connection_stats();
    println!("Updated connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    // Disconnect from a relay
    if !connections.is_empty() {
        let (peer_id, _) = &connections[0];
        println!("Disconnecting from relay {}...", peer_id);
        match relay_pool.disconnect_from_relay(peer_id).await {
            Ok(_) => println!("Disconnected from relay {}", peer_id),
            Err(e) => println!("Failed to disconnect from relay {}: {}", peer_id, e),
        }
    }
    
    // Wait a bit
    println!("Waiting for 5 seconds...");
    time::sleep(Duration::from_secs(5)).await;
    
    // Check connections one more time
    println!("Checking connections one more time...");
    relay_pool.check_connections().await?;
    
    // Get final relay connections
    let connections = relay_pool.get_relay_connections();
    println!("Final relay connections:");
    for (peer_id, status) in &connections {
        println!("  {}: {:?}", peer_id, status);
    }
    
    // Get final connection stats
    let stats = relay_pool.get_connection_stats();
    println!("Final connection pool statistics:");
    println!("  Total connections: {}", stats.total_connections);
    println!("  In-use connections: {}", stats.in_use_connections);
    println!("  Idle connections: {}", stats.idle_connections);
    println!("  Peers: {}", stats.peers);
    println!("  In-use peers: {}", stats.in_use_peers);
    
    println!("Relay connection pool example completed");
    
    Ok(())
}