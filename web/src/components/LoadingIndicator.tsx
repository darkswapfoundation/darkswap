/**
 * LoadingIndicator.tsx - Loading indicator component
 * 
 * This file provides a loading indicator component for displaying loading states
 * in the application.
 */

import React from 'react';

/**
 * Loading indicator props
 */
export interface LoadingIndicatorProps {
  /**
   * Whether the component is loading
   */
  isLoading: boolean;
  
  /**
   * Children to render when not loading
   */
  children: React.ReactNode;
  
  /**
   * Loading message
   */
  message?: string;
  
  /**
   * Size of the loading indicator
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Color of the loading indicator
   */
  color?: string;
  
  /**
   * Whether to show the loading indicator inline
   */
  inline?: boolean;
  
  /**
   * Whether to show the loading indicator as an overlay
   */
  overlay?: boolean;
  
  /**
   * Whether to show the loading message
   */
  showMessage?: boolean;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Additional style
   */
  style?: React.CSSProperties;
}

/**
 * Loading indicator component
 * 
 * This component displays a loading indicator when isLoading is true,
 * and renders its children when isLoading is false.
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  size = 'medium',
  color,
  inline = false,
  overlay = false,
  showMessage = true,
  className = '',
  style = {},
}) => {
  // If not loading, render children
  if (!isLoading) {
    return <>{children}</>;
  }
  
  // Get size in pixels
  const sizeInPixels = {
    small: 16,
    medium: 24,
    large: 32,
  }[size];
  
  // Create spinner style
  const spinnerStyle: React.CSSProperties = {
    width: sizeInPixels,
    height: sizeInPixels,
    borderWidth: Math.max(2, sizeInPixels / 8),
    borderColor: color ? `${color} transparent transparent transparent` : undefined,
    ...style,
  };
  
  // Create container class name
  const containerClassName = `loading-indicator ${inline ? 'inline' : ''} ${overlay ? 'overlay' : ''} ${className}`;
  
  // Create loading indicator
  const loadingIndicator = (
    <div className={containerClassName}>
      <div className="loading-spinner" style={spinnerStyle} />
      {showMessage && <div className="loading-message">{message}</div>}
    </div>
  );
  
  // If overlay, render children with loading indicator overlay
  if (overlay) {
    return (
      <div className="loading-container">
        {children}
        {loadingIndicator}
      </div>
    );
  }
  
  // Otherwise, just render the loading indicator
  return loadingIndicator;
};

/**
 * Spinner props
 */
export interface SpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Color of the spinner
   */
  color?: string;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Additional style
   */
  style?: React.CSSProperties;
}

/**
 * Spinner component
 * 
 * This component displays a spinner.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
  style = {},
}) => {
  // Get size in pixels
  const sizeInPixels = {
    small: 16,
    medium: 24,
    large: 32,
  }[size];
  
  // Create spinner style
  const spinnerStyle: React.CSSProperties = {
    width: sizeInPixels,
    height: sizeInPixels,
    borderWidth: Math.max(2, sizeInPixels / 8),
    borderColor: color ? `${color} transparent transparent transparent` : undefined,
    ...style,
  };
  
  return <div className={`spinner ${className}`} style={spinnerStyle} />;
};

/**
 * With loading props
 */
export interface WithLoadingProps {
  /**
   * Loading message
   */
  message?: string;
  
  /**
   * Size of the loading indicator
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Color of the loading indicator
   */
  color?: string;
  
  /**
   * Whether to show the loading indicator inline
   */
  inline?: boolean;
  
  /**
   * Whether to show the loading indicator as an overlay
   */
  overlay?: boolean;
  
  /**
   * Whether to show the loading message
   */
  showMessage?: boolean;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Additional style
   */
  style?: React.CSSProperties;
}

/**
 * With loading
 * @param Component - Component to wrap
 * @param loadingPropName - Name of the loading prop
 * @param options - Loading options
 * @returns Wrapped component
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingPropName: keyof P = 'isLoading' as keyof P,
  options: WithLoadingProps = {},
): React.FC<P> {
  // Get component name
  const displayName = Component.displayName || Component.name || 'Component';
  
  // Create wrapped component
  const WrappedComponent: React.FC<P> = (props) => {
    // Get loading state
    const isLoading = props[loadingPropName] as unknown as boolean;
    
    return (
      <LoadingIndicator
        isLoading={isLoading}
        message={options.message}
        size={options.size}
        color={options.color}
        inline={options.inline}
        overlay={options.overlay}
        showMessage={options.showMessage}
        className={options.className}
        style={options.style}
      >
        <Component {...props} />
      </LoadingIndicator>
    );
  };
  
  // Set display name
  WrappedComponent.displayName = `WithLoading(${displayName})`;
  
  return WrappedComponent;
}

/**
 * Default export
 */
export default LoadingIndicator;