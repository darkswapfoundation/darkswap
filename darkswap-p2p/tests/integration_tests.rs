use darkswap_p2p::{
    connection_pool::{ConnectionPool, ConnectionPoolConfig},
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig},
    relay_discovery::{RelayDiscoveryConfig, RelayInfo},
    webrtc_connection::{WebRtcConnection, WebRtcConnectionManager},
    webrtc_signaling_client::WebRtcSignalingClient,
    error::Error,
};
use libp2p::{Multiaddr, PeerId};
use std::{sync::Arc, time::Duration};
use tokio::sync::mpsc;

// This test requires a running signaling server
// It's marked as ignored by default since it requires external resources
#[tokio::test]
#[ignore]
async fn test_p2p_system_integration() {
    // Initialize logging
    let _ = env_logger::try_init();
    
    // Create two peer IDs
    let peer_id1 = PeerId::random();
    let peer_id2 = PeerId::random();
    
    println!("Peer 1: {}", peer_id1);
    println!("Peer 2: {}", peer_id2);
    
    // Create signaling clients
    let signaling_url = "ws://localhost:9001/signaling";
    let signaling_client1 = Arc::new(WebRtcSignalingClient::new(peer_id1.clone()));
    let signaling_client2 = Arc::new(WebRtcSignalingClient::new(peer_id2.clone()));
    
    // Connect to signaling server
    println!("Connecting to signaling server...");
    signaling_client1.connect(signaling_url).await.unwrap();
    signaling_client2.connect(signaling_url).await.unwrap();
    println!("Connected to signaling server");
    
    // Create connection pools
    let pool_config = ConnectionPoolConfig::default();
    let connection_pool1 = Arc::new(ConnectionPool::new(pool_config.clone()));
    let connection_pool2 = Arc::new(ConnectionPool::new(pool_config));
    
    // Create WebRTC connection managers
    let connection_manager1 = Arc::new(WebRtcConnectionManager::with_connection_pool(
        peer_id1.clone(),
        signaling_client1.clone(),
        connection_pool1.clone(),
    ));
    
    let connection_manager2 = Arc::new(WebRtcConnectionManager::with_connection_pool(
        peer_id2.clone(),
        signaling_client2.clone(),
        connection_pool2.clone(),
    ));
    
    // Create relay discovery configurations
    let relay_discovery_config1 = RelayDiscoveryConfig {
        bootstrap_relays: vec![],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    let relay_discovery_config2 = relay_discovery_config1.clone();
    
    // Create relay connection pool configurations
    let relay_pool_config1 = RelayConnectionPoolConfig {
        connection_pool_config: pool_config.clone(),
        relay_discovery_config: relay_discovery_config1,
        max_relay_connections: 3,
        min_relay_connections: 1,
        connection_check_interval: Duration::from_secs(10),
        auto_connect: false,
    };
    
    let relay_pool_config2 = RelayConnectionPoolConfig {
        connection_pool_config: pool_config.clone(),
        relay_discovery_config: relay_discovery_config2,
        max_relay_connections: 3,
        min_relay_connections: 1,
        connection_check_interval: Duration::from_secs(10),
        auto_connect: false,
    };
    
    // Create relay connection pools
    let relay_pool1 = RelayConnectionPool::new(
        relay_pool_config1,
        peer_id1.clone(),
        signaling_client1.clone(),
    );
    
    let relay_pool2 = RelayConnectionPool::new(
        relay_pool_config2,
        peer_id2.clone(),
        signaling_client2.clone(),
    );
    
    // Start the relay connection pools
    relay_pool1.start().await.unwrap();
    relay_pool2.start().await.unwrap();
    
    // Add peer2 as a relay for peer1
    let peer2_addr = format!("/ip4/127.0.0.1/tcp/0/p2p/{}", peer_id2).parse::<Multiaddr>().unwrap();
    relay_pool1.add_relay(peer_id2.clone(), vec![peer2_addr]);
    
    // Connect peer1 to peer2 directly (not through relay)
    println!("Connecting peer1 to peer2 directly...");
    let connection = connection_manager1.create_connection(&peer_id2).await.unwrap();
    println!("Connected peer1 to peer2");
    
    // Create a data channel
    let data_channel = connection.data_channels.get("data").unwrap();
    
    // Send a message from peer1 to peer2
    let message = b"Hello from peer1!";
    data_channel.sender.clone().try_send(message.to_vec()).unwrap();
    println!("Sent message from peer1 to peer2");
    
    // Wait a bit for the message to be received
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    // Clean up
    connection_manager1.close_connection(&peer_id2).await.unwrap();
    println!("Closed connection");
    
    // Test relay connection
    // In a real test, we would set up a relay server and test connecting through it
    // For now, we just test the API
    println!("Testing relay connection...");
    let result = relay_pool1.connect_to_best_relay().await;
    println!("Connect to best relay result: {:?}", result);
    
    // Get relay connection status
    let status = relay_pool1.get_relay_status(&peer_id2);
    println!("Relay status for peer2: {:?}", status);
    
    // Get relay connections
    let connections = relay_pool1.get_relay_connections();
    println!("Relay connections: {:?}", connections);
    
    // Get connection stats
    let stats = relay_pool1.get_connection_stats();
    println!("Connection stats: {:?}", stats);
    
    println!("Integration test completed");
}

// This test simulates a network with multiple peers and relays
#[tokio::test]
#[ignore]
async fn test_multi_peer_network() {
    // Initialize logging
    let _ = env_logger::try_init();
    
    // Create peer IDs
    let relay_peer_id = PeerId::random();
    let peer_id1 = PeerId::random();
    let peer_id2 = PeerId::random();
    
    println!("Relay peer: {}", relay_peer_id);
    println!("Peer 1: {}", peer_id1);
    println!("Peer 2: {}", peer_id2);
    
    // Create signaling clients
    let signaling_url = "ws://localhost:9001/signaling";
    let relay_signaling_client = Arc::new(WebRtcSignalingClient::new(relay_peer_id.clone()));
    let signaling_client1 = Arc::new(WebRtcSignalingClient::new(peer_id1.clone()));
    let signaling_client2 = Arc::new(WebRtcSignalingClient::new(peer_id2.clone()));
    
    // Connect to signaling server
    println!("Connecting to signaling server...");
    relay_signaling_client.connect(signaling_url).await.unwrap();
    signaling_client1.connect(signaling_url).await.unwrap();
    signaling_client2.connect(signaling_url).await.unwrap();
    println!("Connected to signaling server");
    
    // Create connection pools
    let pool_config = ConnectionPoolConfig::default();
    let relay_connection_pool = Arc::new(ConnectionPool::new(pool_config.clone()));
    let connection_pool1 = Arc::new(ConnectionPool::new(pool_config.clone()));
    let connection_pool2 = Arc::new(ConnectionPool::new(pool_config.clone()));
    
    // Create WebRTC connection managers
    let relay_connection_manager = Arc::new(WebRtcConnectionManager::with_connection_pool(
        relay_peer_id.clone(),
        relay_signaling_client.clone(),
        relay_connection_pool.clone(),
    ));
    
    let connection_manager1 = Arc::new(WebRtcConnectionManager::with_connection_pool(
        peer_id1.clone(),
        signaling_client1.clone(),
        connection_pool1.clone(),
    ));
    
    let connection_manager2 = Arc::new(WebRtcConnectionManager::with_connection_pool(
        peer_id2.clone(),
        signaling_client2.clone(),
        connection_pool2.clone(),
    ));
    
    // Create relay discovery configurations
    let relay_discovery_config = RelayDiscoveryConfig {
        bootstrap_relays: vec![(relay_peer_id.clone(), format!("/ip4/127.0.0.1/tcp/0/p2p/{}", relay_peer_id).parse().unwrap())],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create relay connection pool configurations
    let relay_pool_config1 = RelayConnectionPoolConfig {
        connection_pool_config: pool_config.clone(),
        relay_discovery_config: relay_discovery_config.clone(),
        max_relay_connections: 3,
        min_relay_connections: 1,
        connection_check_interval: Duration::from_secs(10),
        auto_connect: true,
    };
    
    let relay_pool_config2 = relay_pool_config1.clone();
    
    // Create relay connection pools
    let relay_pool1 = RelayConnectionPool::new(
        relay_pool_config1,
        peer_id1.clone(),
        signaling_client1.clone(),
    );
    
    let relay_pool2 = RelayConnectionPool::new(
        relay_pool_config2,
        peer_id2.clone(),
        signaling_client2.clone(),
    );
    
    // Start the relay connection pools
    relay_pool1.start().await.unwrap();
    relay_pool2.start().await.unwrap();
    
    // Wait for auto-connect to happen
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    // Try to connect peer1 to peer2 through the relay
    println!("Connecting peer1 to peer2 through relay...");
    let result = relay_pool1.connect_via_relay(&peer_id2).await;
    println!("Connect via relay result: {:?}", result);
    
    // In a real test with a real relay server, we would check that the connection was established
    // and test sending messages through the relay
    
    // Get relay connection status
    let status1 = relay_pool1.get_relay_status(&relay_peer_id);
    let status2 = relay_pool2.get_relay_status(&relay_peer_id);
    println!("Relay status for peer1: {:?}", status1);
    println!("Relay status for peer2: {:?}", status2);
    
    // Get relay connections
    let connections1 = relay_pool1.get_relay_connections();
    let connections2 = relay_pool2.get_relay_connections();
    println!("Relay connections for peer1: {:?}", connections1);
    println!("Relay connections for peer2: {:?}", connections2);
    
    println!("Multi-peer network test completed");
}

// This test simulates a load test with many peers and connections
#[tokio::test]
#[ignore]
async fn test_load_test() {
    // Initialize logging
    let _ = env_logger::try_init();
    
    // Create a relay peer ID
    let relay_peer_id = PeerId::random();
    println!("Relay peer: {}", relay_peer_id);
    
    // Create relay signaling client
    let signaling_url = "ws://localhost:9001/signaling";
    let relay_signaling_client = Arc::new(WebRtcSignalingClient::new(relay_peer_id.clone()));
    
    // Connect to signaling server
    println!("Connecting relay to signaling server...");
    relay_signaling_client.connect(signaling_url).await.unwrap();
    println!("Connected relay to signaling server");
    
    // Create relay connection pool
    let pool_config = ConnectionPoolConfig::default();
    let relay_connection_pool = Arc::new(ConnectionPool::new(pool_config.clone()));
    
    // Create relay WebRTC connection manager
    let relay_connection_manager = Arc::new(WebRtcConnectionManager::with_connection_pool(
        relay_peer_id.clone(),
        relay_signaling_client.clone(),
        relay_connection_pool.clone(),
    ));
    
    // Create many peers
    let num_peers = 10; // Adjust based on your system's capacity
    let mut peer_ids = Vec::with_capacity(num_peers);
    let mut signaling_clients = Vec::with_capacity(num_peers);
    let mut connection_pools = Vec::with_capacity(num_peers);
    let mut connection_managers = Vec::with_capacity(num_peers);
    let mut relay_pools = Vec::with_capacity(num_peers);
    
    println!("Creating {} peers...", num_peers);
    for i in 0..num_peers {
        // Create peer ID
        let peer_id = PeerId::random();
        peer_ids.push(peer_id.clone());
        
        // Create signaling client
        let signaling_client = Arc::new(WebRtcSignalingClient::new(peer_id.clone()));
        signaling_clients.push(signaling_client.clone());
        
        // Connect to signaling server
        println!("Connecting peer {} to signaling server...", i);
        signaling_client.connect(signaling_url).await.unwrap();
        
        // Create connection pool
        let connection_pool = Arc::new(ConnectionPool::new(pool_config.clone()));
        connection_pools.push(connection_pool.clone());
        
        // Create WebRTC connection manager
        let connection_manager = Arc::new(WebRtcConnectionManager::with_connection_pool(
            peer_id.clone(),
            signaling_client.clone(),
            connection_pool.clone(),
        ));
        connection_managers.push(connection_manager.clone());
        
        // Create relay discovery configuration
        let relay_discovery_config = RelayDiscoveryConfig {
            bootstrap_relays: vec![(relay_peer_id.clone(), format!("/ip4/127.0.0.1/tcp/0/p2p/{}", relay_peer_id).parse().unwrap())],
            dht_query_interval: Duration::from_secs(300),
            relay_ttl: Duration::from_secs(3600),
            max_relays: 10,
            enable_dht_discovery: false,
            enable_mdns_discovery: false,
        };
        
        // Create relay connection pool configuration
        let relay_pool_config = RelayConnectionPoolConfig {
            connection_pool_config: pool_config.clone(),
            relay_discovery_config,
            max_relay_connections: 3,
            min_relay_connections: 1,
            connection_check_interval: Duration::from_secs(10),
            auto_connect: false,
        };
        
        // Create relay connection pool
        let relay_pool = RelayConnectionPool::new(
            relay_pool_config,
            peer_id.clone(),
            signaling_client.clone(),
        );
        relay_pools.push(relay_pool.clone());
        
        // Start the relay connection pool
        relay_pool.start().await.unwrap();
    }
    
    println!("Created {} peers", num_peers);
    
    // Connect each peer to the relay
    println!("Connecting peers to relay...");
    for (i, relay_pool) in relay_pools.iter().enumerate() {
        println!("Connecting peer {} to relay...", i);
        let result = relay_pool.connect_to_relay(&relay_peer_id).await;
        println!("Connect to relay result for peer {}: {:?}", i, result);
    }
    
    // Connect peers to each other through the relay
    println!("Connecting peers to each other through relay...");
    for i in 0..num_peers {
        for j in 0..num_peers {
            if i != j {
                println!("Connecting peer {} to peer {} through relay...", i, j);
                let result = relay_pools[i].connect_via_relay(&peer_ids[j]).await;
                println!("Connect via relay result for peer {} to peer {}: {:?}", i, j, result);
            }
        }
    }
    
    // Get connection stats
    for (i, relay_pool) in relay_pools.iter().enumerate() {
        let stats = relay_pool.get_connection_stats();
        println!("Connection stats for peer {}: {:?}", i, stats);
    }
    
    println!("Load test completed");
}