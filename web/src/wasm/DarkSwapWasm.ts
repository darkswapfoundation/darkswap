/**
 * DarkSwapWasm.ts - DarkSwap WebAssembly interface
 * 
 * This file provides a high-level interface to the DarkSwap WebAssembly module.
 */

import DarkSwapWasmModule from './DarkSwapWasmModule';
import { WasmError, OrderError, NetworkError, WalletError, TradeError, ErrorCode } from '../utils/ErrorHandling';
import { EventEmitter } from 'events';

/**
 * Bitcoin network
 */
export enum BitcoinNetwork {
  Mainnet = 0,
  Testnet = 1,
  Regtest = 2,
}

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
  Cancelled = 2,
  Expired = 3,
}

/**
 * Trade status
 */
export enum TradeStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
}

/**
 * Event type
 */
export type EventType = 'order' | 'trade' | 'error' | 'connection' | 'wallet';

/**
 * Configuration for DarkSwap
 */
export interface Config {
  /**
   * Bitcoin network
   */
  bitcoinNetwork: BitcoinNetwork;
  
  /**
   * Relay URL
   */
  relayUrl: string;
  
  /**
   * Listen addresses
   */
  listenAddresses: string[];
  
  /**
   * Bootstrap peers
   */
  bootstrapPeers: string[];
  
  /**
   * Wallet path
   */
  walletPath?: string;
  
  /**
   * Wallet password
   */
  walletPassword?: string;
  
  /**
   * Debug mode
   */
  debug?: boolean;
  
  /**
   * WebAssembly memory options
   */
  memory?: {
    /**
     * Initial memory size in pages (64KB per page)
     */
    initialPages?: number;
    
    /**
     * Maximum memory size in pages (64KB per page)
     */
    maximumPages?: number;
    
    /**
     * Whether to use shared memory
     */
    shared?: boolean;
  };
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
   * Order side
   */
  side: OrderSide;
  
  /**
   * Base asset
   */
  baseAsset: string;
  
  /**
   * Quote asset
   */
  quoteAsset: string;
  
  /**
   * Amount
   */
  amount: string;
  
  /**
   * Price
   */
  price: string;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Status
   */
  status: OrderStatus;
  
  /**
   * Maker
   */
  maker: string;
}

/**
 * Trade
 */
export interface Trade {
  /**
   * Trade ID
   */
  id: string;
  
  /**
   * Order ID
   */
  orderId: string;
  
  /**
   * Amount
   */
  amount: string;
  
  /**
   * Price
   */
  price: string;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Status
   */
  status: TradeStatus;
  
  /**
   * Maker
   */
  maker: string;
  
  /**
   * Taker
   */
  taker: string;
}

/**
 * DarkSwap WebAssembly interface
 */
export class DarkSwapWasm extends EventEmitter {
  /**
   * WebAssembly module
   */
  private wasmModule: DarkSwapWasmModule;
  
  /**
   * DarkSwap instance
   */
  private darkswap: any;
  
  /**
   * Whether the module is initialized
   */
  private _isInitialized = false;
  
  /**
   * Get whether the module is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }
  
  /**
   * Create a new DarkSwap WebAssembly interface
   */
  constructor() {
    super();
    
    // Create WebAssembly module
    this.wasmModule = new DarkSwapWasmModule();
  }
  
  /**
   * Initialize DarkSwap
   * @param config - Configuration
   * @returns Promise that resolves when DarkSwap is initialized
   * @throws WasmError if initialization fails
   */
  async initialize(config: Config): Promise<void> {
    try {
      // Initialize WebAssembly module
      await this.wasmModule.initialize({
        initialMemory: config.memory?.initialPages,
        maximumMemory: config.memory?.maximumPages,
        sharedMemory: config.memory?.shared,
      });
      
      // Get WebAssembly module
      const module = this.wasmModule.getModule();
      
      // Create configuration
      const jsConfig = new module.JsConfig();
      jsConfig.bitcoin_network = config.bitcoinNetwork;
      jsConfig.relay_url = config.relayUrl;
      jsConfig.listen_addresses = config.listenAddresses;
      jsConfig.bootstrap_peers = config.bootstrapPeers;
      jsConfig.wallet_path = config.walletPath;
      jsConfig.wallet_password = config.walletPassword;
      jsConfig.debug = config.debug || false;
      
      // Create DarkSwap instance
      this.darkswap = new module.JsDarkSwap(jsConfig);
      
      // Set event callback
      await this.darkswap.set_event_callback((event: any) => {
        // Emit event
        this.emit(event.type, event);
        
        // Emit specific event
        if (event.data) {
          this.emit(event.type, event.data);
        }
      });
      
      // Start DarkSwap
      await this.darkswap.start();
      
      // Set initialized flag
      this._isInitialized = true;
    } catch (error) {
      // Throw WasmError
      throw new WasmError(
        `Failed to initialize DarkSwap: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.WasmInitFailed,
        { originalError: error }
      );
    }
  }
  
  /**
   * Create an order
   * @param side - Order side
   * @param baseAssetType - Base asset type
   * @param baseAssetId - Base asset ID
   * @param quoteAssetType - Quote asset type
   * @param quoteAssetId - Quote asset ID
   * @param amount - Amount
   * @param price - Price
   * @returns Promise that resolves to the order ID
   * @throws OrderError if order creation fails
   */
  async createOrder(
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ): Promise<string> {
    // Check if initialized
    if (!this._isInitialized || !this.darkswap) {
      throw new OrderError('DarkSwap not initialized', ErrorCode.NotInitialized);
    }
    
    // Validate parameters
    if (!baseAssetId) {
      throw new OrderError('Base asset ID is required', ErrorCode.InvalidOrderParameters);
    }
    
    if (!quoteAssetId) {
      throw new OrderError('Quote asset ID is required', ErrorCode.InvalidOrderParameters);
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new OrderError('Amount must be greater than 0', ErrorCode.InvalidOrderParameters);
    }
    
    if (!price || parseFloat(price) <= 0) {
      throw new OrderError('Price must be greater than 0', ErrorCode.InvalidOrderParameters);
    }
    
    try {
      // Create order
      return await this.darkswap.create_order(
        side,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
        amount,
        price,
      );
    } catch (error) {
      // Throw OrderError
      throw new OrderError(
        `Failed to create order: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.OrderCreationFailed,
        { originalError: error }
      );
    }
  }
  
