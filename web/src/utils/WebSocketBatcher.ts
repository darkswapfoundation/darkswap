/**
 * WebSocketBatcher - Utility for batching WebSocket messages
 * 
 * This utility provides a way to batch multiple WebSocket messages together
 * to reduce the number of WebSocket frames sent, improving performance
 * especially for high-frequency updates.
 */

export interface BatchOptions {
  /** Maximum batch size in bytes (default: 1MB) */
  maxBatchSize?: number;
  /** Maximum delay before sending a batch (default: 50ms) */
  maxDelay?: number;
  /** Whether to compress batches (default: true) */
  compress?: boolean;
  /** Minimum number of messages to batch (default: 2) */
  minBatchSize?: number;
  /** Maximum number of messages to batch (default: 100) */
  maxBatchMessages?: number;
  /** Whether to automatically flush on window blur (default: true) */
  flushOnBlur?: boolean;
  /** Whether to prioritize certain message types (default: false) */
  prioritize?: boolean;
}

export interface BatchStats {
  /** Total number of messages sent */
  totalMessages: number;
  /** Total number of batches sent */
  totalBatches: number;
  /** Average batch size in messages */
  avgBatchSize: number;
  /** Average batch size in bytes */
  avgBatchBytes: number;
  /** Total bytes sent */
  totalBytes: number;
  /** Total bytes saved by batching */
  bytesSaved: number;
  /** Average latency introduced by batching in ms */
  avgLatency: number;
}

export interface BatchedMessage {
  /** Message type */
  type: string;
  /** Message payload */
  payload: any;
  /** Message priority (higher = more important) */
  priority?: number;
  /** Message ID */
  id?: string;
  /** Timestamp when the message was queued */
  timestamp: number;
}

export interface MessageBatch {
  /** Batch ID */
  batchId: string;
  /** Messages in the batch */
  messages: BatchedMessage[];
  /** Timestamp when the batch was created */
  timestamp: number;
  /** Whether the batch is compressed */
  compressed: boolean;
}

/**
 * WebSocketBatcher class for batching WebSocket messages
 */
export class WebSocketBatcher {
  private socket: WebSocket | null = null;
  private queue: BatchedMessage[] = [];
  private timer: NodeJS.Timeout | null = null;
  private options: Required<BatchOptions>;
  private stats: BatchStats = {
    totalMessages: 0,
    totalBatches: 0,
    avgBatchSize: 0,
    avgBatchBytes: 0,
    totalBytes: 0,
    bytesSaved: 0,
    avgLatency: 0,
  };
  private latencySum = 0;
  private isConnected = false;
  private messageCounter = 0;

  /**
   * Create a new WebSocketBatcher instance
   * @param options Batch options
   */
  constructor(options: BatchOptions = {}) {
    this.options = {
      maxBatchSize: options.maxBatchSize ?? 1024 * 1024, // 1MB
      maxDelay: options.maxDelay ?? 50, // 50ms
      compress: options.compress ?? true,
      minBatchSize: options.minBatchSize ?? 2,
      maxBatchMessages: options.maxBatchMessages ?? 100,
      flushOnBlur: options.flushOnBlur ?? true,
      prioritize: options.prioritize ?? false,
    };

    // Set up event listeners for window blur
    if (this.options.flushOnBlur && typeof window !== 'undefined') {
      window.addEventListener('blur', this.flush.bind(this));
    }
  }

  /**
   * Connect to a WebSocket
   * @param socket WebSocket instance
   */
  public connect(socket: WebSocket): void {
    this.socket = socket;
    this.isConnected = socket.readyState === WebSocket.OPEN;

    // Set up event listeners
    socket.addEventListener('open', () => {
      this.isConnected = true;
      this.flush();
    });

    socket.addEventListener('close', () => {
      this.isConnected = false;
    });
  }

  /**
   * Send a message through the WebSocket
   * @param type Message type
   * @param payload Message payload
   * @param priority Message priority (higher = more important)
   * @returns Promise that resolves when the message is sent
   */
  public send(type: string, payload: any, priority = 0): Promise<void> {
    return new Promise((resolve) => {
      const message: BatchedMessage = {
        type,
        payload,
        priority,
        id: `msg_${++this.messageCounter}`,
        timestamp: Date.now(),
      };

      // Add message to queue
      this.queue.push(message);

      // Start timer if not already running
      if (!this.timer) {
        this.timer = setTimeout(() => this.processBatch(), this.options.maxDelay);
      }

      // Process batch immediately if conditions are met
      if (
        this.queue.length >= this.options.maxBatchMessages ||
        this.estimateBatchSize() >= this.options.maxBatchSize
      ) {
        this.processBatch();
      }

      // Resolve immediately, actual sending happens asynchronously
      resolve();
    });
  }

