/**
 * Type definitions for DarkSwap
 */

// Asset types
export type AssetType = 'BTC' | 'RUNE' | 'ALKANE';

// Order types
export type OrderType = 'buy' | 'sell';

// Order status
export type OrderStatus = 'open' | 'partial' | 'filled' | 'cancelled' | 'expired';

// Transaction status
export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

// Trade status
export type TradeStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';

// Peer connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket connection status
export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

// Notification type
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Theme type
export type ThemeType = 'light' | 'dark' | 'system';

// Chart timeframe
export type ChartTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

// Chart type
export type ChartType = 'candlestick' | 'line' | 'area';

// API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// Asset
export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  decimals: number;
  icon?: string;
}

// Balance
export interface Balance {
  asset: string;
  total: number;
  available: number;
  locked: number;
}

// Price
export interface Price {
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

// Order
export interface Order {
  id: string;
  type: OrderType;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  amount: number;
  filled: number;
  remaining: number;
  status: OrderStatus;
  timestamp: number;
  expiresAt?: number;
  maker: string;
  taker?: string;
}

// Trade
export interface Trade {
  id: string;
  orderId: string;
  pair: string;
  type: OrderType;
  price: number;
  amount: number;
  total: number;
  timestamp: number;
  maker: string;
  taker: string;
  status: TradeStatus;
  txid?: string;
}

// Transaction
export interface Transaction {
  id: string;
  txid: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  asset: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  confirmations: number;
  requiredConfirmations: number;
  timestamp: number;
  blockHeight?: number;
  address?: string;
  memo?: string;
}

// Wallet
export interface Wallet {
  id: string;
  name: string;
  type: 'built-in' | 'external';
  connected: boolean;
  balances: Record<string, number>;
  addresses: Record<string, string>;
}

// Peer
export interface Peer {
  id: string;
  address: string;
  connected: boolean;
  lastSeen: number;
  protocols: string[];
  latency: number;
  direction: 'inbound' | 'outbound';
}

// Network stats
export interface NetworkStats {
  totalPeers: number;
  connectedPeers: number;
  averageLatency: number;
  messagesSent: number;
  messagesReceived: number;
  uptime: number;
}

// Notification
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

// User settings
export interface UserSettings {
  theme: ThemeType;
  notifications: {
    trades: boolean;
    orders: boolean;
    transactions: boolean;
    system: boolean;
  };
  chart: {
    defaultTimeframe: ChartTimeframe;
    defaultType: ChartType;
    indicators: string[];
  };
  orderbook: {
    grouping: number;
    depth: number;
  };
  advanced: {
    autoLogout: number;
    confirmations: {
      trades: boolean;
      withdrawals: boolean;
    };
  };
}

// WebSocket message
export interface WebSocketMessage {
  type: string;
  data?: any;
  id?: string;
  timestamp?: number;
}

// WebSocket subscription
export interface WebSocketSubscription {
  topic: string;
  id: string;
  callback: (data: any) => void;
}

// Candlestick data
export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Order book entry
export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  count: number;
}

// Order book
export interface OrderBook {
  pair: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

// API client options
export interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// WebSocket client options
export interface WebSocketClientOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  protocols?: string[];
}

// Chart options
export interface ChartOptions {
  timeframe: ChartTimeframe;
  type: ChartType;
  indicators: string[];
  height?: number;
  width?: number;
  theme?: ThemeType;
}

// Trade form values
export interface TradeFormValues {
  type: OrderType;
  pair: string;
  price: number | string;
  amount: number | string;
  total: number | string;
  orderType: 'limit' | 'market';
  expiry?: number;
}

// Error with code
export interface ErrorWithCode extends Error {
  code?: number;
  data?: any;
}

// API error response
export interface ApiErrorResponse {
  error: string;
  code: number;
  data?: any;
}

// WebSocket error
export interface WebSocketError {
  type: 'error';
  message: string;
  code: number;
  data?: any;
}

// Component with loading state
export interface WithLoading {
  loading: boolean;
}

// Component with error state
export interface WithError {
  error: string | null;
}

// Component with data
export interface WithData<T> {
  data: T | null;
}

// Component with pagination
export interface WithPagination {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

// Component with sorting
export interface WithSorting {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string) => void;
}

// Component with filtering
export interface WithFiltering<T> {
  filters: T;
  onFilterChange: (filters: Partial<T>) => void;
}

// Component with selection
export interface WithSelection<T> {
  selected: T | null;
  onSelect: (item: T | null) => void;
}

// Component with theme
export interface WithTheme {
  theme: ThemeType;
  isDark: boolean;
}

// Component with notifications
export interface WithNotifications {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

// Component with wallet
export interface WithWallet {
  wallet: Wallet | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

// Component with API
export interface WithApi {
  api: any;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Component with WebSocket
export interface WithWebSocket {
  connected: boolean;
  connecting: boolean;
  subscribe: (topic: string, callback: (data: any) => void) => string;
  unsubscribe: (id: string) => void;
  send: (message: WebSocketMessage) => void;
  reconnect: () => void;
}