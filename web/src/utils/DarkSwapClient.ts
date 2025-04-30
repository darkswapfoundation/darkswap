/**
 * DarkSwap Client
 * 
 * This module provides a TypeScript wrapper for the DarkSwap WebAssembly bindings.
 */

import init, { 
  JsDarkSwap, 
  JsConfig, 
  JsAssetType, 
  JsOrderSide, 
  JsOrderStatus, 
  JsBitcoinNetwork 
} from 'darkswap-wasm';

import { 
  DarkSwapError, 
  ErrorCode, 
  tryAsync, 
  handleError 
} from './ErrorHandling';

/**
 * Asset type
 */
export enum AssetType {
  Bitcoin = 0,
  Rune = 1,
  Alkane = 2,
}

/**
 * Order side
 */
export enum OrderSide {
  Buy = 0,
  Sell = 1,
}

/**
 * Order status
 */
export enum OrderStatus {
  Open = 0,
  Filled = 1,
  Canceled = 2,
  Expired = 3,
}

/**
 * Bitcoin network
 */
export enum BitcoinNetwork {
  Mainnet = 0,
  Testnet = 1,
  Regtest = 2,
  Signet = 3,
}

/**
 * DarkSwap configuration
 */
export interface DarkSwapConfig {
  /**
   * Bitcoin network
   */
  network: BitcoinNetwork;
  /**
   * Wallet type
   */
  walletType: string;
  /**
   * Private key
   */
  privateKey?: string;
  /**
   * Mnemonic
   */
  mnemonic?: string;
  /**
   * Derivation path
   */
  derivationPath?: string;
  /**
   * Enable WebRTC
   */
  enableWebRTC: boolean;
  /**
   * WebRTC ICE servers
   */
  iceServers: string[];
  /**
   * Signaling server URL
   */
  signalingServerUrl?: string;
}

/**
 * Asset
 */
export interface Asset {
  /**
   * Asset type
   */
  type: AssetType;
  /**
   * Asset ID (for Rune and Alkane)
   */
  id?: string;
}

/**
 * Order
 */
export interface Order {
  /**
   * Order ID
   */
  id: string;
  /**
   * Maker address
   */
  maker: string;
  /**
   * Base asset
   */
  baseAsset: string;
  /**
   * Quote asset
   */
  quoteAsset: string;
  /**
   * Order side
   */
  side: OrderSide;
  /**
   * Order amount
   */
  amount: string;
  /**
   * Order price
   */
  price: string;
  /**
   * Order status
   */
  status: OrderStatus;
  /**
   * Order timestamp
   */
  timestamp: number;
  /**
   * Order expiry
   */
  expiry: number;
}

/**
 * Trade
 */
export interface Trade {
  /**
   * Trade ID
   */
  id: string;
}

/**
 * Event type
 */
export enum EventType {
  OrderCreated = 'orderCreated',
  OrderCancelled = 'orderCancelled',
  OrderMatched = 'orderMatched',
  OrderExpired = 'orderExpired',
  TradeCreated = 'tradeCreated',
  TradeCompleted = 'tradeCompleted',
  TradeFailed = 'tradeFailed',
  PeerConnected = 'peerConnected',
  PeerDisconnected = 'peerDisconnected',
  Error = 'error',
}

/**
 * Event
 */
export type Event =
  | { type: EventType.OrderCreated; orderId: string }
  | { type: EventType.OrderCancelled; orderId: string }
  | { type: EventType.OrderMatched; orderId: string; tradeId: string }
  | { type: EventType.OrderExpired; orderId: string }
  | { type: EventType.TradeCreated; tradeId: string }
  | { type: EventType.TradeCompleted; tradeId: string }
  | { type: EventType.TradeFailed; tradeId: string; error: string }
  | { type: EventType.PeerConnected; peerId: string }
  | { type: EventType.PeerDisconnected; peerId: string }
  | { type: EventType.Error; error: string };

/**
 * Best bid and ask
 */
export interface BestBidAsk {
  /**
   * Best bid price
   */
  bid?: string;
  /**
   * Best ask price
   */
  ask?: string;
}

/**
 * DarkSwap client
 */
