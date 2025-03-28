# DarkSwap Active Context

This document provides information about the current work focus, recent changes, next steps, and active decisions and considerations for the DarkSwap project.

## Current Work Focus

The current focus of the DarkSwap project is implementing a modular P2P architecture with WebRTC support for cross-platform compatibility. This involves:

1. **P2P Stack Implementation**: Porting the subfrost-relay and subfrost-node (which contains P2P functionality) crates to create a modular P2P stack with WebRTC support.
2. **Component Modularization**: Factoring out common P2P code that can be shared between the relay, daemon, and browser components.
3. **Cross-Platform Support**: Ensuring the codebase can be built for both wasm and x86_64-unknown-linux-gnu targets.
4. **TypeScript Integration**: Creating a TypeScript library (darkswap-lib) that provides the same functionality as the Rust SDK.
5. **Core SDK Implementation**: Completing the core SDK with runes and alkanes support, comprehensive unit tests, and performance optimizations.
6. **Daemon Stability**: Fixing issues in the daemon to ensure stable operation, such as the recent WebSocket event handling fix.

### Specific Implementation Tasks

1. **Complete Runes and Alkanes Support**:
   - Implement rune protocol in darkswap-sdk
   - Implement alkane protocol in darkswap-sdk
   - Add tests for runes and alkanes functionality
   - Update API to support runes and alkanes trading

2. **Port Subfrost Crates**:
   - Extract P2P networking code from subfrost-node/src/network.rs and subfrost-node/src/circuit_relay.rs
   - Port the subfrost-relay crate for relay functionality
   - Adapt the code to use WebRTC instead of QUIC

3. **Create Modular Architecture**:
   - Implement darkswap-support for shared protobuf definitions and common code
   - Implement darkswap-p2p for core P2P networking functionality
   - Ensure code can be compiled for both native and WASM targets

4. **Implement WebRTC Support**:
   - Use rust-libp2p with WebRTC transport
   - Implement DTLS/ICE connectivity in the relay
   - Ensure browser compatibility with native RTC support

5. **Develop TypeScript Integration**:
   - Create darkswap-web-sys as WASM bindings for browser
   - Develop darkswap-lib as a TypeScript wrapper around darkswap-web-sys
   - Ensure parity between Rust and TypeScript implementations

6. **Set Up Relay Infrastructure**:
   - Deploy darkswap-relay at p2p.darkswap.xyz
   - Configure for circuit relay v2 support
   - Implement bootstrap mechanism for web clients

## Recent Changes

### Daemon Improvements

1. **WebSocket Event Handling Fix**:
   - Fixed an issue in darkswap-daemon/src/handlers.rs where there was a problem with nested tokio::spawn calls
   - The code had an extra closing brace and parenthesis that was causing a mismatched delimiter error
   - This fix ensures that WebSocket events are properly handled and forwarded to clients

2. **OrderId Import Verification**:
   - Verified that the OrderId import in darkswap-daemon/src/api.rs is correctly coming from the orderbook module
   - This ensures that the API correctly references the OrderId type from the SDK

### Core SDK Implementation

1. **Network Module**: Implemented the network module with WebRTC transport and circuit relay functionality.
   - Created a P2P network implementation using rust-libp2p
   - Implemented circuit relay functionality for NAT traversal
   - Added WebRTC transport for browser compatibility
   - Implemented event handling system

2. **Orderbook Module**: Implemented the orderbook module for managing orders.
   - Created order data structures for Bitcoin, runes, and alkanes
   - Implemented orderbook management with order matching
   - Added order expiry and cleanup
   - Implemented thread-safe orderbook with mutex protection

3. **Trade Module**: Implemented the trade module for executing trades.
   - Created trade data structures
   - Implemented trade negotiation protocol
   - Added PSBT creation and signing
   - Implemented transaction validation and broadcasting

