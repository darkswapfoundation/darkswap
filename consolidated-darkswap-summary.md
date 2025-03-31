# Consolidated DarkSwap Summary

This document consolidates key information from the DarkSwap memory bank files to help stay under Claude's 20-file limit.

## Project Overview

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables users to trade assets directly with each other without intermediaries, built on Bitcoin's technology stack and leveraging PSBTs (Partially Signed Bitcoin Transactions) for secure trading.

### Core Requirements

1. **Decentralized P2P Trading**
   - Direct peer-to-peer trading without intermediaries
   - Decentralized orderbook using P2P networking
   - Direct connections between traders

2. **Bitcoin, Runes, and Alkanes Support**
   - Support for Bitcoin (BTC)
   - Support for runes (fungible tokens on Bitcoin)
   - Support for alkanes (protocol built on top of runes)

3. **Orderbook-Based Trading**
   - Orderbook for listing and matching orders
   - Support for limit orders with specified prices
   - Order cancellation and expiry

4. **Secure Trading**
   - PSBTs for secure trade execution
   - Comprehensive transaction validation
   - Atomicity of trades

5. **Cross-Platform Compatibility**
   - Desktop platforms (Linux, macOS, Windows)
   - Web browsers through WASM compilation
   - Mobile browsers (iOS, Android)

## Architecture

DarkSwap consists of several components:

1. **darkswap-sdk**
   - Core functionality for DarkSwap
   - P2P networking using rust-libp2p
   - Orderbook management
   - Trade execution
   - Bitcoin integration
   - WASM bindings for browser integration

2. **darkswap-cli**
   - Command-line interface for interacting with DarkSwap
   - Order creation and management
   - Trade execution
   - Wallet integration

3. **darkswap-daemon**
   - Background service for hosting an orderbook and facilitating trades
   - REST API for interacting with the service
   - Event system for monitoring system events

4. **web**
   - Web interface for DarkSwap
   - React-based UI
   - Integration with the SDK through WASM

## Technical Stack

1. **Backend**
   - Rust for core functionality
   - rust-libp2p for P2P networking
   - rust-bitcoin for Bitcoin integration
   - WASM for browser integration

2. **Frontend**
   - TypeScript for type safety
   - React for UI components
   - Tailwind CSS for styling
   - Vite for build tooling

## Current Work Focus

The current focus of the DarkSwap project is transitioning from Phase 1 to Phase 2:

1. **Phase 1: Core SDK Implementation**: Completed with full runes and alkanes support, comprehensive unit tests, and performance optimizations.
2. **Phase 2: CLI and Daemon Implementation**: Planning and initial implementation of the command-line interface and background service.
3. **Phase 3: Web Interface Planning**: Planning the implementation of the React-based web interface.

## Recent Changes

### Core SDK Implementation

1. **Network Module**: Implemented the network module with WebRTC transport and circuit relay functionality.
   - Created a P2P network implementation using rust-libp2p
   - Implemented circuit relay functionality for NAT traversal
   - Added WebRTC transport for browser compatibility
   - Implemented event handling system
   - Added comprehensive unit tests
   - Optimized performance with benchmarks

2. **Orderbook Module**: Implemented the orderbook module for managing orders.
   - Created order data structures for Bitcoin, runes, and alkanes
   - Implemented orderbook management with order matching
   - Added order expiry and cleanup
   - Implemented thread-safe orderbook with mutex protection
   - Added comprehensive unit tests
   - Optimized performance with benchmarks

3. **Trade Module**: Implemented the trade module for executing trades.
   - Created trade data structures
   - Implemented trade negotiation protocol
   - Added PSBT creation and signing
   - Implemented transaction validation and broadcasting
   - Added comprehensive unit tests
   - Optimized performance with benchmarks

4. **Bitcoin Utilities**: Implemented Bitcoin utilities for wallet integration and PSBT handling.
   - Created Bitcoin wallet interface
   - Implemented simple wallet for testing
   - Added PSBT utilities for creating and signing PSBTs
   - Implemented transaction validation and broadcasting
   - Updated all code to be compatible with Bitcoin crate v0.30

5. **Runes and Alkanes Support**: Implemented full support for runes and alkanes.
   - Completed Runestone structure implementation
   - Implemented rune transfer and etching transaction creation
   - Completed Alkane structure implementation
   - Implemented alkane transfer and etching transaction creation
   - Added predicate alkanes for secure trade conditions
   - Created comprehensive documentation and examples

6. **Predicate Alkanes**: Implemented predicate alkanes for conditional trading.
   - Implemented EqualityPredicateAlkane reference implementation
   - Added time-locked predicate alkanes
   - Implemented multi-signature predicate alkanes
   - Created composite predicate alkanes
   - Added UI components for predicate creation and management
   - Created predicate templates for common trade scenarios

7. **WASM Bindings**: Implemented WebAssembly bindings for browser integration.
   - Created JavaScript API for the Rust code
   - Implemented event handling for order and trade events
   - Added wallet connection functionality
   - Created promise-based API for asynchronous operations

## System Architecture

DarkSwap follows a modular architecture with clear separation of concerns:

### SDK Components

The SDK consists of several modules that work together:

1. **Network Module**: Handles P2P networking using libp2p.
2. **Orderbook Module**: Manages orders and matches trades.
3. **Trade Module**: Handles trade execution using PSBTs.
4. **Bitcoin Utils Module**: Provides utilities for working with Bitcoin.
5. **Types Module**: Defines common data structures.
6. **Config Module**: Handles configuration.

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

- **Modular Design**: Clear component responsibilities and well-defined APIs
- **Event-Driven Architecture**: Asynchronous operations and component communication
- **Repository Pattern**: Abstract data storage and retrieval
- **Strategy Pattern**: Different implementations of key algorithms
- **Factory Pattern**: Object creation without specifying exact class
- **Observer Pattern**: Component notification of events

## Progress Tracking

### What Works

- [x] Project structure and organization
- [x] Basic configuration system
- [x] Error handling system
- [x] Common types and data structures
- [x] P2P networking with rust-libp2p
  - [x] Network module structure
  - [x] Circuit relay implementation (ported from Subfrost)
  - [x] WebRTC transport for browser compatibility
  - [x] Event handling system
  - [x] Comprehensive unit tests
  - [x] Performance optimizations
- [x] WebAssembly bindings for browser integration
  - [x] JavaScript API
  - [x] Event handling
  - [x] Promise-based API
- [x] Orderbook module
  - [x] Order management
  - [x] Order matching
  - [x] Order expiry
  - [x] Comprehensive unit tests
  - [x] Performance optimizations
- [x] Trade module
  - [x] Trade execution
  - [x] PSBT creation and signing
  - [x] Transaction validation
  - [x] Comprehensive unit tests
  - [x] Performance optimizations
- [x] Bitcoin utilities module
  - [x] Wallet integration
  - [x] PSBT handling
  - [x] Transaction broadcasting
  - [x] Bitcoin crate v0.30 compatibility
- [x] Runes and alkanes support
  - [x] Rune protocol implementation
  - [x] Alkane protocol implementation
  - [x] Predicate alkanes implementation
  - [x] Comprehensive documentation and examples

### What's Left to Build

- [ ] CLI implementation
- [ ] Daemon implementation
- [ ] Web Interface implementation
- [ ] Testing
- [ ] Documentation

### Current Status

- **Phase 1: Core Implementation**: 100% complete
- **Phase 2: CLI and Daemon Implementation**: Not started
- **Phase 3: Web Interface Implementation**: Initial components created
- **Phase 4: Testing and Refinement**: Not started

## Known Issues

### Technical Issues

1. **WebRTC NAT Traversal**:
   - **Issue**: WebRTC NAT traversal can be unreliable in certain network configurations
   - **Severity**: Medium
   - **Status**: Being addressed with circuit relay implementation
   - **Workaround**: Use STUN/TURN servers and circuit relays

2. **WASM Performance**:
   - **Issue**: WebAssembly can have performance overhead compared to native code
   - **Severity**: Low
   - **Status**: Monitoring
   - **Workaround**: Optimize critical paths and use web workers

3. **Browser Compatibility**:
   - **Issue**: Different browsers have different levels of WebRTC support
   - **Severity**: Medium
   - **Status**: Being addressed with feature detection and fallbacks
   - **Workaround**: Implement feature detection and fallback mechanisms

## Next Steps

1. **Start CLI Implementation**:
   - Set up command-line interface
   - Implement basic commands
   - Add configuration options

2. **Start Daemon Implementation**:
   - Set up background service
   - Implement REST API
   - Add event handling

3. **Continue Web Interface Development**:
   - Complete predicate alkanes UI components
   - Implement trade interface
   - Add orderbook visualization

4. **Plan Phase 4 Testing**:
   - Design comprehensive test suite
   - Set up continuous integration
   - Create test automation

## Development Setup

### Prerequisites

- **Rust**: 1.70.0 or later
- **Node.js**: 18.0.0 or later
- **npm**: 9.0.0 or later
- **wasm-pack**: 0.10.0 or later
- **Bitcoin Core**: 25.0 or later (optional, for testing with a local Bitcoin node)

### Development Environment

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

## Code Style Guidelines

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