/**
 * ErrorDisplay - Component for displaying errors
 * 
 * This component displays errors in a user-friendly way, with support for
 * different error types and severity levels.
 */

import React, { useState, useEffect } from 'react';
import { DarkSwapError, ErrorCode, WasmError, OrderError, NetworkError, WalletError } from '../utils/ErrorHandling';

// Error severity levels
export enum ErrorSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

// Error display props
export interface ErrorDisplayProps {
  /** Error to display */
  error: Error | null;
  
  /** CSS class name */
  className?: string;
  
  /** Whether to show details */
  showDetails?: boolean;
  
  /** Whether to auto-dismiss the error */
  autoDismiss?: boolean;
  
  /** Auto-dismiss timeout in milliseconds */
  autoDismissTimeout?: number;
  
  /** Callback when the error is dismissed */
  onDismiss?: () => void;
  
  /** Whether to show retry button */
  showRetry?: boolean;
  
  /** Callback when retry is clicked */
  onRetry?: () => void;
}

/**
 * ErrorDisplay component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  className = '',
  showDetails = false,
  autoDismiss = false,
  autoDismissTimeout = 5000,
  onDismiss,
  showRetry = false,
  onRetry,
}) => {
  // State
  const [isVisible, setIsVisible] = useState<boolean>(!!error);
  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(showDetails);
  
  // Reset visibility when error changes
  useEffect(() => {
    setIsVisible(!!error);
  }, [error]);
  
  // Auto-dismiss
  useEffect(() => {
    if (autoDismiss && error && isVisible) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, autoDismissTimeout);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [autoDismiss, autoDismissTimeout, error, isVisible, onDismiss]);
  
  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };
  
  // Handle toggle details
  const handleToggleDetails = () => {
    setIsDetailsVisible(!isDetailsVisible);
  };
  
  // Get error severity
  const getErrorSeverity = (error: Error): ErrorSeverity => {
    if (error instanceof DarkSwapError) {
      // Critical errors
      if (
        error.code === ErrorCode.WasmLoadFailed ||
        error.code === ErrorCode.WasmInitFailed ||
        error.code === ErrorCode.ConnectionFailed ||
        error.code === ErrorCode.WalletConnectionFailed
      ) {
        return ErrorSeverity.Critical;
      }
      
      // Error errors
      if (
        error.code === ErrorCode.OrderCreationFailed ||
        error.code === ErrorCode.OrderCancellationFailed ||
        error.code === ErrorCode.OrderExecutionFailed ||
        error.code === ErrorCode.TradeExecutionFailed ||
        error.code === ErrorCode.WalletSigningFailed ||
        error.code === ErrorCode.InsufficientFunds
      ) {
        return ErrorSeverity.Error;
      }
      
      // Warning errors
      if (
        error.code === ErrorCode.OrderNotFound ||
        error.code === ErrorCode.TradeNotFound ||
        error.code === ErrorCode.PeerNotFound ||
        error.code === ErrorCode.RelayNotFound ||
        error.code === ErrorCode.InvalidOrderParameters ||
        error.code === ErrorCode.InvalidArgument
      ) {
        return ErrorSeverity.Warning;
      }
      
      // Info errors
      if (
        error.code === ErrorCode.AlreadyInitialized ||
        error.code === ErrorCode.NotInitialized
      ) {
        return ErrorSeverity.Info;
      }
    }
    
    // Default to error
    return ErrorSeverity.Error;
  };
  
  // Get error title
  const getErrorTitle = (error: Error): string => {
    if (error instanceof WasmError) {
      return 'WebAssembly Error';
    } else if (error instanceof OrderError) {
      return 'Order Error';
    } else if (error instanceof NetworkError) {
      return 'Network Error';
    } else if (error instanceof WalletError) {
      return 'Wallet Error';
    } else if (error instanceof DarkSwapError) {
      return 'DarkSwap Error';
    } else {
      return 'Error';
    }
  };
  
  // Get error message
  const getErrorMessage = (error: Error): string => {
    return error.message;
  };
  
  // Get error details
  const getErrorDetails = (error: Error): string => {
    if (error instanceof DarkSwapError && error.details) {
      return error.getDetailsString();
    }
    
    return '';
  };
  
  // Get error code
  const getErrorCode = (error: Error): string => {
    if (error instanceof DarkSwapError) {
      return `Error Code: ${error.code}`;
    }
    
    return '';
  };
  
  // If no error or not visible, don't render anything
  if (!error || !isVisible) {
    return null;
  }
  
  // Get error information
  const severity = getErrorSeverity(error);
  const title = getErrorTitle(error);
  const message = getErrorMessage(error);
  const details = getErrorDetails(error);
  const code = getErrorCode(error);
  
  return (
    <div className={`error-display ${severity} ${className}`}>
      <div className="error-header">
        <div className="error-title">{title}</div>
        <button className="error-dismiss" onClick={handleDismiss}>×</button>
      </div>
      
      <div className="error-content">
        <div className="error-message">{message}</div>
        
        {code && (
          <div className="error-code">{code}</div>
        )}
        
        {details && (
          <div className="error-details-container">
            <button
              className="error-details-toggle"
              onClick={handleToggleDetails}
            >
              {isDetailsVisible ? 'Hide Details' : 'Show Details'}
            </button>
            
            {isDetailsVisible && (
              <pre className="error-details">{details}</pre>
            )}
          </div>
        )}
      </div>
      
      <div className="error-actions">
        {showRetry && (
          <button className="error-retry" onClick={handleRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;