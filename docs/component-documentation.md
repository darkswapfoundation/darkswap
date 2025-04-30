# DarkSwap Component Documentation

This document provides comprehensive documentation for the DarkSwap components, including React components, React hooks, TypeScript types, and WebAssembly bindings.

## React Components

### Core Components

#### `<App />`

The root component of the application.

**Props:**
- None

**Example:**
```jsx
<App />
```

#### `<Layout />`

The main layout component that wraps all pages.

**Props:**
- `children`: React nodes to render inside the layout

**Example:**
```jsx
<Layout>
  <Home />
</Layout>
```

#### `<Header />`

The header component that displays the navigation menu and user information.

**Props:**
- `title`: The title to display in the header
- `showMenu`: Whether to show the navigation menu (default: true)
- `showUser`: Whether to show the user information (default: true)

**Example:**
```jsx
<Header title="DarkSwap" showMenu={true} showUser={true} />
```

#### `<Footer />`

The footer component that displays copyright information and links.

**Props:**
- `showLinks`: Whether to show the links (default: true)

**Example:**
```jsx
<Footer showLinks={true} />
```

#### `<Navigation />`

The navigation component that displays the navigation menu.

**Props:**
- `items`: An array of navigation items
- `activeItem`: The currently active item

**Example:**
```jsx
const items = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'trade', label: 'Trade', path: '/trade' },
  { id: 'orders', label: 'Orders', path: '/orders' },
  { id: 'wallet', label: 'Wallet', path: '/wallet' },
];

<Navigation items={items} activeItem="home" />
```

#### `<Button />`

A customizable button component.

**Props:**
- `variant`: The button variant (primary, secondary, danger, success, warning, info)
- `size`: The button size (small, medium, large)
- `disabled`: Whether the button is disabled
- `onClick`: The function to call when the button is clicked
- `children`: The button content

**Example:**
```jsx
<Button variant="primary" size="medium" onClick={() => console.log('Clicked!')}>
  Click Me
</Button>
```

#### `<Input />`

A customizable input component.

**Props:**
- `type`: The input type (text, number, password, email, etc.)
- `value`: The input value
- `onChange`: The function to call when the input value changes
- `placeholder`: The input placeholder
- `disabled`: Whether the input is disabled
- `error`: The error message to display

**Example:**
```jsx
<Input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter your name"
  error={error}
/>
```

#### `<Select />`

A customizable select component.

**Props:**
- `options`: An array of options
- `value`: The selected value
- `onChange`: The function to call when the selected value changes
- `placeholder`: The select placeholder
- `disabled`: Whether the select is disabled
- `error`: The error message to display

**Example:**
```jsx
const options = [
  { value: 'btc', label: 'Bitcoin' },
  { value: 'eth', label: 'Ethereum' },
];

<Select
  options={options}
  value={value}
  onChange={(value) => setValue(value)}
  placeholder="Select a cryptocurrency"
  error={error}
/>
```

#### `<Card />`

A card component for displaying content in a card-like container.

**Props:**
- `title`: The card title
- `children`: The card content
- `footer`: The card footer
- `className`: Additional CSS classes

**Example:**
```jsx
<Card title="Card Title" footer={<Button>Action</Button>}>
  <p>Card content goes here.</p>
</Card>
```

#### `<Modal />`

A modal component for displaying content in a modal dialog.

**Props:**
- `isOpen`: Whether the modal is open
- `onClose`: The function to call when the modal is closed
- `title`: The modal title
- `children`: The modal content
- `footer`: The modal footer

**Example:**
```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  footer={<Button onClick={() => setIsOpen(false)}>Close</Button>}
>
  <p>Modal content goes here.</p>
</Modal>
```

#### `<Spinner />`

A spinner component for indicating loading state.

**Props:**
- `size`: The spinner size (small, medium, large)
- `color`: The spinner color (primary, secondary, etc.)

**Example:**
```jsx
<Spinner size="medium" color="primary" />
```

#### `<Alert />`

An alert component for displaying messages.

**Props:**
- `variant`: The alert variant (info, success, warning, danger)
- `title`: The alert title
- `children`: The alert content
- `onClose`: The function to call when the alert is closed

