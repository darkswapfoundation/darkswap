/**
 * Web Worker DarkSwap client
 * 
 * This module provides a DarkSwap client that uses Web Workers to load WebAssembly modules
 * in a background thread, which can improve the responsiveness of the application.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModuleInWorker, isWebWorkerSupported } from './WebWorkerWasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Web Worker DarkSwap client
 */
export class WebWorkerDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module URL
   */
  private wasmUrl: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * Whether the client is initialized
   */
  private workerInitialized: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new Web Worker DarkSwap client
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
   * This method is overridden to use Web Workers for loading the WebAssembly module.
   */
  async initialize(): Promise<void> {
    return tryAsync(async () => {
      // Check if Web Workers are supported
      if (!isWebWorkerSupported()) {
        console.warn('Web Workers are not supported, falling back to regular initialization');
        return super.initialize(this.wasmUrl);
      }

      // Load the WebAssembly module in a Web Worker
      const startTime = performance.now();
      
      try {
        // Load the WebAssembly module in a Web Worker
        const { module, instance } = await loadWasmModuleInWorker(this.wasmUrl);
        
        // Initialize the base client
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.workerInitialized = true;
        
        const endTime = performance.now();
        console.log(`Web Worker DarkSwap client initialized in ${endTime - startTime}ms`);
      } catch (error) {
        console.error('Failed to initialize Web Worker DarkSwap client:', error);
        
        // Fall back to regular initialization
        console.warn('Falling back to regular initialization');
        await super.initialize(this.wasmUrl);
        
        // Mark the client as initialized
        this.workerInitialized = true;
      }
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize Web Worker DarkSwap client');
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