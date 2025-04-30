/**
 * Error handler utility for DarkSwap
 * 
 * This utility provides a centralized way to handle errors in the DarkSwap application.
 * It includes functions for handling API errors, WebSocket errors, and general application errors.
 */

import { ApiError } from '../types/api';
import { logger } from './logger';

/**
 * Error codes for the DarkSwap application
 */
export enum ErrorCode {
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // WebSocket errors
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  WEBSOCKET_CONNECTION_ERROR = 'WEBSOCKET_CONNECTION_ERROR',
  WEBSOCKET_AUTHENTICATION_ERROR = 'WEBSOCKET_AUTHENTICATION_ERROR',
  WEBSOCKET_SUBSCRIPTION_ERROR = 'WEBSOCKET_SUBSCRIPTION_ERROR',
  
  // P2P errors
  P2P_ERROR = 'P2P_ERROR',
  P2P_CONNECTION_ERROR = 'P2P_CONNECTION_ERROR',
  P2P_PEER_ERROR = 'P2P_PEER_ERROR',
  P2P_RELAY_ERROR = 'P2P_RELAY_ERROR',
  
  // Wallet errors
  WALLET_ERROR = 'WALLET_ERROR',
  WALLET_CONNECTION_ERROR = 'WALLET_CONNECTION_ERROR',
  WALLET_TRANSACTION_ERROR = 'WALLET_TRANSACTION_ERROR',
  WALLET_BALANCE_ERROR = 'WALLET_BALANCE_ERROR',
  
  // Trade errors
  TRADE_ERROR = 'TRADE_ERROR',
  TRADE_CREATION_ERROR = 'TRADE_CREATION_ERROR',
  TRADE_EXECUTION_ERROR = 'TRADE_EXECUTION_ERROR',
  TRADE_CANCELLATION_ERROR = 'TRADE_CANCELLATION_ERROR',
  
  // Order errors
  ORDER_ERROR = 'ORDER_ERROR',
  ORDER_CREATION_ERROR = 'ORDER_CREATION_ERROR',
  ORDER_CANCELLATION_ERROR = 'ORDER_CANCELLATION_ERROR',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Base error class for the DarkSwap application
 */
export class DarkSwapError extends Error {
  code: ErrorCode;
  details?: Record<string, any>;
  
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message);
    this.name = 'DarkSwapError';
    this.code = code;
    this.details = details;
    
    // Log the error
    logger.error(`${code}: ${message}`, { details });
  }
}

/**
 * API error class for the DarkSwap application
 */
export class ApiClientError extends DarkSwapError {
  status?: number;
  
  constructor(message: string, code: ErrorCode, status?: number, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

/**
 * WebSocket error class for the DarkSwap application
 */
export class WebSocketClientError extends DarkSwapError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'WebSocketClientError';
  }
}

/**
 * P2P error class for the DarkSwap application
 */
export class P2PClientError extends DarkSwapError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'P2PClientError';
  }
}

/**
 * Wallet error class for the DarkSwap application
 */
export class WalletError extends DarkSwapError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'WalletError';
  }
}

/**
 * Trade error class for the DarkSwap application
 */
export class TradeError extends DarkSwapError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'TradeError';
  }
}

/**
 * Order error class for the DarkSwap application
 */
export class OrderError extends DarkSwapError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'OrderError';
  }
}

/**
 * Handle API errors
 * 
 * @param error The error to handle
 * @returns A standardized API error
 */
export function handleApiError(error: any): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data, status } = error.response;
    
    let code = ErrorCode.API_ERROR;
    let message = 'An API error occurred';
    
    if (status === 401) {
      code = ErrorCode.AUTHENTICATION_ERROR;
      message = 'Authentication failed';
    } else if (status === 403) {
      code = ErrorCode.AUTHORIZATION_ERROR;
      message = 'You do not have permission to access this resource';
    } else if (status === 404) {
      code = ErrorCode.NOT_FOUND_ERROR;
      message = 'The requested resource was not found';
    } else if (status === 422) {
      code = ErrorCode.VALIDATION_ERROR;
      message = 'Validation failed';
    } else if (status === 429) {
      code = ErrorCode.RATE_LIMIT_ERROR;
      message = 'Rate limit exceeded';
    } else if (status >= 500) {
      code = ErrorCode.SERVER_ERROR;
      message = 'A server error occurred';
    }
    
    return new ApiClientError(
      data.error || message,
      code,
      status,
      data.details || data
    );
  } else if (error.request) {
    // The request was made but no response was received
    if (error.message.includes('timeout')) {
      return new ApiClientError(
        'Request timed out',
        ErrorCode.TIMEOUT_ERROR,
        undefined,
        { request: error.request }
      );
    }
    
    return new ApiClientError(
      'No response received from server',
      ErrorCode.NETWORK_ERROR,
      undefined,
      { request: error.request }
    );
  }
  
  // Something happened in setting up the request that triggered an Error
  return new ApiClientError(
    error.message || 'An unknown error occurred',
    ErrorCode.UNKNOWN_ERROR,
    undefined,
    { error }
  );
}