  /**
   * Cancel an order
   * @param orderId - Order ID
   * @returns Promise that resolves when the order is cancelled
   * @throws OrderError if order cancellation fails
   */
  async cancelOrder(orderId: string): Promise<void> {
    // Check if initialized
    if (!this._isInitialized || !this.darkswap) {
      throw new OrderError('DarkSwap not initialized', ErrorCode.NotInitialized);
    }
    
    // Validate parameters
    if (!orderId) {
      throw new OrderError('Order ID is required', ErrorCode.InvalidOrderParameters);
    }
    
    try {
      // Cancel order
      await this.darkswap.cancel_order(orderId);
    } catch (error) {
      // Throw OrderError
      throw new OrderError(
        `Failed to cancel order: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.OrderCancellationFailed,
        { originalError: error }
      );
    }
  }
  
  /**
   * Get an order
   * @param orderId - Order ID
   * @returns Promise that resolves to the order
   * @throws OrderError if order retrieval fails
   */
  async getOrder(orderId: string): Promise<Order> {
    // Check if initialized
    if (!this._isInitialized || !this.darkswap) {
      throw new OrderError('DarkSwap not initialized', ErrorCode.NotInitialized);
    }
    
    // Validate parameters
    if (!orderId) {
      throw new OrderError('Order ID is required', ErrorCode.InvalidOrderParameters);
    }
    
    try {
      // Get order
      return await this.darkswap.get_order(orderId);
    } catch (error) {
      // Throw OrderError
      throw new OrderError(
        `Failed to get order: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.OrderNotFound,
        { originalError: error }
      );
    }
  }
  
  /**
   * Get orders
   * @param side - Order side
   * @param baseAssetType - Base asset type
   * @param baseAssetId - Base asset ID
   * @param quoteAssetType - Quote asset type
   * @param quoteAssetId - Quote asset ID
   * @returns Promise that resolves to the orders
   * @throws OrderError if order retrieval fails
   */
  async getOrders(
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ): Promise<Order[]> {
    // Check if initialized
    if (!this._isInitialized || !this.darkswap) {
      throw new OrderError('DarkSwap not initialized', ErrorCode.NotInitialized);
    }
    
    try {
      // Get orders
      return await this.darkswap.get_orders(
        side,
        baseAssetType,
        baseAssetId || null,
        quoteAssetType,
        quoteAssetId || null,
      );
    } catch (error) {
      // Throw OrderError
      throw new OrderError(
        `Failed to get orders: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.OrderNotFound,
        { originalError: error }
      );
    }
  }
  
  /**
   * Take an order
   * @param orderId - Order ID
   * @param amount - Amount
   * @returns Promise that resolves to the trade ID
   * @throws OrderError if order execution fails
   */
  async takeOrder(orderId: string, amount: string): Promise<string> {
    // Check if initialized
    if (!this._isInitialized || !this.darkswap) {
      throw new OrderError('DarkSwap not initialized', ErrorCode.NotInitialized);
    }
    
    // Validate parameters
    if (!orderId) {
      throw new OrderError('Order ID is required', ErrorCode.InvalidOrderParameters);
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new OrderError('Amount must be greater than 0', ErrorCode.InvalidOrderParameters);
    }
    
    try {
      // Take order
      return await this.darkswap.take_order(orderId, amount);
    } catch (error) {
      // Throw OrderError
      throw new OrderError(
        `Failed to take order: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.OrderExecutionFailed,
        { originalError: error }
      );
    }
  }
  
  /**
   * Register an event handler
   * @param event - Event type
   * @param handler - Event handler
   * @returns Function to remove the event handler
   */
  on(event: EventType, handler: (event: any) => void): () => void {
    // Add event listener
    super.on(event, handler);
    
    // Return function to remove event listener
    return () => {
      this.off(event, handler);
    };
  }
}

/**
 * Default export
 */
export default DarkSwapWasm;