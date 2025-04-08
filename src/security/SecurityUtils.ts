/**
 * SecurityUtils.ts - Security utilities
 * 
 * This file provides utilities for common security operations.
 */

/**
 * Input validation options
 */
export interface InputValidationOptions {
  /**
   * Minimum length
   */
  minLength?: number;
  
  /**
   * Maximum length
   */
  maxLength?: number;
  
  /**
   * Regular expression pattern
   */
  pattern?: RegExp;
  
  /**
   * Whether to allow empty values
   */
  allowEmpty?: boolean;
  
  /**
   * Custom validator function
   */
  validator?: (value: string) => boolean;
}

/**
 * Rate limiting options
 */
export interface RateLimitingOptions {
  /**
   * Maximum number of requests
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  timeWindow: number;
  
  /**
   * Whether to use IP-based rate limiting
   */
  useIpBasedLimiting?: boolean;
  
  /**
   * Whether to use token bucket algorithm
   */
  useTokenBucket?: boolean;
  
  /**
   * Token bucket refill rate (tokens per millisecond)
   */
  tokenBucketRefillRate?: number;
}

/**
 * Rate limiter
 */
export class RateLimiter {
  /**
   * Maximum number of requests
   */
  private maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  private timeWindow: number;
  
  /**
   * Request timestamps by key
   */
  private requestTimestamps: Map<string, number[]> = new Map();
  
  /**
   * Token buckets by key
   */
  private tokenBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  
  /**
   * Whether to use token bucket algorithm
   */
  private useTokenBucket: boolean;
  
  /**
   * Token bucket refill rate (tokens per millisecond)
   */
  private tokenBucketRefillRate: number;
  
  /**
   * Constructor
   * @param options - Rate limiting options
   */
  constructor(options: RateLimitingOptions) {
    this.maxRequests = options.maxRequests;
    this.timeWindow = options.timeWindow;
    this.useTokenBucket = options.useTokenBucket || false;
    this.tokenBucketRefillRate = options.tokenBucketRefillRate || 0.001; // Default: 1 token per second
  }
  
  /**
   * Check if request is allowed
   * @param key - Request key (e.g., IP address, user ID)
   * @returns Whether the request is allowed
   */
  isAllowed(key: string): boolean {
    if (this.useTokenBucket) {
      return this.isAllowedTokenBucket(key);
    } else {
      return this.isAllowedSlidingWindow(key);
    }
  }
  
  /**
   * Check if request is allowed using sliding window algorithm
   * @param key - Request key
   * @returns Whether the request is allowed
   */
  private isAllowedSlidingWindow(key: string): boolean {
    // Get current time
    const now = Date.now();
    
    // Get request timestamps for key
    let timestamps = this.requestTimestamps.get(key);
    
    // Create timestamps array if it doesn't exist
    if (!timestamps) {
      timestamps = [];
      this.requestTimestamps.set(key, timestamps);
    }
    
    // Remove old timestamps
    const windowStart = now - this.timeWindow;
    timestamps = timestamps.filter(timestamp => timestamp >= windowStart);
    
    // Update timestamps
    this.requestTimestamps.set(key, timestamps);
    
    // Check if request is allowed
    if (timestamps.length >= this.maxRequests) {
      return false;
    }
    
    // Add current timestamp
    timestamps.push(now);
    
    return true;
  }
  
  /**
   * Check if request is allowed using token bucket algorithm
   * @param key - Request key
   * @returns Whether the request is allowed
   */
  private isAllowedTokenBucket(key: string): boolean {
    // Get current time
    const now = Date.now();
    
    // Get token bucket for key
    let bucket = this.tokenBuckets.get(key);
    
    // Create bucket if it doesn't exist
    if (!bucket) {
      bucket = {
        tokens: this.maxRequests,
        lastRefill: now,
      };
      this.tokenBuckets.set(key, bucket);
    }
    
    // Calculate tokens to add
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * this.tokenBucketRefillRate;
    
    // Refill bucket
    bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if request is allowed
    if (bucket.tokens < 1) {
      return false;
    }
    
    // Consume token
    bucket.tokens -= 1;
    
    return true;
  }
  
  /**
   * Reset rate limiter
   */
  reset(): void {
    this.requestTimestamps.clear();
    this.tokenBuckets.clear();
  }
}

