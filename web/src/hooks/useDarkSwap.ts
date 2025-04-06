/**
 * useDarkSwap - React hook for using the DarkSwap WebAssembly module
 * 
 * This hook provides access to the DarkSwap WebAssembly module from React components.
 */

import { useState, useEffect, useCallback } from 'react';
import DarkSwapWasm, { Config, Order, OrderSide, AssetType } from '../wasm/DarkSwapWasm';
import OrderManager from '../wasm/OrderManager';
import { Event, EventType, GenericEventListener } from '../wasm/EventTypes';
import { 
  DarkSwapError, 
  ErrorCode, 
  WasmError, 
  OrderError, 
  createError, 
  logError, 
  tryAsync 
} from '../utils/ErrorHandling';

// DarkSwap hook result interface
export interface UseDarkSwapResult {
  // DarkSwap state
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  
  // DarkSwap actions
  initialize: (config: Config) => Promise<void>;
  stop: () => Promise<void>;
  
  // Event handling
  on: <T extends Event>(type: EventType, listener: (event: T) => void) => void;
  off: <T extends Event>(type: EventType, listener: (event: T) => void) => void;
  
  // Order management
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
}

/**
 * useDarkSwap hook
 * @param autoInitialize Whether to automatically initialize DarkSwap
 * @param config DarkSwap configuration
 * @returns DarkSwap hook result
 */
