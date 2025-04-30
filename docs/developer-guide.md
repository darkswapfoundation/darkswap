# DarkSwap Developer Guide

This guide provides comprehensive documentation for developers who want to integrate with or contribute to the DarkSwap platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Development Environment Setup](#development-environment-setup)
4. [Core SDK](#core-sdk)
5. [WebAssembly Integration](#webassembly-integration)
6. [TypeScript Library](#typescript-library)
7. [API Integration](#api-integration)
8. [WebSocket Integration](#websocket-integration)
9. [P2P Network](#p2p-network)
10. [Contributing Guidelines](#contributing-guidelines)
11. [Testing](#testing)
12. [Deployment](#deployment)

## Introduction

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It enables users to trade these assets without requiring a central server or authority, using WebRTC for browser-to-browser communication and circuit relay for NAT traversal.

This guide is intended for developers who want to:

- Integrate DarkSwap into their applications
- Contribute to the DarkSwap codebase
- Understand the architecture and design of DarkSwap

## Architecture Overview

DarkSwap consists of several components:

- **Core SDK**: A Rust library that provides the core functionality for P2P networking, orderbook management, and trade execution.
- **CLI**: A command-line interface for interacting with the DarkSwap SDK.
- **Daemon**: A background service that provides a REST API for interacting with the DarkSwap SDK.
- **Relay Server**: A server that helps peers connect to each other when they are behind NATs or firewalls.
- **WebAssembly Bindings**: Bindings that allow the Rust code to be used in web browsers.
- **TypeScript Library**: A TypeScript library that provides a high-level API for interacting with the DarkSwap SDK.
- **Web Interface**: A React-based web interface for interacting with the DarkSwap platform.

### Component Diagram

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Web Interface |     |      CLI       |     |     Daemon     |
|                |     |                |     |                |
+-------+--------+     +-------+--------+     +-------+--------+
        |                      |                      |
        v                      v                      v
+-------+------------------------+--------------------+--------+
|                                                              |
|                        TypeScript Library                    |
|                                                              |
+-------+------------------------+--------------------+--------+
        |                                             |
        v                                             v
+-------+--------+                          +--------+--------+
|                |                          |                 |
| WebAssembly    |                          | REST API        |
| Bindings       |                          |                 |
|                |                          |                 |
+-------+--------+                          +-----------------+
        |
        v
+-------+--------+
|                |
|    Core SDK    |
|                |
+----------------+
```

### Data Flow

1. User interacts with the web interface, CLI, or daemon.
2. The web interface, CLI, or daemon uses the TypeScript library to interact with the DarkSwap SDK.
3. The TypeScript library uses the WebAssembly bindings or REST API to interact with the Core SDK.
4. The Core SDK handles P2P networking, orderbook management, and trade execution.
5. The Core SDK communicates with other peers using WebRTC and circuit relay.
6. The Core SDK interacts with the Bitcoin network to execute trades using PSBTs.

## Development Environment Setup

### Prerequisites

- **Rust**: 1.60.0 or later
- **Node.js**: 16.0.0 or later
- **npm**: 8.0.0 or later
- **Cargo**: 1.60.0 or later
- **wasm-pack**: 0.10.0 or later
- **Git**: 2.30.0 or later

### Clone the Repository

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

### Install Dependencies

```bash
# Install Rust dependencies
cargo build

# Install Node.js dependencies
npm install

# Install wasm-pack
cargo install wasm-pack
```

### Build the Project

```bash
# Build the Core SDK
cargo build --release

# Build the WebAssembly bindings
wasm-pack build --target web

# Build the TypeScript library
npm run build:ts

# Build the web interface
npm run build:web
```

### Run the Project

```bash
# Run the CLI
cargo run --bin darkswap-cli

# Run the daemon
cargo run --bin darkswap-daemon

# Run the relay server
cargo run --bin darkswap-relay

# Run the web interface
npm run start:web
```

## Core SDK

The Core SDK is a Rust library that provides the core functionality for P2P networking, orderbook management, and trade execution.

### Key Components

- **P2P Network**: Handles peer discovery, connection establishment, and message broadcasting.
- **Orderbook**: Manages the orderbook, including order matching and order expiry.
- **Trade Protocol**: Handles trade negotiation, PSBT creation, and trade execution.
- **Wallet**: Provides wallet functionality for Bitcoin, runes, and alkanes.

### Usage

```rust
use darkswap_sdk::{DarkSwap, Config, Network};

// Create a new DarkSwap instance
let config = Config {
    network: Network::Testnet,
    ..Default::default()
};

let darkswap = DarkSwap::new(config);

// Start the P2P network
darkswap.start_network().await?;

// Create an order
let order = darkswap.create_order(
    "BTC",
    "ETH",
    "10.0",
    "1.0",
    "buy",
).await?;

// Get the orderbook
let orderbook = darkswap.get_orderbook("BTC", "ETH").await?;

// Execute a trade
let trade = darkswap.execute_trade(
    order.id,
    matching_order.id,
).await?;
```

## WebAssembly Integration

The WebAssembly bindings allow the Rust code to be used in web browsers.

### Key Components

- **wasm-bindgen**: Provides JavaScript bindings for Rust code.
- **js-sys**: Provides access to JavaScript standard library functions.
- **web-sys**: Provides access to Web APIs.

### Usage

```javascript
import init, { DarkSwap } from 'darkswap-wasm';

// Initialize the WebAssembly module
await init();

// Create a new DarkSwap instance
const darkswap = new DarkSwap({
    network: 'testnet',
});

// Start the P2P network
await darkswap.startNetwork();

// Create an order
const order = await darkswap.createOrder(
    'BTC',
    'ETH',
    '10.0',
    '1.0',
    'buy',
);

// Get the orderbook
const orderbook = await darkswap.getOrderbook('BTC', 'ETH');

// Execute a trade
const trade = await darkswap.executeTrade(
    order.id,
    matchingOrder.id,
);
```

## TypeScript Library

The TypeScript library provides a high-level API for interacting with the DarkSwap SDK.

### Key Components

- **DarkSwapClient**: A client for interacting with the DarkSwap SDK.
- **OrderbookManager**: Manages the orderbook, including order creation and matching.
- **TradeManager**: Manages trades, including trade execution and status tracking.
- **WalletManager**: Manages wallets, including balance retrieval and transaction creation.

### Usage

```typescript
import { DarkSwapClient } from 'darkswap-ts';

// Create a new DarkSwap client
const client = new DarkSwapClient({
    network: 'testnet',
});

// Start the client
await client.start();

// Create an order
const order = await client.createOrder({
    baseAsset: 'BTC',
    quoteAsset: 'ETH',
    price: '10.0',
    amount: '1.0',
    type: 'buy',
});

// Get the orderbook
const orderbook = await client.getOrderbook('BTC', 'ETH');

// Execute a trade
const trade = await client.executeTrade(
    order.id,
    matchingOrder.id,
);
```

## API Integration

The DarkSwap daemon provides a REST API for interacting with the DarkSwap SDK.

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Wallet**: `/api/wallet/*`
- **Orders**: `/api/orders/*`
- **Trades**: `/api/trades/*`
- **Market**: `/api/market/*`
- **P2P**: `/api/p2p/*`

### Usage

```typescript
import { ApiClient } from 'darkswap-ts';

// Create a new API client
const apiClient = new ApiClient({
    baseUrl: 'https://api.darkswap.io',
});

// Log in
const loginResponse = await apiClient.post('/api/auth/login', {
    email: 'user@example.com',
    password: 'password',
});

apiClient.setAuthToken(loginResponse.token);

// Create an order
const order = await apiClient.post('/api/orders', {
    baseAsset: 'BTC',
    quoteAsset: 'ETH',
    price: '10.0',
    amount: '1.0',
    type: 'buy',
});

// Get the orderbook
const orderbook = await apiClient.get('/api/market/orderbook', {
    pair: 'BTC/ETH',
});

// Execute a trade
const trade = await apiClient.post(`/api/trades/${order.id}/execute`, {
    matchingOrderId: matchingOrder.id,
});
```

## WebSocket Integration

The DarkSwap daemon provides a WebSocket API for real-time updates.

### Key Channels

- **Ticker**: Real-time ticker updates for trading pairs.
- **Orderbook**: Real-time orderbook updates for trading pairs.
- **Trades**: Real-time trade updates for trading pairs.
- **Orders**: Real-time order updates for the authenticated user.
- **User Trades**: Real-time trade updates for the authenticated user.
- **Balance**: Real-time balance updates for the authenticated user.
- **P2P**: Real-time P2P network updates.

### Usage

```typescript
import { WebSocketClient } from 'darkswap-ts';

// Create a new WebSocket client
const wsClient = new WebSocketClient({
    url: 'wss://api.darkswap.io/ws',
    autoConnect: true,
    reconnect: true,
});

// Authenticate
wsClient.authenticate('jwt-token');

// Subscribe to channels
wsClient.subscribe('ticker', { baseAsset: 'BTC', quoteAsset: 'ETH' });
wsClient.subscribe('orderbook', { baseAsset: 'BTC', quoteAsset: 'ETH' });
wsClient.subscribe('trades', { baseAsset: 'BTC', quoteAsset: 'ETH' });
wsClient.subscribe('orders');
wsClient.subscribe('user_trades');
wsClient.subscribe('balance');
wsClient.subscribe('p2p');

// Listen for events
wsClient.on('ticker_update', (data) => {
    console.log('Ticker update:', data);
});

wsClient.on('orderbook_update', (data) => {
    console.log('Orderbook update:', data);
});

wsClient.on('trade_created', (data) => {
    console.log('Trade created:', data);
});

wsClient.on('order_created', (data) => {
    console.log('Order created:', data);
});

wsClient.on('balance_update', (data) => {
    console.log('Balance update:', data);
});

wsClient.on('peer_connected', (data) => {
    console.log('Peer connected:', data);
});
```

## P2P Network

The DarkSwap P2P network uses WebRTC for browser-to-browser communication and circuit relay for NAT traversal.

### Key Components

- **WebRTC**: Provides direct browser-to-browser communication.
- **Circuit Relay**: Helps peers connect to each other when they are behind NATs or firewalls.
- **GossipSub**: Provides efficient message broadcasting for orderbook distribution.
- **Kademlia DHT**: Provides peer discovery.

### Usage

```typescript
import { P2PClient } from 'darkswap-ts';

// Create a new P2P client
const p2pClient = new P2PClient({
    network: 'testnet',
    relays: ['wss://relay.darkswap.io'],
});

// Start the client
await p2pClient.start();

// Connect to a peer
await p2pClient.connect('peer-id');

// Broadcast a message
await p2pClient.broadcast('channel', 'message');

// Listen for messages
p2pClient.on('message', (channel, message) => {
    console.log(`Received message on channel ${channel}:`, message);
});
```

## Contributing Guidelines

### Code Style

- **Rust**: Follow the [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/README.html).
- **TypeScript**: Follow the [TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md).
- **React**: Follow the [React Style Guide](https://reactjs.org/docs/code-style.html).

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Run the tests to ensure they pass
5. Submit a pull request

### Issues

- Use the issue tracker to report bugs or request features
- Provide as much detail as possible, including steps to reproduce the issue
- Use labels to categorize issues (bug, feature, enhancement, etc.)

## Testing

### Unit Tests

```bash
# Run Rust unit tests
cargo test

# Run TypeScript unit tests
npm run test:ts

# Run React unit tests
npm run test:web
```

### Integration Tests

```bash
# Run API client integration tests
npm run test:integration:api

# Run WebSocket client integration tests
npm run test:integration:ws
```

### End-to-End Tests

```bash
# Run end-to-end tests
npm run test:e2e
```

## Deployment

### Building for Production

```bash
# Build the Core SDK
cargo build --release

# Build the WebAssembly bindings
wasm-pack build --target web --release

# Build the TypeScript library
npm run build:ts:prod

# Build the web interface
npm run build:web:prod
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t darkswap .

# Run the Docker container
docker run -p 8080:8080 darkswap
```

### Continuous Integration and Deployment

DarkSwap uses GitHub Actions for continuous integration and deployment. The workflow is defined in `.github/workflows/ci.yml` and `.github/workflows/cd.yml`.

## API Reference

For detailed API reference documentation, see the [API Documentation](api-documentation.md).

## WebSocket Reference

For detailed WebSocket reference documentation, see the [WebSocket Documentation](websocket-documentation.md).

## Component Reference

For detailed component reference documentation, see the [Component Documentation](component-documentation.md).

## Support

If you need help with DarkSwap development, you can:

- Visit the [DarkSwap Documentation](https://docs.darkswap.io)
- Join the [DarkSwap Discord](https://discord.gg/darkswap)
- Contact the development team at [dev@darkswap.io](mailto:dev@darkswap.io)
