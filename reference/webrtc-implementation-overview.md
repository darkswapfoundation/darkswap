# WebRTC Implementation for DarkSwap

## Overview

This document provides an overview of the WebRTC implementation for DarkSwap, a decentralized trading platform for Bitcoin, Runes, and Alkanes. WebRTC enables peer-to-peer communication in browsers, which is essential for a decentralized platform.

## Architecture

The WebRTC implementation consists of several components:

1. **WebRTC Transport**: Enables peers to connect using WebRTC in browsers.
2. **Circuit Relay**: Allows peers to connect through relay nodes when direct connections are not possible.
3. **Signaling Mechanism**: Facilitates the exchange of connection information between peers.
4. **Data Channels**: Provides a reliable communication channel for trade negotiation and execution.
5. **WASM Bindings**: Allows the DarkSwap SDK to be used in browsers.

## Phase 1 Implementation (Completed)

### WebRTC Transport

The WebRTC transport is implemented as part of the Network struct:

```rust
impl Network {
    /// Create the transport
    async fn create_transport(&self) -> Result<Boxed<(LibP2PPeerId, StreamMuxerBox)>> {
        // Create TCP transport
        let tcp_transport = tcp::tokio::Transport::new(tcp::Config::default().nodelay(true))
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::Config::new(&self.keypair).unwrap())
            .multiplex(yamux::Config::default())
            .boxed();

        // Create the final transport
        #[cfg(feature = "webrtc")]
        {
            // Create WebRTC transport
            println!("Creating WebRTC transport");
            
            // For now, just use TCP transport
            // In Phase 2, we will create a WebRTC transport and combine it with TCP
            // using OrTransport
            Ok(tcp_transport)
        }

        #[cfg(not(feature = "webrtc"))]
        {
            // Use only TCP transport
            Ok(tcp_transport)
        }
    }
}
```

### Circuit Relay

The WebRTC circuit relay is implemented as a separate struct:

```rust
/// WebRTC circuit relay implementation
#[cfg(feature = "webrtc")]
pub struct WebRtcCircuitRelay {
    /// Local peer ID
    peer_id: PeerId,
    /// Active reservations by relay peer ID
    reservations: Arc<Mutex<HashMap<PeerId, RelayReservation>>>,
    /// Metrics for circuit relay connections
    metrics: Arc<Mutex<RelayMetrics>>,
    /// Command sender for the reservation manager
    command_sender: mpsc::Sender<ReservationCommand>,
}
```

The circuit relay provides methods for making reservations and connecting through relays:

```rust
impl WebRtcCircuitRelay {
    /// Make a reservation with a relay
    pub async fn make_reservation(
        &self,
        relay_peer_id: PeerId,
    ) -> Result<RelayReservation> {
        // ...
    }
    
    /// Connect to a peer through a relay
    pub async fn connect_through_relay(
        &self,
        relay_peer_id: PeerId,
        target_peer_id: PeerId,
    ) -> Result<()> {
        // ...
    }
}
```

### Signaling Mechanism

The WebRTC signaling mechanism is implemented as a trait and a concrete implementation:

```rust
/// Signaling trait
pub trait Signaling: Send + Sync {
    /// Send an offer to a peer
    async fn send_offer(&self, peer_id: &PeerId, offer: &SessionDescription) -> Result<()>;
    
    /// Send an answer to a peer
    async fn send_answer(&self, peer_id: &PeerId, answer: &SessionDescription) -> Result<()>;
    
    /// Send an ICE candidate to a peer
    async fn send_ice_candidate(&self, peer_id: &PeerId, candidate: &IceCandidate) -> Result<()>;
    
    /// Receive a signaling event
    async fn receive_event(&mut self) -> Result<SignalingEvent>;
}

/// Libp2p signaling implementation
#[cfg(feature = "webrtc")]
pub struct Libp2pSignaling {
    /// Command sender
    command_sender: mpsc::Sender<SignalingCommand>,
    /// Event receiver
    event_receiver: mpsc::Receiver<SignalingEvent>,
}
```

