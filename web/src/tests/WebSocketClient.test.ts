import { EventEmitter } from 'events';
import WebSocketClient from '../utils/WebSocketClient';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  constructor(url: string) {
    this.url = url;
  }
  
  send(data: string): void {
    // Mock implementation
  }
  
  close(): void {
    // Mock implementation
  }
}

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any;

describe('WebSocketClient', () => {
  let wsClient: WebSocketClient;
  const url = 'ws://localhost:8080';
  
  beforeEach(() => {
    jest.useFakeTimers();
    wsClient = new WebSocketClient(url);
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('constructor', () => {
    it('should create an instance with default options', () => {
      expect(wsClient).toBeInstanceOf(WebSocketClient);
      expect(wsClient).toBeInstanceOf(EventEmitter);
    });
    
    it('should set custom reconnect interval', () => {
      const reconnectInterval = 10000;
      const client = new WebSocketClient(url, reconnectInterval);
      
      // @ts-ignore - accessing private property for testing
      expect(client.reconnectInterval).toBe(reconnectInterval);
    });
    
    it('should set custom max reconnect attempts', () => {
      const maxReconnectAttempts = 5;
      const client = new WebSocketClient(url, 5000, maxReconnectAttempts);
      
      // @ts-ignore - accessing private property for testing
      expect(client.maxReconnectAttempts).toBe(maxReconnectAttempts);
    });
  });
  
  describe('connect', () => {
    it('should create a new WebSocket instance', () => {
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.ws).toBeInstanceOf(MockWebSocket);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.ws.url).toBe(url);
    });
    
    it('should set isConnecting to true', () => {
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnecting).toBe(true);
    });
    
    it('should not connect if already connecting', () => {
      // @ts-ignore - setting private property for testing
      wsClient.isConnecting = true;
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.ws).toBeNull();
    });
    
    it('should not connect if already connected', () => {
      // @ts-ignore - setting private property for testing
      wsClient.isConnected = true;
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.ws).toBeNull();
    });
    
    it('should handle connection errors', () => {
      // Mock WebSocket constructor to throw an error
      const originalWebSocket = global.WebSocket;
      global.WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('Connection error');
      }) as any;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnecting).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket connection error:',
        expect.any(Error)
      );
      
      // Restore original WebSocket
      global.WebSocket = originalWebSocket;
      consoleSpy.mockRestore();
    });
  });
  
  describe('disconnect', () => {
    it('should close the WebSocket connection', () => {
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      const closeSpy = jest.spyOn(ws, 'close');
      
      wsClient.disconnect();
      
      expect(closeSpy).toHaveBeenCalled();
      // @ts-ignore - accessing private property for testing
      expect(wsClient.ws).toBeNull();
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnected).toBe(false);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnecting).toBe(false);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.reconnectAttempts).toBe(0);
    });
    
    it('should clear reconnect timeout', () => {
      // @ts-ignore - setting private property for testing
      wsClient.reconnectTimeout = setTimeout(() => {}, 1000);
      
      wsClient.disconnect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.reconnectTimeout).toBeNull();
    });
  });
  
  describe('send', () => {
    it('should send a message when connected', () => {
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      const sendSpy = jest.spyOn(ws, 'send');
      
      // @ts-ignore - setting private property for testing
      wsClient.isConnected = true;
      
      const type = 'test';
      const payload = { data: 'test' };
      wsClient.send(type, payload);
      
      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({ type, payload })
      );
    });
    
    it('should not send a message when not connected', () => {
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      const sendSpy = jest.spyOn(ws, 'send');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // @ts-ignore - setting private property for testing
      wsClient.isConnected = false;
      
      wsClient.send('test', { data: 'test' });
      
      expect(sendSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot send message: WebSocket is not connected'
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('event handlers', () => {
    it('should handle open event', () => {
      const emitSpy = jest.spyOn(wsClient, 'emit');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      
      // Simulate open event
      ws.onopen!({} as Event);
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnected).toBe(true);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnecting).toBe(false);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.reconnectAttempts).toBe(0);
      
      expect(emitSpy).toHaveBeenCalledWith('connected');
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket connected');
      
      consoleSpy.mockRestore();
    });
    
    it('should handle message event', () => {
      const emitSpy = jest.spyOn(wsClient, 'emit');
      
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      
      // Simulate message event
      const message = { type: 'test', payload: { data: 'test' } };
      ws.onmessage!({ data: JSON.stringify(message) } as MessageEvent);
      
      expect(emitSpy).toHaveBeenCalledWith('message', message);
      expect(emitSpy).toHaveBeenCalledWith(message.type, message.payload);
    });
    
    it('should handle message parsing errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      
      // Simulate message event with invalid JSON
      ws.onmessage!({ data: 'invalid json' } as MessageEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing WebSocket message:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should handle close event', () => {
      const emitSpy = jest.spyOn(wsClient, 'emit');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const scheduleReconnectSpy = jest.spyOn(wsClient as any, 'scheduleReconnect');
      
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      
      // Simulate close event
      const closeEvent = { code: 1000, reason: 'Normal closure' } as CloseEvent;
      ws.onclose!(closeEvent);
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnected).toBe(false);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnecting).toBe(false);
      // @ts-ignore - accessing private property for testing
      expect(wsClient.ws).toBeNull();
      
      expect(emitSpy).toHaveBeenCalledWith('disconnected', closeEvent);
      expect(consoleSpy).toHaveBeenCalledWith(
        `WebSocket disconnected: ${closeEvent.code} ${closeEvent.reason}`
      );
      expect(scheduleReconnectSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should handle error event', () => {
      const emitSpy = jest.spyOn(wsClient, 'emit');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      wsClient.connect();
      
      // @ts-ignore - accessing private property for testing
      const ws = wsClient.ws as MockWebSocket;
      
      // Simulate error event
      const errorEvent = {} as Event;
      ws.onerror!(errorEvent);
      
      expect(emitSpy).toHaveBeenCalledWith('error', errorEvent);
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', errorEvent);
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('scheduleReconnect', () => {
    it('should emit reconnect_failed when max attempts reached', () => {
      const emitSpy = jest.spyOn(wsClient, 'emit');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // @ts-ignore - setting private property for testing
      wsClient.reconnectAttempts = 10;
      // @ts-ignore - setting private property for testing
      wsClient.maxReconnectAttempts = 10;
      
      // @ts-ignore - calling private method for testing
      wsClient.scheduleReconnect();
      
      expect(emitSpy).toHaveBeenCalledWith('reconnect_failed');
      expect(consoleSpy).toHaveBeenCalledWith('Maximum reconnect attempts reached');
      
      consoleSpy.mockRestore();
    });
    
    it('should schedule reconnect with exponential backoff', () => {
      const emitSpy = jest.spyOn(wsClient, 'emit');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // @ts-ignore - setting private property for testing
      wsClient.reconnectAttempts = 1;
      // @ts-ignore - setting private property for testing
      wsClient.reconnectInterval = 1000;
      
      // @ts-ignore - calling private method for testing
      wsClient.scheduleReconnect();
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.reconnectAttempts).toBe(2);
      expect(emitSpy).toHaveBeenCalledWith('reconnecting', {
        attempt: 2,
        delay: 1000 * Math.pow(1.5, 1),
      });
      
      // Fast-forward time to trigger reconnect
      jest.advanceTimersByTime(1000 * Math.pow(1.5, 1));
      
      // @ts-ignore - accessing private property for testing
      expect(wsClient.isConnecting).toBe(true);
      
      consoleSpy.mockRestore();
    });
    
    it('should clear existing reconnect timeout', () => {
      // @ts-ignore - setting private property for testing
      wsClient.reconnectTimeout = setTimeout(() => {}, 1000);
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // @ts-ignore - calling private method for testing
      wsClient.scheduleReconnect();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
  
  describe('isWebSocketConnected', () => {
    it('should return true when connected', () => {
      // @ts-ignore - setting private property for testing
      wsClient.isConnected = true;
      
      expect(wsClient.isWebSocketConnected()).toBe(true);
    });
    
    it('should return false when not connected', () => {
      // @ts-ignore - setting private property for testing
      wsClient.isConnected = false;
      
      expect(wsClient.isWebSocketConnected()).toBe(false);
    });
  });
});