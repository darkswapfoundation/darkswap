/**
 * ErrorBoundary - Component for catching errors in React components
 * 
 * This component catches errors in React components and displays an error message.
 * It also reports errors to the error reporting system.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { DarkSwapError, ErrorCode, createError } from '../utils/ErrorHandling';
import { reportError } from '../utils/ErrorReporting';
import ErrorDisplay from './ErrorDisplay';

// Error boundary props
export interface ErrorBoundaryProps {
  /** Children components */
  children: ReactNode;
  
  /** Component name */
  componentName?: string;
  
  /** Fallback component */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  
  /** Whether to report errors */
  reportErrors?: boolean;
  
  /** Whether to show error details */
  showErrorDetails?: boolean;
  
  /** Whether to show retry button */
  showRetry?: boolean;
  
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Error boundary state
interface ErrorBoundaryState {
  /** Error */
  error: Error | null;
  
  /** Error info */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }
  
  /**
   * Catch errors in children components
   * @param error Error
   * @param errorInfo Error info
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state
    this.setState({
      error,
      errorInfo,
    });
    
    // Report error
    if (this.props.reportErrors !== false) {
      this.reportError(error, errorInfo);
    }
    
    // Call onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  /**
   * Report error
   * @param error Error
   * @param errorInfo Error info
   */
  private reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Create error with component stack
      const errorDetails = {
        componentStack: errorInfo.componentStack,
      };
      
      const darkswapError = createError(
        error,
        `Error in ${this.props.componentName || 'component'}`,
        ErrorCode.Unknown
      );
      
      // Report error with component stack
      reportError(darkswapError, `ErrorBoundary.${this.props.componentName || 'unknown'}`);
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }
  
  /**
   * Reset error
   */
  resetError = () => {
    this.setState({
      error: null,
      errorInfo: null,
    });
  };
  
  render() {
    // If there's an error, render fallback or error display
    if (this.state.error) {
      // If fallback is provided, render it
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.resetError);
        }
        
        return this.props.fallback;
      }
      
      // Otherwise, render error display
      return (
        <div className="error-boundary">
          <ErrorDisplay
            error={this.state.error}
            showDetails={this.props.showErrorDetails}
            showRetry={this.props.showRetry !== false}
            onRetry={this.resetError}
          />
        </div>
      );
    }
    
    // Otherwise, render children
    return this.props.children;
  }
}

/**
 * withErrorBoundary HOC
 * @param Component Component to wrap
 * @param options Error boundary options
 * @returns Wrapped component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {},
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary
      componentName={displayName}
      {...options}
    >
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;