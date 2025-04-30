/**
 * WebSocketStatus - Component for displaying WebSocket connection status
 * 
 * This component displays the current WebSocket connection status.
 */

import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export interface WebSocketStatusProps {
  /** CSS class name */
  className?: string;
  /** Whether to show text */
  showText?: boolean;
}

/**
 * WebSocketStatus component
 */
export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  className = '',
  showText = true,
}) => {
  const { connected, connecting, error } = useWebSocket();
  
  let status = 'disconnected';
  let statusText = 'Disconnected';
  
  if (connected) {
    status = 'connected';
    statusText = 'Connected';
  } else if (connecting) {
    status = 'connecting';
    statusText = 'Connecting...';
  } else if (error) {
    status = 'error';
    statusText = 'Error';
  }
  
  return (
    <div 
      className={`websocket-status ${status} ${className}`}
      data-testid="websocket-status"
      title={error ? error.message : statusText}
    >
      <div className="status-indicator" />
      {showText && <span className="status-text">{statusText}</span>}
    </div>
  );
};

export default WebSocketStatus;