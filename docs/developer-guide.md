# DarkSwap Developer Guide

This guide provides comprehensive information for developers who want to build on or contribute to the DarkSwap platform. It covers the architecture, key components, development setup, and best practices.

## Table of Contents

- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)
  - [Core Components](#core-components)
  - [Communication Flow](#communication-flow)
  - [Data Flow](#data-flow)
- [Development Environment Setup](#development-environment-setup)
  - [Prerequisites](#prerequisites)
  - [Building from Source](#building-from-source)
  - [Development Workflow](#development-workflow)
- [SDK Integration](#sdk-integration)
  - [Rust SDK](#rust-sdk)
  - [WebAssembly Bindings](#webassembly-bindings)
  - [TypeScript Library](#typescript-library)
- [API Reference](#api-reference)
  - [REST API](#rest-api)
  - [WebSocket API](#websocket-api)
- [Component Development](#component-development)
  - [Core Components](#core-components-1)
  - [Web Interface Components](#web-interface-components)
  - [Context Providers](#context-providers)
- [Testing](#testing)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [End-to-End Testing](#end-to-end-testing)
- [Deployment](#deployment)
  - [Local Deployment](#local-deployment)
  - [Production Deployment](#production-deployment)
  - [Docker Deployment](#docker-deployment)
- [Performance Optimization](#performance-optimization)
  - [WebAssembly Optimization](#webassembly-optimization)
  - [React Component Optimization](#react-component-optimization)
  - [API Response Caching](#api-response-caching)
  - [WebSocket Message Batching](#websocket-message-batching)
- [Security Considerations](#security-considerations)
  - [Input Validation](#input-validation)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Error Handling](#error-handling)
  - [Secure Communication](#secure-communication)
- [Contributing](#contributing)
  - [Code Style](#code-style)
  - [Pull Request Process](#pull-request-process)
  - [Issue Reporting](#issue-reporting)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debugging Tips](#debugging-tips)

## Introduction

DarkSwap is a decentralized trading platform for Bitcoin, runes, and alkanes. It consists of several components:

- **DarkSwap SDK**: The core library that provides the functionality for P2P networking, orderbook management, trade execution, and asset support.
- **DarkSwap CLI**: A command-line interface for interacting with the DarkSwap network.
- **DarkSwap Daemon**: A background service that provides a REST API and WebSocket interface for interacting with the DarkSwap network.
- **DarkSwap Web Interface**: A web application that provides a user-friendly interface for trading on the DarkSwap network.

This guide is intended for developers who want to:

- Integrate DarkSwap into their own applications
- Contribute to the DarkSwap codebase
- Build custom components or extensions for DarkSwap
- Understand the architecture and design of DarkSwap

## Architecture Overview

### Core Components

The DarkSwap platform consists of the following core components:

1. **Network Module**: Handles P2P communication using rust-libp2p with WebRTC support for browser compatibility.
2. **Orderbook Module**: Manages orders and matches trades.
3. **Trade Module**: Handles trade execution using Partially Signed Bitcoin Transactions (PSBTs).
4. **Bitcoin Utilities Module**: Provides Bitcoin-specific functionality, including wallet integration and transaction handling.
5. **Runes Module**: Implements the Runes protocol for creating and transferring runes.
6. **Alkanes Module**: Implements the Alkanes protocol for creating and transferring alkanes with predicates.
7. **WebAssembly Bindings**: Provides WebAssembly bindings for using the SDK in web applications.
8. **TypeScript Library**: Provides a TypeScript interface for interacting with the WebAssembly bindings.
9. **React Components**: Provides React components for building user interfaces.

### Communication Flow

The communication flow in DarkSwap is as follows:

1. **User Interaction**: The user interacts with the DarkSwap interface (CLI, web interface, or custom application).
2. **API Request**: The interface sends a request to the DarkSwap daemon via the REST API or WebSocket API.
3. **Daemon Processing**: The daemon processes the request using the DarkSwap SDK.
4. **P2P Communication**: If necessary, the daemon communicates with other nodes in the DarkSwap network using the P2P protocol.
5. **Response**: The daemon sends a response back to the interface.
6. **User Feedback**: The interface provides feedback to the user.

### Data Flow

The data flow in DarkSwap is as follows:

1. **Order Creation**: A user creates an order, which is stored in the local orderbook and broadcast to the network.
2. **Order Propagation**: The order is propagated to other nodes in the network using the GossipSub protocol.
3. **Order Matching**: When a matching order is found, a trade is initiated.
4. **Trade Negotiation**: The trade is negotiated between the two parties using the P2P protocol.
5. **PSBT Creation**: A Partially Signed Bitcoin Transaction (PSBT) is created for the trade.
6. **PSBT Signing**: Both parties sign the PSBT.
7. **Transaction Broadcasting**: The signed transaction is broadcast to the Bitcoin network.
8. **Trade Completion**: The trade is marked as completed once the transaction is confirmed.

## Development Environment Setup

### Prerequisites

To develop for DarkSwap, you need the following:

- **Rust**: Version 1.70.0 or later
- **Node.js**: Version 18.0.0 or later
- **npm**: Version 9.0.0 or later
- **Git**: Version 2.30.0 or later
- **Docker**: Version 20.10.0 or later (optional, for containerized development)

### Building from Source

To build DarkSwap from source:

1. Clone the repository:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

2. Build the SDK:

```bash
cd darkswap-sdk
cargo build --release
```

3. Build the CLI:

```bash
cd ../darkswap-cli
cargo build --release
```

4. Build the daemon:

```bash
cd ../darkswap-daemon
cargo build --release
```

5. Build the web interface:

```bash
cd ../web
npm install
npm run build
```

Alternatively, you can use the provided build script to build all components:

```bash
./build.sh --all
```

### Development Workflow

The recommended development workflow is as follows:

1. **Fork the Repository**: Fork the DarkSwap repository on GitHub.
2. **Clone Your Fork**: Clone your fork to your local machine.
3. **Create a Branch**: Create a branch for your changes.
4. **Make Changes**: Make your changes to the codebase.
5. **Run Tests**: Run the tests to ensure your changes don't break anything.
6. **Build and Test**: Build the components and test them.
7. **Commit Changes**: Commit your changes with a descriptive commit message.
8. **Push Changes**: Push your changes to your fork.
9. **Create a Pull Request**: Create a pull request to the main DarkSwap repository.

## SDK Integration

### Rust SDK

To integrate the DarkSwap SDK into your Rust application:

1. Add the DarkSwap SDK to your `Cargo.toml`:

```toml
[dependencies]
darkswap-sdk = { git = "https://github.com/darkswap/darkswap.git" }
```

2. Import and use the SDK in your code:

```rust
use darkswap_sdk::{DarkSwap, DarkSwapConfig};

fn main() {
    // Create a DarkSwap instance
    let config = DarkSwapConfig::default();
    let darkswap = DarkSwap::new(config);

    // Use the DarkSwap instance
    darkswap.start().expect("Failed to start DarkSwap");
    
    // Create an order
    let order = darkswap.create_order(
        "BTC",
        "RUNE:123",
        "buy",
        "0.1",
        "20000",
        3600,
    ).expect("Failed to create order");
    
    println!("Order created: {:?}", order);
}
```

### WebAssembly Bindings

To use the DarkSwap WebAssembly bindings in your web application:

1. Install the DarkSwap WebAssembly package:

```bash
npm install @darkswap/wasm
```

2. Import and use the WebAssembly bindings in your code:

```javascript
import { DarkSwap } from '@darkswap/wasm';

async function main() {
    // Initialize the DarkSwap instance
    const darkswap = await DarkSwap.init({
        network: 'testnet',
        p2p: {
            listenAddresses: ['/ip4/0.0.0.0/tcp/9000'],
            bootstrapPeers: [],
            relayServers: [],
        },
    });

    // Start the DarkSwap instance
    await darkswap.start();

    // Create an order
    const order = await darkswap.createOrder({
        baseAsset: 'BTC',
        quoteAsset: 'RUNE:123',
        side: 'buy',
        amount: '0.1',
        price: '20000',
        expiry: 3600,
    });

    console.log('Order created:', order);
}

main().catch(console.error);
```

### TypeScript Library

To use the DarkSwap TypeScript library in your web application:

1. Install the DarkSwap TypeScript package:

```bash
npm install @darkswap/ts
```

2. Import and use the TypeScript library in your code:

```typescript
import { DarkSwapClient } from '@darkswap/ts';

async function main() {
    // Create a DarkSwap client
    const client = new DarkSwapClient({
        apiUrl: 'http://localhost:3000',
        wsUrl: 'ws://localhost:3000/ws',
    });

    // Connect to the DarkSwap network
    await client.connect();

    // Create an order
    const order = await client.createOrder({
        baseAsset: 'BTC',
        quoteAsset: 'RUNE:123',
        side: 'buy',
        amount: '0.1',
        price: '20000',
        expiry: 3600,
    });

    console.log('Order created:', order);

    // Subscribe to order events
    client.on('orderCreated', (order) => {
        console.log('New order created:', order);
    });

    client.on('orderCanceled', (order) => {
        console.log('Order canceled:', order);
    });

    client.on('tradeStarted', (trade) => {
        console.log('Trade started:', trade);
    });
}

main().catch(console.error);
```

## API Reference

### REST API

The DarkSwap daemon provides a RESTful API for interacting with the DarkSwap network. The API is available at `http://localhost:3000` when running the daemon locally.

For a complete reference of the REST API, see the [API Reference](api-reference.md).

### WebSocket API

The DarkSwap daemon also provides a WebSocket API for real-time updates. The WebSocket endpoint is available at `ws://localhost:3000/ws` when running the daemon locally.

For a complete reference of the WebSocket API, see the [API Reference](api-reference.md#websocket).

## Component Development

### Core Components

The core components of DarkSwap are implemented in Rust and are part of the DarkSwap SDK. To develop or modify these components:

1. Understand the component's purpose and design by reading the documentation and code.
2. Make your changes to the component.
3. Write tests for your changes.
4. Run the tests to ensure your changes work as expected.
5. Update the documentation if necessary.

### Web Interface Components

The web interface components are implemented in React and TypeScript. To develop or modify these components:

1. Understand the component's purpose and design by reading the documentation and code.
2. Make your changes to the component.
3. Write tests for your changes.
4. Run the tests to ensure your changes work as expected.
5. Update the documentation if necessary.

For a complete reference of the web interface components, see the [Component Reference](component-reference.md).

### Context Providers

The web interface uses React Context for state management. To develop or modify context providers:

1. Understand the context's purpose and design by reading the documentation and code.
2. Make your changes to the context provider.
3. Write tests for your changes.
4. Run the tests to ensure your changes work as expected.
5. Update the documentation if necessary.

## Testing

### Unit Testing

Unit tests are used to test individual components in isolation. To run the unit tests:

```bash
# Run Rust unit tests
cargo test

# Run TypeScript unit tests
npm test
```

### Integration Testing

Integration tests are used to test the interaction between components. To run the integration tests:

```bash
# Run Rust integration tests
cargo test --test '*'

# Run TypeScript integration tests
npm run test:integration
```

### End-to-End Testing

End-to-end tests are used to test the entire application from the user's perspective. To run the end-to-end tests:

```bash
# Run end-to-end tests
npm run test:e2e
```

## Deployment

### Local Deployment

To deploy DarkSwap locally:

1. Build the components:

```bash
./build.sh --all
```

2. Start the daemon:

```bash
./target/release/darkswap-daemon --listen 127.0.0.1:3000
```

3. Start the web interface:

```bash
cd web
npm start
```

### Production Deployment

To deploy DarkSwap in production:

1. Build the components:

```bash
./build.sh --all --release
```

2. Install the components:

```bash
sudo ./install.sh
```

3. Start the daemon:

```bash
sudo systemctl start darkswap
```

4. Deploy the web interface to your web server:

```bash
cd web
npm run build
# Copy the build directory to your web server
```

### Docker Deployment

To deploy DarkSwap using Docker:

1. Build the Docker images:

```bash
docker-compose build
```

2. Start the containers:

```bash
docker-compose up -d
```

## Performance Optimization

### WebAssembly Optimization

To optimize the WebAssembly binary size:

1. Use the `optimize-wasm.sh` script:

```bash
./darkswap-sdk/optimize-wasm.sh
```

This script:
- Analyzes the WebAssembly binary using `twiggy`
- Applies optimization using `wasm-opt -Oz`
- Removes unused functions using `wasm-snip`
- Generates an optimization report

### React Component Optimization

To optimize React components:

1. Use memoization to prevent unnecessary re-renders:

```typescript
import { memoizeComponent } from '../utils/memoize';

const MemoizedComponent = memoizeComponent(MyComponent);
```

2. Use the `useMemo` and `useCallback` hooks for expensive computations and event handlers:

```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

3. Use the `React.lazy` and `Suspense` components for code splitting:

```typescript
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function MyComponent() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </React.Suspense>
  );
}
```

### API Response Caching

To implement API response caching:

1. Use the `cache.ts` utility:

```typescript
import { createCache } from '../utils/cache';

const cache = createCache({
  maxEntries: 100,
  defaultExpiry: 5 * 60 * 1000, // 5 minutes
  persistent: true,
});

// Set a value in the cache
cache.set('key', value, 60 * 1000); // 1 minute expiry

// Get a value from the cache
const value = cache.get('key');
```

2. Integrate caching with the API client:

```typescript
import { ApiClient } from '../utils/ApiClient';

const apiClient = new ApiClient({
  baseUrl: 'http://localhost:3000',
  cache: {
    enabled: true,
    options: {
      maxEntries: 100,
      defaultExpiry: 5 * 60 * 1000, // 5 minutes
      persistent: true,
    },
    methods: ['GET'],
    excludeRoutes: [/\/auth\//],
  },
});

// Make a request with caching
const response = await apiClient.get('/users');

// Skip cache for a specific request
const response = await apiClient.get('/users', { skipCache: true });
```

### WebSocket Message Batching

To implement WebSocket message batching:

1. Use the `WebSocketBatcher` utility:

```typescript
import { WebSocketBatcher, MessagePriority } from '../utils/WebSocketBatcher';

const batcher = new WebSocketBatcher(
  (message) => socket.send(JSON.stringify(message)),
  {
    lowPriorityInterval: 1000,
    mediumPriorityInterval: 250,
    maxBatchSize: 50,
    enableCompression: true,
  }
);

// Start the batcher
batcher.start();

// Queue messages with different priorities
batcher.queueMessage({ type: 'ping' }, MessagePriority.LOW);
batcher.queueMessage({ type: 'update', data: { ... } }, MessagePriority.MEDIUM);
batcher.queueMessage({ type: 'critical', data: { ... } }, MessagePriority.HIGH);

// Stop the batcher when done
batcher.stop();
```

2. Integrate batching with the WebSocket client:

```typescript
import { WebSocketClient } from '../utils/WebSocketClient';

const wsClient = new WebSocketClient({
  url: 'ws://localhost:3000/ws',
  enableBatching: true,
  batcherOptions: {
    lowPriorityInterval: 1000,
    mediumPriorityInterval: 250,
    maxBatchSize: 50,
    enableCompression: true,
  },
});

// Connect to the WebSocket server
await wsClient.connect();

// Send messages with different priorities
wsClient.send({ type: 'ping' }, MessagePriority.LOW);
wsClient.send({ type: 'update', data: { ... } }, MessagePriority.MEDIUM);
wsClient.send({ type: 'critical', data: { ... } }, MessagePriority.HIGH);
```

## Security Considerations

### Input Validation

Always validate user input to prevent security vulnerabilities:

```typescript
function validateOrder(order: any): boolean {
  if (!order.baseAsset || typeof order.baseAsset !== 'string') {
    return false;
  }
  
  if (!order.quoteAsset || typeof order.quoteAsset !== 'string') {
    return false;
  }
  
  if (!order.side || (order.side !== 'buy' && order.side !== 'sell')) {
    return false;
  }
  
  if (!order.amount || isNaN(parseFloat(order.amount)) || parseFloat(order.amount) <= 0) {
    return false;
  }
  
  if (!order.price || isNaN(parseFloat(order.price)) || parseFloat(order.price) <= 0) {
    return false;
  }
  
  if (!order.expiry || isNaN(parseInt(order.expiry)) || parseInt(order.expiry) <= 0) {
    return false;
  }
  
  return true;
}
```

### Authentication and Authorization

Implement proper authentication and authorization to protect sensitive operations:

```typescript
async function createOrder(req: Request, res: Response) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Authorize the user
  if (!user.canCreateOrders) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Validate the order
  if (!validateOrder(req.body)) {
    return res.status(400).json({ error: 'Invalid order' });
  }
  
  // Create the order
  const order = await darkswap.createOrder(
    req.body.baseAsset,
    req.body.quoteAsset,
    req.body.side,
    req.body.amount,
    req.body.price,
    req.body.expiry
  );
  
  return res.status(200).json(order);
}
```

### Error Handling

Implement proper error handling to prevent information leakage:

```typescript
async function createOrder(req: Request, res: Response) {
  try {
    // ... (authentication, authorization, validation)
    
    // Create the order
    const order = await darkswap.createOrder(
      req.body.baseAsset,
      req.body.quoteAsset,
      req.body.side,
      req.body.amount,
      req.body.price,
      req.body.expiry
    );
    
    return res.status(200).json(order);
  } catch (error) {
    // Log the error for debugging
    console.error('Error creating order:', error);
    
    // Return a generic error message to the client
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
```

### Secure Communication

Use secure communication channels to protect sensitive data:

1. Use HTTPS for REST API communication
2. Use WSS (WebSocket Secure) for WebSocket communication
3. Use encryption for sensitive data
4. Use secure headers to prevent common web vulnerabilities

## Contributing

### Code Style

Follow the established code style for each language:

- **Rust**: Follow the [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/README.html)
- **TypeScript**: Follow the [TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md)
- **React**: Follow the [React Style Guide](https://github.com/airbnb/javascript/tree/master/react)

### Pull Request Process

1. Fork the repository
2. Create a branch for your changes
3. Make your changes
4. Run the tests
5. Update the documentation
6. Commit your changes
7. Push your changes to your fork
8. Create a pull request
9. Address any feedback from the reviewers
10. Once approved, your changes will be merged

### Issue Reporting

When reporting issues, include the following information:

1. Description of the issue
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Environment information (OS, browser, versions, etc.)
6. Screenshots or error messages (if applicable)
7. Possible solutions (if you have any)

## Troubleshooting

### Common Issues

#### Build Failures

If you encounter build failures:

1. Make sure you have the correct versions of Rust, Node.js, and npm installed
2. Check for any error messages in the build output
3. Try cleaning the build artifacts and rebuilding
4. Check for any dependencies that might be missing

#### Runtime Errors

If you encounter runtime errors:

1. Check the logs for error messages
2. Make sure all required services are running
3. Check for any configuration issues
4. Try restarting the services

### Debugging Tips

#### Rust Debugging

1. Use `println!` or `dbg!` macros for simple debugging
2. Use the `log` crate for more structured logging
3. Use a debugger like GDB or LLDB for more complex issues

#### TypeScript Debugging

1. Use `console.log` for simple debugging
2. Use the browser's developer tools for more complex issues
3. Use the TypeScript compiler's `--sourceMap` option to generate source maps for easier debugging

#### React Debugging

1. Use the React Developer Tools browser extension
2. Use the `useDebugValue` hook for custom hooks
3. Use the `React.StrictMode` component to detect potential problems

## Conclusion

This developer guide has covered the key aspects of developing for the DarkSwap platform. By following the guidelines and best practices outlined in this guide, you can contribute to the DarkSwap ecosystem or build your own applications on top of it.

For more information, refer to the following resources:

- [API Reference](api-reference.md)
- [Component Reference](component-reference.md)
- [User Guide](user-guide.md)
- [GitHub Repository](https://github.com/darkswap/darkswap)
- [Discord Community](https://discord.gg/darkswap)