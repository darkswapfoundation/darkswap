import { WebSocketBatcher, MessagePriority } from './WebSocketBatcher';

/**
 * WebSocket client options
 */
export interface WebSocketClientOptions {
  /** The URL of the WebSocket server */
  url: string;
  /** The interval in milliseconds between reconnection attempts */
  reconnectInterval?: number;
  /** The maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Whether to automatically reconnect when the connection is closed */
  reconnectOnClose?: boolean;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Whether to enable message batching */
  enableBatching?: boolean;
  /** Options for the message batcher */
  batcherOptions?: {
    /** The batch interval in milliseconds for low priority messages */
    lowPriorityInterval?: number;
    /** The batch interval in milliseconds for medium priority messages */
    mediumPriorityInterval?: number;
    /** The maximum batch size */
    maxBatchSize?: number;
    /** Whether to enable compression */
    enableCompression?: boolean;
  };
}

/**
 * WebSocket status
 */
export enum WebSocketStatus {
  /** The WebSocket is connecting */
  CONNECTING = 'connecting',
  /** The WebSocket is connected */
  CONNECTED = 'connected',
  /** The WebSocket is disconnected */
  DISCONNECTED = 'disconnected',
  /** The WebSocket is reconnecting */
  RECONNECTING = 'reconnecting',
}

/**
 * Event handler function
 */
export type EventHandler = (data: any) => void;

/**
 * WebSocket client for real-time communication
 */
export class WebSocketClient {
  /** The URL of the WebSocket server */
  private url: string;
  /** The WebSocket instance */
  private socket: WebSocket | null = null;
  /** The current status of the WebSocket connection */
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  /** The interval in milliseconds between reconnection attempts */
  private reconnectInterval: number;
  /** The maximum number of reconnection attempts */
  private maxReconnectAttempts: number;
  /** The current number of reconnection attempts */
  private reconnectAttempts: number = 0;
  /** Whether to automatically reconnect when the connection is closed */
  private reconnectOnClose: boolean;
  /** Whether to enable debug logging */
  private debug: boolean;
  /** Event handlers */
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  /** The message batcher */
  private batcher: WebSocketBatcher | null = null;
  /** Whether to enable message batching */
  private enableBatching: boolean;
  /** Options for the message batcher */
  private batcherOptions: NonNullable<WebSocketClientOptions['batcherOptions']>;