**Example:**
```jsx
<Alert variant="success" title="Success" onClose={() => setShowAlert(false)}>
  Operation completed successfully.
</Alert>
```

### Trade Components

#### `<TradeForm />`

A form component for creating trade orders.

**Props:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset
- `onSubmit`: The function to call when the form is submitted

**Example:**
```jsx
<TradeForm
  baseAsset="BTC"
  quoteAsset="ETH"
  onSubmit={(order) => createOrder(order)}
/>
```

#### `<OrderBook />`

A component for displaying the order book.

**Props:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset
- `depth`: The order book depth (default: 10)
- `onOrderSelect`: The function to call when an order is selected

**Example:**
```jsx
<OrderBook
  baseAsset="BTC"
  quoteAsset="ETH"
  depth={10}
  onOrderSelect={(order) => selectOrder(order)}
/>
```

#### `<TradeHistory />`

A component for displaying the trade history.

**Props:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset
- `limit`: The maximum number of trades to display (default: 50)

**Example:**
```jsx
<TradeHistory baseAsset="BTC" quoteAsset="ETH" limit={50} />
```

#### `<PriceChart />`

A component for displaying price charts.

**Props:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset
- `interval`: The chart interval (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)
- `height`: The chart height
- `width`: The chart width

**Example:**
```jsx
<PriceChart
  baseAsset="BTC"
  quoteAsset="ETH"
  interval="1h"
  height={400}
  width={800}
/>
```

#### `<OrderList />`

A component for displaying a list of orders.

**Props:**
- `orders`: An array of orders
- `onCancelOrder`: The function to call when an order is cancelled
- `onSelectOrder`: The function to call when an order is selected

**Example:**
```jsx
<OrderList
  orders={orders}
  onCancelOrder={(orderId) => cancelOrder(orderId)}
  onSelectOrder={(order) => selectOrder(order)}
/>
```

#### `<TradeList />`

A component for displaying a list of trades.

**Props:**
- `trades`: An array of trades
- `onSelectTrade`: The function to call when a trade is selected

**Example:**
```jsx
<TradeList trades={trades} onSelectTrade={(trade) => selectTrade(trade)} />
```

### Wallet Components

#### `<WalletBalance />`

A component for displaying wallet balances.

**Props:**
- `balances`: An object containing asset balances
- `onDeposit`: The function to call when the deposit button is clicked
- `onWithdraw`: The function to call when the withdraw button is clicked

**Example:**
```jsx
<WalletBalance
  balances={{ BTC: '1.0', ETH: '10.0' }}
  onDeposit={(asset) => deposit(asset)}
  onWithdraw={(asset) => withdraw(asset)}
/>
```

#### `<TransactionHistory />`

A component for displaying transaction history.

**Props:**
- `transactions`: An array of transactions
- `onSelectTransaction`: The function to call when a transaction is selected

**Example:**
```jsx
<TransactionHistory
  transactions={transactions}
  onSelectTransaction={(transaction) => selectTransaction(transaction)}
/>
```

#### `<DepositForm />`

A form component for depositing assets.

**Props:**
- `asset`: The asset to deposit
- `address`: The deposit address
- `onClose`: The function to call when the form is closed

**Example:**
```jsx
<DepositForm
  asset="BTC"
  address="bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
  onClose={() => setShowDepositForm(false)}
/>
```

#### `<WithdrawForm />`

A form component for withdrawing assets.

**Props:**
- `asset`: The asset to withdraw
- `balance`: The available balance
- `onSubmit`: The function to call when the form is submitted
- `onClose`: The function to call when the form is closed

**Example:**
```jsx
<WithdrawForm
  asset="BTC"
  balance="1.0"
  onSubmit={(data) => withdraw(data)}
  onClose={() => setShowWithdrawForm(false)}
/>
```

### P2P Components

#### `<PeerStatus />`

A component for displaying P2P network status.

**Props:**
- `peers`: The number of connected peers
- `relays`: The number of connected relays
- `status`: The connection status (connected, connecting, disconnected)

**Example:**
```jsx
<PeerStatus peers={10} relays={5} status="connected" />
```

#### `<PeerList />`

