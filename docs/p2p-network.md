# DarkSwap P2P Network Documentation

## Introduction

The DarkSwap P2P (peer-to-peer) network is a decentralized communication layer that enables direct trading between users without relying on a central server. This document provides a comprehensive overview of the P2P network architecture, protocols, and implementation details.

## Architecture Overview

The DarkSwap P2P network uses a hybrid architecture that combines the benefits of structured and unstructured P2P networks:

```
┌─────────────────────────────────────────────────────────────────┐
│                      DarkSwap P2P Network                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │    Peer     │◄───▶│    Peer     │◄───▶│    Peer     │        │
│  └─────┬───────┘     └─────┬───────┘     └─────┬───────┘        │
│        │                   │                   │                 │
│        ▼                   ▼                   ▼                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │    Peer     │◄───▶│    Peer     │◄───▶│    Peer     │        │
│  └─────┬───────┘     └─────┬───────┘     └─────┬───────┘        │
│        │                   │                   │                 │
│        └───────────────────┼───────────────────┘                 │
│                            │                                     │
│                    ┌───────▼───────┐                             │
│                    │  Relay Server │                             │
│                    └───────┬───────┘                             │
│                            │                                     │
│                    ┌───────▼───────┐                             │
│                    │ Signaling Srv │                             │
│                    └───────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Peers**: Individual nodes in the network (users of the DarkSwap platform)
2. **Relay Servers**: Facilitate connections between peers that cannot connect directly
3. **Signaling Servers**: Help establish WebRTC connections between peers
4. **DHT (Distributed Hash Table)**: Used for peer discovery and content addressing
5. **Circuit Relay**: Enables communication between peers behind restrictive NATs

## Network Protocols

### WebRTC

WebRTC (Web Real-Time Communication) is the primary protocol used for direct peer-to-peer communication in DarkSwap. It enables:

- Direct browser-to-browser communication
- Encrypted data channels
- NAT traversal using ICE (Interactive Connectivity Establishment)
- Fallback to TURN servers when direct connections are not possible

#### WebRTC Connection Establishment

1. **Signaling**: Exchange of session description protocols (SDPs) via the signaling server
2. **ICE Candidate Gathering**: Collection of potential connection methods
3. **Connectivity Checks**: Testing of connection methods
4. **Connection Establishment**: Selection of the best connection path
5. **Data Channel Creation**: Establishment of secure data channels for communication

### libp2p

For non-browser environments (like the daemon and CLI), DarkSwap uses libp2p, a modular networking stack:

- **Transport Protocols**: TCP, WebSockets, QUIC
- **Security Protocols**: Noise, TLS
- **Stream Multiplexing**: YAMUX, MPLEX
- **Peer Discovery**: mDNS, Kademlia DHT
- **NAT Traversal**: AutoNAT, Circuit Relay

## Implementation Details

### WebRTC Transport

The WebRTC transport implementation (`src/p2p/webrtc_transport.rs`) provides:

- Connection establishment and management
- Data channel creation and handling
- Message serialization and deserialization
- Error handling and reconnection logic

Key methods:

```rust
// Create a new WebRTC transport
pub async fn new(config: WebRtcConfig) -> Result<Self, Error>;

// Connect to a peer
pub async fn connect(&self, peer_id: &PeerId) -> Result<Connection, Error>;

// Send a message to a peer
pub async fn send_message(&self, peer_id: &PeerId, message: &[u8]) -> Result<(), Error>;

// Register a message handler
pub fn on_message<F>(&self, handler: F)
where
    F: Fn(PeerId, &[u8]) + Send + Sync + 'static;
```

### Circuit Relay

The circuit relay implementation (`src/p2p/circuit_relay.rs`) enables:

- Communication between peers that cannot connect directly
- Message forwarding through intermediate nodes
- Path selection for optimal routing

Key methods:

```rust
// Create a new circuit relay
pub async fn new(config: CircuitRelayConfig) -> Result<Self, Error>;

// Add a relay server
pub async fn add_relay(&self, relay_address: Multiaddr) -> Result<(), Error>;

// Connect to a peer through a relay
pub async fn connect_via_relay(&self, peer_id: &PeerId) -> Result<Connection, Error>;

