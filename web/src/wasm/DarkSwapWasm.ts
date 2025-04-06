/**
 * DarkSwapWasm - TypeScript wrapper for the DarkSwap WebAssembly module
 * 
 * This file provides a TypeScript wrapper for the DarkSwap WebAssembly module,
 * making it easier to use from TypeScript code.
 */

import * as wasm from '../wasm-bindings/darkswap_wasm';
import { Event as EventType, EventType as EventTypeEnum, GenericEventListener } from './EventTypes';
import { 
  DarkSwapError, 
  ErrorCode, 
  WasmError, 
  OrderError, 
  NetworkError, 
  createError, 
  logError, 
  tryAsync 
} from '../utils/ErrorHandling';

// Re-export types from the WebAssembly module
export type JsConfig = wasm.JsConfig;
export type JsDarkSwap = wasm.JsDarkSwap;

// Asset type enum
export enum AssetType {
  Bitcoin = 0,
  Rune = 1,
  Alkane = 2,
}

// Order side enum
export enum OrderSide {
  Buy = 0,
  Sell = 1,
}

// Order status enum
export enum OrderStatus {
  Open = 0,
  Filled = 1,
  Cancelled = 2,
  Expired = 3,
}

// Bitcoin network enum
export enum BitcoinNetwork {
  Mainnet = 0,
  Testnet = 1,
  Regtest = 2,
  Signet = 3,
}

// Order interface
export interface Order {
  id: string;
  side: OrderSide;
  baseAsset: string;
  quoteAsset: string;
  amount: string;
  price: string;
  timestamp: number;
  status: OrderStatus;
  maker: string;
}

// Trade interface
export interface Trade {
  id: string;
  orderId: string;
  side: OrderSide;
  baseAsset: string;
  quoteAsset: string;
  amount: string;
  price: string;
  timestamp: number;
  maker: string;
  taker: string;
}

// Configuration interface
export interface Config {
  bitcoinNetwork: BitcoinNetwork;
  relayUrl: string;
  listenAddresses: string[];
  bootstrapPeers: string[];
  walletPath?: string;
  walletPassword?: string;
  debug: boolean;
}

/**
 * DarkSwap WebAssembly wrapper class
 */
export class DarkSwapWasm {
  private darkswap: JsDarkSwap | null = null;
  private eventListeners: Map<string, GenericEventListener[]> = new Map();
  private _isInitialized = false;
  
  /**
   * Create a new DarkSwapWasm instance
   * @param config Configuration
   */
  constructor(config?: Config) {
    if (config) {
      this.initialize(config).catch(error => {
        logError(error, 'DarkSwapWasm.constructor');
      });
    }
  }
  
