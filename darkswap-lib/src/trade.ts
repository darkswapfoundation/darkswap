/**
 * Trade functionality for darkswap-lib
 */

import { Network } from './network';
import { Orderbook } from './orderbook';
import {
  Order,
  PartiallySignedTransaction,
  PeerId,
  TradeAccept,
  TradeComplete,
  TradeIntent,
  TradeMessage,
  TradeReject,
} from './types';

/**
 * Trade class
 */
export class Trade {
  private topic = 'darkswap/trade/v1';
  private pendingTrades: Map<string, {
    order: Order;
    intent?: TradeIntent;
    accept?: TradeAccept;
    psbt?: PartiallySignedTransaction;
    complete?: TradeComplete;
  }> = new Map();

  /**
   * Create a new Trade
   * @param network Network instance
   * @param orderbook Orderbook instance
   */
  constructor(private network: Network, private orderbook: Orderbook) {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    this.network.addEventListener('messageReceived', (event) => {
      if (event.type === 'messageReceived' && event.topic === this.topic) {
        try {
          const message = JSON.parse(new TextDecoder().decode(event.message)) as TradeMessage;
          this.handleTradeMessage(message, event.peerId);
        } catch (error) {
          console.error('Failed to parse trade message:', error);
        }
      }
    });
  }

  /**
   * Handle a trade message
   * @param message Trade message
   * @param peerId Peer ID
   */
  private handleTradeMessage(message: TradeMessage, peerId: PeerId): void {
    switch (message.type) {
      case 'intent':
        this.handleTradeIntent(message.intent, peerId);
        break;
      case 'accept':
        this.handleTradeAccept(message.accept, peerId);
        break;
      case 'reject':
        this.handleTradeReject(message.reject, peerId);
        break;
      case 'psbt':
        this.handlePsbt(message.psbt, peerId);
        break;
      case 'complete':
        this.handleTradeComplete(message.complete, peerId);
        break;
    }
  }

  /**
   * Handle a trade intent
   * @param intent Trade intent
   * @param peerId Peer ID
   */
  private handleTradeIntent(intent: TradeIntent, peerId: PeerId): void {
    // Get the order
    const order = this.orderbook.getOrder(intent.orderId);
    if (!order) {
      this.rejectTrade(intent.orderId, peerId, 'Order not found');
      return;
    }

    // Check if the order is from this peer
    if (order.makerPeerId === this.network.getLocalPeerId()) {
      // This is an intent to take our order
      this.pendingTrades.set(intent.orderId, {
        order,
        intent,
      });

      // In a real implementation, we would check if we want to accept the trade
      // For now, we'll just accept it
      this.acceptTrade(intent.orderId, peerId, intent.amount);
    }
  }

  /**
   * Handle a trade accept
   * @param accept Trade accept
   * @param peerId Peer ID
   */
  private handleTradeAccept(accept: TradeAccept, peerId: PeerId): void {
    // Check if we have a pending trade for this order
    const pendingTrade = this.pendingTrades.get(accept.orderId);
    if (!pendingTrade) {
      return;
    }

    // Update the pending trade
    pendingTrade.accept = accept;
    this.pendingTrades.set(accept.orderId, pendingTrade);

    // In a real implementation, we would create a PSBT and send it
    // For now, we'll just create a dummy PSBT
    const psbt: PartiallySignedTransaction = {
      psbt: new Uint8Array(0),
      timestamp: Date.now(),
      signature: new Uint8Array(0),
    };

    this.sendPsbt(accept.orderId, psbt);
  }

  /**
   * Handle a trade reject
   * @param reject Trade reject
   * @param peerId Peer ID
   */
  private handleTradeReject(reject: TradeReject, _peerId: PeerId): void {
    // Remove the pending trade
    this.pendingTrades.delete(reject.orderId);

    // Notify the user
    console.log(`Trade rejected: ${reject.reason}`);
  }

  /**
   * Handle a PSBT
   * @param psbt PSBT
   * @param peerId Peer ID
   */
  private handlePsbt(psbt: PartiallySignedTransaction, peerId: PeerId): void {
    // Find the pending trade
    const pendingTrade = Array.from(this.pendingTrades.entries()).find(
      ([_, trade]) => trade.accept?.makerPeerId === peerId || trade.intent?.takerPeerId === peerId
    );

    if (!pendingTrade) {
      return;
    }

    const [orderId, trade] = pendingTrade;

    // Update the pending trade
    trade.psbt = psbt;
    this.pendingTrades.set(orderId, trade);

    // In a real implementation, we would sign the PSBT and broadcast the transaction
    // For now, we'll just complete the trade
    const complete: TradeComplete = {
      orderId,
      makerPeerId: trade.order.makerPeerId,
      takerPeerId: trade.intent?.takerPeerId || this.network.getLocalPeerId(),
      txid: '0x' + Math.random().toString(16).substring(2),
      timestamp: Date.now(),
      signature: new Uint8Array(0),
    };

    this.completeTrade(orderId, complete);
  }

