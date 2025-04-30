import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAuthToken } from '../utils/auth';
import { logger } from '../utils/logger';
import { db } from '../db';

// WebSocket event types
export enum WebSocketEventType {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Authentication events
  AUTHENTICATE = 'authenticate',
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  
  // Subscription events
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  SUBSCRIPTION_SUCCESS = 'subscription_success',
  SUBSCRIPTION_FAILURE = 'subscription_failure',
  
  // Order events
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_CANCELLED = 'order_cancelled',
  
  // Trade events
  TRADE_CREATED = 'trade_created',
  TRADE_UPDATED = 'trade_updated',
  TRADE_CANCELLED = 'trade_cancelled',
  
  // Orderbook events
  ORDERBOOK_UPDATE = 'orderbook_update',
  
  // Market events
  TICKER_UPDATE = 'ticker_update',
  PRICE_UPDATE = 'price_update',
  
  // Wallet events
  BALANCE_UPDATE = 'balance_update',
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  
  // P2P events
  PEER_CONNECTED = 'peer_connected',
  PEER_DISCONNECTED = 'peer_disconnected',
  MESSAGE_RECEIVED = 'message_received',
}

// WebSocket channel types
export enum WebSocketChannelType {
  // Public channels
  TICKER = 'ticker',
  ORDERBOOK = 'orderbook',
  TRADES = 'trades',
  
  // Private channels
  ORDERS = 'orders',
  TRADES_PRIVATE = 'trades_private',
  WALLET = 'wallet',
  
  // P2P channels
  P2P = 'p2p',
}

// WebSocket subscription
interface WebSocketSubscription {
  channel: WebSocketChannelType;
  params?: Record<string, string>;
}

// WebSocket client
interface WebSocketClient {
  id: string;
  userId?: string;
  authenticated: boolean;
  subscriptions: WebSocketSubscription[];
}

// WebSocket server
export class WebSocketServer {
  private io: SocketIOServer;
  private clients: Map<string, WebSocketClient> = new Map();
  
  /**
   * Creates a new WebSocket server
   * @param httpServer HTTP server
   */
  constructor(httpServer: HttpServer) {
    // Create the Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    // Set up event handlers
    this.setupEventHandlers();
    
    logger.info('WebSocket server created');
  }
  
  /**
   * Sets up event handlers
   */
  private setupEventHandlers(): void {
    // Handle connection
    this.io.on(WebSocketEventType.CONNECT, (socket) => {
      logger.info('WebSocket client connected', { socketId: socket.id });
      
      // Create a new client
      const client: WebSocketClient = {
        id: socket.id,
        authenticated: false,
        subscriptions: [],
      };
      
      // Add the client to the clients map
      this.clients.set(socket.id, client);
      
      // Handle authentication
      socket.on(WebSocketEventType.AUTHENTICATE, (data: { token: string }) => {
        this.handleAuthentication(socket, data);
      });
      
      // Handle subscription
      socket.on(WebSocketEventType.SUBSCRIBE, (data: { channel: WebSocketChannelType; params?: Record<string, string> }) => {
        this.handleSubscription(socket, data);
      });
      
      // Handle unsubscription
      socket.on(WebSocketEventType.UNSUBSCRIBE, (data: { channel: WebSocketChannelType; params?: Record<string, string> }) => {
        this.handleUnsubscription(socket, data);
      });
      
      // Handle disconnection
      socket.on(WebSocketEventType.DISCONNECT, () => {
        this.handleDisconnection(socket);
      });
      
      // Handle error
      socket.on(WebSocketEventType.ERROR, (error) => {
        this.handleError(socket, error);
      });
    });
  }
  
  /**
   * Handles authentication
   * @param socket Socket
   * @param data Authentication data
   */
  private handleAuthentication(socket: any, data: { token: string }): void {
    try {
      // Get the token
      const { token } = data;
      
      // Verify the token
      const userId = verifyAuthToken(token);
      
      // If the token is invalid, emit an authentication failure event
      if (!userId) {
        socket.emit(WebSocketEventType.AUTHENTICATION_FAILURE, { error: 'Invalid token' });
        return;
      }
      
      // Get the client
      const client = this.clients.get(socket.id);
      
      // If the client doesn't exist, emit an authentication failure event
      if (!client) {
        socket.emit(WebSocketEventType.AUTHENTICATION_FAILURE, { error: 'Client not found' });
        return;
      }
      
      // Update the client
      client.userId = userId;
      client.authenticated = true;
      
      // Emit an authentication success event
      socket.emit(WebSocketEventType.AUTHENTICATION_SUCCESS, { userId });
      
      logger.info('WebSocket client authenticated', { socketId: socket.id, userId });
    } catch (error) {
      logger.error('Error authenticating WebSocket client', error);
      socket.emit(WebSocketEventType.AUTHENTICATION_FAILURE, { error: 'Authentication error' });
    }
  }
  
