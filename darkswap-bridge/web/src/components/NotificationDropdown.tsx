import React, { useState } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { BsBell, BsBellFill } from 'react-icons/bs';
import { useNotification } from '../contexts/NotificationContext';

// Notification dropdown component
const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotification();
  const [show, setShow] = useState(false);

  // Handle notification click
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Handle clear notifications
  const handleClearNotifications = () => {
    clearNotifications();
  };

  // Custom toggle component
  const CustomToggle = React.forwardRef<HTMLAnchorElement, any>(({ onClick }, ref) => (
    <a
      href=""
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="text-decoration-none me-3 position-relative"
    >
      {unreadCount > 0 ? <BsBellFill size={20} color="white" /> : <BsBell size={20} color="white" />}
      {unreadCount > 0 && (
        <Badge
          bg="danger"
          pill
          className="position-absolute"
          style={{ top: '-8px', right: '-8px', fontSize: '0.6rem' }}
        >
          {unreadCount}
        </Badge>
      )}
    </a>
  ));

  // Custom menu component
  const CustomMenu = React.forwardRef<HTMLDivElement, any>(
    ({ style, className, 'aria-labelledby': labeledBy }, ref) => {
      return (
        <div ref={ref} style={style} className={className} aria-labelledby={labeledBy}>
          <div className="p-2 d-flex justify-content-between align-items-center border-bottom">
            <h6 className="mb-0">Notifications</h6>
            <div>
              <Badge
                bg="primary"
                className="cursor-pointer me-2"
                onClick={handleMarkAllAsRead}
                style={{ cursor: 'pointer' }}
              >
                Mark all as read
              </Badge>
              <Badge
                bg="danger"
                className="cursor-pointer"
                onClick={handleClearNotifications}
                style={{ cursor: 'pointer' }}
              >
                Clear all
              </Badge>
            </div>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="p-3 text-center text-muted">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <Dropdown.Item
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={notification.read ? '' : 'bg-light'}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge
                        bg={
                          notification.type === 'info'
                            ? 'info'
                            : notification.type === 'success'
                            ? 'success'
                            : notification.type === 'warning'
                            ? 'warning'
                            : 'danger'
                        }
                        className="me-2"
                      >
                        {notification.type}
                      </Badge>
                      {notification.message}
                    </div>
                    <small className="text-muted">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                </Dropdown.Item>
              ))
            )}
          </div>
        </div>
      );
    }
  );

  return (
    <Dropdown show={show} onToggle={(isOpen) => setShow(isOpen)}>
      <Dropdown.Toggle as={CustomToggle} id="notification-dropdown" />
      <Dropdown.Menu as={CustomMenu} align="end" />
    </Dropdown>
  );
};

export default NotificationDropdown;