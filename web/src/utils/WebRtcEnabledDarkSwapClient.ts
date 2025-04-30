/**
 * WebRTC-enabled DarkSwap client
 * 
 * This module provides a WebRTC-enabled DarkSwap client that integrates the DarkSwap WebAssembly
 * bindings with the existing WebRTC functionality.
 */

import { DarkSwapClient, AssetType, OrderSide, BitcoinNetwork, Event, EventType } from './DarkSwapClient';
import { WebRtcConnectionManager, WebRtcConnection, WebRtcConnectionEvent } from './WebRtcConnectionManager';
import { WebRtcSignalingClient, SignalingClientEvent } from './WebRtcSignalingClient';
import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * WebRTC message types
 */
export enum WebRtcMessageType {
  Order = 'order',
  Trade = 'trade',
  OrderBook = 'orderbook',
  Peer = 'peer',
  Chat = 'chat',
}

/**
 * WebRTC message
 */
export interface WebRtcMessage {
  type: WebRtcMessageType;
  payload: any;
}

/**
 * WebRTC-enabled DarkSwap client
 */
export class WebRtcEnabledDarkSwapClient extends DarkSwapClient {
  /**
   * WebRTC connection manager
   */
  private connectionManager: WebRtcConnectionManager;

  /**
   * WebRTC signaling client
   */
  private signalingClient: WebRtcSignalingClient;

  /**
   * Local peer ID
   */
  private localPeerId: string;

  /**
   * Signaling server URL
   */
  private signalingServerUrl: string;

  /**
   * Whether WebRTC is enabled
   */
  private webRtcEnabled: boolean = false;

  /**
   * ICE servers
   */
  private iceServers: string[] = [];

  /**
   * Data channel name
   */
  private readonly DATA_CHANNEL_NAME = 'darkswap';

  /**
   * Create a new WebRTC-enabled DarkSwap client
   * @param localPeerId Local peer ID
   * @param signalingServerUrl Signaling server URL
   */
  constructor(localPeerId: string, signalingServerUrl: string) {
    super();
    this.localPeerId = localPeerId;
    this.signalingServerUrl = signalingServerUrl;
    this.signalingClient = new WebRtcSignalingClient(localPeerId, signalingServerUrl);
    this.connectionManager = new WebRtcConnectionManager(this.signalingClient);
  }

  /**
   * Initialize the DarkSwap client
   * @param wasmPath Path to the WebAssembly module
   */
  async initialize(wasmPath: string): Promise<void> {
    // Initialize the base DarkSwap client
    await super.initialize(wasmPath);

    // Set up WebRTC connection manager event handlers
    this.setupConnectionManagerEventHandlers();

    console.log('WebRTC-enabled DarkSwap client initialized');
  }

  /**
   * Create a DarkSwap instance
   * @param config DarkSwap configuration
   */
  async create(config: any): Promise<void> {
    // Extract WebRTC configuration
    this.webRtcEnabled = config.enableWebRTC || false;
    this.iceServers = config.iceServers || [];

    // Create the base DarkSwap instance
    await super.create(config);

    // Initialize WebRTC if enabled
    if (this.webRtcEnabled) {
      await this.initializeWebRtc();
    }

    console.log('WebRTC-enabled DarkSwap instance created');
  }

  /**
   * Initialize WebRTC
   */
  private async initializeWebRtc(): Promise<void> {
    return tryAsync(async () => {
      // Connect to the signaling server
      await this.signalingClient.connect();

      // Set up RTCConfiguration with ICE servers
      const rtcConfig: RTCConfiguration = {
        iceServers: this.iceServers.map(server => ({ urls: server })),
      };

      // Initialize the connection manager with the RTCConfiguration
      this.connectionManager = new WebRtcConnectionManager(this.signalingClient, rtcConfig);

      // Set up connection manager event handlers
      this.setupConnectionManagerEventHandlers();

      console.log('WebRTC initialized');
    }, ErrorCode.INITIALIZATION_FAILED, 'Failed to initialize WebRTC');
  }

  /**
   * Set up connection manager event handlers
   */
  private setupConnectionManagerEventHandlers(): void {
    // Handle data channel messages
    this.connectionManager.on(WebRtcConnectionEvent.DataChannelMessage, (label: string, data: string) => {
      try {
        // Parse the message
        const message = JSON.parse(data) as WebRtcMessage;

        // Handle the message based on its type
        switch (message.type) {
          case WebRtcMessageType.Order:
            this.handleOrderMessage(message.payload);
            break;
          case WebRtcMessageType.Trade:
            this.handleTradeMessage(message.payload);
            break;
          case WebRtcMessageType.OrderBook:
            this.handleOrderBookMessage(message.payload);
            break;
          case WebRtcMessageType.Peer:
            this.handlePeerMessage(message.payload);
            break;
          case WebRtcMessageType.Chat:
            this.handleChatMessage(message.payload);
            break;
          default:
            console.warn('Unknown WebRTC message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling WebRTC message:', error);
      }
    });

    // Handle connection events
    this.connectionManager.on(WebRtcConnectionEvent.Connected, () => {
      console.log('WebRTC connection established');
    });

    this.connectionManager.on(WebRtcConnectionEvent.Disconnected, () => {
      console.log('WebRTC connection disconnected');
    });

    this.connectionManager.on(WebRtcConnectionEvent.Error, (error: any) => {
      console.error('WebRTC connection error:', error);
    });
  }

  /**
   * Handle order message
   * @param payload Order message payload
   */
  private handleOrderMessage(payload: any): void {
    // Process the order message
    console.log('Received order message:', payload);
    // TODO: Implement order message handling
  }

  /**
   * Handle trade message
   * @param payload Trade message payload
   */
  private handleTradeMessage(payload: any): void {
    // Process the trade message
    console.log('Received trade message:', payload);
    // TODO: Implement trade message handling
  }

  /**
   * Handle order book message
   * @param payload Order book message payload
   */
  private handleOrderBookMessage(payload: any): void {
    // Process the order book message
    console.log('Received order book message:', payload);
    // TODO: Implement order book message handling
  }

  /**
   * Handle peer message
   * @param payload Peer message payload
   */
  private handlePeerMessage(payload: any): void {
    // Process the peer message
    console.log('Received peer message:', payload);
    // TODO: Implement peer message handling
  }

  /**
   * Handle chat message
   * @param payload Chat message payload
   */
  private handleChatMessage(payload: any): void {
    // Process the chat message
    console.log('Received chat message:', payload);
    // TODO: Implement chat message handling
  }

  /**
   * Connect to a peer
   * @param peerId Peer ID
   */
  async connectToPeer(peerId: string): Promise<WebRtcConnection> {
    return tryAsync(async () => {
      if (!this.webRtcEnabled) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, 'WebRTC is not enabled');
      }

      // Connect to the peer
      const connection = await this.connectionManager.connect(peerId);

      // Wait for the connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        connection.once(WebRtcConnectionEvent.Connected, () => {
          clearTimeout(timeout);
          resolve();
        });

