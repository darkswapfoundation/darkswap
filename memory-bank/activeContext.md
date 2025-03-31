# DarkSwap Active Context

This document provides information about the current work focus, recent changes, next steps, and active decisions and considerations for the DarkSwap project.

## Current Work Focus

The current focus of the DarkSwap project is transitioning from Phase 2 to Phase 3, building on the completed CLI and daemon components to implement the web interface and relay server. This involves:

1. **Web Interface Development**: Creating the darkswap-app web interface using React components and state management.
2. **Relay Server Implementation**: Implementing the darkswap-relay server with DTLS/ICE support for NAT traversal.
3. **WebAssembly Bindings**: Creating darkswap-web-sys WASM bindings for browser integration.
4. **TypeScript Integration**: Developing the darkswap-lib TypeScript library that provides the same functionality as the Rust SDK.
5. **Runes and Alkanes Support**: Completing the implementation of runes and alkanes support in the SDK.
6. **Testing and Documentation**: Enhancing testing coverage and improving documentation for all components.

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

### Phase 2 Completion

1. **CLI Implementation**:
   - Implemented comprehensive command-line interface for DarkSwap
   - Added commands for order creation, cancellation, listing, and taking
   - Implemented market data retrieval and wallet connection
   - Created detailed documentation and usage examples

2. **Daemon Implementation**:
   - Completed the daemon implementation with REST API and WebSocket support
   - Added service management files for Linux (systemd), macOS (launchd), and Windows
   - Implemented event processing for real-time updates
   - Created comprehensive documentation for installation and usage

3. **SDK Enhancements**:
   - Added `get_all_orders` method to the Orderbook and DarkSwap structs
   - Fixed the `get_order` handler in the daemon API
   - Implemented event processing in the daemon
   - Added service management capabilities

### Bitcoin Crate v0.30 Compatibility

1. **Library Code Updates**:
   - Updated the core SDK to work with Bitcoin crate v0.30
   - Fixed compatibility issues in the library code
   - All library tests are now passing with the new Bitcoin crate version

2. **Integration Test Updates**:
   - Updated `alkane_transfer_test.rs` to work with Bitcoin crate v0.30
   - Created a document (`phase1-remaining-tasks.md`) outlining the changes needed for other integration tests
   - Identified common patterns for updating tests to work with the new Bitcoin crate version

3. **Key Changes for Bitcoin Crate v0.30**:
   - Updated public key creation using `PublicKey::from_private_key` instead of `PublicKey::from_secret_key`
   - Changed address creation to use constructor methods like `Address::p2pkh` instead of `Address::<NetworkUnchecked>::new`
   - Updated hash handling to use `from_hash` instead of `from_raw_hash`
   - Replaced `ScriptBuf` with `Script` and updated script building methods
   - Replaced unsafe code with safe alternatives like `set_balance_for_testing`

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

1. **Begin Phase 3: Applications and Services**:
   - Start implementing the darkswap-relay server with DTLS/ICE support
   - Begin development of the darkswap-app web interface
   - Set up the project structure for the web interface
   - Create basic React components for the UI

2. **Complete Runes and Alkanes Support**:
   - Implement rune protocol in darkswap-sdk
   - Implement alkane protocol in darkswap-sdk
   - Add tests for runes and alkanes functionality
   - Update API to support runes and alkanes trading
   - Integrate predicate alkanes for secure trade conditions
   - Implement EqualityPredicateAlkane for two-party trades

3. **Implement WebAssembly Bindings**:
   - Create darkswap-web-sys crate for WebAssembly bindings
   - Implement browser-native WebRTC support
   - Create TypeScript bindings for the WebAssembly module
   - Set up wasm-bindgen and wasm-pack

4. **Develop TypeScript Library**:
   - Create darkswap-lib package
   - Implement the same functionality as darkswap-sdk
   - Ensure parity between Rust and TypeScript implementations
   - Create comprehensive TypeScript type definitions

5. **Enhance Testing and Documentation**:
   - Add more comprehensive unit and integration tests
   - Create tutorials and examples
   - Improve API documentation
   - Create user guides for the web interface

### Medium-Term (1-2 Months)

1. **Implement Relay Server**:
   - Create darkswap-relay server with DTLS/ICE connectivity
   - Implement circuit relay v2 protocol
   - Set up bootstrap nodes at p2p.darkswap.xyz

2. **Complete Core SDK Implementation**:
   - Implement runes and alkanes support
   - Develop predicate alkanes framework
     - Port EqualityPredicateAlkane from reference implementation
     - Create additional predicate types for different trade conditions
     - Implement predicate composition for complex trade scenarios
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
   - Develop advanced predicate alkanes
     - Time-locked predicates for scheduled trades
     - Multi-party predicates for complex trade agreements
     - Conditional predicates based on external data

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

2. **Predicate Alkanes**:
   - Decision: Implement predicate alkanes for secure trade conditions
   - Rationale: Enhances security and reliability of trades
   - Impact: Need to develop a framework for predicate alkanes and integrate with trade execution

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
   - Status: In progress with predicate alkanes implementation

3. **Predicate Alkanes Integration**:
   - Integration: Support for predicate alkanes that enforce trade conditions
   - Approach: Implement EqualityPredicateAlkane for two-party trades
   - Status: Reference implementation added to reference/predicates

3. **Block Explorer Integration**:
   - Integration: Link to block explorers for transaction verification
   - Approach: Use public APIs or self-hosted explorers
   - Status: Planning

## Implementation Progress

We've made significant progress on the project, completing Phase 2 and preparing for Phase 3:

1. **CLI Implementation**: Completed the command-line interface with comprehensive commands for order management, market data retrieval, and wallet connection.
2. **Daemon Implementation**: Completed the daemon with REST API, WebSocket support, and service management for Linux, macOS, and Windows.
3. **SDK Enhancements**: Added new methods to the SDK, fixed issues in the daemon API, and implemented event processing.
The addition of the predicate alkanes reference implementation provides a foundation for secure trade conditions between parties. As we move forward, we will continue to build on this foundation to create a powerful decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes, accessible from both web browsers and native applications.

With the redesigned architecture and the integration of predicate alkanes for secure trade conditions, DarkSwap will be well-positioned to become a leading platform in the Bitcoin ecosystem, providing users with a secure, reliable, and user-friendly way to trade Bitcoin, runes, and alkanes.
4. **P2P Architecture**: Analyzing subfrost-relay and subfrost-p2p crates for porting to our architecture.
5. **Component Structure**: Designing the modular component structure with shared code between platforms.
6. **WebRTC Integration**: Researching WebRTC integration with rust-libp2p for browser compatibility.
7. **Network Module**: Implemented P2P networking with WebRTC transport and circuit relay functionality.
8. **Orderbook Module**: Implemented orderbook management with order matching and expiry.
9. **Trade Module**: Implemented trade execution with PSBT creation and signing.
10. **Bitcoin Utilities**: Implemented wallet integration and PSBT handling.
11. **WASM Bindings**: Implemented WebAssembly bindings for browser integration.
12. **Bitcoin Crate Compatibility**: Updated the core SDK and some integration tests to work with Bitcoin crate v0.30.
13. **Predicate Alkanes**: Added reference implementation of EqualityPredicateAlkane for secure two-party trades.
14. **Documentation**: Created comprehensive documentation for the CLI and daemon components.

The next steps are to:
1. Begin Phase 3 with the implementation of the relay server and web interface
2. Update the remaining integration tests to work with Bitcoin crate v0.30
3. Complete the runes and alkanes support
   - Integrate the predicate alkanes reference implementation
   - Develop additional predicate types for different trade conditions
   - Implement predicate composition for complex trade scenarios
4. Implement WebAssembly bindings for browser integration
5. Develop the TypeScript library for web applications
6. Enhance testing and documentation

## Conclusion

The DarkSwap project has made significant progress with the completion of Phase 2, which included the implementation of the CLI and daemon components. The CLI now provides a comprehensive set of commands for managing orders, trades, and wallet operations, while the daemon offers a robust REST API and WebSocket interface for interacting with the DarkSwap SDK.

Recent achievements include:
1. Implementation of the CLI with commands for order creation, cancellation, listing, and taking
2. Completion of the daemon with REST API, WebSocket support, and service management
3. Enhancement of the SDK with new methods like `get_all_orders` and improved event processing
4. Creation of comprehensive documentation for installation and usage

With the completion of Phase 2, we are now ready to begin Phase 3, which will focus on implementing the relay server and web interface. This will involve creating the darkswap-relay server with DTLS/ICE support, developing the darkswap-app web interface, implementing WebAssembly bindings for browser integration, and developing the TypeScript library for web applications.

With the redesigned architecture and the integration of predicate alkanes for secure trade conditions, DarkSwap will be well-positioned to become a powerful decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes, accessible from both web browsers and native applications. The predicate alkanes will provide an additional layer of security and reliability, making DarkSwap an attractive platform for users who require strong guarantees for their trades.