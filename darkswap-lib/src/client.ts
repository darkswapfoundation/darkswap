/**
 * API client for the DarkSwap TypeScript Library
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { EventEmitter } from 'eventemitter3';
import WebSocket from 'isomorphic-ws';
import { 
  ApiResponse, 
  BitcoinNetwork, 
  ClientOptions, 
  EventData, 
  EventHandler, 
  EventType, 
  WebSocketMessage 
} from './types';
import { 
  DEFAULT_API_URL, 
  DEFAULT_NETWORK, 
  DEFAULT_RECONNECT_ATTEMPTS, 
  DEFAULT_RECONNECT_INTERVAL, 
  DEFAULT_TIMEOUT, 
  DEFAULT_WS_URL 
} from './constants';
import { retry, sleep } from './utils';

/**
 * DarkSwap API client
 */
export class DarkSwapClient extends EventEmitter {
  /** API URL */
  private apiUrl: string;
  
  /** WebSocket URL */
  private wsUrl: string;
  
  /** Bitcoin network */
  private network: BitcoinNetwork;
  
  /** Timeout in milliseconds */
  private timeout: number;
  
  /** API key */
  private apiKey?: string;
  
  /** API secret */
  private apiSecret?: string;
  
  /** Axios instance */
  private axios: AxiosInstance;
  
  /** WebSocket instance */
  private ws?: WebSocket;
  
  /** WebSocket connected flag */
  private wsConnected: boolean = false;
  
  /** WebSocket reconnect attempts */
  private wsReconnectAttempts: number = 0;
  
  /** WebSocket reconnect interval */
  private wsReconnectInterval: number = DEFAULT_RECONNECT_INTERVAL;
  
  /** WebSocket reconnect timeout */
  private wsReconnectTimeout?: NodeJS.Timeout;
  
