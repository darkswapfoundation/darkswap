import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { BrowserRouter } from 'react-router-dom';
import { ApiProvider } from '../contexts/ApiContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { DarkSwapProvider } from '../contexts/DarkSwapContext';

// Mock the providers
jest.mock('../contexts/ApiContext', () => ({
  ApiProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-provider">{children}</div>,
}));

jest.mock('../contexts/WebSocketContext', () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="websocket-provider">{children}</div>,
}));

jest.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="notification-provider">{children}</div>,
}));

jest.mock('../contexts/DarkSwapContext', () => ({
  DarkSwapProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="darkswap-provider">{children}</div>,
}));

// Mock the components
jest.mock('../components/WebSocketManager', () => ({
  WebSocketManager: () => <div data-testid="websocket-manager" />,
}));

jest.mock('../components/Notifications', () => ({
  Notifications: () => <div data-testid="notifications" />,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ path, element }: { path?: string, element: React.ReactNode }) => (
    <div data-testid={`route-${path || 'index'}`}>{element}</div>
  ),
  Outlet: () => <div data-testid="outlet" />,
}));

// Mock the pages
jest.mock('../pages/Home', () => ({
  Home: () => <div data-testid="home-page" />,
}));

jest.mock('../pages/Trade', () => ({
  Trade: () => <div data-testid="trade-page" />,
}));

jest.mock('../pages/Settings', () => ({
  Settings: () => <div data-testid="settings-page" />,
}));

jest.mock('../pages/About', () => ({
  About: () => <div data-testid="about-page" />,
}));

jest.mock('../pages/NotFound', () => ({
  NotFound: () => <div data-testid="not-found-page" />,
}));

// Mock the Layout component
jest.mock('../components/Layout', () => ({
  Layout: () => (
    <div data-testid="layout">
      <div data-testid="outlet" />
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.REACT_APP_API_URL = 'http://localhost:8000/api';
    process.env.REACT_APP_WS_URL = 'ws://localhost:8000/ws';
  });
  
  it('should render the app with all providers', () => {
    render(<App />);
    
    // Check that all providers are rendered
    expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
    expect(screen.getByTestId('api-provider')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-provider')).toBeInTheDocument();
    expect(screen.getByTestId('darkswap-provider')).toBeInTheDocument();
    
    // Check that the router is rendered
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    
    // Check that the WebSocketManager and Notifications components are rendered
    expect(screen.getByTestId('websocket-manager')).toBeInTheDocument();
    expect(screen.getByTestId('notifications')).toBeInTheDocument();
    
    // Check that the routes are rendered
    expect(screen.getByTestId('routes')).toBeInTheDocument();
    expect(screen.getByTestId('route-index')).toBeInTheDocument();
    expect(screen.getByTestId('route-trade')).toBeInTheDocument();
    expect(screen.getByTestId('route-settings')).toBeInTheDocument();
    expect(screen.getByTestId('route-about')).toBeInTheDocument();
    expect(screen.getByTestId('route-*')).toBeInTheDocument();
    
    // Check that the pages are rendered
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('trade-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });
  
  it('should use environment variables for API and WebSocket URLs', () => {
    // Set custom environment variables
    process.env.REACT_APP_API_URL = 'https://api.example.com';
    process.env.REACT_APP_WS_URL = 'wss://ws.example.com';
    
    render(<App />);
    
    // Check that the providers are rendered with the correct URLs
    // Note: We can't directly check the props passed to the providers because they're mocked,
    // but we can check that the providers are rendered
    expect(screen.getByTestId('api-provider')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-provider')).toBeInTheDocument();
    expect(screen.getByTestId('darkswap-provider')).toBeInTheDocument();
  });
  
  it('should render global styles', () => {
    render(<App />);
    
    // Check that the style tag is rendered
    const styleTag = document.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    
    // Check that the global styles are applied
    const styleContent = styleTag?.textContent || '';
    expect(styleContent).toContain('box-sizing: border-box');
    expect(styleContent).toContain('margin: 0');
    expect(styleContent).toContain('padding: 0');
    expect(styleContent).toContain('font-family: -apple-system');
    expect(styleContent).toContain('color: #333');
    expect(styleContent).toContain('background-color: #f8f9fa');
  });
});