# DarkSwap Developer Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Development Environment Setup](#development-environment-setup)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
3. [Project Structure](#project-structure)
   - [Core Components](#core-components)
   - [Web Interface](#web-interface)
   - [SDK](#sdk)
   - [Daemon](#daemon)
   - [CLI](#cli)
4. [Build and Deployment](#build-and-deployment)
   - [Building the Project](#building-the-project)
   - [Running Tests](#running-tests)
   - [Deployment](#deployment)
   - [CI/CD Integration](#cicd-integration)
5. [API Integration](#api-integration)
   - [Authentication](#authentication)
   - [Error Handling](#error-handling)
   - [Real-time Updates](#real-time-updates)
   - [Rate Limiting](#rate-limiting)
6. [WebRTC Integration](#webrtc-integration)
   - [Connection Establishment](#connection-establishment)
   - [Data Channels](#data-channels)
   - [NAT Traversal](#nat-traversal)
   - [Circuit Relay](#circuit-relay)
7. [WebAssembly Integration](#webassembly-integration)
   - [Building for WebAssembly](#building-for-webassembly)
   - [JavaScript API](#javascript-api)
   - [Browser Integration](#browser-integration)
8. [Custom Component Development](#custom-component-development)
   - [Component Architecture](#component-architecture)
   - [Context Integration](#context-integration)
   - [Styling](#styling)
   - [Testing](#testing)
9. [Testing](#testing-1)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [End-to-End Testing](#end-to-end-testing)
   - [Performance Testing](#performance-testing)
10. [Best Practices](#best-practices)
    - [Code Style](#code-style)
    - [Error Handling](#error-handling-1)
    - [Security](#security)
    - [Performance](#performance)
11. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Debugging](#debugging)
    - [Getting Help](#getting-help)

## Introduction

This developer guide provides comprehensive information for developers who want to contribute to the DarkSwap project or build applications that integrate with DarkSwap. It covers everything from setting up your development environment to building, testing, and deploying the project.

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It uses WebRTC for browser-to-browser communication and circuit relay for NAT traversal, enabling users to trade directly with each other without relying on a central server or authority.

## Development Environment Setup

### Prerequisites

Before you begin, make sure you have the following installed:

- **Rust** (1.70.0 or later): Required for building the core components, SDK, daemon, and CLI.
  - Install using [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
  - Add WebAssembly target: `rustup target add wasm32-unknown-unknown`

- **Node.js** (18.x or later) and **npm** (9.x or later): Required for building the web interface.
  - Install using [nvm](https://github.com/nvm-sh/nvm): `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash`
  - Install Node.js: `nvm install 18`

- **wasm-pack** (0.10.0 or later): Required for building WebAssembly modules.
  - Install using cargo: `cargo install wasm-pack`

- **Docker** (20.10.0 or later) and **Docker Compose** (2.0.0 or later): Required for running the relay server and other services.
  - Install Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
  - Install Docker Compose: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

- **Git** (2.30.0 or later): Required for version control.
  - Install using your package manager: `apt install git` (Ubuntu/Debian) or `brew install git` (macOS)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

2. Install dependencies:

```bash
# Install Rust dependencies
cargo build

# Install Node.js dependencies
cd web
npm install
cd ..
```

3. Build the project:

```bash
# Build everything
./build.sh --all

# Or build specific components
./build.sh --sdk
./build.sh --daemon
./build.sh --cli
./build.sh --web
```

### Configuration

DarkSwap uses configuration files for various components. The default configuration files are located in the `config` directory. You can create your own configuration files by copying the default ones and modifying them as needed.

#### Core Configuration

The core configuration file is `config/darkswap.toml`. It contains settings for the core components, including the SDK, daemon, and CLI.

```toml
[network]
bootstrap_peers = [
    "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
    "/ip4/104.131.131.83/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuK"
]
relay_servers = [
    "wss://relay1.darkswap.io",
    "wss://relay2.darkswap.io"
]

[wallet]
default_wallet_type = "bdk"
bdk_network = "testnet"
bdk_database_path = "./wallet.db"

[api]
url = "https://api.darkswap.io"
ws_url = "wss://api.darkswap.io/ws"
```

#### Web Configuration

The web configuration file is `web/.env`. It contains settings for the web interface.

```
REACT_APP_API_URL=https://api.darkswap.io
REACT_APP_WS_URL=wss://api.darkswap.io/ws
REACT_APP_RELAY_SERVERS=wss://relay1.darkswap.io,wss://relay2.darkswap.io
```

#### Relay Server Configuration

The relay server configuration file is `relay/config.toml`. It contains settings for the relay server.

```toml
[server]
host = "0.0.0.0"
port = 8080
tls_cert = "./certs/server.crt"
tls_key = "./certs/server.key"

[relay]
max_connections = 1000
max_circuits = 500
circuit_timeout = 3600
bandwidth_limit = 1048576

[auth]
jwt_secret = "your-jwt-secret"
token_expiry = 86400
```

## Project Structure

The DarkSwap project is organized into several components:

### Core Components

- **darkswap-lib**: Core library containing shared functionality used by other components.
- **darkswap-p2p**: P2P networking library for WebRTC and circuit relay.
- **darkswap-support**: Support library with utility functions and common types.
- **darkswap-web-sys**: WebAssembly bindings for browser integration.

### Web Interface

- **web**: React-based web interface for DarkSwap.

### SDK

- **darkswap-sdk**: Software Development Kit for integrating with DarkSwap.

### Daemon

- **darkswap-daemon**: Background service for running DarkSwap nodes.

### CLI

- **darkswap-cli**: Command-line interface for interacting with DarkSwap.

### Relay Server

- **darkswap-relay**: Relay server for NAT traversal and circuit relay.

## Build and Deployment

### Building the Project

The DarkSwap project includes a build script (`build.sh`) that simplifies the build process. You can use this script to build the entire project or specific components.

#### Building Everything

```bash
./build.sh --all
```

#### Building Specific Components

```bash
# Build the SDK
./build.sh --sdk

# Build the daemon
./build.sh --daemon

# Build the CLI
./build.sh --cli

# Build the web interface
./build.sh --web

# Build the relay server
./build.sh --relay
```

#### Building for Release

```bash
./build.sh --all --release
```

### Running Tests

The DarkSwap project includes comprehensive tests for all components. You can run these tests using the `run-tests.sh` script.

```bash
# Run all tests
./run-tests.sh

# Run specific tests
./run-tests.sh --sdk
./run-tests.sh --daemon
./run-tests.sh --cli
./run-tests.sh --web
./run-tests.sh --relay
```

### Deployment

The DarkSwap project includes deployment scripts for various environments. These scripts are located in the `deploy` directory.

#### Deploying to Staging

```bash
./deploy/staging.sh
```

#### Deploying to Production

```bash
./deploy/production.sh
```

#### Deploying the Relay Server

```bash
./deploy/relay.sh
```

### CI/CD Integration

The DarkSwap project includes GitHub Actions workflows for continuous integration and deployment. These workflows are defined in the `.github/workflows` directory.

#### CI Workflow

The CI workflow runs on every push and pull request. It builds the project, runs tests, and checks code style.

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true
      - name: Build
        run: ./build.sh --all
      - name: Test
        run: ./run-tests.sh
```

#### CD Workflow

The CD workflow runs on every push to the main branch. It builds the project, runs tests, and deploys to staging.

```yaml
name: CD

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true
      - name: Build
        run: ./build.sh --all --release
      - name: Test
        run: ./run-tests.sh
      - name: Deploy to Staging
        run: ./deploy/staging.sh
```

## API Integration

### Authentication

The DarkSwap API uses JWT (JSON Web Token) for authentication. To authenticate with the API, you need to include the JWT token in the `Authorization` header of your requests.

```http
Authorization: Bearer <your_jwt_token>
```

To obtain a JWT token, use the `/auth/login` endpoint with your credentials:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

The response will include a JWT token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-04-05T16:00:00Z"
}
```

### Error Handling

The DarkSwap API uses standard HTTP status codes to indicate the success or failure of a request. In addition, the response body will include an error code and message for more detailed information.

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Invalid request parameters",
    "details": {
      "field": "amount",
      "reason": "must be greater than 0"
    }
  }
}
```

When integrating with the API, make sure to handle errors appropriately. Here's an example of error handling in JavaScript:

```javascript
async function fetchData(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### Real-time Updates

The DarkSwap API provides a WebSocket endpoint for real-time updates. To connect to the WebSocket, use the following URL:

```
wss://api.darkswap.io/v1/ws?token=<your_jwt_token>
```

Once connected, you can subscribe to events by sending a message:

```json
{
  "type": "Subscribe",
  "payload": {
    "events": ["order_created", "order_cancelled", "trade_started"]
  }
}
```

You'll receive events as they occur:

```json
{
  "type": "order_created",
  "payload": {
    "order": {
      "id": "order123",
      "base_asset": "BTC",
      "quote_asset": "USD",
      "side": "buy",
      "amount": 1.5,
      "price": 50000,
      "total": 75000,
      "timestamp": "2025-04-05T12:00:00Z",
      "status": "open",
      "maker": "user123"
    }
  }
}
```

### Rate Limiting

The DarkSwap API enforces rate limits to prevent abuse and ensure fair usage. Rate limits are applied per user and per IP address.

The following headers are included in the response to provide information about the rate limits:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the current time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets, in UTC epoch seconds

If the rate limit is exceeded, the API will return a `429 Too Many Requests` response.

## WebRTC Integration

### Connection Establishment

DarkSwap uses WebRTC for peer-to-peer communication. To establish a WebRTC connection, you need to exchange signaling information (SDP offers/answers and ICE candidates) between peers.

Here's an example of how to establish a WebRTC connection:

```javascript
// Create a new RTCPeerConnection
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.darkswap.io:3478',
      username: 'username',
      credential: 'password',
    },
  ],
});

// Create a data channel
const dc = pc.createDataChannel('data');

// Set up event handlers
dc.onopen = () => {
  console.log('Data channel open');
};

dc.onmessage = (event) => {
  console.log('Received message:', event.data);
};

// Create an offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// Send the offer to the other peer via signaling server
sendOffer(pc.localDescription);

// When you receive an answer from the other peer
receiveAnswer((answer) => {
  pc.setRemoteDescription(answer);
});

// When you receive ICE candidates from the other peer
receiveIceCandidate((candidate) => {
  pc.addIceCandidate(candidate);
});

// When local ICE candidates are generated
pc.onicecandidate = (event) => {
  if (event.candidate) {
    sendIceCandidate(event.candidate);
  }
};
```

### Data Channels

WebRTC data channels are used for sending and receiving data between peers. Here's an example of how to use data channels:

```javascript
// Send a message
dc.send(JSON.stringify({ type: 'message', content: 'Hello, world!' }));

// Receive a message
dc.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received message:', data);
};
```

### NAT Traversal

WebRTC uses ICE (Interactive Connectivity Establishment) for NAT traversal. ICE tries to find the best path for connecting peers, using STUN and TURN servers if necessary.

STUN (Session Traversal Utilities for NAT) servers help peers discover their public IP addresses and port mappings, while TURN (Traversal Using Relays around NAT) servers act as relays when direct connections are not possible.

DarkSwap provides STUN and TURN servers for NAT traversal:

```javascript
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.darkswap.io:3478' },
    {
      urls: 'turn:turn.darkswap.io:3478',
      username: 'username',
      credential: 'password',
    },
  ],
});
```

### Circuit Relay

When direct WebRTC connections are not possible, DarkSwap uses circuit relay to establish connections between peers. Circuit relay works by relaying data through a relay server.

Here's an example of how to use circuit relay:

```javascript
// Connect to the relay server
const ws = new WebSocket('wss://relay.darkswap.io');

// Authenticate with the relay server
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    payload: { token: 'your_jwt_token' },
  }));
};

// Request a circuit to another peer
ws.send(JSON.stringify({
  type: 'circuit_request',
  payload: { peer_id: 'peer123' },
}));

// When the circuit is established
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'circuit_established') {
    const circuitId = data.payload.circuit_id;
    
    // Send data through the circuit
    ws.send(JSON.stringify({
      type: 'circuit_data',
      payload: {
        circuit_id: circuitId,
        data: 'Hello, world!',
      },
    }));
  } else if (data.type === 'circuit_data') {
    // Receive data through the circuit
    console.log('Received data:', data.payload.data);
  }
};
```

## WebAssembly Integration

### Building for WebAssembly

DarkSwap uses wasm-bindgen and wasm-pack to build WebAssembly modules. To build for WebAssembly, follow these steps:

1. Make sure you have wasm-pack installed:

```bash
cargo install wasm-pack
```

2. Build the WebAssembly module:

```bash
cd darkswap-web-sys
wasm-pack build --target web
```

This will generate a `pkg` directory containing the WebAssembly module and JavaScript bindings.

### JavaScript API

The WebAssembly module provides a JavaScript API for interacting with the DarkSwap SDK. Here's an example of how to use the API:

```javascript
import init, { DarkSwap } from 'darkswap-web-sys';

// Initialize the WebAssembly module
await init();

// Create a new DarkSwap instance
const darkswap = new DarkSwap();

// Connect to the network
await darkswap.connect();

// Create an order
const order = await darkswap.createOrder({
  baseAsset: 'BTC',
  quoteAsset: 'USD',
  side: 'buy',
  amount: 1.0,
  price: 50000,
});

// Take an order
const trade = await darkswap.takeOrder(order.id, 1.0);

// Get orders
const orders = await darkswap.getOrders();

// Get trades
const trades = await darkswap.getTrades();

// Disconnect from the network
await darkswap.disconnect();
```

### Browser Integration

To use the WebAssembly module in a browser, you need to include it in your web application. Here's an example of how to integrate it with a React application:

```jsx
import React, { useEffect, useState } from 'react';
import init, { DarkSwap } from 'darkswap-web-sys';

function App() {
  const [darkswap, setDarkswap] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initDarkSwap() {
      try {
        await init();
        const ds = new DarkSwap();
        await ds.connect();
        setDarkswap(ds);
        
        const orders = await ds.getOrders();
        setOrders(orders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initDarkSwap();

    return () => {
      if (darkswap) {
        darkswap.disconnect();
      }
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>DarkSwap Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.side} {order.amount} {order.baseAsset} at {order.price} {order.quoteAsset}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## Custom Component Development

### Component Architecture

DarkSwap uses a component-based architecture for its web interface. Components are organized into the following categories:

- **Context Providers**: Provide state and functionality to other components.
- **UI Components**: Reusable UI elements.
- **Page Components**: Top-level components that represent pages.
- **Layout Components**: Components that define the layout of the application.

When creating custom components, follow these guidelines:

1. **Single Responsibility**: Each component should have a single responsibility.
2. **Reusability**: Components should be reusable across the application.
3. **Composition**: Use composition to build complex components from simpler ones.
4. **Props**: Use props to pass data and callbacks to components.
5. **State**: Use state for component-specific data that changes over time.

### Context Integration

DarkSwap provides several context providers that you can use in your custom components:

- **ApiContext**: Provides API functionality.
- **WebSocketContext**: Provides WebSocket functionality.
- **ThemeContext**: Provides theme-related functionality.
- **WalletContext**: Provides wallet-related functionality.
- **NotificationContext**: Provides notification-related functionality.
- **DarkSwapContext**: Provides core DarkSwap functionality.

Here's an example of how to use these contexts in a custom component:

```jsx
import React from 'react';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';
import { useDarkSwap } from '../contexts/DarkSwapContext';

function CustomComponent() {
  const { get, post } = useApi();
  const { connected, send } = useWebSocket();
  const { theme, isDark } = useTheme();
  const { wallet, connect } = useWallet();
  const { addNotification } = useNotification();
  const { orders, createOrder } = useDarkSwap();

  // Use the contexts to implement your component
  // ...

  return (
    <div style={{ backgroundColor: theme.background, color: theme.text }}>
      {/* Your component JSX */}
    </div>
  );
}

export default CustomComponent;
```

### Styling

DarkSwap uses a combination of inline styles and CSS classes for styling components. The `ThemeContext` provides a theme object with color values that you can use to style your components.

Here's an example of how to style a custom component:

```jsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

function CustomComponent() {
  const { theme } = useTheme();

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: theme.card, color: theme.text }}
    >
      <h2 className="text-lg font-semibold mb-2">Custom Component</h2>
      <p style={{ color: theme.secondary }}>
        This is a custom component with styling.
      </p>
      <button
        className="px-4 py-2 rounded mt-4"
        style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
      >
        Click Me
      </button>
    </div>
  );
}

export default CustomComponent;
```

### Testing

DarkSwap uses Jest and React Testing Library for testing components. Here's an example of how to test a custom component:

```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomComponent from './CustomComponent';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the theme context
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007BFF',
      secondary: '#6C757D',
      card: '#F8F9FA',
    },
    isDark: false,
  }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

describe('CustomComponent', () => {
  test('renders correctly', () => {
    render(
      <ThemeProvider>
        <CustomComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('Custom Component')).toBeInTheDocument();
    expect(screen.getByText('This is a custom component with styling.')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('button click works', () => {
    const handleClick = jest.fn();
    render(
      <ThemeProvider>
        <CustomComponent onClick={handleClick} />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Testing

### Unit Testing

DarkSwap uses various testing frameworks for unit testing:

- **Rust**: Uses the built-in testing framework with `cargo test`.
- **JavaScript/TypeScript**: Uses Jest for testing.

#### Rust Unit Tests

Rust unit tests are defined in the same file as the code they test, using the `#[cfg(test)]` attribute. Here's an example:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 2), 4);
    }

    #[test]
    fn test_subtract() {
        assert_eq!(subtract(4, 2), 2);
    }
}
```

To run Rust unit tests, use the `cargo test` command:

```bash
cargo test
```

#### JavaScript/TypeScript Unit Tests

JavaScript/TypeScript unit tests are defined in separate files with the `.test.js` or `.test.tsx` extension. Here's an example:

```javascript
import { add, subtract } from './math';

describe('Math functions', () => {
  test('add works correctly', () => {
    expect(add(2, 2)).toBe(4);
  });

  test('subtract works correctly', () => {
    expect(subtract(4, 2)).toBe(2);
  });
});
```

To run JavaScript/TypeScript unit tests, use the `npm test` command:

```bash
cd web
npm test
```

### Integration Testing

Integration tests verify that different parts of the system work together correctly. DarkSwap uses various approaches for integration testing:

- **Rust**: Uses integration tests in the `tests` directory.
- **JavaScript/TypeScript**: Uses Jest with mock API responses.

#### Rust Integration Tests

Rust integration tests are defined in the `tests` directory. Here's an example:

```rust
// tests/integration_test.rs
use darkswap_sdk::{DarkSwap, Order};

#[test]
fn test_create_order() {
    let darkswap = DarkSwap::new();
    darkswap.connect().unwrap();

    let order = darkswap.create_order(Order {
        base_asset: "BTC".to_string(),
        quote_asset: "USD".to_string(),
        side: "buy".to_string(),
        amount: 1.0,
        price: 50000.0,
    }).unwrap();

    assert_eq!(order.base_asset, "BTC");
    assert_eq!(order.quote_asset, "USD");
    assert_eq!(order.side, "buy");
    assert_eq!(order.amount, 1.0);
    assert_eq!(order.price, 50000.0);
}
```

To run Rust integration tests, use the `cargo test --test integration_test` command:

```bash
cargo test --test integration_test
```

#### JavaScript/TypeScript Integration Tests

JavaScript/TypeScript integration tests use Jest with mock API responses. Here's an example:

```javascript
import { DarkSwapApi } from './api';

// Mock fetch
global.fetch = jest.fn();

describe('DarkSwapApi', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('getOrders returns orders', async () => {
    const mockOrders = [
      {
        id: 'order123',
        base_asset: 'BTC',
        quote_asset: 'USD',
        side: 'buy',
        amount: 1.0,
        price: 50000.0,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ orders: mockOrders }),
    });

    const api = new DarkSwapApi('https://api.darkswap.io');
    const orders = await api.getOrders();

    expect(fetch).toHaveBeenCalledWith('https://api.darkswap.io/orders', expect.any(Object));
    expect(orders).toEqual(mockOrders);
  });
});
```

To run JavaScript/TypeScript integration tests, use the `npm test` command:

```bash
cd web
npm test
```

### End-to-End Testing

End-to-end tests verify that the entire system works correctly from the user's perspective. DarkSwap uses Playwright for end-to-end testing.

Here's an example of an end-to-end test:

```javascript
// tests/e2e/trade.spec.js
const { test, expect } = require('@playwright/test');

test('user can create and take an order', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3000');

