/**
 * Code Split DarkSwap client
 * 
 * This module provides a DarkSwap client that uses code splitting for WebAssembly modules,
 * which can significantly improve the initial page load time by splitting large WebAssembly
 * modules into smaller chunks that are loaded on demand.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModuleWithCodeSplitting } from './CodeSplitWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Code Split DarkSwap client
 */
export class CodeSplitDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module base URL
   */
  private wasmBaseUrl: string = '/darkswap-wasm';

  /**
   * Number of chunks
   */
  private chunkCount: number = 4;

  /**
   * Whether the client is initialized
   */
  private codeSplitInitialized: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new code split DarkSwap client
   * @param wasmBaseUrl Base URL of the WebAssembly module
   * @param chunkCount Number of chunks
   */
  constructor(wasmBaseUrl?: string, chunkCount?: number) {
    super();
    if (wasmBaseUrl) {
      this.wasmBaseUrl = wasmBaseUrl;
    }
    if (chunkCount) {
      this.chunkCount = chunkCount;
    }
  }

  /**
   * Initialize the DarkSwap client
   * 
   * This method is overridden to use code splitting.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Load the WebAssembly module using code splitting
      const startTime = performance.now();
      
      try {
        // Load the WebAssembly module using code splitting
        const result = await loadWasmModuleWithCodeSplitting(
          this.wasmBaseUrl,
          this.chunkCount
        );
        
        // Initialize the base client
        await super.initialize(`${this.wasmBaseUrl}/darkswap_wasm_bg.wasm`);
        
        // Mark the client as initialized
        this.codeSplitInitialized = true;
        
        const endTime = performance.now();
        console.log(`Code Split DarkSwap client initialized in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to initialize Code Split DarkSwap client:', error);
        
        // Fall back to regular initialization
        console.warn('Falling back to regular initialization');
        await super.initialize(`${this.wasmBaseUrl}/darkswap_wasm_bg.wasm`);
        
        // Mark the client as initialized
        this.codeSplitInitialized = true;
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize Code Split DarkSwap client');
  }

  /**
   * Preload the WebAssembly module
   * 
   * This method can be called to preload the WebAssembly module before it's needed.
   */
  async preload(): Promise<void> {
    return tryAsync(async () => {
      // Preload the WebAssembly module using code splitting
      const startTime = performance.now();
      
      try {
        // Preload the WebAssembly module using code splitting
        await loadWasmModuleWithCodeSplitting(
          this.wasmBaseUrl,
          this.chunkCount
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
}