/**
 * Handle WebSocket errors
 * 
 * @param error The error to handle
 * @returns A standardized WebSocket error
 */
export function handleWebSocketError(error: any): WebSocketClientError {
  if (error instanceof WebSocketClientError) {
    return error;
  }
  
  let code = ErrorCode.WEBSOCKET_ERROR;
  let message = 'A WebSocket error occurred';
  
  if (error.type === 'connect_error') {
    code = ErrorCode.WEBSOCKET_CONNECTION_ERROR;
    message = 'Failed to connect to WebSocket server';
  } else if (error.type === 'connect_timeout') {
    code = ErrorCode.WEBSOCKET_CONNECTION_ERROR;
    message = 'Connection to WebSocket server timed out';
  } else if (error.type === 'error') {
    code = ErrorCode.WEBSOCKET_ERROR;
    message = 'A WebSocket error occurred';
  } else if (error.type === 'disconnect') {
    code = ErrorCode.WEBSOCKET_CONNECTION_ERROR;
    message = 'Disconnected from WebSocket server';
  } else if (error.type === 'reconnect_error') {
    code = ErrorCode.WEBSOCKET_CONNECTION_ERROR;
    message = 'Failed to reconnect to WebSocket server';
  } else if (error.type === 'reconnect_failed') {
    code = ErrorCode.WEBSOCKET_CONNECTION_ERROR;
    message = 'Failed to reconnect to WebSocket server after multiple attempts';
  } else if (error.type === 'authentication_error') {
    code = ErrorCode.WEBSOCKET_AUTHENTICATION_ERROR;
    message = 'WebSocket authentication failed';
  } else if (error.type === 'subscription_error') {
    code = ErrorCode.WEBSOCKET_SUBSCRIPTION_ERROR;
    message = 'WebSocket subscription failed';
  }
  
  return new WebSocketClientError(
    error.message || message,
    code,
    { error }
  );
}

/**
 * Handle P2P errors
 * 
 * @param error The error to handle
 * @returns A standardized P2P error
 */
export function handleP2PError(error: any): P2PClientError {
  if (error instanceof P2PClientError) {
    return error;
  }
  
  let code = ErrorCode.P2P_ERROR;
  let message = 'A P2P error occurred';
  
  if (error.type === 'connection_error') {
    code = ErrorCode.P2P_CONNECTION_ERROR;
    message = 'Failed to connect to P2P network';
  } else if (error.type === 'peer_error') {
    code = ErrorCode.P2P_PEER_ERROR;
    message = 'A peer error occurred';
  } else if (error.type === 'relay_error') {
    code = ErrorCode.P2P_RELAY_ERROR;
    message = 'A relay error occurred';
  }
  
  return new P2PClientError(
    error.message || message,
    code,
    { error }
  );
}

/**
 * Handle wallet errors
 * 
 * @param error The error to handle
 * @returns A standardized wallet error
 */
export function handleWalletError(error: any): WalletError {
  if (error instanceof WalletError) {
    return error;
  }
  
  let code = ErrorCode.WALLET_ERROR;
  let message = 'A wallet error occurred';
  
  if (error.type === 'connection_error') {
    code = ErrorCode.WALLET_CONNECTION_ERROR;
    message = 'Failed to connect to wallet';
  } else if (error.type === 'transaction_error') {
    code = ErrorCode.WALLET_TRANSACTION_ERROR;
    message = 'A transaction error occurred';
  } else if (error.type === 'balance_error') {
    code = ErrorCode.WALLET_BALANCE_ERROR;
    message = 'Failed to get wallet balance';
  }
  
  return new WalletError(
    error.message || message,
    code,
    { error }
  );
}

