/**
 * Error handling utilities
 * 
 * This module provides utilities for handling errors in the DarkSwap application.
 */

/**
 * Error codes
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  INVALID_STATE = 'INVALID_STATE',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  TIMEOUT = 'TIMEOUT',
  ABORTED = 'ABORTED',
  CANCELLED = 'CANCELLED',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  FAILED_PRECONDITION = 'FAILED_PRECONDITION',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  UNIMPLEMENTED = 'UNIMPLEMENTED',
  INTERNAL = 'INTERNAL',
  UNAVAILABLE = 'UNAVAILABLE',
  DATA_LOSS = 'DATA_LOSS',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  
  // DarkSwap specific errors
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  INVALID_ORDER = 'INVALID_ORDER',
  INVALID_TRADE = 'INVALID_TRADE',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  TRADE_NOT_FOUND = 'TRADE_NOT_FOUND',
  ORDER_ALREADY_EXISTS = 'ORDER_ALREADY_EXISTS',
  TRADE_ALREADY_EXISTS = 'TRADE_ALREADY_EXISTS',
  ORDER_EXPIRED = 'ORDER_EXPIRED',
  TRADE_EXPIRED = 'TRADE_EXPIRED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  TRADE_CANCELLED = 'TRADE_CANCELLED',
  ORDER_FILLED = 'ORDER_FILLED',
  TRADE_COMPLETED = 'TRADE_COMPLETED',
  
  // Wallet specific errors
  WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WALLET_OPERATION_FAILED = 'WALLET_OPERATION_FAILED',
  WALLET_NOT_SUPPORTED = 'WALLET_NOT_SUPPORTED',
  USER_REJECTED = 'USER_REJECTED',
  CHAIN_NOT_ADDED = 'CHAIN_NOT_ADDED',
  
  // WebAssembly specific errors
  WASM_LOAD_FAILED = 'WASM_LOAD_FAILED',
  WASM_COMPILE_FAILED = 'WASM_COMPILE_FAILED',
  WASM_INSTANTIATE_FAILED = 'WASM_INSTANTIATE_FAILED',
  WASM_EXECUTION_FAILED = 'WASM_EXECUTION_FAILED',
  
  // WebRTC specific errors
  WEBRTC_NOT_SUPPORTED = 'WEBRTC_NOT_SUPPORTED',
  WEBRTC_CONNECTION_FAILED = 'WEBRTC_CONNECTION_FAILED',
  WEBRTC_DATA_CHANNEL_FAILED = 'WEBRTC_DATA_CHANNEL_FAILED',
  WEBRTC_SIGNALING_FAILED = 'WEBRTC_SIGNALING_FAILED',
  WEBRTC_ICE_FAILED = 'WEBRTC_ICE_FAILED',
  WEBRTC_PEER_CONNECTION_FAILED = 'WEBRTC_PEER_CONNECTION_FAILED',
  
  // P2P specific errors
  P2P_CONNECTION_FAILED = 'P2P_CONNECTION_FAILED',
  P2P_MESSAGE_FAILED = 'P2P_MESSAGE_FAILED',
  P2P_PEER_NOT_FOUND = 'P2P_PEER_NOT_FOUND',
  P2P_PEER_DISCONNECTED = 'P2P_PEER_DISCONNECTED',
  P2P_PEER_TIMEOUT = 'P2P_PEER_TIMEOUT',
  P2P_PEER_ERROR = 'P2P_PEER_ERROR',
  
  // API specific errors
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_RESPONSE_INVALID = 'API_RESPONSE_INVALID',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_FORBIDDEN = 'API_FORBIDDEN',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_TIMEOUT = 'API_TIMEOUT',
  API_SERVER_ERROR = 'API_SERVER_ERROR',
  
  // WebSocket specific errors
  WEBSOCKET_CONNECTION_FAILED = 'WEBSOCKET_CONNECTION_FAILED',
  WEBSOCKET_MESSAGE_FAILED = 'WEBSOCKET_MESSAGE_FAILED',
  WEBSOCKET_DISCONNECTED = 'WEBSOCKET_DISCONNECTED',
  WEBSOCKET_TIMEOUT = 'WEBSOCKET_TIMEOUT',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
}

/**
 * DarkSwap error
 */
export class DarkSwapError extends Error {
  /**
   * Error code
   */
  code: ErrorCode;
  
  /**
   * Original error
   */
  originalError?: Error;
  
