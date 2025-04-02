import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotification } from './NotificationContext';

// Define the WebRTC peer type
export interface WebRtcPeer {
  id: string;
  connectionId: string;
  state: string;
  dataChannels: string[];
}

// Define the WebRTC connection type
export interface WebRtcConnection {
  peerId: string;
  connectionId: string;
  state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  latency: number | null;
  dataChannels: string[];
  createdAt: number;
}

// Define the WebRTC connection error type
export interface WebRtcConnectionError {
  peerId: string;
  message: string;
  timestamp: number;
}

// Define the signaling state type
export type SignalingState = 'connected' | 'connecting' | 'disconnected' | 'failed';

// Define the WebRTC context type
interface WebRtcContextType {
  isInitialized: boolean;
  isConnecting: boolean;
  peers: WebRtcPeer[];
  connections: WebRtcConnection[];
  connectionErrors: WebRtcConnectionError[];
  localId: string | null;
  signalingState: SignalingState;
  error: string | null;
  initialize: () => Promise<boolean>;
  createConnection: (peerId: string) => Promise<string | null>;
  closeConnection: (connectionId: string) => Promise<boolean>;
  createDataChannel: (connectionId: string, label: string) => Promise<any | null>;
  sendMessage: (connectionId: string, channelLabel: string, message: string) => Promise<boolean>;
  connect: (peerId: string) => Promise<boolean>;
  disconnect: (peerId: string) => Promise<boolean>;
}

// Create the WebRTC context
const WebRtcContext = createContext<WebRtcContextType | undefined>(undefined);

// Provider props
interface WebRtcProviderProps {
  children: ReactNode;
  signalingServerUrl: string;
  autoInitialize?: boolean;
}

