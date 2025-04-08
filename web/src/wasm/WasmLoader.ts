/**
 * WasmLoader.ts - WebAssembly module loader
 * 
 * This file provides utilities for loading WebAssembly modules with
 * optimizations for performance and memory usage.
 */

/**
 * WebAssembly module cache
 */
interface WasmModuleCache {
  /**
   * WebAssembly module
   */
  module: WebAssembly.Module;
  
  /**
   * Module URL
   */
  url: string;
  
  /**
   * Last access time
   */
  lastAccess: number;
}

/**
 * WebAssembly instance cache
 */
interface WasmInstanceCache {
  /**
   * WebAssembly instance
   */
  instance: WebAssembly.Instance;
  
  /**
   * Module URL
   */
  url: string;
  
  /**
   * Import object
   */
  importObject: WebAssembly.Imports;
  
  /**
   * Last access time
   */
  lastAccess: number;
}

/**
 * WebAssembly loader options
 */
export interface WasmLoaderOptions {
  /**
   * Whether to use streaming compilation
   */
  useStreaming?: boolean;
  
  /**
   * Whether to use caching
   */
  useCache?: boolean;
  
  /**
   * Whether to use IndexedDB for caching
   */
  useIndexedDB?: boolean;
  
  /**
   * IndexedDB database name
   */
  dbName?: string;
  
  /**
   * IndexedDB store name
   */
  storeName?: string;
  
  /**
   * Maximum number of modules to cache in memory
   */
  maxMemoryCacheSize?: number;
  
  /**
   * Maximum age of cached modules in milliseconds
   */
  maxCacheAge?: number;
  
  /**
   * Whether to preload modules
   */
  preload?: boolean;
  
  /**
   * Fetch options
   */
  fetchOptions?: RequestInit;
}

/**
 * WebAssembly loader
 * 
 * This class provides utilities for loading WebAssembly modules with
 * optimizations for performance and memory usage.
 */
export class WasmLoader {
  /**
   * Default options
   */
  private static readonly DEFAULT_OPTIONS: WasmLoaderOptions = {
    useStreaming: true,
    useCache: true,
    useIndexedDB: true,
    dbName: 'wasm-cache',
    storeName: 'wasm-modules',
    maxMemoryCacheSize: 10,
    maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
    preload: false,
    fetchOptions: {
      credentials: 'same-origin',
    },
  };
  
  /**
   * Module cache
   */
  private moduleCache: Map<string, WasmModuleCache> = new Map();
  
  /**
   * Instance cache
   */
  private instanceCache: Map<string, WasmInstanceCache> = new Map();
  
  /**
   * IndexedDB database
   */
  private db: IDBDatabase | null = null;
  
  /**
   * Options
   */
  private options: WasmLoaderOptions;
  
