# DarkSwapContext Component Documentation

## Overview

The `DarkSwapContext` is a React context that provides access to the DarkSwap platform's core functionality throughout the application. It wraps the DarkSwap SDK and provides hooks for interacting with wallets, trades, and the P2P network.

## Provider

### DarkSwapProvider

```tsx
<DarkSwapProvider options={options}>
  {children}
</DarkSwapProvider>
```

The `DarkSwapProvider` component initializes the DarkSwap SDK and provides the context to its children.

#### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `DarkSwapOptions` | `undefined` | Configuration options for the DarkSwap SDK. |
| `children` | `React.ReactNode` | `undefined` | The child components that will have access to the context. |

#### DarkSwapOptions

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `apiUrl` | `string` | `undefined` | The URL of the DarkSwap API. |
| `wsUrl` | `string` | `undefined` | The URL of the DarkSwap WebSocket server. |
| `relayUrl` | `string` | `undefined` | The URL of the DarkSwap relay server. |
| `debug` | `boolean` | `false` | Whether to enable debug logging. |
| `autoConnect` | `boolean` | `true` | Whether to automatically connect to the P2P network. |
| `reconnectInterval` | `number` | `1000` | The interval in milliseconds between reconnection attempts. |
| `maxReconnectAttempts` | `number` | `5` | The maximum number of reconnection attempts. |

#### Example

```tsx
import { DarkSwapProvider } from '../contexts/DarkSwapContext';

const App: React.FC = () => {
  return (
    <DarkSwapProvider
      options={{
        apiUrl: 'http://localhost:8000/api',
        wsUrl: 'ws://localhost:8000/ws',
        relayUrl: 'wss://relay.darkswap.io',
        debug: true,
      }}
    >
      <YourApp />
    </DarkSwapProvider>
  );
};
```

## Hook

### useDarkSwap

```tsx
const {
  isInitialized,
  isConnected,
  connect,
  disconnect,
  wallet,
  connectWallet,
  disconnectWallet,
  createTradeOffer,
  acceptTradeOffer,
  cancelTradeOffer,
  getTradeOffers,
  getTradeHistory,
  getBitcoinBalance,
  getRuneBalance,
  getAlkaneBalance,
  sendBitcoin,
  sendRune,
  sendAlkane,
  peerId,
  connectedPeers,
  error,
} = useDarkSwap();
```

The `useDarkSwap` hook provides access to the DarkSwap context.

#### Returns

| Name | Type | Description |
|------|------|-------------|
| `isInitialized` | `boolean` | Whether the DarkSwap SDK has been initialized. |
| `isConnected` | `boolean` | Whether the DarkSwap SDK is connected to the P2P network. |
| `connect` | `() => Promise<void>` | Function to connect to the P2P network. |
| `disconnect` | `() => void` | Function to disconnect from the P2P network. |
| `wallet` | `Wallet \| null` | The connected wallet, or null if no wallet is connected. |
| `connectWallet` | `(options: WalletOptions) => Promise<void>` | Function to connect a wallet. |
| `disconnectWallet` | `() => void` | Function to disconnect the wallet. |
| `createTradeOffer` | `(offer: TradeOfferInput) => Promise<string>` | Function to create a trade offer. |
| `acceptTradeOffer` | `(offerId: string) => Promise<void>` | Function to accept a trade offer. |
| `cancelTradeOffer` | `(offerId: string) => Promise<void>` | Function to cancel a trade offer. |
| `getTradeOffers` | `() => Promise<TradeOffer[]>` | Function to get all trade offers. |
| `getTradeHistory` | `() => Promise<TradeHistory[]>` | Function to get the trade history. |
| `getBitcoinBalance` | `() => Promise<number>` | Function to get the Bitcoin balance. |
| `getRuneBalance` | `(runeId: string) => Promise<number>` | Function to get the balance of a specific rune. |
| `getAlkaneBalance` | `(alkaneId: string) => Promise<number>` | Function to get the balance of a specific alkane. |
| `sendBitcoin` | `(address: string, amount: number) => Promise<string>` | Function to send Bitcoin. |
| `sendRune` | `(address: string, runeId: string, amount: number) => Promise<string>` | Function to send a rune. |
| `sendAlkane` | `(address: string, alkaneId: string, amount: number) => Promise<string>` | Function to send an alkane. |
| `peerId` | `string \| null` | The local peer ID, or null if not connected. |
| `connectedPeers` | `string[]` | The IDs of connected peers. |
| `error` | `Error \| null` | The last error that occurred, or null if no error has occurred. |

