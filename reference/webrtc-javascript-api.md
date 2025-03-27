# WebRTC JavaScript API for DarkSwap

## Overview

This document provides a comprehensive guide to using the WebRTC JavaScript API for DarkSwap. The API allows JavaScript applications to use WebRTC for peer-to-peer communication, which is essential for the decentralized trading platform.

## Installation

The DarkSwap WebRTC API is provided as a WebAssembly (WASM) module. To use it, you need to include the WASM module in your JavaScript application:

```html
<script src="darkswap.js"></script>
```

## Initialization

Before using the API, you need to initialize the DarkSwap instance:

```javascript
// Create a DarkSwap instance with default configuration
const darkswap = new DarkSwapWasm.new_with_defaults("regtest");

// Or create a DarkSwap instance with custom configuration
const config = {
    bitcoin: {
        network: "regtest",
        rpc_url: "http://localhost:18443",
        rpc_user: "user",
        rpc_password: "password"
    },
    p2p: {
        listen_address: "/ip4/0.0.0.0/tcp/9000",
        bootstrap_peers: [
            "/ip4/127.0.0.1/tcp/9001/p2p/12D3KooWRfYU5FaY9SmJcRD5Ku7c1XMBRqV6oM4nsnGQ1QRakSJi"
        ]
    }
};
const darkswap = new DarkSwapWasm.new(JSON.stringify(config));

// Start DarkSwap
await darkswap.start();
```

## WebRTC Relay

### Make a Relay Reservation

To make a reservation with a relay node:

```javascript
// Make a reservation with a relay
const reservation = await darkswap.make_webrtc_relay_reservation("relay-peer-id");

console.log("Reservation ID:", reservation.reservation_id);
console.log("Expires at:", new Date(reservation.expires_at * 1000).toISOString());
```

### Connect Through a Relay

To connect to a peer through a relay:

```javascript
// Connect to a peer through a relay
await darkswap.connect_through_webrtc_relay("relay-peer-id", "target-peer-id");
```

### Disconnect from a Relay

To disconnect from a relay:

```javascript
// Disconnect from a relay
await darkswap.disconnect_from_webrtc_relay("peer-id");
```

### Get Relay Metrics

To get metrics about relay connections:

```javascript
// Get relay metrics
const metrics = await darkswap.get_webrtc_relay_metrics();

console.log("Successful connections:", metrics.successful_connections);
console.log("Failed connections:", metrics.failed_connections);
console.log("Active connections:", metrics.active_connections);
```

### Check if a Reservation is Valid

To check if a relay reservation is valid:

```javascript
// Check if a reservation is valid
const isValid = await darkswap.is_webrtc_relay_reservation_valid("relay-peer-id");

if (isValid) {
    console.log("Reservation is valid");
} else {
    console.log("Reservation is not valid");
}
```

### Get Active Reservations

To get a list of active relay reservations:

```javascript
// Get active reservations
const reservations = await darkswap.get_active_webrtc_relay_reservations();

for (const reservation of reservations) {
    console.log("Relay peer ID:", reservation.relay_peer_id);
    console.log("Reservation ID:", reservation.reservation_id);
    console.log("Expires at:", new Date(reservation.expires_at * 1000).toISOString());
}
```

## WebRTC Data Channels

### Create a Data Channel

To create a WebRTC data channel:

```javascript
// Create a WebRTC data channel
await darkswap.create_webrtc_data_channel("peer-id");
```

### Send a Message

To send a message through a WebRTC data channel:

```javascript
// Create a message
const message = new Uint8Array([1, 2, 3, 4, 5]);

// Send the message
await darkswap.send_webrtc_message("peer-id", message);
```

### Receive a Message

To receive a message through a WebRTC data channel:

```javascript
// Set up a callback to receive messages
darkswap.on_webrtc_message((peer_id, message) => {
    console.log("Received message from", peer_id, ":", message);
});
```

### Close a Data Channel

To close a WebRTC data channel:

```javascript
// Close the data channel
await darkswap.close_webrtc_data_channel("peer-id");
```

## WebRTC Signaling

### Set Up Signaling Callbacks

To set up callbacks for WebRTC signaling events:

```javascript
// Set up a callback for WebRTC offers
darkswap.on_webrtc_offer((peer_id, offer) => {
    console.log("Received offer from", peer_id, ":", offer);
    
    // Create an answer
    const answer = createAnswer(offer);
    
    // Send the answer
    darkswap.send_webrtc_answer(peer_id, answer);
});

// Set up a callback for WebRTC answers
darkswap.on_webrtc_answer((peer_id, answer) => {
    console.log("Received answer from", peer_id, ":", answer);
    
    // Process the answer
    processAnswer(answer);
});

// Set up a callback for WebRTC ICE candidates
darkswap.on_webrtc_ice_candidate((peer_id, candidate) => {
    console.log("Received ICE candidate from", peer_id, ":", candidate);
    
    // Add the ICE candidate
    addIceCandidate(candidate);
});
```

### Send an Offer

To send a WebRTC offer:

```javascript
// Create an offer
const offer = {
    type: "offer",
    sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n"
};

// Send the offer
await darkswap.send_webrtc_offer("peer-id", offer);
```

