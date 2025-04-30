/**
 * CacheManager - Client-side caching utility for DarkSwap
 * 
 * This utility provides a flexible caching system for API responses and frequently accessed data.
 * It supports:
 * - In-memory caching with TTL (Time To Live)
 * - LocalStorage persistence for offline access
 * - Cache invalidation strategies
 * - Cache size management
 * - Type-safe cache access
 */

export interface CacheOptions {
  /** Time to live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Whether to persist in localStorage (default: false) */
  persist?: boolean;
  /** Cache version for invalidation (default: '1') */
  version?: string;
  /** Maximum size in bytes for localStorage cache (default: 5MB) */
  maxSize?: number;
  /** Whether to compress data before storing (default: false) */
  compress?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
  version: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
}

const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  persist: false,
  version: '1',
  maxSize: 5 * 1024 * 1024, // 5MB
  compress: false,
};

/**
 * CacheManager class for handling client-side caching
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private options: CacheOptions;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
  };

  /**
   * Create a new CacheManager instance
   * @param options Cache options
   */
  private constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadFromStorage();
  }

  /**
   * Get the singleton instance of CacheManager
   * @param options Cache options
   * @returns CacheManager instance
   */
  public static getInstance(options?: CacheOptions): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(options);
    }
    return CacheManager.instance;
  }

  /**
   * Set cache options
   * @param options Cache options
   */
  public setOptions(options: Partial<CacheOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  public get<T>(key: string): T | null {
    // Check memory cache first
    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if entry is expired
      if (Date.now() > entry.expires) {
        this.remove(key);
        this.stats.misses++;
        return null;
      }
      
      // Check if version matches
      if (entry.version !== this.options.version) {
        this.remove(key);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return entry.data as T;
    }
    
    // Check localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        const storageKey = `darkswap_cache_${key}`;
        const storedEntry = localStorage.getItem(storageKey);
        
        if (storedEntry) {
          const entry = JSON.parse(storedEntry) as CacheEntry<T>;
          
          // Check if entry is expired or version mismatch
          if (Date.now() > entry.expires || entry.version !== this.options.version) {
            localStorage.removeItem(storageKey);
            this.stats.misses++;
            return null;
          }
          
          // Add to memory cache
          this.cache.set(key, entry);
          this.stats.hits++;
          return entry.data;
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options for this specific item
   */
  public set<T>(key: string, data: T, options?: Partial<CacheOptions>): void {
    const mergedOptions = { ...this.options, ...options };
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expires: now + (mergedOptions.ttl || 0),
      version: mergedOptions.version || '1',
    };
    
    // Store in memory cache
    this.cache.set(key, entry);
    
    // Store in localStorage if persistence is enabled
    if (mergedOptions.persist) {
      try {
        const storageKey = `darkswap_cache_${key}`;
        let valueToStore: string;
        
        if (mergedOptions.compress) {
          // Simple compression by removing whitespace
          valueToStore = JSON.stringify(entry).replace(/\s+/g, '');
        } else {
          valueToStore = JSON.stringify(entry);
        }
        
        // Check if adding this item would exceed the max size
        if (this.getStorageSize() + valueToStore.length > (mergedOptions.maxSize || 0)) {
          this.pruneStorage();
        }
        
        localStorage.setItem(storageKey, valueToStore);
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    }
    
    // Update stats
    this.updateStats();
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  public remove(key: string): void {
    // Remove from memory cache
    this.cache.delete(key);
    
    // Remove from localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        const storageKey = `darkswap_cache_${key}`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
    
    // Update stats
    this.updateStats();
  }

  /**
   * Clear all items from the cache
   */
  public clear(): void {
    // Clear memory cache
    this.cache.clear();
    
    // Clear localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('darkswap_cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0,
    };
  }

  /**
   * Check if an item exists in the cache and is not expired
   * @param key Cache key
   * @returns Whether the item exists and is valid
   */
  public has(key: string): boolean {
    // Check memory cache first
    const entry = this.cache.get(key);
    
    if (entry) {
      // Check if entry is expired or version mismatch
      if (Date.now() > entry.expires || entry.version !== this.options.version) {
        this.remove(key);
        return false;
      }
      
      return true;
    }
    
    // Check localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        const storageKey = `darkswap_cache_${key}`;
        const storedEntry = localStorage.getItem(storageKey);
        
        if (storedEntry) {
          const entry = JSON.parse(storedEntry) as CacheEntry<any>;
          
          // Check if entry is expired or version mismatch
          if (Date.now() > entry.expires || entry.version !== this.options.version) {
            localStorage.removeItem(storageKey);
            return false;
          }
          
          return true;
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    }
    
    return false;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Invalidate all cache entries with a specific version
   * @param version Version to invalidate
   */
  public invalidateVersion(version: string): void {
    // Invalidate memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.version === version) {
        this.remove(key);
      }
    }
    
    // Invalidate localStorage if persistence is enabled
    if (this.options.persist) {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('darkswap_cache_')) {
            const entry = JSON.parse(localStorage.getItem(key) || '{}') as CacheEntry<any>;
            if (entry.version === version) {
              localStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.error('Error invalidating localStorage:', error);
      }
    }
    
    // Update stats
    this.updateStats();
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!this.options.persist) return;
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('darkswap_cache_')) {
          const cacheKey = key.replace('darkswap_cache_', '');
          const storedEntry = localStorage.getItem(key);
          
          if (storedEntry) {
            const entry = JSON.parse(storedEntry) as CacheEntry<any>;
            
            // Check if entry is expired or version mismatch
            if (Date.now() > entry.expires || entry.version !== this.options.version) {
              localStorage.removeItem(key);
            } else {
              this.cache.set(cacheKey, entry);
            }
          }
        }
      });
      
      // Update stats
      this.updateStats();
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  /**
   * Get the total size of localStorage cache in bytes
   * @returns Size in bytes
   */
  private getStorageSize(): number {
    let size = 0;
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('darkswap_cache_')) {
          size += key.length + (localStorage.getItem(key) || '').length;
        }
      });
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
    }
    
    return size;
  }

  /**
   * Prune localStorage cache to reduce size
   */
  private pruneStorage(): void {
    if (!this.options.persist) return;
    
    try {
      // Get all cache entries from localStorage
      const entries: { key: string; entry: CacheEntry<any> }[] = [];
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('darkswap_cache_')) {
          const storedEntry = localStorage.getItem(key);
          
          if (storedEntry) {
            entries.push({
              key,
              entry: JSON.parse(storedEntry) as CacheEntry<any>,
            });
          }
        }
      });
      
      // Sort by expiration (oldest first)
      entries.sort((a, b) => a.entry.expires - b.entry.expires);
      
      // Remove entries until we're under the size limit
      let currentSize = this.getStorageSize();
      let i = 0;
      
      while (currentSize > (this.options.maxSize || 0) && i < entries.length) {
        const { key } = entries[i];
        const itemSize = key.length + (localStorage.getItem(key) || '').length;
        
        localStorage.removeItem(key);
        currentSize -= itemSize;
        i++;
      }
    } catch (error) {
      console.error('Error pruning localStorage:', error);
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.entries = this.cache.size;
    
    // Calculate approximate size in bytes
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length + JSON.stringify(entry).length;
    }
    
    this.stats.size = size;
  }
}

// Export singleton instance
export default CacheManager.getInstance();