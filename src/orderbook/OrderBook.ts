/**
 * OrderBook.ts - Order book implementation
 * 
 * This file provides an implementation of an order book for the DarkSwap exchange.
 * It includes data structures for efficient order matching and execution.
 */

import { Order, OrderSide, OrderStatus } from '../types';

/**
 * Order book entry
 */
interface OrderBookEntry {
  /**
   * Order
   */
  order: Order;
  
  /**
   * Remaining amount
   */
  remainingAmount: string;
  
  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Price level
 */
interface PriceLevel {
  /**
   * Price
   */
  price: string;
  
  /**
   * Orders at this price level
   */
  orders: OrderBookEntry[];
  
  /**
   * Total volume at this price level
   */
  volume: string;
}

/**
 * Order book side
 */
class OrderBookSide {
  /**
   * Price levels
   */
  private priceLevels: Map<string, PriceLevel> = new Map();
  
  /**
   * Sorted prices
   */
  private sortedPrices: string[] = [];
  
  /**
   * Order side
   */
  private side: OrderSide;
  
  /**
   * Constructor
   * @param side - Order side
   */
  constructor(side: OrderSide) {
    this.side = side;
  }
  
  /**
   * Add order
   * @param order - Order
   * @returns Whether the order was added
   */
  addOrder(order: Order): boolean {
    // Check if order is valid
    if (!this.isValidOrder(order)) {
      return false;
    }
    
    // Get price level
    let priceLevel = this.priceLevels.get(order.price);
    
    // Create price level if it doesn't exist
    if (!priceLevel) {
      priceLevel = {
        price: order.price,
        orders: [],
        volume: '0',
      };
      
      this.priceLevels.set(order.price, priceLevel);
      this.insertSortedPrice(order.price);
    }
    
    // Create order book entry
    const orderBookEntry: OrderBookEntry = {
      order,
      remainingAmount: order.amount,
      timestamp: order.timestamp,
    };
    
    // Add order to price level
    priceLevel.orders.push(orderBookEntry);
    
    // Update volume
    priceLevel.volume = this.addStrings(priceLevel.volume, order.amount);
    
    return true;
  }
  
