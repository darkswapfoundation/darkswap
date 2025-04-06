/**
 * WebSocketStatus - Component for displaying WebSocket connection status
 * 
 * This component shows the current status of the WebSocket connection,
 * including connection state and latency.
 */

import React, { useState, useEffect } from 'react';
import { Badge } from './MemoizedComponents';
import WebSocketBatcher from '../utils/WebSocketBatcher';

export interface WebSocketStatusProps {
  /** CSS class name */
  className?: string;
}

export interface WebSocketStats {
  /** Connection state */
  state: 'connecting' | 'open' | 'closing' | 'closed' | 'error';
  /** Connection latency in milliseconds */
  latency: number;
  /** Time since last message in milliseconds */
  lastMessageTime: number;
  /** Number of messages sent */
  messagesSent: number;
  /** Number of messages received */
  messagesReceived: number;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Batch statistics */
  batchStats?: {
    /** Total number of batches sent */
    totalBatches: number;
    /** Average batch size in messages */
    avgBatchSize: number;
    /** Total bytes saved by batching */
    bytesSaved: number;
  };
}

/**
 * WebSocketStatus component
 */
export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<WebSocketStats>({
    state: 'closed',
    latency: 0,
    lastMessageTime: 0,
    messagesSent: 0,
    messagesReceived: 0,
    reconnectAttempts: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate WebSocket connection and stats
  useEffect(() => {
    // In a real implementation, this would use the actual WebSocket connection
    const simulateConnection = () => {
      // Simulate connection state
      const states: Array<'connecting' | 'open' | 'closing' | 'closed' | 'error'> = [
        'connecting',
        'open',
        'open',
        'open',
        'open',
        'error',
      ];
      const randomState = states[Math.floor(Math.random() * states.length)];
      
      // Get batch stats if available
      const batchStats = WebSocketBatcher.getStats();
      
      // Update stats
      setStats({
        state: randomState,
        latency: Math.floor(Math.random() * 200) + 10,
        lastMessageTime: Date.now() - Math.floor(Math.random() * 10000),
        messagesSent: stats.messagesSent + Math.floor(Math.random() * 5),
        messagesReceived: stats.messagesReceived + Math.floor(Math.random() * 5),
        reconnectAttempts: randomState === 'error' ? stats.reconnectAttempts + 1 : stats.reconnectAttempts,
        batchStats: {
          totalBatches: batchStats.totalBatches,
          avgBatchSize: batchStats.avgBatchSize,
          bytesSaved: batchStats.bytesSaved,
        },
      });
    };

    // Initial simulation
    simulateConnection();

    // Set up interval for periodic updates
    const interval = setInterval(simulateConnection, 5000);

    // Clean up
    return () => clearInterval(interval);
  }, [stats.messagesSent, stats.messagesReceived, stats.reconnectAttempts]);

  // Determine status variant based on connection state
  const getStatusVariant = () => {
    switch (stats.state) {
      case 'open':
        return stats.latency > 150 ? 'warning' : 'success';
      case 'connecting':
        return 'info';
      case 'closing':
        return 'warning';
      case 'closed':
      case 'error':
        return 'danger';
      default:
        return 'info';
    }
  };

  // Get status label
  const getStatusLabel = () => {
    switch (stats.state) {
      case 'open':
        return `Connected (${stats.latency}ms)`;
      case 'connecting':
        return 'Connecting...';
      case 'closing':
        return 'Closing...';
      case 'closed':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  // Format time since last message
  const formatLastMessageTime = () => {
    const seconds = Math.floor((Date.now() - stats.lastMessageTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`websocket-status ${className}`} onClick={toggleExpanded}>
      <Badge
        label={getStatusLabel()}
        variant={getStatusVariant()}
        size="small"
      />
      
      {isExpanded && (
        <div className="websocket-status-details">
          <h4>WebSocket Status</h4>
          <ul>
            <li>
              <span>State:</span>
              <span>{stats.state}</span>
            </li>
            <li>
              <span>Latency:</span>
              <span>{stats.latency}ms</span>
            </li>
            <li>
              <span>Last Message:</span>
              <span>{formatLastMessageTime()}</span>
            </li>
            <li>
              <span>Messages Sent:</span>
              <span>{stats.messagesSent}</span>
            </li>
            <li>
              <span>Messages Received:</span>
              <span>{stats.messagesReceived}</span>
            </li>
            {stats.reconnectAttempts > 0 && (
              <li>
                <span>Reconnect Attempts:</span>
                <span>{stats.reconnectAttempts}</span>
              </li>
            )}
            {stats.batchStats && (
              <>
                <li>
                  <span>Batches Sent:</span>
                  <span>{stats.batchStats.totalBatches}</span>
                </li>
                <li>
                  <span>Avg. Batch Size:</span>
                  <span>{stats.batchStats.avgBatchSize.toFixed(1)} msgs</span>
                </li>
                <li>
                  <span>Bytes Saved:</span>
                  <span>{(stats.batchStats.bytesSaved / 1024).toFixed(2)} KB</span>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;