import { logger } from '../utils/logger';

/**
 * Rate limit rule
 */
export interface RateLimitRule {
  type: 'ip' | 'user' | 'global';
  limit: number;
  window: number;
  action: 'block' | 'throttle' | 'log';
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  timestamp: number;
}

/**
 * Rate limiter
 */
export class RateLimiter {
  private rules: RateLimitRule[];
  private ipLimits: Map<string, RateLimitEntry[]> = new Map();
  private userLimits: Map<string, RateLimitEntry[]> = new Map();
  private globalLimits: RateLimitEntry[] = [];
  
  /**
   * Creates a new rate limiter
   * @param rules Rate limit rules
   */
  constructor(rules: RateLimitRule[]) {
    this.rules = rules;
    
    logger.info('Rate limiter created', { rules });
  }
  
  /**
   * Checks if a request is allowed
   * @param ip IP address
   * @param userId User ID
   * @returns Whether the request is allowed
   */
  public isAllowed(ip: string, userId?: string): boolean {
    try {
      // Check IP limits
      if (!this.checkIpLimits(ip)) {
        return false;
      }
      
      // Check user limits
      if (userId && !this.checkUserLimits(userId)) {
        return false;
      }
      
      // Check global limits
      if (!this.checkGlobalLimits()) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking rate limits', error);
      return true;
    }
  }
  
  /**
   * Increments the request count
   * @param ip IP address
   * @param userId User ID
   */
  public increment(ip: string, userId?: string): void {
    try {
      // Increment IP limits
      this.incrementIpLimits(ip);
      
      // Increment user limits
      if (userId) {
        this.incrementUserLimits(userId);
      }
      
      // Increment global limits
      this.incrementGlobalLimits();
    } catch (error) {
      logger.error('Error incrementing rate limits', error);
    }
  }
  
  /**
   * Checks IP limits
   * @param ip IP address
   * @returns Whether the IP is allowed
   */
  private checkIpLimits(ip: string): boolean {
    // Get the IP rules
    const ipRules = this.rules.filter((rule) => rule.type === 'ip');
    
    // If there are no IP rules, allow the request
    if (ipRules.length === 0) {
      return true;
    }
    
    // Get the IP limits
    let ipLimits = this.ipLimits.get(ip);
    
    // If there are no IP limits, allow the request
    if (!ipLimits) {
      return true;
    }
    
    // Check each rule
    for (const rule of ipRules) {
      // Get the current time
      const now = Date.now();
      
      // Filter out old entries
      ipLimits = ipLimits.filter(
        (entry) => now - entry.timestamp < rule.window
      );
      
      // Update the IP limits
      this.ipLimits.set(ip, ipLimits);
      
      // Count the number of requests in the window
      const count = ipLimits.length;
      
      // If the count exceeds the limit, block the request
      if (count > rule.limit) {
        logger.warn('IP rate limit exceeded', { ip, rule, count });
        
        if (rule.action === 'block') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Checks user limits
   * @param userId User ID
   * @returns Whether the user is allowed
   */
  private checkUserLimits(userId: string): boolean {
    // Get the user rules
    const userRules = this.rules.filter((rule) => rule.type === 'user');
    
    // If there are no user rules, allow the request
    if (userRules.length === 0) {
      return true;
    }
    
    // Get the user limits
    let userLimits = this.userLimits.get(userId);
    
    // If there are no user limits, allow the request
    if (!userLimits) {
      return true;
    }
    
    // Check each rule
    for (const rule of userRules) {
      // Get the current time
      const now = Date.now();
      
      // Filter out old entries
      userLimits = userLimits.filter(
        (entry) => now - entry.timestamp < rule.window
      );
      
      // Update the user limits
      this.userLimits.set(userId, userLimits);
      
      // Count the number of requests in the window
      const count = userLimits.length;
      
      // If the count exceeds the limit, block the request
      if (count > rule.limit) {
        logger.warn('User rate limit exceeded', { userId, rule, count });
        
        if (rule.action === 'block') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Checks global limits
   * @returns Whether the request is allowed
   */
  private checkGlobalLimits(): boolean {
    // Get the global rules
    const globalRules = this.rules.filter((rule) => rule.type === 'global');
    
    // If there are no global rules, allow the request
    if (globalRules.length === 0) {
      return true;
    }
    
    // Check each rule
    for (const rule of globalRules) {
      // Get the current time
      const now = Date.now();
      
      // Filter out old entries
      this.globalLimits = this.globalLimits.filter(
        (entry) => now - entry.timestamp < rule.window
      );
      
      // Count the number of requests in the window
      const count = this.globalLimits.length;
      
      // If the count exceeds the limit, block the request
      if (count > rule.limit) {
        logger.warn('Global rate limit exceeded', { rule, count });
        
        if (rule.action === 'block') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Increments IP limits
   * @param ip IP address
   */
  private incrementIpLimits(ip: string): void {
    // Get the IP limits
    let ipLimits = this.ipLimits.get(ip) || [];
    
    // Add a new entry
    ipLimits.push({
      count: 1,
      timestamp: Date.now(),
    });
    
    // Update the IP limits
    this.ipLimits.set(ip, ipLimits);
  }
  
  /**
   * Increments user limits
   * @param userId User ID
   */
  private incrementUserLimits(userId: string): void {
    // Get the user limits
    let userLimits = this.userLimits.get(userId) || [];
    
    // Add a new entry
    userLimits.push({
      count: 1,
      timestamp: Date.now(),
    });
    
    // Update the user limits
    this.userLimits.set(userId, userLimits);
  }
  
  /**
   * Increments global limits
   */
  private incrementGlobalLimits(): void {
    // Add a new entry
    this.globalLimits.push({
      count: 1,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Gets the rules
   * @returns Rules
   */
  public getRules(): RateLimitRule[] {
    return this.rules;
  }
  
  /**
   * Sets the rules
   * @param rules Rules
   */
  public setRules(rules: RateLimitRule[]): void {
    this.rules = rules;
    
    logger.info('Rate limiter rules updated', { rules });
  }
  
  /**
   * Clears all limits
   */
  public clearLimits(): void {
    this.ipLimits.clear();
    this.userLimits.clear();
    this.globalLimits = [];
    
    logger.info('Rate limiter limits cleared');
  }
}

/**
 * Creates a new rate limiter
 * @param rules Rate limit rules
 * @returns Rate limiter
 */
export function createRateLimiter(rules: RateLimitRule[]): RateLimiter {
  return new RateLimiter(rules);
}