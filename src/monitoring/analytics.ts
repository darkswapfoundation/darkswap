import { logger } from '../utils/logger';

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  name: string;
  timestamp: Date;
  properties: Record<string, any>;
}

/**
 * Analytics options
 */
export interface AnalyticsOptions {
  enabled?: boolean;
  sampleRate?: number;
  maxEvents?: number;
  flushInterval?: number;
  flushSize?: number;
  storageKey?: string;
}

/**
 * Analytics provider
 */
export interface AnalyticsProvider {
  /**
   * Tracks an event
   * @param event Event
   */
  track(event: AnalyticsEvent): Promise<void>;
  
  /**
   * Flushes events
   */
  flush(): Promise<void>;
}

/**
 * Analytics
 */
export class Analytics {
  private options: Required<AnalyticsOptions>;
  private providers: AnalyticsProvider[] = [];
  private events: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  /**
   * Creates a new analytics instance
   * @param options Analytics options
   */
  constructor(options: AnalyticsOptions = {}) {
    this.options = {
      enabled: options.enabled !== undefined ? options.enabled : true,
      sampleRate: options.sampleRate || 1.0,
      maxEvents: options.maxEvents || 1000,
      flushInterval: options.flushInterval || 30000,
      flushSize: options.flushSize || 100,
      storageKey: options.storageKey || 'analytics',
    };
    
    // Start the flush timer
    this.startFlushTimer();
    
    logger.info('Analytics created', { options: this.options });
  }
  
  /**
   * Adds a provider
   * @param provider Provider
   */
  public addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
    
    logger.info('Analytics provider added');
  }
  
  /**
   * Removes a provider
   * @param provider Provider
   */
  public removeProvider(provider: AnalyticsProvider): void {
    const index = this.providers.indexOf(provider);
    
    if (index !== -1) {
      this.providers.splice(index, 1);
      
      logger.info('Analytics provider removed');
    }
  }
  
  /**
   * Tracks an event
   * @param name Event name
   * @param properties Event properties
   */
  public track(name: string, properties: Record<string, any> = {}): void {
    try {
      // If analytics is disabled, return
      if (!this.options.enabled) {
        return;
      }
      
      // If the sample rate is less than 1, randomly skip events
      if (this.options.sampleRate < 1 && Math.random() > this.options.sampleRate) {
        return;
      }
      
      // Create the event
      const event: AnalyticsEvent = {
        name,
        timestamp: new Date(),
        properties,
      };
      
      // Add the event to the queue
      this.events.push(event);
      
      // If the queue is full, flush it
      if (this.events.length >= this.options.flushSize) {
        this.flush();
      }
      
      logger.debug('Analytics event tracked', { name, properties });
    } catch (error) {
      logger.error('Error tracking analytics event', error);
    }
  }
  
  /**
   * Flushes events
   */
  public async flush(): Promise<void> {
    try {
      // If there are no events, return
      if (this.events.length === 0) {
        return;
      }
      
      // Get the events
      const events = [...this.events];
      
      // Clear the events
      this.events = [];
      
      // Track the events with each provider
      await Promise.all(
        this.providers.map(async (provider) => {
          try {
            // Track each event
            for (const event of events) {
              await provider.track(event);
            }
            
            // Flush the provider
            await provider.flush();
          } catch (error) {
            logger.error('Error tracking analytics events with provider', error);
          }
        })
      );
      
      logger.debug('Analytics events flushed', { count: events.length });
    } catch (error) {
      logger.error('Error flushing analytics events', error);
    }
  }
  
  /**
   * Starts the flush timer
   */
  private startFlushTimer(): void {
    // If the flush interval is 0, don't start the timer
    if (this.options.flushInterval === 0) {
      return;
    }
    
    // Start the timer
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
    
    // Ensure the timer doesn't prevent the process from exiting
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }
  
  /**
   * Stops the flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  /**
   * Gets the options
   * @returns Options
   */
  public getOptions(): Required<AnalyticsOptions> {
    return this.options;
  }
  
  /**
   * Sets the options
   * @param options Options
   */
  public setOptions(options: Partial<AnalyticsOptions>): void {
    // Update the options
    this.options = {
      ...this.options,
      ...options,
    };
    
    // Restart the flush timer
    this.stopFlushTimer();
    this.startFlushTimer();
    
    logger.info('Analytics options updated', { options: this.options });
  }
  
  /**
   * Enables analytics
   */
  public enable(): void {
    this.options.enabled = true;
    
    logger.info('Analytics enabled');
  }
  
  /**
   * Disables analytics
   */
  public disable(): void {
    this.options.enabled = false;
    
    logger.info('Analytics disabled');
  }
  
  /**
   * Checks if analytics is enabled
   * @returns Whether analytics is enabled
   */
  public isEnabled(): boolean {
    return this.options.enabled;
  }
  
  /**
   * Gets the providers
   * @returns Providers
   */
  public getProviders(): AnalyticsProvider[] {
    return this.providers;
  }
  
  /**
   * Gets the events
   * @returns Events
   */
  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }
  
  /**
   * Clears the events
   */
  public clearEvents(): void {
    this.events = [];
    
    logger.info('Analytics events cleared');
  }
  
  /**
   * Disposes the analytics instance
   */
  public dispose(): void {
    // Stop the flush timer
    this.stopFlushTimer();
    
    // Flush the events
    this.flush();
    
    // Clear the providers
    this.providers = [];
    
    logger.info('Analytics disposed');
  }
}

/**
 * Creates a new analytics instance
 * @param options Analytics options
 * @returns Analytics instance
 */
export function createAnalytics(options?: AnalyticsOptions): Analytics {
  return new Analytics(options);
}

/**
 * Console analytics provider
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  /**
   * Tracks an event
   * @param event Event
   */
  public async track(event: AnalyticsEvent): Promise<void> {
    console.log('Analytics event:', event);
  }
  
  /**
   * Flushes events
   */
  public async flush(): Promise<void> {
    // Nothing to do
  }
}

/**
 * Creates a new console analytics provider
 * @returns Console analytics provider
 */
export function createConsoleAnalyticsProvider(): ConsoleAnalyticsProvider {
  return new ConsoleAnalyticsProvider();
}