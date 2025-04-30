/**
 * Orderbook Utilities
 * 
 * This utility provides functionality for managing a decentralized orderbook.
 * It includes methods for creating, updating, and synchronizing orders between peers.
 */

/**
 * Asset type
 */
export enum AssetType {
  Bitcoin = 'bitcoin',
  Rune = 'rune',
  Alkane = 'alkane',
}

/**
 * Order side
 */
export enum OrderSide {
  Buy = 'buy',
  Sell = 'sell',
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
 * Order asset interface
 */
export interface OrderAsset {
  type: AssetType;
  id?: string;
  amount: string;
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  creatorId: string;
  creatorAddress: string;
  side: OrderSide;
  baseAsset: OrderAsset;
  quoteAsset: OrderAsset;
  status: OrderStatus;
  fills: OrderFill[];
  signature?: string;
  metadata?: {
    [key: string]: string;
  };
}

/**
 * Order fill interface
 */
export interface OrderFill {
  id: string;
  orderId: string;
  counterpartyId: string;
  counterpartyAddress: string;
  amount: string;
  txid?: string;
  timestamp: number;
}

/**
 * Orderbook interface
 */
export interface Orderbook {
  orders: Order[];
  lastUpdated: number;
  version: number;
}

/**
 * Orderbook update interface
 */
export interface OrderbookUpdate {
  type: 'add' | 'update' | 'remove';
  order: Order;
  timestamp: number;
  peerId: string;
}

/**
 * Orderbook sync message interface
 */
export interface OrderbookSyncMessage {
  type: 'sync_request' | 'sync_response' | 'update';
  data: Orderbook | OrderbookUpdate;
  timestamp: number;
  peerId: string;
}

/**
 * Orderbook Utils
 */
export class OrderbookUtils {
  /**
   * Create a new order
   * @param creatorId Creator ID
   * @param creatorAddress Creator address
   * @param side Order side
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param expiresAt Expiration timestamp
   * @param metadata Order metadata
   * @returns Order
   */
  static createOrder(
    creatorId: string,
    creatorAddress: string,
    side: OrderSide,
    baseAsset: OrderAsset,
    quoteAsset: OrderAsset,
    expiresAt?: number,
    metadata?: { [key: string]: string }
  ): Order {
    const now = Date.now();
    
    return {
      id: `order-${now}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      creatorId,
      creatorAddress,
      side,
      baseAsset,
      quoteAsset,
      status: OrderStatus.Open,
      fills: [],
      metadata,
    };
  }

  /**
   * Update an order
   * @param order Order to update
   * @param updates Updates to apply
   * @returns Updated order
   */
  static updateOrder(order: Order, updates: Partial<Order>): Order {
    return {
      ...order,
      ...updates,
      updatedAt: Date.now(),
    };
  }

  /**
   * Cancel an order
   * @param order Order to cancel
   * @returns Cancelled order
   */
  static cancelOrder(order: Order): Order {
    return {
      ...order,
      status: OrderStatus.Cancelled,
      updatedAt: Date.now(),
    };
  }

  /**
   * Fill an order
   * @param order Order to fill
   * @param counterpartyId Counterparty ID
   * @param counterpartyAddress Counterparty address
   * @param amount Amount to fill
   * @param txid Transaction ID
   * @returns Filled order
   */
  static fillOrder(
    order: Order,
    counterpartyId: string,
    counterpartyAddress: string,
    amount: string,
    txid?: string
  ): Order {
    const fill: OrderFill = {
      id: `fill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      orderId: order.id,
      counterpartyId,
      counterpartyAddress,
      amount,
      txid,
      timestamp: Date.now(),
    };
    
    const fills = [...order.fills, fill];
    
    // Check if the order is fully filled
    const totalFilled = fills.reduce((sum, fill) => sum + parseFloat(fill.amount), 0);
    const orderAmount = parseFloat(order.baseAsset.amount);
    
    const status = totalFilled >= orderAmount ? OrderStatus.Filled : OrderStatus.Open;
    
    return {
      ...order,
      fills,
      status,
      updatedAt: Date.now(),
    };
  }

  /**
   * Check if an order is expired
   * @param order Order to check
   * @returns True if the order is expired
   */
  static isOrderExpired(order: Order): boolean {
    if (!order.expiresAt) return false;
    return Date.now() > order.expiresAt;
  }

  /**
   * Create a new orderbook
   * @returns Orderbook
   */
  static createOrderbook(): Orderbook {
    return {
      orders: [],
      lastUpdated: Date.now(),
      version: 1,
    };
  }

  /**
   * Add an order to the orderbook
   * @param orderbook Orderbook
   * @param order Order to add
   * @returns Updated orderbook
   */
  static addOrder(orderbook: Orderbook, order: Order): Orderbook {
    // Check if the order already exists
    const existingOrderIndex = orderbook.orders.findIndex((o) => o.id === order.id);
    
    if (existingOrderIndex !== -1) {
      // Update the existing order
      const updatedOrders = [...orderbook.orders];
      updatedOrders[existingOrderIndex] = order;
      
      return {
        ...orderbook,
        orders: updatedOrders,
        lastUpdated: Date.now(),
        version: orderbook.version + 1,
      };
    }
    
    // Add the new order
    return {
      ...orderbook,
      orders: [...orderbook.orders, order],
      lastUpdated: Date.now(),
      version: orderbook.version + 1,
    };
  }

  /**
   * Remove an order from the orderbook
   * @param orderbook Orderbook
   * @param orderId Order ID to remove
   * @returns Updated orderbook
   */
  static removeOrder(orderbook: Orderbook, orderId: string): Orderbook {
    return {
      ...orderbook,
      orders: orderbook.orders.filter((o) => o.id !== orderId),
      lastUpdated: Date.now(),
      version: orderbook.version + 1,
    };
  }

  /**
   * Update an order in the orderbook
   * @param orderbook Orderbook
   * @param orderId Order ID to update
   * @param updates Updates to apply
   * @returns Updated orderbook
   */
  static updateOrderInOrderbook(
    orderbook: Orderbook,
    orderId: string,
    updates: Partial<Order>
  ): Orderbook {
    const orderIndex = orderbook.orders.findIndex((o) => o.id === orderId);
    
    if (orderIndex === -1) {
      return orderbook;
    }
    
    const updatedOrder = {
      ...orderbook.orders[orderIndex],
      ...updates,
      updatedAt: Date.now(),
    };
    
    const updatedOrders = [...orderbook.orders];
    updatedOrders[orderIndex] = updatedOrder;
    
    return {
      ...orderbook,
      orders: updatedOrders,
      lastUpdated: Date.now(),
      version: orderbook.version + 1,
    };
  }

  /**
   * Get open orders from the orderbook
   * @param orderbook Orderbook
   * @returns Open orders
   */
  static getOpenOrders(orderbook: Orderbook): Order[] {
    return orderbook.orders.filter((o) => o.status === OrderStatus.Open);
  }

  /**
   * Get orders by creator
   * @param orderbook Orderbook
   * @param creatorId Creator ID
   * @returns Orders by creator
   */
  static getOrdersByCreator(orderbook: Orderbook, creatorId: string): Order[] {
    return orderbook.orders.filter((o) => o.creatorId === creatorId);
  }

  /**
   * Get orders by asset
   * @param orderbook Orderbook
   * @param assetType Asset type
   * @param assetId Asset ID
   * @returns Orders by asset
   */
  static getOrdersByAsset(
    orderbook: Orderbook,
    assetType: AssetType,
    assetId?: string
  ): Order[] {
    return orderbook.orders.filter(
      (o) =>
        (o.baseAsset.type === assetType && (!assetId || o.baseAsset.id === assetId)) ||
        (o.quoteAsset.type === assetType && (!assetId || o.quoteAsset.id === assetId))
    );
  }