        connection.once(WebRtcConnectionEvent.Error, (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      return connection;
    }, ErrorCode.UNKNOWN_ERROR, `Failed to connect to peer ${peerId}`);
  }

  /**
   * Send a message to a peer
   * @param peerId Peer ID
   * @param type Message type
   * @param payload Message payload
   */
  async sendMessageToPeer(peerId: string, type: WebRtcMessageType, payload: any): Promise<void> {
    return tryAsync(async () => {
      if (!this.webRtcEnabled) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, 'WebRTC is not enabled');
      }

      // Get the connection
      const connection = this.connectionManager.getConnection(peerId);
      if (!connection) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, `No connection to peer ${peerId}`);
      }

      // Get the data channel
      const dataChannel = connection.getDataChannel(this.DATA_CHANNEL_NAME);
      if (!dataChannel) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, `No data channel for peer ${peerId}`);
      }

      // Create the message
      const message: WebRtcMessage = {
        type,
        payload,
      };

      // Send the message
      connection.sendString(this.DATA_CHANNEL_NAME, JSON.stringify(message));
    }, ErrorCode.UNKNOWN_ERROR, `Failed to send message to peer ${peerId}`);
  }

  /**
   * Broadcast a message to all connected peers
   * @param type Message type
   * @param payload Message payload
   */
  async broadcastMessage(type: WebRtcMessageType, payload: any): Promise<void> {
    return tryAsync(async () => {
      if (!this.webRtcEnabled) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, 'WebRTC is not enabled');
      }

      // Get all connections
      const connections = this.connectionManager.getConnections();

      // Send the message to all connections
      for (const [peerId, connection] of connections.entries()) {
        try {
          await this.sendMessageToPeer(peerId, type, payload);
        } catch (error) {
          console.error(`Failed to send message to peer ${peerId}:`, error);
        }
      }
    }, ErrorCode.UNKNOWN_ERROR, 'Failed to broadcast message');
  }

  /**
   * Discover peers
   */
  async discoverPeers(): Promise<string[]> {
    return tryAsync(async () => {
      if (!this.webRtcEnabled) {
        throw new DarkSwapError(ErrorCode.INVALID_ARGUMENT, 'WebRTC is not enabled');
      }

      // TODO: Implement peer discovery
      // This would typically involve querying a discovery service or using a DHT

      return [];
    }, ErrorCode.UNKNOWN_ERROR, 'Failed to discover peers');
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): string[] {
    if (!this.webRtcEnabled) {
      return [];
    }

    // Get all connections
    const connections = this.connectionManager.getConnections();

    // Return the peer IDs
    return Array.from(connections.keys());
  }

  /**
   * Override the create_order method to broadcast the order to peers
   */
  async createOrder(
    baseAsset: any,
    quoteAsset: any,
    side: OrderSide,
    amount: string,
    price: string,
    makerAddress: string,
    expirySeconds: number
  ): Promise<any> {
    // Create the order using the base implementation
    const order = await super.createOrder(
      baseAsset,
      quoteAsset,
      side,
      amount,
      price,
      makerAddress,
      expirySeconds
    );

    // Broadcast the order to peers if WebRTC is enabled
    if (this.webRtcEnabled) {
      try {
        await this.broadcastMessage(WebRtcMessageType.Order, order);
      } catch (error) {
        console.error('Failed to broadcast order:', error);
      }
    }

    return order;
  }

  /**
   * Override the take_order method to notify the maker peer
   */
  async takeOrder(orderId: string, amount: string): Promise<any> {
    // Take the order using the base implementation
    const trade = await super.takeOrder(orderId, amount);

    // Notify the maker peer if WebRTC is enabled
    if (this.webRtcEnabled) {
      try {
        // Get the order to find the maker
        const order = await super.getOrder(orderId);
        
        // Send a trade message to the maker
        await this.sendMessageToPeer(order.maker, WebRtcMessageType.Trade, trade);
      } catch (error) {
        console.error('Failed to notify maker peer:', error);
      }
    }

    return trade;
  }

  /**
   * Stop the DarkSwap client
   */
  async stop(): Promise<void> {
    // Close all WebRTC connections
    if (this.webRtcEnabled) {
      this.connectionManager.closeAllConnections();
      this.signalingClient.disconnect();
    }

    // Stop the base DarkSwap client
    await super.stop();
  }
}