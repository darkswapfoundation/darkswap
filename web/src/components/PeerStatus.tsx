import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import '../styles/PeerStatus.css';

interface PeerStatusProps {
  showCount?: boolean;
}

interface Peer {
  id: string;
  address: string;
  connected: boolean;
  lastSeen: number;
}

const PeerStatus: React.FC<PeerStatusProps> = ({ showCount = true }) => {
  const { connected, on } = useWebSocket();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Subscribe to peer updates
  useEffect(() => {
    if (connected) {
      const unsubscribe = on('peerUpdate', (data: { peers: Peer[] }) => {
        setPeers(data.peers);
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [connected, on]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Count connected peers
  const connectedPeers = peers.filter(peer => peer.connected).length;
  
  return (
    <div className="peer-status">
      <div className="peer-status-header" onClick={toggleExpanded}>
        <div className="peer-status-summary">
          <div className={`peer-indicator ${connectedPeers > 0 ? 'connected' : 'disconnected'}`}></div>
          {showCount && (
            <span className="peer-count">{connectedPeers} peers</span>
          )}
        </div>
        <button className={`peer-expand-button ${isExpanded ? 'expanded' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      
      {isExpanded && (
        <div className="peer-list">
          {peers.length === 0 ? (
            <div className="peer-empty">No peers found</div>
          ) : (
            peers.map(peer => (
              <div key={peer.id} className={`peer-item ${peer.connected ? 'connected' : 'disconnected'}`}>
                <div className="peer-item-status"></div>
                <div className="peer-item-details">
                  <div className="peer-item-id">{peer.id.substring(0, 8)}...</div>
                  <div className="peer-item-address">{peer.address}</div>
                </div>
                <div className="peer-item-time">
                  {peer.connected ? 'Connected' : `Last seen ${formatLastSeen(peer.lastSeen)}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Format last seen time
const formatLastSeen = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
};

export default PeerStatus;