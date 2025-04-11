import { WebSocketEventType, WebSocketChannelType } from '../index';
import { WebSocketServer } from '../index';
import { db } from '../../db';
import { logger } from '../../utils/logger';

/**
 * Wallet handler
 */
export class WalletHandler {
  private webSocketServer: WebSocketServer;
  
  /**
   * Creates a new wallet handler
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
  }
  
  /**
   * Handles a balance update
   * @param userId User ID
   * @param balance Balance
   */
  public handleBalanceUpdate(userId: string, balance: Record<string, string>): void {
    try {
      // Publish the balance update to the user
      this.webSocketServer.publishToUser(
        userId,
        WebSocketEventType.BALANCE_UPDATE,
        { balance }
      );
      
      logger.debug('Published balance update', { userId });
    } catch (error) {
      logger.error('Error publishing balance update', error);
    }
  }
  
  /**
   * Handles a new transaction
   * @param transaction Transaction
   */
  public handleNewTransaction(transaction: any): void {
    try {
      // Publish the transaction to the user
      this.webSocketServer.publishToUser(
        transaction.userId,
        WebSocketEventType.TRANSACTION_CREATED,
        transaction
      );
      
      logger.debug('Published new transaction', { transactionId: transaction.id });
    } catch (error) {
      logger.error('Error publishing new transaction', error);
    }
  }
  
  /**
   * Handles a transaction update
   * @param transaction Transaction
   */
  public handleTransactionUpdate(transaction: any): void {
    try {
      // Publish the transaction update to the user
      this.webSocketServer.publishToUser(
        transaction.userId,
        WebSocketEventType.TRANSACTION_UPDATED,
        transaction
      );
      
      logger.debug('Published transaction update', { transactionId: transaction.id });
    } catch (error) {
      logger.error('Error publishing transaction update', error);
    }
  }
  
  /**
   * Publishes wallet balance for a user
   * @param userId User ID
   */
  public async publishWalletBalance(userId: string): Promise<void> {
    try {
      // Get the wallet
      const wallet = await db.wallets.findOne({ userId });
      
      // If the wallet doesn't exist, return
      if (!wallet) {
        return;
      }
      
      // Publish the wallet balance
      this.webSocketServer.publishToUser(
        userId,
        WebSocketEventType.BALANCE_UPDATE,
        { balance: wallet.balance }
      );
      
      logger.debug('Published wallet balance', { userId });
    } catch (error) {
      logger.error('Error publishing wallet balance', error);
    }
  }
  
  /**
   * Publishes transaction history for a user
   * @param userId User ID
   * @param limit Limit
   */
  public async publishTransactionHistory(userId: string, limit: number = 100): Promise<void> {
    try {
      // Get the transaction history
      const transactions = await db.transactions
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      // Publish the transaction history
      this.webSocketServer.publishToUser(
        userId,
        WebSocketEventType.TRANSACTION_CREATED,
        { transactions }
      );
      
      logger.debug('Published transaction history', { userId, count: transactions.length });
    } catch (error) {
      logger.error('Error publishing transaction history', error);
    }
  }
  
  /**
   * Publishes deposit addresses for a user
   * @param userId User ID
   */
  public async publishDepositAddresses(userId: string): Promise<void> {
    try {
      // Get the wallet
      const wallet = await db.wallets.findOne({ userId });
      
      // If the wallet doesn't exist, return
      if (!wallet) {
        return;
      }
      
      // Publish the deposit addresses
      this.webSocketServer.publishToUser(
        userId,
        WebSocketEventType.BALANCE_UPDATE,
        { depositAddresses: wallet.depositAddresses || [] }
      );
      
      logger.debug('Published deposit addresses', { userId });
    } catch (error) {
      logger.error('Error publishing deposit addresses', error);
    }
  }
  
  /**
   * Publishes all wallet information for a user
   * @param userId User ID
   */
  public async publishAllWalletInfo(userId: string): Promise<void> {
    try {
      // Publish wallet balance
      await this.publishWalletBalance(userId);
      
      // Publish transaction history
      await this.publishTransactionHistory(userId);
      
      // Publish deposit addresses
      await this.publishDepositAddresses(userId);
      
      logger.debug('Published all wallet info', { userId });
    } catch (error) {
      logger.error('Error publishing all wallet info', error);
    }
  }
}

/**
 * Creates a new wallet handler
 * @param webSocketServer WebSocket server
 * @returns Wallet handler
 */
export function createWalletHandler(webSocketServer: WebSocketServer): WalletHandler {
  return new WalletHandler(webSocketServer);
}