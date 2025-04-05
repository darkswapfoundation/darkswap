import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { WS_URL } from '@env';

/**
 * WebSocket event type
 */
export interface WebSocketEvent {
  event_type: string;
  data: any;
}

/**
 * WebSocket service for real-time communication
 */
class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private connected: boolean = false;
  private eventListeners: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns WebSocketService instance
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<void> {
    if (this.socket) {
      return;
    }

    try {
      // Get token from keychain
      const credentials = await Keychain.getGenericPassword();
      const token = credentials ? credentials.password : null;

      // Create socket connection
      const socketUrl = WS_URL || 'ws://localhost:3001';
      const socketOptions = {
        auth: {
          token,
        },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      };

      this.socket = io(socketUrl, socketOptions);

      // Set up event listeners
      this.socket.on('connect', this.handleConnect);
      this.socket.on('disconnect', this.handleDisconnect);
      this.socket.on('error', this.handleError);
      this.socket.on('message', this.handleMessage);
      this.socket.on('reconnect_attempt', this.handleReconnectAttempt);
      this.socket.on('reconnect_failed', this.handleReconnectFailed);
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    this.notifyConnectionListeners();
  }

  /**
   * Subscribe to a topic
   * @param topic - Topic to subscribe to
   */
  public subscribe(topic: string): void {
    if (!this.socket || !this.connected) {
      console.warn('Cannot subscribe to topic: not connected');
      return;
    }

    this.socket.emit('subscribe', { topic });
  }

  /**
   * Unsubscribe from a topic
   * @param topic - Topic to unsubscribe from
   */
  public unsubscribe(topic: string): void {
    if (!this.socket || !this.connected) {
      console.warn('Cannot unsubscribe from topic: not connected');
      return;
    }

    this.socket.emit('unsubscribe', { topic });
  }

  /**
   * Add event listener
   * @param eventType - Event type to listen for
   * @param listener - Event listener function
   */
  public addEventListener(
    eventType: string,
    listener: (event: WebSocketEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   * @param eventType - Event type to remove listener for
   * @param listener - Event listener function to remove
   */
  public removeEventListener(
    eventType: string,
    listener: (event: WebSocketEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * Add connection listener
   * @param listener - Connection listener function
   */
  public addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
    // Notify listener of current connection state
    listener(this.connected);
  }

  /**
   * Remove connection listener
   * @param listener - Connection listener function to remove
   */
  public removeConnectionListener(listener: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(listener);
    if (index !== -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  /**
   * Check if connected to WebSocket server
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Handle connect event
   */
  private handleConnect = (): void => {
    console.log('WebSocket connected');
    this.connected = true;
    this.reconnectAttempts = 0;
    this.notifyConnectionListeners();
  };

  /**
   * Handle disconnect event
   */
  private handleDisconnect = (): void => {
    console.log('WebSocket disconnected');
    this.connected = false;
    this.notifyConnectionListeners();
  };

  /**
   * Handle error event
   * @param error - Error object
   */
  private handleError = (error: any): void => {
    console.error('WebSocket error:', error);
  };

  /**
   * Handle message event
   * @param event - WebSocket event
   */
  private handleMessage = (event: WebSocketEvent): void => {
    console.log('WebSocket message:', event);
    
    // Notify all listeners for this event type
    const listeners = this.eventListeners.get(event.event_type) || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });

    // Notify all listeners for 'all' events
    const allListeners = this.eventListeners.get('all') || [];
    allListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  };

  /**
   * Handle reconnect attempt event
   * @param attempt - Reconnect attempt number
   */
  private handleReconnectAttempt = (attempt: number): void => {
    console.log(`WebSocket reconnect attempt ${attempt}`);
    this.reconnectAttempts = attempt;
  };

  /**
   * Handle reconnect failed event
   */
  private handleReconnectFailed = (): void => {
    console.log('WebSocket reconnect failed');
  };

  /**
   * Notify all connection listeners
   */
  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(this.connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }
}

export default WebSocketService.getInstance();