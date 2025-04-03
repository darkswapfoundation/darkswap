import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define notification types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Define notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  timestamp: number;
}

// Define notification context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Define notification provider props
interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

/**
 * Notification provider component
 * @param props Component props
 * @returns Notification provider component
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add a notification
  const addNotification = (
    type: NotificationType,
    message: string,
    duration: number = defaultDuration
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const notification: Notification = {
      id,
      type,
      message,
      duration,
      timestamp: Date.now(),
    };

    setNotifications(prev => {
      // Remove oldest notifications if we exceed the maximum
      const newNotifications = [...prev, notification];
      
      if (newNotifications.length > maxNotifications) {
        return newNotifications.slice(newNotifications.length - maxNotifications);
      }
      
      return newNotifications;
    });

    return id;
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Auto-remove notifications after their duration
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);

        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [notifications]);

  // Create context value
  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };

  // Return notification provider
  return React.createElement(
    NotificationContext.Provider,
    { value: contextValue },
    children
  );
};

/**
 * Hook to use notifications
 * @returns Notification context
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
};

export default NotificationContext;