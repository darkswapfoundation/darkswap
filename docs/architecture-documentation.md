# DarkSwap Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
   - [High-Level Architecture](#high-level-architecture)
   - [Component Interactions](#component-interactions)
   - [Deployment Architecture](#deployment-architecture)
3. [Core Components](#core-components)
   - [DarkSwap SDK](#darkswap-sdk)
   - [DarkSwap Daemon](#darkswap-daemon)
   - [DarkSwap CLI](#darkswap-cli)
   - [DarkSwap Web Interface](#darkswap-web-interface)
   - [DarkSwap Relay Server](#darkswap-relay-server)
4. [Data Flow](#data-flow)
   - [Order Creation and Matching](#order-creation-and-matching)
   - [Trade Execution](#trade-execution)
   - [P2P Communication](#p2p-communication)
   - [WebRTC Communication](#webrtc-communication)
   - [Circuit Relay](#circuit-relay)
5. [Security Model](#security-model)
   - [Authentication and Authorization](#authentication-and-authorization)
   - [Data Protection](#data-protection)
   - [Secure Communication](#secure-communication)
   - [Wallet Security](#wallet-security)
6. [Scalability Considerations](#scalability-considerations)
   - [Performance Optimizations](#performance-optimizations)
   - [Scaling Strategies](#scaling-strategies)
   - [Load Balancing](#load-balancing)
7. [Future Enhancements](#future-enhancements)
   - [Planned Features](#planned-features)
   - [Architectural Improvements](#architectural-improvements)
   - [Research Areas](#research-areas)

## Overview

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables users to trade these assets without requiring a central server or authority, using WebRTC for browser-to-browser communication and circuit relay for NAT traversal.

This document provides a comprehensive overview of the DarkSwap architecture, including the system architecture, component interactions, data flow, security model, and scalability considerations.

## System Architecture

### High-Level Architecture

DarkSwap follows a decentralized architecture with the following key components:

1. **DarkSwap SDK**: Core library that provides the functionality for creating and taking orders, managing trades, and interacting with the P2P network.

2. **DarkSwap Daemon**: Background service that runs the DarkSwap node, maintaining connections to the P2P network and processing orders and trades.

3. **DarkSwap CLI**: Command-line interface for interacting with the DarkSwap daemon.

4. **DarkSwap Web Interface**: Web-based user interface for interacting with DarkSwap, built with React and TypeScript.

5. **DarkSwap Relay Server**: Server that facilitates connections between peers that cannot connect directly due to NAT or firewall restrictions.

The architecture is designed to be decentralized, with no central server controlling the network. Instead, peers connect directly to each other using WebRTC, with the relay server only used when direct connections are not possible.

### Component Interactions

The components interact with each other as follows:

1. **SDK <-> Daemon**: The SDK communicates with the daemon using a local API, allowing applications to interact with the DarkSwap network.

2. **CLI <-> Daemon**: The CLI communicates with the daemon using the same local API as the SDK, providing a command-line interface for users.

3. **Web Interface <-> SDK**: The web interface uses the SDK via WebAssembly bindings, allowing it to interact with the DarkSwap network directly from the browser.

4. **SDK <-> P2P Network**: The SDK connects to the P2P network using libp2p, allowing it to discover peers and exchange messages.

5. **SDK <-> Relay Server**: When direct connections are not possible, the SDK connects to the relay server to establish connections with other peers.

6. **Web Interface <-> Relay Server**: The web interface connects to the relay server using WebSockets, allowing it to establish WebRTC connections with other peers.

### Deployment Architecture

DarkSwap can be deployed in various configurations:

1. **Full Node**: Runs the daemon, providing full functionality including order book maintenance, trade execution, and relay services.

2. **Light Client**: Runs the SDK without the daemon, connecting to the P2P network directly but relying on full nodes for some functionality.

3. **Web Client**: Runs the web interface in a browser, connecting to the P2P network using WebRTC and WebAssembly.

4. **Relay Server**: Runs the relay server, facilitating connections between peers that cannot connect directly.

The deployment architecture is flexible, allowing users to choose the configuration that best suits their needs.

## Core Components

### DarkSwap SDK

The DarkSwap SDK is the core library that provides the functionality for creating and taking orders, managing trades, and interacting with the P2P network. It is written in Rust and can be used directly or via WebAssembly bindings.

Key features of the SDK include:

- **Order Management**: Creating, canceling, and taking orders.
- **Trade Execution**: Executing trades using Partially Signed Bitcoin Transactions (PSBTs).
- **P2P Networking**: Connecting to the P2P network and discovering peers.
- **Wallet Integration**: Integrating with various wallet types, including Bitcoin Core, BDK, and hardware wallets.
- **WebRTC Support**: Establishing direct connections with other peers using WebRTC.
- **Circuit Relay**: Using relay servers to establish connections when direct connections are not possible.

The SDK is designed to be modular, with separate components for order management, trade execution, P2P networking, and wallet integration. This allows for flexibility in how the SDK is used and makes it easier to maintain and extend.

### DarkSwap Daemon

The DarkSwap daemon is a background service that runs the DarkSwap node, maintaining connections to the P2P network and processing orders and trades. It is written in Rust and uses the DarkSwap SDK for core functionality.

Key features of the daemon include:

- **P2P Network Maintenance**: Maintaining connections to the P2P network and discovering peers.
- **Order Book Maintenance**: Maintaining a local copy of the order book and processing order updates.
- **Trade Processing**: Processing trade requests and executing trades.
- **API Server**: Providing a local API for applications to interact with the daemon.
- **WebSocket Server**: Providing real-time updates to connected clients.

The daemon is designed to run continuously, providing a persistent presence on the P2P network and ensuring that orders and trades are processed even when the user interface is not active.

### DarkSwap CLI

The DarkSwap CLI is a command-line interface for interacting with the DarkSwap daemon. It is written in Rust and uses the DarkSwap SDK for core functionality.

Key features of the CLI include:

- **Order Management**: Creating, canceling, and taking orders.
- **Trade Management**: Managing trades and viewing trade history.
- **Wallet Management**: Managing wallets and viewing balances.
- **Network Management**: Managing connections to the P2P network.
- **Configuration Management**: Managing daemon configuration.

The CLI provides a convenient way for users to interact with DarkSwap without requiring a graphical user interface.

### DarkSwap Web Interface

The DarkSwap web interface is a web-based user interface for interacting with DarkSwap. It is built with React and TypeScript and uses the DarkSwap SDK via WebAssembly bindings.

Key features of the web interface include:

- **Order Book Visualization**: Visualizing the order book and market depth.
- **Trade Form**: Creating and taking orders.
- **Trade History**: Viewing trade history.
- **Wallet Integration**: Integrating with various wallet types.
- **Real-Time Updates**: Receiving real-time updates for orders, trades, and market data.
- **Responsive Design**: Adapting to different screen sizes and devices.

The web interface is designed to be user-friendly and accessible, allowing users to interact with DarkSwap from any device with a modern web browser.

### DarkSwap Relay Server

The DarkSwap relay server is a server that facilitates connections between peers that cannot connect directly due to NAT or firewall restrictions. It is written in Rust and uses WebSockets for communication.

Key features of the relay server include:

- **Circuit Relay**: Establishing circuits between peers that cannot connect directly.
- **WebSocket Server**: Providing a WebSocket interface for peers to connect to.
- **Authentication**: Authenticating peers using JWT tokens.
- **Rate Limiting**: Limiting the number of connections and bandwidth usage per peer.
- **Metrics**: Collecting metrics on connections, circuits, and bandwidth usage.

The relay server is designed to be lightweight and scalable, allowing it to handle a large number of connections and circuits.

## Data Flow

### Order Creation and Matching

The order creation and matching process works as follows:

1. **Order Creation**: A user creates an order using the SDK, CLI, or web interface. The order includes the asset pair, side (buy or sell), amount, and price.

2. **Order Validation**: The order is validated to ensure it meets the requirements (e.g., sufficient balance, valid price).

3. **Order Broadcasting**: The order is broadcast to the P2P network, where it is received by other peers.

4. **Order Book Update**: Peers update their local order books with the new order.

5. **Order Matching**: If the order matches an existing order in the order book, a trade is initiated.

### Trade Execution

The trade execution process works as follows:

1. **Trade Initiation**: When an order is matched, a trade is initiated between the maker (the peer who created the original order) and the taker (the peer who took the order).

2. **Connection Establishment**: The maker and taker establish a direct connection using WebRTC, or a relayed connection using the relay server if direct connection is not possible.

3. **PSBT Creation**: The maker creates a Partially Signed Bitcoin Transaction (PSBT) that represents the trade.

4. **PSBT Signing**: Both the maker and taker sign the PSBT with their respective private keys.

5. **Transaction Broadcasting**: The fully signed transaction is broadcast to the Bitcoin network.

6. **Trade Completion**: Once the transaction is confirmed on the Bitcoin network, the trade is marked as completed.

### P2P Communication

DarkSwap uses libp2p for P2P communication, with the following key components:

1. **Peer Discovery**: Peers discover each other using various discovery mechanisms, including bootstrap peers, mDNS, and DHT.

2. **Connection Establishment**: Peers establish connections using various transport protocols, including TCP, WebSockets, and WebRTC.

3. **Message Exchange**: Peers exchange messages using various protocols, including gossipsub for broadcasting messages and request-response for direct communication.

4. **NAT Traversal**: Peers use various techniques for NAT traversal, including STUN, TURN, and circuit relay.

### WebRTC Communication

DarkSwap uses WebRTC for direct browser-to-browser communication, with the following key components:

1. **Signaling**: Peers exchange signaling information (SDP offers/answers and ICE candidates) using the relay server.

2. **ICE**: Peers use Interactive Connectivity Establishment (ICE) to find the best path for connecting, using STUN and TURN servers if necessary.

3. **DTLS**: Peers establish a secure connection using Datagram Transport Layer Security (DTLS).

4. **Data Channels**: Peers exchange data using WebRTC data channels, which provide reliable, ordered delivery of messages.

### Circuit Relay

When direct WebRTC connections are not possible, DarkSwap uses circuit relay to establish connections between peers. The circuit relay process works as follows:

1. **Relay Connection**: Both peers connect to the relay server using WebSockets.

2. **Circuit Request**: One peer sends a circuit request to the relay server, specifying the peer ID of the other peer.

3. **Circuit Establishment**: The relay server establishes a circuit between the two peers, assigning a unique circuit ID.

4. **Data Relay**: Peers send data through the circuit by including the circuit ID in their messages. The relay server forwards the data to the other peer.

## Security Model

### Authentication and Authorization

DarkSwap uses various authentication and authorization mechanisms:

1. **JWT Authentication**: The relay server and API server use JWT tokens for authentication.

2. **Wallet Authentication**: Users authenticate using their wallet's private key, proving ownership of their Bitcoin address.

3. **Role-Based Access Control**: The API server uses role-based access control to restrict access to certain endpoints.

4. **Permission-Based Access Control**: The daemon uses permission-based access control to restrict access to certain operations.

### Data Protection

DarkSwap protects data using various mechanisms:

1. **End-to-End Encryption**: All communication between peers is encrypted using DTLS (for WebRTC) or TLS (for WebSockets).

2. **Data Minimization**: Only the minimum amount of data necessary for the operation is collected and stored.

3. **Local Storage**: User data is stored locally on the user's device, not on a central server.

4. **Secure Storage**: Sensitive data, such as private keys, is stored securely using platform-specific secure storage mechanisms.

### Secure Communication

DarkSwap ensures secure communication using various mechanisms:

1. **TLS/DTLS**: All communication is encrypted using Transport Layer Security (TLS) or Datagram Transport Layer Security (DTLS).

2. **Certificate Validation**: Certificates are validated to ensure they are issued by a trusted certificate authority.

3. **Certificate Pinning**: Certificate pinning is used to prevent man-in-the-middle attacks.

4. **Secure WebSockets**: WebSocket connections are secured using TLS (wss:// instead of ws://).

### Wallet Security

DarkSwap ensures wallet security using various mechanisms:

1. **Non-Custodial**: DarkSwap is non-custodial, meaning users maintain control of their private keys at all times.

2. **Hardware Wallet Support**: DarkSwap supports hardware wallets, which provide enhanced security by keeping private keys offline.

3. **Secure Key Storage**: Private keys are stored securely using platform-specific secure storage mechanisms.

4. **Transaction Verification**: Users can verify transaction details before signing, ensuring they are not being tricked into signing malicious transactions.

## Scalability Considerations

### Performance Optimizations

DarkSwap includes various performance optimizations:

1. **WebAssembly Optimization**: The WebAssembly module is optimized for size and performance.

2. **React Component Memoization**: React components are memoized to prevent unnecessary re-renders.

3. **API Response Caching**: API responses are cached to reduce the number of requests.

4. **WebSocket Message Batching**: WebSocket messages are batched to reduce overhead.

5. **Lazy Loading**: Components and resources are loaded lazily to improve initial load time.

### Scaling Strategies

DarkSwap can scale using various strategies:

1. **Horizontal Scaling**: The relay server can be scaled horizontally by adding more instances.

2. **Vertical Scaling**: The relay server can be scaled vertically by increasing the resources allocated to each instance.

3. **Geographic Distribution**: Relay servers can be distributed geographically to reduce latency for users in different regions.

4. **Load Balancing**: Load balancers can distribute traffic across multiple relay servers.

### Load Balancing

DarkSwap uses various load balancing techniques:

1. **DNS Round Robin**: Multiple relay servers can be registered under the same domain name, with DNS round robin used to distribute connections.

2. **Geographic Routing**: Users can be routed to the nearest relay server based on their geographic location.

3. **Load-Based Routing**: Users can be routed to the least loaded relay server.

4. **Failover**: If a relay server fails, users can be automatically routed to a backup server.

## Future Enhancements

### Planned Features

DarkSwap has several planned features:

1. **Multi-Signature Support**: Support for multi-signature wallets and transactions.

2. **Lightning Network Integration**: Integration with the Lightning Network for faster and cheaper transactions.

3. **Cross-Chain Atomic Swaps**: Support for atomic swaps between different blockchains.

4. **Mobile App**: Native mobile applications for iOS and Android.

5. **Enhanced Analytics**: More detailed analytics and reporting for trades and market data.

### Architectural Improvements

DarkSwap has several planned architectural improvements:

1. **Microservices Architecture**: Moving towards a microservices architecture for better scalability and maintainability.

2. **Event-Driven Architecture**: Implementing an event-driven architecture for better responsiveness and scalability.

3. **GraphQL API**: Implementing a GraphQL API for more flexible and efficient data fetching.

4. **Serverless Functions**: Using serverless functions for certain operations to reduce infrastructure costs.

5. **Edge Computing**: Deploying certain components to edge locations for reduced latency.

### Research Areas

DarkSwap is researching several areas for future enhancements:

1. **Zero-Knowledge Proofs**: Using zero-knowledge proofs for enhanced privacy.

2. **Secure Multi-Party Computation**: Using secure multi-party computation for collaborative operations without revealing private data.

3. **Decentralized Identity**: Implementing decentralized identity solutions for user authentication.

4. **Quantum Resistance**: Ensuring the platform is resistant to attacks from quantum computers.

5. **AI/ML Integration**: Using artificial intelligence and machine learning for market analysis and fraud detection.