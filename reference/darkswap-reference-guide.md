# DarkSwap Comprehensive Reference Guide

This document serves as a comprehensive reference guide for the DarkSwap project, consolidating information from various sources including memory bank files, reference documentation, and project analysis.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
   - [darkswap-sdk](#darkswap-sdk)
   - [darkswap-cli](#darkswap-cli)
   - [darkswap-daemon](#darkswap-daemon)
   - [Web Interface](#web-interface)
4. [P2P Networking Implementation](#p2p-networking-implementation)
   - [WebRTC Transport](#webrtc-transport)
   - [Circuit Relay](#circuit-relay)
   - [GossipSub](#gossipsub)
   - [Kademlia DHT](#kademlia-dht)
5. [Orderbook Management](#orderbook-management)
   - [Order Data Structures](#order-data-structures)
   - [Order Matching](#order-matching)
   - [Order Expiry](#order-expiry)
6. [Trade Execution](#trade-execution)
   - [PSBT-Based Trading](#psbt-based-trading)
   - [Trade Negotiation Protocol](#trade-negotiation-protocol)
   - [Transaction Validation](#transaction-validation)
7. [Asset Support](#asset-support)
   - [Bitcoin](#bitcoin)
   - [Runes](#runes)
   - [Alkanes](#alkanes)
   - [Orbitals (NFTs)](#orbitals-nfts)
8. [Implementation Details](#implementation-details)
   - [Rust Implementation](#rust-implementation)
   - [WASM Bindings](#wasm-bindings)
   - [WebRTC Integration](#webrtc-integration)
9. [Reference Repositories](#reference-repositories)
   - [PintSwap](#pintswap)
   - [Subfrost](#subfrost)
   - [Alkanes-rs](#alkanes-rs)
   - [OYL-SDK](#oyl-sdk)
   - [Orbitals](#orbitals)
10. [Development Workflow](#development-workflow)
11. [Future Directions](#future-directions)

## Introduction

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables users to trade assets directly with each other without intermediaries, leveraging the power of PSBTs (Partially Signed Bitcoin Transactions) for secure trading.

The project is inspired by PintSwap, which provides similar functionality for Ethereum-based assets, but is adapted for the Bitcoin ecosystem. DarkSwap uses rust-libp2p with WebRTC transport for P2P networking, enabling browser compatibility and direct peer-to-peer connections.

### Core Requirements

1. **Decentralized P2P Trading**
   - Enable direct peer-to-peer trading without intermediaries
   - Implement a decentralized orderbook using P2P networking
   - Support direct connections between traders

2. **Bitcoin, Runes, and Alkanes Support**
   - Support trading of Bitcoin (BTC)
   - Support trading of runes (fungible tokens on Bitcoin)
   - Support trading of alkanes (protocol built on top of runes)

3. **Orderbook-Based Trading**
   - Implement an orderbook for listing and matching orders
   - Support limit orders with specified prices
   - Support order cancellation and expiry

4. **Secure Trading**
   - Use PSBTs for secure trade execution
   - Implement comprehensive transaction validation
   - Ensure atomicity of trades

5. **Cross-Platform Compatibility**
   - Support desktop platforms (Linux, macOS, Windows)
   - Support web browsers through WASM compilation
   - Support mobile browsers (iOS, Android)

## Architecture Overview

DarkSwap follows a modular architecture with clear separation of concerns. The system is divided into several key components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   darkswap-sdk  │◄────┤  darkswap-cli   │     │  darkswap-daemon│
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │                                               │
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│                 │                           │                 │
│  Web Interface  │                           │   P2P Network   │
│                 │                           │                 │
└─────────────────┘                           └─────────────────┘
```

### Key Technical Decisions

1. **Rust for Core Components**
   - Safety through Rust's ownership model
   - Performance comparable to C/C++
   - Cross-platform support including WASM
   - Rich ecosystem for Bitcoin and P2P networking

2. **libp2p for P2P Networking**
   - Modularity for using only needed components
   - Cross-platform support including browsers
   - Multiple transport protocols (TCP, WebSockets, WebRTC)
   - NAT traversal mechanisms

3. **PSBTs for Trade Execution**
   - Atomicity for secure trades
   - Transaction validation before signing
   - Compatibility with Bitcoin ecosystem
   - Support for complex transactions

4. **WASM for Browser Integration**
   - Near-native performance in browsers
   - Language agnostic (using Rust in browsers)
   - Security through sandboxed environment
   - Portability across major browsers

### Design Patterns

DarkSwap uses several design patterns to ensure maintainability, testability, and extensibility:

- **Modular Design**: Clear component responsibilities and well-defined APIs
- **Event-Driven Architecture**: Asynchronous operations and component communication
- **Repository Pattern**: Abstract data storage and retrieval
- **Strategy Pattern**: Different implementations of key algorithms
- **Factory Pattern**: Object creation without specifying exact class
- **Observer Pattern**: Component notification of events

## Core Components

### darkswap-sdk

The SDK is the core library that provides all the functionality needed for P2P trading. It is written in Rust and can be compiled to WebAssembly for browser integration.

#### SDK Structure

```
darkswap-sdk/
├── src/
│   ├── lib.rs           # Main entry point
│   ├── config.rs        # Configuration
│   ├── error.rs         # Error handling
│   ├── types.rs         # Common types
│   ├── network.rs       # P2P networking
│   ├── orderbook.rs     # Orderbook management
│   ├── trade.rs         # Trade execution
│   ├── bitcoin_utils.rs # Bitcoin utilities
│   └── wasm.rs          # WASM bindings
```

#### SDK Modules

1. **Network Module**: Handles P2P networking using libp2p.
   - P2P network implementation using rust-libp2p
   - Circuit relay functionality for NAT traversal
   - WebRTC transport for browser compatibility
   - Event handling system

2. **Orderbook Module**: Manages orders and matches trades.
   - Order data structures for Bitcoin, runes, and alkanes
   - Orderbook management with order matching
   - Order expiry and cleanup
   - Thread-safe orderbook with mutex protection

3. **Trade Module**: Handles trade execution using PSBTs.
   - Trade data structures
   - Trade negotiation protocol
   - PSBT creation and signing
   - Transaction validation and broadcasting

4. **Bitcoin Utils Module**: Provides utilities for working with Bitcoin.
   - Bitcoin wallet interface
   - Simple wallet for testing
   - PSBT utilities for creating and signing PSBTs
   - Transaction validation and broadcasting

5. **Types Module**: Defines common data structures.

6. **Config Module**: Handles configuration.

7. **WASM Module**: Provides WebAssembly bindings for browser integration.
   - JavaScript API for the Rust code
   - Event handling for order and trade events
   - Wallet connection functionality
   - Promise-based API for asynchronous operations

### darkswap-cli

The CLI is a command-line interface for interacting with the SDK. It provides commands for creating orders, taking orders, and managing the orderbook.

#### CLI Structure

```
darkswap-cli/
├── src/
│   └── main.rs          # CLI implementation
```

#### CLI Commands

1. **Create Order Command**: Creates a new order.
2. **Cancel Order Command**: Cancels an existing order.
3. **Take Order Command**: Takes an existing order.
4. **List Orders Command**: Lists orders for a trading pair.
5. **Get Best Bid Ask Command**: Gets the best bid and ask for a trading pair.
6. **Connect Wallet Command**: Connects a wallet.
7. **Start Daemon Command**: Starts the daemon.

### darkswap-daemon

The daemon is a background service that hosts an orderbook and facilitates trades. It provides a REST API for interacting with the service.

#### Daemon Structure

```
darkswap-daemon/
├── src/
│   └── main.rs          # Daemon implementation
```

#### Daemon Components

1. **API Server**: Provides a REST API for interacting with the daemon.
2. **Event System**: Notifies clients of events such as order creation, cancellation, and filling.
3. **P2P Node**: Participates in the P2P network for orderbook distribution and trade execution.
4. **Wallet Integration**: Connects to Bitcoin wallets for transaction signing.

### Web Interface

The web interface is a React-based UI for interacting with the SDK. It uses the SDK's WASM bindings to communicate with the P2P network.

#### Web Structure

```
web/
├── src/
│   ├── main.tsx         # Main entry point
│   ├── App.tsx          # Root component
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript types
```

#### Web Components

1. **React Components**: Provide the UI elements.
   - Header component
   - Orderbook component
   - Trade form component
   - Order list component
   - Wallet connection component

2. **Pages**:
   - Trade page
   - Orders page
   - About page
   - Settings page

3. **State Management**: Manages the application state.
   - Order state
   - Trade state
   - Wallet state
   - Network state

4. **SDK Integration**: Integrates with the SDK through WASM.
   - WASM loading
   - Event handling
   - Error handling

## P2P Networking Implementation

DarkSwap uses rust-libp2p for P2P networking, with WebRTC transport for browser compatibility and circuit relay for NAT traversal.

### WebRTC Transport

WebRTC (Web Real-Time Communication) is a technology that enables direct peer-to-peer communication between browsers. DarkSwap uses WebRTC as the transport protocol for browser compatibility.

Key aspects of the WebRTC transport implementation:

1. **Browser Compatibility**: WebRTC is supported by all major browsers, enabling cross-platform compatibility.
2. **Direct Peer-to-Peer Communication**: WebRTC enables direct communication between peers without intermediaries.
3. **NAT Traversal**: WebRTC includes mechanisms for NAT traversal, such as STUN and TURN.
4. **Secure Communication**: WebRTC uses DTLS for secure communication.

### Circuit Relay

Circuit relay is a protocol that enables peers to communicate through an intermediary when direct communication is not possible due to NAT or firewall restrictions.

Key aspects of the circuit relay implementation:

1. **NAT Traversal**: Circuit relay enables communication between peers behind NATs.
2. **Relay Discovery**: Peers discover relays through the DHT or bootstrap nodes.
3. **Relay Protocol**: The circuit relay protocol defines how peers establish connections through relays.
4. **Reservation Management**: Peers can reserve slots on relays for future connections.

The circuit relay implementation is ported from Subfrost, which uses QUIC as the transport protocol. The implementation is adapted to use WebRTC instead of QUIC for browser compatibility.

### GossipSub

GossipSub is a publish-subscribe protocol that enables efficient message broadcasting in P2P networks. DarkSwap uses GossipSub for orderbook distribution.

Key aspects of the GossipSub implementation:

1. **Topic-Based Messaging**: Messages are published to topics, and peers subscribe to topics they are interested in.
2. **Efficient Message Propagation**: GossipSub uses a mesh network for efficient message propagation.
3. **Message Deduplication**: GossipSub includes mechanisms for message deduplication.
4. **Message Validation**: Messages can be validated before propagation.

### Kademlia DHT

Kademlia DHT (Distributed Hash Table) is a protocol for peer discovery and content addressing in P2P networks. DarkSwap uses Kademlia DHT for peer discovery.

Key aspects of the Kademlia DHT implementation:

1. **Peer Discovery**: Peers discover other peers through the DHT.
2. **Content Addressing**: Content can be addressed and retrieved through the DHT.
3. **Routing**: The DHT provides efficient routing to peers and content.
4. **Resilience**: The DHT is resilient to peer churn.

## Orderbook Management

DarkSwap uses a decentralized orderbook for order discovery and matching. Each peer maintains a local orderbook and broadcasts order updates to the network.

### Order Data Structures

The orderbook module defines several data structures for representing orders:

1. **Order**: Represents a buy or sell order.
   - Order ID: A unique identifier for the order.
   - Maker: The peer that created the order.
   - Base Asset: The asset being sold.
   - Quote Asset: The asset being bought.
   - Price: The price of the order.
   - Amount: The amount of the base asset being sold.
   - Timestamp: The time the order was created.
   - Expiry: The time the order expires.

2. **OrderSide**: Enum representing the side of an order (buy or sell).

3. **OrderStatus**: Enum representing the status of an order (open, filled, cancelled, expired).

4. **OrderBook**: A collection of orders, organized by trading pair and side.
   - Bids: Buy orders, sorted by price (highest first).
   - Asks: Sell orders, sorted by price (lowest first).
   - Methods for adding, removing, and matching orders.

### Order Matching

The orderbook module includes functionality for matching orders:

1. **Price-Time Priority**: Orders are matched based on price-time priority.
   - For buy orders, the highest price has priority.
   - For sell orders, the lowest price has priority.
   - For orders with the same price, the oldest order has priority.

2. **Matching Algorithm**: The matching algorithm finds the best matching order for a given order.
   - For buy orders, it finds the lowest-priced sell order that meets the price requirement.
   - For sell orders, it finds the highest-priced buy order that meets the price requirement.

3. **Partial Fills**: Orders can be partially filled if the matching order has a smaller amount.
   - The remaining amount of the order stays in the orderbook.

### Order Expiry

The orderbook module includes functionality for handling order expiry:

1. **Expiry Time**: Each order has an expiry time, after which it is considered expired.

2. **Expiry Checking**: The orderbook periodically checks for expired orders and removes them.

3. **Expiry Notification**: When an order expires, a notification is sent to the maker.

## Trade Execution

DarkSwap uses PSBTs (Partially Signed Bitcoin Transactions) for trade execution. The trade module handles the creation, signing, and validation of PSBTs.

### PSBT-Based Trading

PSBTs (Partially Signed Bitcoin Transactions) are a standardized format for representing Bitcoin transactions that are not fully signed yet. DarkSwap uses PSBTs for secure trade execution.

Key aspects of PSBT-based trading:
1. **Transaction Creation**: The maker and taker create PSBTs representing their side of the trade.
   - The maker creates a PSBT with inputs from their wallet and outputs to the taker.
   - The taker creates a PSBT with inputs from their wallet and outputs to the maker.

2. **Transaction Signing**: The maker and taker sign their respective PSBTs.
   - The maker signs the inputs from their wallet.
   - The taker signs the inputs from their wallet.

3. **Transaction Combination**: The signed PSBTs are combined into a single transaction.
   - The combined transaction includes all inputs and outputs from both PSBTs.

4. **Transaction Broadcasting**: The combined transaction is broadcast to the Bitcoin network.
   - The transaction is validated by the Bitcoin network.
   - Once confirmed, the trade is complete.

### Trade Negotiation Protocol

The trade module includes a protocol for negotiating trades:

1. **Trade Intent**: The taker sends a trade intent to the maker, indicating they want to take the order.
   - The trade intent includes the order ID and the amount the taker wants to take.

2. **Trade Acceptance**: The maker accepts the trade intent and creates a PSBT.
   - The PSBT includes inputs from the maker's wallet and outputs to the taker.

3. **PSBT Exchange**: The maker and taker exchange PSBTs.
   - The maker sends their PSBT to the taker.
   - The taker creates their PSBT and sends it to the maker.

4. **PSBT Signing**: The maker and taker sign the combined PSBT.
   - The maker signs the inputs from their wallet.
   - The taker signs the inputs from their wallet.

5. **Transaction Broadcasting**: The combined and signed PSBT is broadcast to the Bitcoin network.
   - The transaction is validated by the Bitcoin network.
   - Once confirmed, the trade is complete.

### Transaction Validation

The trade module includes functionality for validating transactions:

1. **Input Validation**: Ensures that the inputs in the PSBT are valid and belong to the expected wallet.
   - Checks that the inputs exist and are unspent.
   - Checks that the inputs belong to the expected wallet.

2. **Output Validation**: Ensures that the outputs in the PSBT match the trade parameters.
   - Checks that the outputs go to the expected addresses.
   - Checks that the output amounts match the trade parameters.

3. **Fee Validation**: Ensures that the transaction fees are reasonable.
   - Checks that the fees are not too high or too low.
   - Checks that the fees are paid by the expected party.

4. **Signature Validation**: Ensures that the signatures in the PSBT are valid.
   - Checks that the signatures are valid for the inputs.
   - Checks that all required signatures are present.

## Asset Support

DarkSwap supports trading of Bitcoin, runes, and alkanes. Each asset type has its own data structures and trading logic.

### Bitcoin

Bitcoin is the native cryptocurrency of the Bitcoin blockchain. DarkSwap supports trading of Bitcoin through PSBTs.

Key aspects of Bitcoin support:

1. **Wallet Integration**: DarkSwap integrates with Bitcoin wallets for transaction signing.
   - Supports various wallet types, including hardware wallets and software wallets.
   - Provides a simple wallet implementation for testing.

2. **PSBT Handling**: DarkSwap includes utilities for creating and signing PSBTs.
   - Creates PSBTs with inputs from the user's wallet.
   - Signs PSBTs with the user's private keys.
   - Combines PSBTs from multiple parties.

3. **Transaction Broadcasting**: DarkSwap includes functionality for broadcasting transactions to the Bitcoin network.
   - Broadcasts transactions through Bitcoin nodes.
   - Monitors transaction confirmation status.

### Runes

Runes are fungible tokens on Bitcoin, created using the Ordinals protocol. DarkSwap supports trading of runes through PSBTs.

Key aspects of runes support:

1. **Rune Protocol**: DarkSwap implements the rune protocol for creating and transferring runes.
   - Creates runes with specified properties.
   - Transfers runes between addresses.
   - Validates rune transactions.

2. **Rune Data Structures**: DarkSwap includes data structures for representing runes.
   - Rune ID: A unique identifier for the rune.
   - Rune Properties: Properties of the rune, such as name, symbol, and decimals.
   - Rune Balance: The balance of a rune for a given address.

3. **Rune Trading**: DarkSwap includes functionality for trading runes.
   - Creates PSBTs for rune trades.
   - Validates rune trades.
   - Executes rune trades.

### Alkanes

Alkanes are a protocol built on top of runes. DarkSwap supports trading of alkanes through PSBTs.

Key aspects of alkanes support:

1. **Alkane Protocol**: DarkSwap implements the alkane protocol for creating and transferring alkanes.
   - Creates alkanes with specified properties.
   - Transfers alkanes between addresses.
   - Validates alkane transactions.

2. **Alkane Data Structures**: DarkSwap includes data structures for representing alkanes.
   - Alkane ID: A unique identifier for the alkane.
   - Alkane Properties: Properties of the alkane, such as name, symbol, and decimals.
   - Alkane Balance: The balance of an alkane for a given address.

3. **Alkane Trading**: DarkSwap includes functionality for trading alkanes.
   - Creates PSBTs for alkane trades.
   - Validates alkane trades.
   - Executes alkane trades.

### Orbitals (NFTs)

Orbitals are non-fungible tokens (NFTs) on Bitcoin. DarkSwap plans to support trading of orbitals through PSBTs.

Key aspects of orbitals support:

1. **Orbital Protocol**: DarkSwap will implement the orbital protocol for creating and transferring orbitals.
   - Creates orbitals with specified properties.
   - Transfers orbitals between addresses.
   - Validates orbital transactions.

2. **Orbital Data Structures**: DarkSwap will include data structures for representing orbitals.
   - Orbital ID: A unique identifier for the orbital.
   - Orbital Properties: Properties of the orbital, such as name, description, and image.
   - Orbital Ownership: The owner of an orbital.

3. **Orbital Trading**: DarkSwap will include functionality for trading orbitals.
   - Creates PSBTs for orbital trades.
   - Validates orbital trades.
   - Executes orbital trades.

## Implementation Details

### Rust Implementation

DarkSwap is implemented in Rust, a systems programming language known for its safety, performance, and concurrency features.

Key aspects of the Rust implementation:

1. **Memory Safety**: Rust's ownership model prevents common memory-related bugs such as null pointer dereferences, buffer overflows, and data races.
   - Ownership and borrowing rules ensure memory safety without garbage collection.
   - The borrow checker enforces these rules at compile time.

2. **Performance**: Rust provides performance comparable to C and C++ without sacrificing safety.
   - Zero-cost abstractions allow for high-level programming without runtime overhead.
   - Efficient memory management through ownership and borrowing.

3. **Concurrency**: Rust's ownership model enables safe concurrent programming.
   - The type system prevents data races at compile time.
   - The standard library provides various concurrency primitives.

4. **Cross-Platform**: Rust can target multiple platforms, including desktop and web (via WASM).
   - The standard library is platform-agnostic.
   - The build system supports cross-compilation.

### WASM Bindings

DarkSwap uses WebAssembly (WASM) to compile the Rust SDK to a format that can run in web browsers.

Key aspects of the WASM bindings:

1. **wasm-bindgen**: DarkSwap uses wasm-bindgen to create JavaScript bindings for the Rust code.
   - Generates JavaScript wrappers for Rust functions.
   - Handles conversion between Rust and JavaScript types.
   - Provides utilities for working with JavaScript objects and promises.

2. **JavaScript API**: The WASM bindings provide a JavaScript API for interacting with the SDK.
   - Functions for creating and taking orders.
   - Functions for connecting to the P2P network.
   - Functions for wallet integration.

3. **Event Handling**: The WASM bindings include an event system for notifying JavaScript code of events.
   - Events for order creation, cancellation, and filling.
   - Events for trade execution and completion.
   - Events for network status changes.

4. **Promise-Based API**: The WASM bindings provide a promise-based API for asynchronous operations.
   - Functions return promises that resolve when the operation completes.
   - Errors are propagated through promise rejections.

### WebRTC Integration

DarkSwap uses WebRTC for P2P networking in browsers. The WebRTC integration is implemented using rust-libp2p with WebRTC transport.

Key aspects of the WebRTC integration:

1. **WebRTC Transport**: DarkSwap uses the WebRTC transport from rust-libp2p.
   - Implements the Transport trait from libp2p.
   - Uses WebRTC for direct peer-to-peer communication.
   - Handles connection establishment and data transfer.

2. **Signaling**: WebRTC requires a signaling mechanism for connection establishment. DarkSwap uses a combination of approaches:
   - Bootstrap nodes for initial peer discovery.
   - DHT for peer discovery and signaling.
   - Circuit relay for NAT traversal.

3. **NAT Traversal**: WebRTC includes mechanisms for NAT traversal, but additional techniques are needed for reliable connections:
   - STUN servers for NAT traversal.
   - TURN servers as a fallback when direct connections fail.
   - Circuit relay for connections between peers behind symmetric NATs.

4. **Browser Integration**: The WebRTC integration includes browser-specific code for working with the WebRTC API:
   - Uses the browser's WebRTC API through wasm-bindgen.
   - Handles browser-specific quirks and limitations.
   - Provides fallbacks for browsers with limited WebRTC support.

## Reference Repositories

DarkSwap draws inspiration and code from several reference repositories:

### PintSwap

PintSwap is a decentralized peer-to-peer trading platform for Ethereum-based assets. DarkSwap is inspired by PintSwap and adapts its architecture for Bitcoin.

Key aspects of PintSwap that are relevant to DarkSwap:

1. **P2P Networking**: PintSwap uses js-libp2p with WebRTC transport for P2P networking.
   - GossipSub for orderbook distribution.
   - Direct connections for trade execution.
   - Bootstrap nodes for peer discovery.

2. **Orderbook Management**: PintSwap uses a decentralized orderbook for order discovery and matching.
   - Local orderbook with order broadcasting.
   - Order matching and expiry.
   - Order status tracking.

3. **Trade Execution**: PintSwap uses Ethereum transactions for trade execution.
   - Trade negotiation protocol.
   - Transaction creation and signing.
   - Transaction broadcasting.

PintSwap consists of several components:

- **pintswap**: The core library.
- **pintswap-daemon**: A background service for hosting an orderbook.
- **pintswap-cli**: A command-line interface for interacting with the library.
- **pintswap-sdk**: A JavaScript SDK for building applications on top of PintSwap.

### Subfrost

Subfrost is a P2P networking project that uses rust-libp2p with QUIC transport. DarkSwap adapts Subfrost's circuit relay implementation for WebRTC.

Key aspects of Subfrost that are relevant to DarkSwap:

1. **Transport Layer**: Subfrost uses QUIC as its transport protocol.
   - QUIC-V1 (RFC 9000) with fallback support for QUIC draft-29.
   - Enhanced QUIC configuration with permissive timeouts and increased stream limits.
   - Consistent handling of multiaddresses.

2. **Circuit Relay Implementation**: Subfrost implements the Circuit Relay v2 protocol for NAT traversal.
   - Reservation management for relay connections.
   - Connection establishment through relays.
   - Relay discovery through DHT.

3. **Network Behavior**: Subfrost combines multiple network behaviors.
   - Gossipsub for message broadcasting.
   - Kademlia DHT for peer discovery and routing.
   - Identify for peer identity verification.
   - Ping for connection liveness checking.

### Alkanes-rs

Alkanes-rs is a Rust implementation of the alkanes protocol. DarkSwap uses alkanes-rs for alkanes support.

Key aspects of alkanes-rs that are relevant to DarkSwap:

1. **Alkane Protocol**: Alkanes-rs implements the alkane protocol for creating and transferring alkanes.
   - Creates alkanes with specified properties.
   - Transfers alkanes between addresses.
   - Validates alkane transactions.

2. **Alkane Data Structures**: Alkanes-rs includes data structures for representing alkanes.
   - Alkane ID: A unique identifier for the alkane.
   - Alkane Properties: Properties of the alkane, such as name, symbol, and decimals.
   - Alkane Balance: The balance of an alkane for a given address.

3. **Bitcoin Integration**: Alkanes-rs integrates with Bitcoin for alkane transactions.
   - Creates Bitcoin transactions for alkane operations.
   - Validates Bitcoin transactions for alkane operations.
   - Parses Bitcoin transactions for alkane operations.

### OYL-SDK

OYL-SDK is a JavaScript SDK for working with alkanes. DarkSwap uses OYL-SDK as a reference for alkanes support.

Key aspects of OYL-SDK that are relevant to DarkSwap:

1. **Alkane API**: OYL-SDK provides an API for working with alkanes.
   - Creates alkanes with specified properties.
   - Transfers alkanes between addresses.
   - Queries alkane balances and properties.

2. **Wallet Integration**: OYL-SDK integrates with Bitcoin wallets for transaction signing.
   - Supports various wallet types.
   - Handles transaction signing and broadcasting.
   - Manages wallet connections.

3. **Transaction Building**: OYL-SDK includes utilities for building alkane transactions.
   - Creates transactions for alkane operations.
   - Validates transactions for alkane operations.
   - Parses transactions for alkane operations.

### Orbitals

Orbitals is a protocol for non-fungible tokens (NFTs) on Bitcoin. DarkSwap plans to support trading of orbitals.

Key aspects of orbitals that are relevant to DarkSwap:

1. **Orbital Protocol**: The orbital protocol defines how NFTs are created and transferred on Bitcoin.
   - Creates orbitals with specified properties.
   - Transfers orbitals between addresses.
   - Validates orbital transactions.

2. **Orbital Data Structures**: The orbital protocol defines data structures for representing orbitals.
   - Orbital ID: A unique identifier for the orbital.
   - Orbital Properties: Properties of the orbital, such as name, description, and image.
   - Orbital Ownership: The owner of an orbital.

3. **Bitcoin Integration**: The orbital protocol integrates with Bitcoin for orbital transactions.
   - Creates Bitcoin transactions for orbital operations.
   - Validates Bitcoin transactions for orbital operations.
   - Parses Bitcoin transactions for orbital operations.

## Development Workflow

### Prerequisites

- **Rust**: 1.70.0 or later
- **Node.js**: 18.0.0 or later
- **npm**: 9.0.0 or later
- **wasm-pack**: 0.10.0 or later
- **Bitcoin Core**: 25.0 or later (optional, for testing with a local Bitcoin node)

### Development Environment Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/darkswap/darkswap.git
   cd darkswap
   ```

2. **Build the Project**:
   ```bash
   ./build.sh --all
   ```

3. **Run the CLI**:
   ```bash
   ./target/debug/darkswap-cli --help
   ```

4. **Run the Daemon**:
   ```bash
   ./target/debug/darkswap-daemon --listen 127.0.0.1:8000
   ```

5. **Run the Web Interface**:
   ```bash
   cd web
   npm run dev
   ```

### Development Process

1. **Make Changes**: Make changes to the code.
2. **Build**: Build the project with `./build.sh`.
3. **Test**: Run tests with `cargo test` for Rust code and `npm test` for TypeScript code.
4. **Run**: Run the application to test your changes.
5. **Commit**: Commit your changes with a descriptive commit message.

### Code Style Guidelines

- Use consistent naming conventions:
  - CamelCase for types and traits
  - snake_case for functions, methods, and variables
  - SCREAMING_SNAKE_CASE for constants
  - kebab-case for file names

- Follow Rust style guidelines:
  - Use 4 spaces for indentation
  - Keep lines under 100 characters
  - Use meaningful variable names
  - Add documentation comments for public APIs

- Follow TypeScript style guidelines:
  - Use 2 spaces for indentation
  - Keep lines under 100 characters
  - Use meaningful variable names
  - Add JSDoc comments for public APIs

### Testing

1. **Unit Tests**: Write unit tests for individual functions and components.
   - Use Rust's built-in testing framework for Rust code.
   - Use Jest for TypeScript code.

2. **Integration Tests**: Write integration tests for testing the interaction between components.
   - Use Rust's integration testing features for Rust code.
   - Use end-to-end testing frameworks for web interface.

3. **End-to-End Tests**: Write end-to-end tests for testing the entire application.
   - Use tools like Cypress for web interface testing.
   - Use custom test scripts for CLI and daemon testing.

## Future Directions

### Short-Term (1-3 Months)

1. **Complete Core SDK Implementation**:
   - Implement runes and alkanes support
   - Add comprehensive unit tests
   - Optimize performance

2. **Implement CLI and Daemon**:
   - Create a command-line interface for interacting with the SDK
   - Implement a background service for hosting an orderbook
   - Add REST API for interacting with the daemon

3. **Develop Web Interface**:
   - Create a React-based web interface
   - Integrate with the SDK through WASM
   - Add responsive design for mobile compatibility

### Medium-Term (3-6 Months)

1. **Enhance P2P Networking**:
   - Improve NAT traversal with better circuit relay implementation
   - Add more bootstrap nodes for better peer discovery
   - Optimize message propagation for better performance

2. **Add Advanced Trading Features**:
   - Implement advanced order types (stop-loss, take-profit)
   - Add order book visualization
   - Implement trade history and analytics

3. **Improve Wallet Integration**:
   - Add support for more wallet types
   - Improve wallet connection UX
   - Add support for hardware wallets

### Long-Term (6+ Months)

1. **Add Orbitals Support**:
   - Implement support for trading NFTs on Bitcoin
   - Add NFT browsing and discovery features
   - Implement NFT-specific trading logic

2. **Implement Mobile Apps**:
   - Create native mobile apps for iOS and Android
   - Optimize for mobile performance
   - Add mobile-specific features

3. **Enhance Security and Privacy**:
   - Implement advanced security features
   - Add privacy-enhancing technologies
   - Conduct security audits

4. **Build Developer Ecosystem**:
   - Create comprehensive documentation
   - Provide developer tools and SDKs
   - Foster a community of developers building on DarkSwap

### Research Areas

1. **Scalability**:
   - Research ways to improve the scalability of the P2P network
   - Investigate sharding and other scaling techniques
   - Optimize for large numbers of orders and trades

2. **Interoperability**:
   - Research ways to enable cross-chain trading
   - Investigate atomic swaps with other blockchains
   - Explore integration with other Bitcoin protocols

3. **Privacy**:
   - Research privacy-enhancing technologies for P2P trading
   - Investigate zero-knowledge proofs for private trading
   - Explore integration with privacy-focused Bitcoin protocols

4. **Decentralized Governance**:
   - Research decentralized governance models
   - Investigate ways to enable community governance
   - Explore integration with existing governance protocols

