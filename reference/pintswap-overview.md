# PintSwap Architecture Overview

This document provides an overview of the PintSwap architecture and how it relates to DarkSwap.

## Introduction

PintSwap is a decentralized peer-to-peer trading platform for Ethereum-based assets. It enables users to trade ERC-20 tokens directly with each other without the need for intermediaries. DarkSwap is inspired by PintSwap but focuses on Bitcoin, runes, and alkanes instead of Ethereum-based assets.

## Architecture Components

### PintSwap Components

PintSwap consists of several components:

1. **pintswap-sdk**: Core functionality for PintSwap
2. **pintswap-cli**: Command-line interface for interacting with PintSwap
3. **pintswap-daemon**: Background service for hosting an orderbook and facilitating trades

### DarkSwap Components

DarkSwap follows a similar architecture:

1. **darkswap-sdk**: Core functionality for DarkSwap
2. **darkswap-cli**: Command-line interface for interacting with DarkSwap
3. **darkswap-daemon**: Background service for hosting an orderbook and facilitating trades
4. **web**: Web interface for DarkSwap

## P2P Networking

### PintSwap P2P Networking

PintSwap uses js-libp2p for P2P networking:

- **GossipSub**: For orderbook distribution
- **WebRTC**: For browser compatibility
- **Direct Connections**: For trade execution

### DarkSwap P2P Networking

DarkSwap uses rust-libp2p for P2P networking:

- **GossipSub**: For orderbook distribution
- **WebRTC**: For browser compatibility
- **Direct Connections**: For trade execution
- **Circuit Relay**: For NAT traversal

The main difference is that DarkSwap uses rust-libp2p instead of js-libp2p, which provides better performance and more features.

## Orderbook

### PintSwap Orderbook

PintSwap uses a decentralized orderbook:

- **Order Creation**: Users create orders with a specified token pair, amount, and price
- **Order Distribution**: Orders are distributed through GossipSub
- **Order Matching**: Orders are matched by users, not by a central matching engine

### DarkSwap Orderbook

DarkSwap follows a similar approach:

- **Order Creation**: Users create orders with a specified asset pair, amount, and price
- **Order Distribution**: Orders are distributed through GossipSub
- **Order Matching**: Orders are matched by users, not by a central matching engine

The main difference is that DarkSwap supports Bitcoin, runes, and alkanes instead of ERC-20 tokens.

## Trade Execution

### PintSwap Trade Execution

PintSwap uses a peer-to-peer trade execution process:

1. **Trade Intent**: A user sends a trade intent to the maker
2. **Trade Negotiation**: The maker and taker negotiate the trade
3. **Trade Execution**: The trade is executed using Ethereum transactions

### DarkSwap Trade Execution

DarkSwap uses a different approach based on PSBTs (Partially Signed Bitcoin Transactions):

1. **Trade Intent**: A user sends a trade intent to the maker
2. **PSBT Creation**: Both parties create PSBTs
3. **PSBT Exchange**: The parties exchange PSBTs
4. **PSBT Signing**: Both parties sign the PSBTs
5. **Transaction Broadcast**: The final transaction is broadcast to the Bitcoin network

This approach leverages Bitcoin's PSBT feature to enable secure peer-to-peer trading.

## Key Differences

### Network Layer

- **PintSwap**: Uses js-libp2p
- **DarkSwap**: Uses rust-libp2p

### Asset Support

- **PintSwap**: Supports ERC-20 tokens
- **DarkSwap**: Supports Bitcoin, runes, and alkanes

### Trade Execution

- **PintSwap**: Uses Ethereum transactions
- **DarkSwap**: Uses PSBTs (Partially Signed Bitcoin Transactions)

### Implementation Language

- **PintSwap**: Primarily JavaScript/TypeScript
- **DarkSwap**: Primarily Rust with WASM for browser integration

## Lessons from PintSwap

### What Works Well

1. **Decentralized Orderbook**: The decentralized orderbook approach works well for peer-to-peer trading.
2. **P2P Trade Execution**: The peer-to-peer trade execution process is secure and efficient.
3. **GossipSub for Order Distribution**: GossipSub is an effective protocol for distributing orders.

### What Could Be Improved

1. **Network Reliability**: P2P connections can be unreliable, especially in challenging network environments.
2. **User Experience**: The user experience could be improved, especially for non-technical users.
3. **Order Matching**: The order matching process could be more efficient.

## Conclusion

PintSwap provides a solid foundation for DarkSwap, with many architectural patterns that can be reused. However, DarkSwap needs to adapt these patterns to work with Bitcoin, runes, and alkanes instead of Ethereum-based assets. The use of rust-libp2p and PSBTs are key differences that will enable DarkSwap to provide a secure and efficient trading platform for Bitcoin-based assets.