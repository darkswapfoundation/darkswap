/**
 * Toast.tsx - Toast notification component
 * 
 * This file provides a toast notification component for displaying messages
 * to the user.
 */

import React, { useState, useEffect } from 'react';

/**
 * Toast type
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast props
 */
export interface ToastProps {
  /**
   * Toast type
   */
  type: ToastType;
  
  /**
   * Toast message
   */
  message: string;
  
  /**
   * Toast details
   */
  details?: string;
  
  /**
   * Whether the toast is visible
   */
  visible: boolean;
  
  /**
   * Callback when the toast is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Auto dismiss timeout in milliseconds
   */
  autoDismissTimeout?: number;
  
  /**
   * Whether to show the dismiss button
   */
  showDismissButton?: boolean;
  
  /**
   * Whether to show the details toggle button
   */
  showDetailsButton?: boolean;
  
  /**
   * Whether to show the details by default
   */
  showDetails?: boolean;
  
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
 * Toast component
 * 
 * This component displays a toast notification.
 */
export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  details,
  visible,
  onDismiss,
  autoDismissTimeout = 5000,
  showDismissButton = true,
  showDetailsButton = true,
  showDetails: initialShowDetails = false,
  className = '',
  style = {},
}) => {
  // State
  const [isVisible, setIsVisible] = useState(visible);
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  
  // Update visibility when visible prop changes
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);
  
  // Auto dismiss
  useEffect(() => {
    if (isVisible && autoDismissTimeout > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoDismissTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismissTimeout]);
  
  // Handle animation end
  const handleAnimationEnd = () => {
    if (!isVisible && onDismiss) {
      onDismiss();
    }
  };
  
  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
  };
  
  // Handle toggle details
  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'info':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="toast-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <div
      className={`toast ${type} ${isVisible ? 'visible' : 'hidden'} ${className}`}
      style={style}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="toast-content">
        {/* Icon */}
        {getIcon()}
        
        {/* Message */}
        <div className="toast-message">{message}</div>
        
        {/* Dismiss button */}
        {showDismissButton && (
          <button className="toast-dismiss" onClick={handleDismiss}>
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Details */}
      {details && (
        <div className="toast-details-container">
          {/* Details toggle button */}
          {showDetailsButton && (
            <button className="toast-details-toggle" onClick={handleToggleDetails}>
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
          
          {/* Details */}
          {showDetails && <div className="toast-details">{details}</div>}
        </div>
      )}
    </div>
  );
};

/**
 * Toast container props
 */
export interface ToastContainerProps {
  /**
   * Position of the toast container
   */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Additional style
   */
  style?: React.CSSProperties;
  
  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * Toast container component
 * 
 * This component provides a container for toast notifications.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
  className = '',
  style = {},
  children,
}) => {
  return (
    <div className={`toast-container ${position} ${className}`} style={style}>
      {children}
    </div>
  );
};

/**
 * Default export
 */
export default Toast;