/**
 * DarkSwapContext.tsx - React context for DarkSwap
 * 
 * This file provides a React context for the DarkSwap WebAssembly module,
 * making it available to all components in the application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide, Order, Trade } from '../wasm/DarkSwapWasm';
import { WasmError, OrderError, NetworkError, WalletError, TradeError, ErrorCode } from '../utils/ErrorHandling';
import { reportError } from '../utils/ErrorReporting';

// Define event types
export type EventType = 'order' | 'trade' | 'error' | 'connection' | 'wallet';

/**
 * DarkSwap context value
 */
export interface DarkSwapContextValue {
  /**
   * DarkSwap instance
   */
  darkswap: DarkSwapWasm;
  
  /**
   * Whether DarkSwap is initialized
   */
  isInitialized: boolean;
  
  /**
   * Whether DarkSwap is initializing
   */
  isInitializing: boolean;
  
  /**
   * Error
   */
  error: Error | null;
  
  /**
   * Initialize DarkSwap
   * @param config - Configuration
   * @returns Promise that resolves when DarkSwap is initialized
   */
  initialize: (config: Config) => Promise<void>;
  
  /**
   * Create an order
   * @param side - Order side
   * @param baseAssetType - Base asset type
   * @param baseAssetId - Base asset ID
   * @param quoteAssetType - Quote asset type
   * @param quoteAssetId - Quote asset ID
   * @param amount - Amount
   * @param price - Price
   * @returns Promise that resolves to the order ID
   */
  createOrder: (
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ) => Promise<string>;
  
  /**
   * Cancel an order
   * @param orderId - Order ID
   * @returns Promise that resolves when the order is cancelled
   */
  cancelOrder: (orderId: string) => Promise<void>;
  
  /**
   * Get an order
   * @param orderId - Order ID
   * @returns Promise that resolves to the order
   */
  getOrder: (orderId: string) => Promise<Order>;
  
  /**
   * Get orders
   * @param side - Order side
   * @param baseAssetType - Base asset type
   * @param baseAssetId - Base asset ID
   * @param quoteAssetType - Quote asset type
   * @param quoteAssetId - Quote asset ID
   * @returns Promise that resolves to the orders
   */
  getOrders: (
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ) => Promise<Order[]>;
  
  /**
   * Take an order
   * @param orderId - Order ID
   * @param amount - Amount
   * @returns Promise that resolves to the trade ID
   */
  takeOrder: (orderId: string, amount: string) => Promise<string>;
  
  /**
   * Register an event handler
   * @param event - Event type
   * @param handler - Event handler
   * @returns Function to remove the event handler
   */
  on: <T extends EventType>(event: T, handler: (event: any) => void) => () => void;
  
  /**
   * Set error
   * @param error - Error
   */
  setError: (error: Error | null) => void;
  
  /**
   * Clear error
   */
  clearError: () => void;
  
  /**
   * Get memory statistics
   * @returns Memory statistics
   */
  getMemoryStats: () => {
    totalAllocated: number;
    peakMemoryUsage: number;
    allocations: number;
    memorySize: number;
  } | null;
}

/**
 * DarkSwap context
 */
export const DarkSwapContext = createContext<DarkSwapContextValue | null>(null);

/**
 * DarkSwap provider props
 */
