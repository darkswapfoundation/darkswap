# DarkSwap

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables trustless trading without requiring a central server or authority.

## Features

- **P2P Networking**: Decentralized peer-to-peer network for order discovery and matching
- **WebRTC Support**: Browser compatibility for web-based trading
- **Circuit Relay**: NAT traversal for peers behind firewalls
- **Orderbook Management**: Decentralized orderbook for trading pairs
- **PSBT-Based Trading**: Secure trade execution using PSBTs
- **Runes and Alkanes Support**: Trading of Bitcoin-based assets
- **Web Interface**: User-friendly web interface for trading

## Architecture

DarkSwap consists of the following components:

- **DarkSwap Support**: Shared code and protobuf definitions
- **DarkSwap P2P**: Core P2P networking library with WebRTC support
- **DarkSwap SDK**: Core library for building decentralized trading applications
- **DarkSwap Web-Sys**: WebAssembly bindings for browser integration
- **DarkSwap Lib**: TypeScript library for web applications
- **DarkSwap Relay**: Circuit relay server for NAT traversal
- **DarkSwap Daemon**: Background service for hosting an orderbook
- **DarkSwap CLI**: Command-line interface for interacting with the SDK
- **DarkSwap Web**: Web interface for trading

## Getting Started

### Prerequisites

- Rust 1.70.0 or later
- Node.js 18.0.0 or later
- Yarn 1.22.0 or later

### Building from Source

1. Clone the repository:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

2. Build all components:

```bash
./build.sh --all
```

3. Build specific components:

```bash
./build.sh --sdk --daemon --web
```

### Running the CLI

```bash
cd darkswap-cli
cargo run -- --help
```

### Starting the Daemon

```bash
cd darkswap-daemon
cargo run
```

### Running the Web Interface

```bash
cd web
yarn dev
```

## Usage

### Creating an Order

```bash
darkswap-cli create-order --base-asset BTC --quote-asset "RUNE:test_rune" --side buy --amount 1.0 --price 50000
```

### Taking an Order

```bash
darkswap-cli take-order --order-id <order_id> --amount 0.5
```

### Listing Orders

```bash
darkswap-cli list-orders --base-asset BTC --quote-asset "RUNE:test_rune"
```

### Getting Market Data

```bash
darkswap-cli market --base-asset BTC --quote-asset "RUNE:test_rune"
```

## Development

### Project Structure

```
darkswap/
├── darkswap-support/    # Shared code and protobuf definitions
├── darkswap-p2p/        # Core P2P networking library
├── darkswap-sdk/        # Core SDK
├── darkswap-web-sys/    # WebAssembly bindings
├── darkswap-lib/        # TypeScript library
├── darkswap-relay/      # Circuit relay server
├── darkswap-daemon/     # Background service
├── darkswap-cli/        # Command-line interface
├── web/                 # Web interface
├── reference/           # Reference documentation
└── memory-bank/         # Project documentation
```

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

### Running Tests

```bash
cd darkswap-sdk
cargo test
```

### Building Documentation

```bash
cd darkswap-sdk
cargo doc --open
```

## Current Status

The project is currently in Phase 1 of development, focusing on the core P2P infrastructure. Recent achievements include:

1. Fixed WebSocket event handling in handlers.rs
2. Verified OrderId import from orderbook module in api.rs
3. Implemented core SDK with P2P networking, orderbook management, and trade execution
4. Added WebRTC transport for browser compatibility
5. Implemented PSBT-based trade execution for secure atomic swaps
6. Added Bitcoin wallet integration

Next steps include:

1. Completing the runes and alkanes support
2. Implementing the WebAssembly bindings
3. Developing the TypeScript library
4. Setting up the relay server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Subfrost](https://github.com/subfrost) for the circuit relay implementation
- [PintSwap](https://github.com/pintswap) for the P2P orderbook and trading functionality
- [rust-libp2p](https://github.com/libp2p/rust-libp2p) for the P2P networking library
- [bitcoin](https://github.com/rust-bitcoin/rust-bitcoin) for the Bitcoin library