// Types for DarkSwap web application

export enum OrderSide {
  Buy = 'buy',
  Sell = 'sell',
}

export enum OrderType {
  Limit = 'limit',
  Market = 'market',
}

export enum OrderStatus {
  Open = 'open',
  Filled = 'filled',
  PartiallyFilled = 'partially_filled',
  Canceled = 'canceled',
  Expired = 'expired',
}

export interface Order {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  side: OrderSide;
  type: OrderType;
  price: string;
  amount: string;
  filled: string;
  status: OrderStatus;
  timestamp: number;
  maker: string;
}

export interface Balance {
  symbol: string;
  name: string;
  total: string;
  available: string;
  locked: string;
  usdValue: string;
}

export interface PriceLevel {
  price: string;
  amount: string;
  total: string;
}

export interface Trade {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  side: OrderSide;
  price: string;
  amount: string;
  timestamp: number;
  maker: string;
  taker: string;
}

export interface Candlestick {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export interface Market {
  baseAsset: string;
  quoteAsset: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  high: string;
  low: string;
  volume: string;
  quoteVolume: string;
}

export interface CreateOrderParams {
  side: OrderSide;
  type: OrderType;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  maker: string;
}

export interface TradeParams {
  baseAsset?: string;
  quoteAsset?: string;
}

export interface PeerInfo {
  id: string;
  connected: boolean;
  address?: string;
  latency?: number;
  lastSeen?: number;
}

export interface NetworkStats {
  connectedPeers: number;
  totalPeers: number;
  uptime: number;
  bytesReceived: number;
  bytesSent: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserSettings {
  apiUrl: string;
  wsUrl: string;
  useWebSocket: boolean;
  theme: 'light' | 'dark';
  currency: string;
  language: string;
  notifications: {
    trades: boolean;
    orders: boolean;
    system: boolean;
  };
}