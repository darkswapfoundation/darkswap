# DarkSwap WebAssembly Integration

This document provides an overview of the WebAssembly integration for the DarkSwap project, which allows the DarkSwap SDK to be used in web applications.

## Overview

The WebAssembly integration consists of the following components:

1. **WebAssembly Bindings**: Rust code that exposes the DarkSwap SDK functionality to JavaScript through WebAssembly.
2. **TypeScript Client**: A TypeScript wrapper for the WebAssembly bindings that provides a user-friendly API for web developers.
3. **React Components**: React components that demonstrate how to use the DarkSwap client in a web application.

## Building the WebAssembly Module

To build the WebAssembly module, run the following command:

```bash
./build-wasm.sh
```

This script will:
1. Check if wasm-pack is installed and install it if necessary
2. Copy the fixed wasm.rs file to the original location
3. Build the WebAssembly module using wasm-pack
4. Create a package.json file for the WebAssembly module

The output will be in the `web/public/darkswap-wasm` directory.

## TypeScript Client

The TypeScript client (`DarkSwapClient.ts`) provides a user-friendly API for web developers to interact with the DarkSwap SDK. It handles the initialization of the WebAssembly module, creation of the DarkSwap instance, and provides methods for interacting with the DarkSwap protocol.

### Usage

```typescript
import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './utils/DarkSwapClient';

// Create a new DarkSwap client
const client = new DarkSwapClient();

// Initialize the WebAssembly module
await client.initialize('/darkswap-wasm/darkswap_wasm_bg.wasm');

// Create a DarkSwap instance
await client.create({
  network: BitcoinNetwork.Testnet,
  walletType: 'simple',
  enableWebRTC: true,
  iceServers: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
  ],
});

// Start DarkSwap
await client.start();

// Add event listener
client.addEventListener((event) => {
  console.log('Event:', event);
});

// Get wallet address
const address = await client.getAddress();

// Get wallet balance
const balance = await client.getBalance();

// Create an order
const order = await client.createOrder(
  { type: AssetType.Bitcoin },
  { type: AssetType.Bitcoin },
  OrderSide.Buy,
  '0.01',
  '20000',
  address,
  3600 // 1 hour expiry
);

// Get orders
const orders = await client.getOrders(
  { type: AssetType.Bitcoin },
  { type: AssetType.Bitcoin }
);

// Get best bid and ask
const bestBidAsk = await client.getBestBidAsk(
  { type: AssetType.Bitcoin },
  { type: AssetType.Bitcoin }
);

// Take an order
const trade = await client.takeOrder(order.id, '0.01');

// Stop DarkSwap
await client.stop();
```

## React Components

The React components demonstrate how to use the DarkSwap client in a web application. The main component is `DarkSwapDemo.tsx`, which shows how to:

1. Initialize the DarkSwap client
2. Create a DarkSwap instance
3. Start DarkSwap
4. Get wallet information
5. Create and take orders
6. Handle events

### Usage

```tsx
import DarkSwapDemo from './components/DarkSwapDemo';

const App = () => {
  return (
    <div>
      <h1>DarkSwap Demo</h1>
      <DarkSwapDemo />
    </div>
  );
};
```

## Integration with the Web Application

The WebAssembly demo is integrated into the web application through:

1. A new page (`WasmDemo.tsx`) that displays the DarkSwap demo component
2. A new route in the router configuration (`/wasm-demo`)
3. A new link in the navigation menu
4. A new section on the home page that links to the WebAssembly demo

## Next Steps

To further improve the WebAssembly integration, consider the following:

1. **Optimize the WebAssembly Module**: Reduce the size of the WebAssembly module and optimize its performance.
2. **Add More Features**: Implement more features from the DarkSwap SDK in the WebAssembly bindings.
3. **Improve Error Handling**: Add more robust error handling in the TypeScript client.
4. **Add Unit Tests**: Create unit tests for the TypeScript client.
5. **Add Documentation**: Create comprehensive documentation for the WebAssembly integration.
6. **Add Examples**: Create more examples of how to use the DarkSwap client in web applications.

## Troubleshooting

If you encounter issues with the WebAssembly integration, try the following:

1. **Check the Browser Console**: Look for errors in the browser console.
2. **Check the WebAssembly Module**: Make sure the WebAssembly module is built correctly.
3. **Check the TypeScript Client**: Make sure the TypeScript client is initialized correctly.
4. **Check the React Components**: Make sure the React components are using the DarkSwap client correctly.
5. **Check the Network**: Make sure the WebAssembly module is being loaded correctly.

If you still have issues, please open an issue on the GitHub repository.