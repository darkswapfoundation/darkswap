/**
 * API client for the DarkSwap daemon
 */
import { RelayInfo, RelayStatus } from '../contexts/ApiContext';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface Order {
  id: string;
  maker_peer_id: string;
  base_asset: string;
  quote_asset: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  timestamp: number;
  expiry?: number;
  status: 'open' | 'filled' | 'canceled' | 'expired';
}

export interface Trade {
  id: string;
  maker_peer_id: string;
  taker_peer_id: string;
  base_asset: string;
  quote_asset: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  total: string;
  timestamp: number;
}

export interface MarketData {
  base_asset: string;
  quote_asset: string;
  last_price: string;
  bid_price: string;
  ask_price: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
  price_change_24h: string;
  price_change_percentage_24h: string;
}

export interface RuneInfo {
  id: string;
  name: string;
  ticker: string;
  supply: string;
  holders: number;
  description?: string;
}

export interface AlkaneInfo {
  id: string;
  name: string;
  ticker: string;
  supply: string;
  holders: number;
  description?: string;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  /**
   * Create a new API client
   * @param baseUrl API base URL
   */
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set the base URL
   * @param baseUrl API base URL
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Set a default header
   * @param key Header key
   * @param value Header value
   */
  public setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Make a request to the API (public version)
   * @param method HTTP method
   * @param path API path
   * @param body Request body
   * @param headers Additional headers
   * @returns API response
   */
  public async request<T>(
    method: string,
    path: string,
    body?: any,
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.privateRequest<T>(method, path, body, headers);
  }

  /**
   * Make a request to the API (private implementation)
   * @param method HTTP method (private)
   * @param path API path
   * @param body Request body
   * @param headers Additional headers
   * @returns API response
   */
  private async privateRequest<T>(
    method: string,
    path: string,
    body?: any,
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        return {
          data,
          status: response.status,
        };
      } else {
        return {
          error: data.message || 'Unknown error',
          status: response.status,
        };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
      };
    }
  }

  /**
   * Get health status
   * @returns Health status
   */
  public async getHealth(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.privateRequest('GET', '/health');
  }

  /**
   * Get orders
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param side Order side
   * @param status Order status
   * @returns Orders
   */
  public async getOrders(
    baseAsset?: string,
    quoteAsset?: string,
    side: string = 'all',
    status: string = 'open'
  ): Promise<ApiResponse<Order[]>> {
    let query = '';
    
    if (baseAsset) {
      query += `base_asset=${encodeURIComponent(baseAsset)}&`;
    }
    
    if (quoteAsset) {
      query += `quote_asset=${encodeURIComponent(quoteAsset)}&`;
    }
    
    query += `side=${encodeURIComponent(side)}&status=${encodeURIComponent(status)}`;
    
    return this.privateRequest('GET', `/orders?${query}`);
  }

  /**
   * Get order by ID
   * @param orderId Order ID
   * @returns Order
   */
  public async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.privateRequest('GET', `/orders/${orderId}`);
  }

  /**
   * Create an order
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param side Order side
   * @param amount Order amount
   * @param price Order price
   * @param expiry Order expiry in seconds
   * @returns Created order
   */
  public async createOrder(
    baseAsset: string,
    quoteAsset: string,
    side: 'buy' | 'sell',
    amount: string,
    price: string,
    expiry?: number
  ): Promise<ApiResponse<Order>> {
    return this.privateRequest('POST', '/orders', {
      base_asset: baseAsset,
      quote_asset: quoteAsset,
      side,
      amount,
      price,
      expiry,
    });
  }

  /**
   * Cancel an order
   * @param orderId Order ID
   * @returns Success status
   */
  public async cancelOrder(orderId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.privateRequest('DELETE', `/orders/${orderId}`);
  }

  /**
   * Take an order
   * @param orderId Order ID
   * @param amount Amount to take
   * @returns Success status
   */
  public async takeOrder(
    orderId: string,
    amount: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.privateRequest('POST', `/orders/${orderId}/take`, {
      amount,
    });
  }

  /**
   * Get market data
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @returns Market data
   */
  public async getMarketData(
    baseAsset: string,
    quoteAsset: string
  ): Promise<ApiResponse<MarketData>> {
    return this.privateRequest(
      'GET',
      `/market?base_asset=${encodeURIComponent(baseAsset)}&quote_asset=${encodeURIComponent(quoteAsset)}`
    );
  }

  /**
   * Get runes
   * @returns Runes
   */
  public async getRunes(): Promise<ApiResponse<RuneInfo[]>> {
    return this.privateRequest('GET', '/runes');
  }

  /**
   * Get rune by ID
   * @param runeId Rune ID
   * @returns Rune
   */
  public async getRune(runeId: string): Promise<ApiResponse<RuneInfo>> {
    return this.privateRequest('GET', `/runes/${runeId}`);
  }

  /**
   * Get alkanes
   * @returns Alkanes
   */
  public async getAlkanes(): Promise<ApiResponse<AlkaneInfo[]>> {
    return this.privateRequest('GET', '/alkanes');
  }
  
  /**
   * Create a predicate alkane
   * @param name Predicate name
   * @param type Predicate type
   * @param description Predicate description
   * @param parameters Predicate parameters
   * @returns Created predicate
   */
  public async createPredicate(
    name: string,
    type: string,
    description: string,
    parameters: any
  ): Promise<ApiResponse<{ id: string }>> {
    return this.privateRequest('POST', '/predicates', {
      name,
      type,
      description,
      parameters,
    });
  }
  
  /**
   * Get alkane by ID
   * @param alkaneId Alkane ID
   * @returns Alkane
   */
  public async getAlkane(alkaneId: string): Promise<ApiResponse<AlkaneInfo>> {
    return this.privateRequest('GET', `/alkanes/${alkaneId}`);
  }
  
  /**
   * Get relay server status
   * @returns Relay server status
   */
  public async getRelayStatus(): Promise<ApiResponse<RelayStatus>> {
    return this.privateRequest('GET', '/api/relay/status');
  }
  
  /**
   * Get recent trades
   * @param baseAsset Base asset
   * @param quoteAsset Quote asset
   * @param limit Maximum number of trades to return
   * @returns Recent trades
   */
  public async getRecentTrades(
    baseAsset: string,
    quoteAsset: string,
    limit: number = 10
  ): Promise<ApiResponse<Trade[]>> {
    return this.privateRequest(
      'GET',
      `/trades?base_asset=${encodeURIComponent(baseAsset)}&quote_asset=${encodeURIComponent(quoteAsset)}&limit=${limit}`
    );
  }
}

export default ApiClient;