  /**
   * Create a new DarkSwap API client
   * @param options Client options
   */
  constructor(options: ClientOptions = {}) {
    super();
    
    this.apiUrl = options.apiUrl || DEFAULT_API_URL;
    this.wsUrl = options.wsUrl || DEFAULT_WS_URL;
    this.network = options.network || DEFAULT_NETWORK;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    
    // Create Axios instance
    this.axios = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      },
    });
    
    // Add request interceptor for authentication
    this.axios.interceptors.request.use((config) => {
      if (this.apiKey && this.apiSecret) {
        const timestamp = Date.now().toString();
        const method = config.method?.toUpperCase() || 'GET';
        const path = config.url || '';
        const body = config.data ? JSON.stringify(config.data) : '';
        
        // Create signature (in a real implementation, this would use a crypto library)
        const signature = `${timestamp}${method}${path}${body}${this.apiSecret}`;
        
        // Add headers
        config.headers = {
          ...config.headers,
          'X-API-Key': this.apiKey,
          'X-API-Timestamp': timestamp,
          'X-API-Signature': signature,
        };
      }
      
      return config;
    });
  }
  
  /**
   * Connect to the WebSocket API
   * @returns Promise that resolves when connected
   */
  public async connectWebSocket(): Promise<void> {
    if (this.ws && this.wsConnected) {
      return;
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Create WebSocket instance
        this.ws = new WebSocket(this.wsUrl);
        
        // Set up event handlers
        this.ws.onopen = () => {
          this.wsConnected = true;
          this.wsReconnectAttempts = 0;
          this.emit(EventType.P2P_CONNECTED);
          resolve();
        };
        
        this.ws.onclose = () => {
          this.wsConnected = false;
          this.emit(EventType.P2P_DISCONNECTED);
          this.reconnectWebSocket();
        };
        
        this.ws.onerror = (error) => {
          this.emit(EventType.P2P_ERROR, { error });
          if (!this.wsConnected) {
            reject(error);
          }
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data.toString()) as WebSocketMessage;
            this.handleWebSocketMessage(message);
          } catch (error) {
            this.emit(EventType.P2P_ERROR, { error });
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket API
   */
  public disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
      this.wsConnected = false;
      
      // Clear reconnect timeout
      if (this.wsReconnectTimeout) {
        clearTimeout(this.wsReconnectTimeout);
        this.wsReconnectTimeout = undefined;
      }
    }
  }
  
  /**
   * Reconnect to the WebSocket API
   */
  private reconnectWebSocket(): void {
    // Clear existing reconnect timeout
    if (this.wsReconnectTimeout) {
      clearTimeout(this.wsReconnectTimeout);
      this.wsReconnectTimeout = undefined;
    }
    
    // Check if we've exceeded the maximum number of reconnect attempts
    if (this.wsReconnectAttempts >= DEFAULT_RECONNECT_ATTEMPTS) {
      this.emit(EventType.P2P_ERROR, { error: 'Maximum reconnect attempts exceeded' });
      return;
    }
    
    // Increment reconnect attempts
    this.wsReconnectAttempts++;
    
    // Set reconnect timeout
    this.wsReconnectTimeout = setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        this.emit(EventType.P2P_ERROR, { error });
      });
    }, this.wsReconnectInterval);
  }
  
  /**
   * Handle WebSocket message
   * @param message WebSocket message
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'orderbook:update':
        this.emit(EventType.ORDERBOOK_ORDER_UPDATED, message.payload);
        break;
      case 'orderbook:add':
        this.emit(EventType.ORDERBOOK_ORDER_ADDED, message.payload);
        break;
      case 'orderbook:remove':
        this.emit(EventType.ORDERBOOK_ORDER_REMOVED, message.payload);
        break;
      case 'trade:created':
        this.emit(EventType.TRADE_CREATED, message.payload);
        break;
      case 'trade:executed':
        this.emit(EventType.TRADE_EXECUTED, message.payload);
        break;
      case 'trade:failed':
        this.emit(EventType.TRADE_FAILED, message.payload);
        break;
      default:
        // Unknown message type
        break;
    }
  }
  
  /**
   * Send a WebSocket message
   * @param type Message type
   * @param payload Message payload
   */
  public sendWebSocketMessage(type: string, payload: any): void {
    if (!this.ws || !this.wsConnected) {
      throw new Error('WebSocket not connected');
    }
    
    const message: WebSocketMessage = { type, payload };
    this.ws.send(JSON.stringify(message));
  }
  
  /**
   * Make a GET request to the API
   * @param path API path
   * @param params Query parameters
   * @param config Axios request config
   * @returns API response
   */
  public async get<T>(path: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<ApiResponse<T>>(path, {
      ...config,
      params,
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Make a POST request to the API
   * @param path API path
   * @param data Request data
   * @param config Axios request config
   * @returns API response
   */
  public async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<ApiResponse<T>>(path, data, config);
    return this.handleResponse<T>(response);
  }
  
  /**
   * Make a PUT request to the API
   * @param path API path
   * @param data Request data
   * @param config Axios request config
   * @returns API response
   */
  public async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<ApiResponse<T>>(path, data, config);
    return this.handleResponse<T>(response);
  }
  
  /**
   * Make a DELETE request to the API
   * @param path API path
   * @param config Axios request config
   * @returns API response
   */
  public async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<ApiResponse<T>>(path, config);
    return this.handleResponse<T>(response);
  }
  
  /**
   * Handle API response
   * @param response Axios response
   * @returns API response data
   */
  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const { data } = response;
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    
    return data.data as T;
  }
  
  /**
   * Get the API URL
   * @returns API URL
   */
  public getApiUrl(): string {
    return this.apiUrl;
  }
  
  /**
   * Get the WebSocket URL
   * @returns WebSocket URL
   */
  public getWsUrl(): string {
    return this.wsUrl;
  }
  
  /**
   * Get the Bitcoin network
   * @returns Bitcoin network
   */
  public getNetwork(): BitcoinNetwork {
    return this.network;
  }
  
  /**
   * Check if the WebSocket is connected
   * @returns True if the WebSocket is connected
   */
  public isWebSocketConnected(): boolean {
    return this.wsConnected;
  }
  
  /**
   * Add an event listener
   * @param event Event type
   * @param handler Event handler
   */
  public on(event: EventType, handler: EventHandler): this {
    return super.on(event, handler);
  }
  
  /**
   * Remove an event listener
   * @param event Event type
   * @param handler Event handler
   */
  public off(event: EventType, handler: EventHandler): this {
    return super.off(event, handler);
  }
  
  /**
   * Add a one-time event listener
   * @param event Event type
   * @param handler Event handler
   */
  public once(event: EventType, handler: EventHandler): this {
    return super.once(event, handler);
  }
  
  /**
   * Emit an event
   * @param event Event type
   * @param data Event data
   */
  public emit(event: EventType, data: EventData = {}): boolean {
    return super.emit(event, data);
  }
}

/**
 * Create a new DarkSwap API client
 * @param options Client options
 * @returns DarkSwap API client
 */
export function createClient(options: ClientOptions = {}): DarkSwapClient {
  return new DarkSwapClient(options);
}