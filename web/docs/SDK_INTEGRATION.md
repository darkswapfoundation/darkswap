# DarkSwap SDK Integration Guide

This document provides guidance on how to integrate the DarkSwap SDK with the web interface.

## Overview

The DarkSwap SDK provides the following functionality:

- P2P network communication
- Order management
- Trade execution
- Wallet integration
- Asset management

## Current Implementation

Currently, the web interface uses a mock SDK service (`src/utils/mockSdkService.ts`) that simulates the behavior of the actual SDK. This mock service provides:

- Mock peer data
- Mock order and trade data
- Mock asset data
- Simulated network statistics

## Integration Steps

To integrate the actual DarkSwap SDK, follow these steps:

### 1. Install the SDK

```bash
npm install @darkswap/sdk
```

### 2. Update the SDK Context

Replace the mock SDK service in `src/contexts/SDKContext.tsx` with the actual SDK:

```typescript
import { DarkSwapSDK } from '@darkswap/sdk';

// Initialize the SDK
const sdk = new DarkSwapSDK({
  // SDK configuration options
  network: 'mainnet', // or 'testnet', 'regtest'
  signalServers: ['wss://signal.darkswap.io'],
  iceServers: [
    { urls: 'stun:stun.darkswap.io:3478' },
    {
      urls: 'turn:turn.darkswap.io:3478',
      username: 'darkswap',
      credential: 'darkswap',
    },
  ],
});

// Use the SDK in the context
export const SDKProvider: React.FC<SDKProviderProps> = ({ children }) => {
  // ... existing context code ...

  // Initialize SDK
  const initialize = async (): Promise<void> => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      await sdk.initialize();
      
      // Set up event listeners
      sdk.on('peer:connect', handlePeerConnect);
      sdk.on('peer:disconnect', handlePeerDisconnect);
      sdk.on('order:new', handleNewOrder);
      sdk.on('order:update', handleOrderUpdate);
      sdk.on('trade:new', handleNewTrade);
      
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize SDK');
      console.error('SDK initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // ... rest of the context ...
};
```

### 3. Implement Event Handlers

Implement the necessary event handlers to react to SDK events:

```typescript
const handlePeerConnect = (peer: Peer) => {
  setPeerCount((prev) => prev + 1);
  // Update connection quality based on peer count
  updateConnectionQuality(peerCount + 1);
};

const handlePeerDisconnect = (peer: Peer) => {
  setPeerCount((prev) => Math.max(0, prev - 1));
  // Update connection quality based on peer count
  updateConnectionQuality(Math.max(0, peerCount - 1));
};

const handleNewOrder = (order: Order) => {
  setOrderCount((prev) => prev + 1);
  // Update order list if needed
};

const handleOrderUpdate = (order: Order) => {
  // Update order list if needed
};

const handleNewTrade = (trade: Trade) => {
  // Update trade list if needed
};
```

### 4. Update Components to Use the SDK

Update the components to use the actual SDK instead of the mock data:

#### Trade Page

```typescript
// src/pages/Trade.tsx
import { useSDK } from '../contexts/SDKContext';

const Trade: React.FC<TradeProps> = ({ isWalletConnected, isSDKInitialized }) => {
  const { sdk } = useSDK();
  
  // Use sdk.getOrders() instead of mock data
  useEffect(() => {
    if (isSDKInitialized) {
      const fetchOrders = async () => {
        const orders = await sdk.getOrders();
        // Process orders
      };
      
      fetchOrders();
    }
  }, [isSDKInitialized, sdk]);
  
  // ... rest of the component ...
};
```

#### Orders Page

```typescript
// src/pages/Orders.tsx
import { useSDK } from '../contexts/SDKContext';

const Orders: React.FC<OrdersProps> = ({ isWalletConnected, isSDKInitialized }) => {
  const { sdk } = useSDK();
  
  // Use sdk.getOrders() and sdk.getTrades() instead of mock data
  useEffect(() => {
    if (isSDKInitialized) {
      const fetchData = async () => {
        const orders = await sdk.getOrders();
        const trades = await sdk.getTrades();
        // Process orders and trades
      };
      
      fetchData();
    }
  }, [isSDKInitialized, sdk]);
  
  // ... rest of the component ...
};
```