4. **Bitcoin Utilities**: Implemented Bitcoin utilities for wallet integration and PSBT handling.
   - Created Bitcoin wallet interface
   - Implemented simple wallet for testing
   - Added PSBT utilities for creating and signing PSBTs
   - Implemented transaction validation and broadcasting

5. **WASM Bindings**: Implemented WebAssembly bindings for browser integration.
   - Created JavaScript API for the Rust code
   - Implemented event handling for order and trade events
   - Added wallet connection functionality
   - Created promise-based API for asynchronous operations

6. **Documentation**: Created comprehensive documentation for the project.
   - Analyzed Subfrost for circuit relay implementation
   - Analyzed PintSwap for P2P orderbook and trading functionality
   - Documented the architecture and design decisions
   - Created an implementation plan for DarkSwap

## Subfrost Analysis

We've conducted an in-depth analysis of the Subfrost project, focusing on its P2P networking implementation and circuit relay functionality. Key findings include:

1. **Transport Layer**:
   - Subfrost uses QUIC as its transport protocol, specifically focusing on QUIC-V1 (RFC 9000) with fallback support for QUIC draft-29
   - Enhanced QUIC configuration with permissive timeouts and increased stream limits
   - Consistent handling of multiaddresses across the codebase

2. **Circuit Relay Implementation**:
   - Implements the Circuit Relay v2 protocol for NAT traversal
   - Reservation management for relay connections
   - Connection establishment through relays

3. **Network Behavior**:
   - Combined network behaviors (Gossipsub, Kademlia DHT, etc.)
   - Comprehensive event system
   - Peer identity verification

These findings have informed our implementation of WebRTC transport and circuit relay functionality for DarkSwap.

## PintSwap Analysis

We've also analyzed the PintSwap project to understand its architecture and how it can be adapted for DarkSwap. Key findings include:

1. **P2P Networking**:
   - PintSwap uses js-libp2p with WebRTC transport
   - GossipSub protocol for message broadcasting
   - Peer discovery using bootstrap nodes and DHT

2. **Orderbook Management**:
   - Local orderbook with order broadcasting
   - Order matching and expiry
   - Order status tracking

3. **Trade Execution**:
   - Trade negotiation protocol
   - Transaction creation and signing
   - Transaction broadcasting

These findings have informed our implementation of the orderbook management and trade execution for DarkSwap.

## P2P Architecture Redesign

We're implementing a significant redesign of the P2P architecture based on the subfrost-relay and subfrost-node crates. The new architecture will be more modular and support WebRTC for cross-platform compatibility.

### New Component Structure

1. **darkswap-support**:
   - Contains all the protobuf definitions and shared code that is not specific to wasm or x86_64 builds
   - Includes common data structures, error types, and utility functions
   - Provides protocol buffer definitions for P2P communication
   - Serves as a dependency for both darkswap-p2p and darkswap-sdk

2. **darkswap-p2p**:
   - Core P2P networking library that can be used by both server and browser builds
   - Implements WebRTC transport for rust-libp2p
   - Provides circuit relay functionality for NAT traversal
   - Handles peer discovery and connection management
   - Can be compiled to both native code and WebAssembly

3. **darkswap-sdk**:
   - The core Rust library that provides all the functionality needed for P2P trading
   - Depends on darkswap-p2p for networking capabilities
   - Implements the trading protocol, orderbook management, and transaction handling
   - Provides a high-level API for creating and taking orders

4. **darkswap-web-sys**:
   - WebAssembly bindings for the P2P protocol that can be used in browsers
   - Compiled from Rust code using wasm-bindgen
   - Provides JavaScript bindings for the Rust P2P functionality
   - Uses the browser's native WebRTC support for P2P communication

5. **darkswap-lib**:
   - TypeScript/JavaScript library that provides the same functionality as darkswap-sdk but for web environments
   - Imports darkswap-web-sys for P2P connectivity
   - Implements the same trading protocol as darkswap-sdk
   - Provides a TypeScript API that mirrors the Rust SDK API