A component for displaying a list of peers.

**Props:**
- `peers`: An array of peers
- `onSelectPeer`: The function to call when a peer is selected

**Example:**
```jsx
<PeerList peers={peers} onSelectPeer={(peer) => selectPeer(peer)} />
```

#### `<RelayList />`

A component for displaying a list of relay servers.

**Props:**
- `relays`: An array of relay servers
- `onSelectRelay`: The function to call when a relay server is selected

**Example:**
```jsx
<RelayList relays={relays} onSelectRelay={(relay) => selectRelay(relay)} />
```

### WebSocket Components

#### `<WebSocketStatus />`

A component for displaying WebSocket connection status.

**Props:**
- `status`: The connection status (connected, connecting, disconnected)
- `reconnect`: The function to call when the reconnect button is clicked

**Example:**
```jsx
<WebSocketStatus
  status="connected"
  reconnect={() => reconnectWebSocket()}
/>
```

#### `<WebSocketManager />`

A component for managing WebSocket connections.

**Props:**
- `url`: The WebSocket URL
- `options`: WebSocket options
- `children`: React nodes to render inside the WebSocket context

**Example:**
```jsx
<WebSocketManager url="wss://api.darkswap.io/ws" options={{ reconnect: true }}>
  <App />
</WebSocketManager>
```

### Notification Components

#### `<NotificationList />`

A component for displaying a list of notifications.

**Props:**
- `notifications`: An array of notifications
- `onDismiss`: The function to call when a notification is dismissed

**Example:**
```jsx
<NotificationList
  notifications={notifications}
  onDismiss={(id) => dismissNotification(id)}
/>
```

#### `<Notification />`

A component for displaying a single notification.

**Props:**
- `id`: The notification ID
- `type`: The notification type (info, success, warning, error)
- `title`: The notification title
- `message`: The notification message
- `timestamp`: The notification timestamp
- `onDismiss`: The function to call when the notification is dismissed

**Example:**
```jsx
<Notification
  id="notification-1"
  type="success"
  title="Success"
  message="Operation completed successfully."
  timestamp={new Date()}
  onDismiss={() => dismissNotification('notification-1')}
/>
```

## React Hooks

### Core Hooks

#### `useAuth()`

A hook for managing authentication state.

**Returns:**
- `user`: The authenticated user
- `isAuthenticated`: Whether the user is authenticated
- `login`: A function to log in
- `logout`: A function to log out
- `register`: A function to register a new user
- `loading`: Whether authentication is loading
- `error`: Authentication error

**Example:**
```jsx
const { user, isAuthenticated, login, logout, register, loading, error } = useAuth();

// Log in
login('user@example.com', 'password');

// Log out
logout();

// Register
register('user@example.com', 'password', 'username');
```

#### `useTheme()`

A hook for managing theme state.

**Returns:**
- `theme`: The current theme
- `setTheme`: A function to set the theme
- `toggleTheme`: A function to toggle between light and dark themes

**Example:**
```jsx
const { theme, setTheme, toggleTheme } = useTheme();

// Set theme
setTheme('dark');

// Toggle theme
toggleTheme();
```

#### `useLocalStorage(key, initialValue)`

A hook for managing state in local storage.

**Parameters:**
- `key`: The local storage key
- `initialValue`: The initial value

**Returns:**
- `value`: The stored value
- `setValue`: A function to set the value

**Example:**
```jsx
const [value, setValue] = useLocalStorage('key', 'initial value');

// Set value
setValue('new value');
```

#### `useDebounce(value, delay)`

A hook for debouncing a value.

**Parameters:**
- `value`: The value to debounce
- `delay`: The debounce delay in milliseconds

**Returns:**
- The debounced value

**Example:**
```jsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

// Use debouncedSearch for API calls
useEffect(() => {
  if (debouncedSearch) {
    searchApi(debouncedSearch);
  }
}, [debouncedSearch]);
```

### API Hooks

#### `useApi()`

A hook for accessing the API client.

**Returns:**
- `api`: The API client
- `loading`: Whether an API request is loading
- `error`: API error

