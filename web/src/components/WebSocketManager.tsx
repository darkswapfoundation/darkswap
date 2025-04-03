import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface WebSocketManagerProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket manager component
 * @param props Component props
 * @returns WebSocket manager component
 */
export const WebSocketManager: React.FC<WebSocketManagerProps> = ({
  onConnected,
  onDisconnected,
  onError,
}) => {
  const { isConnected, isConnecting, error, connect } = useWebSocket();
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Update status when connection state changes
  useEffect(() => {
    if (isConnected) {
      setStatus('connected');
      onConnected?.();
    } else if (isConnecting) {
      setStatus('connecting');
    } else {
      setStatus('disconnected');
      onDisconnected?.();
    }
  }, [isConnected, isConnecting, onConnected, onDisconnected]);

  // Call onError when error changes
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Reconnect when disconnected
  useEffect(() => {
    if (status === 'disconnected') {
      const reconnectTimeout = setTimeout(() => {
        connect();
      }, 5000);

      return () => {
        clearTimeout(reconnectTimeout);
      };
    }
  }, [status, connect]);

  return (
    <div className="websocket-manager">
      <div className={`websocket-status ${status}`}>
        <div className="status-indicator"></div>
        <div className="status-text">
          {status === 'connected' && 'Connected'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'disconnected' && 'Disconnected'}
        </div>
      </div>

      <style>
        {`
          .websocket-manager {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
          }
          
          .websocket-status {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 20px;
            background-color: #f8f9fa;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
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

export default WebSocketManager;