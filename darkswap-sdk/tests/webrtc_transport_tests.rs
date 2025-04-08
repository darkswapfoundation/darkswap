//! Tests for the WebRTC transport functionality

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    p2p::webrtc_transport::{WebRTCTransport, WebRTCConfig},
    types::Event,
};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_creation() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a WebRTC transport
    let webrtc_config = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport = WebRTCTransport::new(webrtc_config, event_sender).await?;
    
    // Check that the transport is not null
    assert!(Arc::strong_count(&Arc::new(transport)) > 0);
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_local_peer_id() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a WebRTC transport
    let webrtc_config = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport = WebRTCTransport::new(webrtc_config, event_sender).await?;
    
    // Get local peer ID
    let peer_id = transport.local_peer_id();
    
    // Check that peer ID is not empty
    assert!(!peer_id.to_string().is_empty());
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_signaling_connection() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create a WebRTC transport
    let webrtc_config = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport = WebRTCTransport::new(webrtc_config, event_sender).await?;
    
    // Connect to signaling server
    transport.connect_to_signaling_server().await?;
    
    // Check that the transport is connected to the signaling server
    assert!(transport.is_connected_to_signaling_server());
    
    // Disconnect from signaling server
    transport.disconnect_from_signaling_server().await?;
    
    // Check that the transport is disconnected from the signaling server
    assert!(!transport.is_connected_to_signaling_server());
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_peer_connection() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two WebRTC transports
    let webrtc_config1 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let webrtc_config2 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport1 = WebRTCTransport::new(webrtc_config1, event_sender1).await?;
    let transport2 = WebRTCTransport::new(webrtc_config2, event_sender2).await?;
    
    // Get peer IDs
    let peer_id1 = transport1.local_peer_id();
    let peer_id2 = transport2.local_peer_id();
    
    // Connect to signaling server
    transport1.connect_to_signaling_server().await?;
    transport2.connect_to_signaling_server().await?;
    
    // Wait for the connections to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Connect transport1 to transport2
    transport1.connect_to_peer(peer_id2).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Check that transport1 is connected to transport2
    assert!(transport1.is_connected_to_peer(peer_id2));
    
    // Check that transport2 is connected to transport1
    assert!(transport2.is_connected_to_peer(peer_id1));
    
    // Disconnect transport1 from transport2
    transport1.disconnect_from_peer(peer_id2).await?;
    
    // Wait for the disconnection to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that transport1 is disconnected from transport2
    assert!(!transport1.is_connected_to_peer(peer_id2));
    
    // Check that transport2 is disconnected from transport1
    assert!(!transport2.is_connected_to_peer(peer_id1));
    
    // Disconnect from signaling server
    transport1.disconnect_from_signaling_server().await?;
    transport2.disconnect_from_signaling_server().await?;
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_data_channel() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two WebRTC transports
    let webrtc_config1 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let webrtc_config2 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport1 = WebRTCTransport::new(webrtc_config1, event_sender1).await?;
    let transport2 = WebRTCTransport::new(webrtc_config2, event_sender2).await?;
    
    // Get peer IDs
    let peer_id1 = transport1.local_peer_id();
    let peer_id2 = transport2.local_peer_id();
    
    // Connect to signaling server
    transport1.connect_to_signaling_server().await?;
    transport2.connect_to_signaling_server().await?;
    
    // Wait for the connections to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Connect transport1 to transport2
    transport1.connect_to_peer(peer_id2).await?;
    
    // Wait for the connection to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Create data channels
    let channel_name = "test-channel";
    let data_channel1 = transport1.create_data_channel(peer_id2, channel_name).await?;
    
    // Wait for the data channel to be created
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Get the data channel on transport2
    let data_channel2 = transport2.get_data_channel(peer_id1, channel_name).await?;
    
    // Create message handlers
    let messages1 = Arc::new(RwLock::new(Vec::new()));
    let messages1_clone = messages1.clone();
    
    let messages2 = Arc::new(RwLock::new(Vec::new()));
    let messages2_clone = messages2.clone();
    
    // Register message handlers
    data_channel1.on_message(move |data| {
        let message = String::from_utf8_lossy(&data).to_string();
        let mut messages = messages1_clone.blocking_write();
        messages.push(message);
    });
    
    data_channel2.on_message(move |data| {
        let message = String::from_utf8_lossy(&data).to_string();
        let mut messages = messages2_clone.blocking_write();
        messages.push(message);
    });
    
    // Send a message from transport1 to transport2
    let message1 = "Hello from transport1!";
    data_channel1.send(message1.as_bytes()).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that transport2 received the message
    let received_messages2 = messages2.read().await;
    assert_eq!(received_messages2.len(), 1);
    assert_eq!(received_messages2[0], message1);
    
    // Send a message from transport2 to transport1
    let message2 = "Hello from transport2!";
    data_channel2.send(message2.as_bytes()).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that transport1 received the message
    let received_messages1 = messages1.read().await;
    assert_eq!(received_messages1.len(), 1);
    assert_eq!(received_messages1[0], message2);
    
    // Close the data channels
    data_channel1.close().await?;
    data_channel2.close().await?;
    
    // Disconnect transport1 from transport2
    transport1.disconnect_from_peer(peer_id2).await?;
    
    // Disconnect from signaling server
    transport1.disconnect_from_signaling_server().await?;
    transport2.disconnect_from_signaling_server().await?;
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_ice_candidates() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two WebRTC transports
    let webrtc_config1 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let webrtc_config2 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport1 = WebRTCTransport::new(webrtc_config1, event_sender1).await?;
    let transport2 = WebRTCTransport::new(webrtc_config2, event_sender2).await?;
    
    // Get peer IDs
    let peer_id1 = transport1.local_peer_id();
    let peer_id2 = transport2.local_peer_id();
    
    // Connect to signaling server
    transport1.connect_to_signaling_server().await?;
    transport2.connect_to_signaling_server().await?;
    
    // Wait for the connections to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Create ICE candidate handlers
    let ice_candidates1 = Arc::new(RwLock::new(Vec::new()));
    let ice_candidates1_clone = ice_candidates1.clone();
    
    let ice_candidates2 = Arc::new(RwLock::new(Vec::new()));
    let ice_candidates2_clone = ice_candidates2.clone();
    
    // Register ICE candidate handlers
    transport1.on_ice_candidate(peer_id2, move |candidate| {
        let mut ice_candidates = ice_candidates1_clone.blocking_write();
        ice_candidates.push(candidate.to_string());
    });
    
    transport2.on_ice_candidate(peer_id1, move |candidate| {
        let mut ice_candidates = ice_candidates2_clone.blocking_write();
        ice_candidates.push(candidate.to_string());
    });
    
    // Connect transport1 to transport2
    transport1.connect_to_peer(peer_id2).await?;
    
    // Wait for ICE candidates to be gathered
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    // Check that ICE candidates were gathered
    let candidates1 = ice_candidates1.read().await;
    let candidates2 = ice_candidates2.read().await;
    
    assert!(!candidates1.is_empty());
    assert!(!candidates2.is_empty());
    
    // Disconnect transport1 from transport2
    transport1.disconnect_from_peer(peer_id2).await?;
    
    // Disconnect from signaling server
    transport1.disconnect_from_signaling_server().await?;
    transport2.disconnect_from_signaling_server().await?;
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "webrtc")]
async fn test_webrtc_transport_signaling_messages() -> Result<()> {
    // Create event channels
    let (event_sender1, _event_receiver1) = mpsc::channel(100);
    let (event_sender2, _event_receiver2) = mpsc::channel(100);
    
    // Create two WebRTC transports
    let webrtc_config1 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let webrtc_config2 = WebRTCConfig {
        stun_servers: vec!["stun:stun.l.google.com:19302".to_string()],
        turn_servers: vec![],
        signaling_server: "ws://localhost:8080".to_string(),
    };
    
    let transport1 = WebRTCTransport::new(webrtc_config1, event_sender1).await?;
    let transport2 = WebRTCTransport::new(webrtc_config2, event_sender2).await?;
    
    // Get peer IDs
    let peer_id1 = transport1.local_peer_id();
    let peer_id2 = transport2.local_peer_id();
    
    // Create signaling message handlers
    let signaling_messages1 = Arc::new(RwLock::new(Vec::new()));
    let signaling_messages1_clone = signaling_messages1.clone();
    
    let signaling_messages2 = Arc::new(RwLock::new(Vec::new()));
    let signaling_messages2_clone = signaling_messages2.clone();
    
    // Register signaling message handlers
    transport1.on_signaling_message(move |peer_id, message| {
        let mut signaling_messages = signaling_messages1_clone.blocking_write();
        signaling_messages.push((peer_id.to_string(), message.to_string()));
    });
    
    transport2.on_signaling_message(move |peer_id, message| {
        let mut signaling_messages = signaling_messages2_clone.blocking_write();
        signaling_messages.push((peer_id.to_string(), message.to_string()));
    });
    
    // Connect to signaling server
    transport1.connect_to_signaling_server().await?;
    transport2.connect_to_signaling_server().await?;
    
    // Wait for the connections to be established
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Send a signaling message from transport1 to transport2
    let message = "Hello from transport1!";
    transport1.send_signaling_message(peer_id2, message).await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that transport2 received the signaling message
    let received_messages = signaling_messages2.read().await;
    assert_eq!(received_messages.len(), 1);
    assert_eq!(received_messages[0].0, peer_id1.to_string());
    assert_eq!(received_messages[0].1, message);
    
    // Disconnect from signaling server
    transport1.disconnect_from_signaling_server().await?;
    transport2.disconnect_from_signaling_server().await?;
    
    Ok(())
}