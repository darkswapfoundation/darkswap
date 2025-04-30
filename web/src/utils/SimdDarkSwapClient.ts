/**
 * SIMD-enabled DarkSwap client
 * 
 * This module provides a DarkSwap client that uses SIMD-enabled WebAssembly modules,
 * which can significantly improve performance for certain operations by using
 * Single Instruction, Multiple Data (SIMD) instructions.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModuleWithSimd, isSimdSupported } from './SimdWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * SIMD-enabled DarkSwap client
 */
export class SimdDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module URL with SIMD support
   */
  private simdWasmUrl: string = '/darkswap-wasm/darkswap_wasm_simd_bg.wasm';

  /**
   * WebAssembly module URL without SIMD support (fallback)
   */
  private fallbackWasmUrl: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * Whether the client is initialized
   */
  private simdInitialized: boolean = false;

  /**
   * Whether SIMD is supported
   */
  private simdSupported: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new SIMD-enabled DarkSwap client
   * @param simdWasmUrl URL of the WebAssembly module with SIMD support
   * @param fallbackWasmUrl URL of the fallback WebAssembly module without SIMD
   */
  constructor(simdWasmUrl?: string, fallbackWasmUrl?: string) {
    super();
    if (simdWasmUrl) {
      this.simdWasmUrl = simdWasmUrl;
    }
    if (fallbackWasmUrl) {
      this.fallbackWasmUrl = fallbackWasmUrl;
    }
  }

  /**
   * Initialize the DarkSwap client
   * 
   * This method is overridden to use SIMD-enabled WebAssembly modules.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Check if SIMD is supported
      this.simdSupported = await isSimdSupported();
      console.log(`SIMD support: ${this.simdSupported ? 'enabled' : 'disabled'}`);

      // Load the WebAssembly module with SIMD support if available
      const startTime = performance.now();
      
      try {
        // Load the WebAssembly module with SIMD support if available
        const result = await loadWasmModuleWithSimd(
          this.simdWasmUrl,
          this.fallbackWasmUrl
        );
        
        // Initialize the base client
        await super.initialize(this.simdSupported ? this.simdWasmUrl : this.fallbackWasmUrl);
        
        // Mark the client as initialized
        this.simdInitialized = true;
        
        const endTime = performance.now();
        console.log(`SIMD-enabled DarkSwap client initialized in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to initialize SIMD-enabled DarkSwap client:', error);
        
        // Fall back to regular initialization
        console.warn('Falling back to regular initialization');
        await super.initialize(this.fallbackWasmUrl);
        
        // Mark the client as initialized
        this.simdInitialized = true;
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize SIMD-enabled DarkSwap client');
  }

  /**
   * Preload the WebAssembly module
   * 
   * This method can be called to preload the WebAssembly module before it's needed.
   */
  async preload(): Promise<void> {
    return tryAsync(async () => {
      // Check if SIMD is supported
      const simdSupported = await isSimdSupported();
      console.log(`SIMD support: ${simdSupported ? 'enabled' : 'disabled'}`);

      // Preload the WebAssembly module with SIMD support if available
      const startTime = performance.now();
      
      try {
        // Preload the WebAssembly module with SIMD support if available
        await loadWasmModuleWithSimd(
          this.simdWasmUrl,
          this.fallbackWasmUrl
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
   * Check if SIMD is supported
   * @returns Whether SIMD is supported
   */
  isSimdSupported(): boolean {
    return this.simdSupported;
  }
}