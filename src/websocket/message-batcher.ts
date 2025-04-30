import { WebSocketServer } from './index';
import { WebSocketEventType, WebSocketChannelType } from './index';
import { logger } from '../utils/logger';

/**
 * Message batch
 */
interface MessageBatch {
  channel: WebSocketChannelType;
  event: WebSocketEventType;
  messages: any[];
  params?: Record<string, string>;
  timestamp: Date;
}

/**
 * Message batcher
 */
export class MessageBatcher {
  private webSocketServer: WebSocketServer;
  private batches: Map<string, MessageBatch> = new Map();
  private batchInterval: number;
  private compressionEnabled: boolean;
  private maxBatchSize: number;
  private timer: NodeJS.Timeout | null = null;
  
  /**
   * Creates a new message batcher
   * @param webSocketServer WebSocket server
   * @param options Options
   */
  constructor(
    webSocketServer: WebSocketServer,
    options: {
      batchInterval?: number;
      compressionEnabled?: boolean;
      maxBatchSize?: number;
    } = {}
  ) {
    this.webSocketServer = webSocketServer;
    this.batchInterval = options.batchInterval || 100;
    this.compressionEnabled = options.compressionEnabled || false;
    this.maxBatchSize = options.maxBatchSize || 100;
    
    logger.info('Message batcher created', {
      batchInterval: this.batchInterval,
      compressionEnabled: this.compressionEnabled,
      maxBatchSize: this.maxBatchSize,
    });
  }
  
  /**
   * Starts the message batcher
   */
  public start(): void {
    if (this.timer) {
      return;
    }
    
    this.timer = setInterval(() => {
      this.publishBatches();
    }, this.batchInterval);
    
    logger.info('Message batcher started');
  }
  
  /**
   * Stops the message batcher
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    logger.info('Message batcher stopped');
  }
  
  /**
   * Adds a message to a batch
   * @param channel Channel
   * @param event Event
   * @param message Message
   * @param params Parameters
   */
  public addMessage(
    channel: WebSocketChannelType,
    event: WebSocketEventType,
    message: any,
    params?: Record<string, string>
  ): void {
    // Get the batch key
    const batchKey = this.getBatchKey(channel, event, params);
    
    // Get the batch
    let batch = this.batches.get(batchKey);
    
    // If the batch doesn't exist, create it
    if (!batch) {
      batch = {
        channel,
        event,
        messages: [],
        params,
        timestamp: new Date(),
      };
      
      this.batches.set(batchKey, batch);
    }
    
    // Add the message to the batch
    batch.messages.push(message);
    
    // If the batch is full, publish it
    if (batch.messages.length >= this.maxBatchSize) {
      this.publishBatch(batchKey, batch);
      this.batches.delete(batchKey);
    }
  }
  
  /**
   * Publishes all batches
   */
  private publishBatches(): void {
    // Publish all batches
    for (const [batchKey, batch] of this.batches.entries()) {
      this.publishBatch(batchKey, batch);
    }
    
    // Clear all batches
    this.batches.clear();
  }
  
  /**
   * Publishes a batch
   * @param batchKey Batch key
   * @param batch Batch
   */
  private publishBatch(batchKey: string, batch: MessageBatch): void {
    try {
      // If the batch is empty, return
      if (batch.messages.length === 0) {
        return;
      }
      
      // Create the batch message
      const batchMessage = {
        messages: batch.messages,
        timestamp: batch.timestamp,
      };
      
      // Compress the batch message if compression is enabled
      const compressedBatchMessage = this.compressionEnabled
        ? this.compressBatchMessage(batchMessage)
        : batchMessage;
      
      // Publish the batch message
      this.webSocketServer.publish(
        batch.channel,
        batch.event,
        compressedBatchMessage,
        batch.params
      );
      
      logger.debug('Published batch', {
        channel: batch.channel,
        event: batch.event,
        params: batch.params,
        messageCount: batch.messages.length,
        compressed: this.compressionEnabled,
      });
    } catch (error) {
      logger.error('Error publishing batch', error);
    }
  }
  
  /**
   * Gets the batch key
   * @param channel Channel
   * @param event Event
   * @param params Parameters
   * @returns Batch key
   */
  private getBatchKey(
    channel: WebSocketChannelType,
    event: WebSocketEventType,
    params?: Record<string, string>
  ): string {
    return `${channel}:${event}:${params ? JSON.stringify(params) : ''}`;
  }
  
  /**
   * Compresses a batch message
   * @param batchMessage Batch message
   * @returns Compressed batch message
   */
  private compressBatchMessage(batchMessage: any): any {
    try {
      // In a real implementation, this would compress the batch message
      // For this example, we'll just return the batch message
      return batchMessage;
    } catch (error) {
      logger.error('Error compressing batch message', error);
      return batchMessage;
    }
  }
}

/**
 * Creates a new message batcher
 * @param webSocketServer WebSocket server
 * @param options Options
 * @returns Message batcher
 */
export function createMessageBatcher(
  webSocketServer: WebSocketServer,
  options?: {
    batchInterval?: number;
    compressionEnabled?: boolean;
    maxBatchSize?: number;
  }
): MessageBatcher {
  return new MessageBatcher(webSocketServer, options);
}