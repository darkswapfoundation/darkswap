import React, { useState, useEffect } from 'react';
import { useWebRtc, WebRtcPeer } from '../contexts/WebRtcContext';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  GlobeAltIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

export interface WebRtcStatusProps {
  className?: string;
  compact?: boolean;
}

const WebRtcStatus: React.FC<WebRtcStatusProps> = ({
  className = '',
  compact = false,
}) => {
  // Contexts
  const {
    isInitialized,
    isConnecting,
    peers,
    error,
    initialize,
    createConnection,
    closeConnection,
  } = useWebRtc();
  const { addNotification } = useNotification();
  
  // State
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [newPeerId, setNewPeerId] = useState<string>('');
  
  // Handle initialization
  const handleInitialize = async () => {
    try {
      const result = await initialize();
      if (result) {
        addNotification('success', 'WebRTC initialized');
      } else {
        addNotification('error', 'Failed to initialize WebRTC');
      }
    } catch (error) {
      addNotification('error', `Error initializing WebRTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle connection
  const handleConnect = async () => {
    if (!newPeerId) {
      addNotification('error', 'Please enter a peer ID');
      return;
    }
    
    try {
      const connectionId = await createConnection(newPeerId);
      if (connectionId) {
        addNotification('success', `Connected to peer: ${newPeerId}`);
        setNewPeerId('');
      } else {
        addNotification('error', 'Failed to connect to peer');
      }
    } catch (error) {
      addNotification('error', `Error connecting to peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle disconnection
  const handleDisconnect = async (connectionId: string) => {
    try {
      const result = await closeConnection(connectionId);
      if (result) {
        addNotification('info', 'Disconnected from peer');
      } else {
        addNotification('error', 'Failed to disconnect from peer');
      }
    } catch (error) {
      addNotification('error', `Error disconnecting from peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Render compact view
  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center">
          <GlobeAltIcon className={`w-5 h-5 mr-1 ${isInitialized ? 'text-green-400' : 'text-gray-400'}`} />
          {isInitialized ? (
            <span className="text-sm text-green-400">{peers.length} peers</span>
          ) : (
            <span className="text-sm text-gray-400">Not Connected</span>
          )}
        </div>
        
        {isInitialized ? (
          <button
            onClick={() => handleInitialize()}
            className="ml-2 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            title="Refresh WebRTC"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        ) : (
          <button
            onClick={handleInitialize}
            className="ml-2 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            title="Initialize WebRTC"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  }
  
  // Render full view
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium flex items-center">
          <GlobeAltIcon className="w-5 h-5 mr-2" />
          WebRTC Status
        </h2>
        
        <div className="flex items-center space-x-2">
          {isInitialized ? (
            <span className="text-sm bg-green-600 text-white px-2 py-0.5 rounded-full">Connected</span>
          ) : (
            <span className="text-sm bg-gray-600 text-white px-2 py-0.5 rounded-full">Disconnected</span>
          )}
        </div>
      </div>
      
      <div className="card-body">
        {/* Initialization Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Initialization Status:</span>
            <span className={isInitialized ? 'text-green-400' : 'text-gray-400'}>
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </span>
          </div>
          
          {!isInitialized && (
            <button
              onClick={handleInitialize}
              className="btn btn-primary w-full"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                'Initialize WebRTC'
              )}
            </button>
          )}
        </div>
        
        {/* Peer Connection */}
        {isInitialized && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Connect to Peer:</span>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPeerId}
                onChange={(e) => setNewPeerId(e.target.value)}
                placeholder="Enter peer ID"
                className="form-input flex-1"
              />
              <button
                onClick={handleConnect}
                className="btn btn-primary"
                disabled={!newPeerId}
              >
                <UserPlusIcon className="w-5 h-5 mr-1" />
                Connect
              </button>
            </div>
          </div>
        )}
        
        {/* Connected Peers */}
        {isInitialized && peers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Connected Peers:</span>
              <span className="text-white">{peers.length}</span>
            </div>
            
            <div className="space-y-2">
              {peers.map((peer) => (
                <div key={peer.connectionId} className="bg-twilight-darker p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-2 text-gray-400" />
                      <span className="text-white">{peer.id}</span>
                    </div>
                    <button
                      onClick={() => handleDisconnect(peer.connectionId)}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                      title="Disconnect"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Connection ID:</span>
                      <div className="text-white truncate">{peer.connectionId}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">State:</span>
                      <div className="text-white">{peer.state}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Data Channels:</span>
                      <div className="text-white">{peer.dataChannels.join(', ') || 'None'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-ui-error bg-opacity-10 border border-ui-error border-opacity-50 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 text-ui-error mr-2" />
              <span className="text-ui-error text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRtcStatus;