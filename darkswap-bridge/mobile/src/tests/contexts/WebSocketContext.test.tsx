import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { WebSocketProvider, useWebSocket } from '../../contexts/WebSocketContext';

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  readyState: number = 0;
  CONNECTING: number = 0;
  OPEN: number = 1;
  CLOSING: number = 2;
  CLOSED: number = 3;
  
  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 0);
  }
  
  send(data: string): void {
    // Mock implementation
  }
  
  close(): void {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe.skip('WebSocketContext', () => {
  const url = 'wss://test.example.com';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result } = renderHook(() => useWebSocket(), { wrapper });

    expect(result.current).toEqual(
      expect.objectContaining({
        connected: false,
        message: null,
        send: expect.any(Function),
        connect: expect.any(Function),
        disconnect: expect.any(Function),
        subscribe: expect.any(Function),
        unsubscribe: expect.any(Function),
      })
    );
  });

  it('connects to WebSocket', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useWebSocket(), { wrapper });
    
    // Wait for connection to establish
    await waitForNextUpdate();
    
    expect(result.current.connected).toBe(true);
  });

  it('handles received messages', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useWebSocket(), { wrapper });
    
    // Wait for connection to establish
    await waitForNextUpdate();
    
    // Simulate receiving a message
    const mockMessage = { type: 'update', data: { price: 50000 } };
    act(() => {
      const ws = (result.current as any).ws;
      if (ws && ws.onmessage) {
        ws.onmessage({ data: JSON.stringify(mockMessage) });
      }
    });
    
    expect(result.current.message).toEqual(mockMessage);
  });

  it('sends messages', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useWebSocket(), { wrapper });
    
    // Wait for connection to establish
    await waitForNextUpdate();
    
    // Mock the send method
    const mockSend = jest.fn();
    (result.current as any).ws.send = mockSend;
    
    // Send a message
    const message = { type: 'subscribe', channel: 'btc_price' };
    act(() => {
      result.current.send(message);
    });
    
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('disconnects from WebSocket', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useWebSocket(), { wrapper });
    
    // Wait for connection to establish
    await waitForNextUpdate();
    
    expect(result.current.connected).toBe(true);
    
    // Mock the close method
    const mockClose = jest.fn();
    (result.current as any).ws.close = mockClose;
    
    // Disconnect
    act(() => {
      result.current.disconnect();
    });
    
    expect(mockClose).toHaveBeenCalled();
  });

  it('subscribes to channels', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useWebSocket(), { wrapper });
    
    // Wait for connection to establish
    await waitForNextUpdate();
    
    // Mock the send method
    const mockSend = jest.fn();
    (result.current as any).ws.send = mockSend;
    
    // Subscribe to a channel
    const callback = jest.fn();
    act(() => {
      result.current.subscribe('btc_price', callback);
    });
    
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'subscribe', channel: 'btc_price' }));
  });

  it('unsubscribes from channels', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider url={url}>{children}</WebSocketProvider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useWebSocket(), { wrapper });
    
    // Wait for connection to establish
    await waitForNextUpdate();
    
    // Mock the send method
    const mockSend = jest.fn();
    (result.current as any).ws.send = mockSend;
    
    // Unsubscribe from a channel
    act(() => {
      result.current.unsubscribe('btc_price');
    });
    
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ type: 'unsubscribe', channel: 'btc_price' }));
  });
});