  /**
   * Get matching orders
   * @param orderbook Orderbook
   * @param order Order to match
   * @returns Matching orders
   */
  static getMatchingOrders(orderbook: Orderbook, order: Order): Order[] {
    // Get open orders with opposite side
    const oppositeOrders = orderbook.orders.filter(
      (o) =>
        o.status === OrderStatus.Open &&
        o.side !== order.side &&
        o.creatorId !== order.creatorId
    );
    
    // For buy orders, we want to sell the base asset and receive the quote asset
    // For sell orders, we want to buy the base asset and pay with the quote asset
    return oppositeOrders.filter((o) => {
      if (order.side === OrderSide.Buy) {
        // We want to buy the base asset, so we need to find sell orders for the same asset
        return (
          o.baseAsset.type === order.baseAsset.type &&
          (!order.baseAsset.id || !o.baseAsset.id || o.baseAsset.id === order.baseAsset.id) &&
          o.quoteAsset.type === order.quoteAsset.type &&
          (!order.quoteAsset.id || !o.quoteAsset.id || o.quoteAsset.id === order.quoteAsset.id)
        );
      } else {
        // We want to sell the base asset, so we need to find buy orders for the same asset
        return (
          o.baseAsset.type === order.baseAsset.type &&
          (!order.baseAsset.id || !o.baseAsset.id || o.baseAsset.id === order.baseAsset.id) &&
          o.quoteAsset.type === order.quoteAsset.type &&
          (!order.quoteAsset.id || !o.quoteAsset.id || o.quoteAsset.id === order.quoteAsset.id)
        );
      }
    });
  }

  /**
   * Create an orderbook update
   * @param type Update type
   * @param order Order
   * @param peerId Peer ID
   * @returns Orderbook update
   */
  static createOrderbookUpdate(
    type: 'add' | 'update' | 'remove',
    order: Order,
    peerId: string
  ): OrderbookUpdate {
    return {
      type,
      order,
      timestamp: Date.now(),
      peerId,
    };
  }

  /**
   * Create an orderbook sync message
   * @param type Message type
   * @param data Message data
   * @param peerId Peer ID
   * @returns Orderbook sync message
   */
  static createOrderbookSyncMessage(
    type: 'sync_request' | 'sync_response' | 'update',
    data: Orderbook | OrderbookUpdate,
    peerId: string
  ): OrderbookSyncMessage {
    return {
      type,
      data,
      timestamp: Date.now(),
      peerId,
    };
  }

  /**
   * Apply an orderbook update
   * @param orderbook Orderbook
   * @param update Orderbook update
   * @returns Updated orderbook
   */
  static applyOrderbookUpdate(orderbook: Orderbook, update: OrderbookUpdate): Orderbook {
    switch (update.type) {
      case 'add':
        return OrderbookUtils.addOrder(orderbook, update.order);
      case 'update':
        return OrderbookUtils.updateOrderInOrderbook(orderbook, update.order.id, update.order);
      case 'remove':
        return OrderbookUtils.removeOrder(orderbook, update.order.id);
      default:
        return orderbook;
    }
  }

  /**
   * Merge two orderbooks
   * @param orderbook1 First orderbook
   * @param orderbook2 Second orderbook
   * @returns Merged orderbook
   */
  static mergeOrderbooks(orderbook1: Orderbook, orderbook2: Orderbook): Orderbook {
    // Create a map of orders by ID
    const ordersMap = new Map<string, Order>();
    
    // Add orders from the first orderbook
    orderbook1.orders.forEach((order) => {
      ordersMap.set(order.id, order);
    });
    
    // Add or update orders from the second orderbook
    orderbook2.orders.forEach((order) => {
      const existingOrder = ordersMap.get(order.id);
      
      if (!existingOrder || existingOrder.updatedAt < order.updatedAt) {
        ordersMap.set(order.id, order);
      }
    });
    
    // Create a new orderbook with the merged orders
    return {
      orders: Array.from(ordersMap.values()),
      lastUpdated: Date.now(),
      version: Math.max(orderbook1.version, orderbook2.version) + 1,
    };
  }

  /**
   * Clean up expired orders
   * @param orderbook Orderbook
   * @returns Cleaned orderbook
   */
  static cleanupExpiredOrders(orderbook: Orderbook): Orderbook {
    const now = Date.now();
    
    const updatedOrders = orderbook.orders.map((order) => {
      if (order.expiresAt && order.expiresAt < now && order.status === OrderStatus.Open) {
        return {
          ...order,
          status: OrderStatus.Expired,
          updatedAt: now,
        };
      }
      
      return order;
    });
    
    return {
      ...orderbook,
      orders: updatedOrders,
      lastUpdated: now,
      version: orderbook.version + 1,
    };
  }
}