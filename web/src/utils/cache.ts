/**
 * Cache utilities for DarkSwap
 */

/**
 * Cache entry
 */
interface CacheEntry<T> {
  /** The cached value */
  value: T;
  /** The timestamp when the entry was created */
  timestamp: number;
  /** The expiration time in milliseconds */
  expiry: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** The maximum number of entries in the cache */
  maxEntries?: number;
  /** The default expiration time in milliseconds */
  defaultExpiry?: number;
  /** Whether to use localStorage for persistence */
  persistent?: boolean;
  /** The prefix for localStorage keys */
  storagePrefix?: string;
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxEntries: 100,
  defaultExpiry: 5 * 60 * 1000, // 5 minutes
  persistent: false,
  storagePrefix: 'darkswap_cache_',
};

/**
 * A simple in-memory cache with optional localStorage persistence
 */
export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private options: Required<CacheOptions>;

  /**
   * Create a new cache
   * @param options Cache options
   */
  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options } as Required<CacheOptions>;
    this.cache = new Map<string, CacheEntry<T>>();

    // Load from localStorage if persistent
    if (this.options.persistent) {
      this.loadFromStorage();
    }
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param expiry The expiration time in milliseconds (optional, defaults to defaultExpiry)
   * @returns The cache instance for chaining
   */
  set(key: string, value: T, expiry?: number): Cache<T> {
    // Ensure the cache doesn't exceed the maximum number of entries
    if (this.cache.size >= this.options.maxEntries) {
      this.evictOldest();
    }

    // Set the cache entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiry: expiry || this.options.defaultExpiry,
    };

    this.cache.set(key, entry);

    // Save to localStorage if persistent
    if (this.options.persistent) {
      this.saveToStorage();
    }

    return this;
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value, or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    // Return undefined if the entry doesn't exist
    if (!entry) {
      return undefined;
    }

    // Check if the entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired, false otherwise
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    // Return false if the entry doesn't exist
    if (!entry) {
      return false;
    }

    // Check if the entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a value from the cache
   * @param key The cache key
   * @returns True if the key was deleted, false otherwise
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);

    // Save to localStorage if persistent
    if (result && this.options.persistent) {
      this.saveToStorage();
    }

    return result;
  }

  /**
   * Clear the cache
   * @returns The cache instance for chaining
   */
  clear(): Cache<T> {
    this.cache.clear();

    // Clear localStorage if persistent
    if (this.options.persistent) {
      this.clearStorage();
    }

    return this;
  }

  /**
   * Get all keys in the cache
   * @returns An array of keys
   */
  keys(): string[] {
    // Clean up expired entries
    this.cleanup();

    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   * @returns An array of values
   */
  values(): T[] {
    // Clean up expired entries
    this.cleanup();

    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * Get all entries in the cache
   * @returns An array of [key, value] pairs
   */
  entries(): [string, T][] {
    // Clean up expired entries
    this.cleanup();

    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  /**
   * Get the number of entries in the cache
   * @returns The number of entries
   */
  size(): number {
    // Clean up expired entries
    this.cleanup();

    return this.cache.size;
  }

  /**
   * Clean up expired entries
   * @returns The number of entries removed
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Collect keys to delete
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.expiry) {
        keysToDelete.push(key);
        count++;
      }
    });

    // Delete collected keys
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    // Save to localStorage if persistent and entries were removed
    if (count > 0 && this.options.persistent) {
      this.saveToStorage();
    }

    return count;
  }

  /**
   * Check if an entry has expired
   * @param entry The cache entry
   * @returns True if the entry has expired, false otherwise
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.expiry;
  }

  /**
   * Evict the oldest entry from the cache
   * @returns True if an entry was evicted, false otherwise
   */
  private evictOldest(): boolean {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    });

    if (oldestKey) {
      return this.delete(oldestKey);
    }

    return false;
  }

  /**
   * Save the cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data: Record<string, CacheEntry<T>> = {};

      this.cache.forEach((entry, key) => {
        data[key] = entry;
      });

      localStorage.setItem(this.options.storagePrefix + 'data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load the cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data = localStorage.getItem(this.options.storagePrefix + 'data');

      if (data) {
        const parsed = JSON.parse(data) as Record<string, CacheEntry<T>>;

        Object.entries(parsed).forEach(([key, entry]) => {
          this.cache.set(key, entry);
        });

        // Clean up expired entries
        this.cleanup();
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Clear the cache from localStorage
   */
  private clearStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.options.storagePrefix + 'data');
    } catch (error) {
      console.error('Failed to clear cache from localStorage:', error);
    }
  }
}

/**
 * Create a new cache
 * @param options Cache options
 * @returns A new cache instance
 */
export function createCache<T = any>(options: CacheOptions = {}): Cache<T> {
  return new Cache<T>(options);
}

/**
 * The default cache instance
 */
export const defaultCache = createCache();