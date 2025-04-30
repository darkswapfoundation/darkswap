# DarkSwap Architecture Overview

## Introduction

DarkSwap is a decentralized trading platform for Bitcoin, runes, and alkanes. This document provides an overview of the DarkSwap architecture, including its components, data flow, and security model.

## System Architecture

DarkSwap uses a layered architecture with the following components:

1. **Core Layer**: Implemented in Rust, provides the core functionality for trading Bitcoin, runes, and alkanes.
2. **WebAssembly Layer**: Provides WebAssembly bindings for the core layer, allowing it to be used in web browsers.
3. **TypeScript Layer**: Provides a TypeScript API for the WebAssembly layer, making it easier to use in web applications.
4. **React Layer**: Provides React components and hooks for the TypeScript layer, making it easier to build web interfaces.

The platform also uses a peer-to-peer network for communication between users:

1. **WebRTC Transport**: Provides direct peer-to-peer connections between users.
2. **Circuit Relay**: Provides relay connections for users behind NATs.
3. **GossipSub**: Provides a publish-subscribe system for distributing orderbook updates.

### Component Diagram

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  Web Interface    |     |  CLI Interface    |     |  Daemon           |
|  (React)          |     |  (Rust)           |     |  (Rust)           |
|                   |     |                   |     |                   |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                         |
         v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  TypeScript API   |     |  Rust API         |     |  Rust API         |
|                   |     |                   |     |                   |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                         |
         v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  WebAssembly      |     |  DarkSwap SDK     |     |  DarkSwap SDK     |
|  Bindings         |     |  (Rust)           |     |  (Rust)           |
|                   |     |                   |     |                   |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                         |
         v                         v                         v
+--------+----------+     +--------+----------+     +--------+----------+
|                   |     |                   |     |                   |
|  DarkSwap SDK     |     |  DarkSwap SDK     |     |  DarkSwap SDK     |
|  (Rust)           |     |  (Rust)           |     |  (Rust)           |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

### Component Descriptions

#### DarkSwap SDK

The DarkSwap SDK is the core of the platform, implemented in Rust. It provides the following functionality:

- **Wallet Management**: Manages Bitcoin, rune, and alkane wallets.
- **Trade Protocol**: Implements the trade protocol for exchanging assets.
- **P2P Network**: Implements the peer-to-peer network for communication between users.
- **Orderbook**: Manages the orderbook of trade offers.

#### WebAssembly Bindings

The WebAssembly bindings provide a bridge between the Rust SDK and the TypeScript API. They are generated using `wasm-bindgen` and allow the SDK to be used in web browsers.

#### TypeScript API

The TypeScript API provides a high-level interface for the WebAssembly bindings. It handles the conversion between Rust and JavaScript types and provides a more idiomatic JavaScript API.

#### React Layer

The React layer provides React components and hooks for the TypeScript API. It makes it easier to build web interfaces for the DarkSwap platform.

#### CLI Interface

The CLI interface provides a command-line interface for the DarkSwap platform. It uses the Rust API directly and provides commands for managing wallets, creating and accepting trade offers, and interacting with the P2P network.

#### Daemon

The daemon is a background service that runs the DarkSwap platform. It provides an HTTP API for interacting with the platform and manages the P2P network connections.

## Data Flow

### Trade Flow

The following diagram shows the data flow for creating and accepting a trade offer:

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
|  Maker UI   |     |  Maker SDK  |     |  Taker SDK  |     |  Taker UI   |
|             |     |             |     |             |     |             |
+------+------+     +------+------+     +------+------+     +------+------+
       |                   |                   |                   |
       |  Create Offer     |                   |                   |
       +------------------>|                   |                   |
       |                   |                   |                   |
       |  Offer Created    |                   |                   |
       |<------------------+                   |                   |
       |                   |                   |                   |
       |                   |  Broadcast Offer  |                   |
       |                   +------------------>|                   |
       |                   |                   |                   |
       |                   |                   |  Offer Received   |
       |                   |                   +------------------>|
       |                   |                   |                   |
       |                   |                   |  Accept Offer     |
       |                   |                   |<------------------+
       |                   |                   |                   |
       |                   |  Accept Offer     |                   |
       |                   |<------------------+                   |
       |                   |                   |                   |
       |  Offer Accepted   |                   |  Offer Accepted   |
       |<------------------+                   +------------------>|
       |                   |                   |                   |
       |                   |  Execute Trade    |                   |
       |                   +------------------>|                   |
       |                   |                   |                   |
       |  Trade Completed  |                   |  Trade Completed  |
       |<------------------+                   +------------------>|
       |                   |                   |                   |
