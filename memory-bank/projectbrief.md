# DarkSwap Project Brief

## Project Overview

DarkSwap is a decentralized exchange (DEX) platform focused on peer-to-peer trading of cryptocurrencies, with specific support for Bitcoin, runes, and alkanes. It enables users to trade directly with each other without relying on centralized intermediaries, using a peer-to-peer network architecture.

## Core Objectives

1. **Decentralized Trading**: Enable direct peer-to-peer trading of cryptocurrencies without centralized intermediaries
2. **Bitcoin Focus**: Provide first-class support for Bitcoin, runes, and alkanes
3. **Privacy and Security**: Ensure secure, private transactions with end-to-end encryption
4. **Cross-Platform Support**: Work across desktop and web platforms
5. **User-Friendly Experience**: Offer an intuitive interface for both technical and non-technical users

## Key Components

1.  **darkswap-sdk**: Core Rust library providing core logic, types, and functionality (wallet, orderbook, trade execution).
2.  **darkswap-p2p**: Rust crate managing peer-to-peer networking using libp2p and WebRTC.
3.  **darkswap-relay**: Standalone Rust server for facilitating NAT traversal via circuit relay.
4.  **darkswap-cli**: Command-line interface for user interaction.
5.  **darkswap-daemon**: Background service providing a persistent node and potentially a REST API.
6.  **darkswap-web-sys**: Rust crate providing WebAssembly bindings for browser usage.
7.  **darkswap-lib**: TypeScript library for interacting with WASM bindings in web environments.
8.  **darkswap-bridge**: Component potentially bridging different parts of the system or external services.
9.  **web**: React-based web frontend application.

## Target Users

1. **Cryptocurrency Traders**: Users looking to trade Bitcoin, runes, and alkanes
2. **Privacy-Conscious Users**: Those who value privacy and security in their transactions
3. **Developers**: Those building applications on top of the DarkSwap platform

## Success Criteria

1. **Security**: Zero security breaches or vulnerabilities
2. **Performance**: Fast and reliable transaction processing
3. **Usability**: Intuitive user experience with minimal friction
4. **Adoption**: Growing user base and transaction volume
5. **Reliability**: High uptime and system stability

## Project Constraints

1. **Regulatory Compliance**: Navigate the complex regulatory landscape for decentralized exchanges
2. **Technical Complexity**: Balance advanced features with usability
3. **Network Effects**: Overcome the challenge of building liquidity and user base
4. **Cross-Platform Compatibility**: Ensure consistent experience across different platforms

## Timeline (Based on Consolidated Roadmap)

The project follows a phased approach:

| Phase | Description                 | Status      |
|-------|-----------------------------|-------------|
| 1     | Core SDK Implementation     | COMPLETED   |
| 2     | CLI and Daemon Implementation | COMPLETED   |
| 3     | Web Interface Implementation| IN PROGRESS |
| 4     | Testing and Refinement      | PLANNED     |
| 5     | Documentation and Release   | PLANNED     |

## Project Scope

DarkSwap aims to provide a complete solution for decentralized trading of Bitcoin, runes, and alkanes, including:

1. **Order Book Management**: Creating, matching, and executing orders
2. **Wallet Integration**: Secure management of user funds
3. **P2P Network**: Robust peer-to-peer communication
4. **Security Features**: Authentication, authorization, and encryption
5. **User Interfaces**: CLI (`darkswap-cli`) and web-based (`web`) interfaces.