  /**
   * Initialize the DarkSwap WebAssembly module
   * @param config Configuration
   * @returns Promise that resolves when the module is initialized
   * @throws WasmError if initialization fails
   */
  public async initialize(config: Config): Promise<void> {
    return tryAsync(async () => {
      // Check if already initialized
      if (this._isInitialized) {
        throw new WasmError(
          'DarkSwap is already initialized',
          ErrorCode.AlreadyInitialized
        );
      }
      
      // Validate configuration
      this.validateConfig(config);
      
      // Create configuration
      const jsConfig = new wasm.JsConfig();
      
      // Set configuration
      jsConfig.bitcoin_network = config.bitcoinNetwork as unknown as wasm.JsBitcoinNetwork;
      jsConfig.relay_url = config.relayUrl;
      
      // Set listen addresses
      const listenAddresses = new Array<string>();
      config.listenAddresses.forEach(address => {
        listenAddresses.push(address);
      });
      jsConfig.listen_addresses = listenAddresses;
      
      // Set bootstrap peers
      const bootstrapPeers = new Array<string>();
      config.bootstrapPeers.forEach(peer => {
        bootstrapPeers.push(peer);
      });
      jsConfig.bootstrap_peers = bootstrapPeers;
      
      // Set wallet path and password
      if (config.walletPath) {
        jsConfig.wallet_path = config.walletPath;
      }
      
      if (config.walletPassword) {
        jsConfig.wallet_password = config.walletPassword;
      }
      
      // Set debug mode
      jsConfig.debug = config.debug;
      
      try {
        // Create DarkSwap instance
        this.darkswap = new wasm.JsDarkSwap(jsConfig);
      } catch (error) {
        throw new WasmError(
          `Failed to create DarkSwap instance: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.WasmInitFailed,
          { originalError: error }
        );
      }
      
      try {
        // Set event callback
        await this.darkswap.set_event_callback((event: any) => {
          this.handleEvent(event);
        });
      } catch (error) {
        throw new WasmError(
          `Failed to set event callback: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.WasmInitFailed,
          { originalError: error }
        );
      }
      
      try {
        // Start DarkSwap
        await this.darkswap.start();
      } catch (error) {
        throw new WasmError(
          `Failed to start DarkSwap: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.WasmInitFailed,
          { originalError: error }
        );
      }
      
      // Set initialized flag
      this._isInitialized = true;
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.initialize');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Check if the DarkSwap WebAssembly module is initialized
   * @returns True if initialized, false otherwise
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }
  
  /**
   * Stop the DarkSwap WebAssembly module
   * @returns Promise that resolves when the module is stopped
   * @throws WasmError if stopping fails
   */
  public async stop(): Promise<void> {
    return tryAsync(async () => {
      // Check if initialized
      if (!this._isInitialized) {
        throw new WasmError(
          'DarkSwap is not initialized',
          ErrorCode.NotInitialized
        );
      }
      
      if (!this.darkswap) {
        throw new WasmError(
          'DarkSwap instance is null',
          ErrorCode.NotInitialized
        );
      }
      
      try {
        // Stop DarkSwap
        await this.darkswap.stop();
      } catch (error) {
        throw new WasmError(
          `Failed to stop DarkSwap: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.WasmExecutionFailed,
          { originalError: error }
        );
      }
      
      // Clear event listeners
      this.eventListeners.clear();
      
      // Clear DarkSwap instance
      this.darkswap = null;
      
      // Clear initialized flag
      this._isInitialized = false;
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.stop');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Add an event listener
   * @param type Event type
   * @param listener Event listener
   * @throws DarkSwapError if adding the listener fails
   */
  public on(type: EventTypeEnum | string, listener: GenericEventListener): void {
    try {
      // Get listeners for this event type
      const listeners = this.eventListeners.get(type) || [];
      
      // Add listener
      listeners.push(listener);
      
      // Update listeners
      this.eventListeners.set(type, listeners);
    } catch (error) {
      const darkswapError = createError(
        error,
        `Failed to add event listener for type ${type}`,
        ErrorCode.Unknown
      );
      
      // Log error
      logError(darkswapError, 'DarkSwapWasm.on');
      
      // Rethrow error
      throw darkswapError;
    }
  }
  
  /**
   * Remove an event listener
   * @param type Event type
   * @param listener Event listener
   * @throws DarkSwapError if removing the listener fails
   */
  public off(type: EventTypeEnum | string, listener: GenericEventListener): void {
    try {
      // Get listeners for this event type
      const listeners = this.eventListeners.get(type) || [];
      
      // Remove listener
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      
      // Update listeners
      this.eventListeners.set(type, listeners);
    } catch (error) {
      const darkswapError = createError(
        error,
        `Failed to remove event listener for type ${type}`,
        ErrorCode.Unknown
      );
      
      // Log error
      logError(darkswapError, 'DarkSwapWasm.off');
      
      // Rethrow error
      throw darkswapError;
    }
  }
  
  /**
   * Create an order
   * @param side Order side
   * @param baseAssetType Base asset type
   * @param baseAssetId Base asset ID
   * @param quoteAssetType Quote asset type
   * @param quoteAssetId Quote asset ID
   * @param amount Amount
   * @param price Price
   * @returns Promise that resolves with the order ID
   * @throws OrderError if creating the order fails
   */
  public async createOrder(
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ): Promise<string> {
    return tryAsync(async () => {
      // Check if initialized
      this.checkInitialized();
      
      // Validate parameters
      this.validateOrderParameters(side, baseAssetType, baseAssetId, quoteAssetType, quoteAssetId, amount, price);
      
      try {
        // Create order
        return await this.darkswap!.create_order(
          side as unknown as wasm.JsOrderSide,
          baseAssetType as unknown as wasm.JsAssetType,
          baseAssetId,
          quoteAssetType as unknown as wasm.JsAssetType,
          quoteAssetId,
          amount,
          price,
        );
      } catch (error) {
        throw new OrderError(
          `Failed to create order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderCreationFailed,
          {
            side,
            baseAssetType,
            baseAssetId,
            quoteAssetType,
            quoteAssetId,
            amount,
            price,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.createOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID
   * @returns Promise that resolves when the order is cancelled
   * @throws OrderError if cancelling the order fails
   */
  public async cancelOrder(orderId: string): Promise<void> {
    return tryAsync(async () => {
      // Check if initialized
      this.checkInitialized();
      
      // Validate parameters
      if (!orderId) {
        throw new OrderError(
          'Order ID is required',
          ErrorCode.InvalidArgument
        );
      }
      
      try {
        // Cancel order
        await this.darkswap!.cancel_order(orderId);
      } catch (error) {
        throw new OrderError(
          `Failed to cancel order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderCancellationFailed,
          {
            orderId,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.cancelOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns Promise that resolves with the order
   * @throws OrderError if getting the order fails
   */
  public async getOrder(orderId: string): Promise<Order> {
    return tryAsync(async () => {
      // Check if initialized
      this.checkInitialized();
      
      // Validate parameters
      if (!orderId) {
        throw new OrderError(
          'Order ID is required',
          ErrorCode.InvalidArgument
        );
      }
      
      try {
        // Get order
        const order = await this.darkswap!.get_order(orderId);
        
        // Convert to Order interface
        return {
          id: order.id,
          side: order.side as unknown as OrderSide,
          baseAsset: order.baseAsset,
          quoteAsset: order.quoteAsset,
          amount: order.amount,
          price: order.price,
          timestamp: order.timestamp,
          status: order.status as unknown as OrderStatus,
          maker: order.maker,
        };
      } catch (error) {
        throw new OrderError(
          `Failed to get order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderNotFound,
          {
            orderId,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.getOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Get orders
   * @param side Order side
   * @param baseAssetType Base asset type
   * @param baseAssetId Base asset ID
   * @param quoteAssetType Quote asset type
   * @param quoteAssetId Quote asset ID
   * @returns Promise that resolves with the orders
   * @throws OrderError if getting the orders fails
   */
  public async getOrders(
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ): Promise<Order[]> {
    return tryAsync(async () => {
      // Check if initialized
      this.checkInitialized();
      
      try {
        // Get orders
        const orders = await this.darkswap!.get_orders(
          side as unknown as wasm.JsOrderSide | null,
          baseAssetType as unknown as wasm.JsAssetType | null,
          baseAssetId || null,
          quoteAssetType as unknown as wasm.JsAssetType | null,
          quoteAssetId || null,
        );
        
        // Convert to Order interface
        return orders.map(order => ({
          id: order.id,
          side: order.side as unknown as OrderSide,
          baseAsset: order.baseAsset,
          quoteAsset: order.quoteAsset,
          amount: order.amount,
          price: order.price,
          timestamp: order.timestamp,
          status: order.status as unknown as OrderStatus,
          maker: order.maker,
        }));
      } catch (error) {
        throw new OrderError(
          `Failed to get orders: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.Unknown,
          {
            side,
            baseAssetType,
            baseAssetId,
            quoteAssetType,
            quoteAssetId,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.getOrders');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Take an order
   * @param orderId Order ID
   * @param amount Amount to take
   * @returns Promise that resolves with the trade ID
   * @throws OrderError if taking the order fails
   */
  public async takeOrder(orderId: string, amount: string): Promise<string> {
    return tryAsync(async () => {
      // Check if initialized
      this.checkInitialized();
      
      // Validate parameters
      if (!orderId) {
        throw new OrderError(
          'Order ID is required',
          ErrorCode.InvalidArgument
        );
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        throw new OrderError(
          'Amount must be greater than 0',
          ErrorCode.InvalidArgument,
          { amount }
        );
      }
      
      try {
        // Take order
        return await this.darkswap!.take_order(orderId, amount);
      } catch (error) {
        throw new OrderError(
          `Failed to take order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderExecutionFailed,
          {
            orderId,
            amount,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'DarkSwapWasm.takeOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Handle an event from the WebAssembly module
   * @param event Event
   */
  private handleEvent(event: any): void {
    try {
      // Parse event
      const parsedEvent: EventType = {
        type: event.type,
        data: event.data,
      } as EventType;
      
      // Get listeners for this event type
      const listeners = this.eventListeners.get(parsedEvent.type) || [];
      
      // Call listeners
      listeners.forEach(listener => {
        try {
          listener(parsedEvent);
        } catch (error) {
          logError(error, `DarkSwapWasm.handleEvent.listener(${parsedEvent.type})`);
        }
      });
    } catch (error) {
      logError(error, 'DarkSwapWasm.handleEvent');
    }
  }
  
  /**
   * Check if the DarkSwap WebAssembly module is initialized
   * @throws WasmError if not initialized
   */
  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new WasmError(
        'DarkSwap is not initialized',
        ErrorCode.NotInitialized
      );
    }
    
    if (!this.darkswap) {
      throw new WasmError(
        'DarkSwap instance is null',
        ErrorCode.NotInitialized
      );
    }
  }
  
  /**
   * Validate configuration
   * @param config Configuration
   * @throws DarkSwapError if configuration is invalid
   */
  private validateConfig(config: Config): void {
    if (!config) {
      throw new DarkSwapError(
        'Configuration is required',
        ErrorCode.InvalidArgument
      );
    }
    
    if (config.bitcoinNetwork === undefined) {
      throw new DarkSwapError(
        'Bitcoin network is required',
        ErrorCode.InvalidArgument,
        { config }
      );
    }
    
    if (!config.relayUrl) {
      throw new DarkSwapError(
        'Relay URL is required',
        ErrorCode.InvalidArgument,
        { config }
      );
    }
    
    if (!config.listenAddresses) {
      throw new DarkSwapError(
        'Listen addresses are required',
        ErrorCode.InvalidArgument,
        { config }
      );
    }
    
    if (!config.bootstrapPeers) {
      throw new DarkSwapError(
        'Bootstrap peers are required',
        ErrorCode.InvalidArgument,
        { config }
      );
    }
  }
  
  /**
   * Validate order parameters
   * @param side Order side
   * @param baseAssetType Base asset type
   * @param baseAssetId Base asset ID
   * @param quoteAssetType Quote asset type
   * @param quoteAssetId Quote asset ID
   * @param amount Amount
   * @param price Price
   * @throws OrderError if parameters are invalid
   */
  private validateOrderParameters(
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ): void {
    if (side === undefined) {
      throw new OrderError(
        'Order side is required',
        ErrorCode.InvalidOrderParameters,
        { side }
      );
    }
    
    if (baseAssetType === undefined) {
      throw new OrderError(
        'Base asset type is required',
        ErrorCode.InvalidOrderParameters,
        { baseAssetType }
      );
    }
    
    if (!baseAssetId) {
      throw new OrderError(
        'Base asset ID is required',
        ErrorCode.InvalidOrderParameters,
        { baseAssetId }
      );
    }
    
    if (quoteAssetType === undefined) {
      throw new OrderError(
        'Quote asset type is required',
        ErrorCode.InvalidOrderParameters,
        { quoteAssetType }
      );
    }
    
    if (!quoteAssetId) {
      throw new OrderError(
        'Quote asset ID is required',
        ErrorCode.InvalidOrderParameters,
        { quoteAssetId }
      );
    }
    
    if (!amount) {
      throw new OrderError(
        'Amount is required',
        ErrorCode.InvalidOrderParameters,
        { amount }
      );
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      throw new OrderError(
        'Amount must be a positive number',
        ErrorCode.InvalidOrderParameters,
        { amount }
      );
    }
    
    if (!price) {
      throw new OrderError(
        'Price is required',
        ErrorCode.InvalidOrderParameters,
        { price }
      );
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      throw new OrderError(
        'Price must be a positive number',
        ErrorCode.InvalidOrderParameters,
        { price }
      );
    }
  }
}

export default DarkSwapWasm;