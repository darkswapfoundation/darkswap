import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification, Notification } from '../contexts/NotificationContext';

interface NotificationsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  maxVisible?: number;
}

const Notifications: React.FC<NotificationsProps> = ({
  position = 'top-right',
  maxVisible = 5,
}) => {
  const { theme } = useTheme();
  const { notifications, removeNotification } = useNotification();
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update visible notifications and unread count
  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, maxVisible));
    setUnreadCount(notifications.filter(notification => !notification.read).length);
  }, [notifications, maxVisible]);

  // Get position styles
  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'top-left':
        return { top: '1rem', left: '1rem' };
      case 'top-right':
        return { top: '1rem', right: '1rem' };
      case 'bottom-left':
        return { bottom: '1rem', left: '1rem' };
      case 'bottom-right':
        return { bottom: '1rem', right: '1rem' };
      default:
        return { top: '1rem', right: '1rem' };
    }
  };

  // Get notification background color based on type
  const getNotificationColor = (type: Notification['type']): string => {
    switch (type) {
      case 'success':
        return theme.success;
      case 'error':
        return theme.error;
      case 'warning':
        return theme.warning;
      case 'info':
        return theme.info;
      default:
        return theme.primary;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // More than a day
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Toggle notification center
  const toggleNotificationCenter = () => {
    setShowNotificationCenter(!showNotificationCenter);
  };

  return (
    <>
      {/* Toast Notifications */}
      <div
        className="fixed z-50 flex flex-col space-y-2 w-80"
        style={getPositionStyles()}
      >
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-start p-3 rounded-lg shadow-lg animate-slideIn"
            style={{
              backgroundColor: theme.card,
              borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
            }}
          >
            <div
              className="flex-shrink-0 mr-2"
              style={{ color: getNotificationColor(notification.type) }}
            >
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 mr-2">
              <h4 className="font-medium" style={{ color: theme.text }}>
                {notification.title}
              </h4>
              <p className="text-sm" style={{ color: theme.secondary }}>
                {notification.message}
              </p>
              <p className="text-xs mt-1" style={{ color: theme.secondary }}>
                {formatTimestamp(notification.timestamp)}
              </p>
            </div>
            <button
              className="flex-shrink-0 p-1 rounded-full hover:bg-opacity-10"
              style={{ backgroundColor: `${theme.text}10` }}
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ color: theme.text }}
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Notification Center Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="relative p-3 rounded-full shadow-lg"
          style={{ backgroundColor: theme.primary }}
          onClick={toggleNotificationCenter}
          aria-label="Toggle notification center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FFFFFF"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
              style={{ backgroundColor: theme.error, color: '#FFFFFF' }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Center */}
      {showNotificationCenter && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-end p-4 sm:p-6 md:p-8"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowNotificationCenter(false)}
        >
          <div
            className="w-full max-w-md rounded-lg shadow-xl overflow-hidden"
            style={{ backgroundColor: theme.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-4 border-b flex justify-between items-center"
              style={{ borderColor: theme.border }}
            >
              <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                Notifications
              </h3>
              <button
                className="p-1 rounded-full hover:bg-opacity-10"
                style={{ backgroundColor: `${theme.text}10` }}
                onClick={() => setShowNotificationCenter(false)}
                aria-label="Close notification center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ color: theme.text }}
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div
                  className="p-8 text-center"
                  style={{ color: theme.secondary }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: notification.read
                        ? 'transparent'
                        : `${theme.primary}10`,
                    }}
                  >
                    <div className="flex items-start">
                      <div
                        className="flex-shrink-0 mr-3"
                        style={{ color: getNotificationColor(notification.type) }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium" style={{ color: theme.text }}>
                          {notification.title}
                        </h4>
                        <p className="text-sm" style={{ color: theme.secondary }}>
                          {notification.message}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: theme.secondary }}
                        >
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        className="flex-shrink-0 p-1 rounded-full hover:bg-opacity-10"
                        style={{ backgroundColor: `${theme.text}10` }}
                        onClick={() => removeNotification(notification.id)}
                        aria-label="Remove notification"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style={{ color: theme.text }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;