  /**
   * Create a new WebSocket client
   * @param options WebSocket client options
   */
  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval || 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectOnClose = options.reconnectOnClose !== false;
    this.debug = options.debug || false;
    this.enableBatching = options.enableBatching || false;
    this.batcherOptions = options.batcherOptions || {
      lowPriorityInterval: 1000,
      mediumPriorityInterval: 250,
      maxBatchSize: 50,
      enableCompression: false,
    };
  }

  /**
   * Connect to the WebSocket server
   * @returns A promise that resolves when the connection is established
   */
  async connect(): Promise<void> {
    if (this.socket) {
      return;
    }

    this.setStatus(WebSocketStatus.CONNECTING);

    return new Promise<void>((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          this.setStatus(WebSocketStatus.CONNECTED);
          this.reconnectAttempts = 0;
          this.emit('open');
          
          // Initialize the batcher if enabled
          if (this.enableBatching) {
            this.batcher = new WebSocketBatcher(
              (message) => this.sendRaw(message),
              {
                lowPriorityInterval: this.batcherOptions.lowPriorityInterval,
                mediumPriorityInterval: this.batcherOptions.mediumPriorityInterval,
                maxBatchSize: this.batcherOptions.maxBatchSize,
                enableCompression: this.batcherOptions.enableCompression,
                debug: this.debug,
              }
            );
            this.batcher.start();
          }
          
          resolve();
        };

        this.socket.onclose = (event) => {
          this.setStatus(WebSocketStatus.DISCONNECTED);
          this.emit('close', event);
          
          // Stop the batcher if it exists
          if (this.batcher) {
            this.batcher.stop();
            this.batcher = null;
          }

          if (this.reconnectOnClose) {
            this.reconnect();
          }
        };

        this.socket.onerror = (event) => {
          this.emit('error', event);
          reject(new Error('WebSocket connection error'));
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.setStatus(WebSocketStatus.DISCONNECTED);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (!this.socket) {
      return;
    }

    // Stop the batcher if it exists
    if (this.batcher) {
      this.batcher.stop();
      this.batcher = null;
    }

    this.socket.close();
    this.socket = null;
    this.setStatus(WebSocketStatus.DISCONNECTED);
  }

  /**
   * Send a message to the WebSocket server
   * @param message The message to send
   * @param priority The message priority (only used if batching is enabled)
   */
  send(message: string | object, priority: MessagePriority = MessagePriority.LOW): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const data = typeof message === 'string' ? message : JSON.stringify(message);

    if (this.enableBatching && this.batcher) {
      // If batching is enabled, queue the message
      this.batcher.queueMessage(message, priority);
    } else {
      // Otherwise, send the message directly
      this.sendRaw(data);
    }
  }

  /**
   * Send a raw message to the WebSocket server
   * @param message The message to send
   */
  private sendRaw(message: string | object): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const data = typeof message === 'string' ? message : JSON.stringify(message);
    this.socket.send(data);

    if (this.debug) {
      console.log('[WebSocketClient] Sent message:', message);
    }
  }

  /**
   * Register an event handler
   * @param event The event name
   * @param handler The event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   * @param event The event name
   * @param handler The event handler
   */
  off(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    this.eventHandlers.get(event)!.delete(handler);
  }

  /**
   * Emit an event
   * @param event The event name
   * @param data The event data
   */
  private emit(event: string, data?: any): void {
    // Emit the specific event
    if (this.eventHandlers.has(event)) {
      const handlers = Array.from(this.eventHandlers.get(event)!);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }

    // Emit the wildcard event
    if (event !== '*' && this.eventHandlers.has('*')) {
      const handlers = Array.from(this.eventHandlers.get('*')!);
      handlers.forEach(handler => {
        try {
          handler({ event, data });
        } catch (error) {
          console.error('Error in * handler:', error);
        }
      });
    }
  }

  /**
   * Handle a message from the WebSocket server
   * @param event The message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Emit the raw message event
      this.emit('message', event);

      // Try to parse the message as JSON
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        // If parsing fails, emit the message as-is
        this.emit('message:raw', event.data);
        return;
      }

      // Handle batch messages
      if (data && data.type === 'batch' && Array.isArray(data.messages)) {
        // Process each message in the batch
        data.messages.forEach((message: any) => {
          this.processMessage(message);
        });
      } else {
        // Process a single message
        this.processMessage(data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Process a message
   * @param data The message data
   */
  private processMessage(data: any): void {
    // Emit the parsed message event
    this.emit('message:parsed', data);

    // If the message has a type, emit an event for that type
    if (data && typeof data === 'object' && data.type) {
      this.emit(data.type, data);
    }
  }

  /**
   * Reconnect to the WebSocket server
   */
  private reconnect(): void {
    if (this.status === WebSocketStatus.RECONNECTING) {
      return;
    }

    this.setStatus(WebSocketStatus.RECONNECTING);
    this.reconnectAttempts++;

    this.emit('reconnect_attempt', this.reconnectAttempts);

    if (this.debug) {
      console.log(`[WebSocketClient] Reconnecting (attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts})...`);
    }

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.emit('reconnect_failure');
      if (this.debug) {
        console.log('[WebSocketClient] Reconnection failed after maximum attempts');
      }
      return;
    }

    setTimeout(() => {
      this.connect()
        .then(() => {
          this.emit('reconnect_success');
          if (this.debug) {
            console.log('[WebSocketClient] Reconnected successfully');
          }
        })
        .catch(() => {
          this.reconnect();
        });
    }, this.reconnectInterval);
  }

  /**
   * Set the WebSocket status
   * @param status The new status
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('status_change', status);

      if (this.debug) {
        console.log(`[WebSocketClient] Status changed to ${status}`);
      }
    }
  }

  /**
   * Get the current WebSocket status
   * @returns The current status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Get the WebSocket instance
   * @returns The WebSocket instance, or null if not connected
   */
  getSocket(): WebSocket | null {
    return this.socket;
  }

  /**
   * Get the message batcher
   * @returns The message batcher, or null if batching is not enabled
   */
  getBatcher(): WebSocketBatcher | null {
    return this.batcher;
  }

  /**
   * Enable message batching
   * @param options Batcher options
   */
  enableMessageBatching(options?: WebSocketClientOptions['batcherOptions']): void {
    if (this.enableBatching && this.batcher) {
      return;
    }

    this.enableBatching = true;
    this.batcherOptions = {
      ...this.batcherOptions,
      ...options,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.batcher = new WebSocketBatcher(
        (message) => this.sendRaw(message),
        {
          lowPriorityInterval: this.batcherOptions.lowPriorityInterval,
          mediumPriorityInterval: this.batcherOptions.mediumPriorityInterval,
          maxBatchSize: this.batcherOptions.maxBatchSize,
          enableCompression: this.batcherOptions.enableCompression,
          debug: this.debug,
        }
      );
      this.batcher.start();
    }
  }

  /**
   * Disable message batching
   */
  disableMessageBatching(): void {
    if (!this.enableBatching || !this.batcher) {
      return;
    }

    this.enableBatching = false;
    
    if (this.batcher) {
      this.batcher.stop();
      this.batcher = null;
    }
  }

  /**
   * Flush the message queue
   */
  flushMessageQueue(): void {
    if (this.batcher) {
      this.batcher.flushQueue();
    }
  }
}

/**
 * Create a new WebSocket client
 * @param options WebSocket client options
 * @returns A new WebSocket client
 */
export function createWebSocketClient(options: WebSocketClientOptions): WebSocketClient {
  return new WebSocketClient(options);
}