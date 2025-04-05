/**
 * WebSocket batching utilities for DarkSwap
 * 
 * This module provides utilities for batching WebSocket messages to improve performance.
 */

/**
 * WebSocket batcher class
 */
export class WebSocketBatcher {
  /**
   * Create a new WebSocket batcher
   * @param {WebSocket|Object} socket - WebSocket instance or object with send method
   * @param {Object} options - Batcher options
   * @param {number} options.batchInterval - Batch interval in milliseconds
   * @param {number} options.maxBatchSize - Maximum batch size
   * @param {boolean} options.useCompression - Whether to compress batched messages
   * @param {string[]} options.noBatchTypes - Message types that should not be batched
   */
  constructor(socket, options = {}) {
    this.socket = socket;
    this.options = {
      batchInterval: 50, // 50ms
      maxBatchSize: 100, // 100 messages
      useCompression: false,
      noBatchTypes: ['ping', 'pong', 'auth', 'error'],
      ...options
    };
    
    // Message queue
    this.queue = [];
    
    // Priority queue for urgent messages
    this.priorityQueue = [];
    
    // Batch timer
    this.batchTimer = null;
    
    // Original send method
    this.originalSend = socket.send;
    
    // Replace send method
    this.replaceSendMethod();
  }
  
  /**
   * Replace the socket's send method with our batched version
   */
  replaceSendMethod() {
    const self = this;
    
    // Store original send method
    const originalSend = this.socket.send;
    
    // Replace send method
    this.socket.send = function(message, options = {}) {
      return self.send(message, options);
    };
    
    // Store original send method for later use
    this.originalSend = originalSend.bind(this.socket);
  }
  
  /**
   * Send a message
   * @param {string|Object} message - Message to send
   * @param {Object} options - Send options
   * @param {boolean} options.immediate - Whether to send immediately
   * @param {number} options.priority - Message priority (higher = more urgent)
   * @returns {Promise<void>} Promise that resolves when the message is sent
   */
  send(message, options = {}) {
    const { immediate = false, priority = 0 } = options;
    
    // Parse message if it's a string
    let parsedMessage;
    if (typeof message === 'string') {
      try {
        parsedMessage = JSON.parse(message);
      } catch (error) {
        // Not JSON, send as is
        parsedMessage = { type: 'raw', data: message };
      }
    } else {
      parsedMessage = message;
    }
    
    // Check if message should be batched
    const shouldBatch = !immediate && 
      parsedMessage.type && 
      !this.options.noBatchTypes.includes(parsedMessage.type);
    
    // Send immediately if needed
    if (!shouldBatch) {
      return this.sendImmediate(message);
    }
    
    // Add to priority queue if priority is set
    if (priority > 0) {
      this.priorityQueue.push({ message: parsedMessage, priority });
      this.priorityQueue.sort((a, b) => b.priority - a.priority);
      
      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.startBatchTimer();
      }
      
      return Promise.resolve();
    }
    
    // Add to regular queue
    this.queue.push(parsedMessage);
    
    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.startBatchTimer();
    }
    
    return Promise.resolve();
  }
  
  /**
   * Send a message immediately
   * @param {string|Object} message - Message to send
   * @returns {Promise<void>} Promise that resolves when the message is sent
   */
  sendImmediate(message) {
    return new Promise((resolve, reject) => {
      try {
        // Convert to string if needed
        const stringMessage = typeof message === 'string' 
          ? message 
          : JSON.stringify(message);
        
        // Send message
        this.originalSend(stringMessage);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Start the batch timer
   */
  startBatchTimer() {
    this.batchTimer = setTimeout(() => {
      this.sendBatch();
    }, this.options.batchInterval);
  }
  
  /**
   * Send the current batch
   */
  sendBatch() {
    // Clear timer
    this.batchTimer = null;
    
    // Check if there are messages to send
    if (this.queue.length === 0 && this.priorityQueue.length === 0) {
      return;
    }
    
    // Process priority queue first
    const priorityMessages = this.priorityQueue.map(item => item.message);
    this.priorityQueue = [];
    
    // Get messages from regular queue
    const regularMessages = this.queue.splice(0, this.options.maxBatchSize - priorityMessages.length);
    
    // Combine messages
    const messages = [...priorityMessages, ...regularMessages];
    
    // Create batch message
    const batchMessage = {
      type: 'batch',
      messages,
      count: messages.length,
      timestamp: Date.now()
    };
    
    // Send batch
    this.sendImmediate(batchMessage)
      .catch(error => {
        console.error('Error sending batch:', error);
        
        // Re-queue messages on error
        this.queue = [...messages, ...this.queue];
        
        // Restart batch timer
        if (!this.batchTimer) {
          this.startBatchTimer();
        }
      });
    
    // Start a new batch timer if there are more messages
    if (this.queue.length > 0) {
      this.startBatchTimer();
    }
  }
  
  /**
   * Flush all queued messages
   * @returns {Promise<void>} Promise that resolves when all messages are sent
   */
  async flush() {
    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Send all messages
    await this.sendBatch();
  }
  
  /**
   * Restore the original send method
   */
  restore() {
    // Flush queued messages
    this.flush();
    
    // Restore original send method
    this.socket.send = this.originalSend;
  }
}

/**
 * Enhance a WebSocket with batching capabilities
 * @param {WebSocket|Object} socket - WebSocket instance or object with send method
 * @param {Object} options - Batcher options
 * @returns {WebSocketBatcher} WebSocket batcher instance
 */
export const enhanceWebSocketWithBatching = (socket, options = {}) => {
  return new WebSocketBatcher(socket, options);
};

/**
 * Create a batched WebSocket
 * @param {string} url - WebSocket URL
 * @param {Object} options - WebSocket options
 * @param {Object} batchOptions - Batcher options
 * @returns {WebSocket} WebSocket instance with batching
 */
export const createBatchedWebSocket = (url, options = {}, batchOptions = {}) => {
  // Create WebSocket
  const socket = new WebSocket(url, options);
  
  // Enhance with batching
  enhanceWebSocketWithBatching(socket, batchOptions);
  
  return socket;
};

/**
 * Message compression utilities
 */
export const MessageCompression = {
  /**
   * Compress a message
   * @param {Object} message - Message to compress
   * @returns {Object} Compressed message
   */
  compress(message) {
    // Simple compression for demo purposes
    // In production, use a proper compression algorithm
    
    // Convert message to string
    const str = JSON.stringify(message);
    
    // Return compressed message
    return {
      type: 'compressed',
      data: str, // In a real implementation, this would be compressed
      originalSize: str.length,
      compressedSize: str.length // In a real implementation, this would be the compressed size
    };
  },
  
  /**
   * Decompress a message
   * @param {Object} message - Compressed message
   * @returns {Object} Decompressed message
   */
  decompress(message) {
    // Simple decompression for demo purposes
    // In production, use a proper decompression algorithm
    
    // Check if message is compressed
    if (message.type !== 'compressed') {
      return message;
    }
    
    // Parse decompressed data
    return JSON.parse(message.data);
  }
};