#### Vault Page

```typescript
// src/pages/Vault.tsx
import { useSDK } from '../contexts/SDKContext';

const Vault: React.FC<VaultProps> = ({ isWalletConnected, isSDKInitialized }) => {
  const { sdk } = useSDK();
  
  // Use sdk.getAssets() instead of mock data
  useEffect(() => {
    if (isSDKInitialized) {
      const fetchAssets = async () => {
        const assets = await sdk.getAssets();
        // Process assets
      };
      
      fetchAssets();
    }
  }, [isSDKInitialized, sdk]);
  
  // ... rest of the component ...
};
```

### 5. Implement Wallet Integration

Integrate the wallet functionality with the SDK:

```typescript
// src/contexts/WalletContext.tsx
import { DarkSwapSDK } from '@darkswap/sdk';

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  // ... existing context code ...

  const connect = async (): Promise<void> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Connect wallet using the SDK
      const walletProvider = await sdk.connectWallet();
      
      // Get wallet address
      const address = await walletProvider.getAddress();
      
      // Get wallet balance
      const balance = await walletProvider.getBalance();
      
      setAddress(address);
      setBalance(balance);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem('walletAddress', address);
    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // ... rest of the context ...
};
```

## SDK API Reference

### Initialization

```typescript
const sdk = new DarkSwapSDK(config);
await sdk.initialize();
```

### Network

```typescript
// Get network stats
const stats = await sdk.getNetworkStats();

// Get peers
const peers = await sdk.getPeers();
```

### Orders

```typescript
// Get all orders
const orders = await sdk.getOrders();

// Get open orders
const openOrders = await sdk.getOpenOrders();

// Get order history
const orderHistory = await sdk.getOrderHistory();

// Create a new order
const order = await sdk.createOrder(pair, side, type, price, amount);

// Cancel an order
const success = await sdk.cancelOrder(orderId);
```

### Trades

```typescript
// Get all trades
const trades = await sdk.getTrades();
```

### Assets

```typescript
// Get all assets
const assets = await sdk.getAssets();
```

### Events

```typescript
// Listen for events
sdk.on('peer:connect', (peer) => {
  // Handle peer connect
});

sdk.on('peer:disconnect', (peer) => {
  // Handle peer disconnect
});

sdk.on('order:new', (order) => {
  // Handle new order
});

sdk.on('order:update', (order) => {
  // Handle order update
});

sdk.on('trade:new', (trade) => {
  // Handle new trade
});
```

## Testing

To test the SDK integration, you can use the following steps:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the browser console and test the SDK functionality:
   ```javascript
   // Get the SDK instance
   const sdk = window.darkswap.sdk;
   
   // Test network functionality
   const peers = await sdk.getPeers();
   console.log('Peers:', peers);
   
   // Test order functionality
   const orders = await sdk.getOrders();
   console.log('Orders:', orders);
   
   // Test trade functionality
   const trades = await sdk.getTrades();
   console.log('Trades:', trades);
   
   // Test asset functionality
   const assets = await sdk.getAssets();
   console.log('Assets:', assets);
   ```

## Troubleshooting

### Common Issues

1. **SDK Initialization Fails**
   - Check that the SDK is properly installed
   - Verify that the configuration options are correct
   - Check the browser console for error messages

2. **Wallet Connection Fails**
   - Ensure that the wallet provider is available
   - Check that the wallet has the necessary permissions
   - Verify that the wallet is on the correct network

3. **Network Connection Issues**
   - Check that the signal servers are reachable
   - Verify that the ICE servers are correctly configured
   - Check for firewall or network restrictions

### Debugging

To enable debug logging, set the debug option in the SDK configuration:

```typescript
const sdk = new DarkSwapSDK({
  // ... other options ...
  debug: true,
});
```

This will output detailed logs to the browser console, which can help identify issues.

## Resources

- [DarkSwap SDK Documentation](https://docs.darkswap.io/sdk)
- [DarkSwap API Reference](https://docs.darkswap.io/api)
- [DarkSwap GitHub Repository](https://github.com/darkswap/darkswap-sdk)