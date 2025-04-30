/**
 * KeyManager.ts - Secure key management
 * 
 * This file provides utilities for securely managing cryptographic keys.
 */

/**
 * Key type
 */
export enum KeyType {
  /**
   * Private key
   */
  Private = 'private',
  
  /**
   * Public key
   */
  Public = 'public',
  
  /**
   * Mnemonic
   */
  Mnemonic = 'mnemonic',
}

/**
 * Key format
 */
export enum KeyFormat {
  /**
   * Raw bytes
   */
  Raw = 'raw',
  
  /**
   * Hexadecimal string
   */
  Hex = 'hex',
  
  /**
   * Base64 string
   */
  Base64 = 'base64',
  
  /**
   * WIF (Wallet Import Format)
   */
  WIF = 'wif',
}

/**
 * Key storage type
 */
export enum KeyStorageType {
  /**
   * Memory (volatile)
   */
  Memory = 'memory',
  
  /**
   * Local storage (persistent)
   */
  LocalStorage = 'localStorage',
  
  /**
   * IndexedDB (persistent)
   */
  IndexedDB = 'indexedDB',
  
  /**
   * Secure element (hardware)
   */
  SecureElement = 'secureElement',
}

/**
 * Key metadata
 */
export interface KeyMetadata {
  /**
   * Key ID
   */
  id: string;
  
  /**
   * Key type
   */
  type: KeyType;
  
  /**
   * Key format
   */
  format: KeyFormat;
  
  /**
   * Key storage type
   */
  storageType: KeyStorageType;
  
  /**
   * Creation timestamp
   */
  createdAt: number;
  
  /**
   * Last access timestamp
   */
  lastAccessedAt: number;
  
  /**
   * Tags
   */
  tags?: Record<string, string>;
}

/**
 * Key storage options
 */
export interface KeyStorageOptions {
  /**
   * Storage type
   */
  storageType?: KeyStorageType;
  
  /**
   * Encryption password
   */
  password?: string;
  
  /**
   * Auto-delete after milliseconds
   */
  autoDeleteAfter?: number;
  
  /**
   * Tags
   */
  tags?: Record<string, string>;
}

/**
 * Key manager options
 */
export interface KeyManagerOptions {
  /**
   * Default storage type
   */
  defaultStorageType?: KeyStorageType;
  
  /**
   * Default encryption password
   */
  defaultPassword?: string;
  
  /**
   * Whether to use secure element if available
   */
  useSecureElementIfAvailable?: boolean;
  
  /**
   * IndexedDB database name
   */
  dbName?: string;
  
  /**
   * IndexedDB store name
   */
  storeName?: string;
}

/**
 * Key manager
 * 
 * This class provides utilities for securely managing cryptographic keys.
 */
export class KeyManager {
  /**
   * Default options
   */
  private static readonly DEFAULT_OPTIONS: KeyManagerOptions = {
    defaultStorageType: KeyStorageType.Memory,
    useSecureElementIfAvailable: true,
    dbName: 'darkswap-keys',
    storeName: 'keys',
  };
  
  /**
   * Options
   */
  private options: KeyManagerOptions;
  
  /**
   * Memory storage
   */
  private memoryStorage: Map<string, { key: string; metadata: KeyMetadata }> = new Map();
  
  /**
   * IndexedDB database
   */
  private db: IDBDatabase | null = null;
  
