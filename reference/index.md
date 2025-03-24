# DarkSwap Reference Documentation

This directory contains reference documentation for the DarkSwap project, a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.

## Overview Documents

- [README.md](../README.md) - Project overview and getting started guide
- [DarkSwap vs. PintSwap](darkswap-vs-pintswap.md) - Detailed comparison of DarkSwap and PintSwap architectures
- [DarkSwap Architecture Analysis](darkswap-architecture-analysis.md) - Analysis of DarkSwap's architecture
- [Core Functionality Analysis](core-functionality-analysis.md) - Analysis of DarkSwap's core functionality

## Implementation Guides

- [WebRTC Implementation Guide](webrtc-implementation-guide.md) - Guide for implementing WebRTC support in rust-libp2p
- [Runes and Alkanes Implementation Plan](runes-alkanes-implementation-plan.md) - Plan for adding support for Bitcoin-based assets

## Analysis Documents

- [PintSwap Overview](pintswap-overview.md) - Overview of the PintSwap project
- [Bitcoin Components Overview](bitcoin-components-overview.md) - Overview of Bitcoin components used in DarkSwap
- [P2P Networking Overview](p2p-networking-overview.md) - Overview of P2P networking in DarkSwap
- [Subfrost Analysis](subfrost-analysis-updated.md) - Analysis of the Subfrost project's P2P networking implementation

## Memory Bank

The [memory-bank](../memory-bank) directory contains project documentation that is updated as the project progresses:

- [projectbrief.md](../memory-bank/projectbrief.md) - Foundation document that shapes all other files
- [productContext.md](../memory-bank/productContext.md) - Why this project exists and problems it solves
- [activeContext.md](../memory-bank/activeContext.md) - Current work focus and recent changes
- [systemPatterns.md](../memory-bank/systemPatterns.md) - System architecture and key technical decisions
- [techContext.md](../memory-bank/techContext.md) - Technologies used and technical constraints
- [progress.md](../memory-bank/progress.md) - What works, what's left to build, and current status

## Code Structure

The DarkSwap project is organized into the following directories:

- [darkswap-sdk](../darkswap-sdk) - Core SDK for building decentralized trading applications
- [darkswap-cli](../darkswap-cli) - Command-line interface for interacting with the SDK
- [web](../web) - Web interface for trading
- [reference](../reference) - Reference documentation (this directory)
- [memory-bank](../memory-bank) - Project documentation

### SDK Structure

The DarkSwap SDK is organized into the following modules:

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

### CLI Structure

The DarkSwap CLI is organized as follows:

```
darkswap-cli/
├── src/
│   └── main.rs          # CLI implementation
```

### Web Structure

The DarkSwap web interface is organized as follows:

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

## Key Concepts

### P2P Networking

DarkSwap uses a peer-to-peer network for order discovery and matching. The network is built on rust-libp2p with WebRTC support for browser compatibility. Key components include:

- **WebRTC Transport**: Enables browser compatibility
- **Circuit Relay**: Enables NAT traversal
- **Gossipsub**: Enables efficient message broadcasting
- **Kademlia DHT**: Enables peer discovery and routing

### Orderbook Management

DarkSwap uses a decentralized orderbook for order discovery and matching. Key components include:

- **Order**: Represents a buy or sell order
- **Orderbook**: Manages orders and provides matching functionality
- **Order Matching**: Matches buy and sell orders based on price and amount
- **Order Expiry**: Removes expired orders from the orderbook

### Trade Execution

DarkSwap uses PSBTs (Partially Signed Bitcoin Transactions) for trade execution. Key components include:

- **Trade**: Represents a trade between two peers
- **PSBT**: Partially Signed Bitcoin Transaction
- **Trade Negotiation**: Protocol for negotiating trades
- **Transaction Validation**: Validates transactions before broadcasting

### Asset Support

DarkSwap supports the following assets:

- **Bitcoin**: The native cryptocurrency of the Bitcoin blockchain
- **Runes**: Bitcoin-based tokens using the Ordinals protocol
- **Alkanes**: Bitcoin-based metaprotocol tokens

## Getting Started

To get started with DarkSwap, see the [README.md](../README.md) file for installation and usage instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.