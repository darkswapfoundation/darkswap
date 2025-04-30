/**
 * DarkSwapWasm.test.ts - Unit tests for the DarkSwapWasm class
 * 
 * This file contains unit tests for the DarkSwapWasm class, which is the main
 * interface to the WebAssembly module.
 */

import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from '../../wasm/DarkSwapWasm';
import { WasmError, OrderError, NetworkError, WalletError, ErrorCode } from '../../utils/ErrorHandling';

// Mock wasm-bindgen
jest.mock('../../wasm-bindings/darkswap_wasm', () => {
  // Mock JsConfig
  class JsConfig {
    bitcoin_network: any;
    relay_url: string;
    listen_addresses: string[];
    bootstrap_peers: string[];
    wallet_path?: string;
    wallet_password?: string;
    debug: boolean;
    
    constructor() {
      this.bitcoin_network = 1; // Testnet
      this.relay_url = 'ws://localhost:8080';
      this.listen_addresses = [];
      this.bootstrap_peers = [];
      this.debug = false;
    }
  }
  
  // Mock JsDarkSwap
  class JsDarkSwap {
    private eventCallback: ((event: any) => void) | null = null;
    private shouldFail: boolean = false;
    
    constructor(_config: JsConfig) {
      // Do nothing
    }
    
    set_event_callback(callback: (event: any) => void): Promise<void> {
      this.eventCallback = callback;
      return Promise.resolve();
    }
    
    start(): Promise<void> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to start DarkSwap'));
      }
      return Promise.resolve();
    }
    
    stop(): Promise<void> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to stop DarkSwap'));
      }
      return Promise.resolve();
    }
    
    create_order(
      _side: any,
      _baseAssetType: any,
      _baseAssetId: string,
      _quoteAssetType: any,
      _quoteAssetId: string,
      _amount: string,
      _price: string,
    ): Promise<string> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to create order'));
      }
      return Promise.resolve('order-id');
    }
    
    cancel_order(_orderId: string): Promise<void> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to cancel order'));
      }
      return Promise.resolve();
    }
    
    get_order(_orderId: string): Promise<any> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to get order'));
      }
      return Promise.resolve({
        id: 'order-id',
        side: 0,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        amount: '1.0',
        price: '50000',
        timestamp: Date.now(),
        status: 0,
        maker: 'peer-id',
      });
    }
    
    get_orders(
      _side: any,
      _baseAssetType: any,
      _baseAssetId: string | null,
      _quoteAssetType: any,
      _quoteAssetId: string | null,
    ): Promise<any[]> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to get orders'));
      }
      return Promise.resolve([
        {
          id: 'order-id-1',
          side: 0,
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
          side: 1,
          baseAsset: 'BTC',
          quoteAsset: 'USD',
          amount: '0.5',
          price: '51000',
          timestamp: Date.now(),
          status: 0,
          maker: 'peer-id-2',
        },
      ]);
    }
    
    take_order(_orderId: string, _amount: string): Promise<string> {
      if (this.shouldFail) {
        return Promise.reject(new Error('Failed to take order'));
      }
      return Promise.resolve('trade-id');
    }
    
    // Helper method to trigger events (for testing)
    _triggerEvent(event: any): void {
      if (this.eventCallback) {
        this.eventCallback(event);
      }
    }
    
    // Helper method to set failure mode (for testing)
    _setShouldFail(shouldFail: boolean): void {
      this.shouldFail = shouldFail;
    }
  }
  
  return {
    JsConfig,
    JsDarkSwap,
  };
});

