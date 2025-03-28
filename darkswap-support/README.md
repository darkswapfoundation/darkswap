# DarkSwap Support

This crate provides shared code and utilities for the DarkSwap project. It includes:

- Protocol buffer definitions for P2P communication
- Common data structures and types
- Shared utility functions

## Features

- **Protocol Buffers**: Definitions for P2P messages, orderbook entries, and trade messages
- **Common Types**: Shared types like `PeerId` and `Address`
- **Error Handling**: Common error types and handling
- **Utilities**: Helper functions for parsing and formatting

## Usage

Add this crate as a dependency in your `Cargo.toml`:

```toml
[dependencies]
darkswap-support = { path = "../darkswap-support" }
```

Then import and use the types and utilities:

```rust
use darkswap_support::{
    proto::{self, RelayRequest, RelayResponse},
    types::{PeerId, Address, Error},
    utils::{parse_peer_id, parse_address, current_timestamp},
};

// Use the types and utilities
let peer_id = parse_peer_id("QmExample")?;
let address = parse_address("ip4://127.0.0.1")?;
let timestamp = current_timestamp();
```

## Protocol Buffers

The protocol buffer definitions are located in the `proto` directory:

- `p2p.proto`: P2P networking messages
- `orderbook.proto`: Orderbook messages
- `trade.proto`: Trade messages

These are compiled into Rust code using `prost` and included in the `proto` module.

## Types

The `types` module provides common types used throughout the DarkSwap project:

- `PeerId`: A peer ID
- `Address`: A network address
- `Error`: Common error types

## Utilities

The `utils` module provides utility functions:

- `parse_peer_id`: Parse a peer ID from a string
- `parse_address`: Parse an address from a string
- `current_timestamp`: Get the current timestamp