/**
 * Handle trade errors
 * 
 * @param error The error to handle
 * @returns A standardized trade error
 */
export function handleTradeError(error: any): TradeError {
  if (error instanceof TradeError) {
    return error;
  }
  
  let code = ErrorCode.TRADE_ERROR;
  let message = 'A trade error occurred';
  
  if (error.type === 'creation_error') {
    code = ErrorCode.TRADE_CREATION_ERROR;
    message = 'Failed to create trade';
  } else if (error.type === 'execution_error') {
    code = ErrorCode.TRADE_EXECUTION_ERROR;
    message = 'Failed to execute trade';
  } else if (error.type === 'cancellation_error') {
    code = ErrorCode.TRADE_CANCELLATION_ERROR;
    message = 'Failed to cancel trade';
  }
  
  return new TradeError(
    error.message || message,
    code,
    { error }
  );
}

/**
 * Handle order errors
 * 
 * @param error The error to handle
 * @returns A standardized order error
 */
export function handleOrderError(error: any): OrderError {
  if (error instanceof OrderError) {
    return error;
  }
  
  let code = ErrorCode.ORDER_ERROR;
  let message = 'An order error occurred';
  
  if (error.type === 'creation_error') {
    code = ErrorCode.ORDER_CREATION_ERROR;
    message = 'Failed to create order';
  } else if (error.type === 'cancellation_error') {
    code = ErrorCode.ORDER_CANCELLATION_ERROR;
    message = 'Failed to cancel order';
  }
  
  return new OrderError(
    error.message || message,
    code,
    { error }
  );
}

/**
 * Handle general errors
 * 
 * @param error The error to handle
 * @returns A standardized error
 */
export function handleError(error: any): DarkSwapError {
  if (error instanceof DarkSwapError) {
    return error;
  }
  
  if (error.response) {
    return handleApiError(error);
  }
  
  if (error.type && (
    error.type.includes('websocket') || 
    error.type === 'connect_error' || 
    error.type === 'connect_timeout' || 
    error.type === 'disconnect' || 
    error.type === 'reconnect_error' || 
    error.type === 'reconnect_failed' || 
    error.type === 'authentication_error' || 
    error.type === 'subscription_error'
  )) {
    return handleWebSocketError(error);
  }
  
  if (error.type && (
    error.type.includes('p2p') || 
    error.type === 'connection_error' || 
    error.type === 'peer_error' || 
    error.type === 'relay_error'
  )) {
    return handleP2PError(error);
  }
  
  if (error.type && (
    error.type.includes('wallet') || 
    error.type === 'connection_error' || 
    error.type === 'transaction_error' || 
    error.type === 'balance_error'
  )) {
    return handleWalletError(error);
  }
  
  if (error.type && (
    error.type.includes('trade') || 
    error.type === 'creation_error' || 
    error.type === 'execution_error' || 
    error.type === 'cancellation_error'
  )) {
    return handleTradeError(error);
  }
  
  if (error.type && (
    error.type.includes('order') || 
    error.type === 'creation_error' || 
    error.type === 'cancellation_error'
  )) {
    return handleOrderError(error);
  }
  
  return new DarkSwapError(
    error.message || 'An unknown error occurred',
    ErrorCode.UNKNOWN_ERROR,
    { error }
  );
}

/**
 * Global error handler for the DarkSwap application
 * 
 * @param error The error to handle
 */
export function globalErrorHandler(error: any): void {
  const darkSwapError = handleError(error);
  
  // Log the error
  logger.error(`Global error handler: ${darkSwapError.code}: ${darkSwapError.message}`, {
    details: darkSwapError.details,
    stack: darkSwapError.stack,
  });
  
  // You can add additional error handling here, such as:
  // - Sending the error to a monitoring service
  // - Displaying a notification to the user
  // - Redirecting to an error page
}

// Set up global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    globalErrorHandler(event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler(event.reason);
  });
}

export default {
  handleApiError,
  handleWebSocketError,
  handleP2PError,
  handleWalletError,
  handleTradeError,
  handleOrderError,
  handleError,
  globalErrorHandler,
  ErrorCode,
  DarkSwapError,
  ApiClientError,
  WebSocketClientError,
  P2PClientError,
  WalletError,
  TradeError,
  OrderError,
};