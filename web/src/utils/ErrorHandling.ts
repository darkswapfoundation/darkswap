/**
 * Error handling utilities for DarkSwap
 */

/**
 * DarkSwap error codes
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  
  // WebAssembly errors
  WASM_LOAD_FAILED = 'WASM_LOAD_FAILED',
  WASM_INSTANTIATION_FAILED = 'WASM_INSTANTIATION_FAILED',
  
  // DarkSwap errors
  DARKSWAP_CREATION_FAILED = 'DARKSWAP_CREATION_FAILED',
  DARKSWAP_START_FAILED = 'DARKSWAP_START_FAILED',
  DARKSWAP_STOP_FAILED = 'DARKSWAP_STOP_FAILED',
  
  // Wallet errors
  WALLET_ADDRESS_FAILED = 'WALLET_ADDRESS_FAILED',
  WALLET_BALANCE_FAILED = 'WALLET_BALANCE_FAILED',
  WALLET_ASSET_BALANCE_FAILED = 'WALLET_ASSET_BALANCE_FAILED',
  
  // Order errors
  ORDER_CREATION_FAILED = 'ORDER_CREATION_FAILED',
  ORDER_CANCELLATION_FAILED = 'ORDER_CANCELLATION_FAILED',
  ORDER_RETRIEVAL_FAILED = 'ORDER_RETRIEVAL_FAILED',
  ORDERS_RETRIEVAL_FAILED = 'ORDERS_RETRIEVAL_FAILED',
  
  // Trade errors
  TRADE_CREATION_FAILED = 'TRADE_CREATION_FAILED',
  
  // Market errors
  MARKET_DATA_FAILED = 'MARKET_DATA_FAILED',
  
  // Event errors
  EVENT_SUBSCRIPTION_FAILED = 'EVENT_SUBSCRIPTION_FAILED',
}

/**
 * DarkSwap error
 */
export class DarkSwapError extends Error {
  /**
   * Error code
   */
  public readonly code: ErrorCode;
  
  /**
   * Original error
   */
  public readonly originalError?: Error | unknown;
  
  /**
   * Create a new DarkSwap error
   * @param code Error code
   * @param message Error message
   * @param originalError Original error
   */
  constructor(code: ErrorCode, message: string, originalError?: Error | unknown) {
    super(message);
    this.name = 'DarkSwapError';
    this.code = code;
    this.originalError = originalError;
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, DarkSwapError.prototype);
  }
  
  /**
   * Convert the error to a string
   */
  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
  
  /**
   * Convert the error to a JSON object
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      originalError: this.originalError instanceof Error
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : this.originalError,
    };
  }
}

/**
 * Create a DarkSwap error
 * @param code Error code
 * @param message Error message
 * @param originalError Original error
 */
export function createError(
  code: ErrorCode,
  message: string,
  originalError?: Error | unknown,
): DarkSwapError {
  return new DarkSwapError(code, message, originalError);
}

/**
 * Handle an error
 * @param error Error to handle
 * @param defaultCode Default error code
 * @param defaultMessage Default error message
 */
export function handleError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  defaultMessage: string = 'An unknown error occurred',
): DarkSwapError {
  if (error instanceof DarkSwapError) {
    return error;
  }
  
  if (error instanceof Error) {
    return createError(defaultCode, error.message, error);
  }
  
  if (typeof error === 'string') {
    return createError(defaultCode, error);
  }
  
  return createError(defaultCode, defaultMessage, error);
}

/**
 * Try to execute a function and handle any errors
 * @param fn Function to execute
 * @param errorCode Error code to use if the function throws
 * @param errorMessage Error message to use if the function throws
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode,
  errorMessage: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw handleError(error, errorCode, errorMessage);
  }
}

/**
 * Try to execute a function and handle any errors
 * @param fn Function to execute
 * @param errorCode Error code to use if the function throws
 * @param errorMessage Error message to use if the function throws
 */
export function trySync<T>(
  fn: () => T,
  errorCode: ErrorCode,
  errorMessage: string,
): T {
  try {
    return fn();
  } catch (error) {
    throw handleError(error, errorCode, errorMessage);
  }
}