  /**
   * Constructor
   * @param options - WebAssembly loader options
   */
  constructor(options: WasmLoaderOptions = {}) {
    this.options = {
      ...WasmLoader.DEFAULT_OPTIONS,
      ...options,
    };
    
    // Initialize IndexedDB
    if (this.options.useCache && this.options.useIndexedDB) {
      this.initIndexedDB();
    }
  }
  
  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    // Check if IndexedDB is available
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB is not available, falling back to memory cache');
      return;
    }
    
    try {
      // Open database
      const dbName = this.options.dbName || WasmLoader.DEFAULT_OPTIONS.dbName!;
      const storeName = this.options.storeName || WasmLoader.DEFAULT_OPTIONS.storeName!;
      
      // Create promise
      const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        // Open database
        const request = indexedDB.open(dbName, 1);
        
        // Handle error
        request.onerror = (event) => {
          console.error('Failed to open IndexedDB:', event);
          reject(new Error('Failed to open IndexedDB'));
        };
        
        // Handle success
        request.onsuccess = (event) => {
          this.db = request.result;
          resolve(request.result);
        };
        
        // Handle upgrade needed
        request.onupgradeneeded = (event) => {
          const db = request.result;
          
          // Create object store
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        };
      });
      
      // Wait for database to open
      await dbPromise;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }
  
  /**
   * Get cache key
   * @param url - Module URL
   * @param importObject - Import object
   * @returns Cache key
   */
  private getCacheKey(url: string, importObject?: WebAssembly.Imports): string {
    // Use URL as cache key
    let cacheKey = url;
    
    // Add import object to cache key if provided
    if (importObject) {
      // Create hash of import object
      const importObjectString = JSON.stringify(importObject, (key, value) => {
        // Skip functions in import object
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      });
      
      // Add hash to cache key
      cacheKey += `:${importObjectString}`;
    }
    
    return cacheKey;
  }
  
  /**
   * Store module in IndexedDB
   * @param url - Module URL
   * @param module - WebAssembly module
   */
  private async storeModuleInIndexedDB(url: string, module: WebAssembly.Module): Promise<void> {
    // Check if IndexedDB is available
    if (!this.db) {
      return;
    }
    
    try {
      // Get store name
      const storeName = this.options.storeName || WasmLoader.DEFAULT_OPTIONS.storeName!;
      
      // Create promise
      await new Promise<void>((resolve, reject) => {
        // Start transaction
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Store module
        const request = store.put({
          module: module,
          timestamp: Date.now(),
        }, url);
        
        // Handle error
        request.onerror = (event) => {
          console.error('Failed to store module in IndexedDB:', event);
          reject(new Error('Failed to store module in IndexedDB'));
        };
        
        // Handle success
        request.onsuccess = (event) => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to store module in IndexedDB:', error);
    }
  }
  
  /**
   * Load module from IndexedDB
   * @param url - Module URL
   * @returns WebAssembly module or null if not found
   */
  private async loadModuleFromIndexedDB(url: string): Promise<WebAssembly.Module | null> {
    // Check if IndexedDB is available
    if (!this.db) {
      return null;
    }
    
    try {
      // Get store name
      const storeName = this.options.storeName || WasmLoader.DEFAULT_OPTIONS.storeName!;
      
      // Create promise
      const result = await new Promise<{ module: WebAssembly.Module; timestamp: number } | null>((resolve, reject) => {
        // Start transaction
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        // Get module
        const request = store.get(url);
        
        // Handle error
        request.onerror = (event) => {
          console.error('Failed to load module from IndexedDB:', event);
          reject(new Error('Failed to load module from IndexedDB'));
        };
        
        // Handle success
        request.onsuccess = (event) => {
          resolve(request.result || null);
        };
      });
      
      // Check if module was found
      if (!result) {
        return null;
      }
      
      // Check if module is too old
      const maxCacheAge = this.options.maxCacheAge || WasmLoader.DEFAULT_OPTIONS.maxCacheAge!;
      if (Date.now() - result.timestamp > maxCacheAge) {
        // Remove old module
        await this.removeModuleFromIndexedDB(url);
        return null;
      }
      
      return result.module;
    } catch (error) {
      console.error('Failed to load module from IndexedDB:', error);
      return null;
    }
  }
  
  /**
   * Remove module from IndexedDB
   * @param url - Module URL
   */
  private async removeModuleFromIndexedDB(url: string): Promise<void> {
    // Check if IndexedDB is available
    if (!this.db) {
      return;
    }
    
    try {
      // Get store name
      const storeName = this.options.storeName || WasmLoader.DEFAULT_OPTIONS.storeName!;
      
      // Create promise
      await new Promise<void>((resolve, reject) => {
        // Start transaction
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Remove module
        const request = store.delete(url);
        
        // Handle error
        request.onerror = (event) => {
          console.error('Failed to remove module from IndexedDB:', event);
          reject(new Error('Failed to remove module from IndexedDB'));
        };
        
        // Handle success
        request.onsuccess = (event) => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to remove module from IndexedDB:', error);
    }
  }
  
  /**
   * Compile WebAssembly module
   * @param url - Module URL
   * @returns WebAssembly module
   */
  async compileModule(url: string): Promise<WebAssembly.Module> {
    // Check if module is in memory cache
    const cacheKey = this.getCacheKey(url);
    const cachedModule = this.moduleCache.get(cacheKey);
    
    if (cachedModule) {
      // Update last access time
      cachedModule.lastAccess = Date.now();
      return cachedModule.module;
    }
    
    // Check if module is in IndexedDB cache
    if (this.options.useCache && this.options.useIndexedDB) {
      const module = await this.loadModuleFromIndexedDB(url);
      
      if (module) {
        // Store module in memory cache
        this.moduleCache.set(cacheKey, {
          module,
          url,
          lastAccess: Date.now(),
        });
        
        // Clean up memory cache
        this.cleanupMemoryCache();
        
        return module;
      }
    }
    
    // Compile module
    let module: WebAssembly.Module;
    
    // Use streaming compilation if available and enabled
    if (this.options.useStreaming && WebAssembly.compileStreaming) {
      try {
        // Fetch module
        const response = await fetch(url, this.options.fetchOptions);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`Failed to fetch WebAssembly module: ${response.status} ${response.statusText}`);
        }
        
        // Compile module
        module = await WebAssembly.compileStreaming(response);
      } catch (error) {
        console.warn('Streaming compilation failed, falling back to ArrayBuffer compilation:', error);
        
        // Fall back to ArrayBuffer compilation
        const response = await fetch(url, this.options.fetchOptions);
        const bytes = await response.arrayBuffer();
        module = await WebAssembly.compile(bytes);
      }
    } else {
      // Use ArrayBuffer compilation
      const response = await fetch(url, this.options.fetchOptions);
      const bytes = await response.arrayBuffer();
      module = await WebAssembly.compile(bytes);
    }
    
    // Store module in memory cache
    if (this.options.useCache) {
      this.moduleCache.set(cacheKey, {
        module,
        url,
        lastAccess: Date.now(),
      });
      
      // Clean up memory cache
      this.cleanupMemoryCache();
      
      // Store module in IndexedDB cache
      if (this.options.useIndexedDB) {
        await this.storeModuleInIndexedDB(url, module);
      }
    }
    
    return module;
  }
  
  /**
   * Instantiate WebAssembly module
   * @param url - Module URL
   * @param importObject - Import object
   * @returns WebAssembly instance
   */
  async instantiateModule(url: string, importObject?: WebAssembly.Imports): Promise<WebAssembly.Instance> {
    // Check if instance is in memory cache
    const cacheKey = this.getCacheKey(url, importObject);
    const cachedInstance = this.instanceCache.get(cacheKey);
    
    if (cachedInstance) {
      // Update last access time
      cachedInstance.lastAccess = Date.now();
      return cachedInstance.instance;
    }
    
    // Compile module
    const module = await this.compileModule(url);
    
    // Instantiate module
    const instance = await WebAssembly.instantiate(module, importObject);
    
    // Store instance in memory cache
    if (this.options.useCache) {
      this.instanceCache.set(cacheKey, {
        instance,
        url,
        importObject: importObject || {},
        lastAccess: Date.now(),
      });
      
      // Clean up memory cache
      this.cleanupMemoryCache();
    }
    
    return instance;
  }
  
  /**
   * Instantiate WebAssembly module from bytes
   * @param bytes - Module bytes
   * @param importObject - Import object
   * @returns WebAssembly instance and module
   */
  async instantiateFromBytes(bytes: BufferSource, importObject?: WebAssembly.Imports): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
    return await WebAssembly.instantiate(bytes, importObject);
  }
  
  /**
   * Clean up memory cache
   */
  private cleanupMemoryCache(): void {
    // Check if memory cache is too large
    const maxMemoryCacheSize = this.options.maxMemoryCacheSize || WasmLoader.DEFAULT_OPTIONS.maxMemoryCacheSize!;
    
    if (this.moduleCache.size > maxMemoryCacheSize) {
      // Get entries sorted by last access time
      const entries = Array.from(this.moduleCache.entries())
        .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);
      
      // Remove oldest entries
      const entriesToRemove = entries.slice(0, this.moduleCache.size - maxMemoryCacheSize);
      
      for (const [key] of entriesToRemove) {
        this.moduleCache.delete(key);
      }
    }
    
    if (this.instanceCache.size > maxMemoryCacheSize) {
      // Get entries sorted by last access time
      const entries = Array.from(this.instanceCache.entries())
        .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);
      
      // Remove oldest entries
      const entriesToRemove = entries.slice(0, this.instanceCache.size - maxMemoryCacheSize);
      
      for (const [key] of entriesToRemove) {
        this.instanceCache.delete(key);
      }
    }
  }
  
  /**
   * Preload WebAssembly module
   * @param url - Module URL
   */
  async preloadModule(url: string): Promise<void> {
    try {
      await this.compileModule(url);
    } catch (error) {
      console.error('Failed to preload WebAssembly module:', error);
    }
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    // Clear memory cache
    this.moduleCache.clear();
    this.instanceCache.clear();
    
    // Clear IndexedDB cache
    if (this.db) {
      try {
        // Get store name
        const storeName = this.options.storeName || WasmLoader.DEFAULT_OPTIONS.storeName!;
        
        // Start transaction
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear store
        store.clear();
      } catch (error) {
        console.error('Failed to clear IndexedDB cache:', error);
      }
    }
  }
}

/**
 * Global WebAssembly loader
 */
export const wasmLoader = new WasmLoader();

/**
 * Default export
 */
export default wasmLoader;