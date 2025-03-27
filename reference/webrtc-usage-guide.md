# WebRTC Usage Guide for DarkSwap

This guide explains how to use the WebRTC functionality in DarkSwap for peer-to-peer communication in browsers.

## Overview

WebRTC (Web Real-Time Communication) is a technology that enables direct peer-to-peer communication between browsers without requiring an intermediary server. DarkSwap uses WebRTC to enable decentralized trading of Bitcoin, runes, and alkanes directly between users' browsers.

## Enabling WebRTC

WebRTC support is feature-gated in DarkSwap. To enable it, you need to compile the SDK with the `webrtc` feature flag:

```bash
cargo build --features webrtc
```

For WASM builds, you need to enable both the `wasm` and `webrtc` feature flags:

```bash
cargo build --features "wasm webrtc"
```

## Using WebRTC in Rust

### Creating a Network with WebRTC Support

```rust
use darkswap_sdk::config::NetworkConfig;
use darkswap_sdk::network::Network;

// Create a network configuration
let mut config = NetworkConfig::default();

// Create a network instance
let mut network = Network::new(&config)?;

// Start the network
network.start().await?;
```

When the `webrtc` feature is enabled, the network will automatically use WebRTC transport when available.

### Using Circuit Relay

Circuit relay allows peers to connect through relay nodes when direct connections are not possible:

```rust
use darkswap_sdk::types::PeerId;

// Make a reservation with a relay
let relay_peer_id = PeerId("relay-peer-id".to_string());
network.make_relay_reservation(relay_peer_id.clone()).await?;

// Connect to a peer through the relay
let target_peer_id = PeerId("target-peer-id".to_string());
network.connect_through_relay(relay_peer_id, target_peer_id).await?;
```

### Sending WebRTC Signaling Messages

WebRTC requires signaling to establish connections:

```rust
use darkswap_sdk::webrtc_signaling::{SessionDescription, SessionDescriptionType, IceCandidate};

// Create an offer
let offer = SessionDescription {
    type_: SessionDescriptionType::Offer,
    sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
};

// Send the offer to a peer
let peer_id = PeerId("peer-id".to_string());
network.send_webrtc_offer(&peer_id, &offer).await?;

// Create an answer
let answer = SessionDescription {
    type_: SessionDescriptionType::Answer,
    sdp: "v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
};

// Send the answer to a peer
network.send_webrtc_answer(&peer_id, &answer).await?;

// Create an ICE candidate
let candidate = IceCandidate {
    candidate: "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host".to_string(),
    sdp_mid: Some("0".to_string()),
    sdp_m_line_index: Some(0),
};

// Send the ICE candidate to a peer
network.send_webrtc_ice_candidate(&peer_id, &candidate).await?;
```

### Receiving WebRTC Signaling Messages

```rust
// Receive WebRTC events
loop {
    match network.receive_webrtc_event().await {
        Ok(event) => {
            match event {
                SignalingEvent::OfferReceived { from, offer } => {
                    // Handle offer
                    println!("Received offer from {}: {:?}", from, offer);
                },
                SignalingEvent::AnswerReceived { from, answer } => {
                    // Handle answer
                    println!("Received answer from {}: {:?}", from, answer);
                },
                SignalingEvent::IceCandidateReceived { from, candidate } => {
                    // Handle ICE candidate
                    println!("Received ICE candidate from {}: {:?}", from, candidate);
                },
            }
        },
        Err(e) => {
            // Handle error
            println!("Error receiving WebRTC event: {}", e);
            break;
        },
    }
}
```

## Using WebRTC in JavaScript

### Creating a DarkSwap Instance

```javascript
import { DarkSwapWasm } from 'darkswap-sdk';

// Create a DarkSwap instance
const config = {
    bitcoin: {
        network: 'testnet',
    },
    p2p: {
        listen_addresses: ['/ip4/0.0.0.0/tcp/0'],
        bootstrap_peers: [],
        gossipsub_topic: 'darkswap/v1',
    },
};

const darkswap = new DarkSwapWasm(JSON.stringify(config));

// Start DarkSwap
await darkswap.start();
```

### Creating a WebRTC Connection

