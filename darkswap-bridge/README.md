# DarkSwap Bridge

DarkSwap Bridge is a component that resolves dependency conflicts between the wallet and networking components of DarkSwap by using inter-process communication (IPC).

## Overview

DarkSwap Bridge solves a critical dependency conflict in the DarkSwap ecosystem. The wallet component requires `bip39` v1.0.1 (via `bdk`), which depends on `unicode-normalization` v0.1.9, while the networking component requires `libp2p`, which depends on `unicode-normalization` v0.1.17 or newer. This conflict makes it impossible to use both components in the same process.

The bridge resolves this conflict by running the wallet and networking components in separate processes and facilitating communication between them using IPC.

## Architecture

The bridge consists of three main components:

1. **Bridge Core**: Facilitates communication between the wallet and network adapters
2. **Wallet Adapter**: Runs the wallet component in a separate process
3. **Network Adapter**: Runs the network component in a separate process

```
+----------------+         +----------------+
|                |         |                |
|  Wallet Adapter |<------->|  Bridge Core   |
|                |   IPC   |                |
+----------------+         +----------------+
                                  ^
                                  | IPC
                                  v
                           +----------------+
                           |                |
                           | Network Adapter |
                           |                |
                           +----------------+
```

## Features

- **IPC Communication**: Secure communication between processes
- **Message Routing**: Intelligent routing of messages between components
- **Authentication**: Secure authentication and encryption
- **Storage**: Persistent storage for configuration and data
- **External Service Integrations**: Integrations with price feeds, block explorers, and wallet services

## External Service Integrations

The bridge includes integrations with external services to enhance its functionality:

### Price Feed Integration

Get real-time price data for cryptocurrencies from various providers:

- CoinGecko
- CoinMarketCap
- Binance
- Custom providers

### Block Explorer Integration

Get information about Bitcoin transactions and addresses from various providers:

- Blockstream.info
- Blockchain.info
- BTC.com
- Mempool.space
- Custom providers

### Wallet Service Integration

Use external wallet services for additional functionality:

- Blockstream Green
- BlueWallet
- Electrum
- Custom providers

## Installation

### Prerequisites

- Rust 1.68 or later
- Node.js 18.x or later (for the web interface)

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/darkswap/darkswap-bridge.git
   cd darkswap-bridge
   ```

2. Build the bridge:
   ```bash
   ./build.sh --all
   ```

3. Run the bridge:
   ```bash
   ./target/release/darkswap-bridge --server
   ```

## Usage

### Command Line

```bash
# Start the bridge as a server
darkswap-bridge --server

# Start the bridge with a custom configuration file
darkswap-bridge --config config.toml --server

# Start the bridge with a custom log level
darkswap-bridge --log-level debug --server
```

### Configuration

The bridge can be configured using a TOML configuration file:

```toml
[bridge]
wallet_adapter_path = "darkswap-wallet-adapter"
network_adapter_path = "darkswap-network-adapter"
storage_dir = "./storage"
auto_start = true
auto_connect = true

[integration.price_feed]
provider = "CoinGecko"
update_interval = 60
assets = ["BTC", "RUNE"]

[integration.block_explorer]
provider = "Blockstream"
network = "Mainnet"
timeout = 30
```

## SDK Integration

The bridge can be integrated with the DarkSwap SDK to provide a seamless experience for developers:

```rust
use darkswap_sdk::bridge_integration::{BridgeConfig, BridgeIntegration};

// Create bridge configuration
let config = BridgeConfig {
    bridge_path: "darkswap-bridge".to_string(),
    storage_dir: "./storage".to_string(),
    run_as_server: true,
    log_level: "info".to_string(),
};

// Create bridge integration
let mut bridge = BridgeIntegration::new(config);

// Start bridge
bridge.start().await?;

// Use bridge
// ...

// Stop bridge
bridge.stop().await?;
```

## Next Steps

### 1. Implement REST API

Implement a REST API for the bridge to allow external applications to interact with it:

```
+----------------+         +----------------+         +----------------+
|                |         |                |         |                |
|  Web Interface |<------->|   REST API     |<------->|  Bridge Core   |
|                |   HTTP  |                |   IPC   |                |
+----------------+         +----------------+         +----------------+
```

### 2. Implement WebSocket API

Implement a WebSocket API for real-time updates:

```
+----------------+         +----------------+         +----------------+
|                |         |                |         |                |
|  Web Interface |<------->| WebSocket API  |<------->|  Bridge Core   |
|                |    WS   |                |   IPC   |                |
+----------------+         +----------------+         +----------------+
```

### 3. Enhance Web Interface

Enhance the web interface with more features:

- Dashboard with charts and statistics
- Order book visualization
- Trade history
- Wallet management
- Network management

### 4. Implement Mobile App

Create a mobile app that interacts with the bridge:

- React Native app for iOS and Android
- Native wallet integration
- Push notifications
- QR code scanning

### 5. Implement Advanced Trading Features

Add advanced trading features:

- Market orders
- Stop orders
- Limit orders
- Order history
- Trade history
- Price charts

### 6. Enhance Security

Enhance security with:

- Two-factor authentication
- Hardware wallet support
- Audit logging
- Security audits

### 7. Optimize Performance

Optimize performance with:

- Caching
- Database storage
- Load balancing
- CDN for static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.