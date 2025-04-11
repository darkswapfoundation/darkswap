import { WebSocketEventType, WebSocketChannelType } from '../index';
import { WebSocketServer } from '../index';
import { db } from '../../db';
import { logger } from '../../utils/logger';

/**
 * Ticker handler
 */
export class TickerHandler {
  private webSocketServer: WebSocketServer;
  
  /**
   * Creates a new ticker handler
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
  }
  
  /**
   * Publishes ticker data for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   */
  public async publishTickerData(baseAsset: string, quoteAsset: string): Promise<void> {
    try {
      // Get the latest trade
      const latestTrade = await db.trades
        .find({
          baseAsset,
          quoteAsset,
          status: 'completed',
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      
      // Get the highest bid
      const highestBid = await db.orders
        .find({
          baseAsset,
          quoteAsset,
          type: 'buy',
          status: 'open',
        })
        .sort({ price: -1 })
        .limit(1)
        .toArray();
      
      // Get the lowest ask
      const lowestAsk = await db.orders
        .find({
          baseAsset,
          quoteAsset,
          type: 'sell',
          status: 'open',
        })
        .sort({ price: 1 })
        .limit(1)
        .toArray();
      
      // Get the 24-hour volume
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const trades24h = await db.trades
        .find({
          baseAsset,
          quoteAsset,
          status: 'completed',
          createdAt: { $gte: oneDayAgo },
        })
        .toArray();
      
      // Calculate the 24-hour volume
      const volume24h = trades24h.reduce(
        (total, trade) => total + parseFloat(trade.amount),
        0
      );
      
      // Calculate the 24-hour price change
      const firstTrade24h = trades24h[trades24h.length - 1];
      const lastTrade24h = trades24h[0];
      const priceChange24h = lastTrade24h && firstTrade24h
        ? ((parseFloat(lastTrade24h.price) - parseFloat(firstTrade24h.price)) / parseFloat(firstTrade24h.price)) * 100
        : 0;
      
      // Create the ticker data
      const tickerData = {
        pair: `${baseAsset}/${quoteAsset}`,
        last: latestTrade[0]?.price || '0',
        bid: highestBid[0]?.price || '0',
        ask: lowestAsk[0]?.price || '0',
        volume: volume24h.toString(),
        change24h: priceChange24h.toString(),
        timestamp: new Date(),
      };
      
      // Publish the ticker data
      this.webSocketServer.publish(
        WebSocketChannelType.TICKER,
        WebSocketEventType.TICKER_UPDATE,
        tickerData,
        { baseAsset, quoteAsset }
      );
      
      logger.debug('Published ticker data', { baseAsset, quoteAsset });
    } catch (error) {
      logger.error('Error publishing ticker data', error);
    }
  }
  
  /**
   * Publishes ticker data for all trading pairs
   */
  public async publishAllTickerData(): Promise<void> {
    try {
      // Get all trading pairs
      const tradingPairs = await db.tradingPairs.find().toArray();
      
      // Publish ticker data for each trading pair
      for (const pair of tradingPairs) {
        await this.publishTickerData(pair.baseAsset, pair.quoteAsset);
      }
      
      logger.debug('Published all ticker data');
    } catch (error) {
      logger.error('Error publishing all ticker data', error);
    }
  }
  
  /**
   * Starts publishing ticker data periodically
   * @param interval Interval in milliseconds
   */
  public startPeriodicUpdates(interval: number = 5000): void {
    // Publish all ticker data immediately
    this.publishAllTickerData();
    
    // Publish all ticker data periodically
    setInterval(() => {
      this.publishAllTickerData();
    }, interval);
    
    logger.info('Started periodic ticker updates', { interval });
  }
  
  /**
   * Publishes price updates for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param price Price
   */
  public publishPriceUpdate(baseAsset: string, quoteAsset: string, price: string): void {
    try {
      // Create the price update
      const priceUpdate = {
        pair: `${baseAsset}/${quoteAsset}`,
        price,
        timestamp: new Date(),
      };
      
      // Publish the price update
      this.webSocketServer.publish(
        WebSocketChannelType.TICKER,
        WebSocketEventType.PRICE_UPDATE,
        priceUpdate,
        { baseAsset, quoteAsset }
      );
      
      logger.debug('Published price update', { baseAsset, quoteAsset, price });
    } catch (error) {
      logger.error('Error publishing price update', error);
    }
  }
}

/**
 * Creates a new ticker handler
 * @param webSocketServer WebSocket server
 * @returns Ticker handler
 */
export function createTickerHandler(webSocketServer: WebSocketServer): TickerHandler {
  return new TickerHandler(webSocketServer);
}