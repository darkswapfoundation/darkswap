/**
 * Authentication utility for DarkSwap
 * 
 * This utility provides functions for handling authentication in the DarkSwap application.
 */

import { ApiClient } from './ApiClient';
import { AuthRequest, AuthResponse, RefreshRequest, RefreshResponse, VerifyResponse } from '../types/api';
import { handleApiError } from './error-handler';
import { logger } from './logger';

/**
 * Authentication token storage key
 */
const AUTH_TOKEN_KEY = 'darkswap_auth_token';

/**
 * Authentication user storage key
 */
const AUTH_USER_KEY = 'darkswap_auth_user';

/**
 * Authentication token expiry storage key
 */
const AUTH_TOKEN_EXPIRY_KEY = 'darkswap_auth_token_expiry';

/**
 * Authentication token refresh interval (5 minutes before expiry)
 */
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;

/**
 * Authentication class
 */
export class Auth {
  private apiClient: ApiClient;
  private refreshTimer: NodeJS.Timeout | null = null;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    
    // Initialize authentication from storage
    this.initFromStorage();
  }
  
  /**
   * Initialize authentication from storage
   */
  private initFromStorage(): void {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const user = localStorage.getItem(AUTH_USER_KEY);
      const expiry = localStorage.getItem(AUTH_TOKEN_EXPIRY_KEY);
      
      if (token && user && expiry) {
        this.apiClient.setAuthToken(token);
        
        // Start the token refresh timer
        this.startRefreshTimer(new Date(expiry));
        
        logger.debug('Initialized authentication from storage');
      }
    } catch (error) {
      logger.error('Failed to initialize authentication from storage', { error });
    }
  }
  
  /**
   * Start the token refresh timer
   * 
   * @param expiry The token expiry date
   */
  private startRefreshTimer(expiry: Date): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    const now = new Date();
    const expiryTime = expiry.getTime();
    const refreshTime = expiryTime - TOKEN_REFRESH_INTERVAL;
    
    // If the token is already expired or will expire soon, refresh it now
    if (expiryTime <= now.getTime() || refreshTime <= now.getTime()) {
      this.refreshToken().catch((error) => {
        logger.error('Failed to refresh token', { error });
      });
      return;
    }
    
    // Schedule the token refresh
    const timeout = refreshTime - now.getTime();
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().catch((error) => {
        logger.error('Failed to refresh token', { error });
      });
    }, timeout);
    
    logger.debug('Started token refresh timer', { expiry, timeout });
  }
  
  /**
   * Register a new user
   * 
   * @param email The user's email
   * @param password The user's password
   * @param username The user's username
   * @returns The authentication response
   */
  public async register(email: string, password: string, username: string): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/api/auth/register', {
        email,
        password,
        username,
      });
      
      // Store the authentication token and user
      this.storeAuth(response);
      
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Log in a user
   * 
   * @param email The user's email
   * @param password The user's password
   * @returns The authentication response
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const request: AuthRequest = {
        email,
        password,
      };
      
      const response = await this.apiClient.post<AuthResponse>('/api/auth/login', request);
      
      // Store the authentication token and user
      this.storeAuth(response);
      
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Log out the current user
   */
  public logout(): void {
    // Clear the authentication token and user
    this.clearAuth();
    
    // Clear the token refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    logger.debug('Logged out user');
  }
  
  /**
   * Verify the authentication token
   * 
   * @returns The verification response
   */
  public async verify(): Promise<VerifyResponse> {
    try {
      return await this.apiClient.get<VerifyResponse>('/api/auth/verify');
    } catch (error) {
      // If the token is invalid, clear the authentication
      this.clearAuth();
      
      throw handleApiError(error);
    }
  }
  
  /**
   * Refresh the authentication token
   * 
   * @returns The refresh response
   */
  public async refreshToken(): Promise<RefreshResponse> {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const request: RefreshRequest = {
        token,
      };
      
      const response = await this.apiClient.post<RefreshResponse>('/api/auth/refresh', request);
      
      // Store the new authentication token
      this.storeToken(response.token, response.expiresAt);
      
      return response;
    } catch (error) {
      // If the token refresh fails, clear the authentication
      this.clearAuth();
      
      throw handleApiError(error);
    }
  }
  
  /**
   * Store the authentication token and user
   * 
   * @param auth The authentication response
   */
  private storeAuth(auth: AuthResponse): void {
    try {
      // Store the authentication token
      localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
      
      // Store the user
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
        userId: auth.userId,
        username: auth.username,
        email: auth.email,
      }));
      
      // Calculate the token expiry (default to 24 hours)
      const expiry = new Date();
      expiry.setTime(expiry.getTime() + 24 * 60 * 60 * 1000);
      
      // Store the token expiry
      localStorage.setItem(AUTH_TOKEN_EXPIRY_KEY, expiry.toISOString());
      
      // Set the authentication token in the API client
      this.apiClient.setAuthToken(auth.token);
      
      // Start the token refresh timer
      this.startRefreshTimer(expiry);
      
      logger.debug('Stored authentication', { userId: auth.userId, username: auth.username });
    } catch (error) {
      logger.error('Failed to store authentication', { error });
    }
  }
  
  /**
   * Store the authentication token
   * 
   * @param token The authentication token
   * @param expiresAt The token expiry date
   */
  private storeToken(token: string, expiresAt: string): void {
    try {
      // Store the authentication token
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      
      // Store the token expiry
      localStorage.setItem(AUTH_TOKEN_EXPIRY_KEY, expiresAt);
      
      // Set the authentication token in the API client
      this.apiClient.setAuthToken(token);
      
      // Start the token refresh timer
      this.startRefreshTimer(new Date(expiresAt));
      
      logger.debug('Stored authentication token', { expiresAt });
    } catch (error) {
      logger.error('Failed to store authentication token', { error });
    }
  }
  
  /**
   * Clear the authentication token and user
   */
  private clearAuth(): void {
    try {
      // Clear the authentication token
      localStorage.removeItem(AUTH_TOKEN_KEY);
      
      // Clear the user
      localStorage.removeItem(AUTH_USER_KEY);
      
      // Clear the token expiry
      localStorage.removeItem(AUTH_TOKEN_EXPIRY_KEY);
      
      // Clear the authentication token in the API client
      this.apiClient.clearAuthToken();
      
      logger.debug('Cleared authentication');
    } catch (error) {
      logger.error('Failed to clear authentication', { error });
    }
  }
  
  /**
   * Check if the user is authenticated
   * 
   * @returns Whether the user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.apiClient.isAuthenticated();
  }
  
  /**
   * Get the current user
   * 
   * @returns The current user
   */
  public getUser(): { userId: string; username: string; email: string } | null {
    try {
      const user = localStorage.getItem(AUTH_USER_KEY);
      
      if (!user) {
        return null;
      }
      
      return JSON.parse(user);
    } catch (error) {
      logger.error('Failed to get user', { error });
      return null;
    }
  }
}

/**
 * Create an authentication instance
 * 
 * @param apiClient The API client
 * @returns The authentication instance
 */
export function createAuth(apiClient: ApiClient): Auth {
  return new Auth(apiClient);
}

export default createAuth;