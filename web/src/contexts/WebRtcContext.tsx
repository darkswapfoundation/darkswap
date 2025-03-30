import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WebRtcSignalingClient, SignalingClientEvent } from '../utils/WebRtcSignalingClient';
import { WebRtcManager, WebRtcConnection, WebRtcConnectionEvent } from '../utils/WebRtcManager';
import { WebRtcIceServers } from '../utils/WebRtcIceServers';
import { WebRtcBandwidthManager } from '../utils/WebRtcBandwidthManager';

// WebRTC context interface
interface WebRtcContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  
  // Peer information
  localPeerId: string | null;
  connectedPeers: string[];
  
  // Connection management
  connect: (peerId: string) => Promise<WebRtcConnection>;
  disconnect: (peerId: string) => void;
  disconnectAll: () => void;
  
  // Data transfer
  sendString: (peerId: string, data: string) => void;
  sendBinary: (peerId: string, data: ArrayBuffer | Blob | Uint8Array) => void;
  
  // Event handlers
  onMessage: (callback: (peerId: string, data: any) => void) => void;
  offMessage: (callback: (peerId: string, data: any) => void) => void;
  
  // Raw access to the underlying objects
  signalingClient: WebRtcSignalingClient | null;
  webRtcManager: WebRtcManager | null;
  getConnection: (peerId: string) => WebRtcConnection | undefined;
}

// Create the context
const WebRtcContext = createContext<WebRtcContextType | null>(null);

// WebRTC provider props
interface WebRtcProviderProps {
  children: React.ReactNode;
  signalingServerUrl: string;
  applyBandwidthSettings?: boolean;
  localPeerId?: string;
  autoConnect?: boolean;
  useCustomIceServers?: boolean;
}

