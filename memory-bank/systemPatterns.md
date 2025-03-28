# DarkSwap System Patterns

This document describes the system architecture, key technical decisions, design patterns, and component relationships in the DarkSwap project.

## System Architecture

DarkSwap follows a modular architecture with clear separation of concerns. The system is divided into several key components with shared code between Rust and TypeScript implementations:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                             P2P Network                                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                 ▲                    ▲                     ▲
                 │                    │                     │
                 │                    │                     │
┌────────────────┴─────┐   ┌──────────┴───────┐   ┌─────────┴─────────┐
│                      │   │                  │   │                   │
│    darkswap-relay    │   │  darkswap-daemon │   │   darkswap-app    │
│                      │   │                  │   │                   │
└──────────────────────┘   └──────────────────┘   └───────────┬───────┘
                                                              │
                                                              │
                                                              ▼
┌───────────────────────────────────────────────┐   ┌─────────────────────┐
│                                               │   │                     │
│              darkswap-sdk (Rust)              │   │  darkswap-lib (TS)  │
│                                               │   │                     │
└───────────────┬───────────────────────────────┘   └──────────┬──────────┘
                │                                              │
                │                                              │
                ▼                                              ▼
┌───────────────────────────────────────────────┐   ┌─────────────────────┐
│                                               │   │                     │
│              darkswap-p2p (Rust)              │   │  darkswap-web-sys   │
│                                               │   │      (WASM)         │
└───────────────┬───────────────────────────────┘   └──────────┬──────────┘
                │                                              │
                │                                              │
                ▼                                              ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                          darkswap-support                                 │
│                      (Protobuf & Shared Code)                             │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Core Components

1. **darkswap-support**: Contains all the protobuf definitions and shared code that is not specific to wasm or x86_64 builds.
2. **darkswap-p2p**: Core P2P networking library that can be used by both server and browser builds.
3. **darkswap-sdk**: The core Rust library that provides all the functionality needed for P2P trading.
4. **darkswap-web-sys**: WebAssembly bindings for the P2P protocol that can be used in browsers.
5. **darkswap-lib**: TypeScript/JavaScript library that provides the same functionality as darkswap-sdk but for web environments.
6. **darkswap-relay**: A server that provides DTLS/ICE connectivity and circuit relay v2 support for NAT traversal.
7. **darkswap-daemon**: A background service that hosts an orderbook and facilitates trades.
8. **darkswap-app**: A web-based user interface that uses darkswap-lib to interact with the P2P network.
9. **darkswap-cli**: A command-line interface for interacting with the SDK.

### Component Interactions

- **darkswap-support and darkswap-p2p**: These form the foundation of the P2P protocol, with darkswap-support providing protobuf definitions and shared code, and darkswap-p2p implementing the core P2P networking functionality.
- **darkswap-sdk and darkswap-lib**: These provide parallel implementations of the trading architecture in Rust and TypeScript respectively, both using the same P2P protocol.
- **darkswap-web-sys**: Provides WebAssembly bindings for the Rust P2P code, allowing darkswap-lib to use the browser's native WebRTC support to connect to the network.
- **darkswap-relay**: Acts as a circuit relay for NAT traversal, allowing peers behind NATs to connect to each other.
- **darkswap-daemon**: Uses darkswap-sdk to participate in the P2P network, manage the orderbook, and execute trades.
- **darkswap-app**: Uses darkswap-lib to interact with the P2P network, manage orders, and execute trades.
- **darkswap-cli**: Uses darkswap-sdk to perform operations such as creating orders, taking orders, and getting market data.

## Key Technical Decisions

### Rust for Core Components

DarkSwap uses Rust for its core components (SDK, CLI, daemon) for several reasons:

1. **Safety**: Rust's ownership model and type system prevent common bugs such as null pointer dereferences, buffer overflows, and data races.
2. **Performance**: Rust provides performance comparable to C and C++ without sacrificing safety.
3. **Cross-Platform**: Rust can target multiple platforms, including desktop and web (via WASM).
4. **Ecosystem**: Rust has a growing ecosystem of libraries for Bitcoin, P2P networking, and cryptography.

### libp2p for P2P Networking

DarkSwap uses libp2p for P2P networking for several reasons:

1. **Modularity**: libp2p is modular and allows for using only the components needed.
2. **Cross-Platform**: libp2p works on desktop and web browsers.
3. **Multiple Transport Protocols**: libp2p supports multiple transport protocols, including TCP, WebSockets, and WebRTC.
4. **NAT Traversal**: libp2p includes mechanisms for NAT traversal, which is essential for P2P applications.

### PSBTs for Trade Execution

DarkSwap uses PSBTs (Partially Signed Bitcoin Transactions) for trade execution for several reasons:

1. **Atomicity**: PSBTs enable atomic trades, where either both parties get what they want or neither does.
2. **Security**: PSBTs allow for transaction validation before signing.
3. **Compatibility**: PSBTs are a standard in the Bitcoin ecosystem and are supported by many wallets.
4. **Flexibility**: PSBTs can represent complex transactions, including those involving runes and alkanes.

### WASM for Browser Integration

DarkSwap uses WASM for browser integration for several reasons:

1. **Performance**: WASM provides near-native performance in browsers.
2. **Language Agnostic**: WASM allows for using Rust in browsers.
3. **Security**: WASM runs in a sandboxed environment, providing security benefits.
4. **Portability**: WASM is supported by all major browsers.

## Design Patterns

DarkSwap uses several design patterns to ensure maintainability, testability, and extensibility:

### Modular Design

DarkSwap follows a modular design pattern, where each component has a clear responsibility and interfaces with other components through well-defined APIs. This approach offers several benefits:

1. **Maintainability**: Changes to one component don't affect others.
2. **Testability**: Components can be tested in isolation.
3. **Reusability**: Components can be reused in different contexts.
4. **Scalability**: Components can be scaled independently.

### Event-Driven Architecture

DarkSwap uses an event-driven architecture for handling asynchronous operations and communication between components:

1. **Decoupling**: Components communicate through events rather than direct calls.
2. **Scalability**: Event processing can be parallelized.
3. **Responsiveness**: Non-blocking operations improve user experience.

### Repository Pattern

For data management, DarkSwap uses the repository pattern to abstract the storage and retrieval of data:

1. **Abstraction**: Hides the details of data storage.
2. **Flexibility**: Allows changing the storage implementation without affecting other components.
3. **Testability**: Enables easy mocking for tests.

### Strategy Pattern

DarkSwap uses the strategy pattern to allow different implementations of key algorithms:

1. **Flexibility**: Different strategies can be selected at runtime.
2. **Extensibility**: New strategies can be added without modifying existing code.
3. **Configurability**: Strategies can be configured based on user preferences.

### Factory Pattern

DarkSwap uses the factory pattern to create objects without specifying the exact class to create:

1. **Encapsulation**: Hides the details of object creation.
2. **Flexibility**: Allows changing the created objects without affecting the client code.
3. **Centralization**: Centralizes object creation logic.

### Observer Pattern

DarkSwap uses the observer pattern to notify components of events:

1. **Decoupling**: Subjects and observers are loosely coupled.
2. **Broadcast Communication**: One subject can notify multiple observers.
3. **Event Handling**: Enables event-driven programming.

## Component Relationships

### Architecture Components

The DarkSwap architecture consists of several components that work together to provide a modular and flexible system. The architecture is designed to maximize code sharing between different platforms while providing a consistent API across Rust and TypeScript implementations.

#### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            darkswap-support                             │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │  Protobuf Defs  │  │  Shared Types   │  │  Common Functionality   │  │
│  │                 │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                             darkswap-p2p                                │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │  WebRTC Support │  │  Circuit Relay  │  │  P2P Protocol Handlers  │  │
│  │                 │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                             darkswap-sdk                                │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │     Network     │  │    Orderbook    │  │         Trade           │  │
│  │                 │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │  Bitcoin Utils  │  │      Types      │  │         Config          │  │
│  │                 │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            darkswap-lib                                 │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │     Network     │  │    Orderbook    │  │         Trade           │  │
│  │                 │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │                 │  │                         │  │
│  │  Bitcoin Utils  │  │      Types      │  │         Config          │  │
│  │                 │  │                 │  │                         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **darkswap-support**:
   - Protobuf Definitions: Shared protocol buffer definitions for P2P communication
   - Shared Types: Common data structures used across all components
   - Common Functionality: Shared utility functions and algorithms

2. **darkswap-p2p**:
   - WebRTC Support: Implementation of WebRTC transport for libp2p
   - Circuit Relay: Implementation of circuit relay v2 protocol for NAT traversal
   - P2P Protocol Handlers: Handlers for P2P protocol messages

3. **darkswap-sdk** (Rust implementation):
   - Network Module: Handles P2P networking using libp2p
   - Orderbook Module: Manages orders and matches trades
   - Trade Module: Handles trade execution using PSBTs
   - Bitcoin Utils Module: Provides utilities for working with Bitcoin
   - Types Module: Defines common data structures
   - Config Module: Handles configuration

4. **darkswap-lib** (TypeScript implementation):
   - Network Module: Handles P2P networking using darkswap-web-sys
   - Orderbook Module: Manages orders and matches trades
   - Trade Module: Handles trade execution using PSBTs
   - Bitcoin Utils Module: Provides utilities for working with Bitcoin
   - Types Module: Defines common data structures
   - Config Module: Handles configuration

### CLI Components

The CLI consists of several commands that interact with the SDK:

1. **Create Order Command**: Creates a new order.
2. **Cancel Order Command**: Cancels an existing order.
3. **Take Order Command**: Takes an existing order.
4. **List Orders Command**: Lists orders for a trading pair.
5. **Get Best Bid Ask Command**: Gets the best bid and ask for a trading pair.
6. **Connect Wallet Command**: Connects a wallet.
7. **Start Daemon Command**: Starts the daemon.

### Daemon Components

The daemon consists of several components that work together to provide a background service:

1. **API Server**: Provides a REST API for interacting with the daemon.
2. **Event System**: Notifies clients of events such as order creation, cancellation, and filling.
3. **P2P Node**: Participates in the P2P network for orderbook distribution and trade execution.
4. **Wallet Integration**: Connects to Bitcoin wallets for transaction signing.

### Web Interface Components

The web interface consists of several components that work together to provide a user-friendly interface:

1. **React Components**: Provide the UI elements.
2. **State Management**: Manages the application state.
3. **SDK Integration**: Integrates with the SDK through WASM.
4. **Wallet Integration**: Connects to Bitcoin wallets for transaction signing.

## Data Flow

### Order Creation Flow

1. User creates an order through the CLI, daemon, or web interface.
2. The SDK validates the order and assigns it a unique ID.
3. The order is added to the local orderbook.
4. The order is broadcast to the P2P network.
5. Other nodes receive the order and add it to their local orderbooks.

### Trade Execution Flow

1. User takes an order through the CLI, daemon, or web interface.
2. The SDK creates a trade intent and sends it to the maker.
3. The maker and taker create PSBTs representing their side of the trade.
4. The PSBTs are exchanged and combined.
5. Both parties sign the combined PSBT.
6. The final transaction is broadcast to the Bitcoin network.

## Conclusion

DarkSwap's architecture is designed to be modular, secure, and efficient. By leveraging modern design patterns and technologies, DarkSwap provides a robust platform for P2P trading of Bitcoin, runes, and alkanes. The clear separation of concerns and well-defined interfaces make it easy to extend and enhance the system as needed.