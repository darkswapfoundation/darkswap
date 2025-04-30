import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { NotificationProvider, useNotifications, Notification } from '../contexts/NotificationContext';

// Mock timer functions
jest.useFakeTimers();

// Test component that uses the notification context
const TestComponent: React.FC = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useNotifications();
  
  return (
    <div>
      <button 
        data-testid="add-success"
        onClick={() => addNotification('success', 'Success message')}
      >
        Add Success
      </button>
      <button 
        data-testid="add-error"
        onClick={() => addNotification('error', 'Error message')}
      >
        Add Error
      </button>
      <button 
        data-testid="add-info"
        onClick={() => addNotification('info', 'Info message')}
      >
        Add Info
      </button>
      <button 
        data-testid="add-warning"
        onClick={() => addNotification('warning', 'Warning message')}
      >
        Add Warning
      </button>
      <button 
        data-testid="add-custom-duration"
        onClick={() => addNotification('info', 'Custom duration', 10000)}
      >
        Add Custom Duration
      </button>
      <button 
        data-testid="remove-first"
        onClick={() => {
          if (notifications.length > 0) {
            removeNotification(notifications[0].id);
          }
        }}
      >
        Remove First
      </button>
      <button 
        data-testid="clear-all"
        onClick={() => clearNotifications()}
      >
        Clear All
      </button>
      <div data-testid="notification-count">{notifications.length}</div>
      <ul>
        {notifications.map(notification => (
          <li key={notification.id} data-testid={`notification-${notification.type}`}>
            {notification.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Wrapper component with provider
const TestWrapper: React.FC<{ maxNotifications?: number, defaultDuration?: number }> = ({ 
  maxNotifications, 
  defaultDuration 
}) => {
  return (
    <NotificationProvider maxNotifications={maxNotifications} defaultDuration={defaultDuration}>
      <TestComponent />
    </NotificationProvider>
  );
};

describe('NotificationContext', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should add a notification', () => {
    render(<TestWrapper />);
    
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
    
    act(() => {
      screen.getByTestId('add-success').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    expect(screen.getByTestId('notification-success')).toBeInTheDocument();
    expect(screen.getByTestId('notification-success').textContent).toBe('Success message');
  });
  
  it('should add notifications of different types', () => {
    render(<TestWrapper />);
    
    act(() => {
      screen.getByTestId('add-success').click();
      screen.getByTestId('add-error').click();
      screen.getByTestId('add-info').click();
      screen.getByTestId('add-warning').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('4');
    expect(screen.getByTestId('notification-success')).toBeInTheDocument();
    expect(screen.getByTestId('notification-error')).toBeInTheDocument();
    expect(screen.getByTestId('notification-info')).toBeInTheDocument();
    expect(screen.getByTestId('notification-warning')).toBeInTheDocument();
  });
  
  it('should remove a notification', () => {
    render(<TestWrapper />);
    
    act(() => {
      screen.getByTestId('add-success').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    
    act(() => {
      screen.getByTestId('remove-first').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
    expect(screen.queryByTestId('notification-success')).not.toBeInTheDocument();
  });
  
  it('should clear all notifications', () => {
    render(<TestWrapper />);
    
    act(() => {
      screen.getByTestId('add-success').click();
      screen.getByTestId('add-error').click();
      screen.getByTestId('add-info').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('3');
    
    act(() => {
      screen.getByTestId('clear-all').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
    expect(screen.queryByTestId('notification-success')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-info')).not.toBeInTheDocument();
  });
  
  it('should auto-remove notifications after their duration', () => {
    render(<TestWrapper defaultDuration={1000} />);
    
    act(() => {
      screen.getByTestId('add-success').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
    expect(screen.queryByTestId('notification-success')).not.toBeInTheDocument();
  });
  
  it('should respect custom duration', () => {
    render(<TestWrapper defaultDuration={1000} />);
    
    act(() => {
      screen.getByTestId('add-custom-duration').click();
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    
    // Fast-forward time less than custom duration
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Notification should still be there
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    expect(screen.getByTestId('notification-info')).toBeInTheDocument();
    
    // Fast-forward time to reach custom duration
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Notification should be gone
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
    expect(screen.queryByTestId('notification-info')).not.toBeInTheDocument();
  });
  
  it('should respect maxNotifications limit', () => {
    render(<TestWrapper maxNotifications={2} />);
    
    act(() => {
      screen.getByTestId('add-success').click();
      screen.getByTestId('add-error').click();
      screen.getByTestId('add-info').click(); // This should replace the oldest notification
    });
    
    expect(screen.getByTestId('notification-count').textContent).toBe('2');
    expect(screen.queryByTestId('notification-success')).not.toBeInTheDocument(); // Oldest notification removed
    expect(screen.getByTestId('notification-error')).toBeInTheDocument();
    expect(screen.getByTestId('notification-info')).toBeInTheDocument();
  });
  
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotifications must be used within a NotificationProvider');
    
    consoleErrorSpy.mockRestore();
  });
  
  it('should return unique IDs for notifications', () => {
    render(<TestWrapper />);
    
    const ids = new Set<string>();
    
    act(() => {
      for (let i = 0; i < 10; i++) {
        const id = screen.getByTestId('add-success').click();
        ids.add(id as unknown as string);
      }
    });
    
    // All IDs should be unique
    expect(ids.size).toBe(10);
  });
});