import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PeerDiscoveryService, {
  PeerInfo,
  PeerType,
  PeerStatus,
  PeerDiscoveryEventType,
  PeerDiscoveryEvent,
} from '../services/PeerDiscoveryService';
import { useNotification } from './NotificationContext';

// Context type
interface PeerDiscoveryContextType {
  service: PeerDiscoveryService;
  peers: PeerInfo[];
  connectedPeers: PeerInfo[];
  isDiscovering: boolean;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => void;
  connectToPeer: (peerId: string, type?: PeerType) => Promise<boolean>;
  disconnectFromPeer: (peerId: string) => void;
  sendMessageToPeer: (peerId: string, message: any) => boolean;
  broadcastMessage: (message: any, excludePeerIds?: string[]) => number;
}

// Create context
const PeerDiscoveryContext = createContext<PeerDiscoveryContextType | undefined>(undefined);

// Provider props
interface PeerDiscoveryProviderProps {
  children: ReactNode;
  signalingServers?: string[];
  bootstrapPeers?: string[];
  enableDht?: boolean;
  enableLocalDiscovery?: boolean;
  maxPeers?: number;
  autoStart?: boolean;
}

// Provider component
export const PeerDiscoveryProvider: React.FC<PeerDiscoveryProviderProps> = ({
  children,
  signalingServers,
  bootstrapPeers,
  enableDht = true,
  enableLocalDiscovery = true,
  maxPeers = 10,
  autoStart = false,
}) => {
  // Get the peer discovery service
  const service = PeerDiscoveryService.getInstance({
    signalingServers,
    bootstrapPeers,
    enableDht,
    enableLocalDiscovery,
    maxPeers,
  });
  const { addNotification } = useNotification();
  
  // State
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<PeerInfo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  
  // Update peers
  const updatePeers = () => {
    setPeers(service.getAllPeers());
    setConnectedPeers(service.getConnectedPeers());
  };
  
  // Handle peer found
  const handlePeerFound = (event: PeerDiscoveryEvent) => {
    updatePeers();
    addNotification('info', `Peer found: ${event.data.id}`);
  };
  
  // Handle peer connected
  const handlePeerConnected = (event: PeerDiscoveryEvent) => {
    updatePeers();
    addNotification('success', `Connected to peer: ${event.data.peerId}`);
  };
  
  // Handle peer disconnected
  const handlePeerDisconnected = (event: PeerDiscoveryEvent) => {
    updatePeers();
    addNotification('info', `Disconnected from peer: ${event.data.peerId}`);
  };
  
  // Handle peer failed
  const handlePeerFailed = (event: PeerDiscoveryEvent) => {
    updatePeers();
    addNotification('error', `Failed to connect to peer: ${event.data.peerId}`);
  };
  
  // Handle discovery started
  const handleDiscoveryStarted = () => {
    setIsDiscovering(true);
    addNotification('info', 'Peer discovery started');
  };
  
  // Handle discovery stopped
  const handleDiscoveryStopped = () => {
    setIsDiscovering(false);
    addNotification('info', 'Peer discovery stopped');
  };
  
  // Handle error
  const handleError = (event: PeerDiscoveryEvent) => {
    addNotification('error', `Peer discovery error: ${event.data.message}`);
  };
  
  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    service.addEventListener(PeerDiscoveryEventType.PEER_FOUND, handlePeerFound);
    service.addEventListener(PeerDiscoveryEventType.PEER_CONNECTED, handlePeerConnected);
    service.addEventListener(PeerDiscoveryEventType.PEER_DISCONNECTED, handlePeerDisconnected);
    service.addEventListener(PeerDiscoveryEventType.PEER_FAILED, handlePeerFailed);
    service.addEventListener(PeerDiscoveryEventType.DISCOVERY_STARTED, handleDiscoveryStarted);
    service.addEventListener(PeerDiscoveryEventType.DISCOVERY_STOPPED, handleDiscoveryStopped);
    service.addEventListener(PeerDiscoveryEventType.ERROR, handleError);
    
    // Auto-start discovery if enabled
    if (autoStart) {
      startDiscovery();
    }
    
    return () => {
      // Remove event listeners
      service.removeEventListener(PeerDiscoveryEventType.PEER_FOUND, handlePeerFound);
      service.removeEventListener(PeerDiscoveryEventType.PEER_CONNECTED, handlePeerConnected);
      service.removeEventListener(PeerDiscoveryEventType.PEER_DISCONNECTED, handlePeerDisconnected);
      service.removeEventListener(PeerDiscoveryEventType.PEER_FAILED, handlePeerFailed);
      service.removeEventListener(PeerDiscoveryEventType.DISCOVERY_STARTED, handleDiscoveryStarted);
      service.removeEventListener(PeerDiscoveryEventType.DISCOVERY_STOPPED, handleDiscoveryStopped);
      service.removeEventListener(PeerDiscoveryEventType.ERROR, handleError);
      
      // Stop discovery
      service.stopDiscovery();
    };
  }, [service, autoStart]);
  
  // Start discovery
  const startDiscovery = async () => {
    try {
      await service.startDiscovery();
    } catch (error) {
      console.error('Failed to start peer discovery:', error);
      addNotification('error', `Failed to start peer discovery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Stop discovery
  const stopDiscovery = () => {
    service.stopDiscovery();
  };
  
  // Connect to peer
  const connectToPeer = async (peerId: string, type?: PeerType) => {
    try {
      return await service.connectToPeer(peerId, type);
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
      addNotification('error', `Failed to connect to peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Disconnect from peer
  const disconnectFromPeer = (peerId: string) => {
    service.disconnectFromPeer(peerId);
  };
  
  // Send message to peer
  const sendMessageToPeer = (peerId: string, message: any) => {
    return service.sendMessageToPeer(peerId, message);
  };
  
  // Broadcast message
  const broadcastMessage = (message: any, excludePeerIds: string[] = []) => {
    return service.broadcastMessage(message, excludePeerIds);
  };
  
  return (
    <PeerDiscoveryContext.Provider
      value={{
        service,
        peers,
        connectedPeers,
        isDiscovering,
        startDiscovery,
        stopDiscovery,
        connectToPeer,
        disconnectFromPeer,
        sendMessageToPeer,
        broadcastMessage,
      }}
    >
      {children}
    </PeerDiscoveryContext.Provider>
  );
};

// Hook for using the peer discovery context
export const usePeerDiscovery = (): PeerDiscoveryContextType => {
  const context = useContext(PeerDiscoveryContext);
  if (context === undefined) {
    throw new Error('usePeerDiscovery must be used within a PeerDiscoveryProvider');
  }
  return context;
};

export default PeerDiscoveryProvider;