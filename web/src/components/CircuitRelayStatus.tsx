import React, { useState } from 'react';
import { useCircuitRelay } from '../contexts/CircuitRelayContext';
import { RelayType } from '../services/CircuitRelayService';

// Icons
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

export interface CircuitRelayStatusProps {
  className?: string;
  compact?: boolean;
}

const CircuitRelayStatus: React.FC<CircuitRelayStatusProps> = ({
  className = '',
  compact = false,
}) => {
  // Contexts
  const {
    relays,
    connectedRelays,
    routes,
    activeRoutes,
    isStarted,
    startRelay,
    stopRelay,
    addRelay,
    removeRelay,
    connectToRelay,
    disconnectFromRelay,
    createRoute,
    closeRoute,
  } = useCircuitRelay();
  
  // State
  const [newRelayAddress, setNewRelayAddress] = useState<string>('');
  const [newPeerId, setNewPeerId] = useState<string>('');
  const [isAddingRelay, setIsAddingRelay] = useState<boolean>(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // Handle start relay
  const handleStartRelay = async () => {
    await startRelay();
  };
  
  // Handle stop relay
  const handleStopRelay = () => {
    stopRelay();
  };
  
  // Handle add relay
  const handleAddRelay = async () => {
    if (!newRelayAddress) return;
    
    setIsAddingRelay(true);
    try {
      const relayId = addRelay(newRelayAddress, RelayType.PUBLIC);
      await connectToRelay(relayId);
      setNewRelayAddress('');
    } finally {
      setIsAddingRelay(false);
    }
  };
  
  // Handle remove relay
  const handleRemoveRelay = (relayId: string) => {
    removeRelay(relayId);
  };
  
  // Handle create route
  const handleCreateRoute = async () => {
    if (!newPeerId) return;
    
    setIsCreatingRoute(true);
    try {
      await createRoute(newPeerId);
      setNewPeerId('');
    } finally {
      setIsCreatingRoute(false);
    }
  };
  
  // Handle close route
  const handleCloseRoute = (routeId: string) => {
    closeRoute(routeId);
  };
  
  // Format relay address
  const formatRelayAddress = (address: string): string => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };
  
  // Format peer ID
  const formatPeerId = (peerId: string): string => {
    if (!peerId) return '';
    if (peerId.length <= 12) return peerId;
    return `${peerId.substring(0, 6)}...${peerId.substring(peerId.length - 6)}`;
  };
  
  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Render compact view
  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center mr-2">
          <ServerIcon className="w-5 h-5 mr-1 text-gray-400" />
          <span className="text-sm">{connectedRelays.length}</span>
        </div>
        
        <button
          onClick={isStarted ? handleStopRelay : handleStartRelay}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          title={isStarted ? 'Stop Relay' : 'Start Relay'}
        >
          {isStarted ? (
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
          <ServerIcon className="w-5 h-5 mr-2" />
          Circuit Relay
        </h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {connectedRelays.length} relays, {activeRoutes.length} routes
          </span>
          
          <button
            onClick={isStarted ? handleStopRelay : handleStartRelay}
            className={`btn btn-sm ${
              isStarted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isStarted ? (
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
        {/* Add Relay */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <h3 className="text-md font-medium">Add Relay</h3>
          </div>
          
          <div className="flex items-center">
            <input
              type="text"
              value={newRelayAddress}
              onChange={(e) => setNewRelayAddress(e.target.value)}
              placeholder="Relay Address"
              className="form-input flex-1 mr-2"
            />
            
            <button
              onClick={handleAddRelay}
              disabled={!newRelayAddress || isAddingRelay}
              className="btn btn-primary"
            >
              {isAddingRelay ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Add Relay
            </button>
          </div>
        </div>
        
        {/* Relays */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Relays</h3>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-twilight-neon-blue hover:underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {relays.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No relays configured
            </div>
          ) : (
            <div className="overflow-y-auto max-h-48">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-2">Address</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Status</th>
                    {showDetails && <th className="pb-2">Last Seen</th>}
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {relays.map((relay) => (
                    <tr key={relay.id} className="border-t border-twilight-dark">
                      <td className="py-2 font-mono text-sm">
                        {formatRelayAddress(relay.address)}
                      </td>
                      <td className="py-2">
                        <span className="text-sm capitalize">
                          {relay.type.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center">
                          {relay.isConnected ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-400 mr-1" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-gray-400 mr-1" />
                          )}
                          <span className="text-sm">
                            {relay.isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </td>
                      {showDetails && (
                        <td className="py-2 text-sm">
                          {relay.lastSeen
                            ? formatDate(relay.lastSeen)
                            : 'N/A'}
                        </td>
                      )}
                      <td className="py-2 text-right">
                        {relay.isConnected ? (
                          <button
                            onClick={() => disconnectFromRelay(relay.id)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => connectToRelay(relay.id)}
                            className="text-sm text-green-400 hover:text-green-300"
                          >
                            Connect
                          </button>
                        )}
                        {relay.type !== RelayType.BOOTSTRAP && (
                          <button
                            onClick={() => handleRemoveRelay(relay.id)}
                            className="text-sm text-red-400 hover:text-red-300 ml-2"
                          >
                            Remove
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
        
        {/* Create Route */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <h3 className="text-md font-medium">Create Route</h3>
          </div>
          
          <div className="flex items-center">
            <input
              type="text"
              value={newPeerId}
              onChange={(e) => setNewPeerId(e.target.value)}
              placeholder="Peer ID"
              className="form-input flex-1 mr-2"
            />
            
            <button
              onClick={handleCreateRoute}
              disabled={!newPeerId || isCreatingRoute || !isStarted || connectedRelays.length === 0}
              className="btn btn-primary"
            >
              {isCreatingRoute ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Create Route
            </button>
          </div>
        </div>
        
        {/* Routes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Routes</h3>
          </div>
          
          {routes.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No routes established
            </div>
          ) : (
            <div className="overflow-y-auto max-h-48">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-2">Target</th>
                    <th className="pb-2">Relay</th>
                    <th className="pb-2">Status</th>
                    {showDetails && <th className="pb-2">Established</th>}
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => {
                    const relay = relays.find((r) => r.id === route.relayId);
                    return (
                      <tr key={`${route.sourcePeerId}-${route.targetPeerId}`} className="border-t border-twilight-dark">
                        <td className="py-2 font-mono text-sm">
                          {formatPeerId(route.targetPeerId)}
                        </td>
                        <td className="py-2 text-sm">
                          {relay ? formatRelayAddress(relay.address) : route.relayId}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center">
                            {route.isActive ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-400 mr-1" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-gray-400 mr-1" />
                            )}
                            <span className="text-sm">
                              {route.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        {showDetails && (
                          <td className="py-2 text-sm">
                            {formatDate(route.establishedAt)}
                          </td>
                        )}
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleCloseRoute(`${route.sourcePeerId}-${route.targetPeerId}`)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircuitRelayStatus;