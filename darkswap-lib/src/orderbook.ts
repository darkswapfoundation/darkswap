/**
 * Orderbook functionality for darkswap-lib
 */

import { Network } from './network';
import { Order, OrderSide, PeerId } from './types';

/**
 * Orderbook class
 */
export class Orderbook {
  private orders: Map<string, Order> = new Map();
  private topic = 'darkswap/orderbook/v1';

  /**
   * Create a new Orderbook
   * @param network Network instance
   */
  constructor(private network: Network) {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    this.network.addEventListener('messageReceived', (event) => {
      if (event.type === 'messageReceived' && event.topic === this.topic) {
        try {
          const message = JSON.parse(new TextDecoder().decode(event.message));
          if (message.type === 'add' || message.type === 'update') {
            this.addOrder(message.order);
          } else if (message.type === 'remove') {
            this.removeOrder(message.order.id);
          }
        } catch (error) {
          console.error('Failed to parse orderbook message:', error);
        }
      }
    });
  }

  /**
   * Add an order to the orderbook
   * @param order Order to add
   */
  addOrder(order: Order): void {
    this.orders.set(order.id, order);
  }

  /**
   * Remove an order from the orderbook
   * @param orderId Order ID to remove
   */
  removeOrder(orderId: string): void {
    this.orders.delete(orderId);
  }

  /**
   * Get an order from the orderbook
   * @param orderId Order ID to get
   * @returns Order or undefined if not found
   */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get all orders from the orderbook
   * @returns Array of orders
   */
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Array of orders
   */
  getOrdersForPair(baseAsset: string, quoteAsset: string): Order[] {
    return this.getAllOrders().filter(
      (order) => order.baseAsset === baseAsset && order.quoteAsset === quoteAsset
    );
  }

  /**
   * Get buy orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Array of buy orders
   */
  getBuyOrders(baseAsset: string, quoteAsset: string): Order[] {
    return this.getOrdersForPair(baseAsset, quoteAsset).filter(
      (order) => order.side === OrderSide.Buy
    );
  }

  /**
   * Get sell orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Array of sell orders
   */
  getSellOrders(baseAsset: string, quoteAsset: string): Order[] {
    return this.getOrdersForPair(baseAsset, quoteAsset).filter(
      (order) => order.side === OrderSide.Sell
    );
  }

  /**
   * Get the best bid for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Best bid or undefined if no bids
   */
  getBestBid(baseAsset: string, quoteAsset: string): Order | undefined {
    const buyOrders = this.getBuyOrders(baseAsset, quoteAsset);
    if (buyOrders.length === 0) {
      return undefined;
    }

    return buyOrders.reduce((best, order) => {
      const bestPrice = parseFloat(best.price);
      const orderPrice = parseFloat(order.price);
      return orderPrice > bestPrice ? order : best;
    });
  }

  /**
   * Get the best ask for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Best ask or undefined if no asks
   */
  getBestAsk(baseAsset: string, quoteAsset: string): Order | undefined {
    const sellOrders = this.getSellOrders(baseAsset, quoteAsset);
    if (sellOrders.length === 0) {
      return undefined;
    }

    return sellOrders.reduce((best, order) => {
      const bestPrice = parseFloat(best.price);
      const orderPrice = parseFloat(order.price);
      return orderPrice < bestPrice ? order : best;
    });
  }

  /**
   * Create an order
   * @param order Order to create
   */
  async createOrder(order: Omit<Order, 'id' | 'timestamp' | 'signature'>): Promise<Order> {
    const id = this.generateOrderId();
    const timestamp = Date.now();
    const signature = new Uint8Array(0); // Placeholder, should be signed in a real implementation

    const newOrder: Order = {
      ...order,
      id,
      timestamp,
      signature,
    };

    await this.publishOrder('add', newOrder);
    return newOrder;
  }

  /**
   * Cancel an order
   * @param orderId Order ID to cancel
   */
  async cancelOrder(orderId: string): Promise<void> {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    await this.publishOrder('remove', order);
  }

  /**
   * Update an order
   * @param order Order to update
   */
  async updateOrder(order: Order): Promise<void> {
    await this.publishOrder('update', order);
  }

  /**
   * Publish an order to the network
   * @param type Message type
   * @param order Order to publish
   */
  private async publishOrder(type: 'add' | 'remove' | 'update', order: Order): Promise<void> {
    const message = {
      type,
      order,
    };

    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(JSON.stringify(message));

    await this.network.publish(this.topic, messageBytes);
  }

  /**
   * Generate a random order ID
   * @returns Random order ID
   */
  private generateOrderId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}