// Send a message through a relay
pub async fn send_message_via_relay(&self, peer_id: &PeerId, message: &[u8]) -> Result<(), Error>;
```

### WebRTC Signaling Client

The WebRTC signaling client (`darkswap-p2p/src/webrtc_signaling_client.rs`) handles:

- Connection to the signaling server
- Exchange of session descriptions and ICE candidates
- Authentication and session management

Key methods:

```rust
// Connect to the signaling server
pub async fn connect(&self, url: &str) -> Result<(), Error>;

// Register as available for connections
pub async fn register(&self, peer_id: &PeerId) -> Result<(), Error>;

// Send an offer to a peer
pub async fn send_offer(&self, peer_id: &PeerId, offer: &str) -> Result<(), Error>;

// Send an answer to a peer
pub async fn send_answer(&self, peer_id: &PeerId, answer: &str) -> Result<(), Error>;

// Send an ICE candidate to a peer
pub async fn send_ice_candidate(&self, peer_id: &PeerId, candidate: &str) -> Result<(), Error>;
```

### WebRTC Connection Manager

The WebRTC connection manager (`web/src/utils/WebRtcConnectionManager.ts`) provides:

- High-level API for managing WebRTC connections
- Connection pooling and reuse
- Automatic reconnection
- Connection quality monitoring

Key methods:

```typescript
// Initialize the connection manager
public async init(): Promise<void>;

// Connect to a peer
public async connect(peerId: string): Promise<WebRtcConnection>;

// Send a message to a peer
public async sendMessage(peerId: string, message: any): Promise<void>;

// Register a message handler
public onMessage(handler: (peerId: string, message: any) => void): void;

// Close a connection
public async closeConnection(peerId: string): Promise<void>;
```

## Peer Discovery

DarkSwap uses multiple peer discovery mechanisms:

### DHT-Based Discovery

The Kademlia DHT (Distributed Hash Table) is used for peer discovery in the libp2p implementation:

1. Peers register themselves in the DHT with their peer ID and connection information
2. Other peers can look up peers by their peer ID or by content identifiers
3. The DHT provides a decentralized way to discover peers without relying on central servers

### Relay-Based Discovery

Relay servers maintain a list of connected peers:

1. When a peer connects to a relay server, it registers itself
2. Other peers can request a list of available peers from the relay server
3. This provides a fallback discovery mechanism when DHT-based discovery is not available

### Local Network Discovery

For peers on the same local network:

1. mDNS (multicast DNS) is used to discover peers on the local network
2. This enables efficient trading within local networks without internet connectivity

## Message Types

The P2P network supports various message types:

### Control Messages

- **Ping**: Check if a peer is still connected
- **Pong**: Response to a ping message
- **Disconnect**: Notify a peer that you're disconnecting

### Orderbook Messages

- **OrderCreate**: Create a new order
- **OrderCancel**: Cancel an existing order
- **OrderUpdate**: Update an existing order
- **OrderbookRequest**: Request the current orderbook
- **OrderbookResponse**: Response containing the current orderbook

### Trade Messages

- **TradePropose**: Propose a trade to a peer
- **TradeAccept**: Accept a trade proposal
- **TradeReject**: Reject a trade proposal
- **TradeCancel**: Cancel an ongoing trade
- **TradeSignature**: Send a signature for a trade

### PSBT Messages

- **PsbtCreate**: Create a new PSBT
- **PsbtUpdate**: Update an existing PSBT
- **PsbtSign**: Sign a PSBT
- **PsbtFinalize**: Finalize a PSBT
- **PsbtBroadcast**: Broadcast a finalized PSBT

## Security

### Encryption

All P2P communications in DarkSwap are encrypted:

- WebRTC uses DTLS (Datagram Transport Layer Security) for data channel encryption
- libp2p uses the Noise protocol for secure communication
- All cryptographic operations use industry-standard algorithms and libraries

### Authentication

Peers authenticate each other using:

- Public key cryptography (Ed25519 keys)
- Challenge-response protocols
- Signature verification

### DoS Protection

To prevent denial-of-service attacks:

- Rate limiting is implemented at both the peer and relay levels
- Peers maintain a reputation system for other peers
- Misbehaving peers are temporarily or permanently banned
- Resource usage is monitored and limited

## Performance Optimization

### Message Batching

Small messages are batched together to reduce overhead:

```rust
// Batch multiple small messages into a single larger message
pub fn batch_messages(&self, messages: Vec<Message>) -> BatchedMessage;

