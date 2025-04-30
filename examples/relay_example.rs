use anyhow::Result;
use darkswap::{
    config::Config,
    p2p::P2PNetwork,
    types::Event,
};
use libp2p::PeerId;
use std::{str::FromStr, time::Duration};
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting DarkSwap relay example");
    
    // Create event channel
    let (event_sender, mut event_receiver) = mpsc::channel(100);
    
    // Create configuration
    let mut config = Config::default();
    
    // Add relay servers
    config.p2p.relay_servers = vec![
        "/ip4/127.0.0.1/tcp/9002/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN".parse().unwrap(),
        "/ip4/127.0.0.1/tcp/9003/p2p/12D3KooWRBhwfeEQgoZPmR3sByYn5wCrpSKiLsw56DVNbut4kgaL".parse().unwrap(),
    ];
    
    // Create P2P network
    let mut network = P2PNetwork::new(&config, event_sender)?;
    
    // Start the network
    println!("Starting P2P network...");
    network.start().await?;
    println!("P2P network started");
    
    // Print local peer ID
    println!("Local peer ID: {}", network.local_peer_id());
    
    // Wait for the relay manager to initialize
    tokio::time::sleep(Duration::from_secs(2)).await;
    
    // Print relay connections
    let relay_connections = network.get_relay_connections();
    println!("Relay connections:");
    for (peer_id, status) in &relay_connections {
        println!("  {}: {:?}", peer_id, status);
    }
    
    // Add a custom relay
    let relay_peer_id = PeerId::from_str("12D3KooWQYV9dGMFoRzNStwsQ8NPtXXbiUuEXgXkVxgCRsvV6UQz")?;
    let relay_addr = "/ip4/127.0.0.1/tcp/9004".parse()?;
    println!("Adding custom relay: {}", relay_peer_id);
    network.add_relay(relay_peer_id, vec![relay_addr]);
    
    // Connect to a peer through a relay
    let peer_id = PeerId::from_str("12D3KooWJbJFaZ3k5sNd8DjQgg3aERoKtBAnirEvPV8yp76kEXHB")?;
    println!("Connecting to peer {} through relay...", peer_id);
    match network.connect_via_relay(&peer_id).await {
        Ok(_) => println!("Connected to peer {} through relay", peer_id),
        Err(e) => println!("Failed to connect to peer {} through relay: {}", peer_id, e),
    }
    
    // Print relay status
    if let Some(status) = network.get_relay_status(&relay_peer_id) {
        println!("Relay status for {}: {:?}", relay_peer_id, status);
    } else {
        println!("No relay status for {}", relay_peer_id);
    }
    
    // Print connected relay count
    println!("Connected relay count: {}", network.connected_relay_count());
    
    // Process events
    println!("Processing events for 10 seconds...");
    let mut timeout = tokio::time::interval(Duration::from_secs(10));
    
    loop {
        tokio::select! {
            _ = timeout.tick() => {
                println!("Timeout reached, exiting");
                break;
            }
            Some(event) = event_receiver.recv() => {
                match event {
                    Event::P2PEvent(p2p_event) => {
                        println!("P2P event: {:?}", p2p_event);
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Stop the network
    println!("Stopping P2P network...");
    network.stop().await?;
    println!("P2P network stopped");
    
    println!("DarkSwap relay example completed");
    
    Ok(())
}