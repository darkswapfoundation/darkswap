import { WebSocketEventType, WebSocketChannelType } from '../index';
import { WebSocketServer } from '../index';
import { db } from '../../db';
import { logger } from '../../utils/logger';

/**
 * Orderbook handler
 */
export class OrderbookHandler {
  private webSocketServer: WebSocketServer;
  
  /**
   * Creates a new orderbook handler
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
  }
  
  /**
   * Publishes an orderbook update
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  public async publishOrderbookUpdate(baseAsset: string, quoteAsset: string): Promise<void> {
    try {
      // Get the bids
      const bids = await db.orders
        .find({
          baseAsset,
          quoteAsset,
          type: 'buy',
          status: 'open',
        })
        .sort({ price: -1 })
        .toArray();
      
      // Get the asks
      const asks = await db.orders
        .find({
          baseAsset,
          quoteAsset,
          type: 'sell',
          status: 'open',
        })
        .sort({ price: 1 })
        .toArray();
      
      // Create the orderbook update
      const orderbookUpdate = {
        baseAsset,
        quoteAsset,
        bids,
        asks,
        timestamp: new Date(),
      };
      
      // Publish the orderbook update
      this.webSocketServer.publish(
        WebSocketChannelType.ORDERBOOK,
        WebSocketEventType.ORDERBOOK_UPDATE,
        orderbookUpdate,
        { baseAsset, quoteAsset }
      );
      
      logger.debug('Published orderbook update', { baseAsset, quoteAsset });
    } catch (error) {
      logger.error('Error publishing orderbook update', error);
    }
  }
  
  /**
   * Publishes an orderbook update for all trading pairs
   */
  public async publishAllOrderbookUpdates(): Promise<void> {
    try {
      // Get all trading pairs
      const tradingPairs = await db.tradingPairs.find().toArray();
      
      // Publish an orderbook update for each trading pair
      for (const pair of tradingPairs) {
        await this.publishOrderbookUpdate(pair.baseAsset, pair.quoteAsset);
      }
      
      logger.debug('Published all orderbook updates');
    } catch (error) {
      logger.error('Error publishing all orderbook updates', error);
    }
  }
  
  /**
   * Starts publishing orderbook updates periodically
   * @param interval Interval in milliseconds
   */
  public startPeriodicUpdates(interval: number = 1000): void {
    // Publish all orderbook updates immediately
    this.publishAllOrderbookUpdates();
    
    // Publish all orderbook updates periodically
    setInterval(() => {
      this.publishAllOrderbookUpdates();
    }, interval);
    
    logger.info('Started periodic orderbook updates', { interval });
  }
}

/**
 * Creates a new orderbook handler
 * @param webSocketServer WebSocket server
 * @returns Orderbook handler
 */
export function createOrderbookHandler(webSocketServer: WebSocketServer): OrderbookHandler {
  return new OrderbookHandler(webSocketServer);
}