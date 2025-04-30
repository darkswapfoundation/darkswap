import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { WebSocketProvider, useWebSocket, useWebSocketEvent, useWebSocketSend } from '../contexts/WebSocketContext';
import WebSocketClient from '../utils/WebSocketClient';

// Mock WebSocketClient
jest.mock('../utils/WebSocketClient');
const MockWebSocketClient = WebSocketClient as jest.MockedClass<typeof WebSocketClient>;

// Test component that uses the WebSocket context
const TestComponent: React.FC = () => {
  const { wsClient, isConnected, isConnecting, error, connect, disconnect, send } = useWebSocket();
  
  return (
    <div>
      <div data-testid="connected">{isConnected ? 'true' : 'false'}</div>
      <div data-testid="connecting">{isConnecting ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? error.message : 'no error'}</div>
      <div data-testid="client-exists">{wsClient ? 'true' : 'false'}</div>
      <button data-testid="connect" onClick={connect}>Connect</button>
      <button data-testid="disconnect" onClick={disconnect}>Disconnect</button>
      <button data-testid="send" onClick={() => send('test', { data: 'test' })}>Send</button>
    </div>
  );
};

// Test component that uses the WebSocket event hook
const TestEventComponent: React.FC<{ eventType: string }> = ({ eventType }) => {
  const [eventData, setEventData] = React.useState<any>(null);
  
  useWebSocketEvent(eventType, (data) => {
    setEventData(data);
  });
  
  return (
    <div>
      <div data-testid="event-data">{eventData ? JSON.stringify(eventData) : 'no data'}</div>
    </div>
  );
};

// Test component that uses the WebSocket send hook
const TestSendComponent: React.FC<{ eventType: string }> = ({ eventType }) => {
  const sendEvent = useWebSocketSend(eventType);
  
  return (
    <div>
      <button data-testid="send-event" onClick={() => sendEvent({ data: 'test' })}>Send Event</button>
    </div>
  );
};

// Wrapper component with provider
const TestWrapper: React.FC<{ 
  children: React.ReactNode,
  autoConnect?: boolean
}> = ({ 
  children,
  autoConnect = true
}) => {
  return (
    <WebSocketProvider 
      url="ws://localhost:8080" 
      reconnectInterval={1000}
      maxReconnectAttempts={5}
      autoConnect={autoConnect}
    >
      {children}
    </WebSocketProvider>
  );
};

describe('WebSocketContext', () => {
  let mockWebSocketClient: jest.Mocked<WebSocketClient>;
  let mockEventHandlers: { [key: string]: Function } = {};
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockEventHandlers = {};
    
    // Set up mock WebSocketClient
    mockWebSocketClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      isWebSocketConnected: jest.fn().mockReturnValue(false),
      on: jest.fn().mockImplementation((event, callback) => {
        mockEventHandlers[event] = callback;
        return mockWebSocketClient;
      }),
      off: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<WebSocketClient>;
    
    MockWebSocketClient.mockImplementation(() => mockWebSocketClient);
  });
  
  describe('WebSocketProvider', () => {
    it('should initialize WebSocketClient with correct options', () => {
      render(
        <WebSocketProvider 
          url="ws://localhost:8080" 
          reconnectInterval={2000}
          maxReconnectAttempts={10}
        >
          <div />
        </WebSocketProvider>
      );
      
      expect(MockWebSocketClient).toHaveBeenCalledWith(
        'ws://localhost:8080',
        2000,
        10
      );
    });
    
    it('should provide WebSocketClient to children', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('client-exists').textContent).toBe('true');
    });
    
    it('should auto-connect when autoConnect is true', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(mockWebSocketClient.connect).toHaveBeenCalled();
      expect(screen.getByTestId('connecting').textContent).toBe('true');
    });
    
    it('should not auto-connect when autoConnect is false', () => {
      render(
        <TestWrapper autoConnect={false}>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(mockWebSocketClient.connect).not.toHaveBeenCalled();
      expect(screen.getByTestId('connecting').textContent).toBe('false');
    });
    
    it('should set up event handlers', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
    
    it('should disconnect on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      unmount();
      
      expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
    });
  });
  
  describe('useWebSocket', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useWebSocket must be used within a WebSocketProvider');
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should connect when connect is called', () => {
      render(
        <TestWrapper autoConnect={false}>
          <TestComponent />
        </TestWrapper>
      );
      
      act(() => {
        screen.getByTestId('connect').click();
      });
      
      expect(mockWebSocketClient.connect).toHaveBeenCalled();
    });
    
    it('should disconnect when disconnect is called', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      act(() => {
        screen.getByTestId('disconnect').click();
      });
      
      expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
    });
    
    it('should send message when send is called', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      act(() => {
        screen.getByTestId('send').click();
      });
      
      expect(mockWebSocketClient.send).toHaveBeenCalledWith('test', { data: 'test' });
    });
    
    it('should update state when connected event is emitted', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('connected').textContent).toBe('false');
      
      act(() => {
        mockEventHandlers['connected']();
      });
      
      expect(screen.getByTestId('connected').textContent).toBe('true');
      expect(screen.getByTestId('connecting').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('no error');
    });
    
    it('should update state when disconnected event is emitted', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // First connect
      act(() => {
        mockEventHandlers['connected']();
      });
      
      expect(screen.getByTestId('connected').textContent).toBe('true');
      
      // Then disconnect
      act(() => {
        mockEventHandlers['disconnected']();
      });
      
      expect(screen.getByTestId('connected').textContent).toBe('false');
    });
    
    it('should update state when reconnecting event is emitted', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      act(() => {
        mockEventHandlers['reconnecting']();
      });
      
      expect(screen.getByTestId('connecting').textContent).toBe('true');
    });
    
    it('should update state when reconnect_failed event is emitted', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      act(() => {
        mockEventHandlers['reconnect_failed']();
      });
      
      expect(screen.getByTestId('error').textContent).toBe('Failed to reconnect to WebSocket server');
    });
    
    it('should update state when error event is emitted', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      act(() => {
        mockEventHandlers['error']({});
      });
      
      expect(screen.getByTestId('error').textContent).toBe('WebSocket error');
    });
  });
  
  describe('useWebSocketEvent', () => {
    it('should register event handler', () => {
      render(
        <TestWrapper>
          <TestEventComponent eventType="test-event" />
        </TestWrapper>
      );
      
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    });
    
    it('should unregister event handler on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <TestEventComponent eventType="test-event" />
        </TestWrapper>
      );
      
      unmount();
      
      expect(mockWebSocketClient.off).toHaveBeenCalledWith('test-event', expect.any(Function));
    });
    
    it('should update component when event is emitted', () => {
      render(
        <TestWrapper>
          <TestEventComponent eventType="test-event" />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('event-data').textContent).toBe('no data');
      
      // Find the event handler for test-event
      const eventHandler = mockWebSocketClient.on.mock.calls.find(
        call => call[0] === 'test-event'
      )?.[1];
      
      if (eventHandler) {
        act(() => {
          eventHandler({ test: 'data' });
        });
        
        expect(screen.getByTestId('event-data').textContent).toBe(JSON.stringify({ test: 'data' }));
      }
    });
  });
  
  describe('useWebSocketSend', () => {
    it('should return function that sends messages', () => {
      render(
        <TestWrapper>
          <TestSendComponent eventType="test-event" />
        </TestWrapper>
      );
      
      act(() => {
        screen.getByTestId('send-event').click();
      });
      
      expect(mockWebSocketClient.send).toHaveBeenCalledWith('test-event', { data: 'test' });
    });
  });
});