export class DarkSwapClient {
  /**
   * WebAssembly module
   */
  private wasmModule: any;
  /**
   * DarkSwap instance
   */
  private darkswap: JsDarkSwap | null = null;
  /**
   * Event listeners
   */
  private eventListeners: ((event: Event) => void)[] = [];
  /**
   * Whether the client is initialized
   */
  private isInitialized = false;

  /**
   * Create a new DarkSwap client
   */
  constructor() {}

  /**
   * Initialize the DarkSwap client
   * @param wasmPath Path to the WebAssembly module
   */
  async initialize(wasmPath: string): Promise<void> {
    return tryAsync(async () => {
      this.wasmModule = await init(wasmPath);
      this.isInitialized = true;
      console.log('DarkSwap WebAssembly module initialized');
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize DarkSwap WebAssembly module');
  }

  /**
   * Create a new DarkSwap instance
   * @param config DarkSwap configuration
   */
  async create(config: DarkSwapConfig): Promise<void> {
    return tryAsync(async () => {
      this.checkInitialized();

      // Convert DarkSwapConfig to JsConfig
      const jsConfig = new this.wasmModule.JsConfig();
      jsConfig.network = config.network as unknown as JsBitcoinNetwork;
      jsConfig.wallet_type = config.walletType;
      jsConfig.private_key = config.privateKey;
      jsConfig.mnemonic = config.mnemonic;
      jsConfig.derivation_path = config.derivationPath;
      jsConfig.enable_webrtc = config.enableWebRTC;
      jsConfig.ice_servers = config.iceServers;
      jsConfig.signaling_server_url = config.signalingServerUrl;

      // Create DarkSwap instance
      this.darkswap = new this.wasmModule.JsDarkSwap(jsConfig);
      console.log('DarkSwap instance created');
    }, ErrorCode.DARKSWAP_CREATION_FAILED, 'Failed to create DarkSwap instance');
  }

  /**
   * Start DarkSwap
   */
  async start(): Promise<void> {
    return tryAsync(async () => {
      this.checkDarkSwap();

      await this.darkswap!.start();
      console.log('DarkSwap started');

      // Set event callback
      await this.darkswap!.set_event_callback((event: any) => {
        this.handleEvent(event);
      });
    }, ErrorCode.DARKSWAP_START_FAILED, 'Failed to start DarkSwap');
  }

  /**
   * Stop DarkSwap
   */
  async stop(): Promise<void> {
    return tryAsync(async () => {
      this.checkDarkSwap();

      await this.darkswap!.stop();
      console.log('DarkSwap stopped');
    }, ErrorCode.DARKSWAP_STOP_FAILED, 'Failed to stop DarkSwap');
  }

  /**
   * Add event listener
   * @param listener Event listener
   */
  addEventListener(listener: (event: Event) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   * @param listener Event listener
   */
  removeEventListener(listener: (event: Event) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Handle event
   * @param event Event
   */
  private handleEvent(event: any): void {
    try {
      // Convert event to Event
      let typedEvent: Event;

      switch (event.type) {
        case 'orderCreated':
          typedEvent = {
            type: EventType.OrderCreated,
            orderId: event.orderId,
          };
          break;
        case 'orderCancelled':
          typedEvent = {
            type: EventType.OrderCancelled,
            orderId: event.orderId,
          };
          break;
        case 'orderMatched':
          typedEvent = {
            type: EventType.OrderMatched,
            orderId: event.orderId,
            tradeId: event.tradeId,
          };
          break;
        case 'orderExpired':
          typedEvent = {
            type: EventType.OrderExpired,
            orderId: event.orderId,
          };
          break;
        case 'tradeCreated':
          typedEvent = {
            type: EventType.TradeCreated,
            tradeId: event.tradeId,
          };
          break;
        case 'tradeCompleted':
          typedEvent = {
            type: EventType.TradeCompleted,
            tradeId: event.tradeId,
          };
          break;
        case 'tradeFailed':
          typedEvent = {
            type: EventType.TradeFailed,
            tradeId: event.tradeId,
            error: event.error,
          };
          break;
        case 'peerConnected':
          typedEvent = {
            type: EventType.PeerConnected,
            peerId: event.peerId,
          };
          break;
        case 'peerDisconnected':
          typedEvent = {
            type: EventType.PeerDisconnected,
            peerId: event.peerId,
          };
          break;
        case 'error':
          typedEvent = {
            type: EventType.Error,
            error: event.error,
          };
          break;
        default:
          console.warn('Unknown event type:', event.type);
          return;
      }

      // Notify listeners
      for (const listener of this.eventListeners) {
        try {
          listener(typedEvent);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  /**
   * Get wallet address
   */
  async getAddress(): Promise<string> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.get_address();
    }, ErrorCode.WALLET_ADDRESS_FAILED, 'Failed to get wallet address');
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.get_balance();
    }, ErrorCode.WALLET_BALANCE_FAILED, 'Failed to get wallet balance');
  }

  /**
   * Get asset balance
   * @param asset Asset
   */
  async getAssetBalance(asset: Asset): Promise<number> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.get_asset_balance(asset.type as unknown as JsAssetType, asset.id || '');
    }, ErrorCode.WALLET_ASSET_BALANCE_FAILED, 'Failed to get asset balance');
  }

