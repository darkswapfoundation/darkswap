# DarkSwap P2P

This crate provides the P2P networking functionality for the DarkSwap project. It includes:

- WebRTC transport for browser compatibility
- Circuit relay for NAT traversal
- P2P protocol handlers

## Features

- **WebRTC Transport**: WebRTC transport implementation for libp2p
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

See the `examples` directory for more examples of how to use this crate.