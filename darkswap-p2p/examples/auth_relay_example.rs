use darkswap_p2p::{
    auth::{AuthManagerConfig, AuthMethod, AuthorizationLevel},
    connection_pool::ConnectionPoolConfig,
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig, RelayConnectionStatus},
    relay_discovery::RelayDiscoveryConfig,
    webrtc_signaling_client::WebRtcSignalingClient,
    error::Error,
};
use libp2p::PeerId;
use std::{
    collections::HashSet,
    sync::Arc,
    time::Duration,
};
use tokio::time;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting authenticated relay example");
    
    // Create a local peer ID
    let local_peer_id = PeerId::random();
    println!("Local peer ID: {}", local_peer_id);
    
    // Create a WebRTC signaling client
    let signaling_client = Arc::new(WebRtcSignalingClient::new(local_peer_id.clone()));
    
    // Connect to the signaling server
    println!("Connecting to signaling server...");
    signaling_client.connect("ws://localhost:9001/signaling").await?;
    println!("Connected to signaling server");
    
    // Create some test relay peer IDs
    let relay_id1 = PeerId::random();
    let relay_id2 = PeerId::random();
    let relay_id3 = PeerId::random();
    
    println!("Relay 1: {}", relay_id1);
    println!("Relay 2: {}", relay_id2);
    println!("Relay 3: {}", relay_id3);
    
    // Create a set of trusted peers
    let mut trusted_peers = HashSet::new();
    trusted_peers.insert(relay_id1.clone());
    
    // Create a set of banned peers
    let mut banned_peers = HashSet::new();
    banned_peers.insert(relay_id3.clone());
    
    // Create authentication configuration
    let auth_config = AuthManagerConfig {
        auth_method: AuthMethod::SharedKey,
        shared_key: Some(b"secret-key".to_vec()),
        token_ttl: Duration::from_secs(3600),
        challenge_ttl: Duration::from_secs(60),
        trusted_peers,
        banned_peers,
        default_auth_level: AuthorizationLevel::Basic,
        require_auth: true,
    };
    
    // Create connection pool configuration
    let connection_pool_config = ConnectionPoolConfig::default();
    
    // Create relay discovery configuration
    let relay_discovery_config = RelayDiscoveryConfig {
        bootstrap_relays: vec![
            (relay_id1.clone(), "/ip4/127.0.0.1/tcp/9002".parse()?),
            (relay_id2.clone(), "/ip4/127.0.0.1/tcp/9003".parse()?),
            (relay_id3.clone(), "/ip4/127.0.0.1/tcp/9004".parse()?),
        ],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create relay connection pool configuration
    let relay_pool_config = RelayConnectionPoolConfig {
        connection_pool_config,
        relay_discovery_config,
        auth_config: Some(auth_config),
        max_relay_connections: 3,
        min_relay_connections: 1,
        connection_check_interval: Duration::from_secs(10),
        auto_connect: false, // Disable auto-connect for this example
        require_relay_auth: true, // Require authentication for relays
        min_relay_auth_level: AuthorizationLevel::Relay,
    };
    
    // Create relay connection pool
    let relay_pool = RelayConnectionPool::new(
        relay_pool_config,
        local_peer_id.clone(),
        signaling_client,
    );
    
    // Start the relay connection pool
    println!("Starting relay connection pool...");
    relay_pool.start().await?;
    println!("Relay connection pool started");
    
    // Try to connect to relay 1 (trusted)
    println!("\nTrying to connect to relay 1 (trusted)...");
    match relay_pool.connect_to_relay(&relay_id1).await {
        Ok(_) => println!("Connected to relay 1 (trusted)"),
        Err(e) => println!("Failed to connect to relay 1 (trusted): {}", e),
    }
    
    // Try to connect to relay 2 (not authenticated)
    println!("\nTrying to connect to relay 2 (not authenticated)...");
    match relay_pool.connect_to_relay(&relay_id2).await {
        Ok(_) => println!("Connected to relay 2 (not authenticated)"),
        Err(e) => println!("Failed to connect to relay 2 (not authenticated): {}", e),
    }
    
    // Try to connect to relay 3 (banned)
    println!("\nTrying to connect to relay 3 (banned)...");
    match relay_pool.connect_to_relay(&relay_id3).await {
        Ok(_) => println!("Connected to relay 3 (banned)"),
        Err(e) => println!("Failed to connect to relay 3 (banned): {}", e),
    }
    
    // Authenticate relay 2
    println!("\nAuthenticating relay 2...");
    
    // Generate a challenge for relay 2
    let challenge = relay_pool.generate_relay_challenge(&relay_id2).await?;
    println!("Generated challenge for relay 2: {:?}", challenge);
    
    // In a real implementation, the relay would sign the challenge with its private key
    // For this example, we'll use the shared key to create a response
    let key = ring::hmac::Key::new(ring::hmac::HMAC_SHA256, b"secret-key");
    let tag = ring::hmac::sign(&key, &challenge);
    let response = tag.as_ref().to_vec();
    
    // Verify the challenge response
    match relay_pool.verify_relay_challenge_response(&relay_id2, &response).await {
        Ok(_) => println!("Relay 2 authenticated successfully"),
        Err(e) => println!("Failed to authenticate relay 2: {}", e),
    }
    
    // Try to connect to relay 2 again (now authenticated)
    println!("\nTrying to connect to relay 2 (now authenticated)...");
    match relay_pool.connect_to_relay(&relay_id2).await {
        Ok(_) => println!("Connected to relay 2 (now authenticated)"),
        Err(e) => println!("Failed to connect to relay 2 (now authenticated): {}", e),
    }
    
    // Get relay connection status
    println!("\nRelay connection status:");
    println!("Relay 1: {:?}", relay_pool.get_relay_status(&relay_id1));
    println!("Relay 2: {:?}", relay_pool.get_relay_status(&relay_id2));
    println!("Relay 3: {:?}", relay_pool.get_relay_status(&relay_id3));
    
    // Try to connect to a peer through a relay
    let peer_id = PeerId::random();
    println!("\nTrying to connect to peer {} through relay...", peer_id);
    match relay_pool.connect_via_relay(&peer_id).await {
        Ok(_) => println!("Connected to peer {} through relay", peer_id),
        Err(e) => println!("Failed to connect to peer {} through relay: {}", peer_id, e),
    }
    
    // Wait a bit
    println!("\nWaiting for 5 seconds...");
    time::sleep(Duration::from_secs(5)).await;
    
    // Check connections
    println!("\nChecking connections...");
    relay_pool.check_connections().await?;
    
    // Get updated relay connections
    let connections = relay_pool.get_relay_connections();
    println!("\nUpdated relay connections:");
    for (peer_id, status) in &connections {
        println!("  {}: {:?}", peer_id, status);
    }
    
    // Disconnect from relays
    println!("\nDisconnecting from relays...");
    for (peer_id, _) in &connections {
        match relay_pool.disconnect_from_relay(peer_id).await {
            Ok(_) => println!("Disconnected from relay {}", peer_id),
            Err(e) => println!("Failed to disconnect from relay {}: {}", peer_id, e),
        }
    }
    
    println!("\nAuthenticated relay example completed");
    
    Ok(())
}