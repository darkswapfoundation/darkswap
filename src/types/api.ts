/**
 * API types for DarkSwap
 * 
 * This file contains type definitions for the DarkSwap API.
 */

/**
 * API error response
 */
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, any>;
}

/**
 * API authentication request
 */
export interface AuthRequest {
  email: string;
  password: string;
}

/**
 * API authentication response
 */
export interface AuthResponse {
  userId: string;
  username: string;
  email: string;
  token: string;
}

/**
 * API token verification response
 */
export interface VerifyResponse {
  valid: boolean;
  userId: string;
  username: string;
  email: string;
}

/**
 * API token refresh request
 */
export interface RefreshRequest {
  token: string;
}

/**
 * API token refresh response
 */
export interface RefreshResponse {
  token: string;
  expiresAt: string;
}

/**
 * API wallet balance response
 */
export interface BalanceResponse {
  [asset: string]: string;
}

/**
 * API transaction
 */
export interface Transaction {
  id: string;
  asset: string;
  amount: string;
  address: string;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

/**
 * API transaction history response
 */
export type TransactionHistoryResponse = Transaction[];

/**
 * API deposit address request
 */
export interface DepositAddressRequest {
  asset: string;
}

/**
 * API deposit address response
 */
export interface DepositAddressResponse {
  address: string;
}

/**
 * API withdraw request
 */
export interface WithdrawRequest {
  asset: string;
  amount: string;
  address: string;
}

/**
 * API withdraw response
 */
export interface WithdrawResponse {
  transactionId: string;
}

/**
 * API order
 */
export interface Order {
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

/**
 * API order list response
 */
export type OrderListResponse = Order[];

/**
 * API order request
 */
export interface OrderRequest {
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  type: 'buy' | 'sell';
}

/**
 * API order update request
 */
export interface OrderUpdateRequest {
  price?: string;
  amount?: string;
}

/**
 * API orderbook entry
 */
export interface OrderbookEntry {
  price: string;
  amount: string;
  total: string;
}

/**
 * API orderbook response
 */
export interface OrderbookResponse {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
}

/**
 * API trade
 */
export interface Trade {
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

/**
 * API trade list response
 */
export type TradeListResponse = Trade[];

/**
 * API trade request
 */
export interface TradeRequest {
  buyOrderId: string;
  sellOrderId: string;
}

/**
 * API trade update request
 */
export interface TradeUpdateRequest {
  status: 'completed' | 'cancelled';
}

/**
 * API market trade
 */
export interface MarketTrade {
  id: string;
  price: string;
  amount: string;
  type: 'buy' | 'sell';
  timestamp: string;
}

/**
 * API market trade list response
 */
export type MarketTradeListResponse = MarketTrade[];

/**
 * API ticker
 */
export interface Ticker {
  pair: string;
  last: string;
  bid: string;
  ask: string;
  volume: string;
  change24h: string;
  timestamp: string;
}

/**
 * API ticker list response
 */
export type TickerListResponse = Ticker[];

/**
 * API price history candle
 */
export interface PriceHistoryCandle {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

/**
 * API price history response
 */
export type PriceHistoryResponse = PriceHistoryCandle[];

/**
 * API asset
 */
export interface Asset {
  symbol: string;
  name: string;
  type: 'cryptocurrency' | 'rune' | 'alkane';
  decimals: number;
  minAmount: string;
  maxAmount: string;
  minPrice: string;
  maxPrice: string;
  icon: string;
}

/**
 * API asset list response
 */
export type AssetListResponse = Asset[];

/**
 * API asset price response
 */
export interface AssetPriceResponse {
  symbol: string;
  price: string;
  currency: string;
  timestamp: string;
}

/**
 * API trading pair
 */
export interface TradingPair {
  baseAsset: string;
  quoteAsset: string;
  minAmount: string;
  maxAmount: string;
  minPrice: string;
  maxPrice: string;
  priceDecimals: number;
  amountDecimals: number;
}

/**
 * API trading pair list response
 */
export type TradingPairListResponse = TradingPair[];

/**
 * API peer
 */
export interface Peer {
  id: string;
  ip: string;
  port: number;
  lastSeen: string;
  connected: boolean;
  version: string;
  userAgent: string;
}

/**
 * API peer list response
 */
export type PeerListResponse = Peer[];

/**
 * API relay
 */
export interface Relay {
  id: string;
  ip: string;
  port: number;
  lastSeen: string;
  connected: boolean;
  version: string;
  userAgent: string;
}

/**
 * API relay list response
 */
export type RelayListResponse = Relay[];

/**
 * API P2P status response
 */
export interface P2PStatusResponse {
  peers: number;
  relays: number;
  orders: number;
  trades: number;
  uptime: number;
}

/**
 * API PSBT request
 */
export interface PsbtRequest {
  tradeId: string;
}

/**
 * API PSBT response
 */
export interface PsbtResponse {
  psbt: string;
}

/**
 * API PSBT sign request
 */
export interface PsbtSignRequest {
  psbt: string;
}

/**
 * API PSBT sign response
 */
export interface PsbtSignResponse {
  psbt: string;
}

/**
 * API trade execute request
 */
export interface TradeExecuteRequest {
  psbt: string;
}

/**
 * API trade execute response
 */
export interface TradeExecuteResponse {
  id: string;
  status: 'completed';
  txid: string;
}