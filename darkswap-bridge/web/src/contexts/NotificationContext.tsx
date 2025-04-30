import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast, ToastContainer, ToastOptions } from 'react-toastify';
import { useWebSocket } from './WebSocketContext';

// Define notification type
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  read: boolean;
}

// Define notification context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  unreadCount: number;
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider props
interface NotificationProviderProps {
  children: ReactNode;
}

// Notification provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { lastEvent } = useWebSocket();

  // Handle WebSocket events
  React.useEffect(() => {
    if (lastEvent) {
      // Handle different event types
      switch (lastEvent.event_type) {
        case 'wallet_status':
          addNotification('info', 'Wallet status updated');
          break;
        case 'wallet_balance':
          addNotification('info', 'Wallet balance updated');
          break;
        case 'network_status':
          addNotification('info', 'Network status updated');
          break;
        case 'order_update':
          addNotification('success', `Order ${lastEvent.data.order_id} updated`);
          break;
        case 'trade_update':
          addNotification('success', `Trade ${lastEvent.data.trade_id} updated`);
          break;
        case 'error':
          addNotification('error', lastEvent.data.message);
          break;
      }
    }
  }, [lastEvent]);

  // Add notification
  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const notification: Notification = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      message,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications((prevNotifications) => [...prevNotifications, notification]);

    // Show toast
    const toastOptions: ToastOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case 'info':
        toast.info(message, toastOptions);
        break;
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Calculate unread count
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Return provider
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
      <ToastContainer />
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};