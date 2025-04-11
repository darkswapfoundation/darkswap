import React from 'react';
import { useP2PNetworkStatus, useP2PPeerList } from '../contexts/WebSocketContext';

// P2P network status props
interface P2PNetworkStatusProps {
  className?: string;
  showPeers?: boolean;
}

/**
 * P2P network status component
 * @param props Component props
 * @returns P2P network status component
 */
const P2PNetworkStatus: React.FC<P2PNetworkStatusProps> = ({
  className,
  showPeers = true,
}) => {
  // Get P2P network status
  const networkStatus = useP2PNetworkStatus();
  
  // Get P2P peer list
  const peers = useP2PPeerList();
  
  // Format uptime
  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  return (
    <div className={`p2p-network-status ${className || ''}`}>
      <div className="p2p-network-status-header">
        <h3>P2P Network Status</h3>
      </div>
      
      <div className="p2p-network-status-content">
        <div className="p2p-network-status-item">
          <div className="p2p-network-status-label">Status:</div>
          <div
            className={`p2p-network-status-value ${
              networkStatus.connected
                ? 'p2p-network-status-connected'
                : 'p2p-network-status-disconnected'
            }`}
          >
            {networkStatus.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div className="p2p-network-status-item">
          <div className="p2p-network-status-label">Peers:</div>
          <div className="p2p-network-status-value">{networkStatus.peerCount}</div>
        </div>
        
        <div className="p2p-network-status-item">
          <div className="p2p-network-status-label">Uptime:</div>
          <div className="p2p-network-status-value">
            {formatUptime(networkStatus.uptime)}
          </div>
        </div>
        
        <div className="p2p-network-status-item">
          <div className="p2p-network-status-label">Messages Sent:</div>
          <div className="p2p-network-status-value">
            {networkStatus.messages.sent}
          </div>
        </div>
        
        <div className="p2p-network-status-item">
          <div className="p2p-network-status-label">Messages Received:</div>
          <div className="p2p-network-status-value">
            {networkStatus.messages.received}
          </div>
        </div>
        
        {showPeers && peers.length > 0 && (
          <div className="p2p-network-status-peers">
            <h4>Connected Peers</h4>
            
            <div className="p2p-network-status-peers-list">
              <div className="p2p-network-status-peers-row p2p-network-status-peers-header-row">
                <div className="p2p-network-status-peers-cell">ID</div>
                <div className="p2p-network-status-peers-cell">IP</div>
                <div className="p2p-network-status-peers-cell">Port</div>
                <div className="p2p-network-status-peers-cell">Version</div>
                <div className="p2p-network-status-peers-cell">User Agent</div>
              </div>
              
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="p2p-network-status-peers-row"
                >
                  <div className="p2p-network-status-peers-cell p2p-network-status-peers-id">
                    {peer.id.substring(0, 8)}...
                  </div>
                  <div className="p2p-network-status-peers-cell p2p-network-status-peers-ip">
                    {peer.ip}
                  </div>
                  <div className="p2p-network-status-peers-cell p2p-network-status-peers-port">
                    {peer.port}
                  </div>
                  <div className="p2p-network-status-peers-cell p2p-network-status-peers-version">
                    {peer.version}
                  </div>
                  <div className="p2p-network-status-peers-cell p2p-network-status-peers-user-agent">
                    {peer.userAgent}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default P2PNetworkStatus;