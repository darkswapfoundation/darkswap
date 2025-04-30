/**
 * Metrics utility for DarkSwap
 * 
 * This utility provides metrics collection and reporting for the DarkSwap application.
 */

import { logger } from './logger';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Metric value
 */
export type MetricValue = number | { [label: string]: number };

/**
 * Metric
 */
export interface Metric {
  /**
   * The metric name
   */
  name: string;
  
  /**
   * The metric type
   */
  type: MetricType;
  
  /**
   * The metric description
   */
  description: string;
  
  /**
   * The metric labels
   */
  labels?: string[];
  
  /**
   * The metric value
   */
  value: MetricValue;
}

/**
 * Metrics options
 */
export interface MetricsOptions {
  /**
   * The metrics endpoint URL
   */
  endpoint?: string;
  
  /**
   * The metrics reporting interval in milliseconds
   */
  reportingInterval?: number;
  
  /**
   * Whether to skip metrics in development mode
   */
  skipInDevelopment?: boolean;
}

/**
 * Metrics class
 */
export class Metrics {
  private metrics: Map<string, Metric>;
  private options: MetricsOptions;
  private reportingTimer: NodeJS.Timeout | null = null;
  
  constructor(options: MetricsOptions = {}) {
    this.metrics = new Map();
    this.options = {
      reportingInterval: 60 * 1000, // 1 minute
      skipInDevelopment: true,
      ...options,
    };
    
    // Start the reporting timer if an endpoint is provided
    if (this.options.endpoint) {
      this.startReportingTimer();
    }
  }
  
  /**
   * Register a metric
   * 
   * @param metric The metric to register
   */
  public register(metric: Metric): void {
    this.metrics.set(metric.name, metric);
    
    logger.debug(`Registered metric: ${metric.name}`, { metric });
  }
  
  /**
   * Get a metric
   * 
   * @param name The metric name
   * @returns The metric
   */
  public get(name: string): Metric | undefined {
    return this.metrics.get(name);
  }
  
  /**
   * Set a metric value
   * 
   * @param name The metric name
   * @param value The metric value
   * @param labels The metric labels
   */
  public set(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return;
    }
    
    if (labels && metric.labels) {
      // Convert labels to a string key
      const labelKey = this.getLabelKey(labels);
      
      // Set the value for the labels
      if (typeof metric.value === 'object') {
        metric.value[labelKey] = value;
      } else {
        metric.value = { [labelKey]: value };
      }
    } else {
      // Set the value directly
      metric.value = value;
    }
    