  /**
   * Auto-delete timers
   */
  private autoDeleteTimers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Constructor
   * @param options - Key manager options
   */
  constructor(options: KeyManagerOptions = {}) {
    this.options = {
      ...KeyManager.DEFAULT_OPTIONS,
      ...options,
    };
    
    // Initialize IndexedDB if needed
    if (this.options.defaultStorageType === KeyStorageType.IndexedDB) {
      this.initIndexedDB();
    }
  }
  
  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    // Check if IndexedDB is available
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB is not available, falling back to memory storage');
      return;
    }
    
    try {
      // Open database
      const dbName = this.options.dbName || KeyManager.DEFAULT_OPTIONS.dbName!;
      const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
      
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
            const objectStore = db.createObjectStore(storeName, { keyPath: 'metadata.id' });
            objectStore.createIndex('type', 'metadata.type', { unique: false });
            objectStore.createIndex('createdAt', 'metadata.createdAt', { unique: false });
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
   * Store key
   * @param key - Key to store
   * @param type - Key type
   * @param format - Key format
   * @param options - Key storage options
   * @returns Key metadata
   */
  async storeKey(key: string, type: KeyType, format: KeyFormat, options: KeyStorageOptions = {}): Promise<KeyMetadata> {
    // Generate key ID
    const id = this.generateKeyId();
    
    // Create metadata
    const metadata: KeyMetadata = {
      id,
      type,
      format,
      storageType: options.storageType || this.options.defaultStorageType!,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      tags: options.tags,
    };
    
    // Encrypt key if password is provided
    const encryptedKey = options.password || this.options.defaultPassword
      ? await this.encryptKey(key, options.password || this.options.defaultPassword!)
      : key;
    
    // Store key based on storage type
    switch (metadata.storageType) {
      case KeyStorageType.Memory:
        this.storeKeyInMemory(id, encryptedKey, metadata);
        break;
      case KeyStorageType.LocalStorage:
        this.storeKeyInLocalStorage(id, encryptedKey, metadata);
        break;
      case KeyStorageType.IndexedDB:
        await this.storeKeyInIndexedDB(id, encryptedKey, metadata);
        break;
      case KeyStorageType.SecureElement:
        if (this.isSecureElementAvailable()) {
          await this.storeKeyInSecureElement(id, encryptedKey, metadata);
        } else {
          // Fall back to memory storage
          metadata.storageType = KeyStorageType.Memory;
          this.storeKeyInMemory(id, encryptedKey, metadata);
        }
        break;
      default:
        throw new Error(`Unsupported storage type: ${metadata.storageType}`);
    }
    
    // Set up auto-delete timer if needed
    if (options.autoDeleteAfter && options.autoDeleteAfter > 0) {
      this.setAutoDeleteTimer(id, options.autoDeleteAfter);
    }
    
    return metadata;
  }
  
  /**
   * Get key
   * @param id - Key ID
   * @param password - Decryption password
   * @returns Key and metadata
   */
  async getKey(id: string, password?: string): Promise<{ key: string; metadata: KeyMetadata }> {
    // Get key metadata
    const metadata = await this.getKeyMetadata(id);
    
    // Get key based on storage type
    let encryptedKey: string;
    
    switch (metadata.storageType) {
      case KeyStorageType.Memory:
        encryptedKey = this.getKeyFromMemory(id);
        break;
      case KeyStorageType.LocalStorage:
        encryptedKey = this.getKeyFromLocalStorage(id);
        break;
      case KeyStorageType.IndexedDB:
        encryptedKey = await this.getKeyFromIndexedDB(id);
        break;
      case KeyStorageType.SecureElement:
        encryptedKey = await this.getKeyFromSecureElement(id);
        break;
      default:
        throw new Error(`Unsupported storage type: ${metadata.storageType}`);
    }
    
    // Decrypt key if password is provided
    const key = password || this.options.defaultPassword
      ? await this.decryptKey(encryptedKey, password || this.options.defaultPassword!)
      : encryptedKey;
    
    // Update last accessed timestamp
    metadata.lastAccessedAt = Date.now();
    
    // Update metadata
    await this.updateKeyMetadata(id, metadata);
    
    return { key, metadata };
  }
  
  /**
   * Delete key
   * @param id - Key ID
   * @returns Whether the key was deleted
   */
  async deleteKey(id: string): Promise<boolean> {
    try {
      // Get key metadata
      const metadata = await this.getKeyMetadata(id);
      
      // Delete key based on storage type
      switch (metadata.storageType) {
        case KeyStorageType.Memory:
          return this.deleteKeyFromMemory(id);
        case KeyStorageType.LocalStorage:
          return this.deleteKeyFromLocalStorage(id);
        case KeyStorageType.IndexedDB:
          return await this.deleteKeyFromIndexedDB(id);
        case KeyStorageType.SecureElement:
          return await this.deleteKeyFromSecureElement(id);
        default:
          throw new Error(`Unsupported storage type: ${metadata.storageType}`);
      }
    } catch (error) {
      console.error('Failed to delete key:', error);
      return false;
    }
  }
  
  /**
   * Get key metadata
   * @param id - Key ID
   * @returns Key metadata
   */
  async getKeyMetadata(id: string): Promise<KeyMetadata> {
    // Try to get from memory
    const memoryEntry = this.memoryStorage.get(id);
    if (memoryEntry) {
      return memoryEntry.metadata;
    }
    
    // Try to get from local storage
    try {
      const localStorageKey = `darkswap-key-${id}`;
      const localStorageData = localStorage.getItem(localStorageKey);
      
      if (localStorageData) {
        const { metadata } = JSON.parse(localStorageData);
        return metadata;
      }
    } catch (error) {
      console.error('Failed to get key metadata from local storage:', error);
    }
    
    // Try to get from IndexedDB
    if (this.db) {
      try {
        const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
        
        const metadata = await new Promise<KeyMetadata>((resolve, reject) => {
          const transaction = this.db!.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);
          
          request.onerror = (event) => {
            reject(new Error('Failed to get key from IndexedDB'));
          };
          
          request.onsuccess = (event) => {
            if (request.result) {
              resolve(request.result.metadata);
            } else {
              reject(new Error('Key not found in IndexedDB'));
            }
          };
        });
        
        return metadata;
      } catch (error) {
        console.error('Failed to get key metadata from IndexedDB:', error);
      }
    }
    
    // Try to get from secure element
    if (this.isSecureElementAvailable()) {
      try {
        const metadata = await this.getKeyMetadataFromSecureElement(id);
        if (metadata) {
          return metadata;
        }
      } catch (error) {
        console.error('Failed to get key metadata from secure element:', error);
      }
    }
    
    throw new Error(`Key not found: ${id}`);
  }
  
  /**
   * Generate key ID
   * @returns Key ID
   */
  private generateKeyId(): string {
    return `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Set auto-delete timer
   * @param id - Key ID
   * @param timeout - Timeout in milliseconds
   */
  private setAutoDeleteTimer(id: string, timeout: number): void {
    // Clear existing timer
    this.clearAutoDeleteTimer(id);
    
    // Set new timer
    const timer = setTimeout(() => {
      this.deleteKey(id).catch(error => {
        console.error(`Failed to auto-delete key ${id}:`, error);
      });
    }, timeout);
    
    // Store timer
    this.autoDeleteTimers.set(id, timer);
  }
  
  /**
   * Clear auto-delete timer
   * @param id - Key ID
   */
  private clearAutoDeleteTimer(id: string): void {
    // Get timer
    const timer = this.autoDeleteTimers.get(id);
    
    // Clear timer
    if (timer) {
      clearTimeout(timer);
      this.autoDeleteTimers.delete(id);
    }
  }
  
  /**
   * Update key metadata
   * @param id - Key ID
   * @param metadata - Key metadata
   */
  private async updateKeyMetadata(id: string, metadata: KeyMetadata): Promise<void> {
    // Update based on storage type
    switch (metadata.storageType) {
      case KeyStorageType.Memory:
        const memoryEntry = this.memoryStorage.get(id);
        if (memoryEntry) {
          memoryEntry.metadata = metadata;
        }
        break;
      case KeyStorageType.LocalStorage:
        try {
          const localStorageKey = `darkswap-key-${id}`;
          const localStorageData = localStorage.getItem(localStorageKey);
          
          if (localStorageData) {
            const data = JSON.parse(localStorageData);
            data.metadata = metadata;
            localStorage.setItem(localStorageKey, JSON.stringify(data));
          }
        } catch (error) {
          console.error('Failed to update key metadata in local storage:', error);
        }
        break;
      case KeyStorageType.IndexedDB:
        if (this.db) {
          try {
            const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
            
            await new Promise<void>((resolve, reject) => {
              const transaction = this.db!.transaction(storeName, 'readwrite');
              const store = transaction.objectStore(storeName);
              const request = store.get(id);
              
              request.onerror = (event) => {
                reject(new Error('Failed to get key from IndexedDB'));
              };
              
              request.onsuccess = (event) => {
                if (request.result) {
                  const data = request.result;
                  data.metadata = metadata;
                  
                  const updateRequest = store.put(data);
                  
                  updateRequest.onerror = (event) => {
                    reject(new Error('Failed to update key metadata in IndexedDB'));
                  };
                  
                  updateRequest.onsuccess = (event) => {
                    resolve();
                  };
                } else {
                  reject(new Error('Key not found in IndexedDB'));
                }
              };
            });
          } catch (error) {
            console.error('Failed to update key metadata in IndexedDB:', error);
          }
        }
        break;
      case KeyStorageType.SecureElement:
        if (this.isSecureElementAvailable()) {
          try {
            await this.updateKeyMetadataInSecureElement(id, metadata);
          } catch (error) {
            console.error('Failed to update key metadata in secure element:', error);
          }
        }
        break;
    }
  }
  
  /**
   * Store key in memory
   * @param id - Key ID
   * @param key - Key
   * @param metadata - Key metadata
   */
  private storeKeyInMemory(id: string, key: string, metadata: KeyMetadata): void {
    this.memoryStorage.set(id, { key, metadata });
  }
  
  /**
   * Get key from memory
   * @param id - Key ID
   * @returns Key
   */
  private getKeyFromMemory(id: string): string {
    const entry = this.memoryStorage.get(id);
    
    if (!entry) {
      throw new Error(`Key not found in memory: ${id}`);
    }
    
    return entry.key;
  }
  
  /**
   * Delete key from memory
   * @param id - Key ID
   * @returns Whether the key was deleted
   */
  private deleteKeyFromMemory(id: string): boolean {
    // Clear auto-delete timer
    this.clearAutoDeleteTimer(id);
    
    // Delete key
    return this.memoryStorage.delete(id);
  }
  
  /**
   * Store key in local storage
   * @param id - Key ID
   * @param key - Key
   * @param metadata - Key metadata
   */
  private storeKeyInLocalStorage(id: string, key: string, metadata: KeyMetadata): void {
    try {
      const localStorageKey = `darkswap-key-${id}`;
      localStorage.setItem(localStorageKey, JSON.stringify({ key, metadata }));
    } catch (error) {
      console.error('Failed to store key in local storage:', error);
      throw error;
    }
  }
  
  /**
   * Get key from local storage
   * @param id - Key ID
   * @returns Key
   */
  private getKeyFromLocalStorage(id: string): string {
    try {
      const localStorageKey = `darkswap-key-${id}`;
      const data = localStorage.getItem(localStorageKey);
      
      if (!data) {
        throw new Error(`Key not found in local storage: ${id}`);
      }
      
      return JSON.parse(data).key;
    } catch (error) {
      console.error('Failed to get key from local storage:', error);
      throw error;
    }
  }
  
  /**
   * Delete key from local storage
   * @param id - Key ID
   * @returns Whether the key was deleted
   */
  private deleteKeyFromLocalStorage(id: string): boolean {
    try {
      // Clear auto-delete timer
      this.clearAutoDeleteTimer(id);
      
      // Delete key
      const localStorageKey = `darkswap-key-${id}`;
      localStorage.removeItem(localStorageKey);
      
      return true;
    } catch (error) {
      console.error('Failed to delete key from local storage:', error);
      return false;
    }
  }
  
  /**
   * Store key in IndexedDB
   * @param id - Key ID
   * @param key - Key
   * @param metadata - Key metadata
   */
  private async storeKeyInIndexedDB(id: string, key: string, metadata: KeyMetadata): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
      
      if (!this.db) {
        throw new Error('IndexedDB is not available');
      }
    }
    
    try {
      const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
      
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ key, metadata });
        
        request.onerror = (event) => {
          reject(new Error('Failed to store key in IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to store key in IndexedDB:', error);
      throw error;
    }
  }
  
  /**
   * Get key from IndexedDB
   * @param id - Key ID
   * @returns Key
   */
  private async getKeyFromIndexedDB(id: string): Promise<string> {
    if (!this.db) {
      throw new Error('IndexedDB is not available');
    }
    
    try {
      const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
      
      const data = await new Promise<{ key: string; metadata: KeyMetadata }>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onerror = (event) => {
          reject(new Error('Failed to get key from IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          if (request.result) {
            resolve(request.result);
          } else {
            reject(new Error(`Key not found in IndexedDB: ${id}`));
          }
        };
      });
      
      return data.key;
    } catch (error) {
      console.error('Failed to get key from IndexedDB:', error);
      throw error;
    }
  }
  
  /**
   * Delete key from IndexedDB
   * @param id - Key ID
   * @returns Whether the key was deleted
   */
  private async deleteKeyFromIndexedDB(id: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }
    
    try {
      // Clear auto-delete timer
      this.clearAutoDeleteTimer(id);
      
      // Delete key
      const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
      
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onerror = (event) => {
          reject(new Error('Failed to delete key from IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          resolve();
        };
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete key from IndexedDB:', error);
      return false;
    }
  }
  
  /**
   * Check if secure element is available
   * @returns Whether secure element is available
   */
  private isSecureElementAvailable(): boolean {
    // Check if Web Crypto API is available
    return typeof window !== 'undefined' && 
           typeof window.crypto !== 'undefined' && 
           typeof window.crypto.subtle !== 'undefined';
  }
  
  /**
   * Store key in secure element
   * @param id - Key ID
   * @param key - Key
   * @param metadata - Key metadata
   */
  private async storeKeyInSecureElement(id: string, key: string, metadata: KeyMetadata): Promise<void> {
    if (!this.isSecureElementAvailable()) {
      throw new Error('Secure element is not available');
    }
    
    try {
      // Store key in IndexedDB for now
      // In a real implementation, this would use the Web Crypto API
      await this.storeKeyInIndexedDB(id, key, metadata);
    } catch (error) {
      console.error('Failed to store key in secure element:', error);
      throw error;
    }
  }
  
  /**
   * Get key from secure element
   * @param id - Key ID
   * @returns Key
   */
  private async getKeyFromSecureElement(id: string): Promise<string> {
    if (!this.isSecureElementAvailable()) {
      throw new Error('Secure element is not available');
    }
    
    try {
      // Get key from IndexedDB for now
      // In a real implementation, this would use the Web Crypto API
      return await this.getKeyFromIndexedDB(id);
    } catch (error) {
      console.error('Failed to get key from secure element:', error);
      throw error;
    }
  }
  
  /**
   * Delete key from secure element
   * @param id - Key ID
   * @returns Whether the key was deleted
   */
  private async deleteKeyFromSecureElement(id: string): Promise<boolean> {
    if (!this.isSecureElementAvailable()) {
      return false;
    }
    
    try {
      // Delete key from IndexedDB for now
      // In a real implementation, this would use the Web Crypto API
      return await this.deleteKeyFromIndexedDB(id);
    } catch (error) {
      console.error('Failed to delete key from secure element:', error);
      return false;
    }
  }
  
  /**
   * Get key metadata from secure element
   * @param id - Key ID
   * @returns Key metadata
   */
  private async getKeyMetadataFromSecureElement(id: string): Promise<KeyMetadata | null> {
    if (!this.isSecureElementAvailable()) {
      return null;
    }
    
    try {
      // Get key metadata from IndexedDB for now
      // In a real implementation, this would use the Web Crypto API
      if (!this.db) {
        return null;
      }
      
      const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
      
      const data = await new Promise<{ key: string; metadata: KeyMetadata } | null>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onerror = (event) => {
          resolve(null);
        };
        
        request.onsuccess = (event) => {
          if (request.result) {
            resolve(request.result);
          } else {
            resolve(null);
          }
        };
      });
      
      return data ? data.metadata : null;
    } catch (error) {
      console.error('Failed to get key metadata from secure element:', error);
      return null;
    }
  }
  
  /**
   * Update key metadata in secure element
   * @param id - Key ID
   * @param metadata - Key metadata
   */
  private async updateKeyMetadataInSecureElement(id: string, metadata: KeyMetadata): Promise<void> {
    if (!this.isSecureElementAvailable()) {
      throw new Error('Secure element is not available');
    }
    
    try {
      // Update key metadata in IndexedDB for now
      // In a real implementation, this would use the Web Crypto API
      if (!this.db) {
        throw new Error('IndexedDB is not available');
      }
      
      const storeName = this.options.storeName || KeyManager.DEFAULT_OPTIONS.storeName!;
      
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onerror = (event) => {
          reject(new Error('Failed to get key from IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          if (request.result) {
            const data = request.result;
            data.metadata = metadata;
            
            const updateRequest = store.put(data);
            
            updateRequest.onerror = (event) => {
              reject(new Error('Failed to update key metadata in IndexedDB'));
            };
            
            updateRequest.onsuccess = (event) => {
              resolve();
            };
          } else {
            reject(new Error('Key not found in IndexedDB'));
          }
        };
      });
    } catch (error) {
      console.error('Failed to update key metadata in secure element:', error);
      throw error;
    }
  }
  
  /**
   * Encrypt key
   * @param key - Key to encrypt
   * @param password - Encryption password
   * @returns Encrypted key
   */
  private async encryptKey(key: string, password: string): Promise<string> {
    if (!this.isSecureElementAvailable()) {
      // Simple encryption for demo purposes
      // In a real implementation, this would use the Web Crypto API
      return btoa(key + ':' + password);
    }
    
    try {
      // Get key material
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Generate salt
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      
      // Derive key
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Generate IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt key
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        derivedKey,
        new TextEncoder().encode(key)
      );
      
      // Combine salt, IV, and encrypted data
      const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      encryptedArray.set(salt, 0);
      encryptedArray.set(iv, salt.length);
      encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode.apply(null, Array.from(encryptedArray)));
    } catch (error) {
      console.error('Failed to encrypt key:', error);
      
      // Fall back to simple encryption
      return btoa(key + ':' + password);
    }
  }
  
  /**
   * Decrypt key
   * @param encryptedKey - Encrypted key
   * @param password - Decryption password