/**
 * Validate input
 * @param input - Input to validate
 * @param options - Input validation options
 * @returns Whether the input is valid
 */
export function validateInput(input: string, options: InputValidationOptions = {}): boolean {
  // Check if input is empty
  if (!input && !options.allowEmpty) {
    return false;
  }
  
  // Check minimum length
  if (options.minLength !== undefined && input.length < options.minLength) {
    return false;
  }
  
  // Check maximum length
  if (options.maxLength !== undefined && input.length > options.maxLength) {
    return false;
  }
  
  // Check pattern
  if (options.pattern && !options.pattern.test(input)) {
    return false;
  }
  
  // Check custom validator
  if (options.validator && !options.validator(input)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize HTML
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  // Replace HTML tags with entities
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate random string
 * @param length - String length
 * @param charset - Character set
 * @returns Random string
 */
export function generateRandomString(
  length: number,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
): string {
  let result = '';
  const charsetLength = charset.length;
  
  // Generate random string
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charsetLength));
  }
  
  return result;
}

/**
 * Generate random bytes
 * @param length - Number of bytes
 * @returns Random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Hash data
 * @param data - Data to hash
 * @param algorithm - Hash algorithm
 * @returns Hash
 */
export async function hashData(
  data: ArrayBuffer | string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<ArrayBuffer> {
  // Convert string to ArrayBuffer if needed
  const buffer = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  
  // Hash data
  return crypto.subtle.digest(algorithm, buffer);
}

/**
 * Compare hashes in constant time
 * @param hash1 - First hash
 * @param hash2 - Second hash
 * @returns Whether the hashes are equal
 */
export function compareHashes(hash1: ArrayBuffer, hash2: ArrayBuffer): boolean {
  // Convert ArrayBuffers to Uint8Arrays
  const a = new Uint8Array(hash1);
  const b = new Uint8Array(hash2);
  
  // Check if lengths are equal
  if (a.length !== b.length) {
    return false;
  }
  
  // Compare hashes in constant time
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

/**
 * Generate HMAC
 * @param key - Key
 * @param data - Data
 * @param algorithm - Hash algorithm
 * @returns HMAC
 */
export async function generateHmac(
  key: CryptoKey,
  data: ArrayBuffer | string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<ArrayBuffer> {
  // Convert string to ArrayBuffer if needed
  const buffer = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  
  // Generate HMAC
  return crypto.subtle.sign(
    {
      name: 'HMAC',
      hash: { name: algorithm },
    },
    key,
    buffer,
  );
}

/**
 * Verify HMAC
 * @param key - Key
 * @param signature - Signature
 * @param data - Data
 * @param algorithm - Hash algorithm
 * @returns Whether the signature is valid
 */
export async function verifyHmac(
  key: CryptoKey,
  signature: ArrayBuffer,
  data: ArrayBuffer | string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<boolean> {
  // Convert string to ArrayBuffer if needed
  const buffer = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  
  // Verify HMAC
  return crypto.subtle.verify(
    {
      name: 'HMAC',
      hash: { name: algorithm },
    },
    key,
    signature,
    buffer,
  );
}

/**
 * Generate HMAC key
 * @param algorithm - Hash algorithm
 * @returns HMAC key
 */
export async function generateHmacKey(
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<CryptoKey> {
  // Generate key
  return crypto.subtle.generateKey(
    {
      name: 'HMAC',
      hash: { name: algorithm },
    },
    true,
    ['sign', 'verify'],
  );
}

/**
 * Import HMAC key
 * @param key - Key
 * @param algorithm - Hash algorithm
 * @returns HMAC key
 */
export async function importHmacKey(
  key: ArrayBuffer | string,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<CryptoKey> {
  // Convert string to ArrayBuffer if needed
  const buffer = typeof key === 'string'
    ? new TextEncoder().encode(key)
    : key;
  
  // Import key
  return crypto.subtle.importKey(
    'raw',
    buffer,
    {
      name: 'HMAC',
      hash: { name: algorithm },
    },
    false,
    ['sign', 'verify'],
  );
}

/**
 * Generate nonce
 * @param length - Nonce length
 * @returns Nonce
 */
export function generateNonce(length: number = 16): string {
  // Generate random bytes
  const bytes = generateRandomBytes(length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Generate timestamp
 * @returns Timestamp
 */
export function generateTimestamp(): number {
  return Date.now();
}

/**
 * Validate timestamp
 * @param timestamp - Timestamp to validate
 * @param maxAge - Maximum age in milliseconds
 * @returns Whether the timestamp is valid
 */
export function validateTimestamp(timestamp: number, maxAge: number): boolean {
  // Get current time
  const now = Date.now();
  
  // Check if timestamp is in the future
  if (timestamp > now) {
    return false;
  }
  
  // Check if timestamp is too old
  if (now - timestamp > maxAge) {
    return false;
  }
  
  return true;
}

/**
 * Prevent replay attacks
 */
export class ReplayPrevention {
  /**
   * Used nonces
   */
  private usedNonces: Set<string> = new Set();
  
  /**
   * Maximum age of nonces in milliseconds
   */
  private maxAge: number;
  
  /**
   * Constructor
   * @param maxAge - Maximum age of nonces in milliseconds
   */
  constructor(maxAge: number = 300000) { // Default: 5 minutes
    this.maxAge = maxAge;
    
    // Clean up used nonces periodically
    setInterval(() => {
      this.cleanupUsedNonces();
    }, maxAge);
  }
  
  /**
   * Validate nonce and timestamp
   * @param nonce - Nonce
   * @param timestamp - Timestamp
   * @returns Whether the nonce and timestamp are valid
   */
  validate(nonce: string, timestamp: number): boolean {
    // Check if nonce is already used
    if (this.usedNonces.has(nonce)) {
      return false;
    }
    
    // Validate timestamp
    if (!validateTimestamp(timestamp, this.maxAge)) {
      return false;
    }
    
    // Add nonce to used nonces
    this.usedNonces.add(nonce);
    
    return true;
  }
  
  /**
   * Clean up used nonces
   */
  private cleanupUsedNonces(): void {
    // Get current time
    const now = Date.now();
    
    // Remove old nonces
    for (const nonce of this.usedNonces) {
      // Extract timestamp from nonce (assuming nonce format: timestamp-random)
      const parts = nonce.split('-');
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[0], 10);
        
        // Check if nonce is too old
        if (now - timestamp > this.maxAge) {
          this.usedNonces.delete(nonce);
        }
      }
    }
  }
  
  /**
   * Reset replay prevention
   */
  reset(): void {
    this.usedNonces.clear();
  }
}

/**
 * Secure error handler
 * @param error - Error
 * @param includeDetails - Whether to include error details
 * @returns Secure error
 */
export function secureErrorHandler(error: Error, includeDetails: boolean = false): { message: string; code?: string } {
  // Generic error message
  const genericMessage = 'An error occurred';
  
  // Check if error is a known error type
  if (error.name === 'SecurityError') {
    return {
      message: includeDetails ? error.message : 'A security error occurred',
      code: 'SECURITY_ERROR',
    };
  } else if (error.name === 'NetworkError') {
    return {
      message: includeDetails ? error.message : 'A network error occurred',
      code: 'NETWORK_ERROR',
    };
  } else if (error.name === 'ValidationError') {
    return {
      message: includeDetails ? error.message : 'A validation error occurred',
      code: 'VALIDATION_ERROR',
    };
  } else if (error.name === 'AuthenticationError') {
    return {
      message: includeDetails ? error.message : 'An authentication error occurred',
      code: 'AUTHENTICATION_ERROR',
    };
  } else if (error.name === 'AuthorizationError') {
    return {
      message: includeDetails ? error.message : 'An authorization error occurred',
      code: 'AUTHORIZATION_ERROR',
    };
  } else {
    // Log error for debugging
    console.error('Unhandled error:', error);
    
    // Return generic error message
    return {
      message: includeDetails ? error.message : genericMessage,
      code: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Default export
 */
export default {
  validateInput,
  sanitizeHtml,
  generateRandomString,
  generateRandomBytes,
  hashData,
  compareHashes,
  generateHmac,
  verifyHmac,
  generateHmacKey,
  importHmacKey,
  generateNonce,
  generateTimestamp,
  validateTimestamp,
  RateLimiter,
  ReplayPrevention,
  secureErrorHandler,
};