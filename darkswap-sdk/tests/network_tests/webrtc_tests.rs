use darkswap_sdk::{DarkSwap, config::Config};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::test]
async fn test_webrtc_transport() {
    // Skip test if not running in a browser environment
    #[cfg(not(target_arch = "wasm32"))]
    {
        println!("Skipping WebRTC test on non-WASM platform");
        return;
    }

    #[cfg(target_arch = "wasm32")]
    {
        // Initialize two nodes with WebRTC transport
        let mut config1 = Config::default();
        config1.network.listen_port = 10030;
        config1.network.enable_webrtc = true;
        config1.network.ice_servers = vec![
            "stun:stun.l.google.com:19302".to_string(),
        ];
        
        let mut config2 = Config::default();
        config2.network.listen_port = 10031;
        config2.network.enable_webrtc = true;
        config2.network.ice_servers = vec![
            "stun:stun.l.google.com:19302".to_string(),
        ];
        
        // Create nodes
        let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
        let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
        
        // Start nodes
        node1.start().await.expect("Failed to start first node");
        node2.start().await.expect("Failed to start second node");
        
        // Wait for nodes to start
        sleep(Duration::from_secs(1)).await;
        
        // Get peer ID and WebRTC address of second node
        let peer_id2 = node2.peer_id();
        let webrtc_addr2 = node2.webrtc_address().await.expect("Failed to get WebRTC address");
        
        // Connect first node to second node using WebRTC
        node1.connect_peer(peer_id2, webrtc_addr2).await.expect("Failed to connect via WebRTC");
        
        // Wait for connection to establish
        sleep(Duration::from_secs(2)).await;
        
        // Verify connection
        let connected_peers = node1.connected_peers().await;
        assert!(connected_peers.contains(&peer_id2), "WebRTC connection failed");
        
        // Test sending a message over WebRTC
        let test_message = "Hello via WebRTC";
        node1.send_message(peer_id2, test_message.as_bytes().to_vec()).await.expect("Failed to send message");
        
        // Wait for message to be received
        sleep(Duration::from_millis(500)).await;
        
        // Verify connection is still active
        let connected_peers = node1.connected_peers().await;
        assert!(connected_peers.contains(&peer_id2), "Connection lost after sending message");
        
        // Disconnect
        node1.disconnect_peer(peer_id2).await.expect("Failed to disconnect from peer");
        
        // Wait for disconnection
        sleep(Duration::from_millis(500)).await;
        
        // Verify disconnection
        let connected_peers = node1.connected_peers().await;
        assert!(!connected_peers.contains(&peer_id2), "WebRTC disconnection failed");
        
        // Shutdown nodes
        node1.shutdown().await.expect("Failed to shutdown first node");
        node2.shutdown().await.expect("Failed to shutdown second node");
    }
}

#[tokio::test]
async fn test_webrtc_signaling() {
    // Skip test if not running in a browser environment
    #[cfg(not(target_arch = "wasm32"))]
    {
        println!("Skipping WebRTC signaling test on non-WASM platform");
        return;
    }

    #[cfg(target_arch = "wasm32")]
    {
        // Initialize signaling server (in a real test, this would be an external server)
        let signaling_url = "ws://localhost:8765";
        
        // Initialize two nodes with WebRTC transport and signaling
        let mut config1 = Config::default();
        config1.network.enable_webrtc = true;
        config1.network.signaling_server_url = Some(signaling_url.to_string());
        config1.network.ice_servers = vec![
            "stun:stun.l.google.com:19302".to_string(),
        ];
        
        let mut config2 = Config::default();
        config2.network.enable_webrtc = true;
        config2.network.signaling_server_url = Some(signaling_url.to_string());
        config2.network.ice_servers = vec![
            "stun:stun.l.google.com:19302".to_string(),
        ];
        
        // Create nodes
        let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
        let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
        
        // Start nodes
        node1.start().await.expect("Failed to start first node");
        node2.start().await.expect("Failed to start second node");
        
        // Wait for nodes to connect to signaling server
        sleep(Duration::from_secs(1)).await;
        
        // Get peer ID of second node
        let peer_id2 = node2.peer_id();
        
        // Connect first node to second node via signaling
        node1.connect_via_signaling(peer_id2).await.expect("Failed to connect via signaling");
        
        // Wait for connection to establish
        sleep(Duration::from_secs(2)).await;
        
        // Verify connection
        let connected_peers = node1.connected_peers().await;
        assert!(connected_peers.contains(&peer_id2), "WebRTC signaling connection failed");
        
        // Shutdown nodes
        node1.shutdown().await.expect("Failed to shutdown first node");
        node2.shutdown().await.expect("Failed to shutdown second node");
    }
}