  /**
   * Handle a trade complete
   * @param complete Trade complete
   * @param peerId Peer ID
   */
  private handleTradeComplete(complete: TradeComplete, _peerId: PeerId): void {
    // Remove the pending trade
    this.pendingTrades.delete(complete.orderId);

    // Remove the order from the orderbook
    this.orderbook.removeOrder(complete.orderId);

    // Notify the user
    console.log(`Trade completed: ${complete.txid}`);
  }

  /**
   * Take an order
   * @param orderId Order ID to take
   * @param amount Amount to take
   */
  async takeOrder(orderId: string, amount: string): Promise<void> {
    // Get the order
    const order = this.orderbook.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Create a trade intent
    const intent: TradeIntent = {
      orderId,
      takerPeerId: this.network.getLocalPeerId(),
      amount,
      timestamp: Date.now(),
      signature: new Uint8Array(0),
    };

    // Add to pending trades
    this.pendingTrades.set(orderId, {
      order,
      intent,
    });

    // Send the trade intent
    await this.sendTradeIntent(intent);
  }

  /**
   * Accept a trade
   * @param orderId Order ID
   * @param takerPeerId Taker peer ID
   * @param amount Amount
   */
  private async acceptTrade(orderId: string, takerPeerId: PeerId, amount: string): Promise<void> {
    // Create a trade accept
    const accept: TradeAccept = {
      orderId,
      makerPeerId: this.network.getLocalPeerId(),
      takerPeerId,
      amount,
      timestamp: Date.now(),
      signature: new Uint8Array(0),
    };

    // Send the trade accept
    await this.sendTradeAccept(accept);
  }

  /**
   * Reject a trade
   * @param orderId Order ID
   * @param takerPeerId Taker peer ID
   * @param reason Reason for rejection
   */
  private async rejectTrade(orderId: string, takerPeerId: PeerId, reason: string): Promise<void> {
    // Create a trade reject
    const reject: TradeReject = {
      orderId,
      makerPeerId: this.network.getLocalPeerId(),
      takerPeerId,
      reason,
      timestamp: Date.now(),
      signature: new Uint8Array(0),
    };

    // Send the trade reject
    await this.sendTradeReject(reject);
  }

  /**
   * Complete a trade
   * @param orderId Order ID
   * @param complete Trade complete
   */
  private async completeTrade(orderId: string, complete: TradeComplete): Promise<void> {
    // Send the trade complete
    await this.sendTradeComplete(complete);

    // Remove the order from the orderbook
    this.orderbook.removeOrder(orderId);

    // Remove the pending trade
    this.pendingTrades.delete(orderId);
  }

  /**
   * Send a trade intent
   * @param intent Trade intent
   */
  private async sendTradeIntent(intent: TradeIntent): Promise<void> {
    const message: TradeMessage = {
      type: 'intent',
      intent,
    };

    await this.sendTradeMessage(message);
  }

  /**
   * Send a trade accept
   * @param accept Trade accept
   */
  private async sendTradeAccept(accept: TradeAccept): Promise<void> {
    const message: TradeMessage = {
      type: 'accept',
      accept,
    };

    await this.sendTradeMessage(message);
  }

  /**
   * Send a trade reject
   * @param reject Trade reject
   */
  private async sendTradeReject(reject: TradeReject): Promise<void> {
    const message: TradeMessage = {
      type: 'reject',
      reject,
    };

    await this.sendTradeMessage(message);
  }

  /**
   * Send a PSBT
   * @param orderId Order ID
   * @param psbt PSBT
   */
  private async sendPsbt(orderId: string, psbt: PartiallySignedTransaction): Promise<void> {
    const message: TradeMessage = {
      type: 'psbt',
      psbt,
    };

    await this.sendTradeMessage(message);
  }

  /**
   * Send a trade complete
   * @param complete Trade complete
   */
  private async sendTradeComplete(complete: TradeComplete): Promise<void> {
    const message: TradeMessage = {
      type: 'complete',
      complete,
    };

    await this.sendTradeMessage(message);
  }

  /**
   * Send a trade message
   * @param message Trade message
   */
  private async sendTradeMessage(message: TradeMessage): Promise<void> {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(JSON.stringify(message));

    await this.network.publish(this.topic, messageBytes);
  }
}