  /**
   * Create a new DarkSwap error
   * @param code Error code
   * @param message Error message
   * @param originalError Original error
   */
  constructor(code: ErrorCode, message: string, originalError?: Error) {
    super(message);
    this.name = 'DarkSwapError';
    this.code = code;
    this.originalError = originalError;
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, DarkSwapError.prototype);
  }
  
  /**
   * Convert to string
   * @returns String representation of the error
   */
  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
  
  /**
   * Convert to object
   * @returns Object representation of the error
   */
  toObject(): {
    name: string;
    code: ErrorCode;
    message: string;
    stack?: string;
    originalError?: {
      name: string;
      message: string;
      stack?: string;
    };
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
  
  /**
   * Convert to JSON
   * @returns JSON representation of the error
   */
  toJSON(): string {
    return JSON.stringify(this.toObject());
  }
}

/**
 * Try to execute an async function and handle errors
 * @param fn Function to execute
 * @param errorCode Error code to use if the function throws an error
 * @param errorMessage Error message to use if the function throws an error
 * @returns Promise that resolves to the result of the function
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode,
  errorMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error instanceof DarkSwapError) {
      throw error;
    }
    
    throw new DarkSwapError(
      errorCode,
      errorMessage,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Try to execute a sync function and handle errors
 * @param fn Function to execute
 * @param errorCode Error code to use if the function throws an error
 * @param errorMessage Error message to use if the function throws an error
 * @returns Result of the function
 */
export function trySync<T>(
  fn: () => T,
  errorCode: ErrorCode,
  errorMessage: string
): T {
  try {
    return fn();
  } catch (error: any) {
    if (error instanceof DarkSwapError) {
      throw error;
    }
    
    throw new DarkSwapError(
      errorCode,
      errorMessage,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Check if an error is a DarkSwap error
 * @param error Error to check
 * @returns Whether the error is a DarkSwap error
 */
export function isDarkSwapError(error: any): error is DarkSwapError {
  return error instanceof DarkSwapError;
}

/**
 * Check if an error has a specific error code
 * @param error Error to check
 * @param code Error code to check for
 * @returns Whether the error has the specified error code
 */
export function hasErrorCode(error: any, code: ErrorCode): boolean {
  return isDarkSwapError(error) && error.code === code;
}

/**
 * Get the error code from an error
 * @param error Error to get the code from
 * @returns Error code, or UNKNOWN_ERROR if the error is not a DarkSwap error
 */
export function getErrorCode(error: any): ErrorCode {
  return isDarkSwapError(error) ? error.code : ErrorCode.UNKNOWN_ERROR;
}

/**
 * Get the error message from an error
 * @param error Error to get the message from
 * @returns Error message
 */
export function getErrorMessage(error: any): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Get the error stack from an error
 * @param error Error to get the stack from
 * @returns Error stack, or undefined if the error is not an Error
 */
export function getErrorStack(error: any): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Get the original error from an error
 * @param error Error to get the original error from
 * @returns Original error, or undefined if the error is not a DarkSwap error or has no original error
 */
export function getOriginalError(error: any): Error | undefined {
  return isDarkSwapError(error) ? error.originalError : undefined;
}

/**
 * Create a new DarkSwap error
 * @param code Error code
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createError(
  code: ErrorCode,
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(code, message, originalError);
}

/**
 * Create a new unknown error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createUnknownError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.UNKNOWN_ERROR, message, originalError);
}

/**
 * Create a new network error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createNetworkError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.NETWORK_ERROR, message, originalError);
}

/**
 * Create a new API error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createApiError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.API_REQUEST_FAILED, message, originalError);
}

/**
 * Create a new WebSocket error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createWebSocketError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.WEBSOCKET_ERROR, message, originalError);
}

/**
 * Create a new WebRTC error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createWebRtcError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.WEBRTC_PEER_CONNECTION_FAILED, message, originalError);
}

/**
 * Create a new P2P error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createP2pError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.P2P_CONNECTION_FAILED, message, originalError);
}

/**
 * Create a new wallet error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createWalletError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, message, originalError);
}

/**
 * Create a new WebAssembly error
 * @param message Error message
 * @param originalError Original error
 * @returns DarkSwap error
 */
export function createWasmError(
  message: string,
  originalError?: Error
): DarkSwapError {
  return new DarkSwapError(ErrorCode.WASM_EXECUTION_FAILED, message, originalError);
}