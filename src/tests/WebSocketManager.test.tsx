import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebSocketManager } from '../components/WebSocketManager';
import { useWebSocket } from '../contexts/WebSocketContext';

// Mock the WebSocketContext hook
jest.mock('../contexts/WebSocketContext');
const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

describe('WebSocketManager', () => {
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
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('WebSocket Status: Connected')).toBeInTheDocument();
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
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('WebSocket Status: Connecting...')).toBeInTheDocument();
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
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('WebSocket Status: Disconnected')).toBeInTheDocument();
  });
  
  it('should call connect when connect button is clicked', () => {
    const mockConnect = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      connected: true,
      connecting: false,
      error: null,
      connect: mockConnect,
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketManager />);
    
    fireEvent.click(screen.getByText('Connect'));
    
    expect(mockConnect).toHaveBeenCalled();
  });
  
  it('should call disconnect when disconnect button is clicked', () => {
    const mockDisconnect = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      connected: false,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: mockDisconnect,
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketManager />);
    
    fireEvent.click(screen.getByText('Disconnect'));
    
    expect(mockDisconnect).toHaveBeenCalled();
  });
  
  it('should display error message when there is an error', () => {
    const error = new Error('Test error');
    
    mockUseWebSocket.mockReturnValue({
      connected: false,
      connecting: false,
      error,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });
  
  it('should call send when send button is clicked', () => {
    const mockSend = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      connected: false,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: mockSend,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: null,
      wsClient: null,
    });
    
    render(<WebSocketManager />);
    
    fireEvent.click(screen.getByText('Send Test Message'));
    
    expect(mockSend).toHaveBeenCalledWith('test', { message: 'Hello, WebSocket!' });
  });
  
  it('should display last received message', () => {
    mockUseWebSocket.mockReturnValue({
      connected: true,
      connecting: false,
      error: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      message: { type: 'test', data: 'Test message' },
      wsClient: null,
    });
    
    render(<WebSocketManager />);
    
    expect(screen.getByText(/Last Message:/)).toBeInTheDocument();
    expect(screen.getByText(/Test message/)).toBeInTheDocument();
  });
  
  it('should display "No messages received" when no messages', () => {
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
    
    render(<WebSocketManager />);
    
    expect(screen.getByText('No messages received')).toBeInTheDocument();
  });
});