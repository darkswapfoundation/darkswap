use darkswap_sdk::{DarkSwap, config::Config};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::test]
async fn test_peer_connection() {
    // Initialize two nodes with different ports
    let mut config1 = Config::default();
    config1.network.listen_port = 10000;
    
    let mut config2 = Config::default();
    config2.network.listen_port = 10001;
    
    let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
    let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
    
    // Start nodes
    node1.start().await.expect("Failed to start first node");
    node2.start().await.expect("Failed to start second node");
    
    // Wait for nodes to start
    sleep(Duration::from_millis(500)).await;
    
    // Get peer ID and address of second node
    let peer_id2 = node2.peer_id();
    let addrs2 = node2.listen_addresses().await.expect("Failed to get listen addresses");
    let addr2 = addrs2.first().expect("No listen addresses").clone();
    
    // Connect first node to second node
    node1.connect_peer(peer_id2, addr2).await.expect("Failed to connect to peer");
    
    // Wait for connection to establish
    sleep(Duration::from_millis(500)).await;
    
    // Verify connection
    let connected_peers = node1.connected_peers().await;
    assert!(connected_peers.contains(&peer_id2), "Peer connection failed");
    
    // Disconnect
    node1.disconnect_peer(peer_id2).await.expect("Failed to disconnect from peer");
    
    // Wait for disconnection
    sleep(Duration::from_millis(500)).await;
    
    // Verify disconnection
    let connected_peers = node1.connected_peers().await;
    assert!(!connected_peers.contains(&peer_id2), "Peer disconnection failed");
    
    // Shutdown nodes
    node1.shutdown().await.expect("Failed to shutdown first node");
    node2.shutdown().await.expect("Failed to shutdown second node");
}

#[tokio::test]
async fn test_peer_discovery() {
    // Initialize three nodes with different ports
    let mut config1 = Config::default();
    config1.network.listen_port = 10002;
    
    let mut config2 = Config::default();
    config2.network.listen_port = 10003;
    
    let mut config3 = Config::default();
    config3.network.listen_port = 10004;
    
    let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
    let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
    let mut node3 = DarkSwap::new(config3).expect("Failed to create third node");
    
    // Start nodes
    node1.start().await.expect("Failed to start first node");
    node2.start().await.expect("Failed to start second node");
    node3.start().await.expect("Failed to start third node");
    
    // Wait for nodes to start
    sleep(Duration::from_millis(500)).await;
    
    // Get peer IDs
    let peer_id1 = node1.peer_id();
    let peer_id2 = node2.peer_id();
    let peer_id3 = node3.peer_id();
    
    // Get addresses
    let addrs1 = node1.listen_addresses().await.expect("Failed to get listen addresses");
    let addr1 = addrs1.first().expect("No listen addresses").clone();
    
    let addrs2 = node2.listen_addresses().await.expect("Failed to get listen addresses");
    let addr2 = addrs2.first().expect("No listen addresses").clone();
    
    // Connect node2 to node1
    node2.connect_peer(peer_id1, addr1).await.expect("Failed to connect node2 to node1");
    
    // Connect node3 to node2
    node3.connect_peer(peer_id2, addr2).await.expect("Failed to connect node3 to node2");
    
    // Wait for peer discovery
    sleep(Duration::from_secs(2)).await;
    
    // Node3 should discover node1 through node2
    let discovered_peers = node3.discovered_peers().await;
    assert!(discovered_peers.contains(&peer_id1), "Peer discovery failed");
    
    // Shutdown nodes
    node1.shutdown().await.expect("Failed to shutdown first node");
    node2.shutdown().await.expect("Failed to shutdown second node");
    node3.shutdown().await.expect("Failed to shutdown third node");
}