6. **darkswap-relay**:
   - A server that provides DTLS/ICE connectivity and circuit relay v2 support for NAT traversal
   - Implements the circuit relay protocol from subfrost-relay
   - Provides bootstrap nodes for the P2P network
   - Hosted at p2p.darkswap.xyz for public access

7. **darkswap-daemon**:
   - A background service that hosts an orderbook and facilitates trades
   - Uses darkswap-sdk for P2P networking and trading functionality
   - Provides a REST API for interacting with the P2P network
   - Can run as a standalone service or as part of a desktop application

8. **darkswap-app**:
   - A web-based user interface that uses darkswap-lib to interact with the P2P network
   - Connects to the P2P network using the darkswap-relay bootstrap nodes
   - Provides a user-friendly interface for creating and taking orders
   - Supports wallet integration for transaction signing

### Component Relationships

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          darkswap-support                                 │
│                      (Protobuf & Shared Code)                             │
└───────────────────────────────────────────────────────────────────────────┘
                 ▲                                      ▲
                 │                                      │
                 │                                      │
┌────────────────┴─────────────────┐      ┌─────────────┴─────────────────┐
│                                  │      │                               │
│           darkswap-p2p           │      │         darkswap-web-sys      │
│      (Rust P2P Networking)       │      │        (WASM Bindings)        │
└────────────────┬─────────────────┘      └─────────────┬─────────────────┘
                 ▲                                      ▲
                 │                                      │
                 │                                      │
┌────────────────┴─────────────────┐      ┌─────────────┴─────────────────┐
│                                  │      │                               │
│           darkswap-sdk           │      │          darkswap-lib         │
│        (Rust Trading SDK)        │      │      (TypeScript Library)     │
└────────────────┬─────────────────┘      └─────────────┬─────────────────┘
                 ▲                                      ▲
                 │                                      │
                 │                                      │
┌────────────────┴─────────┐  ┌───────────┐  ┌─────────┴─────────────────┐
│                          │  │           │  │                           │
│      darkswap-relay      │  │darkswap-  │  │       darkswap-app        │
│    (Circuit Relay)       │  │ daemon    │  │     (Web Interface)       │
└──────────────────────────┘  └───────────┘  └───────────────────────────┘
```

### WebRTC Integration

The new architecture will use WebRTC for browser-to-browser communication, leveraging the browser's native RTC support. This will allow for direct peer-to-peer connections between browsers without requiring a central server.

Key aspects of the WebRTC integration:

1. **WebRTC Transport for rust-libp2p**:
   - Implementing a custom WebRTC transport for rust-libp2p
   - Supporting both browser and native environments
   - Handling WebRTC connection establishment and data channels
   - Managing ICE candidates and DTLS handshakes

2. **Circuit Relay v2 Protocol**:
   - Porting the circuit relay implementation from subfrost-relay
   - Adapting it to work with WebRTC instead of QUIC
   - Implementing relay discovery and registration
   - Supporting relay-to-relay connections for extended reach

3. **DTLS/ICE Connectivity**:
   - Implementing DTLS (Datagram Transport Layer Security) for secure communication
   - Using ICE (Interactive Connectivity Establishment) for NAT traversal
   - Integrating with STUN/TURN servers for additional NAT traversal capabilities
   - Handling connection upgrades and fallbacks

4. **Signaling Mechanism**:
   - Implementing a signaling protocol for WebRTC connection establishment
   - Using the existing libp2p protocols for signaling
   - Supporting offer/answer exchange and ICE candidate sharing
   - Handling connection negotiation and renegotiation

### Code Sharing Strategy

The new architecture is designed to maximize code sharing between different platforms:

1. **Rust Core with Conditional Compilation**:
   - Using feature flags to conditionally compile code for different targets
   - Sharing core logic between native and WASM builds
   - Using cfg attributes to handle platform-specific code
   - Example: `#[cfg(target_arch = "wasm32")]` for WASM-specific code

