/**
 * Orderbook implementation for the DarkSwap TypeScript Library
 */

import { EventEmitter } from 'eventemitter3';
import { 
  EventData, 
  EventHandler, 
  EventType, 
  Order, 
  OrderSide, 
  OrderStatus, 
  OrderbookOptions 
} from './types';
import { DarkSwapClient } from './client';
import { generateRandomId } from './utils';

/**
 * Orderbook class
 */
export class Orderbook extends EventEmitter {
  /** DarkSwap client */
  private client: DarkSwapClient;
  
  /** Base asset */
  private baseAsset: string;
  
  /** Quote asset */
  private quoteAsset: string;
  
  /** Orders */
  private orders: Map<string, Order> = new Map();
  
  /** Buy orders */
  private buyOrders: Order[] = [];
  
  /** Sell orders */
  private sellOrders: Order[] = [];
  
  /** Synced flag */
  private synced: boolean = false;
  
  /**
   * Create a new orderbook
   * @param client DarkSwap client
   * @param options Orderbook options
   */
  constructor(client: DarkSwapClient, options: OrderbookOptions = {}) {
    super();
    
    this.client = client;
    this.baseAsset = options.baseAsset || 'BTC';
    this.quoteAsset = options.quoteAsset || 'RUNE:0x123';
    
    // Set up event listeners
    this.client.on(EventType.ORDERBOOK_ORDER_ADDED, this.handleOrderAdded.bind(this));
    this.client.on(EventType.ORDERBOOK_ORDER_REMOVED, this.handleOrderRemoved.bind(this));
    this.client.on(EventType.ORDERBOOK_ORDER_UPDATED, this.handleOrderUpdated.bind(this));
    
    // Auto sync if specified
    if (options.autoSync) {
      this.sync().catch((error) => {
        console.error('Failed to sync orderbook:', error);
      });
    }
  }
  
  /**
   * Sync the orderbook
   * @returns Promise that resolves when synced
   */
  public async sync(): Promise<void> {
    try {
      // Get all orders for the trading pair
      const orders = await this.client.get<Order[]>(`/orderbook/${this.baseAsset}/${this.quoteAsset}`);
      
      // Clear existing orders
      this.orders.clear();
      this.buyOrders = [];
      this.sellOrders = [];
      
      // Add orders
      for (const order of orders) {
        this.addOrder(order);
      }
      
      // Sort orders
      this.sortOrders();
      
      // Set synced flag
      this.synced = true;
      
      // Emit synced event
      this.emit(EventType.ORDERBOOK_SYNCED, { orders: this.getOrders() });
    } catch (error) {
      throw new Error(`Failed to sync orderbook: ${error}`);
    }
  }
  
  /**
   * Add an order
   * @param order Order to add
   */
  private addOrder(order: Order): void {
    // Add to orders map
    this.orders.set(order.id, order);
    
    // Add to buy or sell orders
    if (order.side === OrderSide.BUY) {
      this.buyOrders.push(order);
    } else {
      this.sellOrders.push(order);
    }
  }
  
  /**
   * Remove an order
   * @param orderId Order ID
   */
  private removeOrder(orderId: string): void {
    // Get the order
    const order = this.orders.get(orderId);
    
    if (!order) {
      return;
    }
    
    // Remove from orders map
    this.orders.delete(orderId);
    
    // Remove from buy or sell orders
    if (order.side === OrderSide.BUY) {
      this.buyOrders = this.buyOrders.filter((o) => o.id !== orderId);
    } else {
      this.sellOrders = this.sellOrders.filter((o) => o.id !== orderId);
    }
  }
  
  /**
   * Update an order
   * @param order Order to update
   */
  private updateOrder(order: Order): void {
    // Remove the old order
    this.removeOrder(order.id);
    
    // Add the new order
    this.addOrder(order);
    
    // Sort orders
    this.sortOrders();
  }
  
