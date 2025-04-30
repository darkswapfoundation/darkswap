import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebSocketStatus } from '../components/WebSocketStatus';
import { useWebSocket } from '../contexts/WebSocketContext';

// Mock the WebSocketContext hook
jest.mock('../contexts/WebSocketContext');
const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

describe('WebSocketStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should display connected status', () => {
    mockUseWebSocket.mockReturnValue({
      connected: true,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketStatus />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected');
  });
  
  it('should display connecting status', () => {
    mockUseWebSocket.mockReturnValue({
      connected: false,
      connecting: true,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketStatus />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connecting');
  });
  
  it('should display disconnected status', () => {
    mockUseWebSocket.mockReturnValue({
      connected: false,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketStatus />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status disconnected');
  });
  
  it('should apply custom className', () => {
    mockUseWebSocket.mockReturnValue({
      connected: true,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketStatus className="custom-class" />);
    
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected custom-class');
  });
  
  it('should hide text when showText is false', () => {
    mockUseWebSocket.mockReturnValue({
      connected: true,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketStatus showText={false} />);
    
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected');
  });
});