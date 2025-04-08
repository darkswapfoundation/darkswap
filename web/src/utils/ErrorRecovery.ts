/**
 * ErrorRecovery.ts - Error recovery utilities
 * 
 * This file provides error recovery utilities for the DarkSwap application.
 */

import { DarkSwapError, WasmError, NetworkError, OrderError, WalletError, TradeError, ErrorCode, createError } from './ErrorHandling';
import { reportError } from './ErrorReporting';

/**
 * Recovery options
 */
export interface RecoveryOptions {
  /**
   * Maximum number of retries
   */
  maxRetries?: number;
  
  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Maximum retry delay in milliseconds
   */
  maxRetryDelay?: number;
  
  /**
   * Whether to use exponential backoff
   */
  useExponentialBackoff?: boolean;
  
  /**
   * Whether to report errors
   */
  reportErrors?: boolean;
  
  /**
   * Error reporting context
   */
  reportingContext?: string;
  
  /**
   * Circuit breaker threshold
   */
  circuitBreakerThreshold?: number;
  
  /**
   * Circuit breaker reset timeout in milliseconds
   */
  circuitBreakerResetTimeout?: number;
}

/**
 * Recovery context
 */
export interface RecoveryContext<T> {
  /**
   * Retry count
   */
  retryCount: number;
  
  /**
   * Original function
   */
  originalFn: () => Promise<T>;
  
  /**
   * Recovery options
   */
  options: RecoveryOptions;
  
  /**
   * Circuit breaker state
   */
  circuitBreaker?: {
    /**
     * Whether the circuit is open
     */
    isOpen: boolean;
    
    /**
     * Failure count
     */
    failureCount: number;
    
    /**
     * Last failure time
     */
    lastFailureTime: number;
  };
}

/**
 * Recovery strategy
 */
export type RecoveryStrategy<T> = (
  error: DarkSwapError,
  context: RecoveryContext<T>,
) => Promise<T>;

/**
 * Circuit breaker state
 */
const circuitBreakers = new Map<string, {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
}>();

/**
 * Retry a function
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise that resolves to the result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RecoveryOptions = {},
): Promise<T> {
  // Default options
  const defaultOptions: RecoveryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    useExponentialBackoff: false,
    reportErrors: false,
  };
  
  // Merge options
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
        : createError(
            error,
            'An error occurred during retry',
            ErrorCode.Unknown
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
 * Recover from an error
 * @param fn - Function to execute
 * @param strategy - Recovery strategy
 * @param options - Recovery options
 * @returns Promise that resolves to the result of the function
 */
export async function recover<T>(
  fn: () => Promise<T>,
  strategy: RecoveryStrategy<T>,
  options: RecoveryOptions = {},
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Convert error to DarkSwapError
    const darkswapError = error instanceof DarkSwapError
      ? error
      : createError(
          error,
          'An error occurred during recovery',
          ErrorCode.Unknown
        );
    
    // Check circuit breaker
    if (options.circuitBreakerThreshold && options.reportingContext) {
      const circuitBreaker = circuitBreakers.get(options.reportingContext) || {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
      };
      
      // Update circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Check if circuit breaker should open
      if (circuitBreaker.failureCount >= options.circuitBreakerThreshold) {
        circuitBreaker.isOpen = true;
      }
      
      // Save circuit breaker
      circuitBreakers.set(options.reportingContext, circuitBreaker);
      
      // Check if circuit is open
      if (circuitBreaker.isOpen) {
        // Check if circuit breaker should reset
        if (options.circuitBreakerResetTimeout &&
            Date.now() - circuitBreaker.lastFailureTime > options.circuitBreakerResetTimeout) {
          // Reset circuit breaker
          circuitBreaker.isOpen = false;
          circuitBreaker.failureCount = 0;
          circuitBreakers.set(options.reportingContext, circuitBreaker);
        } else {
          // Report error if enabled
          if (options.reportErrors) {
            await reportError(
              darkswapError,
              `${options.reportingContext} (circuit open)`
            );
          }
          
          // Throw circuit breaker error
          throw createError(
            darkswapError,
            `Circuit breaker open for ${options.reportingContext}`,
            ErrorCode.CircuitBreakerOpen
          );
        }
      }
    }
    
    // Apply recovery strategy
    return await strategy(darkswapError, {
      retryCount: 0,
      originalFn: fn,
      options,
    });
  }
}

