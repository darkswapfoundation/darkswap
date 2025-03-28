/**
 * Common types for darkswap-lib
 */

/**
 * Peer ID
 */
export type PeerId = string;

/**
 * Order side
 */
export enum OrderSide {
  Buy = 'buy',
  Sell = 'sell',
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  /**
   * Bootstrap peers
   */
  bootstrapPeers?: Array<{ peerId: string; address: string }>;
  
  /**
   * Relay peers
   */
  relayPeers?: Array<{ peerId: string; address: string }>;
  
  /**
   * Listen addresses
   */
  listenAddresses?: string[];
  
  /**
   * Topics to subscribe to
   */
  topics?: string[];
}

/**
 * Order status
 */
export enum OrderStatus {
  Open = 'open',
  Filled = 'filled',
  Cancelled = 'cancelled',
  Expired = 'expired',
}

/**
 * Order
 */
export interface Order {
  /**
   * Order ID
   */
  id: string;
  
  /**
   * Base asset
   */
  baseAsset: string;
  
  /**
   * Quote asset
   */
  quoteAsset: string;
  
  /**
   * Order side
   */
  side: OrderSide;
  
  /**
   * Amount
   */
  amount: string;
  
  /**
   * Price
   */
  price: string;
  
  /**
   * Status
   */
  status: OrderStatus;
  
  /**
   * Created at
   */
  createdAt: number;
  
  /**
   * Expires at
   */
  expiresAt: number;
  
  /**
   * Maker peer ID
   */
  makerPeerId: PeerId;
}

/**
 * Trade
 */
export interface Trade {
  /**
   * Trade ID
   */
  id: string;
  
  /**
   * Order ID
   */
  orderId: string;
  
  /**
   * Base asset
   */
  baseAsset: string;
  
  /**
   * Quote asset
   */
  quoteAsset: string;
  
  /**
   * Amount
   */
  amount: string;
  
  /**
   * Price
   */
  price: string;
  
  /**
   * Created at
   */
  createdAt: number;
  
  /**
   * Maker peer ID
   */
  makerPeerId: PeerId;
  
  /**
   * Taker peer ID
   */
  takerPeerId: PeerId;
}

/**
 * Network event
 */
export type NetworkEvent =
  | { type: 'peerConnected'; peerId: PeerId }
  | { type: 'peerDisconnected'; peerId: PeerId }
  | { type: 'message'; peerId: PeerId; topic: string; data: Uint8Array }
  | { type: 'messageReceived'; peerId: PeerId; topic: string; message: Uint8Array }
  | { type: 'relayReserved'; relayPeerId: PeerId; reservationId: number }
  | { type: 'connectedThroughRelay'; relayPeerId: PeerId; dstPeerId: PeerId };

/**
 * Partially signed Bitcoin transaction
 */
export interface PartiallySignedTransaction {
  /**
   * Base64-encoded PSBT
   */
  psbt: string;
}

/**
 * Trade intent message
 */
export interface TradeIntent {
  /**
   * Message type
   */
  type: 'intent';
  
  /**
   * Intent data
   */
  intent: {
    /**
     * Order ID
     */
    orderId: string;
    
    /**
     * Amount to trade
     */
    amount: string;
    
    /**
     * Taker peer ID
     */
    takerPeerId: string;
  };
}

/**
 * Trade accept message
 */
export interface TradeAccept {
  /**
   * Message type
   */
  type: 'accept';
  
  /**
   * Accept data
   */
  accept: {
    /**
     * Order ID
     */
    orderId: string;
    
    /**
     * Maker peer ID
     */
    makerPeerId: string;
    
    /**
     * Partially signed transaction
     */
    psbt: PartiallySignedTransaction;
  };
}

/**
 * Trade reject message
 */
export interface TradeReject {
  /**
   * Message type
   */
  type: 'reject';
  
  /**
   * Reject data
   */
  reject: {
    /**
     * Order ID
     */
    orderId: string;
    
    /**
     * Reason for rejection
     */
    reason: string;
  };
}

/**
 * PSBT message
 */
export interface PsbtMessage {
  /**
   * Message type
   */
  type: 'psbt';
  
  /**
   * PSBT data
   */
  psbt: {
    /**
     * Order ID
     */
    orderId: string;
    
    /**
     * Partially signed transaction
     */
    psbt: PartiallySignedTransaction;
  };
}

/**
 * Trade complete message
 */
export interface TradeComplete {
  /**
   * Message type
   */
  type: 'complete';
  
  /**
   * Complete data
   */
  complete: {
    /**
     * Order ID
     */
    orderId: string;
    
    /**
     * Transaction ID
     */
    txid: string;
    
    /**
     * Fully signed transaction
     */
    psbt: PartiallySignedTransaction;
  };
}

/**
 * Trade message
 */
export type TradeMessage = TradeIntent | TradeAccept | TradeReject | TradeComplete | PsbtMessage;

/**
 * Orderbook event
 */
export type OrderbookEvent =
  | { type: 'orderAdded'; order: Order }
  | { type: 'orderRemoved'; orderId: string }
  | { type: 'orderUpdated'; order: Order };

/**
 * Trade event
 */
export type TradeEvent =
  | { type: 'tradeCreated'; trade: Trade }
  | { type: 'tradeConfirmed'; tradeId: string }
  | { type: 'tradeCancelled'; tradeId: string };