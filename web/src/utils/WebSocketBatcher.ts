/**
 * WebSocket message batching utilities for DarkSwap
 */

/**
 * Message priority levels
 */
export enum MessagePriority {
  /** High priority messages are sent immediately */
  HIGH = 'high',
  /** Medium priority messages are batched but sent more frequently */
  MEDIUM = 'medium',
  /** Low priority messages are batched and sent less frequently */
  LOW = 'low',
}

/**
 * Message with metadata
 */
interface QueuedMessage {
  /** The message data */
  data: any;
  /** The message priority */
  priority: MessagePriority;
  /** The timestamp when the message was queued */
  timestamp: number;
  /** The message type */
  type?: string;
}

/**
 * WebSocket batcher options
 */
export interface WebSocketBatcherOptions {
  /** The batch interval in milliseconds for low priority messages */
  lowPriorityInterval?: number;
  /** The batch interval in milliseconds for medium priority messages */
  mediumPriorityInterval?: number;
  /** The maximum batch size */
  maxBatchSize?: number;
  /** Whether to enable compression */
  enableCompression?: boolean;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Function to extract the message type */
  getMessageType?: (message: any) => string | undefined;
  /** Function to compress messages */
  compressMessages?: (messages: any[]) => any;
}

/**
 * WebSocket batcher for batching messages
 */
export class WebSocketBatcher {
  /** The message queue */
  private queue: QueuedMessage[] = [];
  /** The batch interval in milliseconds for low priority messages */
  private lowPriorityInterval: number;
  /** The batch interval in milliseconds for medium priority messages */
  private mediumPriorityInterval: number;
  /** The maximum batch size */
  private maxBatchSize: number;
  /** Whether to enable compression */
  private enableCompression: boolean;
  /** Whether to enable debug logging */
  private debug: boolean;
  /** Function to extract the message type */
  private getMessageType: (message: any) => string | undefined;
  /** Function to compress messages */
  private compressMessages: (messages: any[]) => any;
  /** The timer for low priority messages */
  private lowPriorityTimer: NodeJS.Timeout | null = null;
  /** The timer for medium priority messages */
  private mediumPriorityTimer: NodeJS.Timeout | null = null;
  /** The send function */
  private sendFunction: (message: any) => void;
  /** Whether the batcher is active */
  private active: boolean = false;

  /**
   * Create a new WebSocket batcher
   * @param sendFunction The function to send messages
   * @param options Batcher options
   */
  constructor(sendFunction: (message: any) => void, options: WebSocketBatcherOptions = {}) {
    this.sendFunction = sendFunction;
    this.lowPriorityInterval = options.lowPriorityInterval || 1000; // 1 second
    this.mediumPriorityInterval = options.mediumPriorityInterval || 250; // 250 milliseconds
    this.maxBatchSize = options.maxBatchSize || 50;
    this.enableCompression = options.enableCompression || false;
    this.debug = options.debug || false;
    this.getMessageType = options.getMessageType || ((message) => {
      if (typeof message === 'object' && message !== null && 'type' in message) {
        return message.type as string;
      }
      return undefined;
    });
    this.compressMessages = options.compressMessages || ((messages) => {
      return {
        type: 'batch',
        messages,
      };
    });
  }

  /**
   * Start the batcher
   */
  start(): void {
    if (this.active) {
      return;
    }

    this.active = true;
    this.startTimers();

    if (this.debug) {
      console.log('[WebSocketBatcher] Started');
    }
  }

  /**
   * Stop the batcher
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.stopTimers();

    if (this.debug) {
      console.log('[WebSocketBatcher] Stopped');
    }
  }

  /**
   * Queue a message for sending
   * @param message The message to send
   * @param priority The message priority
   */
  queueMessage(message: any, priority: MessagePriority = MessagePriority.LOW): void {
    if (!this.active) {
      // If the batcher is not active, send the message immediately
      this.sendFunction(message);
      return;
    }

    // Add the message to the queue
    this.queue.push({
      data: message,
      priority,
      timestamp: Date.now(),
      type: this.getMessageType(message),
    });

    if (this.debug) {
      console.log(`[WebSocketBatcher] Queued message with priority ${priority}`, message);
    }

    // If the message is high priority, send it immediately
    if (priority === MessagePriority.HIGH) {
      this.flushHighPriorityMessages();
    }

    // If the queue is full, flush it
    if (this.queue.length >= this.maxBatchSize) {
      this.flushQueue();
    }
  }

