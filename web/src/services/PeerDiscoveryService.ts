/**
 * Peer Discovery Service
 * 
 * This service handles peer discovery for the P2P network using WebRTC.
 * It discovers peers through multiple mechanisms:
 * - Signaling server
 * - DHT (Distributed Hash Table)
 * - Known peers (bootstrap nodes)
 * - Local network discovery
 */
import WebRtcConnection from '../utils/WebRtcConnection';

// Peer types
export enum PeerType {
  BOOTSTRAP = 'bootstrap',
  SIGNALING = 'signaling',
  DHT = 'dht',
  LOCAL = 'local',
  MANUAL = 'manual',
}

// Peer status
export enum PeerStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
}

// Peer info
export interface PeerInfo {
  id: string;
  type: PeerType;
  status: PeerStatus;
  address?: string;
  lastSeen?: number;
  latency?: number;
  metadata?: Record<string, any>;
}

// Peer discovery options
export interface PeerDiscoveryOptions {
  signalingServers?: string[];
  bootstrapPeers?: string[];
  enableDht?: boolean;
  enableLocalDiscovery?: boolean;
  maxPeers?: number;
  connectionTimeout?: number;
  reconnectInterval?: number;
}

// Peer discovery events
export enum PeerDiscoveryEventType {
  PEER_FOUND = 'peer_found',
  PEER_CONNECTED = 'peer_connected',
  PEER_DISCONNECTED = 'peer_disconnected',
  PEER_FAILED = 'peer_failed',
  DISCOVERY_STARTED = 'discovery_started',
  DISCOVERY_STOPPED = 'discovery_stopped',
  ERROR = 'error',
}

// Peer discovery event
export interface PeerDiscoveryEvent {
  type: PeerDiscoveryEventType;
  data?: any;
  timestamp: number;
}

// Peer discovery event listener
export type PeerDiscoveryEventListener = (event: PeerDiscoveryEvent) => void;

/**
 * Peer Discovery Service
 */
export class PeerDiscoveryService {
  private static instance: PeerDiscoveryService;
  private options: PeerDiscoveryOptions;
  private peers: Map<string, PeerInfo> = new Map();
  private connections: Map<string, WebRtcConnection> = new Map();
  private eventListeners: Map<PeerDiscoveryEventType, PeerDiscoveryEventListener[]> = new Map();
  private isDiscovering: boolean = false;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;

