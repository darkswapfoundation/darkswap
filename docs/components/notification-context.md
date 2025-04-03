# NotificationContext Component Documentation

## Overview

The `NotificationContext` is a React context that provides a notification system for the DarkSwap platform. It allows components to display notifications to the user, such as success messages, error messages, warnings, and informational messages.

## Provider

### NotificationProvider

```tsx
<NotificationProvider options={options}>
  {children}
</NotificationProvider>
```

The `NotificationProvider` component initializes the notification system and provides the context to its children.

#### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `NotificationOptions` | `undefined` | Configuration options for the notification system. |
| `children` | `React.ReactNode` | `undefined` | The child components that will have access to the context. |

#### NotificationOptions

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `maxNotifications` | `number` | `5` | The maximum number of notifications to display at once. |
| `autoClose` | `boolean` | `true` | Whether to automatically close notifications after a timeout. |
| `autoCloseTimeout` | `number` | `5000` | The timeout in milliseconds after which notifications are automatically closed. |
| `position` | `NotificationPosition` | `'top-right'` | The position of the notifications on the screen. |

#### Example

```tsx
import { NotificationProvider } from '../contexts/NotificationContext';

const App: React.FC = () => {
  return (
    <NotificationProvider
      options={{
        maxNotifications: 3,
        autoClose: true,
        autoCloseTimeout: 3000,
        position: 'top-right',
      }}
    >
      <YourApp />
    </NotificationProvider>
  );
};
```

## Hook

### useNotification

```tsx
const {
  notifications,
  addNotification,
  removeNotification,
  clearNotifications,
} = useNotification();
```

The `useNotification` hook provides access to the notification context.

#### Returns

| Name | Type | Description |
|------|------|-------------|
| `notifications` | `Notification[]` | The current list of notifications. |
| `addNotification` | `(type: NotificationType, message: string, options?: NotificationOptions) => string` | Function to add a notification. Returns the ID of the notification. |
| `removeNotification` | `(id: string) => void` | Function to remove a notification by ID. |
| `clearNotifications` | `() => void` | Function to clear all notifications. |

