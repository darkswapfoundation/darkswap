/**
 * ErrorBoundary.tsx - Error boundary component
 * 
 * This file provides an error boundary component for catching and handling errors
 * in React components.
 */

import React from 'react';
import { reportError } from '../utils/ErrorReporting';

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  /**
   * Children
   */
  children: React.ReactNode;
  
  /**
   * Fallback component to render when an error occurs
   * @param error - Error that occurred
   * @param resetError - Function to reset the error
   * @returns React node
   */
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;
  
  /**
   * Error handler
   * @param error - Error that occurred
   * @param errorInfo - Error info
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  /**
   * Whether to reset the error when the children change
   */
  resetOnChange?: boolean;
  
  /**
   * Component name for error reporting
   */
  componentName?: string;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * Error that occurred
   */
  error: Error | null;
}

/**
 * Error boundary component
 * 
 * This component catches errors in its children and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Constructor
   * @param props - Props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  /**
   * Get derived state from error
   * @param error - Error
   * @returns New state
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }
  
  /**
   * Component did catch
   * @param error - Error
   * @param errorInfo - Error info
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report error
    const componentName = this.props.componentName || 'ErrorBoundary';
    reportError(error, `${componentName}.componentDidCatch`);
    
    // Log error info
    console.error('Error caught by error boundary:', error, errorInfo);
    
    // Call onError prop
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  /**
   * Component did update
   * @param prevProps - Previous props
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error when children change
    if (
      this.state.hasError &&
      this.props.resetOnChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }
  
  /**
   * Reset error
   */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };
  
  /**
   * Render
   * @returns React node
   */
  render(): React.ReactNode {
    // Check if an error has occurred
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }
      
      // Render default fallback UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={this.resetError}>Try again</button>
        </div>
      );
    }
    
    // Render children
    return this.props.children;
  }
}

/**
 * Default error boundary fallback props
 */
export interface DefaultErrorBoundaryFallbackProps {
  /**
   * Error
   */
  error: Error;
  
  /**
   * Reset error function
   */
  resetError: () => void;
  
  /**
   * Title
   */
  title?: string;
  
  /**
   * Button text
   */
  buttonText?: string;
  
  /**
   * Show error details
   */
  showDetails?: boolean;
}

/**
 * Default error boundary fallback
 * @param props - Props
 * @returns React node
 */
export const DefaultErrorBoundaryFallback: React.FC<DefaultErrorBoundaryFallbackProps> = ({
  error,
  resetError,
  title = 'Something went wrong',
  buttonText = 'Try again',
  showDetails = false,
}) => {
  // State
  const [showDetailsState, setShowDetailsState] = React.useState(showDetails);
  
  return (
    <div className="error-boundary">
      <h2>{title}</h2>
      <p>{error.message}</p>
      
      {/* Error details */}
      {error.stack && (
        <>
          <button
            className="error-details-toggle"
            onClick={() => setShowDetailsState(!showDetailsState)}
          >
            {showDetailsState ? 'Hide details' : 'Show details'}
          </button>
          
          {showDetailsState && (
            <pre className="error-details">
              {error.stack}
            </pre>
          )}
        </>
      )}
      
      {/* Reset button */}
      <button className="error-reset" onClick={resetError}>
        {buttonText}
      </button>
    </div>
  );
};

/**
 * With error boundary props
 */
export interface WithErrorBoundaryProps {
  /**
   * Fallback component to render when an error occurs
   * @param error - Error that occurred
   * @param resetError - Function to reset the error
   * @returns React node
   */
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;
  
  /**
   * Error handler
   * @param error - Error that occurred
   * @param errorInfo - Error info
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  /**
   * Whether to reset the error when the children change
   */
  resetOnChange?: boolean;
  
  /**
   * Component name for error reporting
   */
  componentName?: string;
}

/**
 * With error boundary
 * @param Component - Component to wrap
 * @returns Wrapped component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  {
    fallback,
    onError,
    resetOnChange,
    componentName,
  }: WithErrorBoundaryProps = {},
): React.FC<P> {
  // Get component name
  const displayName = Component.displayName || Component.name || 'Component';
  
  // Create wrapped component
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary
        fallback={fallback}
        onError={onError}
        resetOnChange={resetOnChange}
        componentName={componentName || displayName}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  // Set display name
  WrappedComponent.displayName = `WithErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

/**
 * Default export
 */
export default ErrorBoundary;