#### Example

```tsx
import { useDarkSwap } from '../contexts/DarkSwapContext';

const TradeComponent: React.FC = () => {
  const {
    isConnected,
    connect,
    wallet,
    connectWallet,
    createTradeOffer,
    getTradeOffers,
    getBitcoinBalance,
    getRuneBalance,
    error,
  } = useDarkSwap();

  const [bitcoinBalance, setBitcoinBalance] = useState<number>(0);
  const [runeBalance, setRuneBalance] = useState<number>(0);
  const [offers, setOffers] = useState<TradeOffer[]>([]);

  useEffect(() => {
    if (isConnected && wallet) {
      // Get balances
      getBitcoinBalance().then(setBitcoinBalance);
      getRuneBalance('rune-1').then(setRuneBalance);
      
      // Get trade offers
      getTradeOffers().then(setOffers);
    }
  }, [isConnected, wallet, getBitcoinBalance, getRuneBalance, getTradeOffers]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet({
        type: 'built-in',
        password: 'your-password',
      });
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleCreateOffer = async () => {
    try {
      const offerId = await createTradeOffer({
        makerAsset: { type: 'bitcoin' },
        makerAmount: 0.01 * 100000000, // 0.01 BTC in satoshis
        takerAsset: { type: 'rune', id: 'rune-1' },
        takerAmount: 1000,
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });
      
      console.log('Created offer:', offerId);
      
      // Refresh offers
      getTradeOffers().then(setOffers);
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  };

  return (
    <div>
      {!isConnected && (
        <button onClick={handleConnect}>Connect to Network</button>
      )}
      
      {isConnected && !wallet && (
        <button onClick={handleConnectWallet}>Connect Wallet</button>
      )}
      
      {isConnected && wallet && (
        <div>
          <div>Bitcoin Balance: {bitcoinBalance / 100000000} BTC</div>
          <div>Rune Balance: {runeBalance} RUNE</div>
          
          <button onClick={handleCreateOffer}>Create Trade Offer</button>
          
          <h3>Trade Offers</h3>
          <ul>
            {offers.map((offer) => (
              <li key={offer.id}>
                {offer.makerAsset.type === 'bitcoin' ? (
                  <span>{offer.makerAmount / 100000000} BTC</span>
                ) : (
                  <span>{offer.makerAmount} {offer.makerAsset.type.toUpperCase()}</span>
                )}
                {' -> '}
                {offer.takerAsset.type === 'bitcoin' ? (
                  <span>{offer.takerAmount / 100000000} BTC</span>
                ) : (
                  <span>{offer.takerAmount} {offer.takerAsset.type.toUpperCase()}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="error">Error: {error.message}</div>
      )}
    </div>
  );
};
```

## Types

### Wallet

```typescript
interface Wallet {
  type: 'built-in' | 'bdk' | 'hardware' | 'external';
  address: string;
  publicKey: string;
}
```

Represents a connected wallet.

| Name | Type | Description |
|------|------|-------------|
| `type` | `'built-in' \| 'bdk' \| 'hardware' \| 'external'` | The type of wallet. |
| `address` | `string` | The wallet address. |
| `publicKey` | `string` | The wallet public key. |

### WalletOptions

```typescript
interface WalletOptions {
  type: 'built-in' | 'bdk' | 'hardware' | 'external';
  password?: string;
  mnemonic?: string;
  privateKey?: string;
  hardwareType?: 'ledger' | 'trezor';
}
```

Options for connecting a wallet.

| Name | Type | Description |
|------|------|-------------|
| `type` | `'built-in' \| 'bdk' \| 'hardware' \| 'external'` | The type of wallet to connect. |
| `password` | `string \| undefined` | The password for the wallet (required for built-in and BDK wallets). |
| `mnemonic` | `string \| undefined` | The mnemonic phrase for importing a wallet. |
| `privateKey` | `string \| undefined` | The private key for importing a wallet. |
| `hardwareType` | `'ledger' \| 'trezor' \| undefined` | The type of hardware wallet (required for hardware wallets). |