**Example:**
```jsx
const { api, loading, error } = useApi();

// Make API requests
api.getOrders().then((orders) => {
  console.log(orders);
});
```

#### `useQuery(endpoint, params, options)`

A hook for making API queries.

**Parameters:**
- `endpoint`: The API endpoint
- `params`: The query parameters
- `options`: Query options

**Returns:**
- `data`: The query data
- `loading`: Whether the query is loading
- `error`: Query error
- `refetch`: A function to refetch the data

**Example:**
```jsx
const { data, loading, error, refetch } = useQuery('/api/orders', { status: 'open' });

// Refetch data
refetch();
```

#### `useMutation(endpoint, options)`

A hook for making API mutations.

**Parameters:**
- `endpoint`: The API endpoint
- `options`: Mutation options

**Returns:**
- `mutate`: A function to perform the mutation
- `data`: The mutation data
- `loading`: Whether the mutation is loading
- `error`: Mutation error

**Example:**
```jsx
const { mutate, data, loading, error } = useMutation('/api/orders');

// Perform mutation
mutate({ baseAsset: 'BTC', quoteAsset: 'ETH', price: '10.0', amount: '1.0', type: 'buy' });
```

### WebSocket Hooks

#### `useWebSocket()`

A hook for accessing the WebSocket client.

**Returns:**
- `socket`: The WebSocket client
- `connected`: Whether the WebSocket is connected
- `connecting`: Whether the WebSocket is connecting
- `connect`: A function to connect to the WebSocket
- `disconnect`: A function to disconnect from the WebSocket
- `subscribe`: A function to subscribe to a channel
- `unsubscribe`: A function to unsubscribe from a channel
- `send`: A function to send a message

**Example:**
```jsx
const { socket, connected, connecting, connect, disconnect, subscribe, unsubscribe, send } = useWebSocket();

// Connect
connect();

// Subscribe to a channel
subscribe('ticker', { baseAsset: 'BTC', quoteAsset: 'ETH' });

// Send a message
send('ping', {});

// Unsubscribe from a channel
unsubscribe('ticker', { baseAsset: 'BTC', quoteAsset: 'ETH' });

// Disconnect
disconnect();
```

#### `useSubscription(channel, params, callback)`

A hook for subscribing to a WebSocket channel.

**Parameters:**
- `channel`: The channel name
- `params`: The subscription parameters
- `callback`: The callback function to call when a message is received

**Returns:**
- `subscribed`: Whether the subscription is active
- `subscribe`: A function to subscribe to the channel
- `unsubscribe`: A function to unsubscribe from the channel

**Example:**
```jsx
const { subscribed, subscribe, unsubscribe } = useSubscription(
  'ticker',
  { baseAsset: 'BTC', quoteAsset: 'ETH' },
  (data) => {
    console.log(data);
  }
);

// Subscribe
subscribe();

// Unsubscribe
unsubscribe();
```

### Trade Hooks

#### `useOrderBook(baseAsset, quoteAsset)`

A hook for accessing the order book.

**Parameters:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset

**Returns:**
- `bids`: The bid orders
- `asks`: The ask orders
- `loading`: Whether the order book is loading
- `error`: Order book error
- `subscribe`: A function to subscribe to order book updates
- `unsubscribe`: A function to unsubscribe from order book updates

**Example:**
```jsx
const { bids, asks, loading, error, subscribe, unsubscribe } = useOrderBook('BTC', 'ETH');

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

#### `useTradeHistory(baseAsset, quoteAsset)`

A hook for accessing the trade history.

**Parameters:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset

**Returns:**
- `trades`: The trades
- `loading`: Whether the trade history is loading
- `error`: Trade history error
- `subscribe`: A function to subscribe to trade updates
- `unsubscribe`: A function to unsubscribe from trade updates

**Example:**
```jsx
const { trades, loading, error, subscribe, unsubscribe } = useTradeHistory('BTC', 'ETH');

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

#### `usePriceChart(baseAsset, quoteAsset, interval)`

A hook for accessing price chart data.

**Parameters:**
- `baseAsset`: The base asset
- `quoteAsset`: The quote asset
- `interval`: The chart interval (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)