  /**
   * Flush the queue immediately
   */
  public flush(): void {
    if (this.queue.length > 0) {
      this.processBatch();
    }
  }

  /**
   * Get batch statistics
   * @returns Batch statistics
   */
  public getStats(): BatchStats {
    return { ...this.stats };
  }

  /**
   * Reset batch statistics
   */
  public resetStats(): void {
    this.stats = {
      totalMessages: 0,
      totalBatches: 0,
      avgBatchSize: 0,
      avgBatchBytes: 0,
      totalBytes: 0,
      bytesSaved: 0,
      avgLatency: 0,
    };
    this.latencySum = 0;
  }

  /**
   * Process the current batch of messages
   */
  private processBatch(): void {
    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Skip if queue is empty or socket is not connected
    if (this.queue.length === 0 || !this.socket || !this.isConnected) {
      return;
    }

    // Skip batching if only one message and below min batch size
    if (this.queue.length === 1 && this.options.minBatchSize > 1) {
      // Start timer again
      this.timer = setTimeout(() => this.processBatch(), this.options.maxDelay);
      return;
    }

    // Sort by priority if enabled
    if (this.options.prioritize) {
      this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    // Create batch
    const batch: MessageBatch = {
      batchId: `batch_${Date.now()}`,
      messages: [...this.queue],
      timestamp: Date.now(),
      compressed: this.options.compress,
    };

    // Clear queue
    this.queue = [];

    // Send batch
    this.sendBatch(batch);
  }

  /**
   * Send a batch of messages
   * @param batch Message batch
   */
  private sendBatch(batch: MessageBatch): void {
    if (!this.socket || !this.isConnected) {
      // Re-queue messages if socket is not connected
      this.queue = [...this.queue, ...batch.messages];
      return;
    }

    // Calculate batch size
    const batchJson = JSON.stringify(batch);
    const batchSize = batchJson.length;

    // Compress if enabled
    let dataToSend: string | Uint8Array = batchJson;
    if (this.options.compress && typeof TextEncoder !== 'undefined' && typeof CompressionStream !== 'undefined') {
      // This is a simplified example - in a real implementation, you would use
      // the Compression Streams API or a library like pako to compress the data
      const encoder = new TextEncoder();
      dataToSend = encoder.encode(batchJson);
      // In a real implementation, you would compress dataToSend here
    }

    // Send batch
    try {
      this.socket.send(dataToSend);

      // Update stats
      const now = Date.now();
      const messageCount = batch.messages.length;
      const totalLatency = batch.messages.reduce((sum, msg) => sum + (now - msg.timestamp), 0);
      const avgLatency = totalLatency / messageCount;

      this.stats.totalMessages += messageCount;
      this.stats.totalBatches += 1;
      this.stats.totalBytes += batchSize;
      this.latencySum += totalLatency;
      this.stats.avgLatency = this.latencySum / this.stats.totalMessages;
      this.stats.avgBatchSize = this.stats.totalMessages / this.stats.totalBatches;
      this.stats.avgBatchBytes = this.stats.totalBytes / this.stats.totalBatches;

      // Calculate bytes saved (assuming each message would have its own overhead)
      const overhead = 20; // Estimated overhead per message in bytes
      const bytesSaved = (messageCount - 1) * overhead;
      this.stats.bytesSaved += bytesSaved;
    } catch (error) {
      console.error('Error sending batch:', error);
      // Re-queue messages on error
      this.queue = [...this.queue, ...batch.messages];
    }
  }

  /**
   * Estimate the current batch size in bytes
   * @returns Estimated batch size in bytes
   */
  private estimateBatchSize(): number {
    if (this.queue.length === 0) {
      return 0;
    }

    // Create a sample batch to estimate size
    const sampleBatch: MessageBatch = {
      batchId: 'sample',
      messages: this.queue,
      timestamp: Date.now(),
      compressed: false,
    };

    // Estimate size
    return JSON.stringify(sampleBatch).length;
  }

  /**
   * Disconnect from the WebSocket
   */
  public disconnect(): void {
    // Flush any remaining messages
    this.flush();

    // Remove event listeners
    if (this.options.flushOnBlur && typeof window !== 'undefined') {
      window.removeEventListener('blur', this.flush.bind(this));
    }

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Clear socket
    this.socket = null;
    this.isConnected = false;
  }
}

// Export singleton instance
export default new WebSocketBatcher();