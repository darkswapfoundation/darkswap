# DarkSwap Bridge Layer

The DarkSwap Bridge Layer is a solution to the dependency conflicts between the wallet and networking components of the DarkSwap application. It allows each component to use its own dependencies without conflicts while maintaining communication between them.

## Problem

DarkSwap faces a dependency conflict:

1. The wallet functionality requires `bip39` v1.0.1 (via `bdk`), which depends on `unicode-normalization` v0.1.9
2. The P2P networking functionality requires `libp2p`, which depends on `unicode-normalization` v0.1.17 or newer

These conflicting dependencies cannot coexist in the same Rust binary.

## Solution

The bridge layer uses inter-process communication (IPC) to enable communication between separate processes:

1. **Wallet Process**: Contains all Bitcoin wallet functionality with its dependencies
2. **Network Process**: Contains all P2P networking functionality with its dependencies
3. **Bridge**: Facilitates communication between these processes

## Project Structure

```
darkswap/
├── darkswap-core/
│   └── darkswap-lib/         # Wallet functionality with bdk and bip39 v1.0.1
├── darkswap-network/
│   └── darkswap-p2p/         # P2P networking with libp2p and newer dependencies
└── darkswap-bridge/          # Bridge layer for communication between components
    ├── src/
    │   ├── lib.rs            # Core bridge functionality
    │   └── bin/
    │       ├── wallet_adapter.rs    # Adapter for wallet component
    │       ├── network_adapter.rs   # Adapter for network component
    │       └── bridge_cli.rs        # CLI for interacting with the bridge
    └── Cargo.toml
```

## Components

### 1. Bridge Library (`darkswap-bridge/src/lib.rs`)

The core library defines:
- Message types for communication between components (WalletMessage, NetworkMessage, SystemMessage)
- Error handling for the bridge
- Client and server implementations for IPC
- Serialization/deserialization of messages

### 2. Wallet Adapter (`darkswap-bridge/src/bin/wallet_adapter.rs`)

An adapter that:
- Connects to the bridge as a server
- Handles wallet-related messages
- Implements wallet functionality using the appropriate dependencies
- Sends responses back through the bridge

### 3. Network Adapter (`darkswap-bridge/src/bin/network_adapter.rs`)

An adapter that:
- Connects to the bridge as a server
- Handles network-related messages
- Implements networking functionality using the appropriate dependencies
- Sends responses back through the bridge

### 4. Bridge CLI (`darkswap-bridge/src/bin/bridge_cli.rs`)

A command-line interface that:
- Creates a bridge client
- Provides commands for interacting with both wallet and network components
- Displays responses from the components

### 5. Core Wallet Library (`darkswap-core/darkswap-lib`)

A library that:
- Uses bdk and bip39 v1.0.1 for Bitcoin wallet functionality
- Provides wallet creation, transaction signing, and other wallet operations
- Is isolated from networking dependencies

### 6. P2P Networking Library (`darkswap-network/darkswap-p2p`)

A library that:
- Uses libp2p and newer dependencies for P2P networking
- Provides peer discovery, message passing, and other networking operations
- Is isolated from wallet dependencies

## How It Works

1. **Process Isolation**: Each component runs in its own process with its own dependencies
2. **IPC Communication**: Components communicate through IPC channels
3. **Message Passing**: Well-defined message types for wallet, network, and system operations
4. **Bridge Client**: Connects to both wallet and network adapters
5. **Bridge CLI**: Provides a user interface for interacting with the system

## Building and Running

### Building

Use the provided build script:

```bash
./build-bridge.sh
```

This will build all components of the bridge layer.

### Running

1. Start the wallet adapter:
```bash
cd darkswap-bridge && cargo run --bin wallet_adapter -- --ipc wallet_ipc --bridge bridge_ipc
```

2. Start the network adapter:
```bash
cd darkswap-bridge && cargo run --bin network_adapter -- --ipc network_ipc --bridge bridge_ipc
```

3. Start the bridge CLI:
```bash
cd darkswap-bridge && cargo run --bin bridge_cli
```

## Using the Bridge CLI

The bridge CLI provides a command-line interface for interacting with the system:

```
# Create a new wallet
> wallet create my_wallet password123

# Get the balance of a wallet
> wallet balance my_wallet

# Connect to a peer
> network connect peer1.example.com:8333

# Send a message to a peer
> network send peer1.example.com:8333 Hello, world!

# Get the list of connected peers
> network peers

# Ping the system
> system ping
```

## Benefits

1. **Resolves Dependency Conflicts**: Each component can use its own version of dependencies
2. **Improved Security**: Process isolation provides better security
3. **Maintainability**: Components can be updated independently
4. **Scalability**: Components can be distributed across different machines if needed
5. **Clean Architecture**: Well-defined interfaces between components

## Future Improvements

1. Add authentication and encryption to the IPC channels
2. Implement a more robust error handling mechanism
3. Add support for more message types
4. Create a web interface for the bridge
5. Implement persistent storage for wallet data
6. Add support for multiple wallet types
7. Enhance the P2P networking capabilities