  /**
   * Get the singleton instance of the service
   * @param options Peer discovery options
   * @returns PeerDiscoveryService instance
   */
  public static getInstance(options?: PeerDiscoveryOptions): PeerDiscoveryService {
    if (!PeerDiscoveryService.instance) {
      PeerDiscoveryService.instance = new PeerDiscoveryService(options);
    } else if (options) {
      PeerDiscoveryService.instance.updateOptions(options);
    }
    return PeerDiscoveryService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   * @param options Peer discovery options
   */
  private constructor(options?: PeerDiscoveryOptions) {
    this.options = {
      signalingServers: ['wss://signaling.darkswap.io'],
      bootstrapPeers: [],
      enableDht: true,
      enableLocalDiscovery: true,
      maxPeers: 10,
      connectionTimeout: 30000, // 30 seconds
      reconnectInterval: 60000, // 1 minute
      ...options,
    };
  }

  /**
   * Update options
   * @param options Peer discovery options
   */
  public updateOptions(options: Partial<PeerDiscoveryOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Add event listener
   * @param type Event type
   * @param listener Event listener
   */
  public addEventListener(type: PeerDiscoveryEventType, listener: PeerDiscoveryEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   * @param type Event type
   * @param listener Event listener
   */
  public removeEventListener(type: PeerDiscoveryEventType, listener: PeerDiscoveryEventListener): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const listeners = this.eventListeners.get(type)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatch event
   * @param type Event type
   * @param data Event data
   */
  private dispatchEvent(type: PeerDiscoveryEventType, data?: any): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const event: PeerDiscoveryEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.eventListeners.get(type)!.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Start peer discovery
   */
  public async startDiscovery(): Promise<void> {
    if (this.isDiscovering) {
      return;
    }

    this.isDiscovering = true;
    this.dispatchEvent(PeerDiscoveryEventType.DISCOVERY_STARTED);

    try {
      // Connect to bootstrap peers
      await this.connectToBootstrapPeers();

      // Connect to signaling servers
      await this.connectToSignalingServers();

      // Start DHT discovery if enabled
      if (this.options.enableDht) {
        await this.startDhtDiscovery();
      }

      // Start local discovery if enabled
      if (this.options.enableLocalDiscovery) {
        await this.startLocalDiscovery();
      }

      // Start discovery interval
      this.startDiscoveryInterval();

      // Start reconnect interval
      this.startReconnectInterval();
    } catch (error) {
      console.error('Error starting peer discovery:', error);
      this.dispatchEvent(PeerDiscoveryEventType.ERROR, {
        message: 'Failed to start peer discovery',
        error,
      });
    }
  }

  /**
   * Stop peer discovery
   */
  public stopDiscovery(): void {
    if (!this.isDiscovering) {
      return;
    }

    this.isDiscovering = false;
    this.dispatchEvent(PeerDiscoveryEventType.DISCOVERY_STOPPED);

    // Stop discovery interval
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    // Stop reconnect interval
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // Disconnect from all peers
    this.disconnectFromAllPeers();
  }

  /**
   * Start discovery interval
   */
  private startDiscoveryInterval(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    this.discoveryInterval = setInterval(() => {
      this.discoverPeers();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start reconnect interval
   */
  private startReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.reconnectInterval = setInterval(() => {
      this.reconnectToDisconnectedPeers();
    }, this.options.reconnectInterval);
  }

  /**
   * Connect to bootstrap peers
   */
  private async connectToBootstrapPeers(): Promise<void> {
    if (!this.options.bootstrapPeers || this.options.bootstrapPeers.length === 0) {
      return;
    }

    for (const peerId of this.options.bootstrapPeers) {
      await this.connectToPeer(peerId, PeerType.BOOTSTRAP);
    }
  }

  /**
   * Connect to signaling servers
   */
  private async connectToSignalingServers(): Promise<void> {
    if (!this.options.signalingServers || this.options.signalingServers.length === 0) {
      return;
    }

    for (const server of this.options.signalingServers) {
      try {
        // In a real implementation, this would connect to the signaling server
        // and register for peer discovery events
        console.log(`Connecting to signaling server: ${server}`);
      } catch (error) {
        console.error(`Error connecting to signaling server ${server}:`, error);
      }
    }
  }

  /**
   * Start DHT discovery
   */
  private async startDhtDiscovery(): Promise<void> {
    try {
      // In a real implementation, this would initialize the DHT and start peer discovery
      console.log('Starting DHT discovery');
    } catch (error) {
      console.error('Error starting DHT discovery:', error);
    }
  }

  /**
   * Start local discovery
   */
  private async startLocalDiscovery(): Promise<void> {
    try {
      // In a real implementation, this would start local network discovery
      // using mDNS or similar
      console.log('Starting local discovery');
    } catch (error) {
      console.error('Error starting local discovery:', error);
    }
  }

  /**
   * Discover peers
   */
  private async discoverPeers(): Promise<void> {
    try {
      // In a real implementation, this would use various discovery mechanisms
      // to find new peers
      console.log('Discovering peers');

      // Check if we need more peers
      if (this.getConnectedPeers().length >= (this.options.maxPeers || 10)) {
        return;
      }

      // Simulate finding new peers
      const newPeerId = `peer-${Math.random().toString(36).substring(2, 15)}`;
      this.handlePeerFound(newPeerId, PeerType.DHT);
    } catch (error) {
      console.error('Error discovering peers:', error);
    }
  }

  /**
   * Reconnect to disconnected peers
   */
  private async reconnectToDisconnectedPeers(): Promise<void> {
    try {
      // Get disconnected peers that we want to reconnect to
      const disconnectedPeers = Array.from(this.peers.values()).filter(
        (peer) => peer.status === PeerStatus.DISCONNECTED && peer.type !== PeerType.MANUAL
      );

      for (const peer of disconnectedPeers) {
        await this.connectToPeer(peer.id, peer.type);
      }
    } catch (error) {
      console.error('Error reconnecting to peers:', error);
    }
  }

  /**
   * Handle peer found
   * @param peerId Peer ID
   * @param type Peer type
   */
  private handlePeerFound(peerId: string, type: PeerType): void {
    // Check if we already know about this peer
    if (this.peers.has(peerId)) {
      return;
    }

    // Add peer to the list
    const peerInfo: PeerInfo = {
      id: peerId,
      type,
      status: PeerStatus.DISCONNECTED,
      lastSeen: Date.now(),
    };
    this.peers.set(peerId, peerInfo);

    // Dispatch event
    this.dispatchEvent(PeerDiscoveryEventType.PEER_FOUND, peerInfo);

    // Connect to the peer if we have room
    if (this.getConnectedPeers().length < (this.options.maxPeers || 10)) {
      this.connectToPeer(peerId, type);
    }
  }

  /**
   * Connect to peer
   * @param peerId Peer ID
   * @param type Peer type
   */
  public async connectToPeer(peerId: string, type: PeerType = PeerType.MANUAL): Promise<boolean> {
    try {
      // Check if we're already connected to this peer
      if (this.connections.has(peerId)) {
        return true;
      }

      // Update peer info
      let peerInfo = this.peers.get(peerId);
      if (!peerInfo) {
        peerInfo = {
          id: peerId,
          type,
          status: PeerStatus.CONNECTING,
          lastSeen: Date.now(),
        };
        this.peers.set(peerId, peerInfo);
      } else {
        peerInfo.status = PeerStatus.CONNECTING;
        peerInfo.lastSeen = Date.now();
      }

      // Create WebRTC connection
      const connection = new WebRtcConnection(peerId);

      // Set up connection event handlers
      connection.onConnected = () => {
        this.handlePeerConnected(peerId);
      };

      connection.onDisconnected = () => {
        this.handlePeerDisconnected(peerId);
      };

      connection.onError = (error: Error) => {
        this.handlePeerError(peerId, error);
      };

      // Connect to the peer
      await connection.connect();

      // Store the connection
      this.connections.set(peerId, connection);

      return true;
    } catch (error) {
      console.error(`Error connecting to peer ${peerId}:`, error);
      this.handlePeerError(peerId, error);
      return false;
    }
  }

  /**
   * Disconnect from peer
   * @param peerId Peer ID
   */
  public disconnectFromPeer(peerId: string): void {
    try {
      // Get the connection
      const connection = this.connections.get(peerId);
      if (!connection) {
        return;
      }

      // Disconnect
      connection.disconnect();

      // Remove the connection
      this.connections.delete(peerId);

      // Update peer info
      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        peerInfo.status = PeerStatus.DISCONNECTED;
        peerInfo.lastSeen = Date.now();
      }

      // Dispatch event
      this.dispatchEvent(PeerDiscoveryEventType.PEER_DISCONNECTED, { peerId });
    } catch (error) {
      console.error(`Error disconnecting from peer ${peerId}:`, error);
    }
  }

  /**
   * Disconnect from all peers
   */
  public disconnectFromAllPeers(): void {
    for (const peerId of this.connections.keys()) {
      this.disconnectFromPeer(peerId);
    }
  }

  /**
   * Handle peer connected
   * @param peerId Peer ID
   */
  private handlePeerConnected(peerId: string): void {
    // Update peer info
    const peerInfo = this.peers.get(peerId);
    if (peerInfo) {
      peerInfo.status = PeerStatus.CONNECTED;
      peerInfo.lastSeen = Date.now();
    }

    // Dispatch event
    this.dispatchEvent(PeerDiscoveryEventType.PEER_CONNECTED, { peerId });
  }

  /**
   * Handle peer disconnected
   * @param peerId Peer ID
   */
  private handlePeerDisconnected(peerId: string): void {
    // Update peer info
    const peerInfo = this.peers.get(peerId);
    if (peerInfo) {
      peerInfo.status = PeerStatus.DISCONNECTED;
      peerInfo.lastSeen = Date.now();
    }

    // Remove the connection
    this.connections.delete(peerId);

    // Dispatch event
    this.dispatchEvent(PeerDiscoveryEventType.PEER_DISCONNECTED, { peerId });
  }

  /**
   * Handle peer error
   * @param peerId Peer ID
   * @param error Error
   */
  private handlePeerError(peerId: string, error: any): void {
    // Update peer info
    const peerInfo = this.peers.get(peerId);
    if (peerInfo) {
      peerInfo.status = PeerStatus.FAILED;
      peerInfo.lastSeen = Date.now();
    }

    // Remove the connection
    this.connections.delete(peerId);

    // Dispatch event
    this.dispatchEvent(PeerDiscoveryEventType.PEER_FAILED, { peerId, error });
  }

  /**
   * Get all peers
   * @returns Array of peer info
   */
  public getAllPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get connected peers
   * @returns Array of connected peer info
   */
  public getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter(
      (peer) => peer.status === PeerStatus.CONNECTED
    );
  }

  /**
   * Get peer info
   * @param peerId Peer ID
   * @returns Peer info or undefined if not found
   */
  public getPeerInfo(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Get peer connection
   * @param peerId Peer ID
   * @returns WebRTC connection or undefined if not found
   */
  public getPeerConnection(peerId: string): WebRtcConnection | undefined {
    return this.connections.get(peerId);
  }

  /**
   * Send message to peer
   * @param peerId Peer ID
   * @param message Message
   * @returns Success status
   */
  public sendMessageToPeer(peerId: string, message: any): boolean {
    try {
      // Get the connection
      const connection = this.connections.get(peerId);
      if (!connection) {
        return false;
      }

      // Send the message
      connection.send(message);

      return true;
    } catch (error) {
      console.error(`Error sending message to peer ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all peers
   * @param message Message
   * @param excludePeerIds Peer IDs to exclude
   * @returns Number of peers the message was sent to
   */
  public broadcastMessage(message: any, excludePeerIds: string[] = []): number {
    let sentCount = 0;

    for (const [peerId, connection] of this.connections.entries()) {
      if (excludePeerIds.includes(peerId)) {
        continue;
      }

      try {
        connection.send(message);
        sentCount++;
      } catch (error) {
        console.error(`Error broadcasting message to peer ${peerId}:`, error);
      }
    }

    return sentCount;
  }
}

export default PeerDiscoveryService;