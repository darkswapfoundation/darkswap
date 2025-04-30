/**
 * ToastContext.tsx - Toast context
 * 
 * This file provides a context for managing toast notifications in the application.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer, ToastType } from '../components/Toast';

/**
 * Toast data
 */
export interface ToastData {
  /**
   * Toast ID
   */
  id: string;
  
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
}

/**
 * Toast context value
 */
export interface ToastContextValue {
  /**
   * Show a toast notification
   * @param type - Toast type
   * @param message - Toast message
   * @param details - Toast details
   * @param options - Toast options
   * @returns Toast ID
   */
  showToast: (
    type: ToastType,
    message: string,
    details?: string,
    options?: {
      autoDismissTimeout?: number;
      showDismissButton?: boolean;
      showDetailsButton?: boolean;
      showDetails?: boolean;
    },
  ) => string;
  
  /**
   * Show an info toast notification
   * @param message - Toast message
   * @param details - Toast details
   * @param options - Toast options
   * @returns Toast ID
   */
  showInfo: (
    message: string,
    details?: string,
    options?: {
      autoDismissTimeout?: number;
      showDismissButton?: boolean;
      showDetailsButton?: boolean;
      showDetails?: boolean;
    },
  ) => string;
  
  /**
   * Show a success toast notification
   * @param message - Toast message
   * @param details - Toast details
   * @param options - Toast options
   * @returns Toast ID
   */
  showSuccess: (
    message: string,
    details?: string,
    options?: {
      autoDismissTimeout?: number;
      showDismissButton?: boolean;
      showDetailsButton?: boolean;
      showDetails?: boolean;
    },
  ) => string;
  
  /**
   * Show a warning toast notification
   * @param message - Toast message
   * @param details - Toast details
   * @param options - Toast options
   * @returns Toast ID
   */
  showWarning: (
    message: string,
    details?: string,
    options?: {
      autoDismissTimeout?: number;
      showDismissButton?: boolean;
      showDetailsButton?: boolean;
      showDetails?: boolean;
    },
  ) => string;
  
  /**
   * Show an error toast notification
   * @param message - Toast message
   * @param details - Toast details
   * @param options - Toast options
   * @returns Toast ID
   */
  showError: (
    message: string,
    details?: string,
    options?: {
      autoDismissTimeout?: number;
      showDismissButton?: boolean;
      showDetailsButton?: boolean;
      showDetails?: boolean;
    },
  ) => string;
  
  /**
   * Dismiss a toast notification
   * @param id - Toast ID
   */
  dismissToast: (id: string) => void;
  
  /**
   * Dismiss all toast notifications
   */
  dismissAllToasts: () => void;
}

/**
 * Toast context
 */
export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast provider props
 */
export interface ToastProviderProps {
  /**
   * Children
   */
  children: React.ReactNode;
  
  /**
   * Position of the toast container
   */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  
  /**
   * Maximum number of toasts to show at once
   */
  maxToasts?: number;
}

/**
 * Toast provider
 * 
 * This component provides a context for managing toast notifications.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}) => {
  // State
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // Generate a unique ID
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Show a toast notification
  const showToast = useCallback(
    (
      type: ToastType,
      message: string,
      details?: string,
      options?: {
        autoDismissTimeout?: number;
        showDismissButton?: boolean;
        showDetailsButton?: boolean;
        showDetails?: boolean;
      },
    ): string => {
      // Generate ID
      const id = generateId();
      
      // Create toast data
      const toastData: ToastData = {
        id,
        type,
        message,
        details,
        ...options,
      };
      
      // Add toast to state
      setToasts((prevToasts) => {
        // Remove oldest toasts if we have too many
        const newToasts = [...prevToasts, toastData];
        
        if (newToasts.length > maxToasts) {
          return newToasts.slice(newToasts.length - maxToasts);
        }
        
        return newToasts;
      });
      
      return id;
    },
    [generateId, maxToasts],
  );
  
  // Show an info toast notification
  const showInfo = useCallback(
    (
      message: string,
      details?: string,
      options?: {
        autoDismissTimeout?: number;
        showDismissButton?: boolean;
        showDetailsButton?: boolean;
        showDetails?: boolean;
      },
    ): string => {
      return showToast('info', message, details, options);
    },
    [showToast],
  );
  
  // Show a success toast notification
  const showSuccess = useCallback(
    (
      message: string,
      details?: string,
      options?: {
        autoDismissTimeout?: number;
        showDismissButton?: boolean;
        showDetailsButton?: boolean;
        showDetails?: boolean;
      },
    ): string => {
      return showToast('success', message, details, options);
    },
    [showToast],
  );
  
  // Show a warning toast notification
  const showWarning = useCallback(
    (
      message: string,
      details?: string,
      options?: {
        autoDismissTimeout?: number;
        showDismissButton?: boolean;
        showDetailsButton?: boolean;
        showDetails?: boolean;
      },
    ): string => {
      return showToast('warning', message, details, options);
    },
    [showToast],
  );
  
  // Show an error toast notification
  const showError = useCallback(
    (
      message: string,
      details?: string,
      options?: {
        autoDismissTimeout?: number;
        showDismissButton?: boolean;
        showDetailsButton?: boolean;
        showDetails?: boolean;
      },
    ): string => {
      return showToast('error', message, details, options);
    },
    [showToast],
  );
  
  // Dismiss a toast notification
  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);
  
  // Dismiss all toast notifications
  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Create context value
  const contextValue: ToastContextValue = {
    showToast,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    dismissToast,
    dismissAllToasts,
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            details={toast.details}
            visible={true}
            onDismiss={() => dismissToast(toast.id)}
            autoDismissTimeout={toast.autoDismissTimeout}
            showDismissButton={toast.showDismissButton}
            showDetailsButton={toast.showDetailsButton}
            showDetails={toast.showDetails}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

/**
 * Use toast hook
 * @returns Toast context value
 * @throws Error if used outside of ToastProvider
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}

/**
 * Default export
 */
export default ToastContext;