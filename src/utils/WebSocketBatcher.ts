/**
 * WebSocketBatcher - Batches WebSocket messages to reduce network traffic
 * 
 * This utility batches multiple WebSocket messages into a single frame,
 * reducing network traffic and improving performance.
 */

/**
 * Message priority
 */
export enum MessagePriority {
  /** High priority - send immediately */
  HIGH = 2,
  /** Medium priority - batch with short delay */
  MEDIUM = 1,
  /** Low priority - batch with longer delay */
  LOW = 0,
}

/**
 * WebSocket batcher options
 */
export interface WebSocketBatcherOptions {
  /** Maximum batch size in bytes */
  maxBatchSize?: number;
  /** Low priority message interval */
  lowPriorityInterval?: number;
  /** Medium priority message interval */
  mediumPriorityInterval?: number;
  /** Whether to enable compression */
  enableCompression?: boolean;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * WebSocket batcher class
 */
export class WebSocketBatcher {
  private lowPriorityQueue: Array<{ type: string; data: any }> = [];
  private mediumPriorityQueue: Array<{ type: string; data: any }> = [];
  private lowPriorityTimer: NodeJS.Timeout | null = null;
  private mediumPriorityTimer: NodeJS.Timeout | null = null;
  private sendCallback: (message: string) => void;
  private maxBatchSize: number;
  private lowPriorityInterval: number;
  private mediumPriorityInterval: number;
  private enableCompression: boolean;
  private debug: boolean;

  /**
   * Create a new WebSocketBatcher
   * @param sendCallback Callback to send batched messages
   * @param options Batcher options
   */
  constructor(
    sendCallback: (message: string) => void,
    options: WebSocketBatcherOptions = {}
  ) {
    this.sendCallback = sendCallback;
    this.maxBatchSize = options.maxBatchSize || 1024 * 1024; // 1MB
    this.lowPriorityInterval = options.lowPriorityInterval || 1000; // 1s
    this.mediumPriorityInterval = options.mediumPriorityInterval || 500; // 500ms
    this.enableCompression = options.enableCompression || false;
    this.debug = options.debug || false;
  }

  /**
   * Start the batcher
   */
  public start(): void {
    this.scheduleLowPriorityFlush();
    this.scheduleMediumPriorityFlush();
  }

  /**
   * Stop the batcher
   */
  public stop(): void {
    this.clearTimers();
  }

  /**
   * Send a message
   * @param type Message type
   * @param data Message data
   * @param priority Message priority
   */
  public send(type: string, data: any, priority: MessagePriority = MessagePriority.HIGH): void {
    const message = { type, data };

    switch (priority) {
      case MessagePriority.HIGH:
        // Send high priority messages immediately
        this.sendCallback(JSON.stringify(message));
        break;
      case MessagePriority.MEDIUM:
        // Queue medium priority messages
        this.mediumPriorityQueue.push(message);
        break;
      case MessagePriority.LOW:
        // Queue low priority messages
        this.lowPriorityQueue.push(message);
        break;
    }
  }

  /**
   * Flush all queues
   */
  public flush(): void {
    this.flushMediumPriorityQueue();
    this.flushLowPriorityQueue();
  }

  /**
   * Schedule low priority queue flush
   */
  private scheduleLowPriorityFlush(): void {
    if (this.lowPriorityTimer) {
      clearTimeout(this.lowPriorityTimer);
    }

    this.lowPriorityTimer = setTimeout(() => {
      this.flushLowPriorityQueue();
      this.scheduleLowPriorityFlush();
    }, this.lowPriorityInterval);
  }

  /**
   * Schedule medium priority queue flush
   */
  private scheduleMediumPriorityFlush(): void {
    if (this.mediumPriorityTimer) {
      clearTimeout(this.mediumPriorityTimer);
    }

    this.mediumPriorityTimer = setTimeout(() => {
      this.flushMediumPriorityQueue();
      this.scheduleMediumPriorityFlush();
    }, this.mediumPriorityInterval);
  }

  /**
   * Flush low priority queue
   */
  private flushLowPriorityQueue(): void {
    if (this.lowPriorityQueue.length === 0) return;

    this.log(`Flushing low priority queue (${this.lowPriorityQueue.length} messages)`);

    const batch = {
      type: 'batch',
      messages: this.lowPriorityQueue,
    };

    this.sendCallback(JSON.stringify(batch));
    this.lowPriorityQueue = [];
  }

  /**
   * Flush medium priority queue
   */
  private flushMediumPriorityQueue(): void {
    if (this.mediumPriorityQueue.length === 0) return;

    this.log(`Flushing medium priority queue (${this.mediumPriorityQueue.length} messages)`);

    const batch = {
      type: 'batch',
      messages: this.mediumPriorityQueue,
    };

    this.sendCallback(JSON.stringify(batch));
    this.mediumPriorityQueue = [];
  }

  /**
   * Clear timers
   */
  private clearTimers(): void {
    if (this.lowPriorityTimer) {
      clearTimeout(this.lowPriorityTimer);
      this.lowPriorityTimer = null;
    }

    if (this.mediumPriorityTimer) {
      clearTimeout(this.mediumPriorityTimer);
      this.mediumPriorityTimer = null;
    }
  }

  /**
   * Log a message if debug is enabled
   * @param message Message to log
   * @param args Additional arguments
   */
  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[WebSocketBatcher] ${message}`, ...args);
    }
  }
}

export default WebSocketBatcher;