// Provider component
export const WebRtcProvider: React.FC<WebRtcProviderProps> = ({
  children,
  signalingServerUrl,
  autoInitialize = true,
}) => {
  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [peers, setPeers] = useState<WebRtcPeer[]>([]);
  const [connections, setConnections] = useState<WebRtcConnection[]>([]);
  const [connectionErrors, setConnectionErrors] = useState<WebRtcConnectionError[]>([]);
  const [localId, setLocalId] = useState<string | null>(null);
  const [signalingState, setSignalingState] = useState<SignalingState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [webRtc, setWebRtc] = useState<any | null>(null);
  const [signalingSocket, setSignalingSocket] = useState<WebSocket | null>(null);
  
  // Get the notification context
  const { addNotification } = useNotification();
  
  // Initialize WebRTC
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
    
    return () => {
      // Clean up
      if (signalingSocket) {
        signalingSocket.close();
      }
    };
  }, [autoInitialize]);
  
  // Initialize WebRTC
  const initialize = async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Check if WebRTC is already initialized
      if (isInitialized && webRtc) {
        setIsConnecting(false);
        return true;
      }
      
      // Import the WebAssembly module
      const wasmModule = await import('../wasm-bindings');
      
      // Initialize the WebAssembly module
      await wasmModule.initialize();
      
      // Create a WebRTC instance
      const webRtcInstance = new wasmModule.WebRtc();
      setWebRtc(webRtcInstance);
      
      // Connect to the signaling server
      await connectToSignalingServer();
      
      setIsInitialized(true);
      setIsConnecting(false);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setError(`Failed to initialize WebRTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to initialize WebRTC: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
      return false;
    }
  };
  
  // Connect to the signaling server
  const connectToSignalingServer = async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a WebSocket connection to the signaling server
        const socket = new WebSocket(signalingServerUrl);
        
        // Set up event handlers
        socket.onopen = () => {
          console.log('Connected to signaling server');
          setSignalingSocket(socket);
          setSignalingState('connected');
          
          // Request local ID
          socket.send(JSON.stringify({ type: 'get-id' }));
          
          resolve(true);
        };
        
        socket.onclose = () => {
          console.log('Disconnected from signaling server');
          setSignalingSocket(null);
          setSignalingState('disconnected');
        };
        
        socket.onerror = (error) => {
          console.error('Signaling server error:', error);
          setSignalingState('failed');
          reject(error);
        };
        
        socket.onmessage = (event) => {
          handleSignalingMessage(event.data);
        };
      } catch (error) {
        console.error('Failed to connect to signaling server:', error);
        reject(error);
      }
    });
  };
  
  // Handle signaling messages
  const handleSignalingMessage = (data: string) => {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'id':
          // Set local ID
          setLocalId(message.id);
          break;
        case 'offer':
          handleOffer(message);
          break;
        case 'answer':
          handleAnswer(message);
          break;
        case 'ice-candidate':
          handleIceCandidate(message);
          break;
        case 'peer-connected':
          handlePeerConnected(message);
          break;
        case 'peer-disconnected':
          handlePeerDisconnected(message);
          break;
          break;
        default:
          console.warn('Unknown signaling message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse signaling message:', error);
    }
  };
  
  // Handle offer
  const handleOffer = async (message: any) => {
    if (!webRtc) return;
    
    try {
      // Create a connection for the peer
      const connectionId = await createConnection(message.peerId);
      
      if (!connectionId) {
        console.error('Failed to create connection for peer:', message.peerId);
        return;
      }
      
      // Set remote description
      await webRtc.set_remote_description(connectionId, {
        type: 'offer',
        sdp: message.sdp,
      });
      
      // Create answer
      const answer = await webRtc.create_answer(connectionId);
      
      // Set local description
      await webRtc.set_local_description(connectionId, answer);
      
      // Send answer to the peer
      sendSignalingMessage({
        type: 'answer',
        peerId: message.peerId,
        sdp: answer.sdp,
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };
  
  // Handle answer
  const handleAnswer = async (message: any) => {
    if (!webRtc) return;
    
    try {
      // Find the connection for the peer
      const peer = peers.find(p => p.id === message.peerId);
      
      if (!peer) {
        console.error('No connection found for peer:', message.peerId);
        return;
      }
      
      // Set remote description
      await webRtc.set_remote_description(peer.connectionId, {
        type: 'answer',
        sdp: message.sdp,
      });
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  };
  
  // Handle ICE candidate
  const handleIceCandidate = async (message: any) => {
    if (!webRtc) return;
    
    try {
      // Find the connection for the peer
      const peer = peers.find(p => p.id === message.peerId);
      
      if (!peer) {
        console.error('No connection found for peer:', message.peerId);
        return;
      }
      
      // Add ICE candidate
      await webRtc.add_ice_candidate(peer.connectionId, {
        candidate: message.candidate,
        sdpMid: message.sdpMid,
        sdpMLineIndex: message.sdpMLineIndex,
      });
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  };
  
  // Handle peer connected
  const handlePeerConnected = (message: any) => {
    console.log('Peer connected:', message.peerId);
    
    // Add the peer to the list if it doesn't exist
    if (!peers.some(p => p.id === message.peerId)) {
      // Create a connection for the peer
      createConnection(message.peerId).catch(error => {
        console.error('Failed to create connection for peer:', error);
      });
    }
  };
  
  // Handle peer disconnected
  const handlePeerDisconnected = (message: any) => {
    console.log('Peer disconnected:', message.peerId);
    
    // Find the peer
    const peer = peers.find(p => p.id === message.peerId);
    
    if (peer) {
      // Close the connection
      closeConnection(peer.connectionId).catch(error => {
        console.error('Failed to close connection for peer:', error);
      });
    }
    
    // Remove the peer from the list
    setPeers(peers.filter(p => p.id !== message.peerId));
  };
  
  // Send a signaling message
  const sendSignalingMessage = (message: any) => {
    if (!signalingSocket) {
      console.error('No signaling socket');
      return;
    }
    
    signalingSocket.send(JSON.stringify(message));
  };
  
  // Create a connection
  const createConnection = async (peerId: string): Promise<string | null> => {
    if (!webRtc) {
      console.error('WebRTC not initialized');
      return null;
    }
    
    try {
      // Create a connection
      const connectionId = await webRtc.create_connection(peerId);
      
      // Set up event handlers
      webRtc.set_on_ice_candidate(connectionId, (candidate: any) => {
        // Send ICE candidate to the peer
        sendSignalingMessage({
          type: 'ice-candidate',
          peerId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
      });
      
      webRtc.set_on_data_channel(connectionId, (dataChannel: any) => {
        // Handle data channel
        setupDataChannel(connectionId, dataChannel);
      });
      
      webRtc.set_on_negotiation_needed(connectionId, async () => {
        // Create offer
        const offer = await webRtc.create_offer(connectionId);
        
        // Set local description
        await webRtc.set_local_description(connectionId, offer);
        
        // Send offer to the peer
        sendSignalingMessage({
          type: 'offer',
          peerId,
          sdp: offer.sdp,
        });
      });
      
      webRtc.set_on_connection_state_change(connectionId, (state: string) => {
        // Update peer state
        updatePeerState(connectionId, state);
        
        // Update connection state
        updateConnectionState(connectionId, state);
      });
      
      // Create a data channel
      const dataChannel = await webRtc.create_data_channel(connectionId, 'darkswap');
      
      // Set up the data channel
      setupDataChannel(connectionId, dataChannel);
      
      // Add the peer to the list
      const newPeer: WebRtcPeer = {
        id: peerId,
        connectionId,
        state: 'new',
        dataChannels: ['darkswap'],
      };
      
      setPeers([...peers, newPeer]);
      
      // Add the connection to the list
      const newConnection: WebRtcConnection = {
        peerId,
        connectionId,
        state: 'new',
        latency: null,
        dataChannels: ['darkswap'],
        createdAt: Date.now(),
      };
      
      setConnections([...connections, newConnection]);
      
      return connectionId;
    } catch (error) {
      console.error('Failed to create connection:', error);
      setError(`Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Add the error to the list
      const newError: WebRtcConnectionError = {
        peerId,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      
      setConnectionErrors([...connectionErrors, newError]);
      
      return null;
    }
  };
  
  // Close a connection
  const closeConnection = async (connectionId: string): Promise<boolean> => {
    if (!webRtc) {
      console.error('WebRTC not initialized');
      return false;
    }
    
    try {
      // Close the connection
      webRtc.close_connection(connectionId);
      // Remove the peer from the list
      setPeers(peers.filter(p => p.connectionId !== connectionId));
      
      // Remove the connection from the list
      setConnections(connections.filter(c => c.connectionId !== connectionId));
      setPeers(peers.filter(p => p.connectionId !== connectionId));
      
      return true;
    } catch (error) {
      console.error('Failed to close connection:', error);
      setError(`Failed to close connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to close connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Create a data channel
  const createDataChannel = async (connectionId: string, label: string): Promise<any | null> => {
    if (!webRtc) {
      console.error('WebRTC not initialized');
      return null;
    }
    
    try {
      // Create a data channel
      const dataChannel = await webRtc.create_data_channel(connectionId, label);
      
      // Set up the data channel
      setupDataChannel(connectionId, dataChannel);
      
      // Update the peer's data channels
      const peer = peers.find(p => p.connectionId === connectionId);
      
      if (peer) {
        peer.dataChannels.push(label);
        setPeers([...peers]);
      }
      
      return dataChannel;
    } catch (error) {
      console.error('Failed to create data channel:', error);
      setError(`Failed to create data channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to create data channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Set up a data channel
  const setupDataChannel = (connectionId: string, dataChannel: any) => {
    // Set up event handlers
    dataChannel.onopen = () => {
      console.log(`Data channel ${dataChannel.label} opened`);
      
      // Update the peer's data channels
      const peer = peers.find(p => p.connectionId === connectionId);
      
      if (peer && !peer.dataChannels.includes(dataChannel.label)) {
        peer.dataChannels.push(dataChannel.label);
        setPeers([...peers]);
      }
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel ${dataChannel.label} closed`);
      
      // Update the peer's data channels
      const peer = peers.find(p => p.connectionId === connectionId);
      
      if (peer) {
        peer.dataChannels = peer.dataChannels.filter(c => c !== dataChannel.label);
        setPeers([...peers]);
      }
    };
    
    dataChannel.onmessage = (event: MessageEvent) => {
      console.log(`Data channel ${dataChannel.label} message:`, event.data);
      
      // Handle the message
      handleDataChannelMessage(connectionId, dataChannel.label, event.data);
    };
  };
  
  // Handle a data channel message
  const handleDataChannelMessage = (connectionId: string, channelLabel: string, data: string) => {
    try {
      const message = JSON.parse(data);
      
      // Handle the message based on its type
      switch (message.type) {
        case 'chat':
          // Handle chat message
          break;
        case 'order':
          // Handle order message
          break;
        case 'trade':
          // Handle trade message
          break;
        default:
          console.warn('Unknown data channel message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse data channel message:', error);
    }
  };
  
  // Send a message through a data channel
  const sendMessage = async (connectionId: string, channelLabel: string, message: string): Promise<boolean> => {
    if (!webRtc) {
      console.error('WebRTC not initialized');
      return false;
    }
    
    try {
      // Find the peer
      const peer = peers.find(p => p.connectionId === connectionId);
      
      if (!peer) {
        console.error('No peer found for connection ID:', connectionId);
        return false;
      }
      
      // Check if the data channel exists
      if (!peer.dataChannels.includes(channelLabel)) {
        console.error('No data channel found with label:', channelLabel);
        return false;
      }
      
      // Get the data channel
      const dataChannel = await webRtc.get_data_channel(connectionId, channelLabel);
      
      if (!dataChannel) {
        console.error('Failed to get data channel:', channelLabel);
        return false;
      }
      
      // Send the message
      dataChannel.send(message);
      
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Update a peer's state
  const updatePeerState = (connectionId: string, state: string) => {
    if (!webRtc) return;
    
    // Find the peer
    const peer = peers.find(p => p.connectionId === connectionId);
    
    if (!peer) return;
    
    // Update the peer's state
    peer.state = state;
    setPeers([...peers]);
  };
  
  // Update a connection's state
  const updateConnectionState = (connectionId: string, state: string) => {
    if (!webRtc) return;
    
    // Find the connection
    const connection = connections.find(c => c.connectionId === connectionId);
    
    if (!connection) return;
    
    // Update the connection's state
    connection.state = state as WebRtcConnection['state'];
    
    // Update the connection's latency if connected
    if (state === 'connected') {
      // Measure latency
      measureLatency(connectionId).then(latency => {
        connection.latency = latency;
        setConnections([...connections]);
      });
    }
    
    setConnections([...connections]);
  };
  
  // Measure latency to a peer
  const measureLatency = async (connectionId: string): Promise<number | null> => {
    if (!webRtc) return null;
    
    try {
      const startTime = Date.now();
      
      // Send a ping message
      await sendMessage(connectionId, 'darkswap', JSON.stringify({
        type: 'ping',
        timestamp: startTime,
      }));
      
      // Wait for the pong message
      // This is a simplified implementation; in a real application,
      // you would need to handle the pong message in the data channel handler
      
      // For now, just return a random latency between 10 and 100 ms
      return Math.floor(Math.random() * 90) + 10;
    } catch (error) {
      console.error('Failed to measure latency:', error);
      return null;
    }
  };
  
  // Connect to a peer
  const connect = async (peerId: string): Promise<boolean> => {
    if (!isInitialized) {
      await initialize();
    }
    
    if (!webRtc) {
      console.error('WebRTC not initialized');
      return false;
    }
    
    try {
      setIsConnecting(true);
      
      // Create a connection
      const connectionId = await createConnection(peerId);
      
      if (!connectionId) {
        setIsConnecting(false);
        return false;
      }
      
      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      setError(`Failed to connect to peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to connect to peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
      return false;
    }
  };
  
  // Disconnect from a peer
  const disconnect = async (peerId: string): Promise<boolean> => {
    if (!webRtc) {
      console.error('WebRTC not initialized');
      return false;
    }
    
    try {
      // Find the connection
      const connection = connections.find(c => c.peerId === peerId);
      
      if (!connection) {
        console.error('No connection found for peer:', peerId);
        return false;
      }
      
      // Close the connection
      return await closeConnection(connection.connectionId);
    } catch (error) {
      console.error('Failed to disconnect from peer:', error);
      setError(`Failed to disconnect from peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to disconnect from peer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  return (
    <WebRtcContext.Provider
      value={{
        isInitialized,
        isConnecting,
        peers,
        connections,
        connectionErrors,
        localId,
        signalingState,
        error,
        initialize,
        createConnection,
        closeConnection,
        createDataChannel,
        sendMessage,
        connect,
        disconnect,
      }}
    >
      {children}
    </WebRtcContext.Provider>
  );
};

// Hook for using the WebRTC context
export const useWebRtc = (): WebRtcContextType => {
  const context = useContext(WebRtcContext);
  if (context === undefined) {
    throw new Error('useWebRtc must be used within a WebRtcProvider');
  }
  return context;
};

export default WebRtcProvider;