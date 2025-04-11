import { WebSocketServer } from '../websocket';
import { logger } from '../utils/logger';

/**
 * WebSocket metrics
 */
export interface WebSocketMetrics {
  connections: {
    current: number;
    total: number;
    peak: number;
  };
  messages: {
    sent: number;
    received: number;
  };
  subscriptions: {
    current: number;
    total: number;
    peak: number;
  };
  errors: {
    connection: number;
    authentication: number;
    subscription: number;
    message: number;
  };
  latency: {
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  uptime: number;
  startTime: Date;
}

/**
 * WebSocket metrics collector
 */
export class WebSocketMetricsCollector {
  private webSocketServer: WebSocketServer;
  private metrics: WebSocketMetrics;
  private latencySamples: number[] = [];
  private maxLatencySamples: number;
  
  /**
   * Creates a new WebSocket metrics collector
   * @param webSocketServer WebSocket server
   * @param options Options
   */
  constructor(
    webSocketServer: WebSocketServer,
    options: {
      maxLatencySamples?: number;
    } = {}
  ) {
    this.webSocketServer = webSocketServer;
    this.maxLatencySamples = options.maxLatencySamples || 1000;
    
    // Initialize metrics
    this.metrics = {
      connections: {
        current: 0,
        total: 0,
        peak: 0,
      },
      messages: {
        sent: 0,
        received: 0,
      },
      subscriptions: {
        current: 0,
        total: 0,
        peak: 0,
      },
      errors: {
        connection: 0,
        authentication: 0,
        subscription: 0,
        message: 0,
      },
      latency: {
        average: 0,
        min: 0,
        max: 0,
        samples: 0,
      },
      uptime: 0,
      startTime: new Date(),
    };
    
    // Set up event handlers
    this.setupEventHandlers();
    
    logger.info('WebSocket metrics collector created');
  }
  
  /**
   * Sets up event handlers
   */
  private setupEventHandlers(): void {
    const io = this.webSocketServer.getIO();
    
    // Handle connection
    io.on('connection', (socket) => {
      // Increment connection metrics
      this.metrics.connections.current++;
      this.metrics.connections.total++;
      this.metrics.connections.peak = Math.max(
        this.metrics.connections.peak,
        this.metrics.connections.current
      );
      
      // Handle disconnection
      socket.on('disconnect', () => {
        // Decrement connection metrics
        this.metrics.connections.current--;
        
        // Get the client
        const client = Array.from(this.webSocketServer.clients.values()).find(
          (client) => client.id === socket.id
        );
        
        // If the client exists, decrement subscription metrics
        if (client) {
          this.metrics.subscriptions.current -= client.subscriptions.length;
        }
      });
      
      // Handle error
      socket.on('error', () => {
        // Increment error metrics
        this.metrics.errors.connection++;
      });
      
      // Handle authentication
      socket.on('authentication_success', () => {
        // No metrics to update
      });
      
      socket.on('authentication_failure', () => {
        // Increment error metrics
        this.metrics.errors.authentication++;
      });
      
      // Handle subscription
      socket.on('subscribe', () => {
        // Increment subscription metrics
        this.metrics.subscriptions.current++;
        this.metrics.subscriptions.total++;
        this.metrics.subscriptions.peak = Math.max(
          this.metrics.subscriptions.peak,
          this.metrics.subscriptions.current
        );
      });
      
      socket.on('unsubscribe', () => {
        // Decrement subscription metrics
        this.metrics.subscriptions.current--;
      });
      
      socket.on('subscription_failure', () => {
        // Increment error metrics
        this.metrics.errors.subscription++;
      });
      
      // Handle messages
      socket.onAny(() => {
        // Increment message metrics
        this.metrics.messages.received++;
      });
      
      // Add middleware to track latency
      socket.use((packet, next) => {
        // Get the start time
        const startTime = Date.now();
        
        // Call the next middleware
        next();
        
        // Calculate the latency
        const latency = Date.now() - startTime;
        
        // Add the latency sample
        this.addLatencySample(latency);
      });
    });
    
    // Monkey patch the emit method to track sent messages
    const originalEmit = io.emit;
    io.emit = (...args: any[]) => {
      // Increment message metrics
      this.metrics.messages.sent++;
      
      // Call the original emit method
      return originalEmit.apply(io, args);
    };
  }
  
  /**
   * Adds a latency sample
   * @param latency Latency
   */
  private addLatencySample(latency: number): void {
    // Add the latency sample
    this.latencySamples.push(latency);
    
    // If we have too many samples, remove the oldest one
    if (this.latencySamples.length > this.maxLatencySamples) {
      this.latencySamples.shift();
    }
    
    // Calculate the average latency
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    const average = sum / this.latencySamples.length;
    
    // Calculate the min and max latency
    const min = Math.min(...this.latencySamples);
    const max = Math.max(...this.latencySamples);
    
    // Update the latency metrics
    this.metrics.latency.average = average;
    this.metrics.latency.min = min;
    this.metrics.latency.max = max;
    this.metrics.latency.samples = this.latencySamples.length;
  }
  
  /**
   * Gets the metrics
   * @returns Metrics
   */
  public getMetrics(): WebSocketMetrics {
    // Calculate the uptime
    this.metrics.uptime = Date.now() - this.metrics.startTime.getTime();
    
    return this.metrics;
  }
  
  /**
   * Resets the metrics
   */
  public resetMetrics(): void {
    // Reset the metrics
    this.metrics = {
      connections: {
        current: 0,
        total: 0,
        peak: 0,
      },
      messages: {
        sent: 0,
        received: 0,
      },
      subscriptions: {
        current: 0,
        total: 0,
        peak: 0,
      },
      errors: {
        connection: 0,
        authentication: 0,
        subscription: 0,
        message: 0,
      },
      latency: {
        average: 0,
        min: 0,
        max: 0,
        samples: 0,
      },
      uptime: 0,
      startTime: new Date(),
    };
    
    // Reset the latency samples
    this.latencySamples = [];
    
    logger.info('WebSocket metrics reset');
  }
}

/**
 * Creates a new WebSocket metrics collector
 * @param webSocketServer WebSocket server
 * @param options Options
 * @returns WebSocket metrics collector
 */
export function createWebSocketMetricsCollector(
  webSocketServer: WebSocketServer,
  options?: {
    maxLatencySamples?: number;
  }
): WebSocketMetricsCollector {
  return new WebSocketMetricsCollector(webSocketServer, options);
}