export interface DarkSwapProviderProps {
  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * DarkSwap provider
 * @param props - Props
 * @returns DarkSwap provider
 */
export const DarkSwapProvider: React.FC<DarkSwapProviderProps> = ({ children }) => {
  // Create DarkSwap instance
  const [darkswap] = useState(() => new DarkSwapWasm());
  
  // State
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize DarkSwap
  const initialize = useCallback(async (config: Config): Promise<void> => {
    try {
      // Set initializing flag
      setIsInitializing(true);
      
      // Clear error
      setError(null);
      
      // Initialize DarkSwap
      await darkswap.initialize(config);
    } catch (error) {
      // Set error
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Report error
      reportError(error, 'DarkSwapContext.initialize');
      
      // Rethrow error
      throw error;
    } finally {
      // Clear initializing flag
      setIsInitializing(false);
    }
  }, [darkswap]);
  
  // Create an order
  const createOrder = useCallback(async (
    side: OrderSide,
    baseAssetType: AssetType,
    baseAssetId: string,
    quoteAssetType: AssetType,
    quoteAssetId: string,
    amount: string,
    price: string,
  ): Promise<string> => {
    try {
      // Clear error
      setError(null);
      
      // Create order
      return await darkswap.createOrder(
        side,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
        amount,
        price,
      );
    } catch (error) {
      // Set error
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Report error
      reportError(error, 'DarkSwapContext.createOrder');
      
      // Rethrow error
      throw error;
    }
  }, [darkswap]);
  
  // Cancel an order
  const cancelOrder = useCallback(async (orderId: string): Promise<void> => {
    try {
      // Clear error
      setError(null);
      
      // Cancel order
      await darkswap.cancelOrder(orderId);
    } catch (error) {
      // Set error
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Report error
      reportError(error, 'DarkSwapContext.cancelOrder');
      
      // Rethrow error
      throw error;
    }
  }, [darkswap]);
  
  // Get an order
  const getOrder = useCallback(async (orderId: string): Promise<Order> => {
    try {
      // Clear error
      setError(null);
      
      // Get order
      return await darkswap.getOrder(orderId);
    } catch (error) {
      // Set error
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Report error
      reportError(error, 'DarkSwapContext.getOrder');
      
      // Rethrow error
      throw error;
    }
  }, [darkswap]);
  
  // Get orders
  const getOrders = useCallback(async (
    side?: OrderSide,
    baseAssetType?: AssetType,
    baseAssetId?: string,
    quoteAssetType?: AssetType,
    quoteAssetId?: string,
  ): Promise<Order[]> => {
    try {
      // Clear error
      setError(null);
      
      // Get orders
      return await darkswap.getOrders(
        side,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
      );
    } catch (error) {
      // Set error
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Report error
      reportError(error, 'DarkSwapContext.getOrders');
      
      // Rethrow error
      throw error;
    }
  }, [darkswap]);
  
  // Take an order
  const takeOrder = useCallback(async (orderId: string, amount: string): Promise<string> => {
    try {
      // Clear error
      setError(null);
      
      // Take order
      return await darkswap.takeOrder(orderId, amount);
    } catch (error) {
      // Set error
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Report error
      reportError(error, 'DarkSwapContext.takeOrder');
      
      // Rethrow error
      throw error;
    }
  }, [darkswap]);
  
  // Register an event handler
  const on = useCallback(<T extends EventType>(event: T, handler: (event: any) => void): (() => void) => {
    // Add event listener to darkswap instance
    const removeListener = darkswap.on(event, handler);
    
    // Return function to remove event listener
    return removeListener;
  }, [darkswap]);
  
  // Clear error
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  // Get memory statistics
  const getMemoryStats = useCallback((): {
    totalAllocated: number;
    peakMemoryUsage: number;
    allocations: number;
    memorySize: number;
  } | null => {
    try {
      // Get memory statistics
      return (darkswap as any).wasmModule?.getMemoryStats() || null;
    } catch (error) {
      // Report error
      reportError(error, 'DarkSwapContext.getMemoryStats');
      
      // Return null
      return null;
    }
  }, [darkswap]);
  
  // Create context value
  const contextValue: DarkSwapContextValue = {
    darkswap,
    isInitialized: darkswap.isInitialized,
    isInitializing,
    error,
    initialize,
    createOrder,
    cancelOrder,
    getOrder,
    getOrders,
    takeOrder,
    on,
    setError,
    clearError,
    getMemoryStats,
  };
  
  return (
    <DarkSwapContext.Provider value={contextValue}>
      {children}
    </DarkSwapContext.Provider>
  );
};

/**
 * Use DarkSwap hook
 * @returns DarkSwap context value
 * @throws Error if used outside of DarkSwapProvider
 */
export function useDarkSwap(): DarkSwapContextValue {
  const context = useContext(DarkSwapContext);
  
  if (!context) {
    throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  }
  
  return context;
}

/**
 * Default export
 */
export default DarkSwapContext;