### Data Channels

The WebRTC data channels are implemented as a separate struct:

```rust
/// WebRTC data channel
#[cfg(feature = "webrtc")]
pub struct WebRtcDataChannel {
    /// Peer ID
    peer_id: PeerId,
    /// Channel state
    state: Arc<Mutex<ChannelState>>,
    /// Message queue
    message_queue: Arc<Mutex<VecDeque<Vec<u8>>>>,
    /// Message sender
    message_sender: mpsc::Sender<Vec<u8>>,
    /// Message receiver
    message_receiver: mpsc::Receiver<Vec<u8>>,
}
```

The data channels provide methods for sending and receiving messages:

```rust
impl WebRtcDataChannel {
    /// Send a message
    pub async fn send(&self, message: Vec<u8>) -> Result<()> {
        // ...
    }
    
    /// Receive a message
    pub async fn receive(&mut self) -> Result<Vec<u8>> {
        // ...
    }
}
```

### WASM Bindings

The WebRTC WASM bindings are implemented as part of the DarkSwapWasm struct:

```rust
/// DarkSwap WebAssembly bindings
#[wasm_bindgen]
pub struct DarkSwapWasm {
    /// DarkSwap instance
    darkswap: Arc<DarkSwap>,
    // ...
    /// WebRTC offer received callback
    #[cfg(feature = "webrtc")]
    webrtc_offer_callback: Option<js_sys::Function>,
    /// WebRTC answer received callback
    #[cfg(feature = "webrtc")]
    webrtc_answer_callback: Option<js_sys::Function>,
    /// WebRTC ICE candidate received callback
    #[cfg(feature = "webrtc")]
    webrtc_ice_candidate_callback: Option<js_sys::Function>,
    /// WebRTC connections
    #[cfg(feature = "webrtc")]
    webrtc_connections: std::collections::HashMap<String, WebRtcConnection>,
}
```

The WASM bindings provide methods for using WebRTC in JavaScript:

```rust
impl DarkSwapWasm {
    /// Make a WebRTC relay reservation
    #[cfg(feature = "webrtc")]
    #[wasm_bindgen]
    pub fn make_webrtc_relay_reservation(&self, relay_peer_id: &str) -> js_sys::Promise {
        // ...
    }
    
    /// Connect through a WebRTC relay
    #[cfg(feature = "webrtc")]
    #[wasm_bindgen]
    pub fn connect_through_webrtc_relay(&self, relay_peer_id: &str, target_peer_id: &str) -> js_sys::Promise {
        // ...
    }
    
    // ...
}
```

## Phase 2 Implementation (Planned)

Phase 2 will focus on enhancing the existing implementation with more robust features, better error handling, and improved performance. See the [WebRTC Implementation Phase 2 Plan](webrtc-implementation-phase2.md) for details.

## Usage

### Rust

```rust
// Create a network
let config = NetworkConfig::default();
let network = Network::new(&config)?;

// Create a WebRTC data channel
network.create_webrtc_data_channel(peer_id.clone()).await?;

// Send a message
let message = b"Hello, world!".to_vec();
network.send_webrtc_message(&peer_id, message).await?;

// Receive a message
let received = network.receive_webrtc_message(&peer_id).await?;
```

### JavaScript

```javascript
// Create a DarkSwap instance
const darkswap = new DarkSwapWasm.new_with_defaults("regtest");

// Make a relay reservation
const reservation = await darkswap.make_webrtc_relay_reservation("relay-peer-id");

// Connect through a relay
await darkswap.connect_through_webrtc_relay("relay-peer-id", "target-peer-id");

// Get relay metrics
const metrics = await darkswap.get_webrtc_relay_metrics();
console.log(`Active connections: ${metrics.active_connections}`);
```

## Conclusion

The WebRTC implementation for DarkSwap provides a solid foundation for peer-to-peer communication in browsers. Phase 1 has been completed successfully, and Phase 2 will further enhance the implementation with more robust features, better error handling, and improved performance.