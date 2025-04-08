/**
 * OrderMatcher.ts - Order matching algorithm
 * 
 * This file provides an implementation of an order matching algorithm for the DarkSwap exchange.
 * It matches orders based on price-time priority.
 */

import { Order, OrderSide, OrderStatus, Trade, TradeStatus } from '../types';
import { OrderBook } from './OrderBook';

/**
 * Match result
 */
export interface MatchResult {
  /**
   * Trades
   */
  trades: Trade[];
  
  /**
   * Remaining order
   */
  remainingOrder: Order | null;
}

/**
 * Order matcher
 */
export class OrderMatcher {
  /**
   * Order books
   */
  private orderBooks: Map<string, OrderBook> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    // Initialize order books
  }
  
  /**
   * Add order
   * @param order - Order to add
   * @returns Match result
   */
  addOrder(order: Order): MatchResult {
    // Get or create order book
    const orderBook = this.getOrCreateOrderBook(order.baseAsset, order.quoteAsset);
    
    // Match order
    const matchResult = this.matchOrder(order, orderBook);
    
    // Add remaining order to order book
    if (matchResult.remainingOrder) {
      orderBook.addOrder(matchResult.remainingOrder);
    }
    
    return matchResult;
  }
  
  /**
   * Cancel order
   * @param orderId - Order ID
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @returns Whether the order was cancelled
   */
  cancelOrder(orderId: string, baseAsset: string, quoteAsset: string): boolean {
    // Get order book
    const orderBook = this.getOrderBook(baseAsset, quoteAsset);
    
    // Check if order book exists
    if (!orderBook) {
      return false;
    }
    
    // Remove order
    return orderBook.removeOrder(orderId);
  }
  
  /**
   * Get order
   * @param orderId - Order ID
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @returns Order or undefined if not found
   */
  getOrder(orderId: string, baseAsset: string, quoteAsset: string): Order | undefined {
    // Get order book
    const orderBook = this.getOrderBook(baseAsset, quoteAsset);
    
    // Check if order book exists
    if (!orderBook) {
      return undefined;
    }
    
    // Get order
    const orderEntry = orderBook.getOrder(orderId);
    
    // Check if order exists
    if (!orderEntry) {
      return undefined;
    }
    
    return orderEntry.order;
  }
  
  /**
   * Get orders
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @param side - Order side
   * @returns Orders
   */
  getOrders(baseAsset: string, quoteAsset: string, side?: OrderSide): Order[] {
    // Get order book
    const orderBook = this.getOrderBook(baseAsset, quoteAsset);
    
    // Check if order book exists
    if (!orderBook) {
      return [];
    }
    
    // Get orders
    const orderEntries = orderBook.getOrders(side);
    
    // Return orders
    return orderEntries.map(entry => entry.order);
  }
  
  /**
   * Get price levels
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @param side - Order side
   * @param depth - Maximum number of price levels to return
   * @returns Price levels
   */
  getPriceLevels(baseAsset: string, quoteAsset: string, side: OrderSide, depth?: number): { price: string; volume: string }[] {
    // Get order book
    const orderBook = this.getOrderBook(baseAsset, quoteAsset);
    
    // Check if order book exists
    if (!orderBook) {
      return [];
    }
    
    // Get price levels
    const priceLevels = orderBook.getPriceLevels(side, depth);
    
    // Return price levels
    return priceLevels.map(level => ({
      price: level.price,
      volume: level.volume,
    }));
  }
  
  /**
   * Get order book
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @returns Order book or undefined if not found
   */
  private getOrderBook(baseAsset: string, quoteAsset: string): OrderBook | undefined {
    // Get order book key
    const key = this.getOrderBookKey(baseAsset, quoteAsset);
    
    // Return order book
    return this.orderBooks.get(key);
  }
  
  /**
   * Get or create order book
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @returns Order book
   */
  private getOrCreateOrderBook(baseAsset: string, quoteAsset: string): OrderBook {
    // Get order book key
    const key = this.getOrderBookKey(baseAsset, quoteAsset);
    
    // Check if order book exists
    let orderBook = this.orderBooks.get(key);
    
    // Create order book if it doesn't exist
    if (!orderBook) {
      orderBook = new OrderBook(baseAsset, quoteAsset);
      this.orderBooks.set(key, orderBook);
    }
    
    return orderBook;
  }
  
  /**
   * Get order book key
   * @param baseAsset - Base asset
   * @param quoteAsset - Quote asset
   * @returns Order book key
   */
  private getOrderBookKey(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset}/${quoteAsset}`;
  }
  
  /**
   * Match order
   * @param order - Order to match
   * @param orderBook - Order book
   * @returns Match result
   */
  private matchOrder(order: Order, orderBook: OrderBook): MatchResult {
    // Initialize result
    const result: MatchResult = {
      trades: [],
      remainingOrder: { ...order },
    };
    
    // Get opposite side
    const oppositeSide = order.side === OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy;
    
    // Get best price
    const bestPrice = order.side === OrderSide.Buy
      ? orderBook.getBestAsk()
      : orderBook.getBestBid();
    
    // Check if there are any orders on the opposite side
    if (!bestPrice) {
      return result;
    }
    
    // Check if price is acceptable
    const isPriceAcceptable = order.side === OrderSide.Buy
      ? parseFloat(order.price) >= parseFloat(bestPrice) // Buy order: our price >= best sell price
      : parseFloat(order.price) <= parseFloat(bestPrice); // Sell order: our price <= best buy price
    
    if (!isPriceAcceptable) {
      return result;
    }
    
    // Get matching orders
    const matchingOrders = orderBook.getOrders(oppositeSide);
    
    // Sort matching orders by price and time
    matchingOrders.sort((a, b) => {
      // Sort by price
      const priceComparison = order.side === OrderSide.Buy
        ? parseFloat(a.order.price) - parseFloat(b.order.price) // Buy order: ascending price
        : parseFloat(b.order.price) - parseFloat(a.order.price); // Sell order: descending price
      
      // If prices are equal, sort by time
      if (priceComparison === 0) {
        return a.timestamp - b.timestamp;
      }
      
      return priceComparison;
    });
    
    // Match orders
    let remainingAmount = parseFloat(order.amount);
    
    for (const matchingOrder of matchingOrders) {
      // Check if we have any remaining amount
      if (remainingAmount <= 0) {
        break;
      }
      
      // Check if price is acceptable
      const isPriceAcceptable = order.side === OrderSide.Buy
        ? parseFloat(order.price) >= parseFloat(matchingOrder.order.price) // Buy order: our price >= matching price
        : parseFloat(order.price) <= parseFloat(matchingOrder.order.price); // Sell order: our price <= matching price
      
      if (!isPriceAcceptable) {
        continue;
      }
      
      // Calculate trade amount
      const matchingAmount = parseFloat(matchingOrder.remainingAmount);
      const tradeAmount = Math.min(remainingAmount, matchingAmount);
      
      // Create trade
      const trade: Trade = {
        id: this.generateTradeId(),
        orderId: matchingOrder.order.id,
        taker: order.maker,
        maker: matchingOrder.order.maker,
        amount: tradeAmount.toString(),
        price: matchingOrder.order.price,
        timestamp: Date.now(),
        status: TradeStatus.Completed,
      };
      
      // Add trade to result
      result.trades.push(trade);
      
      // Update remaining amount
      remainingAmount -= tradeAmount;
      
      // Update matching order
      const remainingMatchingAmount = matchingAmount - tradeAmount;
      
      if (remainingMatchingAmount <= 0) {
        // Remove matching order
        orderBook.removeOrder(matchingOrder.order.id);
      } else {
        // Update matching order
        orderBook.updateOrder(matchingOrder.order.id, remainingMatchingAmount.toString());
      }
    }
    
    // Update remaining order
    if (remainingAmount <= 0) {
      // Order is fully filled
      result.remainingOrder = null;
    } else if (result.remainingOrder) {
      // Order is partially filled
      result.remainingOrder.amount = remainingAmount.toString();
    }
    
    return result;
  }
  
  /**
   * Generate trade ID
   * @returns Trade ID
   */
  private generateTradeId(): string {
    return `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Default export
 */
export default OrderMatcher;