// Theme types
export type ThemeType = 'light' | 'dark' | 'system';

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';
export type IconPosition = 'left' | 'right';

// Wallet types
export interface Wallet {
  id: string;
  name: string;
  type: string;
  addresses: Record<string, string>;
  publicKey?: string;
}

export interface Balance {
  asset: string;
  available: number;
  locked: number;
  pending: number;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'trade';
export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  txid?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  asset: string;
  timestamp: number;
  confirmations?: number;
  requiredConfirmations?: number;
  fee?: number;
  from?: string;
  to?: string;
  memo?: string;
  read?: boolean;
}

// API types
export interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

// WebSocket types
export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
}

export interface WebSocketSubscription {
  id: string;
  topic: string;
  callback: (data: any) => void;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

// Market types
export interface Price {
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export type OrderType = 'buy' | 'sell';
export type OrderStatus = 'open' | 'partial' | 'filled' | 'cancelled' | 'expired';

export interface Order {
  id: string;
  pair: string;
  type: OrderType;
  price: number;
  amount: number;
  filled: number;
  status: OrderStatus;
  timestamp: number;
  expires?: number;
  maker: string;
}

// Network types
export interface Peer {
  id: string;
  address: string;
  connected: boolean;
  direction: 'inbound' | 'outbound';
  latency: number;
  lastSeen: number;
  protocols?: string[];
}

export interface NetworkStats {
  connectedPeers: number;
  totalPeers: number;
  averageLatency: number;
  uptime: number;
  messagesSent: number;
  messagesReceived: number;
}