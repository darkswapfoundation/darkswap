/**
 * PeerStatus - Component for displaying P2P network status
 * 
 * This component shows the current status of the P2P network connection,
 * including the number of connected peers and connection quality.
 */

import React, { useState, useEffect } from 'react';
import { Badge } from './MemoizedComponents';

export interface PeerStatusProps {
  /** CSS class name */
  className?: string;
}

export interface PeerStats {
  /** Number of connected peers */
  connectedPeers: number;
  /** Maximum number of peers seen */
  maxPeers: number;
  /** Connection quality (0-1) */
  connectionQuality: number;
  /** Whether the node is a relay */
  isRelay: boolean;
  /** Number of active circuits (if relay) */
  activeCircuits?: number;
  /** Last message received timestamp */
  lastMessageTime: number;
}

/**
 * PeerStatus component
 */
export const PeerStatus: React.FC<PeerStatusProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<PeerStats>({
    connectedPeers: 0,
    maxPeers: 0,
    connectionQuality: 0,
    isRelay: false,
    lastMessageTime: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate fetching peer stats
  useEffect(() => {
    // In a real implementation, this would fetch data from the P2P network
    const fetchStats = () => {
      // Simulate network activity
      setStats({
        connectedPeers: Math.floor(Math.random() * 10) + 1,
        maxPeers: 20,
        connectionQuality: Math.random(),
        isRelay: Math.random() > 0.7,
        activeCircuits: Math.floor(Math.random() * 5),
        lastMessageTime: Date.now(),
      });
    };

    // Initial fetch
    fetchStats();

    // Set up interval for periodic updates
    const interval = setInterval(fetchStats, 10000);

    // Clean up
    return () => clearInterval(interval);
  }, []);

  // Determine status variant based on connection quality
  const getStatusVariant = () => {
    if (stats.connectedPeers === 0) return 'danger';
    if (stats.connectionQuality < 0.3) return 'warning';
    if (stats.connectionQuality < 0.7) return 'info';
    return 'success';
  };

  // Format connection quality as percentage
  const formatQuality = () => {
    return `${Math.round(stats.connectionQuality * 100)}%`;
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`peer-status ${className}`} onClick={toggleExpanded}>
      <Badge
        label={`${stats.connectedPeers} peers`}
        variant={getStatusVariant()}
        size="small"
      />
      
      {isExpanded && (
        <div className="peer-status-details">
          <h4>P2P Network Status</h4>
          <ul>
            <li>
              <span>Connected Peers:</span>
              <span>{stats.connectedPeers} / {stats.maxPeers}</span>
            </li>
            <li>
              <span>Connection Quality:</span>
              <span>{formatQuality()}</span>
            </li>
            {stats.isRelay && (
              <li>
                <span>Active Circuits:</span>
                <span>{stats.activeCircuits}</span>
              </li>
            )}
            <li>
              <span>Node Type:</span>
              <span>{stats.isRelay ? 'Relay' : 'Standard'}</span>
            </li>
            <li>
              <span>Last Message:</span>
              <span>
                {Math.round((Date.now() - stats.lastMessageTime) / 1000)}s ago
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PeerStatus;