  /**
   * Handles subscription
   * @param socket Socket
   * @param data Subscription data
   */
  private handleSubscription(socket: any, data: { channel: WebSocketChannelType; params?: Record<string, string> }): void {
    try {
      // Get the channel and params
      const { channel, params } = data;
      
      // Get the client
      const client = this.clients.get(socket.id);
      
      // If the client doesn't exist, emit a subscription failure event
      if (!client) {
        socket.emit(WebSocketEventType.SUBSCRIPTION_FAILURE, { error: 'Client not found', channel, params });
        return;
      }
      
      // Check if the channel requires authentication
      const requiresAuthentication = this.channelRequiresAuthentication(channel);
      
      // If the channel requires authentication and the client is not authenticated, emit a subscription failure event
      if (requiresAuthentication && !client.authenticated) {
        socket.emit(WebSocketEventType.SUBSCRIPTION_FAILURE, { error: 'Authentication required', channel, params });
        return;
      }
      
      // Add the subscription to the client
      client.subscriptions.push({ channel, params });
      
      // Join the channel room
      const room = this.getChannelRoom(channel, params);
      socket.join(room);
      
      // Emit a subscription success event
      socket.emit(WebSocketEventType.SUBSCRIPTION_SUCCESS, { channel, params });
      
      logger.info('WebSocket client subscribed to channel', { socketId: socket.id, channel, params });
    } catch (error) {
      logger.error('Error subscribing WebSocket client to channel', error);
      socket.emit(WebSocketEventType.SUBSCRIPTION_FAILURE, { error: 'Subscription error', channel: data.channel, params: data.params });
    }
  }
  
  /**
   * Handles unsubscription
   * @param socket Socket
   * @param data Unsubscription data
   */
  private handleUnsubscription(socket: any, data: { channel: WebSocketChannelType; params?: Record<string, string> }): void {
    try {
      // Get the channel and params
      const { channel, params } = data;
      
      // Get the client
      const client = this.clients.get(socket.id);
      
      // If the client doesn't exist, return
      if (!client) {
        return;
      }
      
      // Remove the subscription from the client
      client.subscriptions = client.subscriptions.filter(
        (subscription) => subscription.channel !== channel ||
          JSON.stringify(subscription.params) !== JSON.stringify(params)
      );
      
      // Leave the channel room
      const room = this.getChannelRoom(channel, params);
      socket.leave(room);
      
      logger.info('WebSocket client unsubscribed from channel', { socketId: socket.id, channel, params });
    } catch (error) {
      logger.error('Error unsubscribing WebSocket client from channel', error);
    }
  }
  
  /**
   * Handles disconnection
   * @param socket Socket
   */
  private handleDisconnection(socket: any): void {
    try {
      // Remove the client from the clients map
      this.clients.delete(socket.id);
      
      logger.info('WebSocket client disconnected', { socketId: socket.id });
    } catch (error) {
      logger.error('Error handling WebSocket client disconnection', error);
    }
  }
  
  /**
   * Handles error
   * @param socket Socket
   * @param error Error
   */
  private handleError(socket: any, error: any): void {
    logger.error('WebSocket client error', { socketId: socket.id, error });
  }
  
  /**
   * Checks if a channel requires authentication
   * @param channel Channel
   * @returns Whether the channel requires authentication
   */
  private channelRequiresAuthentication(channel: WebSocketChannelType): boolean {
    return [
      WebSocketChannelType.ORDERS,
      WebSocketChannelType.TRADES_PRIVATE,
      WebSocketChannelType.WALLET,
    ].includes(channel);
  }
  
  /**
   * Gets the channel room
   * @param channel Channel
   * @param params Parameters
   * @returns Channel room
   */
  private getChannelRoom(channel: WebSocketChannelType, params?: Record<string, string>): string {
    if (!params) {
      return channel;
    }
    
    return `${channel}:${Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join(',')}`;
  }
  
  /**
   * Publishes an event to a channel
   * @param channel Channel
   * @param event Event
   * @param data Data
   * @param params Parameters
   */
  public publish(channel: WebSocketChannelType, event: WebSocketEventType, data: any, params?: Record<string, string>): void {
    try {
      // Get the channel room
      const room = this.getChannelRoom(channel, params);
      
      // Emit the event to the channel room
      this.io.to(room).emit(event, data);
      
      logger.debug('Published event to channel', { channel, event, params });
    } catch (error) {
      logger.error('Error publishing event to channel', error);
    }
  }
  
  /**
   * Publishes an event to a user
   * @param userId User ID
   * @param event Event
   * @param data Data
   */
  public publishToUser(userId: string, event: WebSocketEventType, data: any): void {
    try {
      // Find all clients for the user
      const userClients = Array.from(this.clients.values()).filter(
        (client) => client.userId === userId
      );
      
      // Emit the event to each client
      for (const client of userClients) {
        this.io.to(client.id).emit(event, data);
      }
      
      logger.debug('Published event to user', { userId, event });
    } catch (error) {
      logger.error('Error publishing event to user', error);
    }
  }
  
  /**
   * Gets the Socket.IO server
   * @returns Socket.IO server
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Export a function to create a WebSocket server
export function createWebSocketServer(httpServer: HttpServer): WebSocketServer {
  return new WebSocketServer(httpServer);
}