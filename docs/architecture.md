# DarkSwap Architecture

## Overview

DarkSwap is a decentralized trading platform for Bitcoin, runes, and alkanes. This document provides a comprehensive overview of the DarkSwap architecture, including its components, interactions, and design decisions.

## System Architecture

DarkSwap follows a modular architecture with several key components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DarkSwap System                           │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│  Web Client │    CLI      │   Daemon    │     SDK     │    Relay    │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────────┤
│                         Core Libraries                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│    P2P      │   Wallet    │  Orderbook  │    Trade    │   Support   │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### Components

#### Web Client

The web client is a React-based single-page application that provides a user interface for interacting with the DarkSwap platform. It communicates with the daemon via WebSocket and REST APIs, and can also establish direct P2P connections with other clients using WebRTC.

**Key Features:**
- Responsive design for desktop and mobile
- Real-time updates via WebSocket
- P2P communication via WebRTC
- WebAssembly integration for performance-critical operations
- Offline capabilities using IndexedDB

**Technologies:**
- React
- TypeScript
- WebRTC
- WebAssembly
- IndexedDB

#### CLI

The command-line interface provides a way to interact with the DarkSwap platform from the terminal. It's built using Rust and provides all the functionality of the web client in a command-line format.

**Key Features:**
- Full trading functionality
- Wallet management
- Batch operations
- Scripting capabilities

**Technologies:**
- Rust
- clap (for command-line parsing)

#### Daemon

The daemon is a background service that handles the core functionality of the DarkSwap platform. It manages the wallet, orderbook, and P2P connections, and provides APIs for the web client and CLI to interact with.

**Key Features:**
- REST API for client communication
- WebSocket API for real-time updates
- P2P networking for decentralized operation
- Wallet management
- Order matching

**Technologies:**
- Rust
- actix-web (for the REST API)
- tokio (for async I/O)
- libp2p (for P2P networking)

#### SDK

The SDK provides libraries for developers to build applications that interact with the DarkSwap platform. It's available in multiple languages, including JavaScript/TypeScript and Rust.

**Key Features:**
- API client
- WebSocket client
- P2P networking
- Wallet management
- Order creation and management

**Technologies:**
- JavaScript/TypeScript
- Rust
- WebAssembly

#### Relay

The relay server facilitates P2P connections between clients that can't establish direct connections due to NAT or firewall issues. It acts as a signaling server for WebRTC connections and can also relay messages if needed.

**Key Features:**
- WebRTC signaling
- Message relaying
- NAT traversal
- Circuit relay for libp2p

**Technologies:**
- Rust
- tokio
- libp2p

### Core Libraries

#### P2P

The P2P library handles peer-to-peer communication between DarkSwap nodes. It supports both browser-based WebRTC connections and native libp2p connections.

**Key Features:**
- Peer discovery
- Connection establishment
- Message encryption
- NAT traversal
- Circuit relay

**Technologies:**
- Rust
- libp2p
- WebRTC

#### Wallet

The wallet library manages cryptographic keys and transactions. It supports both built-in wallets and integration with external wallets.

**Key Features:**
- Key management
- Transaction creation and signing
- PSBT support
- Runes and alkanes support
- Hardware wallet integration

**Technologies:**
- Rust
- bitcoin (Rust library)
- bdk (Bitcoin Development Kit)

#### Orderbook

The orderbook library manages the decentralized orderbook. It handles order creation, matching, and distribution.

**Key Features:**
- Order creation and validation
- Order matching
- Order distribution via P2P
- Order book synchronization

**Technologies:**
- Rust
- Custom data structures for efficient matching

#### Trade

The trade library handles the execution of trades. It creates PSBTs, manages signatures, and broadcasts transactions to the Bitcoin network.

**Key Features:**
- PSBT creation
- Signature collection
- Transaction broadcasting
- Trade status tracking

**Technologies:**
- Rust
- bitcoin (Rust library)

#### Support

The support library provides common utilities and functionality used by other components.

**Key Features:**
- Logging
- Error handling
- Configuration management
- Metrics collection

**Technologies:**
- Rust
- slog (for logging)
- prometheus (for metrics)

## Data Flow

### Order Creation and Matching

1. A user creates an order using the web client or CLI.
2. The order is sent to the daemon via the REST API.
3. The daemon validates the order and adds it to the local orderbook.
4. The order is distributed to other nodes via the P2P network.
5. When a matching order is found, a trade is created.
6. Both parties are notified of the trade via WebSocket.
7. Both parties sign the PSBT.
8. The fully signed transaction is broadcast to the Bitcoin network.

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│   Client │────▶│  Daemon  │────▶│ Orderbook│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │                │
                                       ▼                │
                                  ┌──────────┐         │
                                  │   P2P    │◀────────┘
                                  └──────────┘
                                       │
                                       ▼
                                  ┌──────────┐
                                  │  Other   │
                                  │  Nodes   │
                                  └──────────┘
