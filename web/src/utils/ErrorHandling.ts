/**
 * ErrorHandling - Error handling utilities
 * 
 * This file provides error handling utilities for the DarkSwap application.
 */

// Error codes
export enum ErrorCode {
  // General errors
  Unknown = 0,
  NotInitialized = 1,
  AlreadyInitialized = 2,
  InvalidArgument = 3,
  Timeout = 4,
  
  // WebAssembly errors
  WasmLoadFailed = 100,
  WasmInitFailed = 101,
  WasmExecutionFailed = 102,
  
  // Network errors
  NetworkError = 200,
  ConnectionFailed = 201,
  ConnectionClosed = 202,
  PeerNotFound = 203,
  RelayNotFound = 204,
  
  // Wallet errors
  WalletNotConnected = 300,
  WalletConnectionFailed = 301,
  WalletSigningFailed = 302,
  InsufficientFunds = 303,
  InvalidAddress = 304,
  
  // Order errors
  OrderNotFound = 400,
  OrderCreationFailed = 401,
  OrderCancellationFailed = 402,
  OrderExecutionFailed = 403,
  InvalidOrderParameters = 404,
  
  // Trade errors
  TradeNotFound = 500,
  TradeExecutionFailed = 501,
  TradeValidationFailed = 502,
}

// Base error class
export class DarkSwapError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  
  constructor(message: string, code: ErrorCode = ErrorCode.Unknown, details?: Record<string, any>) {
    super(message);
    this.name = 'DarkSwapError';
    this.code = code;
    this.details = details;
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, DarkSwapError.prototype);
  }
  
  /**
   * Get error details as a string
   * @returns Error details as a string
   */
  public getDetailsString(): string {
    if (!this.details) return '';
    
    try {
      return JSON.stringify(this.details, null, 2);
    } catch (err) {
      return `Error serializing details: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  
  /**
   * Get full error message including details
   * @returns Full error message
   */
  public getFullMessage(): string {
    const detailsString = this.getDetailsString();
    return detailsString ? `${this.message}\nDetails: ${detailsString}` : this.message;
  }
}

// WebAssembly error class
export class WasmError extends DarkSwapError {
  constructor(message: string, code: ErrorCode = ErrorCode.WasmExecutionFailed, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'WasmError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, WasmError.prototype);
  }
}

// Network error class
export class NetworkError extends DarkSwapError {
  constructor(message: string, code: ErrorCode = ErrorCode.NetworkError, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'NetworkError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// Wallet error class
export class WalletError extends DarkSwapError {
  constructor(message: string, code: ErrorCode = ErrorCode.WalletNotConnected, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'WalletError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, WalletError.prototype);
  }
}

// Order error class
export class OrderError extends DarkSwapError {
  constructor(message: string, code: ErrorCode = ErrorCode.OrderNotFound, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'OrderError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, OrderError.prototype);
  }
}

// Trade error class
export class TradeError extends DarkSwapError {
  constructor(message: string, code: ErrorCode = ErrorCode.TradeNotFound, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'TradeError';
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, TradeError.prototype);
  }
}

/**
 * Create an error from an unknown error
 * @param error Unknown error
 * @param defaultMessage Default message
 * @param defaultCode Default error code
 * @returns DarkSwapError
 */
export function createError(
  error: unknown,
  defaultMessage = 'An unknown error occurred',
  defaultCode = ErrorCode.Unknown,
): DarkSwapError {
  if (error instanceof DarkSwapError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new DarkSwapError(error.message, defaultCode, {
      originalError: {
        name: error.name,
        stack: error.stack,
      },
    });
  }
  
  return new DarkSwapError(
    typeof error === 'string' ? error : defaultMessage,
    defaultCode,
    typeof error === 'object' && error !== null ? { originalError: error } : undefined,
  );
}

/**
 * Log an error
 * @param error Error to log
 * @param context Context information
 */
export function logError(error: unknown, context?: string): void {
  const darkswapError = createError(error);
  
  if (context) {
    console.error(`[${context}] ${darkswapError.name}: ${darkswapError.message}`);
  } else {
    console.error(`${darkswapError.name}: ${darkswapError.message}`);
  }
  
  if (darkswapError.details) {
    console.error('Error details:', darkswapError.details);
  }
  
  if (darkswapError.stack) {
    console.error('Stack trace:', darkswapError.stack);
  }
}

/**
 * Try to execute a function and handle errors
 * @param fn Function to execute
 * @param errorHandler Error handler
 * @returns Result of the function
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: DarkSwapError) => Promise<T> | T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const darkswapError = createError(error);
    
    if (errorHandler) {
      return errorHandler(darkswapError);
    }
    
    throw darkswapError;
  }
}

/**
 * Try to execute a function and handle errors
 * @param fn Function to execute
 * @param errorHandler Error handler
 * @returns Result of the function
 */
export function trySync<T>(
  fn: () => T,
  errorHandler?: (error: DarkSwapError) => T,
): T {
  try {
    return fn();
  } catch (error) {
    const darkswapError = createError(error);
    
    if (errorHandler) {
      return errorHandler(darkswapError);
    }
    
    throw darkswapError;
  }
}