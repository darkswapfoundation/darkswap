# PintSwap Analysis for DarkSwap Implementation

## Introduction

This document provides an analysis of the PintSwap project and how its architecture and functionality can be leveraged for the DarkSwap implementation. PintSwap is a decentralized peer-to-peer trading platform for Ethereum-based assets, while DarkSwap aims to provide similar functionality for Bitcoin, runes, and alkanes.

## PintSwap Architecture Overview

PintSwap consists of several key components:

1. **pintswap-sdk**: Core SDK providing P2P networking, orderbook management, and trade execution
2. **pintswap-cli**: Command-line interface for interacting with the SDK
3. **pintswap-daemon**: Background service for hosting an orderbook and facilitating trades

### P2P Networking

PintSwap uses js-libp2p for P2P networking, with the following key features:

- **WebRTC Transport**: Enables browser-to-browser communication
- **GossipSub Protocol**: For efficient message broadcasting
- **Peer Discovery**: Using bootstrap nodes and DHT
- **NAT Traversal**: Using STUN/TURN servers and circuit relays

### Orderbook Management

PintSwap implements a decentralized orderbook with the following characteristics:

- **Local Orderbook**: Each peer maintains its own orderbook
- **Order Broadcasting**: Orders are broadcast to the network using GossipSub
- **Order Matching**: Orders are matched locally by each peer
- **Order Expiry**: Orders expire after a configurable time period

### Trade Execution

PintSwap executes trades using the following process:

1. **Trade Intent**: Taker sends a trade intent to the maker
2. **Trade Negotiation**: Maker and taker negotiate the trade parameters
3. **Transaction Creation**: Maker creates a transaction and signs it
4. **Transaction Verification**: Taker verifies the transaction
5. **Transaction Signing**: Taker signs the transaction
6. **Transaction Broadcasting**: The transaction is broadcast to the Ethereum network

## Adapting PintSwap for DarkSwap

### P2P Networking

While PintSwap uses js-libp2p, DarkSwap will use rust-libp2p with WebRTC transport for browser compatibility. The key differences and adaptations include:

1. **Transport Protocol**:
   - PintSwap: js-libp2p with WebRTC
   - DarkSwap: rust-libp2p with WebRTC (ported from Subfrost's QUIC implementation)

2. **Message Broadcasting**:
   - PintSwap: GossipSub protocol
   - DarkSwap: GossipSub protocol (similar implementation in rust-libp2p)

3. **Peer Discovery**:
   - PintSwap: Bootstrap nodes and DHT
   - DarkSwap: Similar approach with bootstrap nodes and Kademlia DHT

4. **NAT Traversal**:
   - PintSwap: STUN/TURN servers and circuit relays
   - DarkSwap: WebRTC's built-in ICE and ported circuit relay from Subfrost

### Orderbook Management

The orderbook management in DarkSwap will be similar to PintSwap but adapted for Bitcoin-based assets:

1. **Order Structure**:
   - PintSwap: Ethereum token pairs (e.g., ETH/USDC)
   - DarkSwap: Bitcoin, runes, and alkanes pairs (e.g., BTC/RUNE)

2. **Order Broadcasting**:
   - PintSwap: GossipSub for order broadcasting
   - DarkSwap: Similar approach with GossipSub

3. **Order Storage**:
   - PintSwap: In-memory orderbook with persistence
   - DarkSwap: Similar approach with potential optimizations

### Trade Execution

The trade execution process in DarkSwap will differ significantly from PintSwap due to the different transaction models of Ethereum and Bitcoin:

1. **Transaction Model**:
   - PintSwap: Ethereum's account-based model
   - DarkSwap: Bitcoin's UTXO-based model with PSBTs

2. **Trade Process**:
   - PintSwap: Single transaction with token transfers
   - DarkSwap: PSBT-based trade with inputs and outputs for both parties

3. **Atomic Swaps**:
   - PintSwap: Smart contract-based atomic swaps
   - DarkSwap: PSBT-based atomic swaps with proper input/output validation

## Code Structure Comparison

### SDK Structure

```
pintswap-sdk/
├── src/
│   ├── index.js          # Main entry point
│   ├── config.js         # Configuration
│   ├── errors.js         # Error handling
│   ├── types.js          # Common types
│   ├── orderbook.js      # Orderbook management
│   ├── network.js        # P2P networking
│   ├── ethereum.js       # Ethereum utilities
│   └── trade.js          # Trade execution

darkswap-sdk/
├── src/
│   ├── lib.rs           # Main entry point
│   ├── config.rs        # Configuration
│   ├── error.rs         # Error handling
│   ├── types.rs         # Common types
│   ├── orderbook.rs     # Orderbook management
│   ├── network.rs       # P2P networking
│   ├── bitcoin_utils.rs # Bitcoin utilities
│   ├── trade.rs         # Trade execution
│   └── wasm.rs          # WASM bindings
```

### CLI Structure

```
pintswap-cli/
├── src/
│   ├── index.js          # Main entry point
│   ├── commands/         # CLI commands
│   │   ├── create.js     # Create order
│   │   ├── cancel.js     # Cancel order
│   │   ├── take.js       # Take order
│   │   ├── list.js       # List orders
│   │   └── daemon.js     # Start daemon

darkswap-cli/
├── src/
│   ├── main.rs          # Main entry point
│   ├── commands.rs      # CLI commands
│   ├── create.rs        # Create order
│   ├── cancel.rs        # Cancel order
│   ├── take.rs          # Take order
│   ├── list.rs          # List orders
│   └── daemon.rs        # Start daemon
```

### Daemon Structure

```
pintswap-daemon/
├── src/
│   ├── index.js          # Main entry point
│   ├── api.js            # REST API
│   ├── events.js         # Event system
│   └── wallet.js         # Wallet integration

darkswap-daemon/
├── src/
│   ├── main.rs          # Main entry point
│   ├── api.rs           # REST API
│   ├── events.rs        # Event system
│   └── wallet.rs        # Wallet integration
```

## Key Protocol Differences

### Order Protocol

PintSwap's order protocol is designed for Ethereum tokens:

```javascript
// PintSwap order
{
  id: '0x1234...',
  maker: '0xabcd...',
  baseToken: '0x1111...',
  quoteToken: '0x2222...',
  side: 'buy',
  amount: '1000000000000000000',
  price: '0.05',
  status: 'open',
  timestamp: 1647270000,
  expiry: 1647356400
}
```

DarkSwap's order protocol needs to be adapted for Bitcoin, runes, and alkanes:

```rust
// DarkSwap order
struct Order {
    id: OrderId,
    maker: PeerId,
    base_asset: Asset,
    quote_asset: Asset,
    side: OrderSide,
    amount: Decimal,
    price: Decimal,
    status: OrderStatus,
    timestamp: u64,
    expiry: u64,
}

enum Asset {
    Bitcoin,
    Rune(RuneId),
    Alkane(AlkaneId),
}
```

### Trade Protocol

PintSwap's trade protocol uses Ethereum transactions:

```javascript
// PintSwap trade
{
  id: '0x5678...',
  orderId: '0x1234...',
  maker: '0xabcd...',
  taker: '0xefgh...',
  baseToken: '0x1111...',
  quoteToken: '0x2222...',
  side: 'buy',
  amount: '1000000000000000000',
  price: '0.05',
  status: 'pending',
  transaction: {
    to: '0x1111...',
    data: '0x...',
    value: '0',
    gasLimit: '200000',
    gasPrice: '20000000000'
  }
}
```

DarkSwap's trade protocol needs to use PSBTs:

```rust
// DarkSwap trade
struct Trade {
    id: TradeId,
    order_id: OrderId,
    maker: PeerId,
    taker: PeerId,
    base_asset: Asset,
    quote_asset: Asset,
    side: OrderSide,
    amount: Decimal,
    price: Decimal,
    status: TradeStatus,
    psbt: PartiallySignedBitcoinTransaction,
}
```

## Implementation Strategy

To adapt PintSwap's architecture for DarkSwap, we'll follow these steps:

1. **P2P Networking**:
   - Implement WebRTC transport for rust-libp2p
   - Port the circuit relay implementation from Subfrost
   - Implement GossipSub for order broadcasting

2. **Orderbook Management**:
   - Implement an orderbook structure for Bitcoin, runes, and alkanes
   - Implement order matching logic
   - Implement order expiry and cleanup

3. **Trade Execution**:
   - Implement PSBT creation and signing
   - Implement trade negotiation protocol
   - Implement transaction validation and broadcasting

4. **Browser Integration**:
   - Compile the Rust code to WebAssembly
   - Create JavaScript bindings
   - Integrate with the web interface

## Conclusion

PintSwap provides a valuable reference architecture for DarkSwap, particularly for the P2P networking and orderbook management components. However, significant adaptations are needed for the trade execution process due to the different transaction models of Ethereum and Bitcoin.

By combining the P2P networking approach from PintSwap with the circuit relay implementation from Subfrost and adapting them for WebRTC, DarkSwap can create a robust decentralized trading platform for Bitcoin, runes, and alkanes that works seamlessly in browsers.

The implementation will leverage the strengths of both projects while addressing the unique requirements of Bitcoin-based assets, resulting in a powerful and user-friendly decentralized trading platform.