### AssetType

```typescript
interface AssetType {
  type: 'bitcoin' | 'rune' | 'alkane';
  id?: string;
}
```

Represents an asset type.

| Name | Type | Description |
|------|------|-------------|
| `type` | `'bitcoin' \| 'rune' \| 'alkane'` | The type of asset. |
| `id` | `string \| undefined` | The ID of the rune or alkane (required for runes and alkanes). |

### TradeOfferInput

```typescript
interface TradeOfferInput {
  makerAsset: AssetType;
  makerAmount: number;
  takerAsset: AssetType;
  takerAmount: number;
  expiry: number;
}
```

Input for creating a trade offer.

| Name | Type | Description |
|------|------|-------------|
| `makerAsset` | `AssetType` | The asset the maker is sending. |
| `makerAmount` | `number` | The amount of the maker asset. |
| `takerAsset` | `AssetType` | The asset the maker wants to receive. |
| `takerAmount` | `number` | The amount of the taker asset. |
| `expiry` | `number` | The Unix timestamp when the offer expires. |

### TradeOffer

```typescript
interface TradeOffer {
  id: string;
  maker: string;
  makerAsset: AssetType;
  makerAmount: number;
  takerAsset: AssetType;
  takerAmount: number;
  expiry: number;
  status: 'open' | 'accepted' | 'completed' | 'cancelled' | 'expired';
}
```

Represents a trade offer.

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | The ID of the trade offer. |
| `maker` | `string` | The peer ID of the maker. |
| `makerAsset` | `AssetType` | The asset the maker is sending. |
| `makerAmount` | `number` | The amount of the maker asset. |
| `takerAsset` | `AssetType` | The asset the maker wants to receive. |
| `takerAmount` | `number` | The amount of the taker asset. |
| `expiry` | `number` | The Unix timestamp when the offer expires. |
| `status` | `'open' \| 'accepted' \| 'completed' \| 'cancelled' \| 'expired'` | The status of the trade offer. |

### TradeHistory

```typescript
interface TradeHistory {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  assetType: AssetType;
  amount: number;
  price: number;
  status: 'completed' | 'pending' | 'failed';
}
```

Represents a trade history entry.

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | The ID of the trade. |
| `timestamp` | `number` | The Unix timestamp when the trade occurred. |
| `type` | `'buy' \| 'sell'` | The type of trade. |
| `assetType` | `AssetType` | The asset that was traded. |
| `amount` | `number` | The amount of the asset. |
| `price` | `number` | The price of the asset in the trade. |
| `status` | `'completed' \| 'pending' \| 'failed'` | The status of the trade. |

## Implementation Details

### Initialization

The `DarkSwapProvider` initializes the DarkSwap SDK when it mounts. It creates instances of the `ApiClient` and `WebSocketClient` to communicate with the DarkSwap API and WebSocket server, and initializes the DarkSwap SDK with these clients.

```tsx
useEffect(() => {
  const apiClient = new ApiClient({
    baseUrl: options.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    debug: options.debug,
  });

  const wsClient = new WebSocketClient({
    url: options.wsUrl,
    reconnectInterval: options.reconnectInterval,
    maxReconnectAttempts: options.maxReconnectAttempts,
    reconnectOnClose: true,
    debug: options.debug,
  });

  const darkswap = new DarkSwap({
    apiClient,
    wsClient,
    relayUrl: options.relayUrl,
    debug: options.debug,
  });

  setDarkswap(darkswap);
  setIsInitialized(true);

  if (options.autoConnect) {
    darkswap.connect().catch((err) => {
      console.error('Failed to connect to DarkSwap network:', err);
      setError(err);
    });
  }

  return () => {
    darkswap.disconnect();
  };
}, [options]);
```

### Connection Management

The `DarkSwapProvider` manages the connection to the P2P network and provides functions for connecting and disconnecting.

```tsx
const connect = useCallback(async () => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  try {
    await darkswap.connect();
    setIsConnected(true);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to connect to DarkSwap network'));
    throw err;
  }
}, [darkswap]);

const disconnect = useCallback(() => {
  if (!darkswap) {
    return;
  }

  darkswap.disconnect();
  setIsConnected(false);
}, [darkswap]);
```