```

### P2P Network Flow

The following diagram shows the data flow for the P2P network:

```
+-------------+     +-------------+     +-------------+
|             |     |             |     |             |
|  Peer A     |     |  Relay      |     |  Peer B     |
|             |     |  Server     |     |             |
+------+------+     +------+------+     +------+------+
       |                   |                   |
       |  Connect          |                   |
       +------------------>|                   |
       |                   |                   |
       |  Connected        |                   |
       |<------------------+                   |
       |                   |                   |
       |                   |  Connect          |
       |                   |<------------------+
       |                   |                   |
       |                   |  Connected        |
       |                   +------------------>|
       |                   |                   |
       |  Publish Message  |                   |
       +------------------>|                   |
       |                   |                   |
       |                   |  Forward Message  |
       |                   +------------------>|
       |                   |                   |
       |  Direct Connection|                   |
       |<---------------------------------------->|
       |                   |                   |
       |  Direct Message   |                   |
       +----------------------------------------->|
       |                   |                   |
```

## Security Model

DarkSwap uses the following security measures:

### Trade Security

1. **Partially Signed Bitcoin Transactions (PSBTs)**: DarkSwap uses PSBTs for trade execution. PSBTs allow users to sign transactions without revealing their private keys.

2. **Transaction Validation**: Before accepting a trade offer, the platform validates the transaction to ensure it meets the trade requirements.

3. **Timeouts**: Trade offers have an expiration time to prevent stale offers from being accepted.

### Network Security

1. **WebRTC Encryption**: WebRTC connections are encrypted to prevent eavesdropping.

2. **Circuit Relay**: The circuit relay server provides a secure way for peers behind NATs to connect to each other.

3. **Peer Authentication**: Peers are authenticated using their peer IDs, which are derived from their public keys.

### Wallet Security

1. **Local Key Storage**: Private keys are stored locally and never sent over the network.

2. **Hardware Wallet Support**: DarkSwap supports hardware wallets for enhanced security.

3. **BIP39 Mnemonic Phrases**: Wallets can be backed up using BIP39 mnemonic phrases.

## Scalability Considerations

DarkSwap is designed to scale in the following ways:

1. **Peer-to-Peer Architecture**: The peer-to-peer architecture allows the platform to scale horizontally as more users join the network.

2. **GossipSub**: The GossipSub protocol provides efficient message distribution, reducing the bandwidth requirements as the network grows.

3. **Circuit Relay Network**: The circuit relay network can be expanded by adding more relay servers, providing better connectivity for users behind NATs.

4. **WebAssembly Optimization**: The WebAssembly modules are optimized for size and performance, allowing the platform to run efficiently in web browsers.

## Deployment Architecture

DarkSwap can be deployed in the following ways:

1. **Web Interface**: The web interface can be deployed to any static web hosting service, such as GitHub Pages, Netlify, or Vercel.

2. **Relay Server**: The relay server can be deployed to a cloud provider, such as AWS, Google Cloud, or DigitalOcean.

3. **Daemon**: The daemon can be run locally by users or deployed to a server for remote access.

### Deployment Diagram

```
+-------------+     +-------------+     +-------------+
|             |     |             |     |             |
|  Web Server |     |  Relay      |     |  User's     |
|  (Static)   |     |  Server     |     |  Browser    |
|             |     |             |     |             |
+------+------+     +------+------+     +------+------+
       |                   |                   |
       |  Serve Files      |                   |
       +----------------------------------------->|
       |                   |                   |
       |                   |  Connect          |
       |                   |<------------------+
       |                   |                   |
       |                   |  Connected        |
       |                   +------------------>|
       |                   |                   |
```

## Conclusion

DarkSwap's architecture is designed to provide a secure, scalable, and user-friendly platform for trading Bitcoin, runes, and alkanes. The layered approach allows for flexibility in implementation and deployment, while the peer-to-peer network provides decentralization and resilience.

The combination of Rust for the core functionality, WebAssembly for browser compatibility, TypeScript for developer experience, and React for the user interface creates a powerful platform that can be used in a variety of environments.