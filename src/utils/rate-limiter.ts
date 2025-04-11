/**
 * Rate limiter utility for DarkSwap
 * 
 * This utility provides a rate limiter for the DarkSwap application.
 */

import { logger } from './logger';

/**
 * Rate limiter options
 */
export interface RateLimiterOptions {
  /**
   * The maximum number of requests allowed in the time window
   */
  limit: number;
  
  /**
   * The time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Whether to skip the rate limiter in development mode
   */
  skipInDevelopment?: boolean;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private options: RateLimiterOptions;
  private requests: Map<string, { count: number; resetTime: number }>;
  
  constructor(options: RateLimiterOptions) {
    this.options = {
      skipInDevelopment: true,
      ...options,
    };
    
    this.requests = new Map();
    
    // Start the cleanup interval
    setInterval(() => {
      this.cleanup();
    }, this.options.windowMs);
  }
  
  /**
   * Check if a request is allowed
   * 
   * @param key The request key (e.g., IP address, user ID)
   * @returns Whether the request is allowed
   */
  public isAllowed(key: string): boolean {
    // Skip rate limiting in development mode if enabled
    if (this.options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const now = Date.now();
    const request = this.requests.get(key);
    
    // If the request doesn't exist or has expired, create a new one
    if (!request || request.resetTime <= now) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs,
      });
      
      return true;
    }
    
    // If the request has reached the limit, reject it
    if (request.count >= this.options.limit) {
      logger.warn(`Rate limit exceeded for ${key}`, {
        key,
        count: request.count,
        limit: this.options.limit,
        resetTime: new Date(request.resetTime),
      });
      
      return false;
    }
    
    // Increment the request count
    request.count++;
    
    return true;
  }
  
  /**
   * Get the remaining requests for a key
   * 
   * @param key The request key
   * @returns The remaining requests
   */
  public getRemaining(key: string): number {
    // Skip rate limiting in development mode if enabled
    if (this.options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return this.options.limit;
    }
    
    const now = Date.now();
    const request = this.requests.get(key);
    
    // If the request doesn't exist or has expired, return the limit
    if (!request || request.resetTime <= now) {
      return this.options.limit;
    }
    
    return Math.max(0, this.options.limit - request.count);
  }
  
  /**
   * Get the reset time for a key
   * 
   * @param key The request key
   * @returns The reset time
   */
  public getResetTime(key: string): Date {
    const now = Date.now();
    const request = this.requests.get(key);
    
    // If the request doesn't exist or has expired, return the current time plus the window
    if (!request || request.resetTime <= now) {
      return new Date(now + this.options.windowMs);
    }
    
    return new Date(request.resetTime);
  }
  
  /**
   * Clean up expired requests
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, request] of this.requests.entries()) {
      if (request.resetTime <= now) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Create a rate limiter
 * 
 * @param options The rate limiter options
 * @returns The rate limiter
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Create a rate limiter middleware for Express
 * 
 * @param options The rate limiter options
 * @returns The rate limiter middleware
 */
export function createRateLimiterMiddleware(options: RateLimiterOptions) {
  const rateLimiter = createRateLimiter(options);
  
  return (req: any, res: any, next: any) => {
    // Get the request key (IP address by default)
    const key = req.ip || req.connection.remoteAddress;
    
    // Check if the request is allowed
    if (!rateLimiter.isAllowed(key)) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(rateLimiter.getResetTime(key).getTime() / 1000));
      
      // Return a 429 Too Many Requests response
      res.status(429).json({
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMITED',
      });
      
      return;
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimiter.getRemaining(key));
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimiter.getResetTime(key).getTime() / 1000));
    
    next();
  };
}

/**
 * Common rate limiters
 */
export const rateLimiters = {
  /**
   * Authentication rate limiter (10 requests per minute)
   */
  auth: createRateLimiter({
    limit: 10,
    windowMs: 60 * 1000,
  }),
  
  /**
   * API rate limiter (100 requests per minute)
   */
  api: createRateLimiter({
    limit: 100,
    windowMs: 60 * 1000,
  }),
  
  /**
   * WebSocket rate limiter (1000 messages per minute)
   */
  websocket: createRateLimiter({
    limit: 1000,
    windowMs: 60 * 1000,
  }),
};

export default {
  createRateLimiter,
  createRateLimiterMiddleware,
  rateLimiters,
};