2. **Protocol Buffers for Cross-Language Compatibility**:
   - Defining message formats in Protocol Buffers
   - Generating Rust code for the server side
   - Generating TypeScript code for the client side
   - Ensuring consistent serialization/deserialization across languages

3. **WebAssembly as the Bridge**:
   - Compiling Rust code to WebAssembly for browser usage
   - Using wasm-bindgen for JavaScript bindings
   - Exposing a clean API through TypeScript definitions
   - Handling memory management and garbage collection

4. **Shared Type Definitions**:
   - Defining core types in darkswap-support
   - Generating TypeScript types from Rust types
   - Using consistent naming and semantics across languages
   - Ensuring type safety across the codebase

## Next Steps

### Short-Term (1 Week)

1. **Complete Runes and Alkanes Support**:
   - Implement rune protocol in darkswap-sdk
   - Implement alkane protocol in darkswap-sdk
   - Add tests for runes and alkanes functionality
   - Update API to support runes and alkanes trading

2. **Port Subfrost P2P Stack**:
   - Port subfrost-relay and subfrost-p2p crates
   - Adapt for WebRTC support
   - Implement circuit relay v2 protocol

3. **Create Modular Architecture**:
   - Create darkswap-support crate for shared code
   - Create darkswap-p2p crate for P2P networking
   - Ensure compatibility with both wasm and x86_64-unknown-linux-gnu targets

4. **Implement WebAssembly Bindings**:
   - Create darkswap-web-sys crate for WebAssembly bindings
   - Implement browser-native WebRTC support
   - Create TypeScript bindings for the WebAssembly module

5. **Develop TypeScript Library**:
   - Create darkswap-lib package
   - Implement the same functionality as darkswap-sdk
   - Ensure parity between Rust and TypeScript implementations

### Medium-Term (1-2 Months)

1. **Implement Relay Server**:
   - Create darkswap-relay server with DTLS/ICE connectivity
   - Implement circuit relay v2 protocol
   - Set up bootstrap nodes at p2p.darkswap.xyz

2. **Complete Core SDK Implementation**:
   - Implement runes and alkanes support
   - Add comprehensive unit tests
   - Optimize performance

3. **Develop Web Application**:
   - Create darkswap-app using darkswap-lib
   - Implement React components for the web interface
   - Add responsive design for mobile compatibility

4. **Testing and Optimization**:
   - Add comprehensive unit and integration tests
   - Optimize performance and reliability
   - Implement fallback mechanisms for when WebRTC fails

### Long-Term (3+ Months)

1. **Advanced P2P Features**:
   - Implement advanced NAT traversal techniques
   - Add support for multiple transport protocols
   - Optimize for low-bandwidth and high-latency connections

2. **Trading Features**:
   - Add support for advanced order types
   - Implement multi-signature support
   - Add support for more Bitcoin-based assets

3. **Ecosystem Development**:
   - Create developer tools and SDKs
   - Build a community around the project
   - Integrate with other Bitcoin projects

4. **Mobile Support**:
   - Create mobile bindings for the P2P stack
   - Develop mobile applications for iOS and Android
   - Optimize for mobile network conditions

## Active Decisions and Considerations

### Technical Decisions

1. **WebRTC vs. QUIC**:
   - Decision: Use WebRTC for P2P networking instead of QUIC
   - Rationale: WebRTC is widely supported in browsers, while QUIC requires custom implementation
   - Impact: Need to port Subfrost's circuit relay implementation to use WebRTC

2. **rust-libp2p vs. js-libp2p**:
   - Decision: Use rust-libp2p for the core SDK and compile to WebAssembly for browser support
   - Rationale: rust-libp2p provides better performance and safety
   - Impact: Need to create WebAssembly bindings for the Rust code

3. **Circuit Relay Implementation**:
   - Decision: Port Subfrost's circuit relay implementation to WebRTC
   - Rationale: Subfrost's implementation is robust and well-tested
   - Impact: Need to adapt the implementation to use WebRTC instead of QUIC

