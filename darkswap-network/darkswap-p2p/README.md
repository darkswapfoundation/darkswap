# DarkSwap P2P

This crate provides the P2P networking functionality for the DarkSwap project. It includes:

- WebRTC transport for browser compatibility
- Circuit relay for NAT traversal
- P2P protocol handlers

## Features

- **WebRTC Transport**: WebRTC transport implementation for libp2p
- **WebRTC Signaling Client**: Client for WebRTC signaling server
- **Circuit Relay**: Circuit relay implementation for NAT traversal
- **P2P Protocol Handlers**: Handlers for P2P protocol messages
- **Cross-Platform Support**: Works on both native and WebAssembly targets

## Usage

Add this crate as a dependency in your `Cargo.toml`:

```toml
[dependencies]
darkswap-p2p = { path = "../darkswap-p2p" }
```

### Basic Example

```rust
use darkswap_p2p::{
    network::{Network, NetworkConfig, NetworkEvent},
    Error,
};
use darkswap_support::types::PeerId;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
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

    // Handle events
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

    Ok(())
}
```

## WebRTC Transport

The WebRTC transport implementation allows for browser-to-browser communication using WebRTC. It is enabled with the `wasm` feature:

```toml
[dependencies]
darkswap-p2p = { path = "../darkswap-p2p", features = ["wasm"] }
```

### WebRTC Example

```rust
use darkswap_p2p::{
    WebRtcTransport,
    WebRtcSignalingClient,
    error::Error,
};
use libp2p::{
    core::{
        transport::Transport,
        Multiaddr, PeerId,
    },
    identity,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a random identity
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(local_key.public());
    
    // Create a WebRTC signaling client
    let webrtc_signaling_client = WebRtcSignalingClient::new(local_peer_id.clone());
    
    // Connect to the signaling server
    webrtc_signaling_client.connect("ws://localhost:9001/signaling").await?;
    
    // Create a WebRTC transport with the signaling client
    let mut webrtc_transport = WebRtcTransport::with_signaling_client(
        local_peer_id.clone(),
        Some(std::sync::Arc::new(webrtc_signaling_client)),
    );
    
    // Set the signaling server URL
    webrtc_transport.set_signaling_server("ws://localhost:9001/signaling".to_string());
    
    // Connect to the signaling server
    webrtc_transport.connect_to_signaling_server().await?;
    
    // Dial a peer
    let peer_id = PeerId::random();
    let addr = format!("/ip4/127.0.0.1/tcp/0/webrtc/p2p/{}", peer_id).parse::<Multiaddr>()?;
    let connection = webrtc_transport.dial(addr)?.await?;
    
    // Send and receive data
    if let Some(mut data_channel) = connection.data_channels.get("data") {
        data_channel.send(b"Hello, world!".to_vec()).await?;
        let data = data_channel.receive().await?;
        println!("Received: {}", String::from_utf8_lossy(&data));
    }
    
    Ok(())
}
```

## WebRTC Signaling Client

The WebRTC signaling client is used to establish WebRTC connections between peers. It connects to a signaling server and exchanges SDP offers, answers, and ICE candidates.

```rust
use darkswap_p2p::WebRtcSignalingClient;
use libp2p::PeerId;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a WebRTC signaling client
    let client = WebRtcSignalingClient::new(PeerId::random());
    
    // Connect to the signaling server
    client.connect("ws://localhost:9001/signaling").await?;
    
    // Create an offer
    let peer_id = PeerId::random();
    let offer = client.create_offer(&peer_id).await?;
    
    // Wait for the connection to be established
    client.wait_for_connection(&peer_id).await?;
    
    Ok(())
}
```

## Signaling Server

A simple signaling server is included in the examples. It can be run with:

```bash
cargo run --example signaling_server
```

The signaling server listens on `ws://localhost:9001/signaling` by default.

## Circuit Relay

The circuit relay implementation allows for NAT traversal by relaying connections through a relay node. It is based on the circuit relay v2 protocol from libp2p.

## Network

The `Network` struct is the main entry point for the P2P networking functionality. It provides methods for:

- Connecting to peers
- Listening for connections
- Subscribing to topics
- Publishing messages
- Handling events
## Examples

The following examples are included:

- **webrtc_example.rs**: Demonstrates how to use the WebRTC transport for peer-to-peer communication
- **signaling_server.rs**: A simple WebRTC signaling server
- **simple_node.rs**: A simple P2P node using the Network API

To run an example:

```bash
# Run the signaling server
cargo run --example signaling_server

# In another terminal, run the WebRTC example
cargo run --example webrtc_example ws://localhost:9001/signaling <peer-id>
```
See the `examples` directory for more examples of how to use this crate.