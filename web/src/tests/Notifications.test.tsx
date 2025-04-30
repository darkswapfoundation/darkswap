import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Notifications } from '../components/Notifications';
import { NotificationProvider, useNotifications, Notification } from '../contexts/NotificationContext';

// Mock NotificationContext
jest.mock('../contexts/NotificationContext', () => {
  const originalModule = jest.requireActual('../contexts/NotificationContext');
  
  return {
    ...originalModule,
    useNotifications: jest.fn(),
  };
});

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render notifications', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'notification-1',
        type: 'success',
        message: 'Success message',
        timestamp: Date.now(),
      },
      {
        id: 'notification-2',
        type: 'error',
        message: 'Error message',
        timestamp: Date.now(),
      },
      {
        id: 'notification-3',
        type: 'info',
        message: 'Info message',
        timestamp: Date.now(),
      },
      {
        id: 'notification-4',
        type: 'warning',
        message: 'Warning message',
        timestamp: Date.now(),
      },
    ];
    
    const mockRemoveNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      addNotification: jest.fn(),
      removeNotification: mockRemoveNotification,
      clearNotifications: jest.fn(),
    });
    
    render(<Notifications />);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    
    // Check that notifications have the correct classes
    expect(screen.getByText('Success message').closest('.notification')).toHaveClass('notification success');
    expect(screen.getByText('Error message').closest('.notification')).toHaveClass('notification error');
    expect(screen.getByText('Info message').closest('.notification')).toHaveClass('notification info');
    expect(screen.getByText('Warning message').closest('.notification')).toHaveClass('notification warning');
  });
  
  it('should call removeNotification when clicking on a notification', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'notification-1',
        type: 'success',
        message: 'Success message',
        timestamp: Date.now(),
      },
    ];
    
    const mockRemoveNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      addNotification: jest.fn(),
      removeNotification: mockRemoveNotification,
      clearNotifications: jest.fn(),
    });
    
    render(<Notifications />);
    
    fireEvent.click(screen.getByText('Success message'));
    
    expect(mockRemoveNotification).toHaveBeenCalledWith('notification-1');
  });
  
  it('should call removeNotification when clicking on the close button', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'notification-1',
        type: 'success',
        message: 'Success message',
        timestamp: Date.now(),
      },
    ];
    
    const mockRemoveNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      addNotification: jest.fn(),
      removeNotification: mockRemoveNotification,
      clearNotifications: jest.fn(),
    });
    
    render(<Notifications />);
    
    fireEvent.click(screen.getByText('×'));
    
    expect(mockRemoveNotification).toHaveBeenCalledWith('notification-1');
  });
  
  it('should position notifications correctly', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    // Test top-right position (default)
    const { rerender } = render(<Notifications />);
    
    expect(screen.getByTestId('notifications')).toHaveStyle({
      top: '20px',
      right: '20px',
    });
    
    // Test top-left position
    rerender(<Notifications position="top-left" />);
    
    expect(screen.getByTestId('notifications')).toHaveStyle({
      top: '20px',
      left: '20px',
    });
    
    // Test bottom-right position
    rerender(<Notifications position="bottom-right" />);
    
    expect(screen.getByTestId('notifications')).toHaveStyle({
      bottom: '20px',
      right: '20px',
    });
    
    // Test bottom-left position
    rerender(<Notifications position="bottom-left" />);
    
    expect(screen.getByTestId('notifications')).toHaveStyle({
      bottom: '20px',
      left: '20px',
    });
  });
  
  it('should set max width', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<Notifications maxWidth="300px" />);
    
    expect(screen.getByTestId('notifications')).toHaveStyle({
      maxWidth: '300px',
    });
  });
  
  it('should render notification icons', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'notification-1',
        type: 'success',
        message: 'Success message',
        timestamp: Date.now(),
      },
      {
        id: 'notification-2',
        type: 'error',
        message: 'Error message',
        timestamp: Date.now(),
      },
      {
        id: 'notification-3',
        type: 'info',
        message: 'Info message',
        timestamp: Date.now(),
      },
      {
        id: 'notification-4',
        type: 'warning',
        message: 'Warning message',
        timestamp: Date.now(),
      },
    ];
    
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<Notifications />);
    
    // Check that notification icons are rendered
    expect(screen.getByText('✓')).toBeInTheDocument(); // Success icon
    expect(screen.getByText('✕')).toBeInTheDocument(); // Error icon
    expect(screen.getByText('ℹ')).toBeInTheDocument(); // Info icon
    expect(screen.getByText('⚠')).toBeInTheDocument(); // Warning icon
  });
});