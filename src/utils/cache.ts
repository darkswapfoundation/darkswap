/**
 * Cache utility for DarkSwap
 * 
 * This utility provides a caching system for the DarkSwap application.
 */

import { logger } from './logger';

/**
 * Cache options
 */
export interface CacheOptions {
  /**
   * The maximum age of a cache entry in milliseconds
   */
  maxAge?: number;
  
  /**
   * Whether to skip the cache in development mode
   */
  skipInDevelopment?: boolean;
}

/**
 * Cache entry
 */
interface CacheEntry<T> {
  /**
   * The cached value
   */
  value: T;
  
  /**
   * The expiry time
   */
  expiry: number;
}

/**
 * Cache class
 */
export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  
  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.options = {
      maxAge: 60 * 1000, // 1 minute
      skipInDevelopment: true,
      ...options,
    };
    
    // Start the cleanup interval
    setInterval(() => {
      this.cleanup();
    }, this.options.maxAge || 60 * 1000);
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key The cache key
   * @returns The cached value, or undefined if not found
   */
  public get(key: string): T | undefined {
    // Skip cache in development mode if enabled
    if (this.options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return undefined;
    }
    
    const entry = this.cache.get(key);
    
    // If the entry doesn't exist or has expired, return undefined
    if (!entry || entry.expiry <= Date.now()) {
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key The cache key
   * @param value The value to cache
   * @param maxAge The maximum age of the cache entry in milliseconds (overrides the default)
   */
  public set(key: string, value: T, maxAge?: number): void {
    // Skip cache in development mode if enabled
    if (this.options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return;
    }
    
    const expiry = Date.now() + (maxAge || this.options.maxAge || 60 * 1000);
    
    this.cache.set(key, {
      value,
      expiry,
    });
    
    logger.debug(`Cached value for key: ${key}`, { expiry: new Date(expiry) });
  }
  
  /**
   * Check if a key exists in the cache
   * 
   * @param key The cache key
   * @returns Whether the key exists in the cache
   */
  public has(key: string): boolean {
    // Skip cache in development mode if enabled
    if (this.options.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return false;
    }
    
    const entry = this.cache.get(key);
    
    // If the entry doesn't exist or has expired, return false
    if (!entry || entry.expiry <= Date.now()) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param key The cache key
   */
  public delete(key: string): void {
    this.cache.delete(key);
    
    logger.debug(`Deleted cache entry for key: ${key}`);
  }
  
  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
    
    logger.debug('Cleared cache');
  }
  
  /**
   * Get the size of the cache
   * 
   * @returns The number of entries in the cache
   */
  public size(): number {
    return this.cache.size;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
        logger.debug(`Expired cache entry for key: ${key}`);
      }
    }
  }
}

/**
 * Create a cache
 * 
 * @param options The cache options
 * @returns The cache
 */
export function createCache<T = any>(options?: CacheOptions): Cache<T> {
  return new Cache<T>(options);
}

/**
 * Create a memoized function
 * 
 * @param fn The function to memoize
 * @param options The cache options
 * @returns The memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: CacheOptions
): T {
  const cache = createCache<ReturnType<T>>(options);
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    
    // If the result is a promise, handle it specially
    if (result instanceof Promise) {
      return result.then((value) => {
        cache.set(key, value);
        return value;
      }) as ReturnType<T>;
    }
    
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Common caches
 */
export const caches = {
  /**
   * API response cache (1 minute)
   */
  api: createCache({
    maxAge: 60 * 1000,
  }),
  
  /**
   * Asset data cache (5 minutes)
   */
  assets: createCache({
    maxAge: 5 * 60 * 1000,
  }),
  
  /**
   * User data cache (1 hour)
   */
  users: createCache({
    maxAge: 60 * 60 * 1000,
  }),
};

export default {
  createCache,
  memoize,
  caches,
};