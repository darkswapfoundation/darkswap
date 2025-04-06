/**
 * DarkSwapWasmErrorHandling.test.ts - Integration tests for DarkSwapWasm error handling
 * 
 * This file contains integration tests for the DarkSwapWasm error handling,
 * testing how the error handling system works with the WebAssembly module.
 */

import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from '../../wasm/DarkSwapWasm';
import OrderManager from '../../wasm/OrderManager';
import { useDarkSwap } from '../../hooks/useDarkSwap';
import { DarkSwapError, ErrorCode, WasmError, OrderError } from '../../utils/ErrorHandling';
import { reportError } from '../../utils/ErrorReporting';
import { retry, recover, wasmRecoveryStrategy, orderRecoveryStrategy } from '../../utils/ErrorRecovery';
import { renderHook, act } from '@testing-library/react-hooks';

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

// Mock reportError
jest.mock('../../utils/ErrorReporting', () => ({
  reportError: jest.fn().mockResolvedValue(undefined),
}));

describe('DarkSwapWasm Error Handling Integration', () => {
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
  
  describe('DarkSwapWasm class', () => {
    it('should handle initialization errors', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Make initialization fail
      (darkswap as any).darkswap = {
        set_event_callback: jest.fn().mockRejectedValue(new Error('Failed to set event callback')),
        start: jest.fn().mockRejectedValue(new Error('Failed to start')),
      };
      
      // Initialize should throw WasmError
      await expect(darkswap.initialize(defaultConfig)).rejects.toThrow(WasmError);
      
      // Error should have correct code
      try {
        await darkswap.initialize(defaultConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(WasmError);
        expect((error as WasmError).code).toBe(ErrorCode.WasmInitFailed);
      }
    });
    
    it('should handle order creation errors', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Initialize
      await darkswap.initialize(defaultConfig);
      
      // Make order creation fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      // Create order should throw OrderError
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      )).rejects.toThrow(OrderError);
      
      // Error should have correct code
      try {
        await darkswap.createOrder(
          OrderSide.Buy,
          AssetType.Bitcoin,
          'BTC',
          AssetType.Bitcoin,
          'USD',
          '1.0',
          '50000',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(OrderError);
        expect((error as OrderError).code).toBe(ErrorCode.OrderCreationFailed);
      }
    });
    
    it('should validate order parameters', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Initialize
      await darkswap.initialize(defaultConfig);
      
      // Create order with invalid parameters should throw OrderError
      await expect(darkswap.createOrder(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '-1.0', // Invalid amount
        '50000',
      )).rejects.toThrow(OrderError);
      
      // Error should have correct code
      try {
        await darkswap.createOrder(
          OrderSide.Buy,
          AssetType.Bitcoin,
          'BTC',
          AssetType.Bitcoin,
          'USD',
          '-1.0', // Invalid amount
          '50000',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(OrderError);
        expect((error as OrderError).code).toBe(ErrorCode.InvalidOrderParameters);
      }
    });
  });
  
  describe('OrderManager class', () => {
    it('should handle order creation errors', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Initialize
      await darkswap.initialize(defaultConfig);
      
      // Create OrderManager
      const orderManager = new OrderManager(darkswap);
      
      // Make order creation fail
      (darkswap as any).darkswap._setShouldFail(true);
      
      // Create order should throw OrderError
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
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Initialize
      await darkswap.initialize(defaultConfig);
      
      // Create OrderManager
      const orderManager = new OrderManager(darkswap);
      
      // Create order with invalid parameters should throw OrderError
      await expect(orderManager.createOrder({
        side: OrderSide.Buy,
        baseAssetType: AssetType.Bitcoin,
        baseAssetId: 'BTC',
        quoteAssetType: AssetType.Bitcoin,
        quoteAssetId: 'USD',
        amount: '-1.0', // Invalid amount
        price: '50000',
      })).rejects.toThrow(OrderError);
    });
  });
  
  describe('useDarkSwap hook', () => {
    it('should handle initialization errors', async () => {
      // Render hook
      const { result } = renderHook(() => useDarkSwap());
      
      // Make initialization fail
      const darkswap = result.current as any;
      darkswap.darkswap._setShouldFail(true);
      
      // Initialize should set error
      await act(async () => {
        try {
          await result.current.initialize(defaultConfig);
        } catch (error) {
          // Ignore error
        }
      });
      
      // Error should be set
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isInitializing).toBe(false);
    });
    
    it('should handle order creation errors', async () => {
      // Render hook
      const { result } = renderHook(() => useDarkSwap());
      
      // Initialize
      await act(async () => {
        await result.current.initialize(defaultConfig);
      });
      
      // Make order creation fail
      const darkswap = result.current as any;
      darkswap.darkswap._setShouldFail(true);
      
      // Create order should set error
      await act(async () => {
        try {
          await result.current.createOrder(
            OrderSide.Buy,
            AssetType.Bitcoin,
            'BTC',
            AssetType.Bitcoin,
            'USD',
            '1.0',
            '50000',
          );
        } catch (error) {
          // Ignore error
        }
      });
      
      // Error should be set
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
  
  describe('Error recovery', () => {
    it('should recover from initialization errors', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Make initialization fail once
      let initCount = 0;
      jest.spyOn(darkswap as any, 'darkswap', 'get').mockImplementation(() => {
        if (initCount === 0) {
          initCount++;
          throw new Error('Initialization error');
        }
        
        return {
          set_event_callback: jest.fn().mockResolvedValue(undefined),
          start: jest.fn().mockResolvedValue(undefined),
        };
      });
      
      // Retry initialization
      const result = await retry(
        () => darkswap.initialize(defaultConfig),
        {
          maxRetries: 1,
          retryDelay: 100,
        }
      );
      
      // Initialization should succeed
      expect(result).toBeUndefined();
      expect(darkswap.isInitialized).toBe(true);
    });
    
    it('should recover from order creation errors', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Initialize
      await darkswap.initialize(defaultConfig);
      
      // Make order creation fail once
      let createCount = 0;
      jest.spyOn(darkswap as any, 'darkswap', 'get').mockImplementation(() => {
        return {
          create_order: () => {
            if (createCount === 0) {
              createCount++;
              return Promise.reject(new Error('Order creation error'));
            }
            
            return Promise.resolve('order-id');
          },
        };
      });
      
      // Retry order creation
      const result = await retry(
        () => darkswap.createOrder(
          OrderSide.Buy,
          AssetType.Bitcoin,
          'BTC',
          AssetType.Bitcoin,
          'USD',
          '1.0',
          '50000',
        ),
        {
          maxRetries: 1,
          retryDelay: 100,
        }
      );
      
      // Order creation should succeed
      expect(result).toBe('order-id');
    });
    
    it('should use appropriate recovery strategies', async () => {
      // Create DarkSwapWasm instance
      const darkswap = new DarkSwapWasm();
      
      // Initialize
      await darkswap.initialize(defaultConfig);
      
      // Create functions that fail with different errors
      const wasmFn = () => Promise.reject(new WasmError('Wasm error', ErrorCode.WasmLoadFailed));
      const orderFn = () => Promise.reject(new OrderError('Order error', ErrorCode.OrderCreationFailed));
      
      // Create recovery functions
      const wasmRecover = jest.fn().mockResolvedValue('wasm recovery');
      const orderRecover = jest.fn().mockResolvedValue('order recovery');
      
      // Recover from errors
      const wasmResult = await recover(
        wasmFn,
        wasmRecoveryStrategy({
          maxRetries: 0,
        })
      ).catch(() => {
        // If recovery fails, use fallback
        return 'wasm fallback';
      });
      
      const orderResult = await recover(
        orderFn,
        orderRecoveryStrategy({
          maxRetries: 0,
        })
      ).catch(() => {
        // If recovery fails, use fallback
        return 'order fallback';
      });
      
      // Check results
      expect(wasmResult).toBe('wasm fallback');
      expect(orderResult).toBe('order fallback');
      
      // Errors should be reported
      expect(reportError).toHaveBeenCalledTimes(2);
    });
  });
});