import { logger } from '../utils/logger';
import * as zlib from 'zlib';

/**
 * Compression algorithm
 */
export enum CompressionAlgorithm {
  NONE = 'none',
  GZIP = 'gzip',
  DEFLATE = 'deflate',
  BROTLI = 'brotli',
}

/**
 * Compression options
 */
export interface CompressionOptions {
  algorithm: CompressionAlgorithm;
  level?: number;
  threshold?: number;
}

/**
 * Message compressor
 */
export class MessageCompressor {
  private options: CompressionOptions;
  
  /**
   * Creates a new message compressor
   * @param options Compression options
   */
  constructor(options: CompressionOptions) {
    this.options = {
      algorithm: options.algorithm || CompressionAlgorithm.NONE,
      level: options.level || 6,
      threshold: options.threshold || 1024,
    };
    
    logger.info('Message compressor created', {
      algorithm: this.options.algorithm,
      level: this.options.level,
      threshold: this.options.threshold,
    });
  }
  
  /**
   * Compresses a message
   * @param message Message
   * @returns Compressed message
   */
  public compress(message: any): any {
    try {
      // If compression is disabled, return the message
      if (this.options.algorithm === CompressionAlgorithm.NONE) {
        return message;
      }
      
      // Convert the message to a string
      const messageString = JSON.stringify(message);
      
      // If the message is smaller than the threshold, return the message
      if (messageString.length < this.options.threshold!) {
        return message;
      }
      
      // Compress the message
      const compressedMessage = this.compressString(messageString);
      
      // Return the compressed message
      return {
        compressed: true,
        algorithm: this.options.algorithm,
        data: compressedMessage,
      };
    } catch (error) {
      logger.error('Error compressing message', error);
      return message;
    }
  }
  
  /**
   * Decompresses a message
   * @param message Message
   * @returns Decompressed message
   */
  public decompress(message: any): any {
    try {
      // If the message is not compressed, return the message
      if (!message || !message.compressed) {
        return message;
      }
      
      // Decompress the message
      const decompressedMessage = this.decompressString(message.data, message.algorithm);
      
      // Parse the decompressed message
      return JSON.parse(decompressedMessage);
    } catch (error) {
      logger.error('Error decompressing message', error);
      return message;
    }
  }
  
  /**
   * Compresses a string
   * @param str String
   * @returns Compressed string
   */
  private compressString(str: string): string {
    try {
      // Get the buffer
      const buffer = Buffer.from(str, 'utf8');
      
      // Compress the buffer
      let compressedBuffer: Buffer;
      
      switch (this.options.algorithm) {
        case CompressionAlgorithm.GZIP:
          compressedBuffer = zlib.gzipSync(buffer, {
            level: this.options.level,
          });
          break;
        case CompressionAlgorithm.DEFLATE:
          compressedBuffer = zlib.deflateSync(buffer, {
            level: this.options.level,
          });
          break;
        case CompressionAlgorithm.BROTLI:
          compressedBuffer = zlib.brotliCompressSync(buffer, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: this.options.level,
            },
          });
          break;
        default:
          return str;
      }
      
      // Convert the compressed buffer to a base64 string
      return compressedBuffer.toString('base64');
    } catch (error) {
      logger.error('Error compressing string', error);
      return str;
    }
  }
  
  /**
   * Decompresses a string
   * @param str String
   * @param algorithm Compression algorithm
   * @returns Decompressed string
   */
  private decompressString(str: string, algorithm: CompressionAlgorithm): string {
    try {
      // Get the buffer
      const buffer = Buffer.from(str, 'base64');
      
      // Decompress the buffer
      let decompressedBuffer: Buffer;
      
      switch (algorithm) {
        case CompressionAlgorithm.GZIP:
          decompressedBuffer = zlib.gunzipSync(buffer);
          break;
        case CompressionAlgorithm.DEFLATE:
          decompressedBuffer = zlib.inflateSync(buffer);
          break;
        case CompressionAlgorithm.BROTLI:
          decompressedBuffer = zlib.brotliDecompressSync(buffer);
          break;
        default:
          return str;
      }
      
      // Convert the decompressed buffer to a string
      return decompressedBuffer.toString('utf8');
    } catch (error) {
      logger.error('Error decompressing string', error);
      return str;
    }
  }
  
  /**
   * Gets the compression options
   * @returns Compression options
   */
  public getOptions(): CompressionOptions {
    return this.options;
  }
  
  /**
   * Sets the compression options
   * @param options Compression options
   */
  public setOptions(options: Partial<CompressionOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    
    logger.info('Message compressor options updated', {
      algorithm: this.options.algorithm,
      level: this.options.level,
      threshold: this.options.threshold,
    });
  }
}

/**
 * Creates a new message compressor
 * @param options Compression options
 * @returns Message compressor
 */
export function createMessageCompressor(options: CompressionOptions): MessageCompressor {
  return new MessageCompressor(options);
}