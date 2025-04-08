/**
 * ErrorHandling.ts - Error handling utilities
 * 
 * This file provides error handling utilities for the DarkSwap application.
 */

/**
 * Error codes
 */
export enum ErrorCode {
  // General errors
  Unknown = 0,
  NotInitialized = 1,
  AlreadyInitialized = 2,
  AlreadyInitializing = 3,
  InvalidArgument = 4,
  Timeout = 5,
  CircuitBreakerOpen = 6,
  
  // WebAssembly errors
  WasmLoadFailed = 100,
  WasmInitFailed = 101,
  WasmExecutionFailed = 102,
  WasmShutdownFailed = 103,
  
  // Network errors
  NetworkError = 200,
  ConnectionFailed = 201,
  ConnectionClosed = 202,
  ConnectionTimeout = 203,
  
  // Wallet errors
  WalletNotConnected = 300,
  WalletConnectionFailed = 301,
  WalletSigningFailed = 302,
  WalletInsufficientFunds = 303,
  
  // Order errors
  OrderNotFound = 400,
  OrderCreationFailed = 401,
  OrderCancellationFailed = 402,
  OrderExecutionFailed = 403,
  InvalidOrderParameters = 404,
  
  // Trade errors
  TradeNotFound = 500,
  TradeCreationFailed = 501,
  TradeExecutionFailed = 502,
  TradeSettlementFailed = 503,
}

/**
 * Base error class for DarkSwap
 */
export class DarkSwapError extends Error {
  /**
   * Error code
   */
  public readonly code: ErrorCode;
  
  /**
   * Error details
   */
  public readonly details?: Record<string, any>;
  
  /**
   * Create a new DarkSwapError
   * @param message - Error message
   * @param code - Error code
   * @param details - Error details
   */
  constructor(message: string, code: ErrorCode = ErrorCode.Unknown, details?: Record<string, any>) {
    super(message);
    this.name = 'DarkSwapError';
    this.code = code;
    this.details = details;
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, DarkSwapError.prototype);
  }
  
  /**
   * Get details as a string
   * @returns Details as a string
   */
  getDetailsString(): string {
    if (!this.details) {
      return '';
    }
    
    return JSON.stringify(this.details, null, 2);
  }
  
  /**
   * Get full error message including details
   * @returns Full error message
   */
  getFullMessage(): string {
    const detailsString = this.getDetailsString();
    
    if (!detailsString) {
      return this.message;
    }
    
    return `${this.message}\nDetails: ${detailsString}`;
  }
}

/**
 * WebAssembly error
 */
export class WasmError extends DarkSwapError {
  /**
   * Create a new WasmError
   * @param message - Error message
   * @param code - Error code
   * @param details - Error details
   */
  constructor(message: string, code: ErrorCode = ErrorCode.WasmExecutionFailed, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'WasmError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, WasmError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends DarkSwapError {
  /**
   * Create a new NetworkError
   * @param message - Error message
   * @param code - Error code
   * @param details - Error details
   */
  constructor(message: string, code: ErrorCode = ErrorCode.NetworkError, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'NetworkError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Order error
 */
export class OrderError extends DarkSwapError {
  /**
   * Create a new OrderError
   * @param message - Error message
   * @param code - Error code
   * @param details - Error details
   */
  constructor(message: string, code: ErrorCode = ErrorCode.OrderNotFound, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'OrderError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, OrderError.prototype);
  }
}

/**
 * Wallet error
 */
export class WalletError extends DarkSwapError {
  /**
   * Create a new WalletError
   * @param message - Error message
   * @param code - Error code
   * @param details - Error details
   */
  constructor(message: string, code: ErrorCode = ErrorCode.WalletNotConnected, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'WalletError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, WalletError.prototype);
  }
}

/**
 * Trade error
 */
export class TradeError extends DarkSwapError {
  /**
   * Create a new TradeError
   * @param message - Error message
   * @param code - Error code
   * @param details - Error details
   */
  constructor(message: string, code: ErrorCode = ErrorCode.TradeNotFound, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'TradeError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, TradeError.prototype);
  }
}

/**
 * Create a DarkSwapError from any error
 * @param error - Error to convert
 * @param defaultMessage - Default message if error is not an Error
 * @param defaultCode - Default error code
 * @returns DarkSwapError
 */
export function createError(
  error: unknown,
  defaultMessage: string = 'An unknown error occurred',
  defaultCode: ErrorCode = ErrorCode.Unknown,
): DarkSwapError {
  // If error is already a DarkSwapError, return it
  if (error instanceof DarkSwapError) {
    return error;
  }
  
  // If error is an Error, create a DarkSwapError from it
  if (error instanceof Error) {
    return new DarkSwapError(error.message, defaultCode, {
      originalError: {
        name: error.name,
        stack: error.stack,
      },
    });
  }
  
  // If error is a string, create a DarkSwapError from it
  if (typeof error === 'string') {
    return new DarkSwapError(error, defaultCode);
  }
  
  // Otherwise, create a DarkSwapError with the default message
  return new DarkSwapError(defaultMessage, defaultCode, { originalError: error });
}

/**
 * Log an error
 * @param error - Error to log
 * @param context - Error context
 */
export function logError(error: unknown, context?: string): void {
  // Convert error to DarkSwapError
  const darkswapError = createError(error);
  
  // Log error
  if (context) {
    console.error(`[${context}] ${darkswapError.name}: ${darkswapError.message}`);
  } else {
    console.error(`${darkswapError.name}: ${darkswapError.message}`);
  }
  
  // Log details if available
  if (darkswapError.details) {
    console.error('Error details:', darkswapError.details);
  }
  
  // Log stack trace if available
  if (darkswapError.stack) {
    console.error('Stack trace:', darkswapError.stack);
  }
}

/**
 * Try to execute an async function and handle errors
 * @param fn - Function to execute
 * @param errorHandler - Error handler
 * @returns Result of the function
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: DarkSwapError) => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Convert error to DarkSwapError
    const darkswapError = createError(error);
    
    // Handle error if handler is provided
    if (errorHandler) {
      return await errorHandler(darkswapError);
    }
    
    // Otherwise, rethrow error
    throw darkswapError;
  }
}

/**
 * Try to execute a sync function and handle errors
 * @param fn - Function to execute
 * @param errorHandler - Error handler
 * @returns Result of the function
 */
export function trySync<T>(
  fn: () => T,
  errorHandler?: (error: DarkSwapError) => T,
): T {
  try {
    return fn();
  } catch (error) {
    // Convert error to DarkSwapError
    const darkswapError = createError(error);
    
    // Handle error if handler is provided
    if (errorHandler) {
      return errorHandler(darkswapError);
    }
    
    // Otherwise, rethrow error
    throw darkswapError;
  }
}