/**
 * P2P implementation for the DarkSwap TypeScript Library
 */

import { EventEmitter } from 'eventemitter3';
import { 
  ConnectionStatus, 
  EventData, 
  EventHandler, 
  EventType, 
  P2POptions, 
  Peer, 
  WebSocketMessage 
} from './types';
import { 
  DEFAULT_BOOTSTRAP_PEERS, 
  DEFAULT_MAX_PEERS, 
  DEFAULT_RECONNECT_ATTEMPTS, 
  DEFAULT_RECONNECT_INTERVAL, 
  DEFAULT_SIGNALING_URL, 
  DEFAULT_STUN_SERVERS, 
  DEFAULT_TURN_SERVERS 
} from './constants';
import { generateRandomId } from './utils';

/**
 * P2P class
 */
export class P2P extends EventEmitter {
  /** Signaling servers */
  private signalingServers: string[];
  
  /** Bootstrap peers */
  private bootstrapPeers: string[];
  
  /** Enable DHT */
  private enableDht: boolean;
  
  /** Enable local discovery */
  private enableLocalDiscovery: boolean;
  
  /** Max peers */
  private maxPeers: number;
  
  /** Peer ID */
  private peerId: string;
  
  /** Connection status */
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  
  /** WebSocket connections */
  private wsConnections: Map<string, WebSocket> = new Map();
  
  /** WebRTC connections */
  private webrtcConnections: Map<string, RTCPeerConnection> = new Map();
  
  /** Data channels */
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  
  /** Peers */
  private peers: Map<string, Peer> = new Map();
  
  /** WebSocket reconnect attempts */
  private wsReconnectAttempts: Map<string, number> = new Map();
  
  /** WebSocket reconnect timeouts */
  private wsReconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Create a new P2P instance
   * @param options P2P options
   */
  constructor(options: P2POptions = {}) {
    super();
    
    this.signalingServers = options.signalingServers || [DEFAULT_SIGNALING_URL];
    this.bootstrapPeers = options.bootstrapPeers || DEFAULT_BOOTSTRAP_PEERS;
    this.enableDht = options.enableDht !== undefined ? options.enableDht : true;
    this.enableLocalDiscovery = options.enableLocalDiscovery !== undefined ? options.enableLocalDiscovery : true;
    this.maxPeers = options.maxPeers || DEFAULT_MAX_PEERS;
    this.peerId = generateRandomId();
    
    // Auto start if specified
    if (options.autoStart) {
      this.start().catch((error) => {
        this.emit(EventType.P2P_ERROR, { error });
      });
    }
  }
  
  /**
   * Start the P2P network
   * @returns Promise that resolves when started
   */
  public async start(): Promise<void> {
    // Check if already started
    if (this.status !== ConnectionStatus.DISCONNECTED) {
      return;
    }
    
    try {
      this.setStatus(ConnectionStatus.CONNECTING);
      
      // Connect to signaling servers
      await this.connectToSignalingServers();
      
      // Connect to bootstrap peers
      await this.connectToBootstrapPeers();
      
      // Start local discovery if enabled
      if (this.enableLocalDiscovery) {
        await this.startLocalDiscovery();
      }
      
      // Start DHT if enabled
      if (this.enableDht) {
        await this.startDht();
      }
      
      this.setStatus(ConnectionStatus.CONNECTED);
    } catch (error) {
      this.setStatus(ConnectionStatus.ERROR);
      throw error;
    }
  }
  
  /**
   * Stop the P2P network
   */
  public stop(): void {
    // Close all WebSocket connections
    for (const [url, ws] of this.wsConnections.entries()) {
      ws.close();
      this.wsConnections.delete(url);
      
      // Clear reconnect timeout
      const timeout = this.wsReconnectTimeouts.get(url);
      if (timeout) {
        clearTimeout(timeout);
        this.wsReconnectTimeouts.delete(url);
      }
    }
    
    // Close all WebRTC connections
    for (const [peerId, connection] of this.webrtcConnections.entries()) {
      connection.close();
      this.webrtcConnections.delete(peerId);
    }
    
    // Clear peers
    this.peers.clear();
    
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }
  
  /**
   * Connect to signaling servers
   * @returns Promise that resolves when connected
   */
  private async connectToSignalingServers(): Promise<void> {
    const promises = this.signalingServers.map((url) => this.connectToSignalingServer(url));
    await Promise.all(promises);
  }
  