// WebRTC provider
export const WebRtcProvider: React.FC<WebRtcProviderProps> = ({
  children,
  signalingServerUrl,
  localPeerId: providedPeerId,
  autoConnect = true,
  useCustomIceServers = true,
  applyBandwidthSettings = true,
}) => {
  // Get ICE servers and bandwidth settings
  const iceServers = useCustomIceServers ? WebRtcIceServers.getIceServers() : WebRtcIceServers.getDefaultIceServers();
  const bandwidthSettings = applyBandwidthSettings ? WebRtcBandwidthManager.getBandwidthSettings() : undefined;
  // State
  const [signalingClient, setSignalingClient] = useState<WebRtcSignalingClient | null>(null);
  const [webRtcManager, setWebRtcManager] = useState<WebRtcManager | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [messageCallbacks] = useState<Set<(peerId: string, data: any) => void>>(new Set());

  // Initialize the WebRTC manager
  useEffect(() => {
    const init = async () => {
      try {
        // Generate a random peer ID if not provided
        const peerId = providedPeerId || `peer-${Math.random().toString(36).substring(2, 10)}`;
        setLocalPeerId(peerId);
        
        // Create the signaling client
        const client = new WebRtcSignalingClient(peerId, signalingServerUrl);
        setSignalingClient(client);
        
        // Connect to the signaling server if autoConnect is true
        if (autoConnect) {
          setIsConnecting(true);
          await client.connect();
          setIsConnecting(false);
          setIsConnected(true);
        }
        
        // Create the WebRTC manager
        const manager = new WebRtcManager(client, { iceServers });
        setWebRtcManager(manager);
        
        // Set up event handlers
        client.on(SignalingClientEvent.Connected, () => {
          setIsConnected(true);
          setIsConnecting(false);
        });
        
        client.on(SignalingClientEvent.Disconnected, () => {
          setIsConnected(false);
        });
        
        client.on(SignalingClientEvent.Error, (err) => {
          setError(new Error(err));
        });
        
        // Clean up on unmount
        // Apply bandwidth settings to all connections
        if (applyBandwidthSettings && bandwidthSettings) {
          manager.getConnections().forEach((connection) => {
            WebRtcBandwidthManager.applyBandwidthConstraints(connection.getPeerConnection(), bandwidthSettings);
          });
        }
    
        return () => {
          client.disconnect();
          manager.closeAllConnections();
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsConnecting(false);
      }
    };
    
    init();
  }, [signalingServerUrl, providedPeerId, autoConnect, iceServers]);
  
  // Set up message handling
  useEffect(() => {
    if (!webRtcManager) return;
    
    const handleMessage = (peerId: string, label: string, data: any) => {
      messageCallbacks.forEach((callback) => {
        callback(peerId, data);
      });
    };
    
    const handleConnectionEvent = (connection: WebRtcConnection) => {
      connection.on(WebRtcConnectionEvent.DataChannelMessage, (label: string, data: any) => {
        handleMessage(connection.getPeerId(), label, data);
      });
      
      connection.on(WebRtcConnectionEvent.Connected, () => {
        setConnectedPeers((prev) => {
          if (!prev.includes(connection.getPeerId())) {
            return [...prev, connection.getPeerId()];
          }
          return prev;
        });
      });
      
      connection.on(WebRtcConnectionEvent.Disconnected, () => {
        setConnectedPeers((prev) => prev.filter((id) => id !== connection.getPeerId()));
      });
    };
    
    // Set up event handlers for existing connections
    webRtcManager.getConnections().forEach((connection) => {
      handleConnectionEvent(connection);
    });
    
    // Set up event handler for new connections
    const originalCreateConnection = webRtcManager.createConnection.bind(webRtcManager);
    webRtcManager.createConnection = (peerId: string) => {
      const connection = originalCreateConnection(peerId);
      handleConnectionEvent(connection);
      return connection;
    };
  }, [webRtcManager, messageCallbacks]);
  
  // Connect to a peer
  const connect = useCallback(
    async (peerId: string) => {
      if (!webRtcManager) {
        throw new Error('WebRTC manager not initialized');
      }
      
      return webRtcManager.connect(peerId);
    },
    [webRtcManager]
  );
  
  // Disconnect from a peer
  const disconnect = useCallback(
    (peerId: string) => {
      if (!webRtcManager) return;
      webRtcManager.closeConnection(peerId);
    },
    [webRtcManager]
  );
  
  // Disconnect from all peers
  const disconnectAll = useCallback(() => {
    if (!webRtcManager) return;
    webRtcManager.closeAllConnections();
  }, [webRtcManager]);
  
  // Send string data to a peer
  const sendString = useCallback(
    (peerId: string, data: string) => {
      if (!webRtcManager) return;
      const connection = webRtcManager.getConnection(peerId);
      if (!connection) return;
      connection.sendString('data', data);
    },
    [webRtcManager]
  );
  
  // Send binary data to a peer
  const sendBinary = useCallback(
    (peerId: string, data: ArrayBuffer | Blob | Uint8Array) => {
      if (!webRtcManager) return;
      const connection = webRtcManager.getConnection(peerId);
      if (!connection) return;
      connection.sendBinary('data', data);
    },
    [webRtcManager]
  );
  
  // Register a message callback
  const onMessage = useCallback(
    (callback: (peerId: string, data: any) => void) => {
      messageCallbacks.add(callback);
    },
    [messageCallbacks]
  );
  
  // Unregister a message callback
  const offMessage = useCallback(
    (callback: (peerId: string, data: any) => void) => {
      messageCallbacks.delete(callback);
    },
    [messageCallbacks]
  );
  
  // Get a connection
  const getConnection = useCallback(
    (peerId: string) => {
      if (!webRtcManager) return undefined;
      return webRtcManager.getConnection(peerId);
    },
    [webRtcManager]
  );
  
  // Context value
  const value: WebRtcContextType = {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    connect,
    disconnect,
    disconnectAll,
    sendString,
    sendBinary,
    onMessage,
    offMessage,
    signalingClient,
    webRtcManager,
    getConnection,
  };
  
  return <WebRtcContext.Provider value={value}>{children}</WebRtcContext.Provider>;
};

// Hook to use the WebRTC context
export const useWebRtc = () => {
  const context = useContext(WebRtcContext);
  if (!context) {
    throw new Error('useWebRtc must be used within a WebRtcProvider');
  }
  return context;
};