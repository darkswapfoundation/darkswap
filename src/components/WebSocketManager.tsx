/**
 * WebSocketManager - Component for managing WebSocket connections
 * 
 * This component provides a UI for managing WebSocket connections.
 */

import React, { useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { WebSocketStatus } from './WebSocketStatus';

export interface WebSocketManagerProps {
  /** CSS class name */
  className?: string;
}

/**
 * WebSocketManager component
 */
export const WebSocketManager: React.FC<WebSocketManagerProps> = ({ 
  className = '',
}) => {
  const { connected, connecting, error, message, connect, disconnect, send } = useWebSocket();
  const [messageInput, setMessageInput] = useState('');
  
  const handleConnect = () => {
    connect().catch(err => {
      console.error('Failed to connect:', err);
    });
  };
  
  const handleDisconnect = () => {
    disconnect();
  };
  
  const handleSend = () => {
    if (messageInput.trim()) {
      send('message', { text: messageInput.trim() });
      setMessageInput('');
    } else {
      // Send a test message if input is empty
      send('test', { message: 'Hello, WebSocket!' });
    }
  };
  
  const getStatusText = () => {
    if (connected) return 'Connected';
    if (connecting) return 'Connecting...';
    return 'Disconnected';
  };
  
  return (
    <div className={`websocket-manager ${className}`}>
      <h2>WebSocket Manager</h2>
      
      <div className="status-section">
        <p>WebSocket Status: {getStatusText()}</p>
        <WebSocketStatus />
      </div>
      
      {error && (
        <div className="error-section">
          <p>Error: {error.message}</p>
        </div>
      )}
      
      <div className="controls-section">
        <button 
          onClick={handleConnect}
          disabled={connected || connecting}
          className="connect-button"
        >
          Connect
        </button>
        
        <button 
          onClick={handleDisconnect}
          disabled={!connected}
          className="disconnect-button"
        >
          Disconnect
        </button>
      </div>
      
      <div className="message-section">
        <div className="message-input">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Enter message"
            disabled={!connected}
          />
          
          <button 
            onClick={handleSend}
            disabled={!connected}
            className="send-button"
          >
            Send
          </button>
        </div>
        
        <button 
          onClick={() => send('test', { message: 'Hello, WebSocket!' })}
          disabled={!connected}
          className="test-button"
        >
          Send Test Message
        </button>
      </div>
      
      <div className="received-section">
        <h3>Last Message:</h3>
        {message ? (
          <pre className="message-display">
            {JSON.stringify(message, null, 2)}
          </pre>
        ) : (
          <p>No messages received</p>
        )}
      </div>
    </div>
  );
};

export default WebSocketManager;