```javascript
// Create a WebRTC connection
const remotePeerId = 'remote-peer-id';
const connection = darkswap.create_webrtc_connection(remotePeerId);

// Set up event handlers
connection.on_ice_candidate((candidate) => {
    console.log('ICE candidate:', candidate);
    
    // Send the ICE candidate to the remote peer
    darkswap.send_webrtc_ice_candidate(remotePeerId, candidate);
});

// Create an offer
const offer = await connection.create_offer();
console.log('Offer:', offer);

// Send the offer to the remote peer
await darkswap.send_webrtc_offer(remotePeerId, offer);

// When you receive an answer from the remote peer
connection.set_remote_description(answer);
```

### Handling WebRTC Events

```javascript
// Set up event handlers for WebRTC events
darkswap.on_webrtc_offer((peerId, offer) => {
    console.log('Received offer from:', peerId, offer);
    
    // Create a WebRTC connection if it doesn't exist
    let connection = darkswap.create_webrtc_connection(peerId);
    
    // Set the remote description
    connection.set_remote_description(offer);
    
    // Create an answer
    connection.create_answer().then((answer) => {
        console.log('Answer:', answer);
        
        // Send the answer to the remote peer
        darkswap.send_webrtc_answer(peerId, answer);
    });
});

darkswap.on_webrtc_answer((peerId, answer) => {
    console.log('Received answer from:', peerId, answer);
    
    // Get the WebRTC connection
    const connection = darkswap.webrtc_connections[peerId];
    
    // Set the remote description
    connection.set_remote_description(answer);
});

darkswap.on_webrtc_ice_candidate((peerId, candidate) => {
    console.log('Received ICE candidate from:', peerId, candidate);
    
    // Get the WebRTC connection
    const connection = darkswap.webrtc_connections[peerId];
    
    // Add the ICE candidate
    connection.add_ice_candidate(candidate);
});
```

## Example: Creating a P2P Trade

Here's an example of how to use WebRTC to create a peer-to-peer trade:

```javascript
// Create an order
const order = await darkswap.create_order(
    'BTC',
    'RUNE:abcdef',
    'sell',
    '0.1',
    '10000',
    3600
);

// When someone wants to take the order
darkswap.on_webrtc_offer(async (peerId, offer) => {
    // Create a WebRTC connection
    const connection = darkswap.create_webrtc_connection(peerId);
    
    // Set the remote description
    await connection.set_remote_description(offer);
    
    // Create an answer
    const answer = await connection.create_answer();
    
    // Send the answer
    await darkswap.send_webrtc_answer(peerId, answer);
    
    // When the data channel is open
    connection.on_data_channel_open(() => {
        // Send the order details
        connection.send(JSON.stringify(order));
    });
});

// When you want to take someone else's order
const remotePeerId = 'remote-peer-id';
const connection = darkswap.create_webrtc_connection(remotePeerId);

// Create an offer
const offer = await connection.create_offer();

// Send the offer
await darkswap.send_webrtc_offer(remotePeerId, offer);

// When you receive an answer
darkswap.on_webrtc_answer(async (peerId, answer) => {
    if (peerId === remotePeerId) {
        // Set the remote description
        await connection.set_remote_description(answer);
        
        // When the data channel is open
        connection.on_data_channel_open(() => {
            // Send a message to take the order
            connection.send(JSON.stringify({
                type: 'take_order',
                order_id: order.id,
                amount: '0.1',
            }));
        });
    }
});
```

## Troubleshooting

### Connection Issues

If you're having trouble establishing WebRTC connections:

1. Make sure both peers have enabled the `webrtc` feature flag.
2. Check that you're using compatible versions of the DarkSwap SDK.
3. Ensure that your network allows WebRTC connections (some firewalls block them).
4. Try using a circuit relay if direct connections are not possible.

### Signaling Issues

If signaling messages are not being delivered:

1. Make sure both peers are connected to the P2P network.
2. Check that you're using the correct peer IDs.
3. Ensure that the signaling messages are properly formatted.

### Browser Compatibility

WebRTC is supported by most modern browsers, but there may be some compatibility issues:

1. Chrome, Firefox, and Safari have good WebRTC support.
2. Edge has improved WebRTC support in recent versions.
3. Internet Explorer does not support WebRTC.

## References

- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [rust-libp2p](https://github.com/libp2p/rust-libp2p)
- [webrtc-rs](https://github.com/webrtc-rs/webrtc)
- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen)