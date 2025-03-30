/**
 * Orderbook Tests
 * 
 * This file contains tests for the P2P Orderbook functionality.
 */

const { OrderbookUtils, OrderSide, OrderStatus, AssetType } = require('../../web/src/utils/OrderbookUtils');

describe('OrderbookUtils', () => {
  // Mock data
  const mockCreatorId = 'peer1';
  const mockCreatorAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const mockBaseAsset = {
    type: AssetType.Bitcoin,
    amount: '0.1',
  };
  const mockQuoteAsset = {
    type: AssetType.Rune,
    id: 'rune1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: '100',
  };
  
  describe('createOrder', () => {
    it('should create an order with the given parameters', () => {
      // Act
      const order = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Assert
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.creatorId).toBe(mockCreatorId);
      expect(order.creatorAddress).toBe(mockCreatorAddress);
      expect(order.side).toBe(OrderSide.Buy);
      expect(order.baseAsset).toEqual(mockBaseAsset);
      expect(order.quoteAsset).toEqual(mockQuoteAsset);
      expect(order.status).toBe(OrderStatus.Open);
      expect(order.fills).toEqual([]);
    });
  });
  
  describe('updateOrder', () => {
    it('should update an order with the given updates', () => {
      // Arrange
      const order = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      const updates = {
        status: OrderStatus.Cancelled,
        metadata: {
          note: 'Updated order',
        },
      };
      
      // Act
      const updatedOrder = OrderbookUtils.updateOrder(order, updates);
      
      // Assert
      expect(updatedOrder.status).toBe(OrderStatus.Cancelled);
      expect(updatedOrder.metadata).toEqual(updates.metadata);
      expect(updatedOrder.updatedAt).toBeGreaterThan(order.updatedAt);
    });
  });
  
  describe('cancelOrder', () => {
    it('should cancel an order', () => {
      // Arrange
      const order = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Act
      const cancelledOrder = OrderbookUtils.cancelOrder(order);
      
      // Assert
      expect(cancelledOrder.status).toBe(OrderStatus.Cancelled);
      expect(cancelledOrder.updatedAt).toBeGreaterThan(order.updatedAt);
    });
  });
  
  describe('fillOrder', () => {
    it('should fill an order', () => {
      // Arrange
      const order = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      const counterpartyId = 'peer2';
      const counterpartyAddress = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
      const amount = '0.05'; // Half of the order amount
      const txid = 'mocktxid';
      
      // Act
      const filledOrder = OrderbookUtils.fillOrder(
        order,
        counterpartyId,
        counterpartyAddress,
        amount,
        txid
      );
      
      // Assert
      expect(filledOrder.fills).toHaveLength(1);
      expect(filledOrder.fills[0].orderId).toBe(order.id);
      expect(filledOrder.fills[0].counterpartyId).toBe(counterpartyId);
      expect(filledOrder.fills[0].counterpartyAddress).toBe(counterpartyAddress);
      expect(filledOrder.fills[0].amount).toBe(amount);
      expect(filledOrder.fills[0].txid).toBe(txid);
      expect(filledOrder.status).toBe(OrderStatus.Open); // Not fully filled
    });
  });
  
  describe('createOrderbook', () => {
    it('should create an empty orderbook', () => {
      // Act
      const orderbook = OrderbookUtils.createOrderbook();
      
      // Assert
      expect(orderbook).toBeDefined();
      expect(orderbook.orders).toEqual([]);
      expect(orderbook.lastUpdated).toBeDefined();
      expect(orderbook.version).toBe(1);
    });
  });
  
  describe('addOrder', () => {
    it('should add an order to the orderbook', () => {
      // Arrange
      const orderbook = OrderbookUtils.createOrderbook();
      const order = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Act
      const updatedOrderbook = OrderbookUtils.addOrder(orderbook, order);
      
      // Assert
      expect(updatedOrderbook.orders).toHaveLength(1);
      expect(updatedOrderbook.orders[0]).toEqual(order);
      expect(updatedOrderbook.version).toBe(2);
    });
  });
  
  describe('removeOrder', () => {
    it('should remove an order from the orderbook', () => {
      // Arrange
      const orderbook = OrderbookUtils.createOrderbook();
      const order = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Add the order to the orderbook
      const orderbookWithOrder = OrderbookUtils.addOrder(orderbook, order);
      
      // Act
      const updatedOrderbook = OrderbookUtils.removeOrder(orderbookWithOrder, order.id);
      
      // Assert
      expect(updatedOrderbook.orders).toHaveLength(0);
      expect(updatedOrderbook.version).toBe(3);
    });
  });
  
  describe('getOpenOrders', () => {
    it('should return only open orders from the orderbook', () => {
      // Arrange
      const orderbook = OrderbookUtils.createOrderbook();
      
      // Create an open order
      const openOrder = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Create a cancelled order
      const cancelledOrder = OrderbookUtils.createOrder(
        mockCreatorId,
        mockCreatorAddress,
        OrderSide.Sell,
        mockBaseAsset,
        mockQuoteAsset
      );
      cancelledOrder.status = OrderStatus.Cancelled;
      
      // Add both orders to the orderbook
      let updatedOrderbook = OrderbookUtils.addOrder(orderbook, openOrder);
      updatedOrderbook = OrderbookUtils.addOrder(updatedOrderbook, cancelledOrder);
      
      // Act
      const openOrders = OrderbookUtils.getOpenOrders(updatedOrderbook);
      
      // Assert
      expect(openOrders).toHaveLength(1);
      expect(openOrders[0].id).toBe(openOrder.id);
    });
  });
  
  describe('mergeOrderbooks', () => {
    it('should merge two orderbooks', () => {
      // Arrange
      const orderbook1 = OrderbookUtils.createOrderbook();
      const orderbook2 = OrderbookUtils.createOrderbook();
      
      // Create orders for orderbook1
      const order1 = OrderbookUtils.createOrder(
        'peer1',
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        OrderSide.Buy,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Create orders for orderbook2
      const order2 = OrderbookUtils.createOrder(
        'peer2',
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        OrderSide.Sell,
        mockBaseAsset,
        mockQuoteAsset
      );
      
      // Add orders to orderbooks
      const updatedOrderbook1 = OrderbookUtils.addOrder(orderbook1, order1);
      const updatedOrderbook2 = OrderbookUtils.addOrder(orderbook2, order2);
      
      // Act
      const mergedOrderbook = OrderbookUtils.mergeOrderbooks(updatedOrderbook1, updatedOrderbook2);
      
      // Assert
      expect(mergedOrderbook.orders).toHaveLength(2);
      expect(mergedOrderbook.version).toBe(3); // Max version + 1
    });
  });
});
