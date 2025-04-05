/**
 * Caching utilities for DarkSwap
 * 
 * This module provides utilities for caching API responses and other data.
 */

/**
 * Memory cache implementation
 */
export class MemoryCache {
  // Cache storage
  static cache = new Map();
  
  // Cache configuration
  static maxSize = 100;
  static defaultTTL = 60000; // 60 seconds
  static pruneInterval = 300000; // 5 minutes
  
  // Last prune timestamp
  static lastPrune = Date.now();
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found or expired
   */
  static get(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      return null;
    }
    
    // Get cached item
    const item = this.cache.get(key);
    
    // Check if item has expired
    if (item.expires && item.expires < Date.now()) {
      // Remove expired item
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  static set(key, value, ttl = this.defaultTTL) {
    // Prune cache if needed
    this.pruneIfNeeded();
    
    // Check if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Remove oldest item
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // Calculate expiration time
    const expires = ttl > 0 ? Date.now() + ttl : null;
    
    // Store value in cache
    this.cache.set(key, { value, expires });
  }
  
  /**
   * Remove a value from the cache
   * @param {string} key - Cache key
   */
  static remove(key) {
    this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  static clear() {
    this.cache.clear();
  }
  
  /**
   * Get the size of the cache
   * @returns {number} Number of items in the cache
   */
  static size() {
    return this.cache.size;
  }
  
  /**
   * Prune expired items from the cache
   */
  static prune() {
    const now = Date.now();
    
    // Remove expired items
    for (const [key, item] of this.cache.entries()) {
      if (item.expires && item.expires < now) {
        this.cache.delete(key);
      }
    }
    
    // Update last prune timestamp
    this.lastPrune = now;
  }
  
  /**
   * Prune cache if needed
   */
  static pruneIfNeeded() {
    const now = Date.now();
    
    // Prune if interval has elapsed
    if (now - this.lastPrune > this.pruneInterval) {
      this.prune();
    }
  }
}

/**
 * Cache API response
 * @param {Function} apiCall - API call function
 * @param {string} cacheKey - Cache key
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds
 * @param {boolean} options.bypassCache - Bypass cache and force API call
 * @returns {Promise<any>} API response
 */
export const cacheApiResponse = async (apiCall, cacheKey, options = {}) => {
  const { ttl = MemoryCache.defaultTTL, bypassCache = false } = options;
  
  // Check cache if not bypassing
  if (!bypassCache) {
    const cachedValue = MemoryCache.get(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }
  }
  
  try {
    // Call API
    const response = await apiCall();
    
    // Cache response
    MemoryCache.set(cacheKey, response, ttl);
    
    return response;
  } catch (error) {
    // Don't cache errors
    throw error;
  }
};

/**
 * Create a cached API function
 * @param {Function} apiCall - API call function
 * @param {Function} getCacheKey - Function to get cache key from arguments
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds
 * @returns {Function} Cached API function
 */
export const createCachedApiFunction = (apiCall, getCacheKey, options = {}) => {
  return async (...args) => {
    const cacheKey = getCacheKey(...args);
    return cacheApiResponse(() => apiCall(...args), cacheKey, options);
  };
};

/**
 * HTTP cache utilities
 */
export const HttpCache = {
  /**
   * Generate ETag for a response
   * @param {any} data - Response data
   * @returns {string} ETag
   */
  generateETag(data) {
    // Simple hash function for demo purposes
    // In production, use a proper hash function
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `"${Math.abs(hash).toString(16)}"`;
  },
  
  /**
   * Check if response is fresh based on ETag
   * @param {Object} request - Request object
   * @param {string} etag - ETag
   * @returns {boolean} True if response is fresh
   */
  isFresh(request, etag) {
    const ifNoneMatch = request.headers && request.headers['if-none-match'];
    return ifNoneMatch === etag;
  },
  
  /**
   * Add cache headers to response
   * @param {Object} response - Response object
   * @param {string} etag - ETag
   * @param {number} maxAge - Max age in seconds
   */
  addCacheHeaders(response, etag, maxAge = 60) {
    if (response.headers) {
      response.headers['ETag'] = etag;
      response.headers['Cache-Control'] = `max-age=${maxAge}, must-revalidate`;
    }
  }
};

/**
 * Local storage cache
 */
export class LocalStorageCache {
  /**
   * Get a value from local storage
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found or expired
   */
  static get(key) {
    try {
      // Get item from local storage
      const item = localStorage.getItem(`cache:${key}`);
      
      if (!item) {
        return null;
      }
      
      // Parse item
      const { value, expires } = JSON.parse(item);
      
      // Check if item has expired
      if (expires && expires < Date.now()) {
        // Remove expired item
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      return value;
    } catch (error) {
      console.error('Error getting item from local storage:', error);
      return null;
    }
  }
  
  /**
   * Set a value in local storage
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  static set(key, value, ttl = 3600000) { // Default: 1 hour
    try {
      // Calculate expiration time
      const expires = ttl > 0 ? Date.now() + ttl : null;
      
      // Store value in local storage
      localStorage.setItem(`cache:${key}`, JSON.stringify({ value, expires }));
    } catch (error) {
      console.error('Error setting item in local storage:', error);
    }
  }
  
  /**
   * Remove a value from local storage
   * @param {string} key - Cache key
   */
  static remove(key) {
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Error removing item from local storage:', error);
    }
  }
  
  /**
   * Clear all cached items from local storage
   */
  static clear() {
    try {
      // Get all keys
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('cache:')) {
          keys.push(key);
        }
      }
      
      // Remove all cache items
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing local storage cache:', error);
    }
  }
}