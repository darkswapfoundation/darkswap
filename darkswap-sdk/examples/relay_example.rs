//! DarkSwap Relay Example
//!
//! This example demonstrates how to use the relay functionality in the DarkSwap SDK.
//! It connects to a relay server, establishes a connection with another peer via relay,
//! and sends messages through the relay connection.

use anyhow::Result;
use darkswap_sdk::{
    config::Config,
    p2p::{P2PNetwork, PeerId},
    types::Event,
};
use libp2p::core::multiaddr::Multiaddr;
use std::str::FromStr;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();
    
    // Create event channel
    let (tx, mut rx) = mpsc::channel(100);
    
    // Create configuration
    let mut config = Config::default();
    
    // Add relay server
    config.p2p.relay_servers.push(
        "/ip4/127.0.0.1/tcp/9002/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
            .parse::<Multiaddr>()
            .unwrap(),
    );
    
    // Create P2P network
    let mut network = P2PNetwork::new(&config, tx.clone())?;
    
    // Start the network
    network.start().await?;
    
    println!("Local peer ID: {}", network.local_peer_id());
    
    // Parse the peer ID to connect to
    let peer_id_str = std::env::args().nth(1).unwrap_or_else(|| {
        println!("Usage: {} <peer_id>", std::env::args().nth(0).unwrap());
        std::process::exit(1);
    });
    
    let peer_id = PeerId::from_str(&peer_id_str)?;
    
    // Connect to the peer via relay
    let relay_id = network.connect_via_relay(peer_id).await?;
    
    println!("Connected to peer {} via relay (ID: {})", peer_id, relay_id);
    
    // Send a message to the peer
    let message = "Hello from relay example!";
    network.send_via_relay(peer_id, &relay_id, message.as_bytes().to_vec()).await?;
    
    println!("Sent message to peer: {}", message);
    
    // Wait for events
    println!("Waiting for events. Press Ctrl+C to exit.");
    
    // Process events
    while let Some(event) = rx.recv().await {
        match event {
            Event::P2P(p2p_event) => {
                println!("P2P event: {:?}", p2p_event);
            }
            Event::Trade(trade_event) => {
                println!("Trade event: {:?}", trade_event);
            }
            Event::Wallet(wallet_event) => {
                println!("Wallet event: {:?}", wallet_event);
            }
            Event::Error(error) => {
                println!("Error: {}", error);
            }
        }
    }
    
    // Close the relay connection
    network.close_relay(&relay_id).await?;
    
    println!("Closed relay connection: {}", relay_id);
    
    // Stop the network
    network.stop().await?;
    
    Ok(())
}