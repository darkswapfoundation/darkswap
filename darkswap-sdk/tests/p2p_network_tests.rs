//! Tests for the P2P network functionality

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    network::P2PNetwork,
    types::Event,
};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

#[tokio::test]
async fn test_p2p_network_creation() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a P2P network
    let (network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Check that the network is not null
    assert!(Arc::strong_count(&Arc::new(network)) > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_p2p_network_local_peer_id() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a P2P network
    let (network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Get local peer ID
    let peer_id = network.local_peer_id();
    
    // Check that peer ID is not empty
    assert!(!peer_id.to_string().is_empty());
    
    Ok(())
}

#[tokio::test]
async fn test_p2p_network_subscribe_publish() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a P2P network
    let (mut network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Subscribe to a topic
    let topic = "test-topic";
    network.subscribe(topic).await?;
    
    // Create a message handler
    let messages = Arc::new(RwLock::new(Vec::new()));
    let messages_clone = messages.clone();
    
    // Register the message handler
    network.on_message(topic, move |peer_id, data| {
        let message = String::from_utf8_lossy(&data).to_string();
        let mut messages = messages_clone.blocking_write();
        messages.push((peer_id.to_string(), message));
    });
    
    // Publish a message
    let message = "Hello, world!";
    network.publish(topic, message.as_bytes().to_vec()).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the message was received
    let received_messages = messages.read().await;
    assert_eq!(received_messages.len(), 1);
    assert_eq!(received_messages[0].1, message);
    
    Ok(())
}

#[tokio::test]
async fn test_p2p_network_connect_disconnect() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two P2P networks
    let (mut network1, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let (mut network2, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Get peer IDs
    let peer_id1 = network1.local_peer_id();
    let peer_id2 = network2.local_peer_id();
    
    // Connect the networks
    network1.connect(peer_id2).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the networks are connected
    let peers1 = network1.connected_peers().await?;
    let peers2 = network2.connected_peers().await?;
    
    assert!(peers1.contains(&peer_id2.to_string()));
    assert!(peers2.contains(&peer_id1.to_string()));
    
    // Disconnect the networks
    network1.disconnect(peer_id2).await?;
    
    // Wait for the disconnection to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the networks are disconnected
    let peers1 = network1.connected_peers().await?;
    let peers2 = network2.connected_peers().await?;
    
    assert!(!peers1.contains(&peer_id2.to_string()));
    assert!(!peers2.contains(&peer_id1.to_string()));
    
    Ok(())
}

#[tokio::test]
async fn test_p2p_network_message_routing() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two P2P networks
    let (mut network1, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let (mut network2, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Get peer IDs
    let peer_id1 = network1.local_peer_id();
    let peer_id2 = network2.local_peer_id();
    
    // Connect the networks
    network1.connect(peer_id2).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
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
    let message1 = "Hello from network1!";
    network1.publish(topic, message1.as_bytes().to_vec()).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that network2 received the message
    let received_messages2 = messages2.read().await;
    assert_eq!(received_messages2.len(), 1);
    assert_eq!(received_messages2[0].0, peer_id1.to_string());
    assert_eq!(received_messages2[0].1, message1);
    
    // Publish a message from network2
    let message2 = "Hello from network2!";
    network2.publish(topic, message2.as_bytes().to_vec()).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that network1 received the message
    let received_messages1 = messages1.read().await;
    assert_eq!(received_messages1.len(), 1);
    assert_eq!(received_messages1[0].0, peer_id2.to_string());
    assert_eq!(received_messages1[0].1, message2);
    
    Ok(())
}

#[tokio::test]
async fn test_p2p_network_event_handling() -> Result<()> {
    // Create event channel
    let (event_sender, mut event_receiver) = mpsc::channel(100);
    
    // Create a P2P network
    let (mut network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Create another P2P network
    let (mut other_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Get peer IDs
    let peer_id = network.local_peer_id();
    let other_peer_id = other_network.local_peer_id();
    
    // Connect the networks
    network.connect(other_peer_id).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that a PeerConnected event was sent
    let event = event_receiver.try_recv();
    assert!(event.is_ok());
    
    // Disconnect the networks
    network.disconnect(other_peer_id).await?;
    
    // Wait for the disconnection to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that a PeerDisconnected event was sent
    let event = event_receiver.try_recv();
    assert!(event.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_p2p_network_discovery() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two P2P networks
    let (mut network1, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let (mut network2, _) = darkswap_sdk::p2p::create_memory_network().await?;
    
    // Get peer IDs
    let peer_id1 = network1.local_peer_id();
    let peer_id2 = network2.local_peer_id();
    
    // Add network2 as a bootstrap peer for network1
    network1.add_bootstrap_peer(peer_id2).await?;
    
    // Start discovery
    network1.start_discovery().await?;
    
    // Wait for discovery to find peers
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Check that network1 discovered network2
    let peers = network1.discovered_peers().await?;
    assert!(peers.contains(&peer_id2.to_string()));
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_p2p_network_webrtc_transport() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two P2P networks with WebRTC transport
    let (mut network1, _) = darkswap_sdk::p2p::create_webrtc_network(event_sender1).await?;
    let (mut network2, _) = darkswap_sdk::p2p::create_webrtc_network(event_sender2).await?;
    
    // Get peer IDs
    let peer_id1 = network1.local_peer_id();
    let peer_id2 = network2.local_peer_id();
    
    // Connect the networks
    network1.connect(peer_id2).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Check that the networks are connected
    let peers1 = network1.connected_peers().await?;
    let peers2 = network2.connected_peers().await?;
    
    assert!(peers1.contains(&peer_id2.to_string()));
    assert!(peers2.contains(&peer_id1.to_string()));
    
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
    let message = "Hello over WebRTC!";
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