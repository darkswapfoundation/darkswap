import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationCategory = 'system' | 'trade' | 'wallet' | 'p2p' | 'other';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  timestamp: number;
  duration: number;
  category?: NotificationCategory;
  read?: boolean;
  actionable?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, title?: string, category?: NotificationCategory, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  maxNotifications = 5 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);

  // Add a notification
  const addNotification = (
    type: NotificationType,
    message: string,
    title?: string,
    category: NotificationCategory = 'other',
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      id,
      type,
      title: title || type.charAt(0).toUpperCase() + type.slice(1),
      message,
      timestamp: Date.now(),
      duration,
      category,
      read: false,
      actionable: false,
    };
    
    setNotifications(prev => {
      // Add new notification and limit to maxNotifications
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Remove all notifications
  const removeAllNotifications = () => {
    // Add current notifications to history before clearing
    setNotificationHistory(prev => [...notifications, ...prev].slice(0, 100));
    setNotifications([]);
  };

  // Auto-remove notifications after their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        markAsRead,
        markAllAsRead,
        removeAllNotifications,
      }}
    >
      {children}
      <NotificationDisplay 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

interface NotificationDisplayProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ 
  notifications, 
  removeNotification 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`
              rounded-lg shadow-lg p-4 flex items-start
              ${notification.type === 'success' ? 'bg-ui-success bg-opacity-10 border border-ui-success' : ''}
              ${notification.type === 'error' ? 'bg-ui-error bg-opacity-10 border border-ui-error' : ''}
              ${notification.type === 'warning' ? 'bg-ui-warning bg-opacity-10 border border-ui-warning' : ''}
              ${notification.type === 'info' ? 'bg-ui-info bg-opacity-10 border border-ui-info' : ''}
            `}
          >
            <div className="flex-shrink-0 mr-2">
              {notification.type === 'success' && (
                <CheckCircleIcon className="w-5 h-5 text-ui-success" />
              )}
              {notification.type === 'error' && (
                <XCircleIcon className="w-5 h-5 text-ui-error" />
              )}
              {notification.type === 'warning' && (
                <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning" />
              )}
              {notification.type === 'info' && (
                <InformationCircleIcon className="w-5 h-5 text-ui-info" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium
                ${notification.type === 'success' ? 'text-ui-success' : ''}
                ${notification.type === 'error' ? 'text-ui-error' : ''}
                ${notification.type === 'warning' ? 'text-ui-warning' : ''}
                ${notification.type === 'info' ? 'text-ui-info' : ''}
              `}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;