  /**
   * Connect to a signaling server
   * @param url Signaling server URL
   * @returns Promise that resolves when connected
   */
  private async connectToSignalingServer(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create WebSocket connection
        const ws = new WebSocket(url);
        
        // Set up event handlers
        ws.onopen = () => {
          // Store the connection
          this.wsConnections.set(url, ws);
          
          // Reset reconnect attempts
          this.wsReconnectAttempts.set(url, 0);
          
          // Register with the signaling server
          this.sendSignalingMessage(ws, {
            type: 'register',
            payload: {
              peerId: this.peerId,
            },
          });
          
          resolve();
        };
        
        ws.onclose = () => {
          // Remove the connection
          this.wsConnections.delete(url);
          
          // Reconnect
          this.reconnectToSignalingServer(url);
        };
        
        ws.onerror = (error) => {
          if (!this.wsConnections.has(url)) {
            reject(error);
          }
          
          this.emit(EventType.P2P_ERROR, { error });
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleSignalingMessage(ws, message);
          } catch (error) {
            this.emit(EventType.P2P_ERROR, { error });
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Reconnect to a signaling server
   * @param url Signaling server URL
   */
  private reconnectToSignalingServer(url: string): void {
    // Get the current reconnect attempts
    const attempts = this.wsReconnectAttempts.get(url) || 0;
    
    // Check if we've exceeded the maximum number of reconnect attempts
    if (attempts >= DEFAULT_RECONNECT_ATTEMPTS) {
      this.emit(EventType.P2P_ERROR, { error: `Maximum reconnect attempts exceeded for ${url}` });
      return;
    }
    
    // Increment reconnect attempts
    this.wsReconnectAttempts.set(url, attempts + 1);
    
    // Clear existing reconnect timeout
    const existingTimeout = this.wsReconnectTimeouts.get(url);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set reconnect timeout
    const timeout = setTimeout(() => {
      this.connectToSignalingServer(url).catch((error) => {
        this.emit(EventType.P2P_ERROR, { error });
      });
    }, DEFAULT_RECONNECT_INTERVAL);
    
    this.wsReconnectTimeouts.set(url, timeout);
  }
  
  /**
   * Send a signaling message
   * @param ws WebSocket connection
   * @param message Message to send
   */
  private sendSignalingMessage(ws: WebSocket, message: WebSocketMessage): void {
    ws.send(JSON.stringify(message));
  }
  
  /**
   * Handle a signaling message
   * @param ws WebSocket connection
   * @param message Message to handle
   */
  private handleSignalingMessage(ws: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'peer-connected':
        this.handlePeerConnected(message.payload);
        break;
      case 'peer-disconnected':
        this.handlePeerDisconnected(message.payload);
        break;
      case 'offer':
        this.handleOffer(message.payload);
        break;
      case 'answer':
        this.handleAnswer(message.payload);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(message.payload);
        break;
      default:
        // Unknown message type
        break;
    }
  }
  
  /**
   * Handle peer connected message
   * @param payload Message payload
   */
  private handlePeerConnected(payload: any): void {
    const peerId = payload.peerId as string;
    
    // Check if we already know about this peer
    if (this.peers.has(peerId)) {
      return;
    }
    
    // Check if we've reached the maximum number of peers
    if (this.peers.size >= this.maxPeers) {
      return;
    }
    
    // Create a peer connection
    this.createPeerConnection(peerId);
  }
  
  /**
   * Handle peer disconnected message
   * @param payload Message payload
   */
  private handlePeerDisconnected(payload: any): void {
    const peerId = payload.peerId as string;
    
    // Check if we know about this peer
    if (!this.peers.has(peerId)) {
      return;
    }
    
    // Close the peer connection
    this.closePeerConnection(peerId);
  }
  
  /**
   * Handle offer message
   * @param payload Message payload
   */
  private handleOffer(payload: any): void {
    const peerId = payload.from as string;
    const sdp = payload.sdp as string;
    
    // Check if we know about this peer
    if (!this.peers.has(peerId)) {
      // Create a peer connection
      this.createPeerConnection(peerId);
    }
    
    // Get the peer connection
    const connection = this.webrtcConnections.get(peerId);
    
    if (!connection) {
      return;
    }
    
    // Set the remote description
    connection.setRemoteDescription(new RTCSessionDescription({
      type: 'offer',
      sdp,
    })).then(() => {
      // Create an answer
      return connection.createAnswer();
    }).then((answer) => {
      // Set the local description
      return connection.setLocalDescription(answer);
    }).then(() => {
      // Send the answer to the peer
      this.sendToPeer(peerId, {
        type: 'answer',
        payload: {
          from: this.peerId,
          to: peerId,
          sdp: connection.localDescription?.sdp,
        },
      });
    }).catch((error) => {
      this.emit(EventType.P2P_ERROR, { error });
    });
  }
  
  /**
   * Handle answer message
   * @param payload Message payload
   */
  private handleAnswer(payload: any): void {
    const peerId = payload.from as string;
    const sdp = payload.sdp as string;
    
    // Get the peer connection
    const connection = this.webrtcConnections.get(peerId);
    
    if (!connection) {
      return;
    }
    
    // Set the remote description
    connection.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp,
    })).catch((error) => {
      this.emit(EventType.P2P_ERROR, { error });
    });
  }
  
  /**
   * Handle ICE candidate message
   * @param payload Message payload
   */
  private handleIceCandidate(payload: any): void {
    const peerId = payload.from as string;
    const candidate = payload.candidate as string;
    const sdpMid = payload.sdpMid as string;
    const sdpMLineIndex = payload.sdpMLineIndex as number;
    
    // Get the peer connection
    const connection = this.webrtcConnections.get(peerId);
    
    if (!connection) {
      return;
    }
    
    // Add the ICE candidate
    connection.addIceCandidate(new RTCIceCandidate({
      candidate,
      sdpMid,
      sdpMLineIndex,
    })).catch((error) => {
      this.emit(EventType.P2P_ERROR, { error });
    });
  }
  
  /**
   * Connect to bootstrap peers
   * @returns Promise that resolves when connected
   */
  private async connectToBootstrapPeers(): Promise<void> {
    // This is a simplified implementation
    // In a real implementation, this would connect to bootstrap peers
  }
  
  /**
   * Start local discovery
   * @returns Promise that resolves when started
   */
  private async startLocalDiscovery(): Promise<void> {
    // This is a simplified implementation
    // In a real implementation, this would start local discovery
  }
  
  /**
   * Start DHT
   * @returns Promise that resolves when started
   */
  private async startDht(): Promise<void> {
    // This is a simplified implementation
    // In a real implementation, this would start the DHT
  }
  
  /**
   * Create a peer connection
   * @param peerId Peer ID
   */
  private createPeerConnection(peerId: string): void {
    // Check if we already have a connection to this peer
    if (this.webrtcConnections.has(peerId)) {
      return;
    }
    
    // Create configuration
    const configuration: RTCConfiguration = {
      iceServers: [
        ...DEFAULT_STUN_SERVERS.map((url) => ({ urls: url })),
        ...DEFAULT_TURN_SERVERS,
      ],
    };
    
    // Create peer connection
    const connection = new RTCPeerConnection(configuration);
    
    // Store the connection
    this.webrtcConnections.set(peerId, connection);
    
    // Create a data channel
    const dataChannel = connection.createDataChannel('darkswap');
    
    // Store the data channel
    this.dataChannels.set(peerId, dataChannel);
    
    // Set up data channel event handlers
    dataChannel.onopen = () => {
      // Create a peer
      const peer: Peer = {
        id: peerId,
        connectionId: generateRandomId(),
        status: ConnectionStatus.CONNECTED,
        connectedAt: Date.now(),
      };
      
      // Store the peer
      this.peers.set(peerId, peer);
      
      // Emit event
      this.emit(EventType.P2P_PEER_CONNECTED, { peer });
    };
    
    dataChannel.onclose = () => {
      // Remove the data channel
      this.dataChannels.delete(peerId);
      
      // Remove the peer
      const peer = this.peers.get(peerId);
      
      if (peer) {
        this.peers.delete(peerId);
        
        // Emit event
        this.emit(EventType.P2P_PEER_DISCONNECTED, { peer });
      }
    };
    
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleDataChannelMessage(peerId, message);
      } catch (error) {
        this.emit(EventType.P2P_ERROR, { error });
      }
    };
    
    // Set up peer connection event handlers
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the peer
        this.sendToPeer(peerId, {
          type: 'ice-candidate',
          payload: {
            from: this.peerId,
            to: peerId,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };
    
    connection.onnegotiationneeded = () => {
      // Create an offer
      connection.createOffer().then((offer) => {
        // Set the local description
        return connection.setLocalDescription(offer);
      }).then(() => {
        // Send the offer to the peer
        this.sendToPeer(peerId, {
          type: 'offer',
          payload: {
            from: this.peerId,
            to: peerId,
            sdp: connection.localDescription?.sdp,
          },
        });
      }).catch((error) => {
        this.emit(EventType.P2P_ERROR, { error });
      });
    };
    
    connection.ondatachannel = (event) => {
      // Store the data channel
      this.dataChannels.set(peerId, event.channel);
      
      // Set up data channel event handlers
      event.channel.onopen = () => {
        // Create a peer
        const peer: Peer = {
          id: peerId,
          connectionId: generateRandomId(),
          status: ConnectionStatus.CONNECTED,
          connectedAt: Date.now(),
        };
        
        // Store the peer
        this.peers.set(peerId, peer);
        
        // Emit event
        this.emit(EventType.P2P_PEER_CONNECTED, { peer });
      };
      
      event.channel.onclose = () => {
        // Remove the data channel
        this.dataChannels.delete(peerId);
        
        // Remove the peer
        const peer = this.peers.get(peerId);
        
        if (peer) {
          this.peers.delete(peerId);
          
          // Emit event
          this.emit(EventType.P2P_PEER_DISCONNECTED, { peer });
        }
      };
      
      event.channel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleDataChannelMessage(peerId, message);
        } catch (error) {
          this.emit(EventType.P2P_ERROR, { error });
        }
      };
    };
  }
  
  /**
   * Close a peer connection
   * @param peerId Peer ID
   */
  private closePeerConnection(peerId: string): void {
    // Close the data channel
    const dataChannel = this.dataChannels.get(peerId);
    
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(peerId);
    }
    
    // Close the peer connection
    const connection = this.webrtcConnections.get(peerId);
    
    if (connection) {
      connection.close();
      this.webrtcConnections.delete(peerId);
    }
    
    // Remove the peer
    const peer = this.peers.get(peerId);
    
    if (peer) {
      this.peers.delete(peerId);
      
      // Emit event
      this.emit(EventType.P2P_PEER_DISCONNECTED, { peer });
    }
  }
  
  /**
   * Send a message to a peer
   * @param peerId Peer ID
   * @param message Message to send
   */
  public sendToPeer(peerId: string, message: WebSocketMessage): void {
    // Check if we have a data channel to this peer
    const dataChannel = this.dataChannels.get(peerId);
    
    if (dataChannel && dataChannel.readyState === 'open') {
      // Send the message through the data channel
      dataChannel.send(JSON.stringify(message));
      return;
    }
    
    // Check if we have a WebSocket connection to a signaling server
    if (this.wsConnections.size > 0) {
      // Send the message through the first signaling server
      const ws = this.wsConnections.values().next().value;
      
      this.sendSignalingMessage(ws, {
        type: message.type,
        payload: {
          ...message.payload,
          from: this.peerId,
          to: peerId,
        },
      });
    }
  }
  
  /**
   * Broadcast a message to all peers
   * @param message Message to broadcast
   */
  public broadcast(message: WebSocketMessage): void {
    for (const peerId of this.peers.keys()) {
      this.sendToPeer(peerId, message);
    }
  }
  
  /**
   * Handle a data channel message
   * @param peerId Peer ID
   * @param message Message to handle
   */
  private handleDataChannelMessage(peerId: string, message: WebSocketMessage): void {
    // This is a simplified implementation
    // In a real implementation, this would handle different message types
  }
  
  /**
   * Set the connection status
   * @param status Connection status
   */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    
    if (status === ConnectionStatus.CONNECTED) {
      this.emit(EventType.P2P_CONNECTED);
    } else if (status === ConnectionStatus.DISCONNECTED) {
      this.emit(EventType.P2P_DISCONNECTED);
    }
  }
  
  /**
   * Get the peer ID
   * @returns Peer ID
   */
  public getPeerId(): string {
    return this.peerId;
  }
  
  /**
   * Get the connection status
   * @returns Connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Get all peers
   * @returns All peers
   */
  public getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }
  
  /**
   * Get a peer by ID
   * @param peerId Peer ID
   * @returns Peer or undefined if not found
   */
  public getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }
  
  /**
   * Check if a peer is connected
   * @param peerId Peer ID
   * @returns True if the peer is connected
   */
  public isPeerConnected(peerId: string): boolean {
    return this.peers.has(peerId);
  }
  
  /**
   * Get the number of connected peers
   * @returns Number of connected peers
   */
  public getPeerCount(): number {
    return this.peers.size;
  }
}

/**
 * Create a new P2P instance
 * @param options P2P options
 * @returns P2P instance
 */
export function createP2P(options: P2POptions = {}): P2P {
  return new P2P(options);
}