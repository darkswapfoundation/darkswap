/**
 * Combined Optimizations DarkSwap client
 * 
 * This module provides a DarkSwap client that uses combined optimizations for WebAssembly modules,
 * including SIMD instructions, Web Workers, streaming compilation, and shared memory. By combining
 * multiple optimizations, we can achieve even better performance than using each optimization
 * individually.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { 
  loadWasmModuleWithCombinedOptimizations, 
  getSupportedOptimizations 
} from './CombinedOptimizationsWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Combined Optimizations DarkSwap client
 */
export class CombinedOptimizationsDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module URL
   */
  private wasmUrl: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * SIMD-enabled WebAssembly module URL
   */
  private simdWasmUrl: string = '/darkswap-wasm/darkswap_wasm_simd_bg.wasm';

  /**
   * Whether the client is initialized
   */
  private combinedOptimizationsInitialized: boolean = false;

  /**
   * Optimizations used
   */
  private optimizationsUsed: {
    webWorker: boolean;
    streaming: boolean;
    simd: boolean;
    sharedMemory: boolean;
  } | null = null;

  /**
   * Shared memory options
   */
  private sharedMemoryOptions: {
    initial: number;
    maximum?: number;
  } = {
    initial: 16, // 16 pages (1MB)
    maximum: 256, // 256 pages (16MB)
  };

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new combined optimizations DarkSwap client
   * @param wasmUrl URL of the WebAssembly module
   * @param simdWasmUrl URL of the SIMD-enabled WebAssembly module
   * @param sharedMemoryOptions Shared memory options
   */
  constructor(
    wasmUrl?: string,
    simdWasmUrl?: string,
    sharedMemoryOptions?: {
      initial: number;
      maximum?: number;
    }
  ) {
    super();
    if (wasmUrl) {
      this.wasmUrl = wasmUrl;
    }
    if (simdWasmUrl) {
      this.simdWasmUrl = simdWasmUrl;
    }
    if (sharedMemoryOptions) {
      this.sharedMemoryOptions = sharedMemoryOptions;
    }
  }

  /**
   * Initialize the DarkSwap client
   * 
   * This method is overridden to use combined optimizations.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Check if the client is already initialized
      if (this.combinedOptimizationsInitialized) {
        return;
      }

      // Check if the client is already loading
      if (this.isLoading) {
        if (this.loadingPromise) {
          return this.loadingPromise;
        }
      }

      // Set loading state
      this.isLoading = true;
      
      // Create loading promise
      this.loadingPromise = (async () => {
        try {
          // Load the WebAssembly module using combined optimizations
          const startTime = performance.now();
          
          // Get supported optimizations
          const supportedOptimizations = await getSupportedOptimizations();
          console.log(`Supported optimizations: Web Worker: ${supportedOptimizations.webWorker}, Streaming: ${supportedOptimizations.streaming}, SIMD: ${supportedOptimizations.simd}, Shared Memory: ${supportedOptimizations.sharedMemory}`);
          
          try {
            // Load the WebAssembly module using combined optimizations
            const result = await loadWasmModuleWithCombinedOptimizations(
              this.wasmUrl,
              {
                simdUrl: this.simdWasmUrl,
                sharedMemory: supportedOptimizations.sharedMemory ? this.sharedMemoryOptions : undefined,
              }
            );
            
            // Store the optimizations used
            this.optimizationsUsed = result.optimizations;
            
            // Initialize the base client
            await super.initialize(this.wasmUrl);
            
            // Mark the client as initialized
            this.combinedOptimizationsInitialized = true;
            
            const endTime = performance.now();
            console.log(`Combined Optimizations DarkSwap client initialized in ${endTime - startTime}ms with optimizations: Web Worker: ${result.optimizations.webWorker}, Streaming: ${result.optimizations.streaming}, SIMD: ${result.optimizations.simd}, Shared Memory: ${result.optimizations.sharedMemory}`);
          } catch (error) {
            console.error('Failed to initialize Combined Optimizations DarkSwap client:', error);
            
            // Fall back to regular initialization
            console.warn('Falling back to regular initialization');
            await super.initialize(this.wasmUrl);
            
            // Mark the client as initialized
            this.combinedOptimizationsInitialized = true;
          }
        } finally {
          // Reset loading state
          this.isLoading = false;
          this.loadingPromise = null;
        }
      })();
      
      // Wait for loading to complete
      return this.loadingPromise;
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize Combined Optimizations DarkSwap client');
  }

  /**
   * Preload the WebAssembly module
   * 
   * This method can be called to preload the WebAssembly module before it's needed.
   */
  async preload(): Promise<void> {
    return tryAsync(async () => {
      // Get supported optimizations
      const supportedOptimizations = await getSupportedOptimizations();
      
      // Preload the WebAssembly module using combined optimizations
      const startTime = performance.now();
      
      try {
        // Preload the WebAssembly module using combined optimizations
        await loadWasmModuleWithCombinedOptimizations(
          this.wasmUrl,
          {
            simdUrl: this.simdWasmUrl,
            sharedMemory: supportedOptimizations.sharedMemory ? this.sharedMemoryOptions : undefined,
          }
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
   * Get the optimizations used
   * @returns The optimizations used, or null if the client is not initialized
   */
  getOptimizationsUsed(): {
    webWorker: boolean;
    streaming: boolean;
    simd: boolean;
    sharedMemory: boolean;
  } | null {
    return this.optimizationsUsed;
  }
}