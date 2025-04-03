import React, { useState, useEffect } from 'react';
import { useLocalPeerId } from '../hooks/useDarkSwap';

interface PeerStatusProps {
  className?: string;
}

export const PeerStatus: React.FC<PeerStatusProps> = ({ className }) => {
  // Get the local peer ID
  const localPeerId = useLocalPeerId();
  
  // Connected peers (mock data)
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  
  // Connection status
  const [isConnected, setIsConnected] = useState(false);
  
  // Relay status
  const [relayStatus, setRelayStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  // Update connected peers periodically
  useEffect(() => {
    // In a real implementation, we would get this from the DarkSwap instance
    const updatePeers = () => {
      // Simulate peer connections
      const peerCount = Math.floor(Math.random() * 5) + 1;
      const peers = [];
      
      for (let i = 0; i < peerCount; i++) {
        peers.push(`peer-${Math.random().toString(36).substring(2, 10)}`);
      }
      
      setConnectedPeers(peers);
      setIsConnected(true);
      
      // Simulate relay status
      const relayStatuses: Array<'connected' | 'connecting' | 'disconnected'> = [
        'connected',
        'connecting',
        'disconnected',
      ];
      
      setRelayStatus(relayStatuses[Math.floor(Math.random() * relayStatuses.length)]);
    };
    
    // Update immediately
    updatePeers();
    
    // Update every 10 seconds
    const interval = setInterval(updatePeers, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Format peer ID
  const formatPeerId = (peerId: string): string => {
    if (peerId.length <= 10) {
      return peerId;
    }
    
    return `${peerId.substring(0, 5)}...${peerId.substring(peerId.length - 5)}`;
  };
  
  // Get status color
  const getStatusColor = (): string => {
    if (!isConnected) {
      return '#dc3545'; // Red
    }
    
    if (connectedPeers.length === 0) {
      return '#ffc107'; // Yellow
    }
    
    return '#28a745'; // Green
  };
  
  // Get relay status color
  const getRelayStatusColor = (): string => {
    switch (relayStatus) {
      case 'connected':
        return '#28a745'; // Green
      case 'connecting':
        return '#ffc107'; // Yellow
      case 'disconnected':
        return '#dc3545'; // Red
    }
  };
  
  return (
    <div className={`peer-status ${className || ''}`}>
      <div className="peer-status-header">
        <h3>Network Status</h3>
        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}></div>
      </div>
      
      <div className="peer-id">
        <div className="peer-id-label">Your Peer ID:</div>
        <div className="peer-id-value" title={localPeerId}>{formatPeerId(localPeerId)}</div>
        <button
          className="copy-button"
          onClick={() => {
            navigator.clipboard.writeText(localPeerId);
            alert('Peer ID copied to clipboard!');
          }}
        >
          Copy
        </button>
      </div>
      
      <div className="relay-status">
        <div className="relay-status-label">Relay Status:</div>
        <div className="relay-status-value" style={{ color: getRelayStatusColor() }}>
          {relayStatus.charAt(0).toUpperCase() + relayStatus.slice(1)}
        </div>
      </div>
      
      <div className="connected-peers">
        <div className="connected-peers-label">Connected Peers: {connectedPeers.length}</div>
        {connectedPeers.length > 0 ? (
          <ul className="peer-list">
            {connectedPeers.map((peerId, index) => (
              <li key={index} className="peer-item">
                {formatPeerId(peerId)}
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-peers">No peers connected</div>
        )}
      </div>
      
      <style>
        {`
          .peer-status {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .peer-status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .peer-status-header h3 {
            margin: 0;
            color: #333;
            font-size: 1.2rem;
          }
          
          .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }
          
          .peer-id {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #fff;
            border-radius: 4px;
            border: 1px solid #eee;
          }
          
          .peer-id-label {
            font-weight: 500;
            margin-right: 10px;
            color: #555;
          }
          
          .peer-id-value {
            font-family: monospace;
            color: #333;
            flex-grow: 1;
          }
          
          .copy-button {
            background-color: #6c757d;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .copy-button:hover {
            background-color: #5a6268;
          }
          
          .relay-status {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .relay-status-label {
            font-weight: 500;
            margin-right: 10px;
            color: #555;
          }
          
          .relay-status-value {
            font-weight: 600;
          }
          
          .connected-peers {
            margin-top: 15px;
          }
          
          .connected-peers-label {
            font-weight: 500;
            margin-bottom: 10px;
            color: #555;
          }
          
          .peer-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 150px;
            overflow-y: auto;
          }
          
          .peer-item {
            padding: 8px 10px;
            background-color: #fff;
            border-radius: 4px;
            margin-bottom: 5px;
            font-family: monospace;
            border: 1px solid #eee;
          }
          
          .no-peers {
            color: #6c757d;
            font-style: italic;
          }
        `}
      </style>
    </div>
  );
};