  /**
   * Flush the message queue
   */
  flushQueue(): void {
    if (this.queue.length === 0) {
      return;
    }

    // Get all messages from the queue
    const messages = this.queue.map(message => message.data);
    this.queue = [];

    // Send the messages
    this.sendBatch(messages);

    if (this.debug) {
      console.log(`[WebSocketBatcher] Flushed queue with ${messages.length} messages`);
    }
  }

  /**
   * Flush high priority messages
   */
  flushHighPriorityMessages(): void {
    // Get high priority messages
    const highPriorityMessages = this.queue.filter(message => message.priority === MessagePriority.HIGH);
    if (highPriorityMessages.length === 0) {
      return;
    }

    // Remove high priority messages from the queue
    this.queue = this.queue.filter(message => message.priority !== MessagePriority.HIGH);

    // Send high priority messages individually
    highPriorityMessages.forEach(message => {
      this.sendFunction(message.data);
    });

    if (this.debug) {
      console.log(`[WebSocketBatcher] Flushed ${highPriorityMessages.length} high priority messages`);
    }
  }

  /**
   * Flush medium priority messages
   */
  flushMediumPriorityMessages(): void {
    // Get medium and high priority messages
    const priorityMessages = this.queue.filter(message => 
      message.priority === MessagePriority.MEDIUM || message.priority === MessagePriority.HIGH
    );
    if (priorityMessages.length === 0) {
      return;
    }

    // Remove medium and high priority messages from the queue
    this.queue = this.queue.filter(message => 
      message.priority !== MessagePriority.MEDIUM && message.priority !== MessagePriority.HIGH
    );

    // Send the messages
    const messages = priorityMessages.map(message => message.data);
    this.sendBatch(messages);

    if (this.debug) {
      console.log(`[WebSocketBatcher] Flushed ${messages.length} medium/high priority messages`);
    }
  }

  /**
   * Send a batch of messages
   * @param messages The messages to send
   */
  private sendBatch(messages: any[]): void {
    if (messages.length === 0) {
      return;
    }

    if (messages.length === 1) {
      // If there's only one message, send it directly
      this.sendFunction(messages[0]);
    } else if (this.enableCompression) {
      // If compression is enabled, compress the messages
      const compressedMessages = this.compressMessages(messages);
      this.sendFunction(compressedMessages);
    } else {
      // Otherwise, send a batch message
      this.sendFunction({
        type: 'batch',
        messages,
      });
    }
  }

  /**
   * Start the batch timers
   */
  private startTimers(): void {
    // Start the medium priority timer
    this.mediumPriorityTimer = setInterval(() => {
      this.flushMediumPriorityMessages();
    }, this.mediumPriorityInterval);

    // Start the low priority timer
    this.lowPriorityTimer = setInterval(() => {
      this.flushQueue();
    }, this.lowPriorityInterval);
  }

  /**
   * Stop the batch timers
   */
  private stopTimers(): void {
    // Stop the medium priority timer
    if (this.mediumPriorityTimer) {
      clearInterval(this.mediumPriorityTimer);
      this.mediumPriorityTimer = null;
    }

    // Stop the low priority timer
    if (this.lowPriorityTimer) {
      clearInterval(this.lowPriorityTimer);
      this.lowPriorityTimer = null;
    }
  }

  /**
   * Get the current queue size
   * @returns The number of messages in the queue
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get the current queue
   * @returns The message queue
   */
  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}

/**
 * Create a new WebSocket batcher
 * @param sendFunction The function to send messages
 * @param options Batcher options
 * @returns A new WebSocket batcher
 */
export function createWebSocketBatcher(
  sendFunction: (message: any) => void,
  options: WebSocketBatcherOptions = {}
): WebSocketBatcher {
  return new WebSocketBatcher(sendFunction, options);
}