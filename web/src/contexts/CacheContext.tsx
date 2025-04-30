/**
 * CacheContext - Context for managing cache
 * 
 * This context provides cache management functionality for the application,
 * including in-memory and localStorage caching with TTL support.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Cache item interface
interface CacheItem<T> {
  /** Cached data */
  data: T;
  /** Expiration timestamp */
  expires: number;
  /** Whether to persist in localStorage */
  persist: boolean;
}

// Cache options interface
export interface CacheOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Whether to persist in localStorage */
  persist?: boolean;
  /** Cache version */
  version?: string;
}

// Cache context interface
interface CacheContextType {
  /** Get item from cache */
  getItem: <T>(key: string) => T | null;
  /** Set item in cache */
  setItem: <T>(key: string, data: T, options?: CacheOptions) => void;
  /** Remove item from cache */
  removeItem: (key: string) => void;
  /** Clear all cache */
  clear: () => void;
  /** Get cache stats */
  getStats: () => {
    memoryItems: number;
    localStorageItems: number;
    totalItems: number;
  };
}

// Default cache options
const defaultCacheOptions: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  persist: false,
  version: '1.0',
};

// Create context
const CacheContext = createContext<CacheContextType | undefined>(undefined);

// Cache provider props
interface CacheProviderProps {
  /** Cache options */
  options?: CacheOptions;
  /** Children components */
  children: ReactNode;
}

/**
 * CacheProvider component
 */
export const CacheProvider: React.FC<CacheProviderProps> = ({
  options = {},
  children,
}) => {
  // Merge options with defaults
  const cacheOptions = { ...defaultCacheOptions, ...options };
  
  // In-memory cache
  const [memoryCache, setMemoryCache] = useState<Record<string, CacheItem<any>>>({});
  
  // Initialize cache from localStorage
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    
    try {
      // Get all keys from localStorage that start with 'cache:'
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
      
      // Load items from localStorage
      const loadedItems: Record<string, CacheItem<any>> = {};
      
      keys.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          
          // Check if item has expired
          if (item.expires > Date.now()) {
            // Remove 'cache:' prefix from key
            const cacheKey = key.substring(6);
            loadedItems[cacheKey] = item;
          } else {
            // Remove expired item
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Ignore invalid JSON
          localStorage.removeItem(key);
        }
      });
      
      // Update memory cache
      setMemoryCache(loadedItems);
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
    }
  }, []);
  
  // Get item from cache
  const getItem = <T,>(key: string): T | null => {
    // Check memory cache
    const item = memoryCache[key];
    
    if (item) {
      // Check if item has expired
      if (item.expires > Date.now()) {
        return item.data;
      } else {
        // Remove expired item
        removeItem(key);
      }
    }
    
    return null;
  };
  
  // Set item in cache
  const setItem = <T,>(key: string, data: T, options?: CacheOptions): void => {
    // Merge options with defaults
    const itemOptions = { ...cacheOptions, ...options };
    
    // Create cache item
    const item: CacheItem<T> = {
      data,
      expires: Date.now() + (itemOptions.ttl || 0),
      persist: !!itemOptions.persist,
    };
    
    // Update memory cache
    setMemoryCache(prev => ({ ...prev, [key]: item }));
    
    // Update localStorage if persist is true
    if (item.persist && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`cache:${key}`, JSON.stringify(item));
      } catch (error) {
        console.error('Error saving cache to localStorage:', error);
      }
    }
  };
  
  // Remove item from cache
  const removeItem = (key: string): void => {
    // Update memory cache
    setMemoryCache(prev => {
      const newCache = { ...prev };
      delete newCache[key];
      return newCache;
    });
    
    // Remove from localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`cache:${key}`);
      } catch (error) {
        console.error('Error removing cache from localStorage:', error);
      }
    }
  };
  
  // Clear all cache
  const clear = (): void => {
    // Clear memory cache
    setMemoryCache({});
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        // Get all keys from localStorage that start with 'cache:'
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
        
        // Remove all cache items
        keys.forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (error) {
        console.error('Error clearing cache from localStorage:', error);
      }
    }
  };
  
  // Get cache stats
  const getStats = () => {
    // Count memory items
    const memoryItems = Object.keys(memoryCache).length;
    
    // Count localStorage items
    let localStorageItems = 0;
    
    if (typeof localStorage !== 'undefined') {
      try {
        // Get all keys from localStorage that start with 'cache:'
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache:'));
        localStorageItems = keys.length;
      } catch (error) {
        console.error('Error counting localStorage items:', error);
      }
    }
    
    return {
      memoryItems,
      localStorageItems,
      totalItems: memoryItems,
    };
  };
  
  // Context value
  const contextValue: CacheContextType = {
    getItem,
    setItem,
    removeItem,
    clear,
    getStats,
  };
  
  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

/**
 * useCache hook
 * @returns Cache context
 * @throws Error if used outside of CacheProvider
 */
export const useCache = (): CacheContextType => {
  const context = useContext(CacheContext);
  
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  
  return context;
};

export default CacheContext;