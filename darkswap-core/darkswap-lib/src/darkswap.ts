/**
 * Main DarkSwap class
 */

import { Network } from './network';
import { Orderbook } from './orderbook';
import { Trade } from './trade';
import { NetworkConfig, Order, OrderSide } from './types';

/**
 * DarkSwap configuration
 */
export interface DarkSwapConfig {
  /**
   * Network configuration
   */
  network?: NetworkConfig;
}

/**
 * DarkSwap class
 */
export class DarkSwap {
  private network: Network;
  private orderbook: Orderbook;
  private trade: Trade;
  private initialized = false;

  /**
   * Create a new DarkSwap instance
   * @param config DarkSwap configuration
   */
  constructor(config: DarkSwapConfig = {}) {
    this.network = new Network(config.network);
    this.orderbook = new Orderbook(this.network);
    this.trade = new Trade(this.network, this.orderbook);
  }

  /**
   * Initialize DarkSwap
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.network.initialize();
    this.initialized = true;
  }

  /**
   * Get the local peer ID
   * @returns Local peer ID
   */
  getLocalPeerId(): string {
    this.ensureInitialized();
    return this.network.getLocalPeerId();
  }

  /**
   * Connect to a peer
   * @param addr Multiaddress to connect to
   */
  async connect(addr: string): Promise<void> {
    this.ensureInitialized();
    await this.network.connect(addr);
  }

  /**
   * Connect to a peer through a relay
   * @param relayPeerId Relay peer ID
   * @param dstPeerId Destination peer ID
   */
  async connectThroughRelay(relayPeerId: string, dstPeerId: string): Promise<void> {
    this.ensureInitialized();
    await this.network.connectThroughRelay(relayPeerId, dstPeerId);
  }

  /**
   * Listen on the given address
   * @param addr Address to listen on
   */
  async listenOn(addr: string): Promise<void> {
    this.ensureInitialized();
    await this.network.listenOn(addr);
  }

  /**
   * Create an order
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param side Order side
   * @param amount Amount
   * @param price Price
   * @param expiry Expiry timestamp
   * @returns Created order
   */
  async createOrder(
    baseAsset: string,
    quoteAsset: string,
    side: OrderSide,
    amount: string,
    price: string,
    expiry: number = Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  ): Promise<Order> {
    this.ensureInitialized();
    return this.orderbook.createOrder({
      makerPeerId: this.network.getLocalPeerId(),
      baseAsset,
      quoteAsset,
      side,
      amount,
      price,
      expiry,
    });
  }

  /**
   * Cancel an order
   * @param orderId Order ID to cancel
   */
  async cancelOrder(orderId: string): Promise<void> {
    this.ensureInitialized();
    await this.orderbook.cancelOrder(orderId);
  }

  /**
   * Take an order
   * @param orderId Order ID to take
   * @param amount Amount to take
   */
  async takeOrder(orderId: string, amount: string): Promise<void> {
    this.ensureInitialized();
    await this.trade.takeOrder(orderId, amount);
  }

  /**
   * Get all orders
   * @returns Array of orders
   */
  getAllOrders(): Order[] {
    this.ensureInitialized();
    return this.orderbook.getAllOrders();
  }

  /**
   * Get orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Array of orders
   */
  getOrdersForPair(baseAsset: string, quoteAsset: string): Order[] {
    this.ensureInitialized();
    return this.orderbook.getOrdersForPair(baseAsset, quoteAsset);
  }

  /**
   * Get buy orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Array of buy orders
   */
  getBuyOrders(baseAsset: string, quoteAsset: string): Order[] {
    this.ensureInitialized();
    return this.orderbook.getBuyOrders(baseAsset, quoteAsset);
  }

  /**
   * Get sell orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Array of sell orders
   */
  getSellOrders(baseAsset: string, quoteAsset: string): Order[] {
    this.ensureInitialized();
    return this.orderbook.getSellOrders(baseAsset, quoteAsset);
  }

  /**
   * Get the best bid for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Best bid or undefined if no bids
   */
  getBestBid(baseAsset: string, quoteAsset: string): Order | undefined {
    this.ensureInitialized();
    return this.orderbook.getBestBid(baseAsset, quoteAsset);
  }

  /**
   * Get the best ask for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Best ask or undefined if no asks
   */
  getBestAsk(baseAsset: string, quoteAsset: string): Order | undefined {
    this.ensureInitialized();
    return this.orderbook.getBestAsk(baseAsset, quoteAsset);
  }

  /**
   * Add an event listener
   * @param type Event type
   * @param listener Event listener
   */
  addEventListener(type: string, listener: (event: any) => void): void {
    this.ensureInitialized();
    this.network.addEventListener(type as any, listener);
  }

  /**
   * Remove an event listener
   * @param type Event type
   * @param listener Event listener
   */
  removeEventListener(type: string, listener: (event: any) => void): void {
    this.ensureInitialized();
    this.network.removeEventListener(type as any, listener);
  }

  /**
   * Ensure DarkSwap is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('DarkSwap not initialized');
    }
  }
}