### Wallet Management

The `DarkSwapProvider` manages the wallet connection and provides functions for connecting and disconnecting wallets.

```tsx
const connectWallet = useCallback(async (options: WalletOptions) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  try {
    const wallet = await darkswap.connectWallet(options);
    setWallet(wallet);
    setError(null);
    return wallet;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
    throw err;
  }
}, [darkswap]);

const disconnectWallet = useCallback(() => {
  if (!darkswap) {
    return;
  }

  darkswap.disconnectWallet();
  setWallet(null);
}, [darkswap]);
```

### Trade Management

The `DarkSwapProvider` provides functions for creating, accepting, and cancelling trade offers, as well as getting trade offers and trade history.

```tsx
const createTradeOffer = useCallback(async (offer: TradeOfferInput) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const offerId = await darkswap.createTradeOffer(offer);
    setError(null);
    return offerId;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to create trade offer'));
    throw err;
  }
}, [darkswap, wallet]);

const acceptTradeOffer = useCallback(async (offerId: string) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    await darkswap.acceptTradeOffer(offerId);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to accept trade offer'));
    throw err;
  }
}, [darkswap, wallet]);

const cancelTradeOffer = useCallback(async (offerId: string) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    await darkswap.cancelTradeOffer(offerId);
    setError(null);
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to cancel trade offer'));
    throw err;
  }
}, [darkswap, wallet]);

const getTradeOffers = useCallback(async () => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  try {
    const offers = await darkswap.getTradeOffers();
    setError(null);
    return offers;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to get trade offers'));
    throw err;
  }
}, [darkswap]);

const getTradeHistory = useCallback(async () => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const history = await darkswap.getTradeHistory();
    setError(null);
    return history;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to get trade history'));
    throw err;
  }
}, [darkswap, wallet]);
```

### Balance Management

The `DarkSwapProvider` provides functions for getting balances of Bitcoin, runes, and alkanes.

```tsx
const getBitcoinBalance = useCallback(async () => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const balance = await darkswap.getBitcoinBalance();
    setError(null);
    return balance;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to get Bitcoin balance'));
    throw err;
  }
}, [darkswap, wallet]);

const getRuneBalance = useCallback(async (runeId: string) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const balance = await darkswap.getRuneBalance(runeId);
    setError(null);
    return balance;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to get rune balance'));
    throw err;
  }
}, [darkswap, wallet]);

const getAlkaneBalance = useCallback(async (alkaneId: string) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const balance = await darkswap.getAlkaneBalance(alkaneId);
    setError(null);
    return balance;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to get alkane balance'));
    throw err;
  }
}, [darkswap, wallet]);
```

### Transaction Management

The `DarkSwapProvider` provides functions for sending Bitcoin, runes, and alkanes.

```tsx
const sendBitcoin = useCallback(async (address: string, amount: number) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const txid = await darkswap.sendBitcoin(address, amount);
    setError(null);
    return txid;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to send Bitcoin'));
    throw err;
  }
}, [darkswap, wallet]);

const sendRune = useCallback(async (address: string, runeId: string, amount: number) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const txid = await darkswap.sendRune(address, runeId, amount);
    setError(null);
    return txid;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to send rune'));
    throw err;
  }
}, [darkswap, wallet]);

const sendAlkane = useCallback(async (address: string, alkaneId: string, amount: number) => {
  if (!darkswap) {
    throw new Error('DarkSwap SDK not initialized');
  }

  if (!wallet) {
    throw new Error('Wallet not connected');
  }

  try {
    const txid = await darkswap.sendAlkane(address, alkaneId, amount);
    setError(null);
    return txid;
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to send alkane'));
    throw err;
  }
}, [darkswap, wallet]);
```

### Peer Management

The `DarkSwapProvider` provides access to the local peer ID and connected peers.