  /**
   * Sort orders
   */
  private sortOrders(): void {
    // Sort buy orders by price (descending)
    this.buyOrders.sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return priceB - priceA;
    });
    
    // Sort sell orders by price (ascending)
    this.sellOrders.sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return priceA - priceB;
    });
  }
  
  /**
   * Handle order added event
   * @param data Event data
   */
  private handleOrderAdded(data: EventData): void {
    const order = data.order as Order;
    
    // Check if the order is for this trading pair
    if (order.baseAsset !== this.baseAsset || order.quoteAsset !== this.quoteAsset) {
      return;
    }
    
    // Add the order
    this.addOrder(order);
    
    // Sort orders
    this.sortOrders();
    
    // Emit event
    this.emit(EventType.ORDERBOOK_ORDER_ADDED, { order });
  }
  
  /**
   * Handle order removed event
   * @param data Event data
   */
  private handleOrderRemoved(data: EventData): void {
    const orderId = data.orderId as string;
    
    // Get the order
    const order = this.orders.get(orderId);
    
    if (!order) {
      return;
    }
    
    // Check if the order is for this trading pair
    if (order.baseAsset !== this.baseAsset || order.quoteAsset !== this.quoteAsset) {
      return;
    }
    
    // Remove the order
    this.removeOrder(orderId);
    
    // Emit event
    this.emit(EventType.ORDERBOOK_ORDER_REMOVED, { orderId });
  }
  
  /**
   * Handle order updated event
   * @param data Event data
   */
  private handleOrderUpdated(data: EventData): void {
    const order = data.order as Order;
    
    // Check if the order is for this trading pair
    if (order.baseAsset !== this.baseAsset || order.quoteAsset !== this.quoteAsset) {
      return;
    }
    
    // Update the order
    this.updateOrder(order);
    
    // Emit event
    this.emit(EventType.ORDERBOOK_ORDER_UPDATED, { order });
  }
  
  /**
   * Create a new order
   * @param side Order side
   * @param amount Order amount
   * @param price Order price
   * @param expiry Order expiry in milliseconds
   * @returns Promise that resolves with the order ID
   */
  public async createOrder(
    side: OrderSide,
    amount: string,
    price: string,
    expiry: number = 24 * 60 * 60 * 1000
  ): Promise<string> {
    // Create the order
    const order: Order = {
      id: generateRandomId(),
      baseAsset: this.baseAsset,
      quoteAsset: this.quoteAsset,
      side,
      amount,
      price,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
      status: OrderStatus.OPEN,
      maker: '', // Will be set by the server
    };
    
    // Send the order to the server
    const orderId = await this.client.post<string>('/orderbook/orders', order);
    
    return orderId;
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID
   * @returns Promise that resolves when the order is cancelled
   */
  public async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/orderbook/orders/${orderId}`);
  }
  
  /**
   * Get all orders
   * @returns All orders
   */
  public getOrders(): Order[] {
    return Array.from(this.orders.values());
  }
  
  /**
   * Get buy orders
   * @returns Buy orders
   */
  public getBuyOrders(): Order[] {
    return this.buyOrders;
  }
  
  /**
   * Get sell orders
   * @returns Sell orders
   */
  public getSellOrders(): Order[] {
    return this.sellOrders;
  }
  
  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns Order or undefined if not found
   */
  public getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }
  
  /**
   * Get the best buy order
   * @returns Best buy order or undefined if none
   */
  public getBestBuyOrder(): Order | undefined {
    return this.buyOrders[0];
  }
  
  /**
   * Get the best sell order
   * @returns Best sell order or undefined if none
   */
  public getBestSellOrder(): Order | undefined {
    return this.sellOrders[0];
  }
  
  /**
   * Get the spread
   * @returns Spread or undefined if no orders
   */
  public getSpread(): string | undefined {
    const bestBuy = this.getBestBuyOrder();
    const bestSell = this.getBestSellOrder();
    
    if (!bestBuy || !bestSell) {
      return undefined;
    }
    
    const buyPrice = parseFloat(bestBuy.price);
    const sellPrice = parseFloat(bestSell.price);
    
    return (sellPrice - buyPrice).toFixed(8);
  }
  
  /**
   * Get the mid price
   * @returns Mid price or undefined if no orders
   */
  public getMidPrice(): string | undefined {
    const bestBuy = this.getBestBuyOrder();
    const bestSell = this.getBestSellOrder();
    
    if (!bestBuy || !bestSell) {
      return undefined;
    }
    
    const buyPrice = parseFloat(bestBuy.price);
    const sellPrice = parseFloat(bestSell.price);
    
    return ((buyPrice + sellPrice) / 2).toFixed(8);
  }
  
  /**
   * Get the base asset
   * @returns Base asset
   */
  public getBaseAsset(): string {
    return this.baseAsset;
  }
  
  /**
   * Get the quote asset
   * @returns Quote asset
   */
  public getQuoteAsset(): string {
    return this.quoteAsset;
  }
  
  /**
   * Check if the orderbook is synced
   * @returns True if the orderbook is synced
   */
  public isSynced(): boolean {
    return this.synced;
  }
  
  /**
   * Match an order
   * @param side Order side
   * @param amount Order amount
   * @param price Order price
   * @returns Matching orders
   */
  public matchOrder(side: OrderSide, amount: string, price: string): Order[] {
    // Get the orders to match against
    const orders = side === OrderSide.BUY ? this.sellOrders : this.buyOrders;
    
    // Convert amount and price to numbers
    const orderAmount = parseFloat(amount);
    const orderPrice = parseFloat(price);
    
    // Find matching orders
    const matchingOrders: Order[] = [];
    let remainingAmount = orderAmount;
    
    for (const order of orders) {
      // Check if the order matches
      const orderSide = order.side;
      const orderOrderPrice = parseFloat(order.price);
      const orderOrderAmount = parseFloat(order.amount);
      
      // Check if the price matches
      if (
        (side === OrderSide.BUY && orderOrderPrice > orderPrice) ||
        (side === OrderSide.SELL && orderOrderPrice < orderPrice)
      ) {
        continue;
      }
      
      // Add the order to the matching orders
      matchingOrders.push(order);
      
      // Update the remaining amount
      remainingAmount -= orderOrderAmount;
      
      // Check if we've matched enough orders
      if (remainingAmount <= 0) {
        break;
      }
    }
    
    return matchingOrders;
  }
}

/**
 * Create a new orderbook
 * @param client DarkSwap client
 * @param options Orderbook options
 * @returns Orderbook instance
 */
export function createOrderbook(client: DarkSwapClient, options: OrderbookOptions = {}): Orderbook {
  return new Orderbook(client, options);
}