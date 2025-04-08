import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => '',
  removeNotification: () => {},
  clearNotifications: () => {},
});

interface NotificationProviderProps {
  maxNotifications?: number;
  defaultDuration?: number;
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  maxNotifications = 5,
  defaultDuration = 5000,
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  // Generate a unique ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2, 9);
  }, []);
  
  // Add a notification
  const addNotification = useCallback((notification: Notification): string => {
    // Generate an ID if not provided
    const id = notification.id || generateId();
    
    // Create a new notification with the ID
    const newNotification: Notification = {
      ...notification,
      id,
    };
    
    // Add the notification to the list
    setNotifications(prevNotifications => {
      // If we've reached the maximum number of notifications, remove the oldest one
      if (prevNotifications.length >= maxNotifications) {
        const oldestNotificationId = prevNotifications[0].id;
        if (oldestNotificationId) {
          // Clear the timer for the oldest notification
          const timer = notificationTimers.get(oldestNotificationId);
          if (timer) {
            clearTimeout(timer);
            notificationTimers.delete(oldestNotificationId);
          }
        }
        
        // Return the new list without the oldest notification
        return [...prevNotifications.slice(1), newNotification];
      }
      
      // Return the new list with the new notification
      return [...prevNotifications, newNotification];
    });
    
    // Set a timer to remove the notification after the duration
    if (notification.duration !== 0) {
      const duration = notification.duration || defaultDuration;
      const timer = setTimeout(() => {
        removeNotification(id);
      }, duration);
      
      // Store the timer
      notificationTimers.set(id, timer);
    }
    
    // Return the ID
    return id;
  }, [generateId, maxNotifications, defaultDuration, notificationTimers]);
  
  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    // Remove the notification from the list
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
    
    // Clear the timer
    const timer = notificationTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      notificationTimers.delete(id);
    }
  }, [notificationTimers]);
  
  // Clear all notifications
  const clearNotifications = useCallback(() => {
    // Clear all timers
    notificationTimers.forEach(timer => {
      clearTimeout(timer);
    });
    notificationTimers.clear();
    
    // Clear all notifications
    setNotifications([]);
  }, [notificationTimers]);
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

export default NotificationContext;