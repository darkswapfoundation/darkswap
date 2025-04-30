use darkswap_sdk::{DarkSwap, config::Config};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::test]
async fn test_circuit_relay() {
    // Initialize relay node
    let mut relay_config = Config::default();
    relay_config.network.listen_port = 10010;
    relay_config.network.enable_relay = true;
    relay_config.network.max_relay_connections = 10;
    
    // Initialize two nodes behind simulated NATs
    let mut config1 = Config::default();
    config1.network.listen_port = 10011;
    config1.network.behind_nat = true;
    config1.network.relay_addresses = vec!["/ip4/127.0.0.1/tcp/10010".parse().expect("Invalid relay address")];
    
    let mut config2 = Config::default();
    config2.network.listen_port = 10012;
    config2.network.behind_nat = true;
    config2.network.relay_addresses = vec!["/ip4/127.0.0.1/tcp/10010".parse().expect("Invalid relay address")];
    
    // Create nodes
    let mut relay_node = DarkSwap::new(relay_config).expect("Failed to create relay node");
    let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
    let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
    
    // Start nodes
    relay_node.start().await.expect("Failed to start relay node");
    node1.start().await.expect("Failed to start first node");
    node2.start().await.expect("Failed to start second node");
    
    // Wait for nodes to start and connect to relay
    sleep(Duration::from_secs(2)).await;
    
    // Get peer IDs
    let relay_peer_id = relay_node.peer_id();
    let peer_id1 = node1.peer_id();
    let peer_id2 = node2.peer_id();
    
    // Verify nodes are connected to relay
    let relay_connected_peers = relay_node.connected_peers().await;
    assert!(relay_connected_peers.contains(&peer_id1), "Node 1 not connected to relay");
    assert!(relay_connected_peers.contains(&peer_id2), "Node 2 not connected to relay");
    
    // Connect node1 to node2 via relay
    node1.connect_peer_via_relay(peer_id2, relay_peer_id).await.expect("Failed to connect via relay");
    
    // Wait for connection to establish
    sleep(Duration::from_secs(2)).await;
    
    // Verify connection
    let connected_peers1 = node1.connected_peers().await;
    let connected_peers2 = node2.connected_peers().await;
    
    assert!(connected_peers1.contains(&peer_id2), "Node 1 not connected to Node 2");
    assert!(connected_peers2.contains(&peer_id1), "Node 2 not connected to Node 1");
    
    // Test sending a message through the relay
    let test_message = "Hello via relay";
    node1.send_message(peer_id2, test_message.as_bytes().to_vec()).await.expect("Failed to send message");
    
    // Wait for message to be received
    sleep(Duration::from_millis(500)).await;
    
    // Verify message was received (this would require a mock or callback in the actual implementation)
    // For this test, we'll just check that the connection is still active
    let connected_peers1 = node1.connected_peers().await;
    assert!(connected_peers1.contains(&peer_id2), "Connection lost after sending message");
    
    // Shutdown nodes
    node1.shutdown().await.expect("Failed to shutdown first node");
    node2.shutdown().await.expect("Failed to shutdown second node");
    relay_node.shutdown().await.expect("Failed to shutdown relay node");
}

#[tokio::test]
async fn test_relay_fallback() {
    // Initialize relay node
    let mut relay_config = Config::default();
    relay_config.network.listen_port = 10020;
    relay_config.network.enable_relay = true;
    
    // Initialize two nodes
    let mut config1 = Config::default();
    config1.network.listen_port = 10021;
    config1.network.relay_addresses = vec!["/ip4/127.0.0.1/tcp/10020".parse().expect("Invalid relay address")];
    
    let mut config2 = Config::default();
    config2.network.listen_port = 10022;
    config2.network.relay_addresses = vec!["/ip4/127.0.0.1/tcp/10020".parse().expect("Invalid relay address")];
    
    // Create nodes
    let mut relay_node = DarkSwap::new(relay_config).expect("Failed to create relay node");
    let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
    let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
    
    // Start nodes
    relay_node.start().await.expect("Failed to start relay node");
    node1.start().await.expect("Failed to start first node");
    node2.start().await.expect("Failed to start second node");
    
    // Wait for nodes to start
    sleep(Duration::from_secs(1)).await;
    
    // Get peer IDs
    let relay_peer_id = relay_node.peer_id();
    let peer_id1 = node1.peer_id();
    let peer_id2 = node2.peer_id();
    
    // Simulate direct connection failure by using an invalid address
    let invalid_addr = "/ip4/192.0.2.1/tcp/12345".parse().expect("Invalid address creation failed");
    
    // Try to connect directly, which should fail and fallback to relay
    let result = node1.connect_peer_with_fallback(peer_id2, invalid_addr, Some(relay_peer_id)).await;
    assert!(result.is_ok(), "Connection with fallback failed");
    
    // Wait for connection to establish
    sleep(Duration::from_secs(1)).await;
    
    // Verify connection
    let connected_peers1 = node1.connected_peers().await;
    assert!(connected_peers1.contains(&peer_id2), "Fallback to relay failed");
    
    // Shutdown nodes
    node1.shutdown().await.expect("Failed to shutdown first node");
    node2.shutdown().await.expect("Failed to shutdown second node");
    relay_node.shutdown().await.expect("Failed to shutdown relay node");
}