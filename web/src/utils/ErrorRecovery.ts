/**
 * ErrorRecovery - Error recovery utilities
 * 
 * This file provides error recovery utilities for the DarkSwap application.
 * It allows recovering from common errors automatically.
 */

import { DarkSwapError, ErrorCode, WasmError, NetworkError, OrderError, WalletError } from './ErrorHandling';
import { reportError } from './ErrorReporting';

// Recovery strategy type
export type RecoveryStrategy<T> = (error: DarkSwapError, context: RecoveryContext) => Promise<T>;

// Recovery context
export interface RecoveryContext {
  /** Retry count */
  retryCount: number;
  
  /** Original function */
  originalFn: () => Promise<any>;
  
  /** Recovery options */
  options: RecoveryOptions;
}

// Recovery options
export interface RecoveryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
  
  /** Whether to use exponential backoff */
  useExponentialBackoff?: boolean;
  
  /** Maximum retry delay in milliseconds */
  maxRetryDelay?: number;
  
  /** Whether to report errors */
  reportErrors?: boolean;
  
  /** Context for error reporting */
  reportingContext?: string;
}

// Default recovery options
const defaultOptions: RecoveryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  useExponentialBackoff: true,
  maxRetryDelay: 30000,
  reportErrors: true,
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Recovery options
 * @returns Promise that resolves with the result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RecoveryOptions = {},
): Promise<T> {
  // Merge options with defaults
  const mergedOptions: RecoveryOptions = {
    ...defaultOptions,
    ...options,
  };
  
  // Initialize retry count
  let retryCount = 0;
  
  // Try to execute the function
  while (true) {
    try {
      return await fn();
    } catch (error) {
      // Convert error to DarkSwapError
      const darkswapError = error instanceof DarkSwapError
        ? error
        : new DarkSwapError(
            error instanceof Error ? error.message : String(error),
            ErrorCode.Unknown,
            { originalError: error }
          );
      
      // Increment retry count
      retryCount++;
      
      // Check if we've reached the maximum number of retries
      if (retryCount >= (mergedOptions.maxRetries || 0)) {
        // Report error if enabled
        if (mergedOptions.reportErrors) {
          await reportError(darkswapError, mergedOptions.reportingContext);
        }
        
        // Rethrow error
        throw darkswapError;
      }
      
      // Calculate retry delay
      let retryDelay = mergedOptions.retryDelay || 0;
      
      // Apply exponential backoff if enabled
      if (mergedOptions.useExponentialBackoff) {
        retryDelay = Math.min(
          retryDelay * Math.pow(2, retryCount - 1),
          mergedOptions.maxRetryDelay || Number.MAX_SAFE_INTEGER
        );
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Recover from an error using a recovery strategy
 * @param fn Function to execute
 * @param strategy Recovery strategy
 * @param options Recovery options
 * @returns Promise that resolves with the result of the function or recovery strategy
 */
export async function recover<T>(
  fn: () => Promise<T>,
  strategy: RecoveryStrategy<T>,
  options: RecoveryOptions = {},
): Promise<T> {
  // Merge options with defaults
  const mergedOptions: RecoveryOptions = {
    ...defaultOptions,
    ...options,
  };
  
  try {
    return await fn();
  } catch (error) {
    // Convert error to DarkSwapError
    const darkswapError = error instanceof DarkSwapError
      ? error
      : new DarkSwapError(
          error instanceof Error ? error.message : String(error),
          ErrorCode.Unknown,
          { originalError: error }
        );
    
    // Report error if enabled
    if (mergedOptions.reportErrors) {
      await reportError(darkswapError, mergedOptions.reportingContext);
    }
    
    // Create recovery context
    const context: RecoveryContext = {
      retryCount: 0,
      originalFn: fn,
      options: mergedOptions,
    };
    
    // Execute recovery strategy
    return await strategy(darkswapError, context);
  }
}

/**
 * Create a recovery strategy that retries the function
 * @param options Recovery options
 * @returns Recovery strategy
 */
export function retryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error: DarkSwapError, context: RecoveryContext) => {
    // Merge options with context options
    const mergedOptions: RecoveryOptions = {
      ...context.options,
      ...options,
    };
    
    // Retry the function
    return await retry<T>(context.originalFn, mergedOptions);
  };
}

/**
 * Create a recovery strategy that falls back to a default value
 * @param defaultValue Default value
 * @returns Recovery strategy
 */
export function fallbackStrategy<T>(defaultValue: T): RecoveryStrategy<T> {
  return async () => {
    return defaultValue;
  };
}

/**
 * Create a recovery strategy that throws a custom error
 * @param message Error message
 * @param code Error code
 * @param details Error details
 * @returns Recovery strategy
 */
export function throwStrategy<T>(
  message: string,
  code: ErrorCode = ErrorCode.Unknown,
  details?: Record<string, any>,
): RecoveryStrategy<T> {
  return async (error: DarkSwapError) => {
    throw new DarkSwapError(
      message,
      code,
      {
        ...details,
        originalError: error,
      }
    );
  };
}

/**
 * Create a recovery strategy that executes a custom function
 * @param fn Custom function
 * @returns Recovery strategy
 */
export function customStrategy<T>(
  fn: (error: DarkSwapError, context: RecoveryContext) => Promise<T>,
): RecoveryStrategy<T> {
  return fn;
}

/**
 * Create a recovery strategy for WebAssembly errors
 * @param options Recovery options
 * @returns Recovery strategy
 */
export function wasmRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error: DarkSwapError, context: RecoveryContext) => {
    // Check if error is a WebAssembly error
    if (error instanceof WasmError) {
      // Handle specific WebAssembly errors
      switch (error.code) {
        case ErrorCode.WasmLoadFailed:
        case ErrorCode.WasmInitFailed:
          // Retry with increased delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
            retryDelay: (context.options.retryDelay || 1000) * 2,
          });
        
        case ErrorCode.WasmExecutionFailed:
          // Retry with normal delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
          });
        
        default:
          // Rethrow error
          throw error;
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Create a recovery strategy for network errors
 * @param options Recovery options
 * @returns Recovery strategy
 */
