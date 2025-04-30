import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ApiProvider } from '../contexts/ApiContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock the context providers
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    token: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null,
  }),
}));

jest.mock('../contexts/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  }),
}));

jest.mock('../contexts/ApiContext', () => ({
  ApiProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-provider">{children}</div>,
  useApi: () => ({
    api: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
    loading: false,
    error: null,
  }),
}));

jest.mock('../contexts/WebSocketContext', () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="websocket-provider">{children}</div>,
  useWebSocket: () => ({
    socket: null,
    connected: false,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    events: [],
    lastEvent: null,
  }),
}));

jest.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="notification-provider">{children}</div>,
  useNotification: () => ({
    notifications: [],
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    clearNotifications: jest.fn(),
    unreadCount: 0,
  }),
}));

// Mock the components
jest.mock('../components/Navigation', () => () => <div data-testid="navigation" />);

// Test the App component
describe('App', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ApiProvider>
              <WebSocketProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </WebSocketProvider>
            </ApiProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Check if the app renders
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });
});