/**
 * WebSocketClient - WebSocket client with reconnection and batching support
 * 
 * This utility provides a WebSocket client with automatic reconnection,
 * event handling, and message batching capabilities.
 */

import { WebSocketBatcher } from './WebSocketBatcher';

/**
 * WebSocket client options
 */
export interface WebSocketClientOptions {
  /** URL of the WebSocket server */
  url: string;
  /** Reconnection interval in milliseconds */
  reconnectInterval?: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Whether to automatically connect on instantiation */
  autoConnect?: boolean;
  /** Whether to enable message batching */
  enableBatching?: boolean;
  /** Batching options */
  batcherOptions?: {
    /** Maximum batch size in bytes */
    maxBatchSize?: number;
    /** Low priority message interval */
    lowPriorityInterval?: number;
    /** Medium priority message interval */
    mediumPriorityInterval?: number;
    /** Whether to enable compression */
    enableCompression?: boolean;
  };
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * WebSocket message priority
 */
export enum MessagePriority {
  /** High priority - send immediately */
  HIGH = 'high',
  /** Medium priority - batch with short delay */
  MEDIUM = 'medium',
  /** Low priority - batch with longer delay */
  LOW = 'low',
}

/**
 * WebSocket client event handler
 */
export type WebSocketEventHandler = (data: any) => void;

/**
 * WebSocket client class
 */
export class WebSocketClient {
  private url: string;
  private socket: WebSocket | null = null;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private enableBatching: boolean;
  private batcherOptions: {
    maxBatchSize: number;
    lowPriorityInterval: number;
    mediumPriorityInterval: number;
    enableCompression: boolean;
  };
  private batcher: WebSocketBatcher | null = null;
  private debug: boolean;

  /**
   * Create a new WebSocketClient
   * @param options WebSocket client options
   */
  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval || 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.enableBatching = options.enableBatching || false;
    this.batcherOptions = {
      maxBatchSize: options.batcherOptions?.maxBatchSize || 1024 * 1024, // 1MB
      lowPriorityInterval: options.batcherOptions?.lowPriorityInterval || 1000, // 1s
      mediumPriorityInterval: options.batcherOptions?.mediumPriorityInterval || 500, // 500ms
      enableCompression: options.batcherOptions?.enableCompression || false,
    };
    this.debug = options.debug || false;

    if (options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.log('Connected to WebSocket server');
          
          // Initialize batcher if batching is enabled
          if (this.enableBatching) {
            this.batcher = new WebSocketBatcher();
          }
          
          resolve();
        };

        this.socket.onclose = (event) => {
          this.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          
          // Stop the batcher if it exists
          if (this.batcher) {
            this.batcher = null;
          }
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log(`Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectInterval);
          } else {
            this.log('Maximum reconnection attempts reached');
            this.emit('max_reconnect_attempts');
          }
        };

        this.socket.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type) {
              this.emit(data.type, data.payload);
            } else {
              this.emit('message', data);
            }
          } catch (error) {
            this.log('Error parsing WebSocket message:', error);
            this.emit('error', error);
          }
        };
      } catch (error) {
        this.log('Error connecting to WebSocket server:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) return;
    
    this.log('Disconnecting from WebSocket server');
    
    // Stop the batcher if it exists
    if (this.batcher) {
      this.batcher = null;
    }
    
    this.socket.close();
    this.socket = null;
  }

  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param data Message data
   * @param priority Message priority
   */
  public send(type: string, data?: any, priority: MessagePriority = MessagePriority.HIGH): void {
    const message = {
      type,
      payload: data,
    };
    
    const serializedData = JSON.stringify(message);
    
    if (this.enableBatching && this.batcher && priority !== MessagePriority.HIGH) {
      // If batching is enabled, queue the message
      this.batcher.send(type, data, priority === MessagePriority.MEDIUM ? 1 : 0);
    } else {
      // Otherwise, send the message directly
      this.sendRaw(serializedData);
    }
  }

  /**
   * Send raw data to the WebSocket server
   * @param data Data to send
   */
  private sendRaw(data: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message: WebSocket is not connected');
      return;
    }
    
    try {
      this.socket.send(data);
    } catch (error) {
      this.log('Error sending WebSocket message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Register an event handler
   * @param event Event name
   * @param handler Event handler
   */
  public on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Unregister an event handler
   * @param event Event name
   * @param handler Event handler
   */
  public off(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) return;
    
    const handlers = this.eventHandlers.get(event)!;
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  private emit(event: string, data?: any): void {
    if (!this.eventHandlers.has(event)) return;
    
    for (const handler of this.eventHandlers.get(event)!) {
      try {
        handler(data);
      } catch (error) {
        this.log(`Error in event handler for ${event}:`, error);
      }
    }
  }

  /**
   * Log a message if debug is enabled
   * @param message Message to log
   * @param args Additional arguments
   */
  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[WebSocketClient] ${message}`, ...args);
    }
  }

  /**
   * Check if the WebSocket is connected
   * @returns Whether the WebSocket is connected
   */
  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Check if the WebSocket is connecting
   * @returns Whether the WebSocket is connecting
   */
  public isConnecting(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.CONNECTING;
  }

  /**
   * Get the WebSocket readyState
   * @returns WebSocket readyState
   */
  public getReadyState(): number | null {
    return this.socket ? this.socket.readyState : null;
  }

  /**
   * Flush the message queue
   */
  public flushMessageQueue(): void {
    if (this.batcher) {
      this.batcher.flush();
    }
  }
}

export default WebSocketClient;