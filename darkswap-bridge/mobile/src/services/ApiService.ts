import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { API_URL } from '@env';

/**
 * API Service for making HTTP requests
 */
class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   * @returns ApiService instance
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        // Add authorization header if token exists
        const credentials = await Keychain.getGenericPassword();
        if (credentials && config.headers) {
          config.headers.Authorization = `Bearer ${credentials.password}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
          // Clear token and user data
          await AsyncStorage.removeItem('user');
          await Keychain.resetGenericPassword();
          
          // Redirect to login screen
          // This will be handled by the AuthContext
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get request
   * @param url - URL to request
   * @param config - Axios request config
   * @returns Promise with response data
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  /**
   * Post request
   * @param url - URL to request
   * @param data - Data to send
   * @param config - Axios request config
   * @returns Promise with response data
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Put request
   * @param url - URL to request
   * @param data - Data to send
   * @param config - Axios request config
   * @returns Promise with response data
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Delete request
   * @param url - URL to request
   * @param config - Axios request config
   * @returns Promise with response data
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  /**
   * Patch request
   * @param url - URL to request
   * @param data - Data to send
   * @param config - Axios request config
   * @returns Promise with response data
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Get API instance
   * @returns Axios instance
   */
  public getApiInstance(): AxiosInstance {
    return this.api;
  }
}

export default ApiService.getInstance();