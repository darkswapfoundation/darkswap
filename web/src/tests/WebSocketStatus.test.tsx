import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebSocketStatus } from '../components/WebSocketStatus';
import { WebSocketProvider, useWebSocket } from '../contexts/WebSocketContext';

// Mock WebSocketContext
jest.mock('../contexts/WebSocketContext', () => {
  const originalModule = jest.requireActual('../contexts/WebSocketContext');
  
  return {
    ...originalModule,
    useWebSocket: jest.fn(),
  };
});

const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

describe('WebSocketStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should display connected status', () => {
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketStatus />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected');
  });
  
  it('should display connecting status', () => {
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: true,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketStatus />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connecting');
  });
  
  it('should display disconnected status', () => {
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketStatus />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status disconnected');
  });
  
  it('should apply custom className', () => {
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketStatus className="custom-class" />);
    
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected custom-class');
  });
  
  it('should hide text when showText is false', () => {
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketStatus showText={false} />);
    
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected');
  });
});