export function networkRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error: DarkSwapError, context: RecoveryContext) => {
    // Check if error is a network error
    if (error instanceof NetworkError) {
      // Handle specific network errors
      switch (error.code) {
        case ErrorCode.ConnectionFailed:
        case ErrorCode.ConnectionClosed:
          // Retry with increased delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
            retryDelay: (context.options.retryDelay || 1000) * 2,
          });
        
        default:
          // Retry with normal delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
          });
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Create a recovery strategy for order errors
 * @param options Recovery options
 * @returns Recovery strategy
 */
export function orderRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error: DarkSwapError, context: RecoveryContext) => {
    // Check if error is an order error
    if (error instanceof OrderError) {
      // Handle specific order errors
      switch (error.code) {
        case ErrorCode.OrderCreationFailed:
        case ErrorCode.OrderCancellationFailed:
        case ErrorCode.OrderExecutionFailed:
          // Retry with normal delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
          });
        
        default:
          // Rethrow error
          throw error;
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Create a recovery strategy for wallet errors
 * @param options Recovery options
 * @returns Recovery strategy
 */
export function walletRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error: DarkSwapError, context: RecoveryContext) => {
    // Check if error is a wallet error
    if (error instanceof WalletError) {
      // Handle specific wallet errors
      switch (error.code) {
        case ErrorCode.WalletConnectionFailed:
          // Retry with increased delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
            retryDelay: (context.options.retryDelay || 1000) * 2,
          });
        
        case ErrorCode.WalletSigningFailed:
          // Retry with normal delay
          return await retry<T>(context.originalFn, {
            ...context.options,
            ...options,
          });
        
        default:
          // Rethrow error
          throw error;
      }
    }
    
    // Rethrow error
    throw error;
  };
}