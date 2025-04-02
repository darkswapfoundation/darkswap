import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatNumberWithCommas } from '../utils/formatters';

interface P2PNetworkStatusProps {
  className?: string;
  refreshInterval?: number;
}

interface PeerInfo {
  id: string;
  address: string;
  connected: boolean;
  direction: 'inbound' | 'outbound';
  latency: number;
  version: string;
  userAgent: string;
  lastSeen: number;
  connectedSince: number;
}

interface NetworkInfo {
  peerCount: number;
  connectedPeers: number;
  inboundPeers: number;
  outboundPeers: number;
  relayCount: number;
  averageLatency: number;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  peers: PeerInfo[];
}

const P2PNetworkStatus: React.FC<P2PNetworkStatusProps> = ({
  className = '',
  refreshInterval = 30000, // 30 seconds
}) => {
  // State
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<PeerInfo | null>(null);
  const [showPeerDetails, setShowPeerDetails] = useState<boolean>(false);
  
  // Get API client and WebSocket context
  const { client } = useApi();
  const { connectionStatus } = useWebSocket();
  
  // Fetch network info
  const fetchNetworkInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock network info
      const mockPeers: PeerInfo[] = [];
      
      // Generate random peers
      for (let i = 0; i < 20; i++) {
        const connected = Math.random() > 0.2;
        const direction = Math.random() > 0.5 ? 'inbound' : 'outbound';
        const now = Date.now();
        
        mockPeers.push({
          id: `peer-${i}`,
          address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${8000 + Math.floor(Math.random() * 2000)}`,
          connected,
          direction,
          latency: Math.floor(Math.random() * 200) + 10,
          version: `v${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          userAgent: `DarkSwap/${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
          lastSeen: connected ? now : now - Math.floor(Math.random() * 1000000),
          connectedSince: connected ? now - Math.floor(Math.random() * 1000000) : 0,
        });
      }
      
      // Calculate network info
      const connectedPeers = mockPeers.filter(p => p.connected).length;
      const inboundPeers = mockPeers.filter(p => p.connected && p.direction === 'inbound').length;
      const outboundPeers = mockPeers.filter(p => p.connected && p.direction === 'outbound').length;
      const averageLatency = mockPeers.filter(p => p.connected).reduce((sum, p) => sum + p.latency, 0) / connectedPeers;
      
      // Determine network health
      let networkHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      if (connectedPeers >= 15 && averageLatency < 100) {
        networkHealth = 'excellent';
      } else if (connectedPeers >= 10 && averageLatency < 150) {
        networkHealth = 'good';
      } else if (connectedPeers >= 5 && averageLatency < 200) {
        networkHealth = 'fair';
      }
      
      const mockNetworkInfo: NetworkInfo = {
        peerCount: mockPeers.length,
        connectedPeers,
        inboundPeers,
        outboundPeers,
        relayCount: Math.floor(Math.random() * 5) + 1,
        averageLatency,
        networkHealth,
        peers: mockPeers,
      };
      
      setNetworkInfo(mockNetworkInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network info');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch network info on mount and at regular intervals
  useEffect(() => {
    fetchNetworkInfo();
    
    // Set up interval to refresh network info
    const interval = setInterval(fetchNetworkInfo, refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);
  
  // Get health status color
  const getHealthStatusColor = (health: 'excellent' | 'good' | 'fair' | 'poor') => {
    switch (health) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'fair':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
    }
  };
  
  // Format time duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Render loading state
  if (isLoading && !networkInfo) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">P2P Network Status</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading network status...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !networkInfo) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">P2P Network Status</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchNetworkInfo}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!networkInfo) {
    return null;
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">P2P Network Status</h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchNetworkInfo}
          title="Refresh network status"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {/* Connection status */}
        <div className="mb-6 p-4 bg-twilight-darker rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <span className="ml-2 font-medium">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting' : 
                 'Disconnected'}
              </span>
            </div>
            <div className={`font-medium ${getHealthStatusColor(networkInfo.networkHealth)}`}>
              {networkInfo.networkHealth.charAt(0).toUpperCase() + networkInfo.networkHealth.slice(1)} Health
            </div>
          </div>
        </div>
        
        {/* Network stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Connected Peers</div>
            <div className="text-lg font-medium">{networkInfo.connectedPeers} / {networkInfo.peerCount}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Inbound / Outbound</div>
            <div className="text-lg font-medium">{networkInfo.inboundPeers} / {networkInfo.outboundPeers}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Relays</div>
            <div className="text-lg font-medium">{networkInfo.relayCount}</div>
          </div>
          
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Avg. Latency</div>
            <div className="text-lg font-medium">{networkInfo.averageLatency.toFixed(0)} ms</div>
          </div>
        </div>
        
        {/* Peer list */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Connected Peers</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Direction</th>
                  <th>Latency</th>
                  <th>Connected</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {networkInfo.peers.filter(peer => peer.connected).slice(0, 5).map((peer) => (
                  <tr key={peer.id}>
                    <td>{peer.address}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        peer.direction === 'inbound' ? 'bg-blue-500 bg-opacity-20 text-blue-500' : 'bg-purple-500 bg-opacity-20 text-purple-500'
                      }`}>
                        {peer.direction}
                      </span>
                    </td>
                    <td>{peer.latency} ms</td>
                    <td>{formatDuration(Date.now() - peer.connectedSince)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedPeer(peer);
                          setShowPeerDetails(true);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {networkInfo.connectedPeers > 5 && (
            <div className="text-center mt-2">
              <button className="btn btn-sm btn-secondary">
                View All ({networkInfo.connectedPeers}) Peers
              </button>
            </div>
          )}
        </div>
        
        {/* Network visualization placeholder */}
        <div className="p-4 bg-twilight-darker rounded-lg h-48 flex items-center justify-center">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-400">Network visualization coming soon</p>
          </div>
        </div>
      </div>
      
      {/* Peer details modal */}
      {showPeerDetails && selectedPeer && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="card w-96">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium">Peer Details</h3>
              <button
                onClick={() => setShowPeerDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-400">Peer ID</div>
                  <div className="font-medium">{selectedPeer.id}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">Address</div>
                  <div className="font-medium">{selectedPeer.address}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">Direction</div>
                  <div className="font-medium">{selectedPeer.direction}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">Latency</div>
                  <div className="font-medium">{selectedPeer.latency} ms</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">Version</div>
                  <div className="font-medium">{selectedPeer.version}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">User Agent</div>
                  <div className="font-medium">{selectedPeer.userAgent}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">Connected Since</div>
                  <div className="font-medium">{new Date(selectedPeer.connectedSince).toLocaleString()}</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-400">Connection Duration</div>
                  <div className="font-medium">{formatDuration(Date.now() - selectedPeer.connectedSince)}</div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPeerDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default P2PNetworkStatus;