/**
 * Peer Encryption Service
 * 
 * This service provides end-to-end encryption for peer-to-peer messages.
 * It uses the Web Crypto API to generate keys, encrypt, and decrypt messages.
 */

// Key pair type
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJwk?: JsonWebKey;
}

// Encrypted message
export interface EncryptedMessage {
  iv: string; // Base64-encoded initialization vector
  ephemeralPublicKey: string; // Base64-encoded ephemeral public key
  ciphertext: string; // Base64-encoded ciphertext
  mac: string; // Base64-encoded MAC
  version: string; // Encryption version
}

// Peer key info
export interface PeerKeyInfo {
  peerId: string;
  publicKeyJwk: JsonWebKey;
  lastUsed: number;
  trusted: boolean;
}

// Encryption options
export interface EncryptionOptions {
  keySize?: number;
  algorithm?: string;
  hashAlgorithm?: string;
  storageKey?: string;
}

/**
 * Peer Encryption Service
 */
export class PeerEncryptionService {
  private static instance: PeerEncryptionService;
  private options: EncryptionOptions;
  private keyPair: KeyPair | null = null;
  private peerKeys: Map<string, PeerKeyInfo> = new Map();
  private isInitialized: boolean = false;

  /**
   * Get the singleton instance of the service
   * @param options Encryption options
   * @returns PeerEncryptionService instance
   */
  public static getInstance(options?: EncryptionOptions): PeerEncryptionService {
    if (!PeerEncryptionService.instance) {
      PeerEncryptionService.instance = new PeerEncryptionService(options);
    } else if (options) {
      PeerEncryptionService.instance.updateOptions(options);
    }
    return PeerEncryptionService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   * @param options Encryption options
   */
  private constructor(options?: EncryptionOptions) {
    this.options = {
      keySize: 2048,
      algorithm: 'RSA-OAEP',
      hashAlgorithm: 'SHA-256',
      storageKey: 'darkswap-peer-encryption',
      ...options,
    };
  }

  /**
   * Update options
   * @param options Encryption options
   */
  public updateOptions(options: Partial<EncryptionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Initialize the service
   * @param forceNewKeys Force generation of new keys
   * @returns Promise that resolves when initialized
   */
  public async initialize(forceNewKeys: boolean = false): Promise<void> {
    try {
      if (this.isInitialized && !forceNewKeys) {
        return;
      }

      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API is not available');
      }

      // Load existing keys from storage or generate new ones
      if (!forceNewKeys) {
        const loadedKeys = await this.loadKeysFromStorage();
        if (loadedKeys) {
          this.keyPair = loadedKeys;
          this.isInitialized = true;
          return;
        }
      }

      // Generate new key pair
      this.keyPair = await this.generateKeyPair();

      // Save keys to storage
      await this.saveKeysToStorage();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize peer encryption service:', error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   * @returns True if initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.keyPair !== null;
  }

  /**
   * Generate a new key pair
   * @returns Key pair
   */
  private async generateKeyPair(): Promise<KeyPair> {
    try {
      // Generate key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: this.options.algorithm || 'RSA-OAEP',
          modulusLength: this.options.keySize || 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: this.options.hashAlgorithm || 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt'] // key usages
      );

      // Export public key as JWK
      const publicKeyJwk = await window.crypto.subtle.exportKey(
        'jwk',
        keyPair.publicKey
      );

      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyJwk,
      };
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  /**
   * Save keys to storage
   */
  private async saveKeysToStorage(): Promise<void> {
    try {
      if (!this.keyPair) {
        return;
      }

      // Export keys as JWK for easier storage
      const publicKeyJwk = await window.crypto.subtle.exportKey(
        'jwk',
        this.keyPair.publicKey
      );
      const privateKeyJwk = await window.crypto.subtle.exportKey(
        'jwk',
        this.keyPair.privateKey
      );

      // Save to local storage
      const keysData = {
        publicKey: publicKeyJwk,
        privateKey: privateKeyJwk,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.options.storageKey!, JSON.stringify(keysData));
    } catch (error) {
      console.error('Failed to save keys to storage:', error);
      throw error;
    }
  }

  /**
   * Load keys from storage
   * @returns Key pair or null if not found
   */
  private async loadKeysFromStorage(): Promise<KeyPair | null> {
    try {
      // Get from local storage
      const keysData = localStorage.getItem(this.options.storageKey!);
      if (!keysData) {
        return null;
      }

      // Parse keys data
      const { publicKey: publicKeyJwk, privateKey: privateKeyJwk } = JSON.parse(keysData);
      if (!publicKeyJwk || !privateKeyJwk) {
        return null;
      }

      // Import keys
      const publicKey = await window.crypto.subtle.importKey(
        'jwk',
        publicKeyJwk as JsonWebKey,
        {
          name: this.options.algorithm || 'RSA-OAEP',
          hash: this.options.hashAlgorithm || 'SHA-256',
        },
        true,
        ['encrypt']
      );

      const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        privateKeyJwk as JsonWebKey,
        {
          name: this.options.algorithm || 'RSA-OAEP',
          hash: this.options.hashAlgorithm || 'SHA-256',
        },
        true,
        ['decrypt']
      );

      return {
        publicKey,
        privateKey,
        publicKeyJwk,
      };
    } catch (error) {
      console.error('Failed to load keys from storage:', error);
      return null;
    }
  }

  /**
   * Get public key as JWK
   * @returns Public key as JWK
   */
  public async getPublicKeyJwk(): Promise<JsonWebKey | null> {
    if (!this.isReady() || !this.keyPair) {
      return null;
    }

    if (this.keyPair.publicKeyJwk) {
      return this.keyPair.publicKeyJwk;
    }

    try {
      const publicKeyJwk = await window.crypto.subtle.exportKey(
        'jwk',
        this.keyPair.publicKey
      );
      this.keyPair.publicKeyJwk = publicKeyJwk;
      return publicKeyJwk;
    } catch (error) {
      console.error('Failed to export public key:', error);
      return null;
    }
  }

  /**
   * Add peer public key
   * @param peerId Peer ID
   * @param publicKeyJwk Public key as JWK
   * @param trusted Whether the key is trusted
   * @returns Success status
   */
  public addPeerPublicKey(peerId: string, publicKeyJwk: JsonWebKey, trusted: boolean = false): boolean {
    try {
      // Add to peer keys
      this.peerKeys.set(peerId, {
        peerId,
        publicKeyJwk,
        lastUsed: Date.now(),
        trusted,
      });

      return true;
    } catch (error) {
      console.error(`Failed to add peer public key for ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Remove peer public key
   * @param peerId Peer ID
   */
  public removePeerPublicKey(peerId: string): void {
    this.peerKeys.delete(peerId);
  }

  /**
   * Get peer public key
   * @param peerId Peer ID
   * @returns Peer key info or null if not found
   */
  public getPeerPublicKey(peerId: string): PeerKeyInfo | null {
    const peerKey = this.peerKeys.get(peerId);
    return peerKey || null;
  }

  /**
   * Get all peer public keys
   * @returns Array of peer key info
   */
  public getAllPeerPublicKeys(): PeerKeyInfo[] {
    return Array.from(this.peerKeys.values());
  }

  /**
   * Import peer public key
   * @param peerId Peer ID
   * @param publicKeyJwk Public key as JWK
   * @returns CryptoKey or null if failed
   */
  private async importPeerPublicKey(peerId: string, publicKeyJwk: JsonWebKey): Promise<CryptoKey | null> {
    try {
      // Import public key
      const publicKey = await window.crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        {
          name: this.options.algorithm || 'RSA-OAEP',
          hash: this.options.hashAlgorithm || 'SHA-256',
        },
        true,
        ['encrypt']
      );

      return publicKey;
    } catch (error) {
      console.error(`Failed to import public key for peer ${peerId}:`, error);
      return null;
    }
  }

  /**
   * Encrypt message for peer
   * @param peerId Peer ID
   * @param message Message to encrypt
   * @returns Encrypted message or null if failed
   */
  public async encryptForPeer(peerId: string, message: string): Promise<EncryptedMessage | null> {
    try {
      if (!this.isReady()) {
        throw new Error('Peer encryption service is not initialized');
      }

      // Get peer public key
      const peerKeyInfo = this.getPeerPublicKey(peerId);
      if (!peerKeyInfo) {
        throw new Error(`No public key found for peer ${peerId}`);
      }

      // Import peer public key
      const peerPublicKey = await this.importPeerPublicKey(peerId, peerKeyInfo.publicKeyJwk);
      if (!peerPublicKey) {
        throw new Error(`Failed to import public key for peer ${peerId}`);
      }

      // Generate ephemeral key pair for this message
      const ephemeralKeyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        true,
        ['deriveKey']
      );

      // Export ephemeral public key
      const ephemeralPublicKeyRaw = await window.crypto.subtle.exportKey(
        'raw',
        ephemeralKeyPair.publicKey
      );

      // Generate shared secret
      const sharedSecret = await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: peerPublicKey,
        },
        ephemeralKeyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt']
      );

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encode message
      const encoder = new TextEncoder();
      const messageData = encoder.encode(message);

      // Encrypt message
      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        sharedSecret,
        messageData
      );

      // Generate MAC
      const macData = await window.crypto.subtle.digest(
        this.options.hashAlgorithm!,
        new Uint8Array([...iv, ...new Uint8Array(ciphertext)])
      );

      // Update last used timestamp
      peerKeyInfo.lastUsed = Date.now();

      // Return encrypted message
      return {
        iv: this.arrayBufferToBase64(iv),
        ephemeralPublicKey: this.arrayBufferToBase64(ephemeralPublicKeyRaw),
        ciphertext: this.arrayBufferToBase64(ciphertext),
        mac: this.arrayBufferToBase64(macData),
        version: '1',
      };
    } catch (error) {
      console.error(`Failed to encrypt message for peer ${peerId}:`, error);
      return null;
    }
  }

  /**
   * Decrypt message from peer
   * @param peerId Peer ID
   * @param encryptedMessage Encrypted message
   * @returns Decrypted message or null if failed
   */
  public async decryptFromPeer(peerId: string, encryptedMessage: EncryptedMessage): Promise<string | null> {
    try {
      if (!this.isReady() || !this.keyPair) {
        throw new Error('Peer encryption service is not initialized');
      }

      // Get peer public key
      const peerKeyInfo = this.getPeerPublicKey(peerId);
      if (!peerKeyInfo) {
        throw new Error(`No public key found for peer ${peerId}`);
      }

      // Parse encrypted message
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv);
      const ephemeralPublicKeyRaw = this.base64ToArrayBuffer(encryptedMessage.ephemeralPublicKey);
      const ciphertext = this.base64ToArrayBuffer(encryptedMessage.ciphertext);
      const mac = this.base64ToArrayBuffer(encryptedMessage.mac);

      // Import ephemeral public key
      const ephemeralPublicKey = await window.crypto.subtle.importKey(
        'raw',
        ephemeralPublicKeyRaw,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        true,
        []
      );

      // Generate shared secret
      const sharedSecret = await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: ephemeralPublicKey,
        },
        this.keyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['decrypt']
      );
// Verify MAC
// Convert ArrayBuffers to Uint8Arrays and concatenate them
const ivArray = new Uint8Array(iv);
const ciphertextArray = new Uint8Array(ciphertext);
const combinedArray = new Uint8Array(ivArray.length + ciphertextArray.length);
combinedArray.set(ivArray, 0);
combinedArray.set(ciphertextArray, ivArray.length);

const computedMacData = await window.crypto.subtle.digest(
  this.options.hashAlgorithm || 'SHA-256',
  combinedArray
);
const computedMac = this.arrayBufferToBase64(computedMacData);

      if (computedMac !== encryptedMessage.mac) {
        throw new Error('MAC verification failed');
      }

      // Decrypt message
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        sharedSecret,
        ciphertext
      );

      // Decode message
      const decoder = new TextDecoder();
      const decryptedMessage = decoder.decode(decryptedData);

      // Update last used timestamp
      peerKeyInfo.lastUsed = Date.now();

      return decryptedMessage;
    } catch (error) {
      console.error(`Failed to decrypt message from peer ${peerId}:`, error);
      return null;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param buffer ArrayBuffer
   * @returns Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   * @param base64 Base64 string
   * @returns ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.keyPair = null;
    this.peerKeys.clear();
    this.isInitialized = false;
    localStorage.removeItem(this.options.storageKey!);
  }
}

export default PeerEncryptionService;