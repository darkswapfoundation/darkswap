import { WebSocketEventType, WebSocketChannelType } from '../index';
import { WebSocketServer } from '../index';
import { db } from '../../db';
import { logger } from '../../utils/logger';

/**
 * Orders handler
 */
export class OrdersHandler {
  private webSocketServer: WebSocketServer;
  
  /**
   * Creates a new orders handler
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
  }
  
  /**
   * Handles a new order
   * @param order Order
   */
  public handleNewOrder(order: any): void {
    try {
      // Publish the order to the public orderbook channel
      this.webSocketServer.publish(
        WebSocketChannelType.ORDERBOOK,
        WebSocketEventType.ORDER_CREATED,
        order,
        { baseAsset: order.baseAsset, quoteAsset: order.quoteAsset }
      );
      
      // Publish the order to the private orders channel for the user
      this.webSocketServer.publishToUser(
        order.userId,
        WebSocketEventType.ORDER_CREATED,
        order
      );
      
      logger.debug('Published new order', { orderId: order.id });
    } catch (error) {
      logger.error('Error publishing new order', error);
    }
  }
  
  /**
   * Handles an order update
   * @param order Order
   */
  public handleOrderUpdate(order: any): void {
    try {
      // Publish the order update to the public orderbook channel
      this.webSocketServer.publish(
        WebSocketChannelType.ORDERBOOK,
        WebSocketEventType.ORDER_UPDATED,
        order,
        { baseAsset: order.baseAsset, quoteAsset: order.quoteAsset }
      );
      
      // Publish the order update to the private orders channel for the user
      this.webSocketServer.publishToUser(
        order.userId,
        WebSocketEventType.ORDER_UPDATED,
        order
      );
      
      logger.debug('Published order update', { orderId: order.id });
    } catch (error) {
      logger.error('Error publishing order update', error);
    }
  }
  
  /**
   * Handles an order cancellation
   * @param order Order
   */
  public handleOrderCancellation(order: any): void {
    try {
      // Publish the order cancellation to the public orderbook channel
      this.webSocketServer.publish(
        WebSocketChannelType.ORDERBOOK,
        WebSocketEventType.ORDER_CANCELLED,
        order,
        { baseAsset: order.baseAsset, quoteAsset: order.quoteAsset }
      );
      
      // Publish the order cancellation to the private orders channel for the user
      this.webSocketServer.publishToUser(
        order.userId,
        WebSocketEventType.ORDER_CANCELLED,
        order
      );
      
      logger.debug('Published order cancellation', { orderId: order.id });
    } catch (error) {
      logger.error('Error publishing order cancellation', error);
    }
  }
  
  /**
   * Publishes open orders for a user
   * @param userId User ID
   */
  public async publishUserOrders(userId: string): Promise<void> {
    try {
      // Get open orders for the user
      const orders = await db.orders
        .find({
          userId,
          status: 'open',
        })
        .sort({ createdAt: -1 })
        .toArray();
      
      // Publish open orders
      this.webSocketServer.publishToUser(
        userId,
        WebSocketEventType.ORDER_CREATED,
        { orders }
      );
      
      logger.debug('Published user orders', { userId, count: orders.length });
    } catch (error) {
      logger.error('Error publishing user orders', error);
    }
  }
  
  /**
   * Publishes open orders for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  public async publishPairOrders(baseAsset: string, quoteAsset: string): Promise<void> {
    try {
      // Get open buy orders
      const buyOrders = await db.orders
        .find({
          baseAsset,
          quoteAsset,
          type: 'buy',
          status: 'open',
        })
        .sort({ price: -1 })
        .toArray();
      
      // Get open sell orders
      const sellOrders = await db.orders
        .find({
          baseAsset,
          quoteAsset,
          type: 'sell',
          status: 'open',
        })
        .sort({ price: 1 })
        .toArray();
      
      // Publish open orders
      this.webSocketServer.publish(
        WebSocketChannelType.ORDERBOOK,
        WebSocketEventType.ORDER_CREATED,
        { buyOrders, sellOrders },
        { baseAsset, quoteAsset }
      );
      
      logger.debug('Published pair orders', { baseAsset, quoteAsset, buyCount: buyOrders.length, sellCount: sellOrders.length });
    } catch (error) {
      logger.error('Error publishing pair orders', error);
    }
  }
  
  /**
   * Publishes open orders for all trading pairs
   */
  public async publishAllPairOrders(): Promise<void> {
    try {
      // Get all trading pairs
      const tradingPairs = await db.tradingPairs.find().toArray();
      
      // Publish open orders for each trading pair
      for (const pair of tradingPairs) {
        await this.publishPairOrders(pair.baseAsset, pair.quoteAsset);
      }
      
      logger.debug('Published all pair orders');
    } catch (error) {
      logger.error('Error publishing all pair orders', error);
    }
  }
}

/**
 * Creates a new orders handler
 * @param webSocketServer WebSocket server
 * @returns Orders handler
 */
export function createOrdersHandler(webSocketServer: WebSocketServer): OrdersHandler {
  return new OrdersHandler(webSocketServer);
}