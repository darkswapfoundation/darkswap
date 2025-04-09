/**
 * Streaming DarkSwap client
 * 
 * This module provides a DarkSwap client that uses streaming compilation for WebAssembly modules,
 * which can significantly improve loading times by compiling the module while it's being downloaded.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModuleStreaming, instantiateWasmModuleStreaming } from './StreamingWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Streaming DarkSwap client
 */
export class StreamingDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module URL
   */
  private wasmUrl: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * Whether the client is initialized
   */
  private streamingInitialized: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new streaming DarkSwap client
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
   * This method is overridden to use streaming compilation.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Check if streaming compilation is supported
      if (typeof WebAssembly.compileStreaming !== 'function') {
        console.warn('Streaming compilation is not supported, falling back to regular initialization');
        return super.initialize(this.wasmUrl);
      }

      // Load the WebAssembly module using streaming compilation
      const startTime = performance.now();
      
      try {
        // Instantiate the WebAssembly module using streaming instantiation
        await instantiateWasmModuleStreaming(this.wasmUrl);
        
        // Initialize the base client
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.streamingInitialized = true;
        
        const endTime = performance.now();
        console.log(`Streaming DarkSwap client initialized in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to initialize streaming DarkSwap client:', error);
        
        // Fall back to regular initialization
        console.warn('Falling back to regular initialization');
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.streamingInitialized = true;
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize streaming DarkSwap client');
  }

  /**
   * Preload the WebAssembly module
   * 
   * This method can be called to preload the WebAssembly module before it's needed.
   */
  async preload(): Promise<void> {
    return tryAsync(async () => {
      // Check if streaming compilation is supported
      if (typeof WebAssembly.compileStreaming !== 'function') {
        console.warn('Streaming compilation is not supported, preloading is not available');
        return;
      }

      // Preload the WebAssembly module using streaming compilation
      const startTime = performance.now();
      
      try {
        // Load the WebAssembly module using streaming compilation
        await loadWasmModuleStreaming(this.wasmUrl);
        
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
}