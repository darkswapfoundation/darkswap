/**
 * ErrorToast - Component for displaying error toasts
 * 
 * This component displays error toasts that appear at the top right of the screen
 * and automatically disappear after a certain amount of time.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ErrorDisplay, { ErrorDisplayProps } from './ErrorDisplay';
import '../styles/ErrorDisplay.css';

// Error toast props
export interface ErrorToastProps extends ErrorDisplayProps {
  /** Toast ID */
  id: string;
  
  /** Callback when the toast is removed */
  onRemove: (id: string) => void;
}

/**
 * ErrorToast component
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
  id,
  error,
  onRemove,
  ...props
}) => {
  // Handle dismiss
  const handleDismiss = () => {
    onRemove(id);
    
    if (props.onDismiss) {
      props.onDismiss();
    }
  };
  
  return (
    <div className="error-toast">
      <ErrorDisplay
        error={error}
        {...props}
        onDismiss={handleDismiss}
        autoDismiss={props.autoDismiss !== undefined ? props.autoDismiss : true}
      />
    </div>
  );
};

// Error toast container props
export interface ErrorToastContainerProps {
  /** CSS class name */
  className?: string;
}

/**
 * ErrorToastContainer component
 */
export const ErrorToastContainer: React.FC<ErrorToastContainerProps> = ({
  className = '',
}) => {
  // Create portal container
  const [container] = useState(() => {
    // Check if container already exists
    const existingContainer = document.getElementById('error-toast-container');
    
    if (existingContainer) {
      return existingContainer;
    }
    
    // Create container
    const newContainer = document.createElement('div');
    newContainer.id = 'error-toast-container';
    newContainer.className = `error-toast-container ${className}`;
    document.body.appendChild(newContainer);
    
    return newContainer;
  });
  
  // Clean up container
  useEffect(() => {
    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [container]);
  
  return createPortal(null, container);
};

// Error toast manager
export interface ErrorToastManagerProps {
  /** CSS class name */
  className?: string;
  
  /** Children components */
  children?: React.ReactNode;
}

// Toast data
interface ToastData extends ErrorDisplayProps {
  id: string;
}

/**
 * ErrorToastManager component
 */
export const ErrorToastManager: React.FC<ErrorToastManagerProps> = ({
  className = '',
  children,
}) => {
  // Toasts state
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // Add toast
  const addToast = (props: ErrorDisplayProps) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prevToasts => [
      ...prevToasts,
      {
        ...props,
        id,
      },
    ]);
    
    return id;
  };
  
  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  
  // Create context value
  const contextValue = {
    addToast,
    removeToast,
  };
  
  return (
    <ErrorToastContext.Provider value={contextValue}>
      {children}
      
      <ErrorToastContainer className={className} />
      
      {createPortal(
        <>
          {toasts.map(toast => (
            <ErrorToast
              key={toast.id}
              {...toast}
              onRemove={removeToast}
            />
          ))}
        </>,
        document.getElementById('error-toast-container') as HTMLElement
      )}
    </ErrorToastContext.Provider>
  );
};

// Error toast context
export interface ErrorToastContextValue {
  /** Add a toast */
  addToast: (props: ErrorDisplayProps) => string;
  
  /** Remove a toast */
  removeToast: (id: string) => void;
}

export const ErrorToastContext = React.createContext<ErrorToastContextValue | undefined>(undefined);

/**
 * useErrorToast hook
 * @returns Error toast context
 * @throws Error if used outside of ErrorToastManager
 */
export const useErrorToast = (): ErrorToastContextValue => {
  const context = React.useContext(ErrorToastContext);
  
  if (!context) {
    throw new Error('useErrorToast must be used within an ErrorToastManager');
  }
  
  return context;
};

export default ErrorToast;