#### Example

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent: React.FC = () => {
  const { addNotification, removeNotification } = useNotification();

  const handleSuccess = () => {
    addNotification('success', 'Operation completed successfully!');
  };

  const handleError = () => {
    const id = addNotification('error', 'An error occurred!', {
      autoClose: false,
    });

    // You can remove the notification later
    setTimeout(() => {
      removeNotification(id);
    }, 10000);
  };

  const handleWarning = () => {
    addNotification('warning', 'This is a warning message.');
  };

  const handleInfo = () => {
    addNotification('info', 'This is an informational message.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
};
```

## Types

### Notification

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  autoClose: boolean;
  autoCloseTimeout: number;
}
```

Represents a notification.

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | The unique ID of the notification. |
| `type` | `NotificationType` | The type of notification. |
| `message` | `string` | The notification message. |
| `timestamp` | `number` | The timestamp when the notification was created. |
| `autoClose` | `boolean` | Whether the notification should automatically close after a timeout. |
| `autoCloseTimeout` | `number` | The timeout in milliseconds after which the notification should automatically close. |

### NotificationType

```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info';
```

The type of notification.

| Value | Description |
|-------|-------------|
| `'success'` | A success notification, typically displayed with a green color. |
| `'error'` | An error notification, typically displayed with a red color. |
| `'warning'` | A warning notification, typically displayed with a yellow or orange color. |
| `'info'` | An informational notification, typically displayed with a blue color. |

### NotificationPosition

```typescript
type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
```

The position of the notifications on the screen.

| Value | Description |
|-------|-------------|
| `'top-left'` | Notifications are displayed in the top-left corner of the screen. |
| `'top-right'` | Notifications are displayed in the top-right corner of the screen. |
| `'bottom-left'` | Notifications are displayed in the bottom-left corner of the screen. |
| `'bottom-right'` | Notifications are displayed in the bottom-right corner of the screen. |

### NotificationOptions

```typescript
interface NotificationOptions {
  autoClose?: boolean;
  autoCloseTimeout?: number;
}
```

Options for a notification.

| Name | Type | Description |
|------|------|-------------|
| `autoClose` | `boolean \| undefined` | Whether the notification should automatically close after a timeout. |
| `autoCloseTimeout` | `number \| undefined` | The timeout in milliseconds after which the notification should automatically close. |

## Usage

### Basic Usage

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent: React.FC = () => {
  const { addNotification } = useNotification();

  const handleClick = () => {
    addNotification('success', 'Operation completed successfully!');
  };

  return (
    <button onClick={handleClick}>
      Show Notification
    </button>
  );
};
```

### With Custom Options

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent: React.FC = () => {
  const { addNotification } = useNotification();

  const handleClick = () => {
    addNotification('error', 'An error occurred!', {
      autoClose: false,
    });
  };

  return (
    <button onClick={handleClick}>
      Show Notification
    </button>
  );
};
```

### Removing Notifications

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent: React.FC = () => {
  const { addNotification, removeNotification } = useNotification();

  const handleClick = () => {
    const id = addNotification('info', 'This notification will be removed in 3 seconds.');
    
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  return (
    <button onClick={handleClick}>
      Show Notification
    </button>
  );
};
```

### Clearing All Notifications

```tsx
import { useNotification } from '../contexts/NotificationContext';

const MyComponent: React.FC = () => {
  const { addNotification, clearNotifications } = useNotification();

  const handleAddNotifications = () => {
    addNotification('success', 'Success notification');
    addNotification('error', 'Error notification');
    addNotification('warning', 'Warning notification');
    addNotification('info', 'Info notification');
  };

  const handleClearNotifications = () => {
    clearNotifications();
  };

  return (
    <div>
      <button onClick={handleAddNotifications}>
        Add Notifications
      </button>
      <button onClick={handleClearNotifications}>
        Clear Notifications
      </button>
    </div>
  );
};
```

### Displaying Notifications

The `NotificationProvider` automatically renders a `Notifications` component that displays the current notifications. You don't need to manually render this component.

```tsx
import { NotificationProvider } from '../contexts/NotificationContext';

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <YourApp />
      {/* The Notifications component is automatically rendered */}
    </NotificationProvider>
  );
};
```

## Implementation Details

### State Management

The `NotificationProvider` uses the `useState` hook to manage the list of notifications.

```tsx
const [notifications, setNotifications] = useState<Notification[]>([]);
```

### Adding Notifications

The `addNotification` function adds a new notification to the list. It generates a unique ID for the notification, sets the timestamp to the current time, and applies the default options if not provided.

```tsx
const addNotification = useCallback((type: NotificationType, message: string, options?: NotificationOptions) => {
  const id = generateId();
  const timestamp = Date.now();
  const autoClose = options?.autoClose ?? defaultOptions.autoClose;
  const autoCloseTimeout = options?.autoCloseTimeout ?? defaultOptions.autoCloseTimeout;

  const notification: Notification = {
    id,
    type,
    message,
    timestamp,
    autoClose,
    autoCloseTimeout,
  };

  setNotifications((prevNotifications) => {
    // If we've reached the maximum number of notifications, remove the oldest one
    if (prevNotifications.length >= defaultOptions.maxNotifications) {
      return [...prevNotifications.slice(1), notification];
    }
    return [...prevNotifications, notification];
  });

  return id;
}, [defaultOptions]);
```

### Removing Notifications

The `removeNotification` function removes a notification from the list by ID.

```tsx
const removeNotification = useCallback((id: string) => {
  setNotifications((prevNotifications) =>
    prevNotifications.filter((notification) => notification.id !== id)
  );
}, []);
```

### Clearing Notifications

The `clearNotifications` function removes all notifications from the list.

```tsx
const clearNotifications = useCallback(() => {
  setNotifications([]);
}, []);
```

### Auto-Closing Notifications

The `NotificationProvider` uses the `useEffect` hook to automatically close notifications after their timeout.

```tsx
useEffect(() => {
  const timeouts: NodeJS.Timeout[] = [];

  notifications.forEach((notification) => {
    if (notification.autoClose) {
      const timeout = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.autoCloseTimeout);

      timeouts.push(timeout);
    }
  });

  return () => {
    timeouts.forEach(clearTimeout);
  };
}, [notifications, removeNotification]);
```

### Generating IDs

The `NotificationProvider` uses a simple function to generate unique IDs for notifications.

```tsx
const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};
```

## Notifications Component

The `Notifications` component is responsible for rendering the notifications. It's automatically rendered by the `NotificationProvider`.

```tsx
const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useNotification();
  const { position } = useNotificationOptions();

  return (
    <div className={`notifications ${position}`}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
        >
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' && <CheckCircleIcon />}
              {notification.type === 'error' && <XCircleIcon />}
              {notification.type === 'warning' && <ExclamationIcon />}
              {notification.type === 'info' && <InformationCircleIcon />}
            </div>
            <div className="notification-message">{notification.message}</div>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            <XIcon />
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Styling

The `Notifications` component uses CSS classes to style the notifications. You can customize the appearance of the notifications by overriding these classes in your CSS.

```css
.notifications {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
  width: 100%;
}

.notifications.top-left {
  top: 16px;
  left: 16px;
}

.notifications.top-right {
  top: 16px;
  right: 16px;
}

.notifications.bottom-left {
  bottom: 16px;
  left: 16px;
}

.notifications.bottom-right {
  bottom: 16px;
  right: 16px;
}

.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s ease-out;
}

.notification.success {
  background-color: #d1fae5;
  color: #065f46;
}

.notification.error {
  background-color: #fee2e2;
  color: #b91c1c;
}

.notification.warning {
  background-color: #fef3c7;
  color: #92400e;
}

.notification.info {
  background-color: #dbeafe;
  color: #1e40af;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-icon {
  flex-shrink: 0;
}

.notification-message {
  flex-grow: 1;
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  color: inherit;
  opacity: 0.7;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Testing

The `NotificationContext` can be tested using the following test cases:

1. **Adding Notifications**: Test that notifications can be added to the list.
2. **Removing Notifications**: Test that notifications can be removed from the list.
3. **Clearing Notifications**: Test that all notifications can be cleared.
4. **Auto-Closing Notifications**: Test that notifications are automatically closed after their timeout.
5. **Maximum Notifications**: Test that the oldest notification is removed when the maximum number of notifications is reached.

Example test:

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';

// Test component that uses the notification context
const TestComponent: React.FC = () => {
  const { addNotification, removeNotification, clearNotifications } = useNotification();

  return (
    <div>
      <button onClick={() => addNotification('success', 'Success message')}>
        Add Success
      </button>
      <button onClick={() => addNotification('error', 'Error message')}>
        Add Error
      </button>
      <button onClick={() => {
        const id = addNotification('warning', 'Warning message');
        return id;
      }}>
        Add Warning
      </button>
      <button onClick={() => {
        const id = addNotification('info', 'Info message');
        removeNotification(id);
      }}>
        Add and Remove
      </button>
      <button onClick={clearNotifications}>
        Clear All
      </button>
    </div>
  );
};

describe('NotificationContext', () => {
  it('should add a notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should remove a notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add and Remove'));

    await waitFor(() => {
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  it('should clear all notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));
    fireEvent.click(screen.getByText('Add Error'));
    fireEvent.click(screen.getByText('Add Warning'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear All'));

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning message')).not.toBeInTheDocument();
    });
  });

  it('should auto-close notifications', async () => {
    jest.useFakeTimers();

    render(
      <NotificationProvider options={{ autoCloseTimeout: 1000 }}>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));

    expect(screen.getByText('Success message')).toBeInTheDocument();

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should remove the oldest notification when the maximum is reached', async () => {
    render(
      <NotificationProvider options={{ maxNotifications: 2 }}>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add Success'));
    fireEvent.click(screen.getByText('Add Error'));
    fireEvent.click(screen.getByText('Add Warning'));

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });
});