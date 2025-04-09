/**
 * Lazy-loaded DarkSwap client
 * 
 * This module provides a lazy-loaded DarkSwap client that only loads the WebAssembly module
 * when it's needed.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork } from './DarkSwapClient';
import { loadWasmModule } from './WasmLoader';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Lazy-loaded DarkSwap client
 */
export class LazyDarkSwapClient extends DarkSwapClient {
  /**
   * WebAssembly module path
   */
  private wasmModulePath: string = '/darkswap-wasm/darkswap_wasm_bg.wasm';

  /**
   * WebAssembly module import name
   */
  private importName: string = 'darkswap-wasm';

  /**
   * Whether the client is lazy-initialized
   */
  private lazyInitialized: boolean = false;

  /**
   * Whether the client is loading
   */
  private isLoading: boolean = false;

  /**
   * Loading promise
   */
  private loadingPromise: Promise<void> | null = null;

  /**
   * Create a new lazy-loaded DarkSwap client
   * @param wasmPath Path to the WebAssembly module
   * @param importName Import name for the module
   */
  constructor(wasmPath?: string, importName?: string) {
    super();
    if (wasmPath) {
      this.wasmModulePath = wasmPath;
    }
    if (importName) {
      this.importName = importName;
    }
  }

  /**
   * Initialize the DarkSwap client
   * 
   * This method is overridden to use the lazy loading mechanism.
   * It doesn't actually initialize the client until it's needed.
   */
  async initialize(): Promise<void> {
    // Mark the client as initialized
    this.lazyInitialized = true;
    console.log('Lazy DarkSwap client initialized');
  }

  /**
   * Ensure the client is loaded
   */
  private async ensureLoaded(): Promise<void> {
    // If the client is already loading, wait for it to finish
    if (this.isLoading && this.loadingPromise) {
      return this.loadingPromise;
    }

    // If the client is not initialized, throw an error
    if (!this.lazyInitialized) {
      throw new DarkSwapError(
        ErrorCode.NOT_INITIALIZED,
        'DarkSwap client is not initialized. Call initialize() first.'
      );
    }

    // Load the client
    this.isLoading = true;
    this.loadingPromise = tryAsync(async () => {
      // Load the WebAssembly module
      const wasmModule = await loadWasmModule(this.wasmModulePath, this.importName);
      
      // Initialize the base client with the loaded module
      await super.initialize(this.wasmModulePath);
      
      console.log('DarkSwap client loaded');
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to load DarkSwap client');

    try {
      await this.loadingPromise;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Create a DarkSwap instance
   * @param config DarkSwap configuration
   */
  async create(config: any): Promise<void> {
    await this.ensureLoaded();
    return super.create(config);
  }

  /**
   * Start DarkSwap
   */
  async start(): Promise<void> {
    await this.ensureLoaded();
    return super.start();
  }

  /**
   * Stop DarkSwap
   */
  async stop(): Promise<void> {
    await this.ensureLoaded();
    return super.stop();
  }

  /**
   * Get wallet address
   */
  async getAddress(): Promise<string> {
    await this.ensureLoaded();
    return super.getAddress();
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    await this.ensureLoaded();
    return super.getBalance();
  }

  /**
   * Get asset balance
   * @param asset Asset
   */
  async getAssetBalance(asset: any): Promise<number> {
    await this.ensureLoaded();
    return super.getAssetBalance(asset);
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
    baseAsset: any,
    quoteAsset: any,
    side: OrderSide,
    amount: string,
    price: string,
    makerAddress: string,
    expirySeconds: number
  ): Promise<any> {
    await this.ensureLoaded();
    return super.createOrder(
      baseAsset,
      quoteAsset,
      side,
      amount,
      price,
      makerAddress,
      expirySeconds
    );
  }

  /**
   * Cancel an order
   * @param orderId Order ID
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.ensureLoaded();
    return super.cancelOrder(orderId);
  }

  /**
   * Get an order by ID
   * @param orderId Order ID
   */
  async getOrder(orderId: string): Promise<any> {
    await this.ensureLoaded();
    return super.getOrder(orderId);
  }

  /**
   * Get orders for a pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  async getOrders(baseAsset: any, quoteAsset: any): Promise<any[]> {
    await this.ensureLoaded();
    return super.getOrders(baseAsset, quoteAsset);
  }

  /**
   * Take an order
   * @param orderId Order ID
   * @param amount Order amount
   */
  async takeOrder(orderId: string, amount: string): Promise<any> {
    await this.ensureLoaded();
    return super.takeOrder(orderId, amount);
  }

  /**
   * Get best bid and ask prices for a pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  async getBestBidAsk(baseAsset: any, quoteAsset: any): Promise<any> {
    await this.ensureLoaded();
    return super.getBestBidAsk(baseAsset, quoteAsset);
  }
}