**Returns:**
- `data`: The chart data
- `loading`: Whether the chart data is loading
- `error`: Chart data error
- `subscribe`: A function to subscribe to chart updates
- `unsubscribe`: A function to unsubscribe from chart updates

**Example:**
```jsx
const { data, loading, error, subscribe, unsubscribe } = usePriceChart('BTC', 'ETH', '1h');

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

#### `useOrders()`

A hook for accessing user orders.

**Returns:**
- `orders`: The user orders
- `loading`: Whether the orders are loading
- `error`: Orders error
- `createOrder`: A function to create an order
- `cancelOrder`: A function to cancel an order
- `subscribe`: A function to subscribe to order updates
- `unsubscribe`: A function to unsubscribe from order updates

**Example:**
```jsx
const { orders, loading, error, createOrder, cancelOrder, subscribe, unsubscribe } = useOrders();

// Create an order
createOrder({
  baseAsset: 'BTC',
  quoteAsset: 'ETH',
  price: '10.0',
  amount: '1.0',
  type: 'buy',
});

// Cancel an order
cancelOrder('order123456');

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

#### `useTrades()`

A hook for accessing user trades.

**Returns:**
- `trades`: The user trades
- `loading`: Whether the trades are loading
- `error`: Trades error
- `subscribe`: A function to subscribe to trade updates
- `unsubscribe`: A function to unsubscribe from trade updates

**Example:**
```jsx
const { trades, loading, error, subscribe, unsubscribe } = useTrades();

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

### Wallet Hooks

#### `useWallet()`

A hook for accessing the wallet.

**Returns:**
- `balances`: The wallet balances
- `loading`: Whether the wallet is loading
- `error`: Wallet error
- `getAddress`: A function to get a deposit address
- `withdraw`: A function to withdraw funds
- `subscribe`: A function to subscribe to wallet updates
- `unsubscribe`: A function to unsubscribe from wallet updates

**Example:**
```jsx
const { balances, loading, error, getAddress, withdraw, subscribe, unsubscribe } = useWallet();

// Get a deposit address
getAddress('BTC').then((address) => {
  console.log(address);
});

// Withdraw funds
withdraw({
  asset: 'BTC',
  amount: '0.1',
  address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
});

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

#### `useTransactions()`

A hook for accessing transaction history.

**Returns:**
- `transactions`: The transactions
- `loading`: Whether the transactions are loading
- `error`: Transactions error
- `subscribe`: A function to subscribe to transaction updates
- `unsubscribe`: A function to unsubscribe from transaction updates

**Example:**
```jsx
const { transactions, loading, error, subscribe, unsubscribe } = useTransactions();

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();
```

### P2P Hooks

#### `useP2P()`

A hook for accessing the P2P network.

**Returns:**
- `peers`: The connected peers
- `relays`: The connected relays
- `status`: The connection status
- `loading`: Whether the P2P network is loading
- `error`: P2P network error
- `connect`: A function to connect to the P2P network
- `disconnect`: A function to disconnect from the P2P network
- `subscribe`: A function to subscribe to P2P updates
- `unsubscribe`: A function to unsubscribe from P2P updates

**Example:**
```jsx
const { peers, relays, status, loading, error, connect, disconnect, subscribe, unsubscribe } = useP2P();

// Connect to the P2P network
connect();

// Subscribe to updates
subscribe();

// Unsubscribe from updates
unsubscribe();

// Disconnect from the P2P network
disconnect();
```

### Notification Hooks

#### `useNotifications()`

A hook for accessing notifications.

**Returns:**
- `notifications`: The notifications
- `addNotification`: A function to add a notification
- `dismissNotification`: A function to dismiss a notification
- `clearNotifications`: A function to clear all notifications

**Example:**
```jsx
const { notifications, addNotification, dismissNotification, clearNotifications } = useNotifications();

// Add a notification
addNotification({
  type: 'success',
  title: 'Success',
  message: 'Operation completed successfully.',
});

// Dismiss a notification
dismissNotification('notification-1');

// Clear all notifications
clearNotifications();
```

## TypeScript Types

### Core Types

