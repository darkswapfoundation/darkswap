/**
 * Type definitions for the DarkSwap TypeScript Library
 */

/**
 * Bitcoin network type
 */
export enum BitcoinNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  REGTEST = 'regtest',
}

/**
 * Asset type
 */
export enum AssetType {
  BTC = 'btc',
  RUNE = 'rune',
  ALKANE = 'alkane',
}

/**
 * Order side
 */
export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Order status
 */
export enum OrderStatus {
  OPEN = 'open',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Trade status
 */
export enum TradeStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Wallet type
 */
export enum WalletType {
  WASM = 'wasm',
  EXTERNAL = 'external',
}

/**
 * Bitcoin balance
 */
export interface BitcoinBalance {
  /** Bitcoin balance in BTC */
  btc: string;
  /** Bitcoin balance in satoshis */
  sats: string;
}

/**
 * Rune balance
 */
export interface RuneBalance {
  /** Rune ID */
  id: string;
  /** Rune ticker */
  ticker: string;
  /** Rune amount */
  amount: string;
  /** Rune decimals */
  decimals: number;
}

/**
 * Alkane balance
 */
export interface AlkaneBalance {
  /** Alkane ID */
  id: string;
  /** Alkane ticker */
  ticker: string;
  /** Alkane amount */
  amount: string;
  /** Alkane decimals */
  decimals: number;
}

/**
 * Wallet balance
 */
export interface WalletBalance {
  /** Bitcoin balance */
  btc: BitcoinBalance;
  /** Rune balances */
  runes: RuneBalance[];
  /** Alkane balances */
  alkanes: AlkaneBalance[];
}

/**
 * Transaction input
 */
export interface TxInput {
  /** Transaction ID */
  txid: string;
  /** Output index */
  vout: number;
  /** Value in satoshis */
  value: number;
  /** Address (optional) */
  address?: string;
  /** Script public key (optional) */
  scriptPubKey?: string;
}

/**
 * Transaction output
 */
export interface TxOutput {
  /** Address */
  address: string;
  /** Value in satoshis */
  value: number;
  /** Script (optional) */
  script?: string;
}

/**
 * Order
 */
export interface Order {
  /** Order ID */
  id: string;
  /** Base asset */
  baseAsset: string;
  /** Quote asset */
  quoteAsset: string;
  /** Order side */
  side: OrderSide;
  /** Amount */
  amount: string;
  /** Price */
  price: string;
  /** Timestamp */
  timestamp: number;
  /** Expiry */
  expiry: number;
  /** Status */
  status: OrderStatus;
  /** Maker */
  maker: string;
}

/**
 * Trade execution
 */
export interface TradeExecution {
  /** Trade ID */
  id: string;
  /** Maker order */
  makerOrder: Order;
  /** Taker order */
  takerOrder: Order;
  /** Status */
  status: TradeStatus;
  /** Timestamp */
  timestamp: number;
  /** Completed at (optional) */
  completedAt?: number;
}

/**
 * Client options
 */
export interface ClientOptions {
  /** API URL */
  apiUrl?: string;
  /** WebSocket URL */
  wsUrl?: string;
  /** Bitcoin network */
  network?: BitcoinNetwork;
  /** Timeout in milliseconds */
  timeout?: number;
  /** API key (optional) */
  apiKey?: string;
  /** API secret (optional) */
  apiSecret?: string;
}

/**
 * Wallet options
 */
export interface WalletOptions {
  /** Wallet type */
  type: WalletType;
  /** Bitcoin network */
  network?: BitcoinNetwork;
  /** Auto connect */
  autoConnect?: boolean;
}

/**
 * P2P options
 */
export interface P2POptions {
  /** Signaling servers */
  signalingServers?: string[];
  /** Bootstrap peers */
  bootstrapPeers?: string[];
  /** Enable DHT */
  enableDht?: boolean;
  /** Enable local discovery */
  enableLocalDiscovery?: boolean;
  /** Max peers */
  maxPeers?: number;
  /** Auto start */
  autoStart?: boolean;
}

/**
 * Orderbook options
 */
export interface OrderbookOptions {
  /** Base asset */
  baseAsset?: string;
  /** Quote asset */
  quoteAsset?: string;
  /** Auto sync */
  autoSync?: boolean;
}

/**
 * Trade options
 */
export interface TradeOptions {
  /** Auto finalize */
  autoFinalize?: boolean;
  /** Auto broadcast */
  autoBroadcast?: boolean;
}

/**
 * DarkSwap options
 */
export interface DarkSwapOptions {
  /** Client options */
  client?: ClientOptions;
  /** Wallet options */
  wallet?: WalletOptions;
  /** P2P options */
  p2p?: P2POptions;
  /** Orderbook options */
  orderbook?: OrderbookOptions;
  /** Trade options */
  trade?: TradeOptions;
}

/**
 * Event types
 */
export enum EventType {
  // Wallet events
  WALLET_CONNECTED = 'wallet:connected',
  WALLET_DISCONNECTED = 'wallet:disconnected',
  WALLET_ERROR = 'wallet:error',
  WALLET_BALANCE_CHANGED = 'wallet:balance:changed',
  
