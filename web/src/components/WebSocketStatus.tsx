import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/WebSocketStatus.css';

interface WebSocketStatusProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showLabel = false,
  size = 'small',
}) => {
  const { theme } = useTheme();
  const { connected, connecting } = useWebSocket();
  
  return (
    <div className={`websocket-status websocket-status-${theme} websocket-status-${size}`}>
      <div className={`websocket-status-indicator ${connected ? 'connected' : connecting ? 'connecting' : 'disconnected'}`}></div>
      {showLabel && (
        <span className="websocket-status-label">
          {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;