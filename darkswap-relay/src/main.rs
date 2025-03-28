//! DarkSwap relay server
//!
//! This is the main entry point for the DarkSwap relay server.
//! It provides relay services for the DarkSwap P2P network, including:
//! - Circuit relay for NAT traversal
//! - WebRTC signaling for browser-to-browser communication
//! - Discovery services for finding peers

mod signaling;

use clap::{Parser, Subcommand};
use libp2p::{
    core::upgrade,
    identity,
    noise,
    relay::{self, v2::relay::Config as RelayConfig},
    swarm::{NetworkBehaviour, SwarmBuilder, SwarmEvent},
    tcp, yamux, PeerId, Transport,
};
use std::{
    error::Error,
    net::{Ipv4Addr, Ipv6Addr},
    time::Duration,
};
use tokio::sync::mpsc;

use signaling::SignalingServer;

/// DarkSwap relay server
#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    /// Subcommand
    #[clap(subcommand)]
    command: Commands,
}

/// Subcommands
#[derive(Subcommand)]
enum Commands {
    /// Start the relay server
    Start {
        /// P2P listen port
        #[clap(long, default_value = "9000")]
        p2p_port: u16,
        
        /// WebRTC signaling port
        #[clap(long, default_value = "9001")]
        signaling_port: u16,
        
        /// Bootstrap peers
        #[clap(long)]
        bootstrap_peers: Vec<String>,
    },
}

/// Network behavior for the relay server
#[derive(NetworkBehaviour)]
struct RelayBehaviour {
    /// Circuit relay behavior
    relay: relay::v2::relay::Behaviour,
}

/// Main function
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize logging
    env_logger::init();
    
    // Parse command line arguments
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Start {
            p2p_port,
            signaling_port,
            bootstrap_peers,
        } => {
            // Start the relay server
            start_relay_server(p2p_port, signaling_port, bootstrap_peers).await?;
        }
    }
    
    Ok(())
}

/// Start the relay server
async fn start_relay_server(
    p2p_port: u16,
    signaling_port: u16,
    bootstrap_peers: Vec<String>,
) -> Result<(), Box<dyn Error>> {
    // Create a random identity
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(local_key.public());
    
    println!("Local peer id: {}", local_peer_id);
    
    // Create a transport
    let tcp_transport = tcp::async_io::Transport::new(tcp::Config::default().nodelay(true))
        .upgrade(upgrade::Version::V1)
        .authenticate(noise::Config::new(&local_key).unwrap())
        .multiplex(yamux::Config::default())
        .timeout(Duration::from_secs(20))
        .boxed();
    
    // Create a relay config
    let relay_config = RelayConfig {
        max_circuit_duration: Duration::from_secs(3600), // 1 hour
        max_circuit_bytes: 10 * 1024 * 1024, // 10 MB
        ..Default::default()
    };
    
    // Create a relay behavior
    let relay_behavior = relay::v2::relay::Behaviour::new(local_peer_id, relay_config);
    
    // Create a network behavior
    let behavior = RelayBehaviour {
        relay: relay_behavior,
    };
    
    // Create a swarm
    let mut swarm = SwarmBuilder::with_tokio_executor(tcp_transport, behavior, local_peer_id).build();
    
    // Listen on all interfaces
    swarm.listen_on(format!("/ip4/0.0.0.0/tcp/{}", p2p_port).parse()?)?;
    swarm.listen_on(format!("/ip6/::/tcp/{}", p2p_port).parse()?)?;
    
    // Connect to bootstrap peers
    for peer in bootstrap_peers {
        let addr = peer.parse()?;
        swarm.dial(addr)?;
        println!("Dialed bootstrap peer: {}", peer);
    }
    
    // Create a channel for signaling server events
    let (tx, mut rx) = mpsc::channel(100);
    
    // Start the signaling server
    let signaling_server = SignalingServer::new();
    let signaling_server_clone = signaling_server;
    
    tokio::spawn(async move {
        if let Err(e) = signaling_server_clone.start(signaling_port).await {
            eprintln!("Signaling server error: {}", e);
        }
    });
    
    // Subscribe to client events
    let mut client_events = signaling_server.subscribe_to_client_events();
    
    tokio::spawn(async move {
        while let Ok(event) = client_events.recv().await {
            let _ = tx.send(event).await;
        }
    });
    
    // Main event loop
    loop {
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        println!("Listening on {}", address);
                    }
                    SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                        println!("Connection established with {}", peer_id);
                    }
                    SwarmEvent::ConnectionClosed { peer_id, .. } => {
                        println!("Connection closed with {}", peer_id);
                    }
                    SwarmEvent::Behaviour(behaviour_event) => {
                        println!("Behaviour event: {:?}", behaviour_event);
                    }
                    _ => {}
                }
            }
            event = rx.recv() => {
                if let Some(event) = event {
                    println!("Signaling server event: {:?}", event);
                }
            }
        }
    }
}