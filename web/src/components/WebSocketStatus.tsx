import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface WebSocketStatusProps {
  className?: string;
  showText?: boolean;
}

/**
 * WebSocket status component
 * @param props Component props
 * @returns WebSocket status component
 */
export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  className,
  showText = true,
}) => {
  const { isConnected, isConnecting } = useWebSocket();

  // Determine status
  const status = isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected';

  // Status text
  const statusText = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  };

  return (
    <div className={`websocket-status ${status} ${className || ''}`}>
      <div className="status-indicator"></div>
      {showText && <div className="status-text">{statusText[status]}</div>}

      <style>
        {`
          .websocket-status {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 12px;
            background-color: #f8f9fa;
          }
          
          .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
          }
          
          .status-text {
            font-size: 0.8rem;
            font-weight: 500;
          }
          
          .connected .status-indicator {
            background-color: #28a745;
          }
          
          .connecting .status-indicator {
            background-color: #ffc107;
            animation: pulse 1.5s infinite;
          }
          
          .disconnected .status-indicator {
            background-color: #dc3545;
          }
          
          @keyframes pulse {
            0% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default WebSocketStatus;