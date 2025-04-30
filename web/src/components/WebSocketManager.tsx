import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/WebSocketManager.css';

const WebSocketManager: React.FC = () => {
  const { theme } = useTheme();
  const { connected, connecting, error, connect, disconnect } = useWebSocket();
  
  return (
    <div className={`websocket-manager websocket-manager-${theme}`}>
      <div className="websocket-manager-status">
        <div className={`websocket-manager-indicator ${connected ? 'connected' : connecting ? 'connecting' : 'disconnected'}`}></div>
        <span className="websocket-manager-status-text">
          {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>
      
      <div className="websocket-manager-actions">
        <button
          className="websocket-manager-connect-button"
          onClick={connect}
          disabled={connected || connecting}
        >
          Connect
        </button>
        <button
          className="websocket-manager-disconnect-button"
          onClick={disconnect}
          disabled={!connected && !connecting}
        >
          Disconnect
        </button>
      </div>
      
      {error && (
        <div className="websocket-manager-error">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default WebSocketManager;