  // P2P events
  P2P_CONNECTED = 'p2p:connected',
  P2P_DISCONNECTED = 'p2p:disconnected',
  P2P_ERROR = 'p2p:error',
  P2P_PEER_CONNECTED = 'p2p:peer:connected',
  P2P_PEER_DISCONNECTED = 'p2p:peer:disconnected',
  
  // Orderbook events
  ORDERBOOK_SYNCED = 'orderbook:synced',
  ORDERBOOK_ORDER_ADDED = 'orderbook:order:added',
  ORDERBOOK_ORDER_REMOVED = 'orderbook:order:removed',
  ORDERBOOK_ORDER_UPDATED = 'orderbook:order:updated',
  
  // Trade events
  TRADE_CREATED = 'trade:created',
  TRADE_EXECUTED = 'trade:executed',
  TRADE_FAILED = 'trade:failed',
}

/**
 * Event data
 */
export interface EventData {
  [key: string]: any;
}

/**
 * Event handler
 */
export type EventHandler = (data: EventData) => void;

/**
 * API response
 */
export interface ApiResponse<T> {
  /** Success flag */
  success: boolean;
  /** Data */
  data?: T;
  /** Error */
  error?: string;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: string;
  /** Message payload */
  payload: any;
}

/**
 * Peer
 */
export interface Peer {
  /** Peer ID */
  id: string;
  /** Connection ID */
  connectionId: string;
  /** Connection status */
  status: ConnectionStatus;
  /** Connected at */
  connectedAt: number;
}

/**
 * Market data
 */
export interface MarketData {
  /** Base asset */
  baseAsset: string;
  /** Quote asset */
  quoteAsset: string;
  /** Last price */
  lastPrice: string;
  /** 24h high */
  high24h: string;
  /** 24h low */
  low24h: string;
  /** 24h volume (base) */
  volume24hBase: string;
  /** 24h volume (quote) */
  volume24hQuote: string;
  /** Price change 24h */
  priceChange24h: string;
  /** Price change percentage 24h */
  priceChangePercentage24h: string;
}

/**
 * Rune info
 */
export interface RuneInfo {
  /** Rune ID */
  id: string;
  /** Rune ticker */
  ticker: string;
  /** Rune decimals */
  decimals: number;
  /** Rune supply */
  supply: string;
  /** Rune max supply */
  maxSupply: string;
  /** Rune mint authority */
  mintAuthority: string;
  /** Rune burn authority */
  burnAuthority: string;
}

/**
 * Alkane info
 */
export interface AlkaneInfo {
  /** Alkane ID */
  id: string;
  /** Alkane ticker */
  ticker: string;
  /** Alkane decimals */
  decimals: number;
  /** Alkane supply */
  supply: string;
  /** Alkane max supply */
  maxSupply: string;
  /** Alkane mint authority */
  mintAuthority: string;
  /** Alkane burn authority */
  burnAuthority: string;
}