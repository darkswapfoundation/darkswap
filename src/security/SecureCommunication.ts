/**
 * SecureCommunication.ts - Secure communication protocols
 * 
 * This file provides utilities for secure communication between peers.
 */

/**
 * Encryption algorithm
 */
export enum EncryptionAlgorithm {
  /**
   * AES-GCM
   */
  AES_GCM = 'AES-GCM',
  
  /**
   * AES-CBC
   */
  AES_CBC = 'AES-CBC',
  
  /**
   * ChaCha20-Poly1305
   */
  CHACHA20_POLY1305 = 'CHACHA20-POLY1305',
}

/**
 * Key exchange algorithm
 */
export enum KeyExchangeAlgorithm {
  /**
   * ECDH with P-256
   */
  ECDH_P256 = 'ECDH-P256',
  
  /**
   * ECDH with P-384
   */
  ECDH_P384 = 'ECDH-P384',
  
  /**
   * ECDH with P-521
   */
  ECDH_P521 = 'ECDH-P521',
  
  /**
   * X25519
   */
  X25519 = 'X25519',
}

/**
 * Secure channel options
 */
export interface SecureChannelOptions {
  /**
   * Encryption algorithm
   */
  encryptionAlgorithm?: EncryptionAlgorithm;
  
  /**
   * Key exchange algorithm
   */
  keyExchangeAlgorithm?: KeyExchangeAlgorithm;
  
  /**
   * Whether to use perfect forward secrecy
   */
  usePerfectForwardSecrecy?: boolean;
  
  /**
   * Key rotation interval in milliseconds
   */
  keyRotationInterval?: number;
}

/**
 * Secure channel
 * 
 * This class provides a secure communication channel between peers.
 */
export class SecureChannel {
  /**
   * Default options
   */
  private static readonly DEFAULT_OPTIONS: SecureChannelOptions = {
    encryptionAlgorithm: EncryptionAlgorithm.AES_GCM,
    keyExchangeAlgorithm: KeyExchangeAlgorithm.X25519,
    usePerfectForwardSecrecy: true,
    keyRotationInterval: 3600000, // 1 hour
  };
  
  /**
   * Options
   */
  private options: SecureChannelOptions;
  
  /**
   * Channel ID
   */
  private channelId: string;
  
  /**
   * Encryption key
   */
  private encryptionKey: CryptoKey | null = null;
  
  /**
   * Decryption key
   */
  private decryptionKey: CryptoKey | null = null;
  
  /**
   * Key pair
   */
  private keyPair: CryptoKeyPair | null = null;
  
  /**
   * Peer public key
   */
  private peerPublicKey: CryptoKey | null = null;
  
  /**
   * Key rotation timer
   */
  private keyRotationTimer: NodeJS.Timeout | null = null;
  
  /**
   * Constructor
   * @param channelId - Channel ID
   * @param options - Secure channel options
   */
  constructor(channelId: string, options: SecureChannelOptions = {}) {
    this.channelId = channelId;
    this.options = {
      ...SecureChannel.DEFAULT_OPTIONS,
      ...options,
    };
  }
  
  /**
   * Initialize channel
   * @param peerPublicKeyData - Peer public key data
   */
  async initialize(peerPublicKeyData?: ArrayBuffer): Promise<ArrayBuffer> {
    // Generate key pair
    this.keyPair = await this.generateKeyPair();
    
    // Export public key
    const publicKeyData = await crypto.subtle.exportKey(
      'raw',
      this.keyPair.publicKey,
    );
    
    // Import peer public key if provided
    if (peerPublicKeyData) {
      this.peerPublicKey = await this.importPublicKey(peerPublicKeyData);
      
      // Derive shared secret
      await this.deriveSharedSecret();
    }
    
    // Set up key rotation
    if (this.options.keyRotationInterval && this.options.keyRotationInterval > 0) {
      this.startKeyRotation();
    }
    
    return publicKeyData;
  }
  
  /**
   * Set peer public key
   * @param peerPublicKeyData - Peer public key data
   */
  async setPeerPublicKey(peerPublicKeyData: ArrayBuffer): Promise<void> {
    // Import peer public key
    this.peerPublicKey = await this.importPublicKey(peerPublicKeyData);
    
    // Derive shared secret
    await this.deriveSharedSecret();
  }
  
  /**
   * Encrypt data
   * @param data - Data to encrypt
   * @returns Encrypted data
   */
  async encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Check if encryption key is available
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.options.encryptionAlgorithm || EncryptionAlgorithm.AES_GCM,
        iv,
      },
      this.encryptionKey,
      data,
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return result.buffer;
  }
  
  /**
   * Decrypt data
   * @param encryptedData - Encrypted data
   * @returns Decrypted data
   */
  async decrypt(encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
    // Check if decryption key is available
    if (!this.decryptionKey) {
      throw new Error('Decryption key not available');
    }
    
    // Extract IV and encrypted data
    const iv = new Uint8Array(encryptedData.slice(0, 12));
    const data = new Uint8Array(encryptedData.slice(12));
    
    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: this.options.encryptionAlgorithm || EncryptionAlgorithm.AES_GCM,
        iv,
      },
      this.decryptionKey,
      data,
    );
    
    return decryptedData;
  }
  
  /**
   * Close channel
   */
  close(): void {
    // Stop key rotation
    if (this.keyRotationTimer) {
      clearTimeout(this.keyRotationTimer);
      this.keyRotationTimer = null;
    }
    
    // Clear keys
    this.encryptionKey = null;
    this.decryptionKey = null;
    this.keyPair = null;
    this.peerPublicKey = null;
  }
  
  /**
   * Generate key pair
   * @returns Key pair
   */
  private async generateKeyPair(): Promise<CryptoKeyPair> {
    // Get key exchange algorithm parameters
    const algorithm = this.getKeyExchangeAlgorithm();
    
    // Generate key pair
    const keyPair = await crypto.subtle.generateKey(
      algorithm,
      true,
      ['deriveKey', 'deriveBits'],
    ) as CryptoKeyPair;
    
    return keyPair;
  }
  
  /**
   * Import public key
   * @param publicKeyData - Public key data
   * @returns Public key
   */
  private async importPublicKey(publicKeyData: ArrayBuffer): Promise<CryptoKey> {
    // Get key exchange algorithm parameters
    const algorithm = this.getKeyExchangeAlgorithm();
    
    // Import public key
    return crypto.subtle.importKey(
      'raw',
      publicKeyData,
      algorithm,
      true,
      [],
    );
  }
  
  /**
   * Derive shared secret
   */
  private async deriveSharedSecret(): Promise<void> {
    // Check if key pair and peer public key are available
    if (!this.keyPair || !this.peerPublicKey) {
      throw new Error('Key pair or peer public key not available');
    }
    
    // Get encryption algorithm
    const algorithm = this.getEncryptionAlgorithm();
    
    // Derive encryption key
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: this.getKeyExchangeAlgorithmName(),
        public: this.peerPublicKey,
      },
      this.keyPair.privateKey,
      {
        name: algorithm.name,
        length: 'length' in algorithm ? algorithm.length : 256,
      },
      false,
      ['encrypt'],
    );
    
    // Derive decryption key
    this.decryptionKey = await crypto.subtle.deriveKey(
      {
        name: this.getKeyExchangeAlgorithmName(),
        public: this.peerPublicKey,
      },
      this.keyPair.privateKey,
      {
        name: algorithm.name,
        length: 'length' in algorithm ? algorithm.length : 256,
      },
      false,
      ['decrypt'],
    );
  }
  
  /**
   * Start key rotation
   */
  private startKeyRotation(): void {
    // Clear existing timer
    if (this.keyRotationTimer) {
      clearTimeout(this.keyRotationTimer);
    }
    
    // Set new timer
    this.keyRotationTimer = setTimeout(async () => {
      try {
        // Generate new key pair
        this.keyPair = await this.generateKeyPair();
        
        // Derive new shared secret
        if (this.peerPublicKey) {
          await this.deriveSharedSecret();
        }
        
        // Restart key rotation
        this.startKeyRotation();
      } catch (error) {
        console.error('Failed to rotate keys:', error);
      }
    }, this.options.keyRotationInterval);
  }
  
  /**
   * Get key exchange algorithm
   * @returns Key exchange algorithm
   */
  private getKeyExchangeAlgorithm(): EcKeyGenParams | Algorithm {
    switch (this.options.keyExchangeAlgorithm) {
      case KeyExchangeAlgorithm.ECDH_P256:
        return {
          name: 'ECDH',
          namedCurve: 'P-256',
        };
      case KeyExchangeAlgorithm.ECDH_P384:
        return {
          name: 'ECDH',
          namedCurve: 'P-384',
        };
      case KeyExchangeAlgorithm.ECDH_P521:
        return {
          name: 'ECDH',
          namedCurve: 'P-521',
        };
      case KeyExchangeAlgorithm.X25519:
        // Note: X25519 is not supported by the Web Crypto API
        // This is a placeholder for when it becomes available
        return {
          name: 'ECDH',
          namedCurve: 'P-256',
        };
      default:
        return {
          name: 'ECDH',
          namedCurve: 'P-256',
        };
    }
  }
  
  /**
   * Get key exchange algorithm name
   * @returns Key exchange algorithm name
   */
  private getKeyExchangeAlgorithmName(): string {
    switch (this.options.keyExchangeAlgorithm) {
      case KeyExchangeAlgorithm.ECDH_P256:
      case KeyExchangeAlgorithm.ECDH_P384:
      case KeyExchangeAlgorithm.ECDH_P521:
        return 'ECDH';
      case KeyExchangeAlgorithm.X25519:
        // Note: X25519 is not supported by the Web Crypto API
        // This is a placeholder for when it becomes available
        return 'ECDH';
      default:
        return 'ECDH';
    }
  }
  
  /**
   * Get encryption algorithm
   * @returns Encryption algorithm
   */
  private getEncryptionAlgorithm(): AesKeyGenParams | Algorithm {
    switch (this.options.encryptionAlgorithm) {
      case EncryptionAlgorithm.AES_GCM:
        return {
          name: 'AES-GCM',
          length: 256,
        };
      case EncryptionAlgorithm.AES_CBC:
        return {
          name: 'AES-CBC',
          length: 256,
        };
      case EncryptionAlgorithm.CHACHA20_POLY1305:
        // Note: ChaCha20-Poly1305 is not supported by the Web Crypto API
        // This is a placeholder for when it becomes available
        return {
          name: 'AES-GCM',
          length: 256,
        };
      default:
        return {
          name: 'AES-GCM',
          length: 256,
        };
    }
  }
}

/**
 * Secure message
 */
export interface SecureMessage {
  /**
   * Message ID
   */
  id: string;
  
  /**
   * Sender ID
   */
  senderId: string;
  
  /**
   * Recipient ID
   */
  recipientId: string;
  
  /**
   * Message type
   */
  type: string;
  
  /**
   * Message payload
   */
  payload: ArrayBuffer;
  
  /**
   * Message timestamp
   */
  timestamp: number;
  
  /**
   * Message signature
   */
  signature?: ArrayBuffer;
}

/**
 * Secure messaging options
 */
export interface SecureMessagingOptions {
  /**
   * Peer ID
   */
  peerId: string;
  
  /**
   * Secure channel options
   */
  channelOptions?: SecureChannelOptions;
  
  /**
   * Whether to sign messages
   */
  signMessages?: boolean;
  
  /**
   * Whether to verify message signatures
   */
  verifySignatures?: boolean;
}

/**
 * Secure messaging
 * 
 * This class provides secure messaging between peers.
 */
export class SecureMessaging {
  /**
   * Default options
   */
  private static readonly DEFAULT_OPTIONS: Partial<SecureMessagingOptions> = {
    channelOptions: {
      encryptionAlgorithm: EncryptionAlgorithm.AES_GCM,
      keyExchangeAlgorithm: KeyExchangeAlgorithm.X25519,
      usePerfectForwardSecrecy: true,
      keyRotationInterval: 3600000, // 1 hour
    },
    signMessages: true,
    verifySignatures: true,
  };
  
  /**
   * Options
   */
  private options: SecureMessagingOptions;
  
  /**
   * Secure channels
   */
  private channels: Map<string, SecureChannel> = new Map();
  
  /**
   * Signing key
   */
  private signingKey: CryptoKey | null = null;
  
  /**
   * Verification keys
   */
  private verificationKeys: Map<string, CryptoKey> = new Map();
  
  /**
   * Constructor
   * @param options - Secure messaging options
   */
  constructor(options: SecureMessagingOptions) {
    this.options = {
      ...SecureMessaging.DEFAULT_OPTIONS,
      ...options,
    };
    
    // Generate signing key
    if (this.options.signMessages) {
      this.generateSigningKey();
    }
  }
  
  /**
   * Initialize channel
   * @param peerId - Peer ID
   * @param peerPublicKeyData - Peer public key data
   * @returns Public key data
   */
  async initializeChannel(peerId: string, peerPublicKeyData?: ArrayBuffer): Promise<ArrayBuffer> {
    // Create channel ID
    const channelId = this.createChannelId(this.options.peerId, peerId);
    
    // Create secure channel
    const channel = new SecureChannel(channelId, this.options.channelOptions);
    
    // Initialize channel
    const publicKeyData = await channel.initialize(peerPublicKeyData);
    
    // Store channel
    this.channels.set(peerId, channel);
    
    return publicKeyData;
  }
  
  /**
   * Set peer public key
   * @param peerId - Peer ID
   * @param peerPublicKeyData - Peer public key data
   */
  async setPeerPublicKey(peerId: string, peerPublicKeyData: ArrayBuffer): Promise<void> {
    // Get channel
    const channel = this.channels.get(peerId);
    
    if (!channel) {
      throw new Error(`Channel not found for peer ${peerId}`);
    }
    
    // Set peer public key
    await channel.setPeerPublicKey(peerPublicKeyData);
  }
  
  /**
   * Send message
   * @param peerId - Peer ID
   * @param type - Message type
   * @param payload - Message payload
   * @returns Message ID
   */
  async sendMessage(peerId: string, type: string, payload: ArrayBuffer): Promise<string> {
    // Get channel
    const channel = this.channels.get(peerId);
    
    if (!channel) {
      throw new Error(`Channel not found for peer ${peerId}`);
    }
    
    // Create message
    const message: SecureMessage = {
      id: this.generateMessageId(),
      senderId: this.options.peerId,
      recipientId: peerId,
      type,
      payload,
      timestamp: Date.now(),
    };
    
    // Sign message
    if (this.options.signMessages && this.signingKey) {
      message.signature = await this.signMessage(message);
    }
    
    // Serialize message
    const serializedMessage = this.serializeMessage(message);
    
    // Encrypt message
    const encryptedMessage = await channel.encrypt(serializedMessage);
    
    // Send message
    // In a real implementation, this would send the message over the network
    console.log(`Sending message to ${peerId}:`, message);
    
    return message.id;
  }
  
  /**
   * Receive message
   * @param peerId - Peer ID
   * @param encryptedMessage - Encrypted message
   * @returns Decrypted message
   */
  async receiveMessage(peerId: string, encryptedMessage: ArrayBuffer): Promise<SecureMessage> {
    // Get channel
    const channel = this.channels.get(peerId);
    
    if (!channel) {
      throw new Error(`Channel not found for peer ${peerId}`);
    }
    
    // Decrypt message
    const serializedMessage = await channel.decrypt(encryptedMessage);
    
    // Deserialize message
    const message = this.deserializeMessage(serializedMessage);
    
    // Verify message
    if (this.options.verifySignatures && message.signature) {
      const isValid = await this.verifyMessage(message);
      
      if (!isValid) {
        throw new Error('Invalid message signature');
      }
    }
    
    return message;
  }
  
  /**
   * Close channel
   * @param peerId - Peer ID
   */
  closeChannel(peerId: string): void {
    // Get channel
    const channel = this.channels.get(peerId);
    
    if (!channel) {
      return;
    }
    
    // Close channel
    channel.close();
    
    // Remove channel
    this.channels.delete(peerId);
  }
  
  /**
   * Close all channels
   */
  closeAllChannels(): void {
    // Close all channels
    for (const [peerId, channel] of this.channels.entries()) {
      channel.close();
    }
    
    // Clear channels
    this.channels.clear();
  }
  
