/**
 * CircuitBreaker.ts - Circuit breaker pattern implementation
 * 
 * This file provides a circuit breaker pattern implementation for protecting
 * against cascading failures in distributed systems.
 */

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  /**
   * Circuit is closed, allowing requests to pass through
   */
  CLOSED = 'CLOSED',
  
  /**
   * Circuit is open, blocking requests
   */
  OPEN = 'OPEN',
  
  /**
   * Circuit is half-open, allowing a limited number of requests to pass through
   */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /**
   * Failure threshold before opening the circuit
   */
  failureThreshold: number;
  
  /**
   * Success threshold before closing the circuit
   */
  successThreshold: number;
  
  /**
   * Timeout before transitioning from open to half-open
   */
  resetTimeout: number;
  
  /**
   * Maximum number of requests allowed in half-open state
   */
  maxHalfOpenRequests?: number;
  
  /**
   * Callback when circuit state changes
   */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
  
  /**
   * Callback when a failure occurs
   */
  onFailure?: (error: Error, failureCount: number) => void;
  
  /**
   * Callback when a success occurs
   */
  onSuccess?: (successCount: number) => void;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  /**
   * Current state
   */
  state: CircuitBreakerState;
  
  /**
   * Failure count
   */
  failureCount: number;
  
  /**
   * Success count
   */
  successCount: number;
  
  /**
   * Total count
   */
  totalCount: number;
  
  /**
   * Error percentage
   */
  errorPercentage: number;
  
  /**
   * Last failure time
   */
  lastFailureTime: number | null;
  
  /**
   * Last success time
   */
  lastSuccessTime: number | null;
  
  /**
   * Last state change time
   */
  lastStateChangeTime: number | null;
}

/**
 * Circuit breaker
 * 
 * This class implements the circuit breaker pattern for protecting against
 * cascading failures in distributed systems.
 */
export class CircuitBreaker {
  /**
   * Circuit name
   */
  private name: string;
  
  /**
   * Circuit options
   */
  private options: CircuitBreakerOptions;
  
  /**
   * Current state
   */
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  
  /**
   * Failure count
   */
  private failureCount: number = 0;
  
  /**
   * Success count
   */
  private successCount: number = 0;
  
  /**
   * Total count
   */
  private totalCount: number = 0;
  
  /**
   * Last failure time
   */
  private lastFailureTime: number | null = null;
  
  /**
   * Last success time
   */
  private lastSuccessTime: number | null = null;
  
  /**
   * Last state change time
   */
  private lastStateChangeTime: number | null = null;
  
  /**
   * Half-open request count
   */
  private halfOpenRequestCount: number = 0;
  
  /**
   * Reset timeout ID
   */
  private resetTimeoutId: NodeJS.Timeout | null = null;
  
  /**
   * Constructor
   * @param name - Circuit name
   * @param options - Circuit options
   */
  constructor(name: string, options: CircuitBreakerOptions) {
    this.name = name;
    this.options = {
      ...{
        failureThreshold: 5,
        successThreshold: 3,
        resetTimeout: 30000,
        maxHalfOpenRequests: 1,
      },
      ...options,
    };
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param fn - Function to execute
   * @returns Promise that resolves to the result of the function
   * @throws Error if the circuit is open or the function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      // Check if reset timeout has elapsed
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        // Transition to half-open state
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      } else {
        // Circuit is open, throw error
        throw new Error(`Circuit ${this.name} is open`);
      }
    }
    
    // Check if circuit is half-open and too many requests are in progress
    if (
      this.state === CircuitBreakerState.HALF_OPEN &&
      this.halfOpenRequestCount >= (this.options.maxHalfOpenRequests || 1)
    ) {
      // Circuit is half-open and too many requests are in progress, throw error
      throw new Error(`Circuit ${this.name} is half-open and at capacity`);
    }
    
    // Increment half-open request count
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenRequestCount++;
    }
    
    // Increment total count
    this.totalCount++;
    
    try {
      // Execute function
      const result = await fn();
      
      // Decrement half-open request count
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.halfOpenRequestCount--;
      }
      
      // Handle success
      this.handleSuccess();
      
      return result;
    } catch (error) {
      // Decrement half-open request count
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.halfOpenRequestCount--;
      }
      
      // Handle failure
      this.handleFailure(error instanceof Error ? error : new Error(String(error)));
      
      // Rethrow error
      throw error;
    }
  }
  
  /**
   * Handle success
   */
  private handleSuccess(): void {
    // Update success count
    this.successCount++;
    
    // Update last success time
    this.lastSuccessTime = Date.now();
    
    // Call onSuccess callback
    if (this.options.onSuccess) {
      this.options.onSuccess(this.successCount);
    }
    
    // Check if circuit is half-open and success threshold has been reached
    if (
      this.state === CircuitBreakerState.HALF_OPEN &&
      this.successCount >= this.options.successThreshold
    ) {
      // Transition to closed state
      this.transitionTo(CircuitBreakerState.CLOSED);
    }
  }
  
  /**
   * Handle failure
   * @param error - Error
   */
  private handleFailure(error: Error): void {
    // Update failure count
    this.failureCount++;
    
    // Update last failure time
    this.lastFailureTime = Date.now();
    
    // Call onFailure callback
    if (this.options.onFailure) {
      this.options.onFailure(error, this.failureCount);
    }
    
    // Check if circuit is closed and failure threshold has been reached
    if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failureCount >= this.options.failureThreshold
    ) {
      // Transition to open state
      this.transitionTo(CircuitBreakerState.OPEN);
      
      // Set reset timeout
      this.resetTimeoutId = setTimeout(() => {
        // Transition to half-open state
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      }, this.options.resetTimeout);
    }
    
    // Check if circuit is half-open
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Transition to open state
      this.transitionTo(CircuitBreakerState.OPEN);
      
      // Set reset timeout
      this.resetTimeoutId = setTimeout(() => {
        // Transition to half-open state
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      }, this.options.resetTimeout);
    }
  }
  
  /**
   * Transition to a new state
   * @param newState - New state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    // Check if state is changing
    if (this.state === newState) {
      return;
    }
    
    // Get old state
    const oldState = this.state;
    
    // Update state
    this.state = newState;
    
    // Update last state change time
    this.lastStateChangeTime = Date.now();
    
    // Reset counters
    if (newState === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenRequestCount = 0;
    } else if (newState === CircuitBreakerState.HALF_OPEN) {
      this.successCount = 0;
      this.halfOpenRequestCount = 0;
    }
    
    // Clear reset timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    // Call onStateChange callback
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }
  
  /**
   * Get circuit state
   * @returns Circuit state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }
  
  /**
   * Get circuit statistics
   * @returns Circuit statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCount: this.totalCount,
      errorPercentage: this.totalCount > 0 ? (this.failureCount / this.totalCount) * 100 : 0,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChangeTime: this.lastStateChangeTime,
    };
  }
  
  /**
   * Reset circuit
   */
  reset(): void {
    // Transition to closed state
    this.transitionTo(CircuitBreakerState.CLOSED);
  }
  
  /**
   * Force circuit open
   */
  forceOpen(): void {
    // Transition to open state
    this.transitionTo(CircuitBreakerState.OPEN);
  }
  
  /**
   * Force circuit closed
   */
  forceClosed(): void {
    // Transition to closed state
    this.transitionTo(CircuitBreakerState.CLOSED);
  }
}

/**
 * Circuit breaker registry
 * 
 * This class provides a registry for circuit breakers.
 */
export class CircuitBreakerRegistry {
  /**
   * Circuit breakers
   */
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  
  /**
   * Get or create a circuit breaker
   * @param name - Circuit name
   * @param options - Circuit options
   * @returns Circuit breaker
   */
  getOrCreate(name: string, options: CircuitBreakerOptions): CircuitBreaker {
    // Check if circuit breaker exists
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name)!;
    }
    
    // Create circuit breaker
    const circuitBreaker = new CircuitBreaker(name, options);
    
    // Add circuit breaker to registry
    this.circuitBreakers.set(name, circuitBreaker);
    
    return circuitBreaker;
  }
  
  /**
   * Get a circuit breaker
   * @param name - Circuit name
   * @returns Circuit breaker or undefined if not found
   */
  get(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }
  
  /**
   * Check if a circuit breaker exists
   * @param name - Circuit name
   * @returns Whether the circuit breaker exists
   */
  has(name: string): boolean {
    return this.circuitBreakers.has(name);
  }
  
  /**
   * Remove a circuit breaker
   * @param name - Circuit name
   * @returns Whether the circuit breaker was removed
   */
  remove(name: string): boolean {
    return this.circuitBreakers.delete(name);
  }
  
  /**
   * Get all circuit breakers
   * @returns All circuit breakers
   */
  getAll(): CircuitBreaker[] {
    return Array.from(this.circuitBreakers.values());
  }
  
  /**
   * Get all circuit breaker names
   * @returns All circuit breaker names
   */
  getAllNames(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }
}

/**
 * Global circuit breaker registry
 */
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Default export
 */
export default CircuitBreaker;