  /**
   * Remove order
   * @param orderId - Order ID
   * @returns Whether the order was removed
   */
  removeOrder(orderId: string): boolean {
    // Iterate through price levels
    for (const [price, priceLevel] of this.priceLevels.entries()) {
      // Find order index
      const orderIndex = priceLevel.orders.findIndex(entry => entry.order.id === orderId);
      
      // Check if order was found
      if (orderIndex !== -1) {
        // Get order
        const order = priceLevel.orders[orderIndex];
        
        // Update volume
        priceLevel.volume = this.subtractStrings(priceLevel.volume, order.remainingAmount);
        
        // Remove order
        priceLevel.orders.splice(orderIndex, 1);
        
        // Remove price level if empty
        if (priceLevel.orders.length === 0) {
          this.priceLevels.delete(price);
          this.removeSortedPrice(price);
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Update order
   * @param orderId - Order ID
   * @param remainingAmount - Remaining amount
   * @returns Whether the order was updated
   */
  updateOrder(orderId: string, remainingAmount: string): boolean {
    // Iterate through price levels
    for (const [price, priceLevel] of this.priceLevels.entries()) {
      // Find order index
      const orderIndex = priceLevel.orders.findIndex(entry => entry.order.id === orderId);
      
      // Check if order was found
      if (orderIndex !== -1) {
        // Get order
        const order = priceLevel.orders[orderIndex];
        
        // Update volume
        priceLevel.volume = this.subtractStrings(priceLevel.volume, order.remainingAmount);
        priceLevel.volume = this.addStrings(priceLevel.volume, remainingAmount);
        
        // Update order
        order.remainingAmount = remainingAmount;
        
        // Remove order if remaining amount is zero
        if (remainingAmount === '0') {
          priceLevel.orders.splice(orderIndex, 1);
          
          // Remove price level if empty
          if (priceLevel.orders.length === 0) {
            this.priceLevels.delete(price);
            this.removeSortedPrice(price);
          }
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get order
   * @param orderId - Order ID
   * @returns Order book entry or undefined if not found
   */
  getOrder(orderId: string): OrderBookEntry | undefined {
    // Iterate through price levels
    for (const priceLevel of this.priceLevels.values()) {
      // Find order
      const order = priceLevel.orders.find(entry => entry.order.id === orderId);
      
      // Check if order was found
      if (order) {
        return order;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get best price
   * @returns Best price or undefined if no orders
   */
  getBestPrice(): string | undefined {
    // Check if there are any orders
    if (this.sortedPrices.length === 0) {
      return undefined;
    }
    
    // Return best price
    return this.side === OrderSide.Buy
      ? this.sortedPrices[this.sortedPrices.length - 1] // Highest price for buy orders
      : this.sortedPrices[0]; // Lowest price for sell orders
  }
  
  /**
   * Get best orders
   * @param amount - Amount to match
   * @returns Best orders
   */
  getBestOrders(amount: string): OrderBookEntry[] {
    // Check if there are any orders
    if (this.sortedPrices.length === 0) {
      return [];
    }
    
    // Get sorted prices
    const prices = this.side === OrderSide.Buy
      ? [...this.sortedPrices].reverse() // Highest to lowest for buy orders
      : [...this.sortedPrices]; // Lowest to highest for sell orders
    
    // Get best orders
    const bestOrders: OrderBookEntry[] = [];
    let remainingAmount = amount;
    
    // Iterate through prices
    for (const price of prices) {
      // Get price level
      const priceLevel = this.priceLevels.get(price)!;
      
      // Iterate through orders
      for (const order of priceLevel.orders) {
        // Check if we need more orders
        if (this.compareStrings(remainingAmount, '0') <= 0) {
          break;
        }
        
        // Add order
        bestOrders.push(order);
        
        // Update remaining amount
        remainingAmount = this.subtractStrings(remainingAmount, order.remainingAmount);
      }
      
      // Check if we have enough orders
      if (this.compareStrings(remainingAmount, '0') <= 0) {
        break;
      }
    }
    
    return bestOrders;
  }
  
  /**
   * Get orders
   * @returns All orders
   */
  getOrders(): OrderBookEntry[] {
    // Get all orders
    const orders: OrderBookEntry[] = [];
    
    // Iterate through price levels
    for (const priceLevel of this.priceLevels.values()) {
      // Add orders
      orders.push(...priceLevel.orders);
    }
    
    return orders;
  }
  
  /**
   * Get price levels
   * @param depth - Maximum number of price levels to return
   * @returns Price levels
   */
  getPriceLevels(depth?: number): PriceLevel[] {
    // Get sorted prices
    const prices = this.side === OrderSide.Buy
      ? [...this.sortedPrices].reverse() // Highest to lowest for buy orders
      : [...this.sortedPrices]; // Lowest to highest for sell orders
    
    // Limit depth
    if (depth !== undefined && depth > 0) {
      prices.splice(depth);
    }
    
    // Get price levels
    return prices.map(price => this.priceLevels.get(price)!);
  }
  
  /**
   * Get total volume
   * @returns Total volume
   */
  getTotalVolume(): string {
    // Calculate total volume
    let totalVolume = '0';
    
    // Iterate through price levels
    for (const priceLevel of this.priceLevels.values()) {
      // Add volume
      totalVolume = this.addStrings(totalVolume, priceLevel.volume);
    }
    
    return totalVolume;
  }
  
  /**
   * Clear order book side
   */
  clear(): void {
    this.priceLevels.clear();
    this.sortedPrices = [];
  }
  
  /**
   * Check if order is valid
   * @param order - Order
   * @returns Whether the order is valid
   */
  private isValidOrder(order: Order): boolean {
    // Check if order is for this side
    return order.side === this.side;
  }
  
  /**
   * Insert price into sorted prices
   * @param price - Price
   */
  private insertSortedPrice(price: string): void {
    // Find insertion index
    let index = 0;
    while (index < this.sortedPrices.length && this.compareStrings(price, this.sortedPrices[index]) > 0) {
      index++;
    }
    
    // Insert price
    this.sortedPrices.splice(index, 0, price);
  }
  
  /**
   * Remove price from sorted prices
   * @param price - Price
   */
  private removeSortedPrice(price: string): void {
    // Find price index
    const index = this.sortedPrices.indexOf(price);
    
    // Remove price
    if (index !== -1) {
      this.sortedPrices.splice(index, 1);
    }
  }
  
  /**
   * Compare strings as numbers
   * @param a - First string
   * @param b - Second string
   * @returns Comparison result
   */
  private compareStrings(a: string, b: string): number {
    // Parse strings as numbers
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    // Compare numbers
    return numA - numB;
  }
  
  /**
   * Add strings as numbers
   * @param a - First string
   * @param b - Second string
   * @returns Sum
   */
  private addStrings(a: string, b: string): string {
    // Parse strings as numbers
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    // Add numbers
    return (numA + numB).toString();
  }
  
  /**
   * Subtract strings as numbers
   * @param a - First string
   * @param b - Second string
   * @returns Difference
   */
  private subtractStrings(a: string, b: string): string {
    // Parse strings as numbers
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    // Subtract numbers
    return Math.max(0, numA - numB).toString();
  }
}

/**
 * Order book
 */
export class OrderBook {
  /**
   * Buy orders
   */
  private buyOrders: OrderBookSide;
  
  /**
   * Sell orders
   */
  private sellOrders: OrderBookSide;
  
  /**
   * Base asset
   */
  private baseAsset: string;
  
  /**
   * Quote asset
   */
  private quoteAsset: string;
  
  /**
   * Constructor
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   */
  constructor(baseAsset: string, quoteAsset: string) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.buyOrders = new OrderBookSide(OrderSide.Buy);
    this.sellOrders = new OrderBookSide(OrderSide.Sell);
  }
  
  /**
   * Add order
   * @param order - Order
   * @returns Whether the order was added
   */
  addOrder(order: Order): boolean {
    // Check if order is valid
    if (!this.isValidOrder(order)) {
      return false;
    }
    
    // Add order to appropriate side
    return order.side === OrderSide.Buy
      ? this.buyOrders.addOrder(order)
      : this.sellOrders.addOrder(order);
  }
  
  /**
   * Remove order
   * @param orderId - Order ID
   * @returns Whether the order was removed
   */
  removeOrder(orderId: string): boolean {
    // Try to remove from buy orders
    if (this.buyOrders.removeOrder(orderId)) {
      return true;
    }
    
    // Try to remove from sell orders
    return this.sellOrders.removeOrder(orderId);
  }
  
  /**
   * Update order
   * @param orderId - Order ID
   * @param remainingAmount - Remaining amount
   * @returns Whether the order was updated
   */
  updateOrder(orderId: string, remainingAmount: string): boolean {
    // Try to update buy orders
    if (this.buyOrders.updateOrder(orderId, remainingAmount)) {
      return true;
    }
    
    // Try to update sell orders
    return this.sellOrders.updateOrder(orderId, remainingAmount);
  }
  
  /**
   * Get order
   * @param orderId - Order ID
   * @returns Order book entry or undefined if not found
   */
  getOrder(orderId: string): OrderBookEntry | undefined {
    // Try to get from buy orders
    const buyOrder = this.buyOrders.getOrder(orderId);
    if (buyOrder) {
      return buyOrder;
    }
    
    // Try to get from sell orders
    return this.sellOrders.getOrder(orderId);
  }
  
  /**
   * Match order
   * @param order - Order to match
   * @returns Matched orders
   */
  matchOrder(order: Order): OrderBookEntry[] {
    // Check if order is valid
    if (!this.isValidOrder(order)) {
      return [];
    }
    
    // Get opposite side
    const oppositeSide = order.side === OrderSide.Buy
      ? this.sellOrders
      : this.buyOrders;
    
    // Get best price
    const bestPrice = oppositeSide.getBestPrice();
    
    // Check if there are any orders on the opposite side
    if (!bestPrice) {
      return [];
    }
    
    // Check if price is acceptable
    const isPriceAcceptable = order.side === OrderSide.Buy
      ? parseFloat(order.price) >= parseFloat(bestPrice) // Buy order: our price >= best sell price
      : parseFloat(order.price) <= parseFloat(bestPrice); // Sell order: our price <= best buy price
    
    if (!isPriceAcceptable) {
      return [];
    }
    
    // Get best orders
    return oppositeSide.getBestOrders(order.amount);
  }
  
  /**
   * Get price levels
   * @param side - Order side
   * @param depth - Maximum number of price levels to return
   * @returns Price levels
   */
  getPriceLevels(side: OrderSide, depth?: number): PriceLevel[] {
    // Get price levels from appropriate side
    return side === OrderSide.Buy
      ? this.buyOrders.getPriceLevels(depth)
      : this.sellOrders.getPriceLevels(depth);
  }
  
  /**
   * Get orders
   * @param side - Order side
   * @returns Orders
   */
  getOrders(side?: OrderSide): OrderBookEntry[] {
    // Check if side is specified
    if (side === undefined) {
      // Get all orders
      return [...this.buyOrders.getOrders(), ...this.sellOrders.getOrders()];
    }
    
    // Get orders from appropriate side
    return side === OrderSide.Buy
      ? this.buyOrders.getOrders()
      : this.sellOrders.getOrders();
  }
  
  /**
   * Get best bid
   * @returns Best bid price or undefined if no buy orders
   */
  getBestBid(): string | undefined {
    return this.buyOrders.getBestPrice();
  }
  
  /**
   * Get best ask
   * @returns Best ask price or undefined if no sell orders
   */
  getBestAsk(): string | undefined {
    return this.sellOrders.getBestPrice();
  }
  
  /**
   * Get spread
   * @returns Spread or undefined if no orders
   */
  getSpread(): string | undefined {
    // Get best bid and ask
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    
    // Check if both exist
    if (!bestBid || !bestAsk) {
      return undefined;
    }
    
    // Calculate spread
    return (parseFloat(bestAsk) - parseFloat(bestBid)).toString();
  }
  
  /**
   * Get mid price
   * @returns Mid price or undefined if no orders
   */
  getMidPrice(): string | undefined {
    // Get best bid and ask
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    
    // Check if both exist
    if (!bestBid || !bestAsk) {
      return undefined;
    }
    
    // Calculate mid price
    return ((parseFloat(bestBid) + parseFloat(bestAsk)) / 2).toString();
  }
  
  /**
   * Get total volume
   * @param side - Order side
   * @returns Total volume
   */
  getTotalVolume(side?: OrderSide): string {
    // Check if side is specified
    if (side === undefined) {
      // Get total volume from both sides
      const buyVolume = this.buyOrders.getTotalVolume();
      const sellVolume = this.sellOrders.getTotalVolume();
      
      // Add volumes
      return (parseFloat(buyVolume) + parseFloat(sellVolume)).toString();
    }
    
    // Get total volume from appropriate side
    return side === OrderSide.Buy
      ? this.buyOrders.getTotalVolume()
      : this.sellOrders.getTotalVolume();
  }
  
  /**
   * Clear order book
   */
  clear(): void {
    this.buyOrders.clear();
    this.sellOrders.clear();
  }
  
  /**
   * Check if order is valid
   * @param order - Order
   * @returns Whether the order is valid
   */
  private isValidOrder(order: Order): boolean {
    // Check if order is for this trading pair
    return order.baseAsset === this.baseAsset && order.quoteAsset === this.quoteAsset;
  }
}

/**
 * Default export
 */
export default OrderBook;