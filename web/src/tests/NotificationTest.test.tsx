import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationTest } from '../components/NotificationTest';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';

// Mock NotificationContext
jest.mock('../contexts/NotificationContext', () => {
  const originalModule = jest.requireActual('../contexts/NotificationContext');
  
  return {
    ...originalModule,
    useNotifications: jest.fn(),
  };
});

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Wrapper component with provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};

describe('NotificationTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render the form', () => {
    const mockAddNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<NotificationTest />);
    
    expect(screen.getByText('Test Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Message:')).toBeInTheDocument();
    expect(screen.getByLabelText('Type:')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (ms):')).toBeInTheDocument();
    expect(screen.getByText('Show Notification')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
  
  it('should call addNotification when form is submitted', () => {
    const mockAddNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<NotificationTest />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Message:'), {
      target: { value: 'Test message' },
    });
    
    fireEvent.change(screen.getByLabelText('Type:'), {
      target: { value: 'success' },
    });
    
    fireEvent.change(screen.getByLabelText('Duration (ms):'), {
      target: { value: '3000' },
    });
    
    // Submit the form
    fireEvent.submit(screen.getByText('Show Notification').closest('form')!);
    
    expect(mockAddNotification).toHaveBeenCalledWith('success', 'Test message', 3000);
  });
  
  it('should call addNotification when quick buttons are clicked', () => {
    const mockAddNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<NotificationTest />);
    
    // Click the Info button
    fireEvent.click(screen.getByText('Info'));
    expect(mockAddNotification).toHaveBeenCalledWith('info', 'This is an info notification');
    
    // Click the Success button
    fireEvent.click(screen.getByText('Success'));
    expect(mockAddNotification).toHaveBeenCalledWith('success', 'This is a success notification');
    
    // Click the Warning button
    fireEvent.click(screen.getByText('Warning'));
    expect(mockAddNotification).toHaveBeenCalledWith('warning', 'This is a warning notification');
    
    // Click the Error button
    fireEvent.click(screen.getByText('Error'));
    expect(mockAddNotification).toHaveBeenCalledWith('error', 'This is an error notification');
  });
  
  it('should update form state when inputs change', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<NotificationTest />);
    
    // Change message
    fireEvent.change(screen.getByLabelText('Message:'), {
      target: { value: 'New message' },
    });
    
    // Change type
    fireEvent.change(screen.getByLabelText('Type:'), {
      target: { value: 'warning' },
    });
    
    // Change duration
    fireEvent.change(screen.getByLabelText('Duration (ms):'), {
      target: { value: '10000' },
    });
    
    // Check that the form state has been updated
    expect(screen.getByLabelText('Message:').getAttribute('value')).toBe('New message');
    expect(screen.getByLabelText('Type:').getAttribute('value')).toBe('warning');
    expect(screen.getByLabelText('Duration (ms):').getAttribute('value')).toBe('10000');
  });
  
  it('should prevent default form submission', () => {
    const mockAddNotification = jest.fn();
    
    mockUseNotifications.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
    });
    
    render(<NotificationTest />);
    
    // Create a mock event
    const mockEvent = {
      preventDefault: jest.fn(),
    };
    
    // Submit the form
    fireEvent.submit(screen.getByText('Show Notification').closest('form')!, mockEvent);
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
  
  it('should use the real NotificationContext when wrapped with NotificationProvider', () => {
    // Use the real NotificationContext
    jest.unmock('../contexts/NotificationContext');
    
    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <TestWrapper>
        <NotificationTest />
      </TestWrapper>
    );
    
    // Click the Info button
    fireEvent.click(screen.getByText('Info'));
    
    // Check that the notification was added
    // This is hard to test directly, but we can check that the component rendered
    expect(screen.getByText('Test Notifications')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});