import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { WebSocketManager } from '../../components/WebSocketManager';
import { WebSocketStatus } from '../../components/WebSocketStatus';

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

describe('WebSocket Integration Tests', () => {
  let mockWebSocket: MockWebSocket;
  
  beforeEach(() => {
    jest.useFakeTimers();
    
    // Create a spy on the WebSocket constructor
    jest.spyOn(global, 'WebSocket').mockImplementation((url: string | URL) => {
      mockWebSocket = new MockWebSocket(url.toString());
      return mockWebSocket as any;
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  describe('WebSocketProvider with WebSocketManager', () => {
    it('should connect and update status', async () => {
      render(
        <WebSocketProvider url="ws://localhost:8080" autoConnect={false}>
          <WebSocketManager />
        </WebSocketProvider>
      );
      
      // Initially disconnected
      expect(screen.getByText('WebSocket Status: Disconnected')).toBeInTheDocument();
      
      // Click connect button
      fireEvent.click(screen.getByText('Connect'));
      
      // Should show connecting status
      expect(screen.getByText('WebSocket Status: Connecting...')).toBeInTheDocument();
      
      // Simulate successful connection
      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen({});
        }
      });
      
      // Should show connected status
      expect(screen.getByText('WebSocket Status: Connected')).toBeInTheDocument();
      
      // Click disconnect button
      fireEvent.click(screen.getByText('Disconnect'));
      
      // Should show disconnected status
      expect(screen.getByText('WebSocket Status: Disconnected')).toBeInTheDocument();
    });
    
    it('should send messages and display responses', async () => {
      render(
        <WebSocketProvider url="ws://localhost:8080" autoConnect={true}>
          <WebSocketManager />
        </WebSocketProvider>
      );
      
      // Simulate successful connection
      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen({});
        }
      });
      
      // Spy on send method
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      
      // Click send test message button
      fireEvent.click(screen.getByText('Send Test Message'));
      
      // Should have called send
      expect(sendSpy).toHaveBeenCalled();
      
      // Simulate response
      await act(async () => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({
            data: JSON.stringify({
              type: 'response',
              payload: { message: 'Test response' },
            }),
          });
        }
      });
      
      // Should display the response
      expect(screen.getByText(/Test response/)).toBeInTheDocument();
    });
    
    it('should handle connection errors', async () => {
      render(
        <WebSocketProvider url="ws://localhost:8080" autoConnect={true}>
          <WebSocketManager />
        </WebSocketProvider>
      );
      
      // Simulate connection error
      await act(async () => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(new Error('Connection failed'));
        }
      });
      
      // Should display error
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
  
  describe('WebSocketProvider with WebSocketStatus', () => {
    it('should display correct status indicators', async () => {
      render(
        <WebSocketProvider url="ws://localhost:8080" autoConnect={false}>
          <WebSocketStatus />
        </WebSocketProvider>
      );
      
      // Initially disconnected
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status disconnected');
      
      // Simulate connecting
      await act(async () => {
        // Click connect button (we need to trigger this through the context)
        const connectButton = document.createElement('button');
        connectButton.onclick = () => {
          if (mockWebSocket.onopen) {
            mockWebSocket.onopen({});
          }
        };
        fireEvent.click(connectButton);
      });
      
      // Should show connected status
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status connected');
      
      // Simulate disconnection
      await act(async () => {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1000, reason: 'Normal closure', wasClean: true });
        }
      });
      
      // Should show disconnected status
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByTestId('websocket-status')).toHaveClass('websocket-status disconnected');
    });
  });
  
  describe('Error handling and recovery', () => {
    it('should handle reconnection after error', async () => {
      render(
        <WebSocketProvider 
          url="ws://localhost:8080" 
          autoConnect={true}
          reconnectInterval={1000}
          maxReconnectAttempts={3}
        >
          <WebSocketStatus />
        </WebSocketProvider>
      );
      
      // Simulate connection error
      await act(async () => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(new Error('Connection failed'));
        }
        
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection failed', wasClean: false });
        }
      });
      
      // Should show disconnected status
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      
      // Advance timer to trigger reconnect
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should have attempted to reconnect
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      
      // Simulate successful reconnection
      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen({});
        }
      });
      
      // Should show connected status
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
    
    it('should stop reconnecting after max attempts', async () => {
      render(
        <WebSocketProvider 
          url="ws://localhost:8080" 
          autoConnect={true}
          reconnectInterval={1000}
          maxReconnectAttempts={2}
        >
          <WebSocketStatus />
        </WebSocketProvider>
      );
      
      // Simulate connection and then disconnection
      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen({});
        }
        
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({ code: 1006, reason: 'Connection lost', wasClean: false });
        }
      });
      
      // Simulate failed reconnects
      for (let i = 0; i < 2; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
          
          if (mockWebSocket.onclose) {
            mockWebSocket.onclose({ code: 1006, reason: 'Connection lost', wasClean: false });
          }
        });
      }
      
      // Should have attempted to connect 3 times (initial + 2 retries)
      expect(global.WebSocket).toHaveBeenCalledTimes(3);
      
      // Advance timer again
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should not attempt another reconnect
      expect(global.WebSocket).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('Performance and stress testing', () => {
    it('should handle rapid message sending', async () => {
      render(
        <WebSocketProvider url="ws://localhost:8080" autoConnect={true}>
          <WebSocketManager />
        </WebSocketProvider>
      );
      
      // Simulate successful connection
      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen({});
        }
      });
      
      // Spy on send method
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      
      // Send multiple messages rapidly
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('Send Test Message'));
      }
      
      // Should have called send 10 times
      expect(sendSpy).toHaveBeenCalledTimes(10);
    });
    
    it('should handle multiple rapid connections and disconnections', async () => {
      const { unmount, rerender } = render(
        <WebSocketProvider url="ws://localhost:8080" autoConnect={false}>
          <WebSocketStatus />
        </WebSocketProvider>
      );
      
      for (let i = 0; i < 5; i++) {
        // Unmount and remount
        unmount();
        
        rerender(
          <WebSocketProvider url="ws://localhost:8080" autoConnect={true}>
            <WebSocketStatus />
          </WebSocketProvider>
        );
        
        // Simulate successful connection
        await act(async () => {
          if (mockWebSocket.onopen) {
            mockWebSocket.onopen({});
          }
        });
        
        // Should show connected status
        expect(screen.getByText('Connected')).toBeInTheDocument();
      }
      
      // Should have created 5 WebSocket instances
      expect(global.WebSocket).toHaveBeenCalledTimes(5);
    });
  });
});