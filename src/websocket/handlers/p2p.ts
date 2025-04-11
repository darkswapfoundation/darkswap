import { WebSocketEventType, WebSocketChannelType } from '../index';
import { WebSocketServer } from '../index';
import { logger } from '../../utils/logger';

/**
 * P2P handler
 */
export class P2PHandler {
  private webSocketServer: WebSocketServer;
  
  // In-memory store for P2P network status
  private p2pNetwork = {
    peers: new Map<string, {
      id: string;
      ip: string;
      port: number;
      lastSeen: Date;
      connected: boolean;
      version: string;
      userAgent: string;
    }>(),
    messages: {
      sent: 0,
      received: 0,
    },
    startTime: new Date(),
  };
  
  /**
   * Creates a new P2P handler
   * @param webSocketServer WebSocket server
   */
  constructor(webSocketServer: WebSocketServer) {
    this.webSocketServer = webSocketServer;
  }
  
  /**
   * Handles a peer connection
   * @param peer Peer
   */
  public handlePeerConnection(peer: {
    id: string;
    ip: string;
    port: number;
    version: string;
    userAgent: string;
  }): void {
    try {
      // Add the peer to the network
      this.p2pNetwork.peers.set(peer.id, {
        ...peer,
        lastSeen: new Date(),
        connected: true,
      });
      
      // Publish the peer connection
      this.webSocketServer.publish(
        WebSocketChannelType.P2P,
        WebSocketEventType.PEER_CONNECTED,
        peer
      );
      
      logger.debug('Published peer connection', { peerId: peer.id });
    } catch (error) {
      logger.error('Error publishing peer connection', error);
    }
  }
  
  /**
   * Handles a peer disconnection
   * @param peerId Peer ID
   */
  public handlePeerDisconnection(peerId: string): void {
    try {
      // Get the peer
      const peer = this.p2pNetwork.peers.get(peerId);
      
      // If the peer doesn't exist, return
      if (!peer) {
        return;
      }
      
      // Update the peer
      peer.connected = false;
      
      // Publish the peer disconnection
      this.webSocketServer.publish(
        WebSocketChannelType.P2P,
        WebSocketEventType.PEER_DISCONNECTED,
        { id: peerId }
      );
      
      logger.debug('Published peer disconnection', { peerId });
    } catch (error) {
      logger.error('Error publishing peer disconnection', error);
    }
  }
  
  /**
   * Handles a message from a peer
   * @param peerId Peer ID
   * @param message Message
   */
  public handlePeerMessage(peerId: string, message: any): void {
    try {
      // Get the peer
      const peer = this.p2pNetwork.peers.get(peerId);
      
      // If the peer doesn't exist, return
      if (!peer) {
        return;
      }
      
      // Update the peer's last seen timestamp
      peer.lastSeen = new Date();
      
      // Increment the received messages counter
      this.p2pNetwork.messages.received++;
      
      // Publish the message
      this.webSocketServer.publish(
        WebSocketChannelType.P2P,
        WebSocketEventType.MESSAGE_RECEIVED,
        {
          peerId,
          message,
        }
      );
      
      logger.debug('Published peer message', { peerId });
    } catch (error) {
      logger.error('Error publishing peer message', error);
    }
  }
  
  /**
   * Publishes P2P network status
   */
  public publishNetworkStatus(): void {
    try {
      // Calculate the uptime
      const uptime = Date.now() - this.p2pNetwork.startTime.getTime();
      
      // Count the number of connected peers
      const connectedPeers = Array.from(this.p2pNetwork.peers.values()).filter(
        (peer) => peer.connected
      );
      
      // Create the network status
      const networkStatus = {
        connected: connectedPeers.length > 0,
        peerCount: connectedPeers.length,
        uptime,
        messages: this.p2pNetwork.messages,
      };
      
      // Publish the network status
      this.webSocketServer.publish(
        WebSocketChannelType.P2P,
        WebSocketEventType.PEER_CONNECTED,
        networkStatus
      );
      
      logger.debug('Published P2P network status');
    } catch (error) {
      logger.error('Error publishing P2P network status', error);
    }
  }
  
  /**
   * Publishes peer list
   */
  public publishPeerList(): void {
    try {
      // Get the connected peers
      const connectedPeers = Array.from(this.p2pNetwork.peers.values()).filter(
        (peer) => peer.connected
      );
      
      // Publish the peer list
      this.webSocketServer.publish(
        WebSocketChannelType.P2P,
        WebSocketEventType.PEER_CONNECTED,
        { peers: connectedPeers }
      );
      
      logger.debug('Published P2P peer list', { count: connectedPeers.length });
    } catch (error) {
      logger.error('Error publishing P2P peer list', error);
    }
  }
  
  /**
   * Starts publishing P2P network status periodically
   * @param interval Interval in milliseconds
   */
  public startPeriodicUpdates(interval: number = 10000): void {
    // Publish P2P network status immediately
    this.publishNetworkStatus();
    this.publishPeerList();
    
    // Publish P2P network status periodically
    setInterval(() => {
      this.publishNetworkStatus();
      this.publishPeerList();
    }, interval);
    
    logger.info('Started periodic P2P network status updates', { interval });
  }
  
  /**
   * Gets the P2P network
   * @returns P2P network
   */
  public getP2PNetwork(): any {
    return this.p2pNetwork;
  }
}

/**
 * Creates a new P2P handler
 * @param webSocketServer WebSocket server
 * @returns P2P handler
 */
export function createP2PHandler(webSocketServer: WebSocketServer): P2PHandler {
  return new P2PHandler(webSocketServer);
}