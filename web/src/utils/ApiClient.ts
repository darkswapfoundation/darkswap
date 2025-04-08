import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  Balance,
  Order,
  Trade,
  Market,
  Candlestick,
  CreateOrderParams,
  ApiResponse,
  PaginatedResponse,
  UserSettings,
  PeerInfo,
  NetworkStats,
  PriceLevel,
} from '../types';

class ApiClient {
  private axios: AxiosInstance;
  private requestInterceptors: number[] = [];
  private responseInterceptors: number[] = [];
  private useWebSocket: boolean = false;

  constructor(baseURL: string = '/api') {
    this.axios = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add response interceptor for error handling
    this.addResponseInterceptor();
  }
  
  // Add response interceptor for error handling
  private addResponseInterceptor(): void {
    const interceptor = this.axios.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
    
    this.responseInterceptors.push(interceptor);
  }
  
  // Handle API errors
  private handleError(error: AxiosError): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = error.response.data as any;
      if (data && data.error && data.error.message) {
        return new Error(data.error.message);
      }
      return new Error(`API Error: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(`Request Error: ${error.message}`);
    }
  }
  
  // Set whether to use WebSocket for real-time updates
  public setUseWebSocket(use: boolean): void {
    this.useWebSocket = use;
  }
  
  // Get balances
  public async getBalances(): Promise<Balance[]> {
    try {
      const response = await this.axios.get<ApiResponse<Balance[]>>('/balances');
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get deposit address
  public async getDepositAddress(asset: string): Promise<string> {
    try {
      const response = await this.axios.get<ApiResponse<{ address: string }>>(`/deposit/${asset}`);
      return response.data.data?.address || '';
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Withdraw
  public async withdraw(asset: string, address: string, amount: string): Promise<boolean> {
    try {
      const response = await this.axios.post<ApiResponse<{ success: boolean }>>('/withdraw', {
        asset,
        address,
        amount,
      });
      return response.data.success;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get orders
  public async getOrders(params?: {
    baseAsset?: string;
    quoteAsset?: string;
    status?: string;
    side?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Order[]> {
    try {
      const response = await this.axios.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
        params,
      });
      return response.data.data?.items || [];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Create order
  public async createOrder(params: CreateOrderParams): Promise<string> {
    try {
      const response = await this.axios.post<ApiResponse<{ orderId: string }>>('/orders', params);
      return response.data.data?.orderId || '';
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Cancel order
  public async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const response = await this.axios.delete<ApiResponse<{ success: boolean }>>(`/orders/${orderId}`);
      return response.data.data?.success || false;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get trades
  public async getTrades(
    baseAsset: string,
    quoteAsset: string,
    limit: number = 50
  ): Promise<Trade[]> {
    try {
      const response = await this.axios.get<ApiResponse<Trade[]>>(`/trades/${baseAsset}/${quoteAsset}`, {
        params: { limit },
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get market
  public async getMarket(baseAsset: string, quoteAsset: string): Promise<Market> {
    try {
      const response = await this.axios.get<ApiResponse<Market>>(`/markets/${baseAsset}/${quoteAsset}`);
      return response.data.data as Market;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get candlesticks
  public async getCandlesticks(
    baseAsset: string,
    quoteAsset: string,
    timeframe: string,
    limit: number = 100
  ): Promise<Candlestick[]> {
    try {
      const response = await this.axios.get<ApiResponse<Candlestick[]>>(
        `/candlesticks/${baseAsset}/${quoteAsset}/${timeframe}`,
        {
          params: { limit },
        }
      );
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get order book
  public async getOrderBook(
    baseAsset: string,
    quoteAsset: string,
    side: 'buy' | 'sell',
    depth: number = 10
  ): Promise<PriceLevel[]> {
    try {
      const response = await this.axios.get<ApiResponse<PriceLevel[]>>(
        `/orderbook/${baseAsset}/${quoteAsset}/${side}`,
        {
          params: { depth },
        }
      );
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get settings
  public async getSettings(): Promise<UserSettings> {
    try {
      const response = await this.axios.get<ApiResponse<UserSettings>>('/settings');
      return response.data.data as UserSettings;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Update settings
  public async updateSettings(settings: UserSettings): Promise<boolean> {
    try {
      const response = await this.axios.put<ApiResponse<{ success: boolean }>>('/settings', settings);
      return response.data.data?.success || false;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get peers
  public async getPeers(): Promise<PeerInfo[]> {
    try {
      const response = await this.axios.get<ApiResponse<PeerInfo[]>>('/peers');
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
  
  // Get network stats
  public async getNetworkStats(): Promise<NetworkStats> {
    try {
      const response = await this.axios.get<ApiResponse<NetworkStats>>('/network/stats');
      return response.data.data as NetworkStats;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}

export default ApiClient;