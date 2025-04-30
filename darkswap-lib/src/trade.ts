/**
 * Trade implementation for the DarkSwap TypeScript Library
 */

import { EventEmitter } from 'eventemitter3';
import { 
  EventData, 
  EventHandler, 
  EventType, 
  Order, 
  OrderSide, 
  TradeExecution, 
  TradeOptions, 
  TradeStatus, 
  TxInput, 
  TxOutput 
} from './types';
import { DarkSwapClient } from './client';
import { Wallet } from './wallet';
import { DEFAULT_TRADE_TIMEOUT } from './constants';
import { generateRandomId } from './utils';

/**
 * Trade class
 */
export class Trade extends EventEmitter {
  /** DarkSwap client */
  private client: DarkSwapClient;
  
  /** Wallet */
  private wallet: Wallet;
  
  /** Auto finalize */
  private autoFinalize: boolean;
  
  /** Auto broadcast */
  private autoBroadcast: boolean;
  
  /** Trades */
  private trades: Map<string, TradeExecution> = new Map();
  
  /**
   * Create a new trade
   * @param client DarkSwap client
   * @param wallet Wallet
   * @param options Trade options
   */
  constructor(client: DarkSwapClient, wallet: Wallet, options: TradeOptions = {}) {
    super();
    
    this.client = client;
    this.wallet = wallet;
    this.autoFinalize = options.autoFinalize !== undefined ? options.autoFinalize : true;
    this.autoBroadcast = options.autoBroadcast !== undefined ? options.autoBroadcast : true;
    
    // Set up event listeners
    this.client.on(EventType.TRADE_CREATED, this.handleTradeCreated.bind(this));
    this.client.on(EventType.TRADE_EXECUTED, this.handleTradeExecuted.bind(this));
    this.client.on(EventType.TRADE_FAILED, this.handleTradeFailed.bind(this));
  }
  