```

### P2P Communication

1. A node discovers other nodes via the DHT or relay servers.
2. The node establishes connections with other nodes.
3. The node exchanges orderbook information with other nodes.
4. When a match is found, the nodes create a trade.
5. The nodes exchange signatures for the PSBT.
6. The fully signed transaction is broadcast to the Bitcoin network.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Node A  │────▶│  Relay   │────▶│  Node B  │
└──────────┘     └──────────┘     └──────────┘
     │                                 │
     └─────────────────────────────────┘
               Direct connection
               (if possible)
```

## Security Considerations

### Authentication and Authorization

- The web client and CLI authenticate with the daemon using JWT tokens.
- API endpoints are protected with role-based access control.
- WebSocket connections are authenticated using the same JWT tokens.

### Encryption

- All communication between components is encrypted using TLS.
- P2P communication is encrypted using libp2p's built-in encryption.
- WebRTC connections are encrypted using DTLS.

### Key Management

- Private keys are stored encrypted on disk.
- Hardware wallet support is available for enhanced security.
- Key derivation follows BIP39, BIP44, and BIP84 standards.

### Transaction Security

- All trades use PSBTs to ensure atomicity.
- Transactions are validated before signing.
- Transaction fees are carefully calculated to ensure timely confirmation.

## Scalability Considerations

### Horizontal Scaling

- The daemon can be deployed in a cluster for horizontal scaling.
- The relay servers can be deployed behind a load balancer.
- The P2P network naturally scales as more nodes join.

### Performance Optimization

- WebAssembly is used for performance-critical operations in the web client.
- The orderbook uses efficient data structures for fast matching.
- The P2P network uses a gossip protocol to minimize bandwidth usage.

### Caching

- The web client caches data in IndexedDB for offline use.
- The daemon caches frequently accessed data in memory.
- The SDK includes a caching layer to reduce API calls.

## Deployment Architecture

DarkSwap can be deployed in various configurations depending on the use case:

### Self-Hosted

Users can run their own DarkSwap node, which includes the daemon and optionally the web client and relay server. This provides maximum privacy and control.

```
┌─────────────────────────────────────┐
│             User's Machine          │
├─────────────┬─────────────┬─────────┤
│  Web Client │   Daemon    │  Relay  │
└─────────────┴─────────────┴─────────┘
```

### Hosted Web Client

Users can access a hosted web client that connects to their local daemon. This provides a convenient user interface without sacrificing control over the daemon.

```
┌─────────────────┐     ┌─────────────────┐
│  Hosted Server  │     │  User's Machine │
├─────────────────┤     ├─────────────────┤
│   Web Client    │────▶│     Daemon      │
└─────────────────┘     └─────────────────┘
```

### Fully Hosted

Users can access a fully hosted solution where both the web client and daemon are hosted. This is the most convenient option but requires trusting the host.

```
┌─────────────────────────────────────┐
│             Hosted Server           │
├─────────────┬─────────────┬─────────┤
│  Web Client │   Daemon    │  Relay  │
└─────────────┴─────────────┴─────────┘
```

## Development Architecture

The DarkSwap codebase is organized as a monorepo with the following structure:

```
darkswap/
├── darkswap-sdk/       # SDK libraries
├── darkswap-cli/       # Command-line interface
├── darkswap-daemon/    # Background service
├── darkswap-relay/     # Relay server
├── darkswap-p2p/       # P2P networking library
├── darkswap-lib/       # Core libraries
├── darkswap-wasm/      # WebAssembly modules
├── darkswap-web-sys/   # Web system bindings
├── web/                # Web client
└── docs/               # Documentation
```

Each component has its own set of tests, documentation, and build scripts. The build system uses Cargo for Rust components and npm for JavaScript/TypeScript components.

## Future Architecture Considerations

### Layer 2 Integration

DarkSwap is exploring integration with Layer 2 solutions like the Lightning Network to enable faster and cheaper transactions.

### Cross-Chain Support

Future versions of DarkSwap may support cross-chain trading between Bitcoin and other blockchains.

### Decentralized Governance

A decentralized governance system is being considered to allow the community to vote on protocol changes and upgrades.

### Privacy Enhancements

Additional privacy features, such as confidential transactions and zero-knowledge proofs, are being researched for future implementation.

## Conclusion

The DarkSwap architecture is designed to be modular, secure, and scalable. It leverages the best aspects of both centralized and decentralized systems to provide a robust trading platform for Bitcoin, runes, and alkanes.

By understanding this architecture, developers can better contribute to the DarkSwap ecosystem and build applications that integrate with the platform.