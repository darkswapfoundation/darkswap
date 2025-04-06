# DarkSwap Component Documentation

## Overview

This document provides comprehensive documentation for the React components used in the DarkSwap web interface. Each component is described with its purpose, props, usage examples, and internal structure.

## Table of Contents

1. [Context Providers](#context-providers)
   - [ApiContext](#apicontext)
   - [WebSocketContext](#websocketcontext)
   - [ThemeContext](#themecontext)
   - [WalletContext](#walletcontext)
   - [NotificationContext](#notificationcontext)
   - [DarkSwapContext](#darkswapcontext)
2. [UI Components](#ui-components)
   - [Orderbook](#orderbook)
   - [TradeForm](#tradeform)
   - [PriceChart](#pricechart)
   - [ThemeToggle](#themetoggle)
   - [AssetSelector](#assetselector)
   - [WalletConnector](#walletconnector)
   - [OrderHistory](#orderhistory)
   - [Notifications](#notifications)
3. [Page Components](#page-components)
   - [Home](#home)
   - [Trade](#trade)
   - [Settings](#settings)
   - [About](#about)
   - [NotFound](#notfound)
4. [Layout Components](#layout-components)
   - [Layout](#layout)
   - [Header](#header)
   - [Footer](#footer)
   - [Sidebar](#sidebar)

## Context Providers

### ApiContext

**Purpose**: Provides a centralized way to make API requests to the backend, with built-in loading and error handling.

**File**: `src/contexts/ApiContext.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Child components that will have access to the context |
| baseUrl | string | 'https://api.darkswap.io' | Base URL for API requests |

**Context Value**:

| Property | Type | Description |
|----------|------|-------------|
| get | <T>(url: string) => Promise<T> | Function to make GET requests |
| post | <T>(url: string, data: any) => Promise<T> | Function to make POST requests |
| loading | boolean | Whether a request is currently loading |
| error | string \| null | Error message if a request failed, null otherwise |
| clearError | () => void | Function to clear the error state |

**Usage Example**:

```tsx
import { useApi } from '../contexts/ApiContext';

const MyComponent = () => {
  const { get, loading, error } = useApi();

  const fetchData = async () => {
    try {
      const data = await get<{ items: string[] }>('/items');
      console.log(data.items);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        Fetch Data
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
};
```

**Implementation Details**:

The ApiContext uses React's Context API to provide a centralized way to make API requests. It maintains loading and error states that are updated during the request lifecycle. The context provides `get` and `post` methods that handle the request, response parsing, and error handling.

### WebSocketContext

**Purpose**: Manages WebSocket connections for real-time updates, with automatic reconnection and subscription management.

**File**: `src/contexts/WebSocketContext.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Child components that will have access to the context |
| url | string | - | WebSocket server URL |
| reconnectInterval | number | 5000 | Time in milliseconds to wait before attempting to reconnect |
| maxReconnectAttempts | number | 5 | Maximum number of reconnection attempts |

**Context Value**:

| Property | Type | Description |
|----------|------|-------------|
| connect | () => void | Function to connect to the WebSocket server |
| disconnect | () => void | Function to disconnect from the WebSocket server |
| send | (message: any) => void | Function to send a message to the WebSocket server |
| subscribe | (channel: string, callback: (data: any) => void) => void | Function to subscribe to a channel |
| unsubscribe | (channel: string) => void | Function to unsubscribe from a channel |
| connected | boolean | Whether the WebSocket is connected |
| message | any | The most recent message received from the WebSocket server |

**Usage Example**:

```tsx
import { useWebSocket } from '../contexts/WebSocketContext';

const MyComponent = () => {
  const { connected, send, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    if (connected) {
      const handleOrderUpdate = (data) => {
        console.log('Order update:', data);
      };

      subscribe('orders', handleOrderUpdate);

      return () => {
        unsubscribe('orders');
      };
    }
  }, [connected, subscribe, unsubscribe]);

  const sendMessage = () => {
    send({ type: 'ping' });
  };

  return (
    <div>
      <p>WebSocket status: {connected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={sendMessage} disabled={!connected}>
        Send Ping
      </button>
    </div>
  );
};
```

**Implementation Details**:

The WebSocketContext manages a WebSocket connection to the server, handling connection state, reconnection logic, and message handling. It provides methods to send messages and subscribe to specific channels, with callbacks for handling incoming messages. The context automatically attempts to reconnect if the connection is lost, with a configurable number of retry attempts.

### ThemeContext

**Purpose**: Provides theme-related functionality, including light and dark mode support.

**File**: `src/contexts/ThemeContext.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Child components that will have access to the context |
| defaultTheme | 'light' \| 'dark' | 'light' | Default theme to use |

**Context Value**:

| Property | Type | Description |
|----------|------|-------------|
| isDark | boolean | Whether dark mode is enabled |
| theme | Theme | Theme object with color values |
| toggleTheme | () => void | Function to toggle between light and dark mode |

**Theme Object**:

```typescript
interface Theme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  card: string;
  border: string;
}
```

**Usage Example**:

```tsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { isDark, theme, toggleTheme } = useTheme();

  return (
    <div style={{ backgroundColor: theme.background, color: theme.text }}>
      <h1>My Component</h1>
      <p>Current theme: {isDark ? 'Dark' : 'Light'}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

**Implementation Details**:

The ThemeContext provides theme-related functionality, including light and dark mode support. It uses localStorage to persist the user's theme preference and also checks for system preferences using the `prefers-color-scheme` media query. The context provides a theme object with color values that can be used to style components.

### WalletContext

**Purpose**: Manages wallet connection and provides wallet-related functionality.

**File**: `src/contexts/WalletContext.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Child components that will have access to the context |

**Context Value**:

| Property | Type | Description |
|----------|------|-------------|
| wallet | Wallet \| null | The connected wallet, or null if no wallet is connected |
| connect | (walletType: string) => Promise<void> | Function to connect a wallet |
| disconnect | () => void | Function to disconnect the wallet |
| loading | boolean | Whether a wallet operation is in progress |
| error | string \| null | Error message if a wallet operation failed, null otherwise |
| balance | Balance | Object containing asset balances |
| transactions | Transaction[] | Array of wallet transactions |
| refreshBalance | () => Promise<void> | Function to refresh the wallet balance |

**Types**:

```typescript
interface Wallet {
  id: string;
  name: string;
  type: 'bitcoin' | 'ethereum' | 'other';
  addresses: Record<string, string>;
}

interface Balance {
  [asset: string]: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  status: 'pending' | 'confirmed' | 'failed';
  amount: number;
  asset: string;
  timestamp: number;
  txid?: string;
  fee?: number;
}
```

**Usage Example**:

```tsx
import { useWallet } from '../contexts/WalletContext';

const MyComponent = () => {
  const { wallet, connect, disconnect, balance, loading } = useWallet();

  const handleConnect = async () => {
    try {
      await connect('bitcoin');
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  return (
    <div>
      {wallet ? (
        <>
          <p>Connected to {wallet.name}</p>
          <p>BTC Balance: {balance.BTC || 0}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnect} disabled={loading}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};
```

**Implementation Details**:

The WalletContext manages wallet connection and provides wallet-related functionality. It uses localStorage to persist the wallet connection and automatically reconnects on page load if a wallet was previously connected. The context provides methods to connect and disconnect wallets, as well as access to wallet balances and transactions.

### NotificationContext

**Purpose**: Manages application notifications, including adding, removing, and marking notifications as read.

**File**: `src/contexts/NotificationContext.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Child components that will have access to the context |
| maxNotifications | number | 100 | Maximum number of notifications to store |

**Context Value**:

| Property | Type | Description |
|----------|------|-------------|
| notifications | Notification[] | Array of notifications |
| addNotification | (notification: Omit<Notification, 'id' \| 'timestamp' \| 'read'>) => string | Function to add a notification, returns the notification ID |
| removeNotification | (id: string) => void | Function to remove a notification |
| markAsRead | (id: string) => void | Function to mark a notification as read |
| markAllAsRead | () => void | Function to mark all notifications as read |
| clearAll | () => void | Function to clear all notifications |

**Types**:

```typescript
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  autoClose?: boolean;
  duration?: number;
}
```

**Usage Example**:

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent = () => {
  const { addNotification, notifications } = useNotification();

  const showSuccessNotification = () => {
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully',
      autoClose: true,
      duration: 3000,
    });
  };

  const showErrorNotification = () => {
    addNotification({
      type: 'error',
      title: 'Error',
      message: 'An error occurred',
      autoClose: false,
    });
  };

  return (
    <div>
      <p>Unread notifications: {notifications.filter(n => !n.read).length}</p>
      <button onClick={showSuccessNotification}>Show Success</button>
      <button onClick={showErrorNotification}>Show Error</button>
    </div>
  );
};
```

**Implementation Details**:

The NotificationContext manages application notifications, including adding, removing, and marking notifications as read. It supports different notification types (info, success, warning, error) and can automatically close notifications after a specified duration. The context maintains a list of notifications that can be displayed in the UI.

### DarkSwapContext

**Purpose**: Provides core DarkSwap functionality, including order and trade management.

**File**: `src/contexts/DarkSwapContext.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Child components that will have access to the context |
| options | { apiUrl?: string; wsUrl?: string; } | {} | Configuration options |

**Context Value**:

| Property | Type | Description |
|----------|------|-------------|
| orders | Order[] | Array of all orders |
| myOrders | Order[] | Array of the user's orders |
| createOrder | (order: Omit<Order, 'id' \| 'timestamp' \| 'status' \| 'maker'>) => Promise<Order> | Function to create a new order |
| cancelOrder | (orderId: string) => Promise<boolean> | Function to cancel an order |
| takeOrder | (orderId: string, amount: number) => Promise<Trade> | Function to take an order |
| trades | Trade[] | Array of all trades |
| myTrades | Trade[] | Array of the user's trades |
| markets | Record<string, MarketData> | Object containing market data |
| selectedMarket | string | Currently selected market |
| setSelectedMarket | (market: string) => void | Function to set the selected market |
| loading | boolean | Whether an operation is in progress |
| error | string \| null | Error message if an operation failed, null otherwise |
| clearError | () => void | Function to clear the error state |

**Types**:

```typescript
interface Order {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  maker: string;
}

interface Trade {
  id: string;
  orderId: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  maker: string;
  taker: string;
  txid?: string;
}

interface MarketData {
  baseAsset: string;
  quoteAsset: string;
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}
```

**Usage Example**:

```tsx
import { useDarkSwap } from '../contexts/DarkSwapContext';

const MyComponent = () => {
  const { 
    orders, 
    createOrder, 
    cancelOrder, 
    takeOrder, 
    markets, 
    selectedMarket, 
    setSelectedMarket 
  } = useDarkSwap();

  const handleCreateOrder = async () => {
    try {
      const order = await createOrder({
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        side: 'buy',
        amount: 1.0,
        price: 50000,
        total: 50000,
      });
      console.log('Order created:', order);
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  return (
    <div>
      <h2>Selected Market: {selectedMarket}</h2>
      <select 
        value={selectedMarket} 
        onChange={(e) => setSelectedMarket(e.target.value)}
      >
        {Object.keys(markets).map((market) => (
          <option key={market} value={market}>
            {market}
          </option>
        ))}
      </select>
      <button onClick={handleCreateOrder}>Create Order</button>
      <h3>Orders</h3>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.side} {order.amount} {order.baseAsset} at {order.price} {order.quoteAsset}
            <button onClick={() => cancelOrder(order.id)}>Cancel</button>
            <button onClick={() => takeOrder(order.id, order.amount)}>Take</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Implementation Details**:

The DarkSwapContext provides core DarkSwap functionality, including order and trade management. It integrates with the API and WebSocket contexts to fetch data and receive real-time updates. The context maintains state for orders, trades, and market data, and provides methods to create, cancel, and take orders.

## UI Components

### Orderbook

**Purpose**: Displays buy and sell orders for a trading pair.

**File**: `src/components/Orderbook.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| buyOrders | Order[] | - | Array of buy orders |
| sellOrders | Order[] | - | Array of sell orders |
| maxOrders | number | 10 | Maximum number of orders to display on each side |
| onOrderClick | (order: Order) => void | - | Callback function when an order is clicked |

**Usage Example**:

```tsx
import Orderbook from '../components/Orderbook';

const MyComponent = () => {
  const buyOrders = [
    { id: '1', price: 50000, amount: 1.0, total: 50000, type: 'buy' },
    { id: '2', price: 49500, amount: 2.0, total: 99000, type: 'buy' },
  ];

  const sellOrders = [
    { id: '3', price: 50500, amount: 1.5, total: 75750, type: 'sell' },
    { id: '4', price: 51000, amount: 0.5, total: 25500, type: 'sell' },
  ];

  const handleOrderClick = (order) => {
    console.log('Order clicked:', order);
  };

  return (
    <Orderbook
      buyOrders={buyOrders}
      sellOrders={sellOrders}
      maxOrders={10}
      onOrderClick={handleOrderClick}
    />
  );
};
```

**Implementation Details**:

The Orderbook component displays buy and sell orders for a trading pair, with the highest buy orders and lowest sell orders shown first. It calculates and displays the spread between the highest buy order and the lowest sell order. The component uses the theme context for styling and supports clicking on orders to fill in the trade form.

### TradeForm

**Purpose**: Allows users to create buy or sell orders.

**File**: `src/components/TradeForm.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| baseAsset | string | - | Base asset symbol (e.g., "BTC") |
| quoteAsset | string | - | Quote asset symbol (e.g., "USD") |
| currentPrice | number | - | Current market price |
| onSubmit | (order: { type: 'buy' \| 'sell'; baseAsset: string; quoteAsset: string; amount: number; price: number; total: number; }) => void | - | Callback function when the form is submitted |

**Usage Example**:

```tsx
import TradeForm from '../components/TradeForm';

const MyComponent = () => {
  const handleSubmit = (order) => {
    console.log('Order submitted:', order);
  };

  return (
    <TradeForm
      baseAsset="BTC"
      quoteAsset="USD"
      currentPrice={50000}
      onSubmit={handleSubmit}
    />
  );
};
```

**Implementation Details**:

The TradeForm component allows users to create buy or sell orders. It includes fields for amount and price, and automatically calculates the total. The component integrates with the wallet context to check balances and validate orders. It also includes a "MAX" button to quickly set the maximum amount based on the user's balance.

### PriceChart

**Purpose**: Displays a price chart for a trading pair.

**File**: `src/components/PriceChart.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| baseAsset | string | - | Base asset symbol (e.g., "BTC") |
| quoteAsset | string | - | Quote asset symbol (e.g., "USD") |
| data | { timestamp: number; price: number; }[] | [] | Array of price data points |
| timeframe | '1h' \| '24h' \| '7d' \| '30d' \| '1y' | '24h' | Timeframe for the chart |
| height | number | 300 | Height of the chart in pixels |
| width | string | '100%' | Width of the chart |
| loading | boolean | false | Whether the chart data is loading |
| error | string \| null | null | Error message if loading failed |
| onTimeframeChange | (timeframe: '1h' \| '24h' \| '7d' \| '30d' \| '1y') => void | - | Callback function when the timeframe is changed |

**Usage Example**:

```tsx
import PriceChart from '../components/PriceChart';

const MyComponent = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch price data based on timeframe
        const response = await fetch(`/api/prices?timeframe=${timeframe}`);
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError('Failed to fetch price data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);

  return (
    <PriceChart
      baseAsset="BTC"
      quoteAsset="USD"
      data={data}
      timeframe={timeframe}
      loading={loading}
      error={error}
      onTimeframeChange={setTimeframe}
    />
  );
};
```

**Implementation Details**:

The PriceChart component displays a price chart for a trading pair using Chart.js. It supports different timeframes and displays price change information. The component uses the theme context for styling and includes loading and error states. It also supports hovering over the chart to see detailed price information.

### ThemeToggle

**Purpose**: Toggles between light and dark mode.

**File**: `src/components/ThemeToggle.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS class names |

**Usage Example**:

```tsx
import ThemeToggle from '../components/ThemeToggle';

const MyComponent = () => {
  return (
    <div>
      <h1>My App</h1>
      <ThemeToggle className="ml-4" />
    </div>
  );
};
```

**Implementation Details**:

The ThemeToggle component provides a button to toggle between light and dark mode. It uses the theme context to access the current theme and toggle function. The component displays a sun icon in dark mode and a moon icon in light mode.

### AssetSelector

**Purpose**: Allows users to select an asset from a dropdown list.

**File**: `src/components/AssetSelector.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| selectedAsset | string | - | Currently selected asset |
| onAssetSelect | (asset: Asset) => void | - | Callback function when an asset is selected |
| type | 'base' \| 'quote' | 'base' | Type of asset selector |
| label | string | 'Select Asset' | Label for the selector |
| disabled | boolean | false | Whether the selector is disabled |

**Types**:

```typescript
interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon?: string;
  price?: number;
  change24h?: number;
}
```

**Usage Example**:

```tsx
import AssetSelector from '../components/AssetSelector';

const MyComponent = () => {
  const [baseAsset, setBaseAsset] = useState('BTC');
  const [quoteAsset, setQuoteAsset] = useState('USD');

  const handleBaseAssetSelect = (asset) => {
    setBaseAsset(asset.symbol);
  };

  const handleQuoteAssetSelect = (asset) => {
    setQuoteAsset(asset.symbol);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <AssetSelector
        selectedAsset={baseAsset}
        onAssetSelect={handleBaseAssetSelect}
        type="base"
        label="Base Asset"
      />
      <AssetSelector
        selectedAsset={quoteAsset}
        onAssetSelect={handleQuoteAssetSelect}
        type="quote"
        label="Quote Asset"
      />
    </div>
  );
};
```

**Implementation Details**:

The AssetSelector component provides a dropdown list of assets with search functionality. It displays asset icons, names, and prices, and allows users to select an asset. The component uses the DarkSwap context to access the list of available assets and their details.

### WalletConnector

**Purpose**: Allows users to connect their wallet to the application.

**File**: `src/components/WalletConnector.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onClose | () => void | - | Callback function when the connector is closed |

**Usage Example**:

```tsx
import { useState } from 'react';
import WalletConnector from '../components/WalletConnector';

const MyComponent = () => {
  const [showWalletConnector, setShowWalletConnector] = useState(false);

  return (
    <div>
      <button onClick={() => setShowWalletConnector(true)}>
        Connect Wallet
      </button>
      
      {showWalletConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <WalletConnector onClose={() => setShowWalletConnector(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
```

**Implementation Details**:

The WalletConnector component provides a user interface for connecting different types of wallets. It displays available wallet options and allows users to select and connect a wallet. The component integrates with the wallet context to handle wallet connection and disconnection.

### OrderHistory

**Purpose**: Displays a history of orders and trades.

**File**: `src/components/OrderHistory.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| showTrades | boolean | true | Whether to show trades |
| showOrders | boolean | true | Whether to show orders |
| maxItems | number | 10 | Maximum number of items to display |
| onOrderClick | (orderId: string) => void | - | Callback function when an order is clicked |
| onTradeClick | (tradeId: string) => void | - | Callback function when a trade is clicked |

**Usage Example**:

```tsx
import OrderHistory from '../components/OrderHistory';

const MyComponent = () => {
  const handleOrderClick = (orderId) => {
    console.log('Order clicked:', orderId);
  };

  const handleTradeClick = (tradeId) => {
    console.log('Trade clicked:', tradeId);
  };

  return (
    <OrderHistory
      showTrades={true}
      showOrders={true}
      maxItems={10}
      onOrderClick={handleOrderClick}
      onTradeClick={handleTradeClick}
    />
  );
};
```

**Implementation Details**:

The OrderHistory component displays a history of orders and trades, with tabs to switch between them. It uses the DarkSwap context to access the user's orders and trades. The component displays details such as the trading pair, type, amount, price, and status, and allows users to click on items for more details.

### Notifications

**Purpose**: Displays toast notifications and a notification center.

**File**: `src/components/Notifications.tsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| position | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | 'top-right' | Position of the toast notifications |
| maxVisible | number | 5 | Maximum number of visible toast notifications |

**Usage Example**:

```tsx
import Notifications from '../components/Notifications';

const MyComponent = () => {
  return (
    <div>
      <h1>My App</h1>
      <Notifications position="top-right" maxVisible={5} />
    </div>
  );
};
```

**Implementation Details**:

The Notifications component displays toast notifications and a notification center. It uses the notification context to access the list of notifications and provides methods to mark notifications as read and remove them. The component displays different icons and colors based on the notification type (info, success, warning, error).

## Page Components

### Home

**Purpose**: Landing page with market overview and trending markets.

**File**: `src/pages/Home.tsx`

**Implementation Details**:

The Home page displays a hero section, featured market, market overview, trending markets, features section, and other promotional content. It uses the DarkSwap context to access market data and the theme context for styling.

### Trade

**Purpose**: Main trading interface with orderbook, chart, and trade form.

**File**: `src/pages/Trade.tsx`

**Implementation Details**:

The Trade page displays a trading interface with a price chart, orderbook, and trade form. It uses the DarkSwap context to access market data and order/trade functionality, and the wallet context to check if a wallet is connected. The page allows users to select trading pairs, view market data, and create or take orders.

### Settings

**Purpose**: User settings for network, notifications, and wallet.

**File**: `src/pages/Settings.tsx`

**Implementation Details**:

The Settings page provides tabs for different settings categories: general, network, notifications, and wallet. It allows users to configure various aspects of the application, such as theme, default market, API URL, WebSocket URL, notification preferences, and wallet settings. The page uses localStorage to persist settings.

### About

**Purpose**: Information about the DarkSwap project.

**File**: `src/pages/About.tsx`

**Implementation Details**:

The About page provides information about the DarkSwap project, including an overview, key features, how it works, technology stack, team, documentation, resources, and contact information. It uses the theme context for styling.

### NotFound

**Purpose**: 404 page for non-existent routes.

**File**: `src/pages/NotFound.tsx`

**Implementation Details**:

The NotFound page displays a 404 error message and provides a link to return to the home page. It uses the theme context for styling.

## Layout Components

### Layout

**Purpose**: Provides a consistent layout for all pages.