/**
 * Retry strategy
 * @param options - Retry options
 * @returns Recovery strategy
 */
export function retryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error, context) => {
    return await retry(
      context.originalFn,
      {
        ...context.options,
        ...options,
      }
    );
  };
}

/**
 * Fallback strategy
 * @param fallbackValue - Fallback value
 * @returns Recovery strategy
 */
export function fallbackStrategy<T>(fallbackValue: T): RecoveryStrategy<T> {
  return async () => {
    return fallbackValue;
  };
}

/**
 * Throw strategy
 * @param message - Error message
 * @param code - Error code
 * @returns Recovery strategy
 */
export function throwStrategy<T>(
  message: string,
  code: ErrorCode = ErrorCode.Unknown,
): RecoveryStrategy<T> {
  return async (error) => {
    throw createError(
      error,
      message,
      code
    );
  };
}

/**
 * Custom strategy
 * @param fn - Custom function
 * @returns Recovery strategy
 */
export function customStrategy<T>(
  fn: (error: DarkSwapError, context: RecoveryContext<T>) => Promise<T>,
): RecoveryStrategy<T> {
  return async (error, context) => {
    return await fn(error, context);
  };
}

/**
 * WebAssembly recovery strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function wasmRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error, context) => {
    // Check if error is a WebAssembly error
    if (error instanceof WasmError) {
      // Retry for specific error codes
      if (
        error.code === ErrorCode.WasmLoadFailed ||
        error.code === ErrorCode.WasmInitFailed ||
        error.code === ErrorCode.WasmExecutionFailed
      ) {
        return await retry(
          context.originalFn,
          {
            ...context.options,
            ...options,
          }
        );
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Network recovery strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function networkRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error, context) => {
    // Check if error is a network error
    if (error instanceof NetworkError) {
      // Retry for specific error codes
      if (
        error.code === ErrorCode.ConnectionFailed ||
        error.code === ErrorCode.ConnectionTimeout
      ) {
        return await retry(
          context.originalFn,
          {
            ...context.options,
            ...options,
          }
        );
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Order recovery strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function orderRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error, context) => {
    // Check if error is an order error
    if (error instanceof OrderError) {
      // Retry for specific error codes
      if (
        error.code === ErrorCode.OrderCreationFailed ||
        error.code === ErrorCode.OrderExecutionFailed
      ) {
        return await retry(
          context.originalFn,
          {
            ...context.options,
            ...options,
          }
        );
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Wallet recovery strategy
 * @param options - Recovery options
 * @returns Recovery strategy
 */
export function walletRecoveryStrategy<T>(options: RecoveryOptions = {}): RecoveryStrategy<T> {
  return async (error, context) => {
    // Check if error is a wallet error
    if (error instanceof WalletError) {
      // Retry for specific error codes
      if (
        error.code === ErrorCode.WalletConnectionFailed ||
        error.code === ErrorCode.WalletSigningFailed
      ) {
        return await retry(
          context.originalFn,
          {
            ...context.options,
            ...options,
          }
        );
      }
    }
    
    // Rethrow error
    throw error;
  };
}

/**
 * Default export
 */
export default {
  retry,
  recover,
  retryStrategy,
  fallbackStrategy,
  throwStrategy,
  customStrategy,
  wasmRecoveryStrategy,
  networkRecoveryStrategy,
  orderRecoveryStrategy,
  walletRecoveryStrategy,
};