4. **PSBT-Based Trading**:
   - Decision: Use PSBTs for trade execution
   - Rationale: PSBTs are the standard way to create and sign Bitcoin transactions
   - Impact: Need to implement PSBT creation, signing, and validation

### Product Decisions

1. **Asset Support**:
   - Decision: Support Bitcoin, runes, and alkanes
   - Rationale: These are the primary assets in the Bitcoin ecosystem
   - Impact: Need to implement support for all three asset types

2. **User Experience**:
   - Decision: Focus on simplicity and usability
   - Rationale: Make the platform accessible to non-technical users
   - Impact: Need to design a user-friendly interface

3. **Deployment Strategy**:
   - Decision: Web-first approach with desktop support
   - Rationale: Maximize accessibility and reach
   - Impact: Need to ensure browser compatibility

## Current Challenges

1. **WebRTC NAT Traversal**:
   - Challenge: Ensuring reliable connections between peers behind NATs
   - Approach: Implement circuit relay and use STUN/TURN servers
   - Status: Implemented

2. **PSBT Handling**:
   - Challenge: Correctly creating and validating PSBTs for trades
   - Approach: Leverage Bitcoin libraries and implement comprehensive validation
   - Status: Implemented

3. **Browser Compatibility**:
   - Challenge: Ensuring the application works across different browsers
   - Approach: Use WebRTC and WASM with fallback mechanisms
   - Status: Implemented

4. **Performance Optimization**:
   - Challenge: Ensuring good performance in resource-constrained environments
   - Approach: Optimize critical paths and implement efficient data structures
   - Status: In progress

5. **WebSocket Event Handling**:
   - Challenge: Ensuring reliable WebSocket event handling in the daemon
   - Approach: Fixed nested tokio::spawn calls in handlers.rs
   - Status: Fixed

## Integration Points

1. **Bitcoin Wallet Integration**:
   - Integration: Connect with Bitcoin wallets for transaction signing
   - Approach: Use wallet interfaces or browser extensions
   - Status: Implemented simple wallet, planning for more wallet types

2. **Runes and Alkanes Integration**:
   - Integration: Support for runes and alkanes protocols
   - Approach: Implement protocol support in the SDK
   - Status: Planning

3. **Block Explorer Integration**:
   - Integration: Link to block explorers for transaction verification
   - Approach: Use public APIs or self-hosted explorers
   - Status: Planning

## Implementation Progress

We've made significant progress on the core SDK implementation and are now focusing on the P2P architecture redesign:

1. **P2P Architecture**: Analyzing subfrost-relay and subfrost-p2p crates for porting to our architecture.
2. **Component Structure**: Designing the modular component structure with shared code between platforms.
3. **WebRTC Integration**: Researching WebRTC integration with rust-libp2p for browser compatibility.
4. **Network Module**: Implemented P2P networking with WebRTC transport and circuit relay functionality.
5. **Orderbook Module**: Implemented orderbook management with order matching and expiry.
6. **Trade Module**: Implemented trade execution with PSBT creation and signing.
7. **Bitcoin Utilities**: Implemented wallet integration and PSBT handling.
8. **WASM Bindings**: Implemented WebAssembly bindings for browser integration.
9. **Daemon Improvements**: Fixed WebSocket event handling in handlers.rs and verified OrderId import in api.rs.

The next steps are to complete the runes and alkanes support, port the subfrost P2P stack, create the modular architecture, implement WebAssembly bindings, and develop the TypeScript library.

## Conclusion

The DarkSwap project is making steady progress towards creating a modular and cross-platform P2P trading system. Recent fixes to the WebSocket event handling in the daemon and verification of the OrderId import have improved the stability of the system. The next steps are to complete the runes and alkanes support, port the Subfrost P2P stack, create the modular architecture, implement WebAssembly bindings, and develop the TypeScript library.

With the redesigned architecture, DarkSwap will be well-positioned to become a powerful decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes, accessible from both web browsers and native applications.