describe('DarkSwapWasm', () => {
  // Default configuration
  const defaultConfig: Config = {
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'ws://localhost:8080',
    listenAddresses: [],
    bootstrapPeers: [],
    debug: false,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      expect(darkswap.isInitialized).toBe(true);
      expect(darkswap.isInitializing).toBe(false);
    });
    
    it('should throw WasmError if initialization fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      // Make initialization fail
      (darkswap as any).darkswap = {
        set_event_callback: jest.fn().mockRejectedValue(new Error('Failed to set event callback')),
        start: jest.fn().mockRejectedValue(new Error('Failed to start')),
      };
      
      await expect(darkswap.initialize(defaultConfig)).rejects.toThrow(WasmError);
      
      expect(darkswap.isInitialized).toBe(false);
      expect(darkswap.isInitializing).toBe(false);
    });
    
    it('should throw WasmError if already initialized', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      await expect(darkswap.initialize(defaultConfig)).rejects.toThrow(WasmError);
    });
    
    it('should throw WasmError if already initializing', async () => {
      const darkswap = new DarkSwapWasm();
      
      // Set initializing flag
      (darkswap as any).isInitializing = true;
      
      await expect(darkswap.initialize(defaultConfig)).rejects.toThrow(WasmError);
    });
  });
  
  describe('shutdown', () => {
    it('should shutdown successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      await darkswap.shutdown();
      
      expect(darkswap.isInitialized).toBe(false);
    });
    
    it('should throw WasmError if shutdown fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Make shutdown fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      await expect(darkswap.shutdown()).rejects.toThrow(WasmError);
    });
    
    it('should throw WasmError if not initialized', async () => {
      const darkswap = new DarkSwapWasm();
      
      await expect(darkswap.shutdown()).rejects.toThrow(WasmError);
    });
  });
  
  describe('order management', () => {
    it('should create order successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      const orderId = await darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      );
      
      expect(orderId).toBe('order-id');
    });
    
    it('should throw OrderError if create order fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Make create order fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      )).rejects.toThrow(OrderError);
    });
    
    it('should throw OrderError if not initialized', async () => {
      const darkswap = new DarkSwapWasm();
      
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      )).rejects.toThrow(OrderError);
    });
    
    it('should cancel order successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      await expect(darkswap.cancelOrder('order-id')).resolves.not.toThrow();
    });
    
    it('should throw OrderError if cancel order fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Make cancel order fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      await expect(darkswap.cancelOrder('order-id')).rejects.toThrow(OrderError);
    });
    
    it('should get order successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      const order = await darkswap.getOrder('order-id');
      
      expect(order).toBeDefined();
      expect(order.id).toBe('order-id');
    });
    
    it('should throw OrderError if get order fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Make get order fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      await expect(darkswap.getOrder('order-id')).rejects.toThrow(OrderError);
    });
    
    it('should get orders successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      const orders = await darkswap.getOrders(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
      );
      
      expect(orders).toBeDefined();
      expect(orders.length).toBe(2);
      expect(orders[0].id).toBe('order-id-1');
      expect(orders[1].id).toBe('order-id-2');
    });
    
    it('should throw OrderError if get orders fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Make get orders fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      await expect(darkswap.getOrders(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
      )).rejects.toThrow(OrderError);
    });
    
    it('should take order successfully', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      const tradeId = await darkswap.takeOrder('order-id', '1.0');
      
      expect(tradeId).toBe('trade-id');
    });
    
    it('should throw OrderError if take order fails', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Make take order fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      await expect(darkswap.takeOrder('order-id', '1.0')).rejects.toThrow(OrderError);
    });
  });
  
  describe('event handling', () => {
    it('should handle events', async () => {
      const darkswap = new DarkSwapWasm();
      
      // Mock event handler
      const eventHandler = jest.fn();
      darkswap.on('event', eventHandler);
      
      await darkswap.initialize(defaultConfig);
      
      // Trigger event
      (darkswap as any).darkswap._triggerEvent({ type: 'test', data: 'test-data' });
      
      expect(eventHandler).toHaveBeenCalledWith({ type: 'test', data: 'test-data' });
    });
    
    it('should remove event handler', async () => {
      const darkswap = new DarkSwapWasm();
      
      // Mock event handler
      const eventHandler = jest.fn();
      const removeListener = darkswap.on('event', eventHandler);
      
      await darkswap.initialize(defaultConfig);
      
      // Remove event handler
      removeListener();
      
      // Trigger event
      (darkswap as any).darkswap._triggerEvent({ type: 'test', data: 'test-data' });
      
      expect(eventHandler).not.toHaveBeenCalled();
    });
    
    it('should handle specific event types', async () => {
      const darkswap = new DarkSwapWasm();
      
      // Mock event handlers
      const orderHandler = jest.fn();
      const tradeHandler = jest.fn();
      const errorHandler = jest.fn();
      
      darkswap.on('order', orderHandler);
      darkswap.on('trade', tradeHandler);
      darkswap.on('error', errorHandler);
      
      await darkswap.initialize(defaultConfig);
      
      // Trigger events
      (darkswap as any).darkswap._triggerEvent({ type: 'order', data: { id: 'order-id' } });
      (darkswap as any).darkswap._triggerEvent({ type: 'trade', data: { id: 'trade-id' } });
      (darkswap as any).darkswap._triggerEvent({ type: 'error', data: { message: 'error' } });
      
      expect(orderHandler).toHaveBeenCalledWith({ type: 'order', data: { id: 'order-id' } });
      expect(tradeHandler).toHaveBeenCalledWith({ type: 'trade', data: { id: 'trade-id' } });
      expect(errorHandler).toHaveBeenCalledWith({ type: 'error', data: { message: 'error' } });
    });
  });
  
  describe('validation', () => {
    it('should validate order parameters', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Invalid amount
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '-1.0',
        '50000',
      )).rejects.toThrow(OrderError);
      
      // Invalid price
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '-50000',
      )).rejects.toThrow(OrderError);
      
      // Invalid asset ID
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        '',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      )).rejects.toThrow(OrderError);
      
      // Invalid quote asset ID
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        '',
        '1.0',
        '50000',
      )).rejects.toThrow(OrderError);
    });
    
    it('should validate take order parameters', async () => {
      const darkswap = new DarkSwapWasm();
      
      await darkswap.initialize(defaultConfig);
      
      // Invalid order ID
      await expect(darkswap.takeOrder('', '1.0')).rejects.toThrow(OrderError);
      
      // Invalid amount
      await expect(darkswap.takeOrder('order-id', '-1.0')).rejects.toThrow(OrderError);
    });
  });
});