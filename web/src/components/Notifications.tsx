import React from 'react';
import { useNotifications, Notification } from '../contexts/NotificationContext';

interface NotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxWidth?: string;
}

/**
 * Notifications component
 * @param props Component props
 * @returns Notifications component
 */
export const Notifications: React.FC<NotificationsProps> = ({
  position = 'top-right',
  maxWidth = '400px',
}) => {
  const { notifications, removeNotification } = useNotifications();

  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return {
          top: '20px',
          right: '20px',
        };
      case 'top-left':
        return {
          top: '20px',
          left: '20px',
        };
      case 'bottom-right':
        return {
          bottom: '20px',
          right: '20px',
        };
      case 'bottom-left':
        return {
          bottom: '20px',
          left: '20px',
        };
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  // Position styles
  const positionStyles = getPositionStyles();

  return (
    <div className="notifications" style={{ ...positionStyles, maxWidth }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            {notification.message}
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            ×
          </button>
        </div>
      ))}

      <style>
        {`
          .notifications {
            position: fixed;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
          }
          
          .notification {
            display: flex;
            align-items: center;
            padding: 15px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
            pointer-events: auto;
            cursor: pointer;
          }
          
          .notification.success {
            background-color: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
          }
          
          .notification.error {
            background-color: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
          }
          
          .notification.warning {
            background-color: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
          }
          
          .notification.info {
            background-color: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #17a2b8;
          }
          
          .notification-icon {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            margin-right: 10px;
            font-weight: bold;
          }
          
          .success .notification-icon {
            background-color: #28a745;
            color: #fff;
          }
          
          .error .notification-icon {
            background-color: #dc3545;
            color: #fff;
          }
          
          .warning .notification-icon {
            background-color: #ffc107;
            color: #212529;
          }
          
          .info .notification-icon {
            background-color: #17a2b8;
            color: #fff;
          }
          
          .notification-content {
            flex: 1;
          }
          
          .notification-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            padding: 0;
            margin-left: 10px;
            opacity: 0.5;
            transition: opacity 0.2s;
          }
          
          .notification-close:hover {
            opacity: 1;
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          
          .notification.removing {
            animation: slideOut 0.3s ease-in forwards;
          }
        `}
      </style>
    </div>
  );
};

export default Notifications;