// Extract individual messages from a batched message
pub fn unbatch_messages(&self, batched: BatchedMessage) -> Vec<Message>;
```

### Connection Pooling

Connections are pooled and reused to avoid the overhead of establishing new connections:

```rust
// Get a connection from the pool or create a new one
pub async fn get_connection(&self, peer_id: &PeerId) -> Result<PooledConnection, Error>;

// Return a connection to the pool
pub fn return_connection(&self, connection: PooledConnection);
```

### Message Prioritization

Messages are prioritized based on their importance:

- **High Priority**: Trade-related messages, order cancellations
- **Medium Priority**: Order creation, orderbook updates
- **Low Priority**: Peer discovery, statistics

## Monitoring and Metrics

The P2P network collects various metrics:

### Connection Metrics

- Number of active connections
- Connection establishment time
- Connection duration
- Connection type (direct or relayed)
- Connection quality (latency, packet loss)

### Message Metrics

- Messages sent and received
- Message size distribution
- Message delivery time
- Message success rate
- Message retry count

### Network Metrics

- Network topology
- Peer distribution
- Relay server load
- DHT query performance
- NAT traversal success rate

## Configuration

The P2P network is highly configurable:

### WebRTC Configuration

```json
{
  "iceServers": [
    {
      "urls": "stun:stun.l.google.com:19302"
    },
    {
      "urls": "turn:turn.darkswap.io:3478",
      "username": "username",
      "credential": "password"
    }
  ],
  "iceTransportPolicy": "all",
  "bundlePolicy": "balanced",
  "rtcpMuxPolicy": "require",
  "iceCandidatePoolSize": 10
}
```

### libp2p Configuration

```json
{
  "listenAddresses": ["/ip4/0.0.0.0/tcp/9000", "/ip4/0.0.0.0/tcp/9001/ws"],
  "bootstrapPeers": [
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa"
  ],
  "dht": {
    "enabled": true,
    "clientMode": false,
    "kBucketSize": 20,
    "recordTTL": 24
  },
  "relay": {
    "enabled": true,
    "autoRelay": true,
    "hop": false,
    "active": true,
    "discovery": true
  }
}
```

## Troubleshooting

### Common Issues

#### ICE Connection Failures

If WebRTC connections fail during the ICE phase:

1. Check if STUN/TURN servers are reachable
2. Verify that the correct ICE servers are configured
3. Check for firewall or NAT issues
4. Try using a different network

#### Signaling Server Connection Issues

If connections to the signaling server fail:

1. Check if the signaling server is operational
2. Verify that the correct signaling URL is configured
3. Check for WebSocket connection issues
4. Try using an alternative signaling server

#### Peer Discovery Problems

If peers cannot be discovered:

1. Check if DHT bootstrapping is working
2. Verify that relay servers are reachable
3. Check for network connectivity issues
4. Try using a different peer discovery method

## Future Improvements

### Planned Enhancements

1. **WebTransport Support**: Add support for the WebTransport protocol for more efficient browser-to-server communication
2. **Gossipsub Integration**: Implement the Gossipsub protocol for more efficient message propagation
3. **Hole Punching Improvements**: Enhance NAT traversal capabilities with advanced hole punching techniques
4. **Bandwidth Optimization**: Implement adaptive compression and message prioritization
5. **Multi-Path Routing**: Enable the use of multiple paths for improved reliability and performance

## Conclusion

The DarkSwap P2P network provides a robust foundation for decentralized trading. Its hybrid architecture combines the benefits of structured and unstructured P2P networks, while its use of WebRTC and libp2p enables cross-platform communication between browsers and native applications.

By understanding the P2P network architecture and implementation details, developers can build applications that leverage the full power of the DarkSwap platform.

## References

- [WebRTC 1.0: Real-Time Communication Between Browsers](https://www.w3.org/TR/webrtc/)
- [libp2p Specifications](https://github.com/libp2p/specs)
- [Interactive Connectivity Establishment (ICE)](https://tools.ietf.org/html/rfc8445)
- [Kademlia: A Peer-to-peer Information System Based on the XOR Metric](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf)
- [Circuit Relay for libp2p](https://github.com/libp2p/specs/blob/master/relay/circuit-v2.md)