#### `User`

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
```

#### `AuthState`

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

#### `ThemeState`

```typescript
interface ThemeState {
  theme: 'light' | 'dark';
}
```

### API Types

#### `ApiClient`

```typescript
interface ApiClient {
  get: <T>(endpoint: string, params?: Record<string, any>) => Promise<T>;
  post: <T>(endpoint: string, data?: Record<string, any>) => Promise<T>;
  put: <T>(endpoint: string, data?: Record<string, any>) => Promise<T>;
  delete: <T>(endpoint: string) => Promise<T>;
}
```

#### `ApiOptions`

```typescript
interface ApiOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}
```

#### `ApiError`

```typescript
interface ApiError {
  error: string;
  code: string;
  details?: Record<string, any>;
}
```

### WebSocket Types

#### `WebSocketClient`

```typescript
interface WebSocketClient {
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, params?: Record<string, any>) => void;
  unsubscribe: (channel: string, params?: Record<string, any>) => void;
  send: (event: string, data: Record<string, any>) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  isConnected: () => boolean;
  isAuthenticated: () => boolean;
}
```

#### `WebSocketOptions`

```typescript
interface WebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}
```

#### `WebSocketEvent`

```typescript
interface WebSocketEvent {
  event: string;
  data: Record<string, any>;
}
```

### Trade Types

#### `Order`

```typescript
interface Order {
  id: string;
  userId: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  filled: string;
  type: 'buy' | 'sell';
  status: 'open' | 'filled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

#### `Trade`

```typescript
interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  buyUserId: string;
  sellUserId: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

#### `OrderBook`

```typescript
interface OrderBook {
  bids: Array<{
    price: string;
    amount: string;
    total: string;
  }>;
  asks: Array<{
    price: string;
    amount: string;
    total: string;
  }>;
}
```

#### `PriceChart`

```typescript
interface PriceChart {
  data: Array<{
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
}
```

### Wallet Types

#### `Balance`

```typescript
interface Balance {
  [asset: string]: string;
}
```

#### `Transaction`

```typescript
interface Transaction {
  id: string;
  asset: string;
  amount: string;
  address: string;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}
```

#### `DepositAddress`

```typescript
interface DepositAddress {
  asset: string;
  address: string;
  createdAt: string;
}
```

### P2P Types

#### `Peer`

```typescript
interface Peer {
  id: string;
  ip: string;
  port: number;
  lastSeen: string;
  connected: boolean;
  version: string;
  userAgent: string;
}
```

#### `Relay`

```typescript
interface Relay {
  id: string;
  ip: string;
  port: number;
  lastSeen: string;
  connected: boolean;
  version: string;
  userAgent: string;
}
```

#### `P2PStatus`

```typescript
interface P2PStatus {
  peers: number;
  relays: number;
  orders: number;
  trades: number;
  uptime: number;
}
```

### Notification Types

#### `Notification`

```typescript
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
```

## WebAssembly Bindings

### Core Bindings

#### `initWasm()`

Initializes the WebAssembly module.

**Parameters:**
- None

**Returns:**
- A promise that resolves when the WebAssembly module is initialized

**Example:**
```typescript
import { initWasm } from 'darkswap-wasm';

initWasm().then(() => {
  console.log('WebAssembly module initialized');
});
```

#### `getVersion()`

Gets the version of the WebAssembly module.

**Parameters:**
- None

**Returns:**
- The version string

**Example:**
```typescript
import { getVersion } from 'darkswap-wasm';

const version = getVersion();
console.log(`WebAssembly module version: ${version}`);
```

### Wallet Bindings

#### `createWallet(options)`

Creates a new wallet.

**Parameters:**
- `options`: Wallet options
  - `network`: The network (mainnet, testnet)
  - `mnemonic`: The mnemonic (optional)

**Returns:**
- The wallet ID

**Example:**
```typescript
import { createWallet } from 'darkswap-wasm';

const walletId = createWallet({
  network: 'testnet',
  mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
});
```

#### `getWalletBalance(walletId)`

Gets the wallet balance.

**Parameters:**
- `walletId`: The wallet ID

**Returns:**
- The wallet balance

**Example:**
```typescript
import { getWalletBalance } from 'darkswap-wasm';

const balance = getWalletBalance(walletId);
