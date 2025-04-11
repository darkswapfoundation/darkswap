/**
 * Dynamic Chunk Size DarkSwap client
 * 
 * This module provides a DarkSwap client that uses dynamic chunk sizing for WebAssembly modules,
 * which can significantly improve the initial page load time by optimizing the chunk size for
 * the current network conditions.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModuleWithDynamicChunkSize, getNetworkSpeed } from './DynamicChunkSizeWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Dynamic Chunk Size DarkSwap client
 */
export class DynamicChunkSizeDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module URL
   */
  private wasmUrl: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * Whether the client is initialized
   */
  private dynamicChunkSizeInitialized: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new dynamic chunk size DarkSwap client
   * @param wasmUrl URL of the WebAssembly module
   */
  constructor(wasmUrl?: string) {
    super();
    if (wasmUrl) {
      this.wasmUrl = wasmUrl;
    }
  }

  /**
   * Initialize the DarkSwap client
   * 
   * This method is overridden to use dynamic chunk sizing.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Load the WebAssembly module using dynamic chunk sizing
      const startTime = performance.now();
      
      try {
        // Load the WebAssembly module using dynamic chunk sizing
        const result = await loadWasmModuleWithDynamicChunkSize(
          this.wasmUrl
        );
        
        // Initialize the base client
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.dynamicChunkSizeInitialized = true;
        
        const endTime = performance.now();
        console.log(`Dynamic Chunk Size DarkSwap client initialized in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to initialize Dynamic Chunk Size DarkSwap client:', error);
        
        // Fall back to regular initialization
        console.warn('Falling back to regular initialization');
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.dynamicChunkSizeInitialized = true;
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize Dynamic Chunk Size DarkSwap client');
  }

  /**
   * Preload the WebAssembly module
   * 
   * This method can be called to preload the WebAssembly module before it's needed.
   */
  async preload(): Promise<void> {
    return tryAsync(async () => {
      // Preload the WebAssembly module using dynamic chunk sizing
      const startTime = performance.now();
      
      try {
        // Preload the WebAssembly module using dynamic chunk sizing
        await loadWasmModuleWithDynamicChunkSize(
          this.wasmUrl
        );
        
        const endTime = performance.now();
        console.log(`WebAssembly module preloaded in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to preload WebAssembly module:', error);
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to preload WebAssembly module');
  }

  /**
   * Create a DarkSwap instance with performance metrics
   * @param config DarkSwap configuration
   */
  async create(config: any): Promise<void> {
    const startTime = performance.now();
    
    // Create the DarkSwap instance
    await super.create(config);
    
    const endTime = performance.now();
    console.log(`DarkSwap instance created in ${endTime - startTime}ms`);
  }

  /**
   * Start DarkSwap with performance metrics
   */
  async start(): Promise<void> {
    const startTime = performance.now();
    
    // Start DarkSwap
    await super.start();
    
    const endTime = performance.now();
    console.log(`DarkSwap started in ${endTime - startTime}ms`);
  }

  /**
   * Get wallet address with performance metrics
   */
  async getAddress(): Promise<string> {
    const startTime = performance.now();
    
    // Get the address
    const address = await super.getAddress();
    
    const endTime = performance.now();
    console.log(`Got wallet address in ${endTime - startTime}ms`);
    
    return address;
  }

  /**
   * Get wallet balance with performance metrics
   */
  async getBalance(): Promise<number> {
    const startTime = performance.now();
    
    // Get the balance
    const balance = await super.getBalance();
    
    const endTime = performance.now();
    console.log(`Got wallet balance in ${endTime - startTime}ms`);
    
    return balance;
  }

  /**
   * Create an order with performance metrics
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param side Order side
   * @param amount Order amount
   * @param price Order price
   * @param makerAddress Maker address
   * @param expirySeconds Order expiry in seconds
   */
  async createOrder(
    baseAsset: any,
    quoteAsset: any,
    side: OrderSide,
    amount: string,
    price: string,
    makerAddress: string,
    expirySeconds: number
  ): Promise<any> {
    const startTime = performance.now();
    
    // Create the order
    const order = await super.createOrder(
      baseAsset,
      quoteAsset,
      side,
      amount,
      price,
      makerAddress,
      expirySeconds
    );
    
    const endTime = performance.now();
    console.log(`Created order in ${endTime - startTime}ms`);
    
    return order;
  }

  /**
   * Get orders for a pair with performance metrics
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  async getOrders(baseAsset: any, quoteAsset: any): Promise<any[]> {
    const startTime = performance.now();
    
    // Get the orders
    const orders = await super.getOrders(baseAsset, quoteAsset);
    
    const endTime = performance.now();
    console.log(`Got orders in ${endTime - startTime}ms`);
    
    return orders;
  }

  /**
   * Take an order with performance metrics
   * @param orderId Order ID
   * @param amount Order amount
   */
  async takeOrder(orderId: string, amount: string): Promise<any> {
    const startTime = performance.now();
    
    // Take the order
    const trade = await super.takeOrder(orderId, amount);
    
    const endTime = performance.now();
    console.log(`Took order in ${endTime - startTime}ms`);
    
    return trade;
  }

  /**
   * Get the current network speed
   * @returns The current network speed, or null if no measurement has been taken
   */
  getNetworkSpeed() {
    return getNetworkSpeed();
  }
}