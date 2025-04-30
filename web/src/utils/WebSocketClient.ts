import { io, Socket } from 'socket.io-client';

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
export interface WebSocketSubscription {
  channel: WebSocketChannelType;
  params?: Record<string, string>;
}

// WebSocket client options
export interface WebSocketClientOptions {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

// WebSocket client
export class WebSocketClient {
  private socket: Socket;
  private options: WebSocketClientOptions;
  private authenticated: boolean = false;
  private subscriptions: WebSocketSubscription[] = [];
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  
  /**
   * Creates a new WebSocket client
   * @param options WebSocket client options
   */
  constructor(options: WebSocketClientOptions) {
    this.options = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...options,
    };
    
    // Create the Socket.IO client
    this.socket = io(this.options.url, {
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout,
    });
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Sets up event handlers
   */
  private setupEventHandlers(): void {
    // Handle connection
    this.socket.on(WebSocketEventType.CONNECT, () => {
      console.log('WebSocket connected');
      this.emit('connect');
      
      // Authenticate if we have a token
      const token = localStorage.getItem('token');
      if (token) {
        this.authenticate(token);
      }
      
      // Resubscribe to channels
      this.resubscribe();
    });
    
    // Handle disconnection
    this.socket.on(WebSocketEventType.DISCONNECT, (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnect', reason);
    });
    
    // Handle error
    this.socket.on(WebSocketEventType.ERROR, (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
    
    // Handle authentication success
    this.socket.on(WebSocketEventType.AUTHENTICATION_SUCCESS, (data) => {
      console.log('WebSocket authentication success:', data);
      this.authenticated = true;
      this.emit('authentication_success', data);
    });
    
    // Handle authentication failure
    this.socket.on(WebSocketEventType.AUTHENTICATION_FAILURE, (data) => {
      console.error('WebSocket authentication failure:', data);
      this.authenticated = false;
      this.emit('authentication_failure', data);
    });
    
    // Handle subscription success
    this.socket.on(WebSocketEventType.SUBSCRIPTION_SUCCESS, (data) => {
      console.log('WebSocket subscription success:', data);
      this.emit('subscription_success', data);
    });
    
    // Handle subscription failure
    this.socket.on(WebSocketEventType.SUBSCRIPTION_FAILURE, (data) => {
      console.error('WebSocket subscription failure:', data);
      this.emit('subscription_failure', data);
    });
    
    // Handle order events
    this.socket.on(WebSocketEventType.ORDER_CREATED, (data) => {
      this.emit('order_created', data);
    });
    
    this.socket.on(WebSocketEventType.ORDER_UPDATED, (data) => {
      this.emit('order_updated', data);
    });
    
    this.socket.on(WebSocketEventType.ORDER_CANCELLED, (data) => {
      this.emit('order_cancelled', data);
    });
    
    // Handle trade events
    this.socket.on(WebSocketEventType.TRADE_CREATED, (data) => {
      this.emit('trade_created', data);
    });
    
    this.socket.on(WebSocketEventType.TRADE_UPDATED, (data) => {
      this.emit('trade_updated', data);
    });
    
    this.socket.on(WebSocketEventType.TRADE_CANCELLED, (data) => {
      this.emit('trade_cancelled', data);
    });
    
    // Handle orderbook events
    this.socket.on(WebSocketEventType.ORDERBOOK_UPDATE, (data) => {
      this.emit('orderbook_update', data);
    });
    
    // Handle market events
    this.socket.on(WebSocketEventType.TICKER_UPDATE, (data) => {
      this.emit('ticker_update', data);
    });
    
    this.socket.on(WebSocketEventType.PRICE_UPDATE, (data) => {
      this.emit('price_update', data);
    });
    
    // Handle wallet events
    this.socket.on(WebSocketEventType.BALANCE_UPDATE, (data) => {
      this.emit('balance_update', data);
    });
    
    this.socket.on(WebSocketEventType.TRANSACTION_CREATED, (data) => {
      this.emit('transaction_created', data);
    });
    
    this.socket.on(WebSocketEventType.TRANSACTION_UPDATED, (data) => {
      this.emit('transaction_updated', data);
    });
    
    // Handle P2P events
    this.socket.on(WebSocketEventType.PEER_CONNECTED, (data) => {
      this.emit('peer_connected', data);
    });
    
    this.socket.on(WebSocketEventType.PEER_DISCONNECTED, (data) => {
      this.emit('peer_disconnected', data);
    });
    
    this.socket.on(WebSocketEventType.MESSAGE_RECEIVED, (data) => {
      this.emit('message_received', data);
    });
  }
  
  /**
   * Connects to the WebSocket server
   */
  public connect(): void {
    this.socket.connect();
  }
  
  /**
   * Disconnects from the WebSocket server
   */
  public disconnect(): void {
    this.socket.disconnect();
  }
  
  /**
   * Authenticates with the WebSocket server
   * @param token Authentication token
   */
  public authenticate(token: string): void {
    this.socket.emit(WebSocketEventType.AUTHENTICATE, { token });
  }
  
  /**
   * Subscribes to a channel
   * @param channel Channel
   * @param params Parameters
   */
  public subscribe(channel: WebSocketChannelType, params?: Record<string, string>): void {
    // Add the subscription to the subscriptions list
    this.subscriptions.push({ channel, params });
    
    // Subscribe to the channel
    this.socket.emit(WebSocketEventType.SUBSCRIBE, { channel, params });
  }
  
  /**
   * Unsubscribes from a channel
   * @param channel Channel
   * @param params Parameters
   */
  public unsubscribe(channel: WebSocketChannelType, params?: Record<string, string>): void {
    // Remove the subscription from the subscriptions list
    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.channel !== channel ||
        JSON.stringify(subscription.params) !== JSON.stringify(params)
    );
    
    // Unsubscribe from the channel
    this.socket.emit(WebSocketEventType.UNSUBSCRIBE, { channel, params });
  }
  
  /**
   * Resubscribes to all channels
   */
  private resubscribe(): void {
    // Resubscribe to all channels
    for (const subscription of this.subscriptions) {
      this.socket.emit(WebSocketEventType.SUBSCRIBE, subscription);
    }
  }
  
  /**
   * Adds an event handler
   * @param event Event
   * @param handler Handler
   */
  public on(event: string, handler: (data: any) => void): void {
    // Get the event handlers for this event
    let handlers = this.eventHandlers.get(event);
    
    // If there are no handlers for this event, create a new set
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    
    // Add the handler to the set
    handlers.add(handler);
  }
  
  /**
   * Removes an event handler
   * @param event Event
   * @param handler Handler
   */
  public off(event: string, handler: (data: any) => void): void {
    // Get the event handlers for this event
    const handlers = this.eventHandlers.get(event);
    
    // If there are no handlers for this event, return
    if (!handlers) {
      return;
    }
    
    // Remove the handler from the set
    handlers.delete(handler);
    
    // If there are no more handlers for this event, remove the set
    if (handlers.size === 0) {
      this.eventHandlers.delete(event);
    }
  }
  
  /**
   * Emits an event
   * @param event Event
   * @param data Data
   */
  private emit(event: string, data?: any): void {
    // Get the event handlers for this event
    const handlers = this.eventHandlers.get(event);
    
    // If there are no handlers for this event, return
    if (!handlers) {
      return;
    }
    
    // Call each handler
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in WebSocket event handler:', error);
      }
    }
  }
  
  /**
   * Checks if the client is connected
   * @returns Whether the client is connected
   */
  public isConnected(): boolean {
    return this.socket.connected;
  }
  
  /**
   * Checks if the client is authenticated
   * @returns Whether the client is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authenticated;
  }
  
  /**
   * Gets the Socket.IO client
   * @returns Socket.IO client
   */
  public getSocket(): Socket {
    return this.socket;
  }
}

// Create a singleton instance
let instance: WebSocketClient | null = null;

/**
 * Gets the WebSocket client instance
 * @param options WebSocket client options
 * @returns WebSocket client instance
 */
export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  if (!instance && options) {
    instance = new WebSocketClient(options);
  }
  
  if (!instance) {
    throw new Error('WebSocket client not initialized');
  }
  
  return instance;
}

/**
 * Initializes the WebSocket client
 * @param options WebSocket client options
 * @returns WebSocket client instance
 */
export function initWebSocketClient(options: WebSocketClientOptions): WebSocketClient {
  instance = new WebSocketClient(options);
  return instance;
}