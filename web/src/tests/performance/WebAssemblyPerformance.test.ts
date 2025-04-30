/**
 * WebAssemblyPerformance.test.ts - Performance tests for WebAssembly operations
 * 
 * This file contains performance tests for WebAssembly operations to ensure
 * that they meet performance requirements.
 */

import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from '../../wasm/DarkSwapWasm';
import OrderManager from '../../wasm/OrderManager';

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
      return new Promise(resolve => {
        // Simulate WebAssembly initialization time
        setTimeout(resolve, 50);
      });
    }
    
    stop(): Promise<void> {
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
      return new Promise(resolve => {
        // Simulate WebAssembly operation time
        setTimeout(() => resolve('order-id'), 10);
      });
    }
    
    cancel_order(_orderId: string): Promise<void> {
      return new Promise(resolve => {
        // Simulate WebAssembly operation time
        setTimeout(resolve, 10);
      });
    }
    
    get_order(_orderId: string): Promise<any> {
      return new Promise(resolve => {
        // Simulate WebAssembly operation time
        setTimeout(() => {
          resolve({
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
        }, 5);
      });
    }
    
    get_orders(
      _side: any,
      _baseAssetType: any,
      _baseAssetId: string | null,
      _quoteAssetType: any,
      _quoteAssetId: string | null,
    ): Promise<any[]> {
      return new Promise(resolve => {
        // Simulate WebAssembly operation time
        setTimeout(() => {
          // Generate a large number of orders for performance testing
          const orders = Array.from({ length: 1000 }, (_, i) => ({
            id: `order-id-${i}`,
            side: i % 2,
            baseAsset: 'BTC',
            quoteAsset: 'USD',
            amount: (Math.random() * 10).toFixed(8),
            price: (40000 + Math.random() * 20000).toFixed(2),
            timestamp: Date.now() - i * 1000,
            status: 0,
            maker: `peer-id-${i % 10}`,
          }));
          
          resolve(orders);
        }, 20);
      });
    }
    
    take_order(_orderId: string, _amount: string): Promise<string> {
      return new Promise(resolve => {
        // Simulate WebAssembly operation time
        setTimeout(() => resolve('trade-id'), 15);
      });
    }
  }
  
  return {
    JsConfig,
    JsDarkSwap,
  };
});

describe('WebAssembly Performance', () => {
  // Default configuration
  const defaultConfig: Config = {
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'ws://localhost:8080',
    listenAddresses: [],
    bootstrapPeers: [],
    debug: false,
  };
  
  // Performance thresholds
  const thresholds = {
    initialization: 100, // ms
    createOrder: 20, // ms
    cancelOrder: 20, // ms
    getOrder: 10, // ms
    getOrders: 50, // ms
    takeOrder: 30, // ms
    orderFiltering: 10, // ms
    orderSorting: 10, // ms
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize within performance threshold', async () => {
    const darkswap = new DarkSwapWasm();
    
    const startTime = performance.now();
    await darkswap.initialize(defaultConfig);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.initialization);
  });
  
  it('should create order within performance threshold', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    const startTime = performance.now();
    await darkswap.createOrder(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Bitcoin,
      'USD',
      '1.0',
      '50000',
    );
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.createOrder);
  });
  
  it('should cancel order within performance threshold', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    const startTime = performance.now();
    await darkswap.cancelOrder('order-id');
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.cancelOrder);
  });
  
  it('should get order within performance threshold', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    const startTime = performance.now();
    await darkswap.getOrder('order-id');
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.getOrder);
  });
  
  it('should get orders within performance threshold', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    const startTime = performance.now();
    await darkswap.getOrders(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Bitcoin,
      'USD',
    );
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.getOrders);
  });
  
  it('should take order within performance threshold', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    const startTime = performance.now();
    await darkswap.takeOrder('order-id', '1.0');
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.takeOrder);
  });
  
  it('should filter orders efficiently', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    // Get all orders
    const orders = await darkswap.getOrders();
    
    // Filter orders by side
    const startTime = performance.now();
    const buyOrders = orders.filter(order => order.side === OrderSide.Buy);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.orderFiltering);
    expect(buyOrders.length).toBeGreaterThan(0);
  });
  
  it('should sort orders efficiently', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    // Get all orders
    const orders = await darkswap.getOrders();
    
    // Sort orders by price
    const startTime = performance.now();
    const sortedOrders = [...orders].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.orderSorting);
    expect(sortedOrders.length).toBe(orders.length);
    expect(parseFloat(sortedOrders[0].price)).toBeLessThanOrEqual(parseFloat(sortedOrders[1].price));
  });
  
  it('should handle large order books efficiently', async () => {
    const darkswap = new DarkSwapWasm();
    await darkswap.initialize(defaultConfig);
    
    // Get all orders
    const orders = await darkswap.getOrders();
    
    // Create order manager
    const orderManager = new OrderManager(darkswap);
    
    // Measure time to process orders
    const startTime = performance.now();
    
    // Filter buy orders
    const buyOrders = orders.filter(order => order.side === OrderSide.Buy);
    
    // Filter sell orders
    const sellOrders = orders.filter(order => order.side === OrderSide.Sell);
    
    // Sort buy orders by price (descending)
    buyOrders.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    
    // Sort sell orders by price (ascending)
    sellOrders.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    // Calculate spread
    const bestBid = buyOrders.length > 0 ? parseFloat(buyOrders[0].price) : 0;
    const bestAsk = sellOrders.length > 0 ? parseFloat(sellOrders[0].price) : 0;
    const spread = bestAsk - bestBid;
    
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(thresholds.orderFiltering + thresholds.orderSorting);
    expect(spread).toBeGreaterThanOrEqual(0);
  });
});