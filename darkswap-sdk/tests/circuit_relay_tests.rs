//! Tests for the circuit relay functionality

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    p2p::circuit_relay::{CircuitRelay, RelayConfig},
    types::Event,
};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

#[tokio::test]
async fn test_circuit_relay_creation() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a circuit relay
    let relay_config = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let relay = CircuitRelay::new(relay_config, event_sender).await?;
    
    // Check that the relay is not null
    assert!(Arc::strong_count(&Arc::new(relay)) > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_circuit_relay_local_peer_id() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a circuit relay
    let relay_config = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let relay = CircuitRelay::new(relay_config, event_sender).await?;
    
    // Get local peer ID
    let peer_id = relay.local_peer_id();
    
    // Check that peer ID is not empty
    assert!(!peer_id.to_string().is_empty());
    
    Ok(())
}

#[tokio::test]
async fn test_circuit_relay_listen_addresses() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a circuit relay
    let relay_config = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let relay = CircuitRelay::new(relay_config, event_sender).await?;
    
    // Get listen addresses
    let addresses = relay.listen_addresses();
    
    // Check that there is at least one listen address
    assert!(!addresses.is_empty());
    
    Ok(())
}

#[tokio::test]
async fn test_circuit_relay_add_bootstrap_peer() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a circuit relay
    let relay_config = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let mut relay = CircuitRelay::new(relay_config, event_sender).await?;
    
    // Create another circuit relay
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    let relay_config2 = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let relay2 = CircuitRelay::new(relay_config2, event_sender2).await?;
    
    // Get peer ID of relay2
    let peer_id2 = relay2.local_peer_id();
    
    // Add relay2 as a bootstrap peer for relay
    relay.add_bootstrap_peer(peer_id2).await?;
    
    // Check that relay2 is in the bootstrap peers of relay
    let bootstrap_peers = relay.bootstrap_peers();
    assert!(bootstrap_peers.contains(&peer_id2.to_string()));
    
    Ok(())
}

#[tokio::test]
async fn test_circuit_relay_connect_disconnect() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two circuit relays
    let relay_config1 = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let relay_config2 = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let mut relay1 = CircuitRelay::new(relay_config1, event_sender1).await?;
    let relay2 = CircuitRelay::new(relay_config2, event_sender2).await?;
    
    // Get peer IDs
    let peer_id1 = relay1.local_peer_id();
    let peer_id2 = relay2.local_peer_id();
    
    // Get listen addresses of relay2
    let addresses2 = relay2.listen_addresses();
    
    // Connect relay1 to relay2
    relay1.connect_to_peer(peer_id2, &addresses2[0]).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that relay1 is connected to relay2
    let connected_peers = relay1.connected_peers();
    assert!(connected_peers.contains(&peer_id2.to_string()));
    
    // Disconnect relay1 from relay2
    relay1.disconnect_from_peer(&peer_id2).await?;
    
    // Wait for the disconnection to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that relay1 is disconnected from relay2
    let connected_peers = relay1.connected_peers();
    assert!(!connected_peers.contains(&peer_id2.to_string()));
    
    Ok(())
}

#[tokio::test]
async fn test_circuit_relay_relay_connection() -> Result<()> {
    // Create event channels
    let (event_sender_relay, _event_receiver_relay) = mpsc::channel(100);
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create a circuit relay
    let relay_config = RelayConfig {
        listen_address: "/ip4/127.0.0.1/tcp/0".to_string(),
        bootstrap_peers: vec![],
        enable_mdns: true,
        enable_kad: true,
    };
    
    let relay = CircuitRelay::new(relay_config, event_sender_relay).await?;
    
    // Create two P2P networks
    let (mut network1, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let (mut network2, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Get peer IDs
    let relay_peer_id = relay.local_peer_id();
    let peer_id1 = network1.local_peer_id();
    let peer_id2 = network2.local_peer_id();
    
    // Get listen addresses of relay
    let relay_addresses = relay.listen_addresses();
    
    // Connect network1 to relay
    network1.connect(&relay_peer_id, &relay_addresses[0]).await?;
    
    // Connect network2 to relay
    network2.connect(&relay_peer_id, &relay_addresses[0]).await?;
    
    // Wait for the connections to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that network1 is connected to relay
    let connected_peers1 = network1.connected_peers().await;
    assert!(connected_peers1.contains(&relay_peer_id.to_string()));
    
    // Check that network2 is connected to relay
    let connected_peers2 = network2.connected_peers().await;
    assert!(connected_peers2.contains(&relay_peer_id.to_string()));
    
    // Connect network1 to network2 through relay
    network1.connect_via_relay(&peer_id2, &relay_peer_id).await?;
    
    // Wait for the relay connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Check that network1 is connected to network2
    let connected_peers1 = network1.connected_peers().await;
    assert!(connected_peers1.contains(&peer_id2.to_string()));
    
    // Check that network2 is connected to network1
    let connected_peers2 = network2.connected_peers().await;
    assert!(connected_peers2.contains(&peer_id1.to_string()));
    
    // Subscribe to a topic
    let topic = "test-topic";
    network1.subscribe(topic).await?;
    network2.subscribe(topic).await?;
    
    // Create message handlers
    let messages1 = Arc::new(RwLock::new(Vec::new()));
    let messages1_clone = messages1.clone();
    
    let messages2 = Arc::new(RwLock::new(Vec::new()));
    let messages2_clone = messages2.clone();
    
    // Register message handlers
    network1.on_message(topic, move |peer_id, data| {
        let message = String::from_utf8_lossy(&data).to_string();
        let mut messages = messages1_clone.blocking_write();
        messages.push((peer_id.to_string(), message));
    });
    
    network2.on_message(topic, move |peer_id, data| {
        let message = String::from_utf8_lossy(&data).to_string();
        let mut messages = messages2_clone.blocking_write();
        messages.push((peer_id.to_string(), message));
    });
    
    // Publish a message from network1
    let message = "Hello through relay!";
    network1.publish(topic, message.as_bytes().to_vec()).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Check that network2 received the message
    let received_messages = messages2.read().await;
    assert_eq!(received_messages.len(), 1);
    assert_eq!(received_messages[0].0, peer_id1.to_string());
    assert_eq!(received_messages[0].1, message);
    
    Ok(())
}