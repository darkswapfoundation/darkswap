//! Advanced WebRTC transport example
//!
//! This example demonstrates how to use the WebRTC connection manager for peer-to-peer communication.
//! It creates a WebRTC connection manager, connects to a signaling server, and establishes a WebRTC connection.

use darkswap_p2p::{
    WebRtcSignalingClient,
    WebRtcConnectionManager,
    error::Error,
};
use libp2p::{
    PeerId,
    identity,
};
use std::{
    sync::Arc,
    time::Duration,
};
use tokio::time;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    // Parse command line arguments
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        println!("Usage: {} <signaling-server-url> <peer-id>", args[0]);
        println!("Example: {} ws://localhost:9001/signaling 12D3KooWRHV8pjHVoVxmvEgEHSW7yFRoUxp38DeQj7K3KKEjVHjR", args[0]);
        return Ok(());
    }
    
    let signaling_server_url = &args[1];
    let peer_id_str = &args[2];
    
    // Create a random identity
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(local_key.public());
    
    println!("Local peer id: {}", local_peer_id);
    
    // Create a WebRTC signaling client
    let webrtc_signaling_client = WebRtcSignalingClient::new(local_peer_id.clone());
    
    // Connect to the signaling server
    webrtc_signaling_client.connect(signaling_server_url).await?;
    
    // Create a WebRTC connection manager
    let webrtc_connection_manager = WebRtcConnectionManager::new(
        local_peer_id.clone(),
        Arc::new(webrtc_signaling_client),
    );
    
    // Parse the peer ID to connect to
    let peer_id = PeerId::from_bytes(&hex::decode(peer_id_str)?)?;
    
    // Create a connection to the peer
    match webrtc_connection_manager.create_connection(&peer_id).await {
        Ok(connection) => {
            println!("Connected to peer: {}", connection.peer_id);
            println!("Connection state: {:?}", connection.state);
            println!("ICE connection state: {:?}", connection.ice_connection_state);
            println!("Signaling state: {:?}", connection.signaling_state);
            
            // Send a message
            if let Some(mut data_channel) = connection.data_channels.get("data") {
                data_channel.send(b"Hello from advanced example!".to_vec()).await?;
                println!("Sent message");
                
                // Receive a message
                match tokio::time::timeout(Duration::from_secs(10), data_channel.receive()).await {
                    Ok(Ok(data)) => {
                        println!("Received message: {}", String::from_utf8_lossy(&data));
                    }
                    Ok(Err(e)) => {
                        println!("Error receiving message: {}", e);
                    }
                    Err(_) => {
                        println!("Timeout waiting for message");
                    }
                }
            }
            
            // Keep the connection open for a while
            time::sleep(Duration::from_secs(10)).await;
            
            // Close the connection
            webrtc_connection_manager.close_connection(&peer_id).await?;
            println!("Connection closed");
        }
        Err(e) => {
            println!("Error connecting to peer: {}", e);
        }
    }
    
    Ok(())
}