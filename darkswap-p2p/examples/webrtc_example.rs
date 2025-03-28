//! WebRTC transport example
//!
//! This example demonstrates how to use the WebRTC transport for peer-to-peer communication.
//! It creates a WebRTC transport, connects to a signaling server, and establishes a WebRTC connection.

use darkswap_p2p::{
    WebRtcTransport,
    error::Error,
};
use libp2p::{
    core::{
        transport::Transport,
        Multiaddr, PeerId,
    },
    identity,
};
use std::time::Duration;
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
    
    // Create a WebRTC transport
    let mut webrtc_transport = WebRtcTransport::new(local_peer_id.clone());
    
    // Set the signaling server URL
    webrtc_transport.set_signaling_server(signaling_server_url.to_string());
    
    // Connect to the signaling server
    webrtc_transport.connect_to_signaling_server().await?;
    
    // Parse the peer ID to connect to
    let peer_id = PeerId::from_bytes(&hex::decode(peer_id_str)?)?;
    
    // Create a multiaddr for the peer
    let addr = format!("/ip4/127.0.0.1/tcp/0/webrtc/p2p/{}", peer_id).parse::<Multiaddr>()?;
    
    // Dial the peer
    let dial_future = webrtc_transport.dial(addr)?;
    
    // Wait for the connection to be established
    match tokio::time::timeout(Duration::from_secs(30), dial_future).await {
        Ok(Ok((connection, _))) => {
            println!("Connected to peer: {}", connection.peer_id);
            
            // Send a message
            if let Some(mut data_channel) = connection.data_channels.get("data") {
                data_channel.send(b"Hello, world!".to_vec()).await?;
                println!("Sent message");
                
                // Receive a message
                match data_channel.receive().await {
                    Ok(data) => {
                        println!("Received message: {}", String::from_utf8_lossy(&data));
                    }
                    Err(e) => {
                        println!("Error receiving message: {}", e);
                    }
                }
            }
            
            // Keep the connection open for a while
            time::sleep(Duration::from_secs(10)).await;
        }
        Ok(Err(e)) => {
            println!("Error connecting to peer: {}", e);
        }
        Err(_) => {
            println!("Timeout connecting to peer");
        }
    }
    
    Ok(())
}