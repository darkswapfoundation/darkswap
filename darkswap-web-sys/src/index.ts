/**
 * DarkSwap WebAssembly Bindings
 * 
 * This module provides TypeScript bindings for the DarkSwap SDK WebAssembly module.
 * It enables browser applications to interact with the DarkSwap P2P network,
 * manage orders, and execute trades.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  DarkSwapConfig,
  NetworkConfig,
  OrderbookConfig,
  TradeConfig,
  WalletConfig,
  Order,
  Trade,
  Peer,
  WalletInfo,
  Balance,
  RuneInfo,
  AlkaneInfo,
  PredicateInfo,
  OrderbookEntry,
  TradeStatus,
  NetworkEvent,
  OrderEvent,
  TradeEvent,
  WalletEvent,
} from './types';

/**
 * Main DarkSwap SDK class that provides access to the WebAssembly module
 */
export class DarkSwap extends EventEmitter {
  private static instance: DarkSwap | null = null;
  private wasmModule: any | null = null;
  private _isInitialized = false;
  private config: DarkSwapConfig;

  /**
   * Get the singleton instance of DarkSwap
   */
  public static getInstance(): DarkSwap {
    if (!DarkSwap.instance) {
      DarkSwap.instance = new DarkSwap();
    }
    return DarkSwap.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize the DarkSwap SDK
   * @param config Configuration options
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(config?: Partial<DarkSwapConfig>): Promise<void> {
    if (this._isInitialized) {
      console.warn('DarkSwap SDK is already initialized');
      return;
    }

    try {
      // Merge provided config with defaults
      this.config = {
        ...this.getDefaultConfig(),
        ...config,
      };

      // Import the WebAssembly module
      // Note: In a real implementation, this would import the actual WebAssembly module
      // For now, we'll use a mock implementation
      this.wasmModule = {
        initialize: async () => {},
        connect: async () => {},
        disconnect: async () => {},
        isConnected: () => false,
        getPeers: async () => '[]',
        connectToPeer: async () => {},
        connectToRelay: async () => {},
        createOrder: async () => 'order-id',
        cancelOrder: async () => {},
        getOrders: async () => '[]',
        getOrdersForPair: async () => '[]',
        takeOrder: async () => 'trade-id',
        getTrades: async () => '[]',
        getTrade: async () => null,
        getTradeStatus: async () => '{"status":"pending"}',
        connectWallet: async () => {},
        disconnectWallet: async () => {},
        isWalletConnected: () => false,
        getWalletInfo: async () => null,
        getBalances: async () => '[]',
        getRuneInfo: async () => null,
        getAlkaneInfo: async () => null,
        createPredicate: async () => 'predicate-id',
        getPredicateInfo: async () => null,
        setNetworkEventCallback: () => {},
        setOrderEventCallback: () => {},
        setTradeEventCallback: () => {},
        setWalletEventCallback: () => {},
      };

      // Initialize the WebAssembly module with the configuration
      await this.wasmModule.initialize(JSON.stringify(this.config));

      // Set up event listeners
      this.setupEventListeners();

      this._isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize DarkSwap SDK:', error);
      throw new Error(`Failed to initialize DarkSwap SDK: ${error}`);
    }
  }

  /**
   * Check if the SDK is initialized
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): DarkSwapConfig {
    return { ...this.config };
  }

  /**
   * Connect to the P2P network
   */
  public async connect(): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.connect();
  }