export function useDarkSwap(
  autoInitialize = false,
  config?: Config,
): UseDarkSwapResult {
  // DarkSwap instance
  const [darkswap] = useState<DarkSwapWasm>(() => new DarkSwapWasm());
  const [orderManager] = useState<OrderManager>(() => new OrderManager(darkswap));
  
  // DarkSwap state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize DarkSwap
  const initialize = useCallback(async (config: Config): Promise<void> => {
    return tryAsync(async () => {
      // Check if already initializing
      if (isInitializing) {
        throw new WasmError(
          'DarkSwap is already initializing',
          ErrorCode.AlreadyInitialized
        );
      }
      
      // Check if already initialized
      if (isInitialized) {
        throw new WasmError(
          'DarkSwap is already initialized',
          ErrorCode.AlreadyInitialized
        );
      }
      
      // Start initializing
      setIsInitializing(true);
      setError(null);
      
      try {
        // Initialize DarkSwap
        await darkswap.initialize(config);
        
        // Update state
        setIsInitialized(true);
      } catch (error) {
        // Create error
        const darkswapError = createError(
          error,
          'Failed to initialize DarkSwap',
          ErrorCode.WasmInitFailed
        );
        
        // Set error
        setError(darkswapError);
        
        // Rethrow error
        throw darkswapError;
      } finally {
        // End initializing
        setIsInitializing(false);
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.initialize');
      
      // Rethrow error
      throw error;
    });
  }, [darkswap, isInitialized, isInitializing]);
  
  // Stop DarkSwap
  const stop = useCallback(async (): Promise<void> => {
    return tryAsync(async () => {
      // Check if not initialized
      if (!isInitialized) {
        throw new WasmError(
          'DarkSwap is not initialized',
          ErrorCode.NotInitialized
        );
      }
      
      // Clear error
      setError(null);
      
      try {
        // Stop DarkSwap
        await darkswap.stop();
        
        // Update state
        setIsInitialized(false);
      } catch (error) {
        // Create error
        const darkswapError = createError(
          error,
          'Failed to stop DarkSwap',
          ErrorCode.WasmExecutionFailed
        );
        
        // Set error
        setError(darkswapError);
        
        // Rethrow error
        throw darkswapError;
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.stop');
      
      // Rethrow error
      throw error;
    });
  }, [darkswap, isInitialized]);
  
  // Event handling
  const on = useCallback(<T extends Event>(type: EventType, listener: (event: T) => void): void => {
    try {
      darkswap.on(type, listener as GenericEventListener);
    } catch (error) {
      // Create error
      const darkswapError = createError(
        error,
        `Failed to add event listener for type ${type}`,
        ErrorCode.Unknown
      );
      
      // Log error
      logError(darkswapError, 'useDarkSwap.on');
      
      // Set error
      setError(darkswapError);
      
      // Rethrow error
      throw darkswapError;
    }
  }, [darkswap]);
  
  const off = useCallback(<T extends Event>(type: EventType, listener: (event: T) => void): void => {
    try {
      darkswap.off(type, listener as GenericEventListener);
    } catch (error) {
      // Create error
      const darkswapError = createError(
        error,
        `Failed to remove event listener for type ${type}`,
        ErrorCode.Unknown
      );
      
      // Log error
      logError(darkswapError, 'useDarkSwap.off');
      
      // Set error
      setError(darkswapError);
      
      // Rethrow error
      throw darkswapError;
    }
  }, [darkswap]);
  
  // Order management
  const createOrder = useCallback(async (
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ): Promise<string> => {
    return tryAsync(async () => {
      try {
        return await orderManager.createOrder({
          side,
          baseAssetType,
          baseAssetId,
          quoteAssetType,
          quoteAssetId,
          amount,
          price,
        });
      } catch (error) {
        // Create error
        const orderError = createError(
          error,
          'Failed to create order',
          ErrorCode.OrderCreationFailed
        );
        
        // Set error
        setError(orderError);
        
        // Rethrow error
        throw orderError;
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.createOrder');
      
      // Rethrow error
      throw error;
    });
  }, [orderManager]);
  
  const cancelOrder = useCallback(async (orderId: string): Promise<void> => {
    return tryAsync(async () => {
      try {
        await orderManager.cancelOrder(orderId);
      } catch (error) {
        // Create error
        const orderError = createError(
          error,
          'Failed to cancel order',
          ErrorCode.OrderCancellationFailed
        );
        
        // Set error
        setError(orderError);
        
        // Rethrow error
        throw orderError;
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.cancelOrder');
      
      // Rethrow error
      throw error;
    });
  }, [orderManager]);
  
  const getOrder = useCallback(async (orderId: string): Promise<Order> => {
    return tryAsync(async () => {
      try {
        return await orderManager.getOrder(orderId);
      } catch (error) {
        // Create error
        const orderError = createError(
          error,
          'Failed to get order',
          ErrorCode.OrderNotFound
        );
        
        // Set error
        setError(orderError);
        
        // Rethrow error
        throw orderError;
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.getOrder');
      
      // Rethrow error
      throw error;
    });
  }, [orderManager]);
  
  const getOrders = useCallback(async (
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ): Promise<Order[]> => {
    return tryAsync(async () => {
      try {
        return await orderManager.getOrders({
          side,
          baseAssetType,
          baseAssetId,
          quoteAssetType,
          quoteAssetId,
        });
      } catch (error) {
        // Create error
        const orderError = createError(
          error,
          'Failed to get orders',
          ErrorCode.Unknown
        );
        
        // Set error
        setError(orderError);
        
        // Rethrow error
        throw orderError;
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.getOrders');
      
      // Rethrow error
      throw error;
    });
  }, [orderManager]);
  
  const takeOrder = useCallback(async (orderId: string, amount: string): Promise<string> => {
    return tryAsync(async () => {
      try {
        return await orderManager.takeOrder(orderId, amount);
      } catch (error) {
        // Create error
        const orderError = createError(
          error,
          'Failed to take order',
          ErrorCode.OrderExecutionFailed
        );
        
        // Set error
        setError(orderError);
        
        // Rethrow error
        throw orderError;
      }
    }, error => {
      // Log error
      logError(error, 'useDarkSwap.takeOrder');
      
      // Rethrow error
      throw error;
    });
  }, [orderManager]);
  
  // Auto-initialize
  useEffect(() => {
    if (autoInitialize && config && !isInitialized && !isInitializing) {
      initialize(config).catch(error => {
        logError(error, 'useDarkSwap.autoInitialize');
      });
    }
  }, [autoInitialize, config, isInitialized, isInitializing, initialize]);
  
  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
    stop,
    on,
    off,
    createOrder,
    cancelOrder,
    getOrder,
    getOrders,
    takeOrder,
  };
}

export default useDarkSwap;