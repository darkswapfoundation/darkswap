import { WebSocketClient, MessagePriority } from '../utils/WebSocketClient';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close(): void {
    this.readyState = 3;
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure', wasClean: true });
    }
  }
  
  send(data: string): void {
    // Mock implementation
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketClient', () => {
  let wsClient: WebSocketClient;
  let mockWebSocket: MockWebSocket;
  
  beforeEach(() => {
    jest.useFakeTimers();
    
    // Create a spy on the WebSocket constructor
    jest.spyOn(global, 'WebSocket').mockImplementation((url: string | URL) => {
      mockWebSocket = new MockWebSocket(url.toString());
      return mockWebSocket;
    });
    
    // Create a new WebSocketClient
    wsClient = new WebSocketClient({
      url: 'ws://localhost:8080',
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      autoConnect: false,
      debug: false,
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  describe('initialization', () => {
    it('should create a WebSocketClient with default options', () => {
      const defaultClient = new WebSocketClient({
        url: 'ws://localhost:8080',
      });
      expect(defaultClient).toBeDefined();
    });
    
    it('should create a WebSocketClient with custom options', () => {
      const customClient = new WebSocketClient({
        url: 'ws://localhost:8080',
        reconnectInterval: 2000,
        maxReconnectAttempts: 5,
        autoConnect: true,
        debug: true,
        enableBatching: true,
        batcherOptions: {
          maxBatchSize: 2048,
          lowPriorityInterval: 2000,
          mediumPriorityInterval: 1000,
          enableCompression: true,
        },
      });
      expect(customClient).toBeDefined();
    });
    
    it('should auto-connect when autoConnect is true', () => {
      const connectSpy = jest.spyOn(WebSocketClient.prototype, 'connect');
      
      new WebSocketClient({
        url: 'ws://localhost:8080',
        autoConnect: true,
      });
      
      expect(connectSpy).toHaveBeenCalled();
    });
  });
  
  describe('connect', () => {
    it('should create a WebSocket connection', async () => {
      const connectPromise = wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      await connectPromise;
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080');
    });
    
    it('should resolve when connection is successful', async () => {
      const connectPromise = wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      await expect(connectPromise).resolves.toBeUndefined();
    });
    
    it('should reject when connection fails', async () => {
      const connectPromise = wsClient.connect();
      
      // Simulate connection error
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(new Error('Connection failed'));
      }
      
      await expect(connectPromise).rejects.toBeDefined();
    });
    
    it('should handle reconnection attempts', async () => {
      const connectPromise = wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      await connectPromise;
      
      // Simulate disconnection
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1006, reason: 'Connection lost', wasClean: false });
      }
      
      // Should attempt to reconnect
      jest.advanceTimersByTime(1000);
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });
    
    it('should stop reconnecting after max attempts', async () => {
      const connectPromise = wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      await connectPromise;
      
      // Simulate disconnection and failed reconnects
      for (let i = 0; i < 4; i++) {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection lost', wasClean: false });
        }
        
        jest.advanceTimersByTime(1000);
      }
      
      // Should have attempted to connect 4 times (initial + 3 retries)
      expect(global.WebSocket).toHaveBeenCalledTimes(4);
    });
  });
  
  describe('disconnect', () => {
    it('should close the WebSocket connection', async () => {
      await wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      const closeSpy = jest.spyOn(mockWebSocket, 'close');
      
      wsClient.disconnect();
      
      expect(closeSpy).toHaveBeenCalled();
    });
    
    it('should do nothing if not connected', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      wsClient.disconnect();
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('send', () => {
    it('should send messages when connected', async () => {
      await wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      
      wsClient.send('test', { data: 'test' });
      
      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({
        type: 'test',
        payload: { data: 'test' },
      }));
    });
    
    it('should log error when not connected', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      wsClient.send('test', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    it('should use batcher for non-high priority messages when batching is enabled', async () => {
      const batchingClient = new WebSocketClient({
        url: 'ws://localhost:8080',
        enableBatching: true,
      });
      
      await batchingClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      
      batchingClient.send('test', { data: 'test' }, MessagePriority.LOW);
      
      // Should not send immediately
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('event handling', () => {
    it('should register event handlers', () => {
      const handler = jest.fn();
      
      wsClient.on('test', handler);
      
      // Trigger the event
      (wsClient as any).emit('test', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
    
    it('should unregister event handlers', () => {
      const handler = jest.fn();
      
      wsClient.on('test', handler);
      wsClient.off('test', handler);
      
      // Trigger the event
      (wsClient as any).emit('test', { data: 'test' });
      
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should handle message events', async () => {
      const handler = jest.fn();
      
      wsClient.on('test-event', handler);
      
      await wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      // Simulate message event
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({
            type: 'test-event',
            payload: { data: 'test' },
          }),
        });
      }
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
    
    it('should handle generic message events', async () => {
      const handler = jest.fn();
      
      wsClient.on('message', handler);
      
      await wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      // Simulate message event without type
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: JSON.stringify({ data: 'test' }),
        });
      }
      
      expect(handler).toHaveBeenCalled();
    });
    
    it('should handle parse errors in message events', async () => {
      const errorHandler = jest.fn();
      
      wsClient.on('error', errorHandler);
      
      await wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      // Simulate invalid message event
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: 'invalid json',
        });
      }
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });
  
  describe('status checks', () => {
    it('should return connected status', async () => {
      expect(wsClient.isConnected()).toBe(false);
      
      await wsClient.connect();
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      expect(wsClient.isConnected()).toBe(true);
    });
    
    it('should return connecting status', async () => {
      expect(wsClient.isConnecting()).toBe(false);
      
      const connectPromise = wsClient.connect();
      
      expect(wsClient.isConnecting()).toBe(true);
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
      }
      
      await connectPromise;
      
      expect(wsClient.isConnecting()).toBe(false);
    });
    
    it('should return ready state', async () => {
      expect(wsClient.getReadyState()).toBe(null);
      
      await wsClient.connect();
      
      // WebSocket.CONNECTING = 0
      expect(wsClient.getReadyState()).toBe(0);
      
      // Simulate successful connection
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({});
        mockWebSocket.readyState = 1; // WebSocket.OPEN
      }
      
      expect(wsClient.getReadyState()).toBe(1);
    });
  });
});