  /**
   * Disconnect from the P2P network
   */
  public async disconnect(): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.disconnect();
  }

  /**
   * Check if connected to the P2P network
   */
  public isConnected(): boolean {
    this.ensureInitialized();
    return this.wasmModule.isConnected();
  }

  /**
   * Get the list of connected peers
   */
  public async getPeers(): Promise<Peer[]> {
    this.ensureInitialized();
    const peersJson = await this.wasmModule.getPeers();
    return JSON.parse(peersJson);
  }

  /**
   * Connect to a specific peer
   * @param peerId The ID of the peer to connect to
   */
  public async connectToPeer(peerId: string): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.connectToPeer(peerId);
  }

  /**
   * Connect to a relay server
   * @param relayAddress The address of the relay server
   */
  public async connectToRelay(relayAddress: string): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.connectToRelay(relayAddress);
  }

  /**
   * Create a new order
   * @param order The order to create
   */
  public async createOrder(order: Order): Promise<string> {
    this.ensureInitialized();
    return await this.wasmModule.createOrder(JSON.stringify(order));
  }

  /**
   * Cancel an order
   * @param orderId The ID of the order to cancel
   */
  public async cancelOrder(orderId: string): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.cancelOrder(orderId);
  }

  /**
   * Get all orders
   */
  public async getOrders(): Promise<OrderbookEntry[]> {
    this.ensureInitialized();
    const ordersJson = await this.wasmModule.getOrders();
    return JSON.parse(ordersJson);
  }

  /**
   * Get orders for a specific trading pair
   * @param baseAsset The base asset
   * @param quoteAsset The quote asset
   */
  public async getOrdersForPair(baseAsset: string, quoteAsset: string): Promise<OrderbookEntry[]> {
    this.ensureInitialized();
    const ordersJson = await this.wasmModule.getOrdersForPair(baseAsset, quoteAsset);
    return JSON.parse(ordersJson);
  }

  /**
   * Take an order
   * @param orderId The ID of the order to take
   * @param amount The amount to take
   */
  public async takeOrder(orderId: string, amount: string): Promise<string> {
    this.ensureInitialized();
    return await this.wasmModule.takeOrder(orderId, amount);
  }

  /**
   * Get all trades
   */
  public async getTrades(): Promise<Trade[]> {
    this.ensureInitialized();
    const tradesJson = await this.wasmModule.getTrades();
    return JSON.parse(tradesJson);
  }

  /**
   * Get a specific trade
   * @param tradeId The ID of the trade to get
   */
  public async getTrade(tradeId: string): Promise<Trade | null> {
    this.ensureInitialized();
    const tradeJson = await this.wasmModule.getTrade(tradeId);
    return tradeJson ? JSON.parse(tradeJson) : null;
  }

  /**
   * Get the status of a trade
   * @param tradeId The ID of the trade to get the status for
   */
  public async getTradeStatus(tradeId: string): Promise<TradeStatus> {
    this.ensureInitialized();
    const statusJson = await this.wasmModule.getTradeStatus(tradeId);
    return JSON.parse(statusJson);
  }

  /**
   * Connect a wallet
   * @param walletConfig The wallet configuration
   */
  public async connectWallet(walletConfig: WalletConfig): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.connectWallet(JSON.stringify(walletConfig));
  }

  /**
   * Disconnect the wallet
   */
  public async disconnectWallet(): Promise<void> {
    this.ensureInitialized();
    await this.wasmModule.disconnectWallet();
  }

  /**
   * Check if a wallet is connected
   */
  public isWalletConnected(): boolean {
    this.ensureInitialized();
    return this.wasmModule.isWalletConnected();
  }

  /**
   * Get wallet information
   */
  public async getWalletInfo(): Promise<WalletInfo | null> {
    this.ensureInitialized();
    const infoJson = await this.wasmModule.getWalletInfo();
    return infoJson ? JSON.parse(infoJson) : null;
  }

  /**
   * Get wallet balances
   */
  public async getBalances(): Promise<Balance[]> {
    this.ensureInitialized();
    const balancesJson = await this.wasmModule.getBalances();
    return JSON.parse(balancesJson);
  }

  /**
   * Get information about a rune
   * @param runeId The ID of the rune
   */
  public async getRuneInfo(runeId: string): Promise<RuneInfo | null> {
    this.ensureInitialized();
    const infoJson = await this.wasmModule.getRuneInfo(runeId);
    return infoJson ? JSON.parse(infoJson) : null;
  }

  /**
   * Get information about an alkane
   * @param alkaneId The ID of the alkane
   */
  public async getAlkaneInfo(alkaneId: string): Promise<AlkaneInfo | null> {
    this.ensureInitialized();
    const infoJson = await this.wasmModule.getAlkaneInfo(alkaneId);
    return infoJson ? JSON.parse(infoJson) : null;
  }

  /**
   * Create a predicate alkane
   * @param predicateInfo The predicate information
   */
  public async createPredicate(predicateInfo: PredicateInfo): Promise<string> {
    this.ensureInitialized();
    return await this.wasmModule.createPredicate(JSON.stringify(predicateInfo));
  }

  /**
   * Get information about a predicate
   * @param predicateId The ID of the predicate
   */
  public async getPredicateInfo(predicateId: string): Promise<PredicateInfo | null> {
    this.ensureInitialized();
    const infoJson = await this.wasmModule.getPredicateInfo(predicateId);
    return infoJson ? JSON.parse(infoJson) : null;
  }

  /**
   * Set up event listeners for the WebAssembly module
   */
  private setupEventListeners(): void {
    if (!this.wasmModule) return;

    // Set up callback for network events
    this.wasmModule.setNetworkEventCallback((eventJson: string) => {
      const event: NetworkEvent = JSON.parse(eventJson);
      this.emit('network', event);
      this.emit(`network:${event.type}`, event);
    });

    // Set up callback for order events
    this.wasmModule.setOrderEventCallback((eventJson: string) => {
      const event: OrderEvent = JSON.parse(eventJson);
      this.emit('order', event);
      this.emit(`order:${event.type}`, event);
    });

    // Set up callback for trade events
    this.wasmModule.setTradeEventCallback((eventJson: string) => {
      const event: TradeEvent = JSON.parse(eventJson);
      this.emit('trade', event);
      this.emit(`trade:${event.type}`, event);
    });

    // Set up callback for wallet events
    this.wasmModule.setWalletEventCallback((eventJson: string) => {
      const event: WalletEvent = JSON.parse(eventJson);
      this.emit('wallet', event);
      this.emit(`wallet:${event.type}`, event);
    });
  }

  /**
   * Ensure that the SDK is initialized
   * @throws Error if the SDK is not initialized
   */
  private ensureInitialized(): void {
    if (!this._isInitialized || !this.wasmModule) {
      throw new Error('DarkSwap SDK is not initialized. Call initialize() first.');
    }
  }

  /**
   * Get the default configuration
   */
  private getDefaultConfig(): DarkSwapConfig {
    return {
      network: {
        bootstrapPeers: [],
        relays: ['ws://localhost:9001/ws'],
        maxPeers: 10,
        enableDht: true,
        enableMdns: true,
        enableWebRtc: true,
      },
      orderbook: {
        maxOrders: 1000,
        orderExpiryTime: 86400, // 24 hours
        enableGossip: true,
      },
      trade: {
        maxTrades: 100,
        tradeTimeout: 300, // 5 minutes
        enableAutoRetry: true,
        maxRetries: 3,
      },
      wallet: {
        type: 'wasm',
        network: 'testnet',
        enableRunes: true,
        enableAlkanes: true,
      },
    };
  }
}

// Export types
export * from './types';

// Export default instance
export default DarkSwap.getInstance();