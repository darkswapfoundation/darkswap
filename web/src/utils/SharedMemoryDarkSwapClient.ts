/**
 * Shared Memory DarkSwap client
 * 
 * This module provides a DarkSwap client that uses shared memory between the main thread
 * and Web Workers using Shared Array Buffers, which can significantly improve performance
 * for certain operations.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModuleWithSharedMemory, isSharedMemorySupported } from './SharedMemoryWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Shared Memory DarkSwap client
 */
export class SharedMemoryDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module URL
   */
  private wasmUrl: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * Memory options for the shared memory
   */
  private memoryOptions: {
    initial: number;
    maximum?: number;
  } = {
    initial: 16, // 16 pages (1MB)
    maximum: 256, // 256 pages (16MB)
  };

  /**
   * Whether the client is initialized
   */
  private sharedMemoryInitialized: boolean = false;

  /**
   * Whether shared memory is supported
   */
  private sharedMemorySupported: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new shared memory DarkSwap client
   * @param wasmUrl URL of the WebAssembly module
   * @param memoryOptions Memory options for the shared memory
   */
  constructor(wasmUrl?: string, memoryOptions?: {
    initial: number;
    maximum?: number;
  }) {
    super();
    if (wasmUrl) {
      this.wasmUrl = wasmUrl;
    }
    if (memoryOptions) {
      this.memoryOptions = memoryOptions;
    }
  }

  /**
   * Initialize the DarkSwap client
   * 
   * This method is overridden to use shared memory.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Check if shared memory is supported
      this.sharedMemorySupported = isSharedMemorySupported();
      console.log(`Shared memory support: ${this.sharedMemorySupported ? 'enabled' : 'disabled'}`);

      // Load the WebAssembly module with shared memory if supported
      const startTime = performance.now();
      
      try {
        // Load the WebAssembly module with shared memory if supported
        const result = await loadWasmModuleWithSharedMemory(
          this.wasmUrl,
          undefined,
          this.sharedMemorySupported ? this.memoryOptions : undefined
        );
        
        // Initialize the base client
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.sharedMemoryInitialized = true;
        
        const endTime = performance.now();
        console.log(`Shared Memory DarkSwap client initialized in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to initialize Shared Memory DarkSwap client:', error);
        
        // Fall back to regular initialization
        console.warn('Falling back to regular initialization');
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.sharedMemoryInitialized = true;
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize Shared Memory DarkSwap client');
  }

  /**
   * Preload the WebAssembly module
   * 
   * This method can be called to preload the WebAssembly module before it's needed.
   */
  async preload(): Promise<void> {
    return tryAsync(async () => {
      // Check if shared memory is supported
      const sharedMemorySupported = isSharedMemorySupported();
      console.log(`Shared memory support: ${sharedMemorySupported ? 'enabled' : 'disabled'}`);

      // Preload the WebAssembly module with shared memory if supported
      const startTime = performance.now();
      
      try {
        // Preload the WebAssembly module with shared memory if supported
        await loadWasmModuleWithSharedMemory(
          this.wasmUrl,
          undefined,
          sharedMemorySupported ? this.memoryOptions : undefined
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
   * Check if shared memory is supported
   * @returns Whether shared memory is supported
   */
  isSharedMemorySupported(): boolean {
    return this.sharedMemorySupported;
  }
}