### Send an Answer

To send a WebRTC answer:

```javascript
// Create an answer
const answer = {
    type: "answer",
    sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n"
};

// Send the answer
await darkswap.send_webrtc_answer("peer-id", answer);
```

### Send an ICE Candidate

To send a WebRTC ICE candidate:

```javascript
// Create an ICE candidate
const candidate = {
    candidate: "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host",
    sdpMid: "0",
    sdpMLineIndex: 0
};

// Send the ICE candidate
await darkswap.send_webrtc_ice_candidate("peer-id", candidate);
```

## WebRTC Connection

### Create a WebRTC Connection

To create a WebRTC connection:

```javascript
// Create a WebRTC connection
const connection = new WebRtcConnection("local-peer-id", "remote-peer-id");
```

### Set Up Connection Callbacks

To set up callbacks for WebRTC connection events:

```javascript
// Set up a callback for ICE candidates
connection.on_ice_candidate((candidate) => {
    console.log("Generated ICE candidate:", candidate);
    
    // Send the ICE candidate to the remote peer
    darkswap.send_webrtc_ice_candidate("remote-peer-id", candidate);
});

// Set up a callback for data channel open events
connection.on_data_channel_open(() => {
    console.log("Data channel opened");
    
    // Send a message
    connection.send_message(new Uint8Array([1, 2, 3, 4, 5]));
});

// Set up a callback for data channel message events
connection.on_data_channel_message((message) => {
    console.log("Received message:", message);
});

// Set up a callback for data channel close events
connection.on_data_channel_close(() => {
    console.log("Data channel closed");
});
```

### Create an Offer

To create a WebRTC offer:

```javascript
// Create an offer
const offer = await connection.create_offer();

// Send the offer to the remote peer
darkswap.send_webrtc_offer("remote-peer-id", offer);
```

### Create an Answer

To create a WebRTC answer:

```javascript
// Create an answer
const answer = await connection.create_answer();

// Send the answer to the remote peer
darkswap.send_webrtc_answer("remote-peer-id", answer);
```

### Set Remote Description

To set the remote description:

```javascript
// Set the remote description
await connection.set_remote_description(offer_or_answer);
```

### Add ICE Candidate

To add an ICE candidate:

```javascript
// Add an ICE candidate
await connection.add_ice_candidate(candidate);
```

### Create a Data Channel

To create a WebRTC data channel:

```javascript
// Create a data channel
connection.create_data_channel("my-channel");
```

### Send a Message

To send a message through a WebRTC data channel:

```javascript
// Send a message
connection.send_message(new Uint8Array([1, 2, 3, 4, 5]));
```

### Close a Data Channel

To close a WebRTC data channel:

```javascript
// Close the data channel
connection.close_data_channel();
```

## Error Handling

All API methods return promises that can be rejected with an error. You should handle these errors appropriately:

```javascript
try {
    await darkswap.make_webrtc_relay_reservation("relay-peer-id");
} catch (error) {
    console.error("Failed to make relay reservation:", error);
}
```

## Cleanup

When you're done with DarkSwap, you should stop it:

```javascript
// Stop DarkSwap
await darkswap.stop();
```

## Example: Establishing a WebRTC Connection

Here's a complete example of establishing a WebRTC connection between two peers:

```javascript
// Peer A
const darkswapA = new DarkSwapWasm.new_with_defaults("regtest");
await darkswapA.start();

// Peer B
const darkswapB = new DarkSwapWasm.new_with_defaults("regtest");
await darkswapB.start();

// Peer A creates a WebRTC connection
const connectionA = new WebRtcConnection("peer-a", "peer-b");

// Peer B creates a WebRTC connection
const connectionB = new WebRtcConnection("peer-b", "peer-a");

// Set up callbacks for Peer A
connectionA.on_ice_candidate((candidate) => {
    // Send the ICE candidate to Peer B
    connectionB.add_ice_candidate(candidate);
});

// Set up callbacks for Peer B
connectionB.on_ice_candidate((candidate) => {
    // Send the ICE candidate to Peer A
    connectionA.add_ice_candidate(candidate);
});

// Peer A creates an offer
const offer = await connectionA.create_offer();

// Peer B sets the remote description and creates an answer
await connectionB.set_remote_description(offer);
const answer = await connectionB.create_answer();

// Peer A sets the remote description
await connectionA.set_remote_description(answer);

// Peer A creates a data channel
connectionA.create_data_channel("my-channel");

// Set up callbacks for data channel events
connectionA.on_data_channel_open(() => {
    // Send a message from Peer A to Peer B
    connectionA.send_message(new Uint8Array([1, 2, 3, 4, 5]));
});

connectionB.on_data_channel_message((message) => {
    console.log("Peer B received message:", message);
    
    // Send a response from Peer B to Peer A
    connectionB.send_message(new Uint8Array([5, 4, 3, 2, 1]));
});

connectionA.on_data_channel_message((message) => {
    console.log("Peer A received message:", message);
});
```

## Conclusion

The WebRTC JavaScript API for DarkSwap provides a comprehensive set of tools for peer-to-peer communication in browsers. By using this API, you can build decentralized applications that leverage the power of WebRTC for direct communication between peers.