# WebRTC Rust API for DarkSwap

## Overview

This document provides a comprehensive guide to using the WebRTC Rust API for DarkSwap. The API allows Rust applications to use WebRTC for peer-to-peer communication, which is essential for the decentralized trading platform.

## Installation

The DarkSwap WebRTC API is provided as part of the DarkSwap SDK. To use it, add the following to your `Cargo.toml`:

```toml
[dependencies]
darkswap-sdk = { version = "0.1.0", features = ["webrtc"] }
```

## Initialization

Before using the API, you need to initialize the DarkSwap instance:

```rust
use darkswap_sdk::{DarkSwap, config::Config};

// Create a DarkSwap instance with default configuration
let config = Config::default();
let darkswap = DarkSwap::new(config)?;

// Start DarkSwap
darkswap.start().await?;
```

## Network

The `Network` struct is the main entry point for WebRTC functionality:

```rust
use darkswap_sdk::network::Network;
use darkswap_sdk::types::PeerId;

// Create a network
let config = NetworkConfig::default();
let network = Network::new(&config)?;

// Get the local peer ID
let local_peer_id = network.local_peer_id();
```

## WebRTC Transport

The WebRTC transport is automatically used when the `webrtc` feature is enabled:

```rust
// The transport is created internally when you create a Network instance
let network = Network::new(&config)?;

// Connect to a peer
network.connect(&peer_id).await?;
```

## WebRTC Circuit Relay

### Make a Relay Reservation

To make a reservation with a relay node:

```rust
// Make a reservation with a relay
let reservation = network.make_relay_reservation(relay_peer_id).await?;

println!("Reservation ID: {}", reservation.reservation_id);
println!("Expires at: {}", reservation.expires_at);
```

### Connect Through a Relay

To connect to a peer through a relay:

```rust
// Connect to a peer through a relay
network.connect_through_relay(relay_peer_id, target_peer_id).await?;
```

### Disconnect from a Relay

To disconnect from a relay:

```rust
// Disconnect from a relay
network.disconnect_from_webrtc_relay(peer_id).await?;
```

### Get Relay Metrics

To get metrics about relay connections:

```rust
// Get relay metrics
let metrics = network.get_webrtc_relay_metrics()?;

println!("Successful connections: {}", metrics.successful_connections);
println!("Failed connections: {}", metrics.failed_connections);
println!("Active connections: {}", metrics.active_connections);
```

### Check if a Reservation is Valid

To check if a relay reservation is valid:

```rust
// Check if a reservation is valid
let is_valid = network.is_webrtc_relay_reservation_valid(&relay_peer_id)?;

if is_valid {
    println!("Reservation is valid");
} else {
    println!("Reservation is not valid");
}
```

### Get Active Reservations

To get a list of active relay reservations:

```rust
// Get active reservations
let reservations = network.get_active_webrtc_relay_reservations()?;

for reservation in reservations {
    println!("Relay peer ID: {}", reservation.relay_peer_id.0);
    println!("Reservation ID: {}", reservation.reservation_id);
    println!("Expires at: {}", reservation.expires_at);
}
```

## WebRTC Data Channels

### Create a Data Channel

To create a WebRTC data channel:

```rust
// Create a WebRTC data channel
network.create_webrtc_data_channel(peer_id.clone()).await?;
```

### Send a Message

To send a message through a WebRTC data channel:

```rust
// Create a message
let message = b"Hello, world!".to_vec();

// Send the message
network.send_webrtc_message(&peer_id, message).await?;
```

### Receive a Message

To receive a message through a WebRTC data channel:

```rust
// Receive a message
let message = network.receive_webrtc_message(&peer_id).await?;

println!("Received message: {:?}", message);
```

### Get Data Channel State

To get the state of a WebRTC data channel:

```rust
// Get the state of a data channel
let state = network.get_webrtc_data_channel_state(&peer_id)?;

match state {
    ChannelState::Connecting => println!("Connecting"),
    ChannelState::Open => println!("Open"),
    ChannelState::Closing => println!("Closing"),
    ChannelState::Closed => println!("Closed"),
}
```

### Close a Data Channel

To close a WebRTC data channel:

```rust
// Close the data channel
network.close_webrtc_data_channel(&peer_id).await?;
```

## WebRTC Signaling

### Send an Offer

To send a WebRTC offer:

```rust
// Create an offer
let offer = SessionDescription {
    type_: SessionDescriptionType::Offer,
    sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
};

// Send the offer
network.send_webrtc_offer(&peer_id, &offer).await?;
```

### Send an Answer

To send a WebRTC answer:

```rust
// Create an answer
let answer = SessionDescription {
    type_: SessionDescriptionType::Answer,
    sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
};

// Send the answer
network.send_webrtc_answer(&peer_id, &answer).await?;
```

### Send an ICE Candidate

To send a WebRTC ICE candidate:

```rust
// Create an ICE candidate
let candidate = IceCandidate {
    candidate: "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host".to_string(),
    sdp_mid: Some("0".to_string()),
    sdp_m_line_index: Some(0),
};

// Send the ICE candidate
network.send_webrtc_ice_candidate(&peer_id, &candidate).await?;
```

### Receive a Signaling Event

To receive a WebRTC signaling event:

```rust
// Receive a signaling event
let event = network.receive_webrtc_event().await?;

match event {
    SignalingEvent::OfferReceived { from, offer } => {
        println!("Received offer from {}: {:?}", from.0, offer);
        
        // Create an answer
        let answer = create_answer(&offer);
        
        // Send the answer
        network.send_webrtc_answer(&from, &answer).await?;
    },
    SignalingEvent::AnswerReceived { from, answer } => {
        println!("Received answer from {}: {:?}", from.0, answer);
        
        // Process the answer
        process_answer(&answer);
    },
    SignalingEvent::IceCandidateReceived { from, candidate } => {
        println!("Received ICE candidate from {}: {:?}", from.0, candidate);
        
        // Add the ICE candidate
        add_ice_candidate(&candidate);
    },
}
```

## WebRTC Connection

### Create a WebRTC Connection

The `WebRtcConnection` struct is used internally by the `Network` struct, but you can also use it directly:

```rust
use darkswap_sdk::webrtc_connection::WebRtcConnection;

// Create a WebRTC connection
let connection = WebRtcConnection::new(local_peer_id, remote_peer_id);
```

### Create an Offer

To create a WebRTC offer:

```rust
// Create an offer
let offer = connection.create_offer().await?;

// Send the offer to the remote peer
network.send_webrtc_offer(&remote_peer_id, &offer).await?;
```

### Create an Answer

To create a WebRTC answer:

```rust
// Create an answer
let answer = connection.create_answer().await?;

// Send the answer to the remote peer
network.send_webrtc_answer(&remote_peer_id, &answer).await?;
```

### Set Remote Description

To set the remote description:

```rust
// Set the remote description
connection.set_remote_description(offer_or_answer).await?;
```

### Add ICE Candidate

To add an ICE candidate:

```rust
// Add an ICE candidate
connection.add_ice_candidate(candidate).await?;
```

### Create a Data Channel

To create a WebRTC data channel:

```rust
// Create a data channel
connection.create_data_channel("my-channel")?;
```

### Send a Message

To send a message through a WebRTC data channel:

```rust
// Send a message
connection.send_message(b"Hello, world!".to_vec()).await?;
```

### Receive a Message

To receive a message through a WebRTC data channel:

```rust
// Receive a message
let message = connection.receive_message().await?;

println!("Received message: {:?}", message);
```

### Close a Data Channel

To close a WebRTC data channel:

```rust
// Close the data channel
connection.close_data_channel()?;
```

## Error Handling

All API methods return a `Result` that can contain an error. You should handle these errors appropriately:

```rust
match network.make_relay_reservation(relay_peer_id).await {
    Ok(reservation) => {
        println!("Reservation ID: {}", reservation.reservation_id);
    },
    Err(e) => {
        eprintln!("Failed to make relay reservation: {}", e);
    },
}
```

## Cleanup

When you're done with DarkSwap, you should stop it:

```rust
// Stop DarkSwap
darkswap.stop().await?;
```

## Example: Establishing a WebRTC Connection

Here's a complete example of establishing a WebRTC connection between two peers:

```rust
use darkswap_sdk::{
    network::{Network, NetworkConfig},
    types::PeerId,
    webrtc_signaling::{SessionDescription, SessionDescriptionType, IceCandidate},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create two networks
    let config1 = NetworkConfig::default();
    let config2 = NetworkConfig::default();
    let mut network1 = Network::new(&config1)?;
    let mut network2 = Network::new(&config2)?;
    
    // Get peer IDs
    let peer_id1 = network1.local_peer_id();
    let peer_id2 = network2.local_peer_id();
    
    // Create WebRTC data channels
    network1.create_webrtc_data_channel(peer_id2.clone()).await?;
    network2.create_webrtc_data_channel(peer_id1.clone()).await?;
    
    // Create and send an offer from network1 to network2
    let offer = SessionDescription {
        type_: SessionDescriptionType::Offer,
        sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
    };
    network1.send_webrtc_offer(&peer_id2, &offer).await?;
    
    // Receive the offer on network2
    let event = network2.receive_webrtc_event().await?;
    if let SignalingEvent::OfferReceived { from, offer } = event {
        // Create and send an answer from network2 to network1
        let answer = SessionDescription {
            type_: SessionDescriptionType::Answer,
            sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
        };
        network2.send_webrtc_answer(&from, &answer).await?;
    }
    
    // Receive the answer on network1
    let event = network1.receive_webrtc_event().await?;
    if let SignalingEvent::AnswerReceived { from, answer } = event {
        // Process the answer
        println!("Received answer from {}: {:?}", from.0, answer);
    }
    
    // Send a message from network1 to network2
    let message = b"Hello from network1!".to_vec();
    network1.send_webrtc_message(&peer_id2, message.clone()).await?;
    
    // Receive the message on network2
    let received = network2.receive_webrtc_message(&peer_id1).await?;
    assert_eq!(received, message);
    
    // Send a message from network2 to network1
    let message = b"Hello from network2!".to_vec();
    network2.send_webrtc_message(&peer_id1, message.clone()).await?;
    
    // Receive the message on network1
    let received = network1.receive_webrtc_message(&peer_id2).await?;
    assert_eq!(received, message);
    
    // Close the data channels
    network1.close_webrtc_data_channel(&peer_id2).await?;
    network2.close_webrtc_data_channel(&peer_id1).await?;
    
    Ok(())
}
```

## Conclusion

The WebRTC Rust API for DarkSwap provides a comprehensive set of tools for peer-to-peer communication. By using this API, you can build decentralized applications that leverage the power of WebRTC for direct communication between peers.