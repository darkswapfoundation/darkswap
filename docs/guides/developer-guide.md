# DarkSwap Developer Guide

This guide provides information for developers who want to extend or customize the DarkSwap platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Core Concepts](#core-concepts)
6. [Extending the Platform](#extending-the-platform)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Introduction

DarkSwap is a decentralized trading platform for Bitcoin, runes, and alkanes. It consists of several components:

- **darkswap-sdk**: Core functionality for trading Bitcoin, runes, and alkanes
- **darkswap-cli**: Command-line interface for the DarkSwap platform
- **darkswap-daemon**: Background service for the DarkSwap platform
- **web**: Web interface for the DarkSwap platform

This guide focuses on extending and customizing the DarkSwap platform, particularly the web interface.

## Architecture Overview

The DarkSwap platform uses a layered architecture:

1. **Core Layer**: Implemented in Rust, provides the core functionality for trading Bitcoin, runes, and alkanes.
2. **WebAssembly Layer**: Provides WebAssembly bindings for the core layer, allowing it to be used in web browsers.
3. **TypeScript Layer**: Provides a TypeScript API for the WebAssembly layer, making it easier to use in web applications.
4. **React Layer**: Provides React components and hooks for the TypeScript layer, making it easier to build web interfaces.

The platform also uses a peer-to-peer network for communication between users:

1. **WebRTC Transport**: Provides direct peer-to-peer connections between users.
2. **Circuit Relay**: Provides relay connections for users behind NATs.
3. **GossipSub**: Provides a publish-subscribe system for distributing orderbook updates.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 16 or higher
- **Rust**: Version 1.60 or higher
- **wasm-pack**: For building WebAssembly modules
- **Git**: For version control

### Setup Steps

1. **Clone the repository**:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

2. **Install dependencies**:

```bash
# Install Rust dependencies
cargo build

# Install Node.js dependencies
cd web
npm install
```

3. **Build the WebAssembly modules**:

```bash
cd darkswap-sdk
./build.sh --wasm
```

4. **Start the development server**:

```bash
cd web
npm start
```

The development server will start at `http://localhost:3000`.

## Project Structure

The DarkSwap project has the following structure:

```
darkswap/
├── darkswap-cli/       # Command-line interface
├── darkswap-daemon/    # Background service
├── darkswap-lib/       # TypeScript library
├── darkswap-p2p/       # P2P networking
├── darkswap-relay/     # Circuit relay server
├── darkswap-sdk/       # Core functionality
├── darkswap-support/   # Support utilities
├── darkswap-web-sys/   # WebAssembly bindings
├── docs/               # Documentation
├── src/                # Source code
├── tests/              # Tests
└── web/                # Web interface
```

The web interface has the following structure:

```
web/
├── e2e/               # End-to-end tests
├── mock-api/          # Mock API for testing
├── public/            # Static files
└── src/               # Source code
    ├── components/    # React components
    ├── contexts/      # React contexts
    ├── hooks/         # React hooks
    ├── pages/         # React pages
    ├── services/      # Services
    ├── tests/         # Unit tests
    └── utils/         # Utility functions
```

## Core Concepts

### Asset Types

DarkSwap supports three types of assets:

1. **Bitcoin**: Native Bitcoin
2. **Runes**: Bitcoin-based tokens
3. **Alkanes**: Another type of Bitcoin-based token

### Trade Offers

A trade offer consists of:

- **Maker**: The user who created the offer
- **Maker Asset**: The asset the maker is sending
- **Maker Amount**: The amount of the maker asset
- **Taker Asset**: The asset the maker wants to receive
- **Taker Amount**: The amount of the taker asset
- **Expiry**: The time when the offer expires
- **Status**: The status of the offer (open, accepted, completed, cancelled, expired)

### P2P Network

The P2P network consists of:

- **Peers**: Users connected to the network
- **Direct Connections**: WebRTC connections between peers
- **Relay Connections**: Connections through a relay server for peers behind NATs
- **GossipSub**: A publish-subscribe system for distributing orderbook updates

### WebSocket Events

The platform uses WebSocket events for real-time updates:

- **trade_offer_received**: Sent when a new trade offer is received
- **trade_offer_accepted**: Sent when a trade offer is accepted
- **trade_completed**: Sent when a trade is completed
- **trade_cancelled**: Sent when a trade offer is cancelled
- **trade_expired**: Sent when a trade offer expires
- **balance_changed**: Sent when a balance changes

## Extending the Platform

### Adding a New Component

To add a new component to the web interface:

1. **Create a new file** in the `web/src/components/` directory:

```tsx
// web/src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  // Props for your component
}

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  // Component implementation
  return (
    <div className="my-component">
      {/* Component content */}
    </div>
  );
};
```

2. **Export the component** from the components index file:

```tsx
// web/src/components/index.ts
export * from './MyComponent';
```

3. **Use the component** in your application:

```tsx
import { MyComponent } from '../components';

const MyPage: React.FC = () => {
  return (
    <div>
      <MyComponent />
    </div>
  );
};
```

### Adding a New Hook

To add a new hook to the web interface:

1. **Create a new file** in the `web/src/hooks/` directory:

```tsx
// web/src/hooks/useMyHook.ts
import { useState, useEffect } from 'react';

export const useMyHook = () => {
  // Hook implementation
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    // Effect implementation
  }, []);

  return {
    // Return values
    state,
  };
};
```

2. **Export the hook** from the hooks index file:

```tsx
// web/src/hooks/index.ts
export * from './useMyHook';
```

3. **Use the hook** in your components:

```tsx
import { useMyHook } from '../hooks';

const MyComponent: React.FC = () => {
  const { state } = useMyHook();

  return (
    <div>
      {state}
    </div>
  );
};
```

### Adding a New Page

To add a new page to the web interface:

1. **Create a new file** in the `web/src/pages/` directory:

```tsx
// web/src/pages/MyPage.tsx
import React from 'react';

export const MyPage: React.FC = () => {
  return (
    <div className="my-page">
      {/* Page content */}
    </div>
  );
};
```

2. **Export the page** from the pages index file:

```tsx
// web/src/pages/index.ts
export * from './MyPage';
```

3. **Add the page** to the router:

```tsx
// web/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components';
import { Home, Trade, Settings, About, NotFound, MyPage } from './pages';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="trade" element={<Trade />} />
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
          <Route path="my-page" element={<MyPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};
```

### Adding a New API Endpoint

To add a new API endpoint to the DarkSwap daemon:

1. **Create a new file** in the `darkswap-daemon/src/api/` directory:

```rust
// darkswap-daemon/src/api/my_endpoint.rs
use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct MyRequest {
    // Request fields
}

#[derive(Serialize)]
pub struct MyResponse {
    // Response fields
}

pub async fn my_endpoint(
    req: web::Json<MyRequest>,
    // Other dependencies
) -> impl Responder {
    // Endpoint implementation
    HttpResponse::Ok().json(MyResponse {
        // Response fields
    })
}
```

2. **Register the endpoint** in the API module:

```rust
// darkswap-daemon/src/api/mod.rs
mod my_endpoint;

pub use my_endpoint::my_endpoint;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            // Other endpoints
            .route("/my-endpoint", web::post().to(my_endpoint))
    );
}
```

3. **Use the endpoint** in your application:

```tsx
// web/src/services/DarkSwapService.ts
public async myEndpoint(data: MyRequest): Promise<MyResponse> {
  const response = await this.apiClient.post<{ data: MyResponse }>('/my-endpoint', data);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to call my endpoint');
  }

  return response.data;
}
```

## Testing

### Unit Testing

To write unit tests for your components:

1. **Create a test file** next to your component file:

```tsx
// web/src/components/MyComponent.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    
    // Add assertions
    expect(screen.getByText('My Component')).toBeInTheDocument();
  });
});
```

2. **Run the tests**:

```bash
cd web
npm test
```

### End-to-End Testing

To write end-to-end tests for your application:

1. **Create a test file** in the `web/e2e/` directory:

```tsx
// web/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    // Navigate to the page
    await page.goto('/my-page');
    
    // Interact with the page
    await page.click('button:text("Click Me")');
    
    // Add assertions
    await expect(page.locator('.result')).toHaveText('Success');
  });
});
```

2. **Run the tests**:

```bash
cd web
npx playwright test
```

## Deployment

### Building for Production

To build the application for production:

```bash
# Build the WebAssembly modules
cd darkswap-sdk
./build.sh --wasm --release

# Build the web interface
cd web
npm run build
```

The production build will be in the `web/build` directory.

### Docker Deployment

To deploy the application using Docker:

1. **Build the Docker image**:

```bash
docker build -t darkswap .
```

2. **Run the Docker container**:

```bash
docker run -p 80:80 darkswap
```

The application will be available at `http://localhost`.

## Best Practices

### Code Style

- Use consistent naming conventions:
  - CamelCase for types and traits
  - snake_case for functions, methods, and variables
  - SCREAMING_SNAKE_CASE for constants
  - kebab-case for file names

- Follow Rust style guidelines:
  - Use 4 spaces for indentation
  - Keep lines under 100 characters
  - Use meaningful variable names
  - Add documentation comments for public APIs

- Follow TypeScript style guidelines:
  - Use 2 spaces for indentation
  - Keep lines under 100 characters
  - Use meaningful variable names
  - Add JSDoc comments for public APIs

### Performance

- Optimize for performance:
  - Use efficient data structures
  - Avoid unnecessary allocations
  - Use async/await for I/O operations

- Optimize for memory usage:
  - Avoid unnecessary clones
  - Use references where appropriate
  - Use Arc/Mutex for shared ownership

### Security

- Follow security best practices:
  - Validate all inputs
  - Use secure cryptographic primitives
  - Avoid unsafe code unless necessary

- Handle errors gracefully:
  - Use Result and Option types
  - Provide meaningful error messages
  - Log errors for debugging

## Troubleshooting

### Common Issues

#### "Failed to compile WebAssembly module" error

This error can occur if the WebAssembly module is not built correctly. Try rebuilding the WebAssembly modules:

```bash
cd darkswap-sdk
./build.sh --wasm --clean
```

#### "WebSocket connection failed" error

This error can occur if the DarkSwap daemon is not running or is not accessible. Make sure the daemon is running and accessible:

```bash
cd darkswap-daemon
cargo run
```

#### "Failed to connect to peers" error

This error can occur if the P2P network is not working correctly. Try the following:

- Check your internet connection
- Make sure the relay server is running and accessible
- Check your firewall settings

### Getting Help

If you encounter issues that aren't covered in this guide, you can:

- Check the [API documentation](../api/endpoints.md) for information about the API endpoints
- Check the [component documentation](../components/trade-form.md) for information about the components
- Join the DarkSwap developer community on [Discord](https://discord.gg/darkswap-dev) or [Telegram](https://t.me/darkswap-dev) to get help from other developers
- Contact the DarkSwap development team at dev@darkswap.io