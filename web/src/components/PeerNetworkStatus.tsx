import React, { useState, useEffect } from 'react';
import { usePeerDiscovery } from '../contexts/PeerDiscoveryContext';
import { PeerStatus, PeerType } from '../services/PeerDiscoveryService';

// Icons
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  UserIcon,
  SignalIcon,
  GlobeAltIcon,
  ServerIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

export interface PeerNetworkStatusProps {
  className?: string;
  compact?: boolean;
}

const PeerNetworkStatus: React.FC<PeerNetworkStatusProps> = ({
  className = '',
  compact = false,
}) => {
  // Contexts
  const {
    peers,
    connectedPeers,
    isDiscovering,
    startDiscovery,
    stopDiscovery,
    connectToPeer,
    disconnectFromPeer,
  } = usePeerDiscovery();
  
  // State
  const [manualPeerId, setManualPeerId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // Handle start discovery
  const handleStartDiscovery = async () => {
    await startDiscovery();
  };
  
  // Handle stop discovery
  const handleStopDiscovery = () => {
    stopDiscovery();
  };
  
  // Handle connect to peer
  const handleConnectToPeer = async () => {
    if (!manualPeerId) return;
    
    setIsConnecting(true);
    try {
      await connectToPeer(manualPeerId, PeerType.MANUAL);
      setManualPeerId('');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle disconnect from peer
  const handleDisconnectFromPeer = (peerId: string) => {
    disconnectFromPeer(peerId);
  };
  
  // Get peer type icon
  const getPeerTypeIcon = (type: PeerType) => {
    switch (type) {
      case PeerType.BOOTSTRAP:
        return <ServerIcon className="w-4 h-4 text-blue-400" />;
      case PeerType.SIGNALING:
        return <SignalIcon className="w-4 h-4 text-purple-400" />;
      case PeerType.DHT:
        return <GlobeAltIcon className="w-4 h-4 text-green-400" />;
      case PeerType.LOCAL:
        return <ComputerDesktopIcon className="w-4 h-4 text-yellow-400" />;
      case PeerType.MANUAL:
        return <UserIcon className="w-4 h-4 text-red-400" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-400" />;
    }
  };
  
  // Get peer status icon
  const getPeerStatusIcon = (status: PeerStatus) => {
    switch (status) {
      case PeerStatus.CONNECTED:
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case PeerStatus.CONNECTING:
        return <ArrowPathIcon className="w-4 h-4 text-blue-400 animate-spin" />;
      case PeerStatus.DISCONNECTED:
        return <XCircleIcon className="w-4 h-4 text-gray-400" />;
      case PeerStatus.FAILED:
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
      default:
        return <XCircleIcon className="w-4 h-4 text-gray-400" />;
    }
  };
  
  // Format peer ID
  const formatPeerId = (peerId: string): string => {
    if (!peerId) return '';
    if (peerId.length <= 12) return peerId;
    return `${peerId.substring(0, 6)}...${peerId.substring(peerId.length - 6)}`;
  };
  
  // Render compact view
  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center mr-2">
          <UserGroupIcon className="w-5 h-5 mr-1 text-gray-400" />
          <span className="text-sm">{connectedPeers.length}</span>
        </div>
        
        <button
          onClick={isDiscovering ? handleStopDiscovery : handleStartDiscovery}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          title={isDiscovering ? 'Stop Discovery' : 'Start Discovery'}
        >
          {isDiscovering ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowPathIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }
  
  // Render full view
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium flex items-center">
          <UserGroupIcon className="w-5 h-5 mr-2" />
          Peer Network
        </h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {connectedPeers.length} connected
          </span>
          
          <button
            onClick={isDiscovering ? handleStopDiscovery : handleStartDiscovery}
            className={`btn btn-sm ${
              isDiscovering ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isDiscovering ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
                Stop
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Start
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Manual Connection */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <h3 className="text-md font-medium">Connect to Peer</h3>
          </div>
          
          <div className="flex items-center">
            <input
              type="text"
              value={manualPeerId}
              onChange={(e) => setManualPeerId(e.target.value)}
              placeholder="Peer ID"
              className="form-input flex-1 mr-2"
            />
            
            <button
              onClick={handleConnectToPeer}
              disabled={!manualPeerId || isConnecting}
              className="btn btn-primary"
            >
              {isConnecting ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Connect
            </button>
          </div>
        </div>
        
        {/* Connected Peers */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Peers</h3>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-twilight-neon-blue hover:underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {peers.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No peers found
            </div>
          ) : (
            <div className="overflow-y-auto max-h-64">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-2">Peer ID</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Status</th>
                    {showDetails && <th className="pb-2">Last Seen</th>}
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {peers.map((peer) => (
                    <tr key={peer.id} className="border-t border-twilight-dark">
                      <td className="py-2 font-mono text-sm">
                        {formatPeerId(peer.id)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center">
                          {getPeerTypeIcon(peer.type)}
                          {showDetails && (
                            <span className="ml-1 text-sm capitalize">
                              {peer.type.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center">
                          {getPeerStatusIcon(peer.status)}
                          {showDetails && (
                            <span className="ml-1 text-sm capitalize">
                              {peer.status.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      {showDetails && (
                        <td className="py-2 text-sm">
                          {peer.lastSeen
                            ? new Date(peer.lastSeen).toLocaleTimeString()
                            : 'N/A'}
                        </td>
                      )}
                      <td className="py-2 text-right">
                        {peer.status === PeerStatus.CONNECTED && (
                          <button
                            onClick={() => handleDisconnectFromPeer(peer.id)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Disconnect
                          </button>
                        )}
                        {peer.status === PeerStatus.DISCONNECTED && (
                          <button
                            onClick={() => connectToPeer(peer.id, peer.type)}
                            className="text-sm text-green-400 hover:text-green-300"
                          >
                            Connect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerNetworkStatus;