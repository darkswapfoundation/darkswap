/**
 * OrderManager.test.ts - Unit tests for the OrderManager class
 * 
 * This file contains unit tests for the OrderManager class, which provides
 * a higher-level interface for managing orders.
 */

import OrderManager from '../../wasm/OrderManager';
import DarkSwapWasm, { OrderSide, AssetType } from '../../wasm/DarkSwapWasm';
import { OrderError } from '../../utils/ErrorHandling';

// Mock DarkSwapWasm
jest.mock('../../wasm/DarkSwapWasm');

describe('OrderManager', () => {
  // Mock DarkSwapWasm instance
  let mockDarkSwap: jest.Mocked<DarkSwapWasm>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock DarkSwapWasm instance
    mockDarkSwap = new DarkSwapWasm() as jest.Mocked<DarkSwapWasm>;
    
    // Mock methods
    mockDarkSwap.createOrder = jest.fn().mockResolvedValue('order-id');
    mockDarkSwap.cancelOrder = jest.fn().mockResolvedValue(undefined);
    mockDarkSwap.getOrder = jest.fn().mockResolvedValue({
      id: 'order-id',
      side: OrderSide.Buy,
      baseAsset: 'BTC',
      quoteAsset: 'USD',
      amount: '1.0',
      price: '50000',
      timestamp: Date.now(),
      status: 0,
      maker: 'peer-id',
    });
    mockDarkSwap.getOrders = jest.fn().mockResolvedValue([
      {
        id: 'order-id-1',
        side: OrderSide.Buy,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        amount: '1.0',
        price: '50000',
        timestamp: Date.now(),
        status: 0,
        maker: 'peer-id-1',
      },
      {
        id: 'order-id-2',
        side: OrderSide.Sell,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        amount: '0.5',
        price: '51000',
        timestamp: Date.now(),
        status: 0,
        maker: 'peer-id-2',
      },
    ]);
    mockDarkSwap.takeOrder = jest.fn().mockResolvedValue('trade-id');
    mockDarkSwap.on = jest.fn().mockReturnValue(() => {});
    mockDarkSwap.isInitialized = true;
  });
  
  describe('constructor', () => {
    it('should create an OrderManager instance', () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      expect(orderManager).toBeDefined();
    });
    
    it('should set up event listeners', () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      expect(mockDarkSwap.on).toHaveBeenCalledWith('order', expect.any(Function));
      expect(mockDarkSwap.on).toHaveBeenCalledWith('trade', expect.any(Function));
    });
  });
  
  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      const orderId = await orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
        amount: '1.0',
        price: '50000',
      });
      
      expect(orderId).toBe('order-id');
      expect(mockDarkSwap.createOrder).toHaveBeenCalledWith(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      );
    });
    
    it('should throw OrderError if createOrder fails', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Make createOrder fail
      mockDarkSwap.createOrder = jest.fn().mockRejectedValue(new Error('Failed to create order'));
      
      await expect(orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
        amount: '1.0',
        price: '50000',
      })).rejects.toThrow(OrderError);
    });
    
    it('should validate order parameters', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Invalid amount
      await expect(orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
        amount: '-1.0',
        price: '50000',
      })).rejects.toThrow(OrderError);
      
      // Invalid price
      await expect(orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
        amount: '1.0',
        price: '-50000',
      })).rejects.toThrow(OrderError);
      
      // Invalid base asset ID
      await expect(orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: '',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
        amount: '1.0',
        price: '50000',
      })).rejects.toThrow(OrderError);
      
      // Invalid quote asset ID
      await expect(orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: '',
        amount: '1.0',
        price: '50000',
      })).rejects.toThrow(OrderError);
    });
  });
  
  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      await orderManager.cancelOrder('order-id');
      
      expect(mockDarkSwap.cancelOrder).toHaveBeenCalledWith('order-id');
    });
    
    it('should throw OrderError if cancelOrder fails', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Make cancelOrder fail
      mockDarkSwap.cancelOrder = jest.fn().mockRejectedValue(new Error('Failed to cancel order'));
      
      await expect(orderManager.cancelOrder('order-id')).rejects.toThrow(OrderError);
    });
    
    it('should validate order ID', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Invalid order ID
      await expect(orderManager.cancelOrder('')).rejects.toThrow(OrderError);
    });
  });
  
  describe('getOrder', () => {
    it('should get an order successfully', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      const order = await orderManager.getOrder('order-id');
      
      expect(order).toBeDefined();
      expect(order.id).toBe('order-id');
      expect(mockDarkSwap.getOrder).toHaveBeenCalledWith('order-id');
    });
    
    it('should throw OrderError if getOrder fails', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Make getOrder fail
      mockDarkSwap.getOrder = jest.fn().mockRejectedValue(new Error('Failed to get order'));
      
      await expect(orderManager.getOrder('order-id')).rejects.toThrow(OrderError);
    });
    
    it('should validate order ID', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Invalid order ID
      await expect(orderManager.getOrder('')).rejects.toThrow(OrderError);
    });
  });
  
  describe('getOrders', () => {
    it('should get orders successfully', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      const orders = await orderManager.getOrders({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
      });
      
      expect(orders).toBeDefined();
      expect(orders.length).toBe(2);
      expect(orders[0].id).toBe('order-id-1');
      expect(orders[1].id).toBe('order-id-2');
      expect(mockDarkSwap.getOrders).toHaveBeenCalledWith(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
      );
    });
    
    it('should get all orders if no filter is provided', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      const orders = await orderManager.getOrders();
      
      expect(orders).toBeDefined();
      expect(orders.length).toBe(2);
      expect(mockDarkSwap.getOrders).toHaveBeenCalledWith(
        undefined,
        undefined,
        null,
        undefined,
        null,
      );
    });
    
    it('should throw OrderError if getOrders fails', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Make getOrders fail
      mockDarkSwap.getOrders = jest.fn().mockRejectedValue(new Error('Failed to get orders'));
      
      await expect(orderManager.getOrders()).rejects.toThrow(OrderError);
    });
  });
  
  describe('takeOrder', () => {
    it('should take an order successfully', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      const tradeId = await orderManager.takeOrder('order-id', '1.0');
      
      expect(tradeId).toBe('trade-id');
      expect(mockDarkSwap.takeOrder).toHaveBeenCalledWith('order-id', '1.0');
    });
    
    it('should throw OrderError if takeOrder fails', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Make takeOrder fail
      mockDarkSwap.takeOrder = jest.fn().mockRejectedValue(new Error('Failed to take order'));
      
      await expect(orderManager.takeOrder('order-id', '1.0')).rejects.toThrow(OrderError);
    });
    
    it('should validate order ID and amount', async () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Invalid order ID
      await expect(orderManager.takeOrder('', '1.0')).rejects.toThrow(OrderError);
      
      // Invalid amount
      await expect(orderManager.takeOrder('order-id', '-1.0')).rejects.toThrow(OrderError);
    });
  });
  
  describe('event handling', () => {
    it('should handle order events', () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Mock event handler
      const eventHandler = jest.fn();
      orderManager.on('order', eventHandler);
      
      // Get the order event handler
      const orderEventHandler = (mockDarkSwap.on as jest.Mock).mock.calls.find(
        call => call[0] === 'order'
      )[1];
      
      // Trigger order event
      orderEventHandler({ type: 'order', data: { id: 'order-id' } });
      
      expect(eventHandler).toHaveBeenCalledWith({ id: 'order-id' });
    });
    
    it('should handle trade events', () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Mock event handler
      const eventHandler = jest.fn();
      orderManager.on('trade', eventHandler);
      
      // Get the trade event handler
      const tradeEventHandler = (mockDarkSwap.on as jest.Mock).mock.calls.find(
        call => call[0] === 'trade'
      )[1];
      
      // Trigger trade event
      tradeEventHandler({ type: 'trade', data: { id: 'trade-id' } });
      
      expect(eventHandler).toHaveBeenCalledWith({ id: 'trade-id' });
    });
    
    it('should remove event handler', () => {
      const orderManager = new OrderManager(mockDarkSwap);
      
      // Mock event handler
      const eventHandler = jest.fn();
      const removeListener = orderManager.on('order', eventHandler);
      
      // Remove event handler
      removeListener();
      
      // Get the order event handler
      const orderEventHandler = (mockDarkSwap.on as jest.Mock).mock.calls.find(
        call => call[0] === 'order'
      )[1];
      
      // Trigger order event
      orderEventHandler({ type: 'order', data: { id: 'order-id' } });
      
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });
});