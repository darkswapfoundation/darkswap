//! Simple example of a DarkSwap P2P node
//!
//! This example demonstrates how to create a simple DarkSwap P2P node
//! that connects to the network and listens for messages.

use darkswap_p2p::{
    network::{Network, NetworkConfig, NetworkEvent},
    Error,
};
use darkswap_support::types::PeerId;
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();

    // Create a network configuration
    let config = NetworkConfig {
        bootstrap_peers: vec![
            // Add bootstrap peers here
        ],
        topics: vec![
            "darkswap/orderbook/v1".to_string(),
            "darkswap/trade/v1".to_string(),
        ],
        relay_peers: vec![
            // Add relay peers here
        ],
        connection_timeout: Duration::from_secs(30),
    };

    // Create a network
    let mut network = Network::new(config).await?;
    println!("Local peer ID: {}", network.local_peer_id());

    // Listen on a local address
    network.listen_on("/ip4/127.0.0.1/tcp/0").await?;

    // Subscribe to topics
    network.subscribe("darkswap/orderbook/v1")?;
    network.subscribe("darkswap/trade/v1")?;

    // Start a task to handle events
    let mut event_handler = tokio::spawn(async move {
        while let Some(event) = network.next_event().await {
            match event {
                NetworkEvent::PeerConnected(peer_id) => {
                    println!("Peer connected: {}", peer_id);
                }
                NetworkEvent::PeerDisconnected(peer_id) => {
                    println!("Peer disconnected: {}", peer_id);
                }
                NetworkEvent::MessageReceived { peer_id, topic, message } => {
                    println!(
                        "Message received from {} on topic {}: {:?}",
                        peer_id, topic, message
                    );
                }
                NetworkEvent::RelayReserved { relay_peer_id, reservation_id } => {
                    println!(
                        "Relay reserved: {} with reservation ID {}",
                        relay_peer_id, reservation_id
                    );
                }
                NetworkEvent::ConnectedThroughRelay { relay_peer_id, dst_peer_id } => {
                    println!(
                        "Connected through relay {} to {}",
                        relay_peer_id, dst_peer_id
                    );
                }
            }
        }
    });

    // Wait for a while
    sleep(Duration::from_secs(60)).await;

    // Abort the event handler
    event_handler.abort();

    Ok(())
}