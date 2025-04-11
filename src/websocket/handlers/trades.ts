import { WebSocketEventType, WebSocketChannelType } from '../index';
import { WebSocketServer } from '../index';
import { db } from '../../db';
import { logger } from '../../utils/logger';

/**
 * Trades handler
 */
export class TradesHandler {
  private webSocketServer: WebSocketServer;
  
  /**
   * Creates a new trades handler
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
  }
  
  /**
   * Handles a new trade
   * @param trade Trade
   */
  public handleNewTrade(trade: any): void {
    try {
      // Publish the trade to the public trades channel
      this.webSocketServer.publish(
        WebSocketChannelType.TRADES,
        WebSocketEventType.TRADE_CREATED,
        trade,
        { baseAsset: trade.baseAsset, quoteAsset: trade.quoteAsset }
      );
      
      // Publish the trade to the private trades channel for the buyer
      this.webSocketServer.publishToUser(
        trade.buyUserId,
        WebSocketEventType.TRADE_CREATED,
        trade
      );
      
      // Publish the trade to the private trades channel for the seller
      this.webSocketServer.publishToUser(
        trade.sellUserId,
        WebSocketEventType.TRADE_CREATED,
        trade
      );
      
      logger.debug('Published new trade', { tradeId: trade.id });
    } catch (error) {
      logger.error('Error publishing new trade', error);
    }
  }
  
  /**
   * Handles a trade update
   * @param trade Trade
   */
  public handleTradeUpdate(trade: any): void {
    try {
      // Publish the trade update to the public trades channel
      this.webSocketServer.publish(
        WebSocketChannelType.TRADES,
        WebSocketEventType.TRADE_UPDATED,
        trade,
        { baseAsset: trade.baseAsset, quoteAsset: trade.quoteAsset }
      );
      
      // Publish the trade update to the private trades channel for the buyer
      this.webSocketServer.publishToUser(
        trade.buyUserId,
        WebSocketEventType.TRADE_UPDATED,
        trade
      );
      
      // Publish the trade update to the private trades channel for the seller
      this.webSocketServer.publishToUser(
        trade.sellUserId,
        WebSocketEventType.TRADE_UPDATED,
        trade
      );
      
      logger.debug('Published trade update', { tradeId: trade.id });
    } catch (error) {
      logger.error('Error publishing trade update', error);
    }
  }
  
  /**
   * Handles a trade cancellation
   * @param trade Trade
   */
  public handleTradeCancellation(trade: any): void {
    try {
      // Publish the trade cancellation to the public trades channel
      this.webSocketServer.publish(
        WebSocketChannelType.TRADES,
        WebSocketEventType.TRADE_CANCELLED,
        trade,
        { baseAsset: trade.baseAsset, quoteAsset: trade.quoteAsset }
      );
      
      // Publish the trade cancellation to the private trades channel for the buyer
      this.webSocketServer.publishToUser(
        trade.buyUserId,
        WebSocketEventType.TRADE_CANCELLED,
        trade
      );
      
      // Publish the trade cancellation to the private trades channel for the seller
      this.webSocketServer.publishToUser(
        trade.sellUserId,
        WebSocketEventType.TRADE_CANCELLED,
        trade
      );
      
      logger.debug('Published trade cancellation', { tradeId: trade.id });
    } catch (error) {
      logger.error('Error publishing trade cancellation', error);
    }
  }
  
  /**
   * Publishes recent trades for a trading pair
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param limit Limit
   */
  public async publishRecentTrades(baseAsset: string, quoteAsset: string, limit: number = 100): Promise<void> {
    try {
      // Get recent trades
      const trades = await db.trades
        .find({
          baseAsset,
          quoteAsset,
          status: 'completed',
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      // Publish recent trades
      this.webSocketServer.publish(
        WebSocketChannelType.TRADES,
        WebSocketEventType.TRADE_CREATED,
        { trades },
        { baseAsset, quoteAsset }
      );
      
      logger.debug('Published recent trades', { baseAsset, quoteAsset, count: trades.length });
    } catch (error) {
      logger.error('Error publishing recent trades', error);
    }
  }
  
  /**
   * Publishes recent trades for all trading pairs
   * @param limit Limit
   */
  public async publishAllRecentTrades(limit: number = 100): Promise<void> {
    try {
      // Get all trading pairs
      const tradingPairs = await db.tradingPairs.find().toArray();
      
      // Publish recent trades for each trading pair
      for (const pair of tradingPairs) {
        await this.publishRecentTrades(pair.baseAsset, pair.quoteAsset, limit);
      }
      
      logger.debug('Published all recent trades');
    } catch (error) {
      logger.error('Error publishing all recent trades', error);
    }
  }
}

/**
 * Creates a new trades handler
 * @param webSocketServer WebSocket server
 * @returns Trades handler
 */
export function createTradesHandler(webSocketServer: WebSocketServer): TradesHandler {
  return new TradesHandler(webSocketServer);
}