```tsx
useEffect(() => {
  if (!darkswap || !isConnected) {
    setPeerId(null);
    setConnectedPeers([]);
    return;
  }

  const updatePeerId = async () => {
    try {
      const id = await darkswap.getPeerId();
      setPeerId(id);
    } catch (err) {
      console.error('Failed to get peer ID:', err);
    }
  };

  const updateConnectedPeers = async () => {
    try {
      const peers = await darkswap.getConnectedPeers();
      setConnectedPeers(peers);
    } catch (err) {
      console.error('Failed to get connected peers:', err);
    }
  };

  updatePeerId();
  updateConnectedPeers();

  const interval = setInterval(() => {
    updateConnectedPeers();
  }, 5000);

  return () => {
    clearInterval(interval);
  };
}, [darkswap, isConnected]);
```

## Testing

The `DarkSwapContext` can be tested using the following test cases:

1. **Initialization**: Test that the context is initialized correctly.
2. **Connection**: Test that the context can connect to the P2P network.
3. **Wallet Connection**: Test that the context can connect a wallet.
4. **Trade Offers**: Test that the context can create, accept, and cancel trade offers.
5. **Balances**: Test that the context can get balances of Bitcoin, runes, and alkanes.
6. **Transactions**: Test that the context can send Bitcoin, runes, and alkanes.
7. **Peer Management**: Test that the context can get the local peer ID and connected peers.

Example test:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DarkSwapProvider, useDarkSwap } from '../contexts/DarkSwapContext';

// Mock the DarkSwap SDK
jest.mock('../sdk/DarkSwap', () => {
  return {
    DarkSwap: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      connectWallet: jest.fn().mockResolvedValue({
        type: 'built-in',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
      }),
      disconnectWallet: jest.fn(),
      createTradeOffer: jest.fn().mockResolvedValue('offer-1'),
      acceptTradeOffer: jest.fn().mockResolvedValue(undefined),
      cancelTradeOffer: jest.fn().mockResolvedValue(undefined),
      getTradeOffers: jest.fn().mockResolvedValue([]),
      getTradeHistory: jest.fn().mockResolvedValue([]),
      getBitcoinBalance: jest.fn().mockResolvedValue(100000000),
      getRuneBalance: jest.fn().mockResolvedValue(1000),
      getAlkaneBalance: jest.fn().mockResolvedValue(500),
      sendBitcoin: jest.fn().mockResolvedValue('txid-1'),
      sendRune: jest.fn().mockResolvedValue('txid-2'),
      sendAlkane: jest.fn().mockResolvedValue('txid-3'),
      getPeerId: jest.fn().mockResolvedValue('peer-1'),
      getConnectedPeers: jest.fn().mockResolvedValue(['peer-2', 'peer-3']),
    })),
  };
});

// Test component that uses the DarkSwap context
const TestComponent: React.FC = () => {
  const {
    isInitialized,
    isConnected,
    connect,
    wallet,
    connectWallet,
    getBitcoinBalance,
    peerId,
    connectedPeers,
  } = useDarkSwap();

  const [bitcoinBalance, setBitcoinBalance] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isConnected && wallet) {
      getBitcoinBalance().then(setBitcoinBalance);
    }
  }, [isConnected, wallet, getBitcoinBalance]);

  return (
    <div>
      <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Wallet: {wallet ? wallet.address : 'Not connected'}</div>
      <div>Bitcoin Balance: {bitcoinBalance !== null ? bitcoinBalance / 100000000 : 'Unknown'} BTC</div>
      <div>Peer ID: {peerId || 'Unknown'}</div>
      <div>Connected Peers: {connectedPeers.length}</div>
      <button onClick={() => connect()}>Connect</button>
      <button onClick={() => connectWallet({ type: 'built-in', password: 'password' })}>Connect Wallet</button>
    </div>
  );
};

describe('DarkSwapContext', () => {
  it('should initialize correctly', async () => {
    render(
      <DarkSwapProvider
        options={{
          apiUrl: 'http://localhost:8000/api',
          wsUrl: 'ws://localhost:8000/ws',
          relayUrl: 'wss://relay.darkswap.io',
          autoConnect: false,
        }}
      >
        <TestComponent />
      </DarkSwapProvider>
    );

    // Check that the context is initialized
    await waitFor(() => {
      expect(screen.getByText('Initialized: Yes')).toBeInTheDocument();
    });

    // Check that the context is not connected
    expect(screen.getByText('Connected: No')).toBeInTheDocument();

    // Check that no wallet is connected
    expect(screen.getByText('Wallet: Not connected')).toBeInTheDocument();
  });

  // Add more tests here...
});