  /**
   * Create a trade
   * @param makerOrder Maker order
   * @param takerOrder Taker order
   * @returns Promise that resolves with the trade execution
   */
  public async createTrade(makerOrder: Order, takerOrder: Order): Promise<TradeExecution> {
    // Check if the wallet is connected
    if (!this.wallet.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    // Check if the orders are compatible
    if (makerOrder.baseAsset !== takerOrder.baseAsset || makerOrder.quoteAsset !== takerOrder.quoteAsset) {
      throw new Error('Orders are not compatible');
    }
    
    // Check if the orders are on opposite sides
    if (makerOrder.side === takerOrder.side) {
      throw new Error('Orders are on the same side');
    }
    
    // Create the trade execution
    const tradeExecution: TradeExecution = {
      id: generateRandomId(),
      makerOrder,
      takerOrder,
      status: TradeStatus.PENDING,
      timestamp: Date.now(),
    };
    
    // Send the trade to the server
    const trade = await this.client.post<TradeExecution>('/trades', tradeExecution);
    
    // Store the trade
    this.trades.set(trade.id, trade);
    
    // Auto execute the trade if enabled
    if (this.autoFinalize) {
      this.executeTrade(trade.id).catch((error) => {
        console.error('Failed to execute trade:', error);
      });
    }
    
    return trade;
  }
  
  /**
   * Execute a trade
   * @param tradeId Trade ID
   * @returns Promise that resolves when the trade is executed
   */
  public async executeTrade(tradeId: string): Promise<void> {
    // Get the trade
    const trade = this.trades.get(tradeId);
    
    if (!trade) {
      throw new Error(`Trade not found: ${tradeId}`);
    }
    
    // Check if the trade is already executed
    if (trade.status === TradeStatus.COMPLETED) {
      return;
    }
    
    // Check if the wallet is connected
    if (!this.wallet.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get the trade inputs and outputs
      const { inputs, outputs } = await this.getTradeInputsAndOutputs(trade);
      
      // Create the PSBT
      const psbtBase64 = await this.wallet.createPsbt(inputs, outputs);
      
      // Sign the PSBT
      const signedPsbtBase64 = await this.wallet.signPsbt(psbtBase64);
      
      // Finalize the PSBT
      const finalizedPsbtBase64 = await this.wallet.finalizePsbt(signedPsbtBase64);
      
      // Extract the transaction
      const txHex = await this.wallet.extractTx(finalizedPsbtBase64);
      
      // Broadcast the transaction if auto broadcast is enabled
      if (this.autoBroadcast) {
        const txid = await this.wallet.broadcastTx(txHex);
        
        // Update the trade status
        await this.client.put<TradeExecution>(`/trades/${tradeId}`, {
          status: TradeStatus.COMPLETED,
          txid,
        });
      } else {
        // Update the trade status
        await this.client.put<TradeExecution>(`/trades/${tradeId}`, {
          status: TradeStatus.COMPLETED,
        });
      }
    } catch (error) {
      // Update the trade status
      await this.client.put<TradeExecution>(`/trades/${tradeId}`, {
        status: TradeStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
      });
      
      throw error;
    }
  }
  
  /**
   * Get trade inputs and outputs
   * @param trade Trade execution
   * @returns Trade inputs and outputs
   */
  private async getTradeInputsAndOutputs(trade: TradeExecution): Promise<{ inputs: TxInput[]; outputs: TxOutput[] }> {
    // This is a simplified implementation
    // In a real implementation, this would calculate the inputs and outputs based on the trade
    
    // Get the wallet address
    const address = this.wallet.getAddress();
    
    // Create a dummy input
    const inputs: TxInput[] = [
      {
        txid: '0000000000000000000000000000000000000000000000000000000000000000',
        vout: 0,
        value: 100000000,
      },
    ];
    
    // Create a dummy output
    const outputs: TxOutput[] = [
      {
        address,
        value: 100000000,
      },
    ];
    
    return { inputs, outputs };
  }
  
  /**
   * Handle trade created event
   * @param data Event data
   */
  private handleTradeCreated(data: EventData): void {
    const trade = data.trade as TradeExecution;
    
    // Store the trade
    this.trades.set(trade.id, trade);
    
    // Emit event
    this.emit(EventType.TRADE_CREATED, { trade });
  }
  
  /**
   * Handle trade executed event
   * @param data Event data
   */
  private handleTradeExecuted(data: EventData): void {
    const tradeId = data.tradeId as string;
    
    // Get the trade
    const trade = this.trades.get(tradeId);
    
    if (!trade) {
      return;
    }
    
    // Update the trade status
    trade.status = TradeStatus.COMPLETED;
    trade.completedAt = Date.now();
    
    // Emit event
    this.emit(EventType.TRADE_EXECUTED, { trade });
  }
  
  /**
   * Handle trade failed event
   * @param data Event data
   */
  private handleTradeFailed(data: EventData): void {
    const tradeId = data.tradeId as string;
    
    // Get the trade
    const trade = this.trades.get(tradeId);
    
    if (!trade) {
      return;
    }
    
    // Update the trade status
    trade.status = TradeStatus.FAILED;
    
    // Emit event
    this.emit(EventType.TRADE_FAILED, { trade });
  }
  
  /**
   * Get all trades
   * @returns All trades
   */
  public getTrades(): TradeExecution[] {
    return Array.from(this.trades.values());
  }
  
  /**
   * Get a trade by ID
   * @param tradeId Trade ID
   * @returns Trade or undefined if not found
   */
  public getTrade(tradeId: string): TradeExecution | undefined {
    return this.trades.get(tradeId);
  }
  
  /**
   * Wait for a trade to complete
   * @param tradeId Trade ID
   * @param timeout Timeout in milliseconds
   * @returns Promise that resolves with the trade execution
   */
  public async waitForTradeCompletion(tradeId: string, timeout: number = DEFAULT_TRADE_TIMEOUT): Promise<TradeExecution> {
    return new Promise<TradeExecution>((resolve, reject) => {
      // Get the trade
      const trade = this.trades.get(tradeId);
      
      if (!trade) {
        reject(new Error(`Trade not found: ${tradeId}`));
        return;
      }
      
      // Check if the trade is already completed
      if (trade.status === TradeStatus.COMPLETED) {
        resolve(trade);
        return;
      }
      
      // Check if the trade has failed
      if (trade.status === TradeStatus.FAILED) {
        reject(new Error(`Trade failed: ${tradeId}`));
        return;
      }
      
      // Set up event listeners
      const onTradeExecuted = (data: EventData) => {
        const executedTrade = data.trade as TradeExecution;
        
        if (executedTrade.id === tradeId) {
          // Remove event listeners
          this.off(EventType.TRADE_EXECUTED, onTradeExecuted);
          this.off(EventType.TRADE_FAILED, onTradeFailed);
          
          // Clear timeout
          clearTimeout(timeoutId);
          
          // Resolve with the trade
          resolve(executedTrade);
        }
      };
      
      const onTradeFailed = (data: EventData) => {
        const failedTrade = data.trade as TradeExecution;
        
        if (failedTrade.id === tradeId) {
          // Remove event listeners
          this.off(EventType.TRADE_EXECUTED, onTradeExecuted);
          this.off(EventType.TRADE_FAILED, onTradeFailed);
          
          // Clear timeout
          clearTimeout(timeoutId);
          
          // Reject with an error
          reject(new Error(`Trade failed: ${tradeId}`));
        }
      };
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        // Remove event listeners
        this.off(EventType.TRADE_EXECUTED, onTradeExecuted);
        this.off(EventType.TRADE_FAILED, onTradeFailed);
        
        // Reject with a timeout error
        reject(new Error(`Trade timed out: ${tradeId}`));
      }, timeout);
      
      // Add event listeners
      this.on(EventType.TRADE_EXECUTED, onTradeExecuted);
      this.on(EventType.TRADE_FAILED, onTradeFailed);
    });
  }
}

/**
 * Create a new trade
 * @param client DarkSwap client
 * @param wallet Wallet
 * @param options Trade options
 * @returns Trade instance
 */
export function createTrade(client: DarkSwapClient, wallet: Wallet, options: TradeOptions = {}): Trade {
  return new Trade(client, wallet, options);
}