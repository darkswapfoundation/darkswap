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
  children: React.ReactNode;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  maxNotifications = 10,
  children
}) => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load notifications from storage on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // In a real app, you would use AsyncStorage
        // const savedNotifications = await AsyncStorage.getItem('notifications');
        // if (savedNotifications) {
        //   setNotifications(JSON.parse(savedNotifications));
        // }
      } catch (error) {
        console.error('Error loading notifications from storage:', error);
      }
    };
    
    loadNotifications();
  }, []);
  
  // Save notifications to storage when they change
  useEffect(() => {
    const saveNotifications = async () => {
      try {
        // In a real app, you would use AsyncStorage
        // await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      } catch (error) {
        console.error('Error saving notifications to storage:', error);
      }
    };
    
    saveNotifications();
  }, [notifications]);
  
  // Add a notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => {
      // Add new notification and limit to maxNotifications
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });
  }, [maxNotifications]);
  
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