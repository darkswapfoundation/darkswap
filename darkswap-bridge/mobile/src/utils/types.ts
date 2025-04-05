/**
 * Type definitions for DarkSwap Mobile
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
  biometrics: boolean;
  autoLock: number; // Time in minutes
  currency: string;
  language: string;
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

// Mobile specific types

// Navigation params
export type RootStackParamList = {
  Home: undefined;
  Wallet: undefined;
  Trade: { pair?: string };
  Orders: undefined;
  Settings: undefined;
  AssetDetails: { asset: string };
  TransactionDetails: { id: string };
  Scan: undefined;
  Send: { asset?: string; amount?: number; address?: string };
  Receive: { asset?: string };
  Network: undefined;
  About: undefined;
  NotFound: undefined;
};

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';

// Button sizes
export type ButtonSize = 'small' | 'medium' | 'large';

// Icon positions
export type IconPosition = 'left' | 'right';

// Tab navigation item
export interface TabNavigationItem {
  name: string;
  icon: string;
  component: React.ComponentType<any>;
  initialParams?: object;
}

// Bottom sheet props
export interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  height?: number | string;
  children: React.ReactNode;
}

// Modal props
export interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Toast props
export interface ToastProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onDismiss?: () => void;
}

// List item props
export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onPress?: () => void;
  disabled?: boolean;
}

// Input props
export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  disabled?: boolean;
}