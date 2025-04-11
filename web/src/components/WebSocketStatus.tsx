import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

// WebSocket status props
interface WebSocketStatusProps {
  className?: string;
}

/**
 * WebSocket status component
 * @param props Component props
 * @returns WebSocket status component
 */
const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className }) => {
  // Get WebSocket context
  const { connected, authenticated } = useWebSocket();
  
  return (
    <div className={`websocket-status ${className || ''}`}>
      <div className="websocket-status-item">
        <span className="websocket-status-label">Connection:</span>
        <span className={`websocket-status-value ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="websocket-status-item">
        <span className="websocket-status-label">Authentication:</span>
        <span className={`websocket-status-value ${authenticated ? 'authenticated' : 'unauthenticated'}`}>
          {authenticated ? 'Authenticated' : 'Unauthenticated'}
        </span>
      </div>
    </div>
  );
};

export default WebSocketStatus;