  /**
   * Create an order
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param side Order side
   * @param amount Order amount
   * @param price Order price
   * @param makerAddress Maker address
   * @param expirySeconds Order expiry in seconds
   */
  async createOrder(
    baseAsset: Asset,
    quoteAsset: Asset,
    side: OrderSide,
    amount: string,
    price: string,
    makerAddress: string,
    expirySeconds: number
  ): Promise<Order> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.create_order(
        baseAsset.type as unknown as JsAssetType,
        baseAsset.id || '',
        quoteAsset.type as unknown as JsAssetType,
        quoteAsset.id || '',
        side as unknown as JsOrderSide,
        amount,
        price,
        makerAddress,
        expirySeconds
      );
    }, ErrorCode.ORDER_CREATION_FAILED, 'Failed to create order');
  }

  /**
   * Cancel an order
   * @param orderId Order ID
   */
  async cancelOrder(orderId: string): Promise<void> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      await this.darkswap!.cancel_order(orderId);
    }, ErrorCode.ORDER_CANCELLATION_FAILED, 'Failed to cancel order');
  }

  /**
   * Get an order by ID
   * @param orderId Order ID
   */
  async getOrder(orderId: string): Promise<Order> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.get_order(orderId);
    }, ErrorCode.ORDER_RETRIEVAL_FAILED, 'Failed to get order');
  }

  /**
   * Get orders for a pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  async getOrders(baseAsset: Asset, quoteAsset: Asset): Promise<Order[]> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.get_orders(
        baseAsset.type as unknown as JsAssetType,
        baseAsset.id || '',
        quoteAsset.type as unknown as JsAssetType,
        quoteAsset.id || ''
      );
    }, ErrorCode.ORDERS_RETRIEVAL_FAILED, 'Failed to get orders');
  }

  /**
   * Take an order
   * @param orderId Order ID
   * @param amount Order amount
   */
  async takeOrder(orderId: string, amount: string): Promise<Trade> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.take_order(orderId, amount);
    }, ErrorCode.TRADE_CREATION_FAILED, 'Failed to take order');
  }

  /**
   * Get best bid and ask prices for a pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  async getBestBidAsk(baseAsset: Asset, quoteAsset: Asset): Promise<BestBidAsk> {
    return tryAsync(async () => {
      this.checkDarkSwap();
      return await this.darkswap!.get_best_bid_ask(
        baseAsset.type as unknown as JsAssetType,
        baseAsset.id || '',
        quoteAsset.type as unknown as JsAssetType,
        quoteAsset.id || ''
      );
    }, ErrorCode.MARKET_DATA_FAILED, 'Failed to get best bid and ask');
  }

  /**
   * Check if the client is initialized
   * @throws {DarkSwapError} If the client is not initialized
   */
  private checkInitialized(): void {
    if (!this.isInitialized) {
      throw new DarkSwapError(
        ErrorCode.NOT_INITIALIZED,
        'DarkSwap client is not initialized. Call initialize() first.'
      );
    }
  }

  /**
   * Check if the DarkSwap instance exists
   * @throws {DarkSwapError} If the DarkSwap instance does not exist
   */
  private checkDarkSwap(): void {
    this.checkInitialized();
    if (!this.darkswap) {
      throw new DarkSwapError(
        ErrorCode.NOT_INITIALIZED,
        'DarkSwap instance is not created. Call create() first.'
      );
    }
  }
}