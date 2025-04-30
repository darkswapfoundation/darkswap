/**
 * CSRF protection utility for DarkSwap
 * 
 * This utility provides CSRF protection for the DarkSwap application.
 */

import { randomBytes } from 'crypto';
import { logger } from './logger';

/**
 * CSRF token storage key
 */
const CSRF_TOKEN_KEY = 'darkswap_csrf_token';

/**
 * Generate a CSRF token
 * 
 * @returns The CSRF token
 */
export function generateCsrfToken(): string {
  try {
    // Generate a random token
    const token = randomBytes(32).toString('hex');
    
    // Store the token in localStorage
    localStorage.setItem(CSRF_TOKEN_KEY, token);
    
    logger.debug('Generated CSRF token');
    
    return token;
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error });
    
    // Return a fallback token
    return 'fallback-csrf-token';
  }
}

/**
 * Get the CSRF token
 * 
 * @returns The CSRF token
 */
export function getCsrfToken(): string {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem(CSRF_TOKEN_KEY);
    
    // If the token doesn't exist, generate a new one
    if (!token) {
      return generateCsrfToken();
    }
    
    return token;
  } catch (error) {
    logger.error('Failed to get CSRF token', { error });
    
    // Return a fallback token
    return 'fallback-csrf-token';
  }
}

/**
 * Validate a CSRF token
 * 
 * @param token The CSRF token to validate
 * @returns Whether the token is valid
 */
export function validateCsrfToken(token: string): boolean {
  try {
    // Get the token from localStorage
    const storedToken = localStorage.getItem(CSRF_TOKEN_KEY);
    
    // If the token doesn't exist, it's invalid
    if (!storedToken) {
      return false;
    }
    
    // Compare the tokens
    return token === storedToken;
  } catch (error) {
    logger.error('Failed to validate CSRF token', { error });
    
    return false;
  }
}

/**
 * Add a CSRF token to a request
 * 
 * @param request The request to add the token to
 * @returns The request with the CSRF token
 */
export function addCsrfToken(request: RequestInit): RequestInit {
  // Get the CSRF token
  const token = getCsrfToken();
  
  // Add the token to the request headers
  return {
    ...request,
    headers: {
      ...request.headers,
      'X-CSRF-Token': token,
    },
  };
}

/**
 * Create a CSRF middleware for Express
 * 
 * @returns The CSRF middleware
 */
export function createCsrfMiddleware() {
  return (req: any, res: any, next: any) => {
    // Skip CSRF protection for GET, HEAD, and OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Get the CSRF token from the request
    const token = req.headers['x-csrf-token'] || req.body?.csrf_token;
    
    // If the token doesn't exist, reject the request
    if (!token) {
      return res.status(403).json({
        error: 'CSRF token missing',
        code: 'CSRF_TOKEN_MISSING',
      });
    }
    
    // Validate the token
    if (!validateCsrfToken(token)) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        code: 'INVALID_CSRF_TOKEN',
      });
    }
    
    next();
  };
}

export default {
  generateCsrfToken,
  getCsrfToken,
  validateCsrfToken,
  addCsrfToken,
  createCsrfMiddleware,
};