import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationType } from '../utils/types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

interface NotificationProviderProps {
  maxNotifications?: number;
  autoHideDuration?: number;
  children: React.ReactNode;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  maxNotifications = 10,
  autoHideDuration = 5000,
  children
}) => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load notifications from local storage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications from local storage:', error);
    }
  }, []);
  
  // Save notifications to local storage when they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to local storage:', error);
    }
  }, [notifications]);
  
  // Add a notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => {
      // Add new notification and limit to maxNotifications
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });
    
    // Auto-hide notification after duration
    if (autoHideDuration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDuration);
    }
  }, [maxNotifications, autoHideDuration]);
  
  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  }, []);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);
  
  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Context value
  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook for using notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

// Notification component
interface NotificationComponentProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
  autoHideDuration?: number;
}

export const NotificationComponent: React.FC<NotificationComponentProps> = ({
  notification,
  onClose,
  onRead,
  autoHideDuration = 5000
}) => {
  // Auto-hide notification after duration
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [autoHideDuration, onClose]);
  
  // Get icon based on notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };
  
  // Get color based on notification type
  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
      default:
        return '#2196f3';
    }
  };
  
  return (
    <div 
      className="notification"
      style={{
        backgroundColor: getColor(notification.type),
        opacity: notification.read ? 0.7 : 1
      }}
      onClick={onRead}
    >
      <div className="notification-icon">
        {getIcon(notification.type)}
      </div>
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
      </div>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

// Notifications container component
interface NotificationsContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  autoHideDuration?: number;
}

export const NotificationsContainer: React.FC<NotificationsContainerProps> = ({
  position = 'top-right',
  maxVisible = 3,
  autoHideDuration = 5000
}) => {
  // Get notifications from context
  const { notifications, removeNotification, markAsRead } = useNotification();
  
  // Get visible notifications
  const visibleNotifications = notifications.slice(0, maxVisible);
  
  // Get container position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
      default:
        return { top: '20px', right: '20px' };
    }
  };
  
  return (
    <div 
      className="notifications-container"
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        ...getPositionStyles()
      }}
    >
      {visibleNotifications.map(notification => (
        <NotificationComponent
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onRead={() => markAsRead(notification.id)}
          autoHideDuration={autoHideDuration}
        />
      ))}
    </div>
  );
};