  /**
   * Set verification key
   * @param peerId - Peer ID
   * @param publicKeyData - Public key data
   */
  async setVerificationKey(peerId: string, publicKeyData: ArrayBuffer): Promise<void> {
    // Import public key
    const publicKey = await crypto.subtle.importKey(
      'raw',
      publicKeyData,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['verify'],
    );
    
    // Store verification key
    this.verificationKeys.set(peerId, publicKey);
  }
  
  /**
   * Generate signing key
   */
  private async generateSigningKey(): Promise<void> {
    // Generate key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify'],
    ) as CryptoKeyPair;
    
    // Store signing key
    this.signingKey = keyPair.privateKey;
  }
  
  /**
   * Sign message
   * @param message - Message to sign
   * @returns Signature
   */
  private async signMessage(message: SecureMessage): Promise<ArrayBuffer> {
    // Check if signing key is available
    if (!this.signingKey) {
      throw new Error('Signing key not available');
    }
    
    // Create message hash
    const messageHash = await this.createMessageHash(message);
    
    // Sign message hash
    return crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      this.signingKey,
      messageHash,
    );
  }
  
  /**
   * Verify message
   * @param message - Message to verify
   * @returns Whether the message is valid
   */
  private async verifyMessage(message: SecureMessage): Promise<boolean> {
    // Check if message has a signature
    if (!message.signature) {
      return false;
    }
    
    // Get verification key
    const verificationKey = this.verificationKeys.get(message.senderId);
    
    if (!verificationKey) {
      throw new Error(`Verification key not found for peer ${message.senderId}`);
    }
    
    // Create message hash
    const messageHash = await this.createMessageHash(message);
    
    // Verify signature
    return crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      verificationKey,
      message.signature,
      messageHash,
    );
  }
  
  /**
   * Create message hash
   * @param message - Message
   * @returns Message hash
   */
  private async createMessageHash(message: SecureMessage): Promise<ArrayBuffer> {
    // Create message data without signature
    const messageData = {
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      type: message.type,
      payload: Array.from(new Uint8Array(message.payload)),
      timestamp: message.timestamp,
    };
    
    // Serialize message data
    const serializedData = JSON.stringify(messageData);
    
    // Hash message data
    const encoder = new TextEncoder();
    const data = encoder.encode(serializedData);
    
    return crypto.subtle.digest('SHA-256', data);
  }
  
  /**
   * Serialize message
   * @param message - Message
   * @returns Serialized message
   */
  private serializeMessage(message: SecureMessage): ArrayBuffer {
    // Create message data
    const messageData = {
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      type: message.type,
      payload: Array.from(new Uint8Array(message.payload)),
      timestamp: message.timestamp,
      signature: message.signature ? Array.from(new Uint8Array(message.signature)) : undefined,
    };
    
    // Serialize message data
    const serializedData = JSON.stringify(messageData);
    
    // Convert to ArrayBuffer
    const encoder = new TextEncoder();
    return encoder.encode(serializedData).buffer;
  }
  
  /**
   * Deserialize message
   * @param serializedMessage - Serialized message
   * @returns Deserialized message
   */
  private deserializeMessage(serializedMessage: ArrayBuffer): SecureMessage {
    // Convert to string
    const decoder = new TextDecoder();
    const serializedData = decoder.decode(serializedMessage);
    
    // Parse message data
    const messageData = JSON.parse(serializedData);
    
    // Create message
    const message: SecureMessage = {
      id: messageData.id,
      senderId: messageData.senderId,
      recipientId: messageData.recipientId,
      type: messageData.type,
      payload: new Uint8Array(messageData.payload).buffer,
      timestamp: messageData.timestamp,
      signature: messageData.signature ? new Uint8Array(messageData.signature).buffer : undefined,
    };
    
    return message;
  }
  
  /**
   * Create channel ID
   * @param peerId1 - Peer ID 1
   * @param peerId2 - Peer ID 2
   * @returns Channel ID
   */
  private createChannelId(peerId1: string, peerId2: string): string {
    // Sort peer IDs
    const sortedPeerIds = [peerId1, peerId2].sort();
    
    // Combine peer IDs
    return `${sortedPeerIds[0]}-${sortedPeerIds[1]}`;
  }
  
  /**
   * Generate message ID
   * @returns Message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Default export
 */
export default SecureMessaging;