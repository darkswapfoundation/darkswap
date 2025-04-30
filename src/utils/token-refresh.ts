import { verifyAuthToken } from './auth';
import { logger } from './logger';
import jwt from 'jsonwebtoken';

/**
 * Token refresh options
 */
export interface TokenRefreshOptions {
  secret: string;
  expiresIn: string | number;
  refreshThreshold: number;
  maxRefreshCount: number;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  token: string;
  refreshed: boolean;
  error?: string;
}

/**
 * Token refresh manager
 */
export class TokenRefreshManager {
  private options: TokenRefreshOptions;
  private refreshCounts: Map<string, number> = new Map();
  
  /**
   * Creates a new token refresh manager
   * @param options Token refresh options
   */
  constructor(options: TokenRefreshOptions) {
    this.options = {
      secret: options.secret,
      expiresIn: options.expiresIn || '1h',
      refreshThreshold: options.refreshThreshold || 300, // 5 minutes
      maxRefreshCount: options.maxRefreshCount || 10,
    };
    
    logger.info('Token refresh manager created', {
      expiresIn: this.options.expiresIn,
      refreshThreshold: this.options.refreshThreshold,
      maxRefreshCount: this.options.maxRefreshCount,
    });
  }
  
  /**
   * Refreshes a token if needed
   * @param token Token
   * @returns Token refresh result
   */
  public refreshToken(token: string): TokenRefreshResult {
    try {
      // Verify the token
      const payload = verifyAuthToken(token);
      
      // If the token is invalid, return an error
      if (!payload) {
        return {
          token,
          refreshed: false,
          error: 'Invalid token',
        };
      }
      
      // Get the token ID
      const tokenId = payload.jti || '';
      
      // Get the refresh count
      const refreshCount = this.refreshCounts.get(tokenId) || 0;
      
      // If the refresh count exceeds the maximum, return an error
      if (refreshCount >= this.options.maxRefreshCount) {
        return {
          token,
          refreshed: false,
          error: 'Maximum refresh count exceeded',
        };
      }
      
      // Get the expiration time
      const exp = payload.exp || 0;
      
      // Get the current time
      const now = Math.floor(Date.now() / 1000);
      
      // If the token is not about to expire, return the token
      if (exp - now > this.options.refreshThreshold) {
        return {
          token,
          refreshed: false,
        };
      }
      
      // Create a new token
      const newToken = this.createToken(payload);
      
      // Increment the refresh count
      this.refreshCounts.set(tokenId, refreshCount + 1);
      
      // Return the new token
      return {
        token: newToken,
        refreshed: true,
      };
    } catch (error) {
      logger.error('Error refreshing token', error);
      
      return {
        token,
        refreshed: false,
        error: 'Error refreshing token',
      };
    }
  }
  
  /**
   * Creates a new token
   * @param payload Token payload
   * @returns New token
   */
  private createToken(payload: any): string {
    // Create a new token with the same payload
    const newToken = jwt.sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
      },
      this.options.secret,
      {
        expiresIn: this.options.expiresIn,
        jwtid: payload.jti,
      }
    );
    
    return newToken;
  }
  
  /**
   * Clears the refresh counts
   */
  public clearRefreshCounts(): void {
    this.refreshCounts.clear();
    
    logger.info('Token refresh counts cleared');
  }
  
  /**
   * Gets the refresh count for a token
   * @param token Token
   * @returns Refresh count
   */
  public getRefreshCount(token: string): number {
    try {
      // Verify the token
      const payload = verifyAuthToken(token);
      
      // If the token is invalid, return 0
      if (!payload) {
        return 0;
      }
      
      // Get the token ID
      const tokenId = payload.jti || '';
      
      // Get the refresh count
      return this.refreshCounts.get(tokenId) || 0;
    } catch (error) {
      logger.error('Error getting refresh count', error);
      return 0;
    }
  }
  
  /**
   * Gets the token refresh options
   * @returns Token refresh options
   */
  public getOptions(): TokenRefreshOptions {
    return this.options;
  }
  
  /**
   * Sets the token refresh options
   * @param options Token refresh options
   */
  public setOptions(options: Partial<TokenRefreshOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    
    logger.info('Token refresh options updated', {
      expiresIn: this.options.expiresIn,
      refreshThreshold: this.options.refreshThreshold,
      maxRefreshCount: this.options.maxRefreshCount,
    });
  }
}

/**
 * Creates a new token refresh manager
 * @param options Token refresh options
 * @returns Token refresh manager
 */
export function createTokenRefreshManager(options: TokenRefreshOptions): TokenRefreshManager {
  return new TokenRefreshManager(options);
}