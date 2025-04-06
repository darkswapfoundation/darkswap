/**
 * useDarkSwap.test.tsx - Tests for the useDarkSwap hook
 * 
 * This file contains tests for the useDarkSwap hook, which provides
 * a React interface to the DarkSwapWasm module.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { DarkSwapProvider, useDarkSwap } from '../../hooks/useDarkSwap';
import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from '../../wasm/DarkSwapWasm';
import { WasmError, OrderError } from '../../utils/ErrorHandling';

// Mock DarkSwapWasm
jest.mock('../../wasm/DarkSwapWasm');

describe('useDarkSwap', () => {
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
    
    // Mock DarkSwapWasm methods
    const mockDarkSwapPrototype = DarkSwapWasm.prototype as jest.Mocked<DarkSwapWasm>;
    
    mockDarkSwapPrototype.initialize = jest.fn().mockResolvedValue(undefined);
    mockDarkSwapPrototype.createOrder = jest.fn().mockResolvedValue('order-id');
    mockDarkSwapPrototype.cancelOrder = jest.fn().mockResolvedValue(undefined);
    mockDarkSwapPrototype.getOrder = jest.fn().mockResolvedValue({
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
    mockDarkSwapPrototype.getOrders = jest.fn().mockResolvedValue([
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
    mockDarkSwapPrototype.takeOrder = jest.fn().mockResolvedValue('trade-id');
    mockDarkSwapPrototype.on = jest.fn().mockReturnValue(() => {});
    
    // Mock isInitialized getter
    Object.defineProperty(mockDarkSwapPrototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(false),
    });
  });
  
  it('should provide DarkSwap instance', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    expect(result.current).toBeDefined();
    expect(result.current.initialize).toBeDefined();
    expect(result.current.createOrder).toBeDefined();
    expect(result.current.cancelOrder).toBeDefined();
    expect(result.current.getOrder).toBeDefined();
    expect(result.current.getOrders).toBeDefined();
    expect(result.current.takeOrder).toBeDefined();
    expect(result.current.on).toBeDefined();
  });
  
  it('should initialize DarkSwap', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    await act(async () => {
      await result.current.initialize(defaultConfig);
    });
    
    expect(DarkSwapWasm.prototype.initialize).toHaveBeenCalledWith(defaultConfig);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('should handle initialization error', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Make initialization fail
    (DarkSwapWasm.prototype.initialize as jest.Mock).mockRejectedValue(
      new WasmError('Failed to initialize', 101)
    );
    
    await act(async () => {
      try {
        await result.current.initialize(defaultConfig);
      } catch (error) {
        // Ignore error
      }
    });
    
    expect(DarkSwapWasm.prototype.initialize).toHaveBeenCalledWith(defaultConfig);
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.error).toBeInstanceOf(WasmError);
    expect((result.current.error as WasmError).message).toBe('Failed to initialize');
  });
  
  it('should create order', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Mock isInitialized to return true
    Object.defineProperty(DarkSwapWasm.prototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(true),
    });
    
    await act(async () => {
      const orderId = await result.current.createOrder(
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
    
    expect(DarkSwapWasm.prototype.createOrder).toHaveBeenCalledWith(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Bitcoin,
      'USD',
      '1.0',
      '50000',
    );
    expect(result.current.error).toBeNull();
  });
  
  it('should handle create order error', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Mock isInitialized to return true
    Object.defineProperty(DarkSwapWasm.prototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(true),
    });
    
    // Make create order fail
    (DarkSwapWasm.prototype.createOrder as jest.Mock).mockRejectedValue(
      new OrderError('Failed to create order', 401)
    );
    
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
    
    expect(DarkSwapWasm.prototype.createOrder).toHaveBeenCalledWith(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Bitcoin,
      'USD',
      '1.0',
      '50000',
    );
    expect(result.current.error).toBeInstanceOf(OrderError);
    expect((result.current.error as OrderError).message).toBe('Failed to create order');
  });
  
  it('should cancel order', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Mock isInitialized to return true
    Object.defineProperty(DarkSwapWasm.prototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(true),
    });
    
    await act(async () => {
      await result.current.cancelOrder('order-id');
    });
    
    expect(DarkSwapWasm.prototype.cancelOrder).toHaveBeenCalledWith('order-id');
    expect(result.current.error).toBeNull();
  });
  
  it('should get order', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Mock isInitialized to return true
    Object.defineProperty(DarkSwapWasm.prototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(true),
    });
    
    await act(async () => {
      const order = await result.current.getOrder('order-id');
      
      expect(order).toBeDefined();
      expect(order.id).toBe('order-id');
    });
    
    expect(DarkSwapWasm.prototype.getOrder).toHaveBeenCalledWith('order-id');
    expect(result.current.error).toBeNull();
  });
  
  it('should get orders', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Mock isInitialized to return true
    Object.defineProperty(DarkSwapWasm.prototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(true),
    });
    
    await act(async () => {
      const orders = await result.current.getOrders(
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
    
    expect(DarkSwapWasm.prototype.getOrders).toHaveBeenCalledWith(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Bitcoin,
      'USD',
    );
    expect(result.current.error).toBeNull();
  });
  
  it('should take order', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Mock isInitialized to return true
    Object.defineProperty(DarkSwapWasm.prototype, 'isInitialized', {
      get: jest.fn().mockReturnValue(true),
    });
    
    await act(async () => {
      const tradeId = await result.current.takeOrder('order-id', '1.0');
      
      expect(tradeId).toBe('trade-id');
    });
    
    expect(DarkSwapWasm.prototype.takeOrder).toHaveBeenCalledWith('order-id', '1.0');
    expect(result.current.error).toBeNull();
  });
  
  it('should register event handler', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    const eventHandler = jest.fn();
    
    act(() => {
      result.current.on('order', eventHandler);
    });
    
    expect(DarkSwapWasm.prototype.on).toHaveBeenCalledWith('order', expect.any(Function));
  });
  
  it('should clear error', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DarkSwapProvider>{children}</DarkSwapProvider>
    );
    
    const { result } = renderHook(() => useDarkSwap(), { wrapper });
    
    // Set error
    act(() => {
      result.current.setError(new Error('Test error'));
    });
    
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Test error');
    
    // Clear error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });
});