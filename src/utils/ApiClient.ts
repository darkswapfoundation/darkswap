/**
 * API client for DarkSwap
 * 
 * This utility provides a client for interacting with the DarkSwap API.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleApiError } from './error-handler';
import { logger } from './logger';

/**
 * API client options
 */
export interface ApiClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * API client class
 */
export class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  
  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: this.headers,
      timeout: this.timeout,
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('API request error', { error });
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error('API response error', { error });
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Get the base URL
   * 
   * @returns The base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Get the headers
   * 
   * @returns The headers
   */
  public getHeaders(): Record<string, string> {
    return { ...this.headers };
  }
  
  /**
   * Get the timeout
   * 
   * @returns The timeout
   */
  public getTimeout(): number {
    return this.timeout;
  }
  
  /**
   * Set the authentication token
   * 
   * @param token The authentication token
   */
  public setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    logger.debug('Set authentication token');
  }
  
  /**
   * Clear the authentication token
   */
  public clearAuthToken(): void {
    delete this.headers['Authorization'];
    delete this.client.defaults.headers.common['Authorization'];
    
    logger.debug('Cleared authentication token');
  }
  
  /**
   * Check if the client is authenticated
   * 
   * @returns Whether the client is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.headers['Authorization'];
  }
  
  /**
   * Make a GET request
   * 
   * @param url The URL to request
   * @param params The query parameters
   * @param config The request configuration
   * @returns The response data
   */
  public async get<T>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, {
        ...config,
        params,
      });
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Make a POST request
   * 
   * @param url The URL to request
   * @param data The request data
   * @param config The request configuration
   * @returns The response data
   */
  public async post<T>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Make a PUT request
   * 
   * @param url The URL to request
   * @param data The request data
   * @param config The request configuration
   * @returns The response data
   */
  public async put<T>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Make a DELETE request
   * 
   * @param url The URL to request
   * @param config The request configuration
   * @returns The response data
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Make a request
   * 
   * @param config The request configuration
   * @returns The response
   */
  public async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.client.request<T>(config);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Create an API client
 * 
 * @param options The API client options
 * @returns The API client
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}

export default createApiClient;