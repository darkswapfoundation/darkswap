import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebSocketManager } from '../components/WebSocketManager';
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

describe('WebSocketManager', () => {
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
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-manager')).toHaveClass('websocket-manager');
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
    
    render(<WebSocketManager />);
    
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
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status disconnected');
  });
  
  it('should call onConnected callback when connected', () => {
    const onConnected = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketManager onConnected={onConnected} />);
    
    expect(onConnected).toHaveBeenCalled();
  });
  
  it('should call onDisconnected callback when disconnected', () => {
    const onDisconnected = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketManager onDisconnected={onDisconnected} />);
    
    expect(onDisconnected).toHaveBeenCalled();
  });
  
  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    const error = new Error('WebSocket error');
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: false,
      error,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketManager onError={onError} />);
    
    expect(onError).toHaveBeenCalledWith(error);
  });
  
  it('should attempt reconnection when disconnected', () => {
    jest.useFakeTimers();
    
    const connect = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect,
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketManager />);
    
    // Fast-forward time to trigger reconnect
    jest.advanceTimersByTime(5000);
    
    expect(connect).toHaveBeenCalled();
    
    jest.useRealTimers();
  });
  
  it('should not attempt reconnection when connected', () => {
    jest.useFakeTimers();
    
    const connect = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect,
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketManager />);
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    expect(connect).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });
  
  it('should not attempt reconnection when connecting', () => {
    jest.useFakeTimers();
    
    const connect = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: true,
      error: null,
      connect,
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    render(<WebSocketManager />);
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    expect(connect).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });
  
  it('should clear reconnect timeout on unmount', () => {
    jest.useFakeTimers();
    
    mockUseWebSocket.mockReturnValue({
      wsClient: {} as any,
      isConnected: false,
      isConnecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
    });
    
    const { unmount } = render(<WebSocketManager />);
    
    // Spy on clearTimeout
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    jest.useRealTimers();
    clearTimeoutSpy.mockRestore();
  });
});