import { WebSocketServer } from '../index';
import { createOrderbookHandler, OrderbookHandler } from './orderbook';
import { createTradesHandler, TradesHandler } from './trades';
import { createOrdersHandler, OrdersHandler } from './orders';
import { createWalletHandler, WalletHandler } from './wallet';
import { createTickerHandler, TickerHandler } from './ticker';
import { createP2PHandler, P2PHandler } from './p2p';
import { logger } from '../../utils/logger';

/**
 * WebSocket handlers
 */
export class WebSocketHandlers {
  private webSocketServer: WebSocketServer;
  private orderbookHandler: OrderbookHandler;
  private tradesHandler: TradesHandler;
  private ordersHandler: OrdersHandler;
  private walletHandler: WalletHandler;
  private tickerHandler: TickerHandler;
  private p2pHandler: P2PHandler;
  
  /**
   * Creates new WebSocket handlers
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
    this.orderbookHandler = createOrderbookHandler(webSocketServer);
    this.tradesHandler = createTradesHandler(webSocketServer);
    this.ordersHandler = createOrdersHandler(webSocketServer);
    this.walletHandler = createWalletHandler(webSocketServer);
    this.tickerHandler = createTickerHandler(webSocketServer);
    this.p2pHandler = createP2PHandler(webSocketServer);
    
    logger.info('WebSocket handlers created');
  }
  
  /**
   * Starts periodic updates
   */
  public startPeriodicUpdates(): void {
    // Start periodic orderbook updates
    this.orderbookHandler.startPeriodicUpdates(1000);
    
    // Start periodic ticker updates
    this.tickerHandler.startPeriodicUpdates(5000);
    
    // Start periodic P2P network status updates
    this.p2pHandler.startPeriodicUpdates(10000);
    
    logger.info('Started periodic WebSocket updates');
  }
  
  /**
   * Gets the orderbook handler
   * @returns Orderbook handler
   */
  public getOrderbookHandler(): OrderbookHandler {
    return this.orderbookHandler;
  }
  
  /**
   * Gets the trades handler
   * @returns Trades handler
   */
  public getTradesHandler(): TradesHandler {
    return this.tradesHandler;
  }
  
  /**
   * Gets the orders handler
   * @returns Orders handler
   */
  public getOrdersHandler(): OrdersHandler {
    return this.ordersHandler;
  }
  
  /**
   * Gets the wallet handler
   * @returns Wallet handler
   */
  public getWalletHandler(): WalletHandler {
    return this.walletHandler;
  }
  
  /**
   * Gets the ticker handler
   * @returns Ticker handler
   */
  public getTickerHandler(): TickerHandler {
    return this.tickerHandler;
  }
  
  /**
   * Gets the P2P handler
   * @returns P2P handler
   */
  public getP2PHandler(): P2PHandler {
    return this.p2pHandler;
  }
}

/**
 * Creates new WebSocket handlers
 * @param webSocketServer WebSocket server
 * @returns WebSocket handlers
 */
export function createWebSocketHandlers(webSocketServer: WebSocketServer): WebSocketHandlers {
  return new WebSocketHandlers(webSocketServer);
}

export { OrderbookHandler } from './orderbook';
export { TradesHandler } from './trades';
export { OrdersHandler } from './orders';
export { WalletHandler } from './wallet';
export { TickerHandler } from './ticker';
export { P2PHandler } from './p2p';