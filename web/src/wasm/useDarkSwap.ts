/**
 * useDarkSwap - React hook for using the DarkSwap WebAssembly module
 * 
 * This hook provides access to the DarkSwap WebAssembly module from React components.
 */

import { useState, useEffect, useCallback } from 'react';
import DarkSwapWasm, { AssetType, OrderSide, Order, Trade } from './DarkSwapWasm';

// DarkSwap hook result interface
export interface UseDarkSwapResult {
  // Initialization
  initialize: (wasmPath: string) => Promise<void>;
  create: (config: any) => Promise<void>;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Core functionality
  start: () => Promise<void>;
  stop: () => Promise<void>;
  
  // Order book functionality
  createOrder: (
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrder: (orderId: string) => Promise<Order>;
  getOrders: (
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ) => Promise<Order[]>;
  takeOrder: (orderId: string, amount: string) => Promise<string>;
  
  // Event handling
  on: (eventType: string, handler: (event: any) => void) => void;
  off: (eventType: string, handler: (event: any) => void) => void;
}

/**
 * DarkSwap hook
 * @returns DarkSwap hook result
 */
export function useDarkSwap(): UseDarkSwapResult {
  // State
  const [darkswap] = useState<DarkSwapWasm>(() => new DarkSwapWasm());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize DarkSwap
  const initialize = useCallback(async (wasmPath: string): Promise<void> => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await darkswap.initialize(wasmPath);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [darkswap, isInitialized]);
  
  // Create DarkSwap instance
  const create = useCallback(async (config: any): Promise<void> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await darkswap.create(config);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [darkswap, isInitialized]);
  
  // Start DarkSwap
  const start = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // No need to call start since it's already called in create
      // This is just a placeholder for future use
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);
  
  // Stop DarkSwap
  const stop = useCallback(async (): Promise<void> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await darkswap.stop();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [darkswap, isInitialized]);
  
  // Create order
  const createOrder = useCallback(async (
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ): Promise<string> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setError(null);
    
    try {
      return await darkswap.createOrder(
        side,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
        amount,
        price,
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [darkswap, isInitialized]);
  
  // Cancel order
  const cancelOrder = useCallback(async (orderId: string): Promise<void> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setError(null);
    
    try {
      await darkswap.cancelOrder(orderId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [darkswap, isInitialized]);
  
  // Get order
  const getOrder = useCallback(async (orderId: string): Promise<Order> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setError(null);
    
    try {
      return await darkswap.getOrder(orderId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [darkswap, isInitialized]);
  
  // Get orders
  const getOrders = useCallback(async (
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ): Promise<Order[]> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setError(null);
    
    try {
      return await darkswap.getOrders(
        side,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [darkswap, isInitialized]);
  
  // Take order
  const takeOrder = useCallback(async (orderId: string, amount: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('DarkSwap not initialized');
    }
    
    setError(null);
    
    try {
      return await darkswap.takeOrder(orderId, amount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [darkswap, isInitialized]);
  
  // Register event handler
  const on = useCallback((eventType: string, handler: (event: any) => void): void => {
    darkswap.on(eventType, handler);
  }, [darkswap]);
  
  // Unregister event handler
  const off = useCallback((eventType: string, handler: (event: any) => void): void => {
    darkswap.off(eventType, handler);
  }, [darkswap]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        darkswap.stop().catch(console.error);
      }
    };
  }, [darkswap, isInitialized]);
  
  return {
    initialize,
    create,
    isInitialized,
    isLoading,
    error,
    start,
    stop,
    createOrder,
    cancelOrder,
    getOrder,
    getOrders,
    takeOrder,
    on,
    off,
  };
}

export default useDarkSwap;