    logger.debug(`Set metric: ${name}`, { value, labels });
  }
  
  /**
   * Increment a counter metric
   * 
   * @param name The metric name
   * @param value The increment value
   * @param labels The metric labels
   */
  public increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return;
    }
    
    if (metric.type !== MetricType.COUNTER) {
      logger.warn(`Metric is not a counter: ${name}`);
      return;
    }
    
    if (labels && metric.labels) {
      // Convert labels to a string key
      const labelKey = this.getLabelKey(labels);
      
      // Increment the value for the labels
      if (typeof metric.value === 'object') {
        metric.value[labelKey] = (metric.value[labelKey] || 0) + value;
      } else {
        metric.value = { [labelKey]: value };
      }
    } else {
      // Increment the value directly
      if (typeof metric.value === 'number') {
        metric.value += value;
      } else {
        metric.value = value;
      }
    }
    
    logger.debug(`Incremented metric: ${name}`, { value, labels });
  }
  
  /**
   * Decrement a counter metric
   * 
   * @param name The metric name
   * @param value The decrement value
   * @param labels The metric labels
   */
  public decrement(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.increment(name, -value, labels);
  }
  
  /**
   * Observe a histogram or summary metric
   * 
   * @param name The metric name
   * @param value The observation value
   * @param labels The metric labels
   */
  public observe(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      logger.warn(`Metric not found: ${name}`);
      return;
    }
    
    if (metric.type !== MetricType.HISTOGRAM && metric.type !== MetricType.SUMMARY) {
      logger.warn(`Metric is not a histogram or summary: ${name}`);
      return;
    }
    
    // For simplicity, we just set the value
    this.set(name, value, labels);
    
    logger.debug(`Observed metric: ${name}`, { value, labels });
  }
  
  /**
   * Start a timer for a histogram or summary metric
   * 
   * @param name The metric name
   * @param labels The metric labels
   * @returns A function to stop the timer and observe the duration
   */
  public startTimer(name: string, labels?: Record<string, string>): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.observe(name, duration, labels);
    };
  }
  
  /**
   * Time a function call
   * 
   * @param name The metric name
   * @param fn The function to time
   * @param labels The metric labels
   * @returns The function result
   */
  public async time<T>(name: string, fn: () => Promise<T> | T, labels?: Record<string, string>): Promise<T> {
    const end = this.startTimer(name, labels);
    
    try {
      const result = await fn();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }
  
  /**
   * Get all metrics
   * 
   * @returns All metrics
   */
  public getAll(): Metric[] {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Report metrics to the endpoint
   */
  public async report(): Promise<void> {
    // Skip reporting in development mode if enabled
    if (this.options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return;
    }
    
    // Skip reporting if no endpoint is provided
    if (!this.options.endpoint) {
      return;
    }
    
    try {
      // Get all metrics
      const metrics = this.getAll();
      
      // Send the metrics to the endpoint
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to report metrics: ${response.statusText}`);
      }
      
      logger.debug('Reported metrics', { count: metrics.length });
    } catch (error) {
      logger.error('Failed to report metrics', { error });
    }
  }
  
  /**
   * Start the reporting timer
   */
  private startReportingTimer(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }
    
    this.reportingTimer = setInterval(() => {
      this.report().catch((error) => {
        logger.error('Failed to report metrics', { error });
      });
    }, this.options.reportingInterval || 60 * 1000);
    
    logger.debug('Started metrics reporting timer', {
      interval: this.options.reportingInterval,
      endpoint: this.options.endpoint,
    });
  }
  
  /**
   * Get a string key for labels
   * 
   * @param labels The labels
   * @returns The label key
   */
  private getLabelKey(labels: Record<string, string>): string {
    return JSON.stringify(labels);
  }
}

/**
 * Create a metrics instance
 * 
 * @param options The metrics options
 * @returns The metrics instance
 */
export function createMetrics(options?: MetricsOptions): Metrics {
  return new Metrics(options);
}

/**
 * Default metrics instance
 */
export const metrics = createMetrics({
  endpoint: process.env.METRICS_ENDPOINT,
  reportingInterval: 60 * 1000, // 1 minute
});

/**
 * Register common metrics
 */
export function registerCommonMetrics(): void {
  // Register API metrics
  metrics.register({
    name: 'api_requests_total',
    type: MetricType.COUNTER,
    description: 'Total number of API requests',
    labels: ['method', 'path', 'status'],
    value: {},
  });
  
  metrics.register({
    name: 'api_request_duration_milliseconds',
    type: MetricType.HISTOGRAM,
    description: 'API request duration in milliseconds',
    labels: ['method', 'path'],
    value: {},
  });
  
  // Register WebSocket metrics
  metrics.register({
    name: 'websocket_connections_total',
    type: MetricType.COUNTER,
    description: 'Total number of WebSocket connections',
    value: 0,
  });
  
  metrics.register({
    name: 'websocket_messages_total',
    type: MetricType.COUNTER,
    description: 'Total number of WebSocket messages',
    labels: ['type', 'direction'],
    value: {},
  });
  
  // Register P2P metrics
  metrics.register({
    name: 'p2p_peers_total',
    type: MetricType.GAUGE,
    description: 'Total number of P2P peers',
    value: 0,
  });
  
  metrics.register({
    name: 'p2p_messages_total',
    type: MetricType.COUNTER,
    description: 'Total number of P2P messages',
    labels: ['type', 'direction'],
    value: {},
  });
  
  // Register order metrics
  metrics.register({
    name: 'orders_total',
    type: MetricType.COUNTER,
    description: 'Total number of orders',
    labels: ['type', 'status'],
    value: {},
  });
  
  // Register trade metrics
  metrics.register({
    name: 'trades_total',
    type: MetricType.COUNTER,
    description: 'Total number of trades',
    labels: ['status'],
    value: {},
  });
  
  // Register wallet metrics
  metrics.register({
    name: 'wallet_transactions_total',
    type: MetricType.COUNTER,
    description: 'Total number of wallet transactions',
    labels: ['type', 'status'],
    value: {},
  });
  
  logger.debug('Registered common metrics');
}

// Register common metrics
registerCommonMetrics();

export default {
  MetricType,
  createMetrics,
  metrics,
  registerCommonMetrics,
};