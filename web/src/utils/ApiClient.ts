/**
 * ApiClient - HTTP client for DarkSwap API with caching support
 * 
 * This utility provides a wrapper around fetch with:
 * - Automatic caching of API responses
 * - Request/response interceptors
 * - Error handling
 * - Retry logic
 * - Request cancellation
 * - Type-safe responses
 */

import CacheManager, { CacheOptions } from './CacheManager';

export interface ApiClientOptions {
  /** Base URL for API requests */
  baseUrl?: string;
  /** Default headers to include with all requests */
  defaultHeaders?: Record<string, string>;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Default number of retries */
  retries?: number;
  /** Default cache options */
  cacheOptions?: CacheOptions;
}

export interface RequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** URL parameters to append to the URL */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retries on failure */
  retries?: number;
  /** Whether to use cache for this request */
  useCache?: boolean;
  /** Cache options for this request */
  cacheOptions?: CacheOptions;
  /** AbortController signal for cancelling the request */
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Response status code */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Whether the response was served from cache */
  fromCache: boolean;
}

export interface ApiError extends Error {
  /** Response status code */
  status?: number;
  /** Response data */
  data?: any;
  /** Whether the error is a network error */
  isNetworkError?: boolean;
  /** Whether the error is a timeout error */
  isTimeout?: boolean;
}

export type RequestInterceptor = (
  url: string,
  options: RequestOptions
) => [string, RequestOptions] | Promise<[string, RequestOptions]>;

export type ResponseInterceptor = <T>(
  response: Response,
  data: T
) => ApiResponse<T> | Promise<ApiResponse<T>>;

export type ErrorInterceptor = (
  error: ApiError,
  url: string,
  options: RequestOptions
) => ApiError | Promise<ApiError>;

/**
 * ApiClient class for making API requests with caching
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private cacheOptions: CacheOptions;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /**
   * Create a new ApiClient instance
   * @param options ApiClient options
   */
  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = options.defaultHeaders || {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retries = options.retries || 0;
    this.cacheOptions = options.cacheOptions || {
      ttl: 5 * 60 * 1000, // 5 minutes
      persist: false,
    };
  }

  /**
   * Add a request interceptor
   * @param interceptor Request interceptor function
   * @returns ApiClient instance for chaining
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): ApiClient {
    this.requestInterceptors.push(interceptor);
    return this;
  }

  /**
   * Add a response interceptor
   * @param interceptor Response interceptor function
   * @returns ApiClient instance for chaining
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): ApiClient {
    this.responseInterceptors.push(interceptor);
    return this;
  }

  /**
   * Add an error interceptor
   * @param interceptor Error interceptor function
   * @returns ApiClient instance for chaining
   */
  public addErrorInterceptor(interceptor: ErrorInterceptor): ApiClient {
    this.errorInterceptors.push(interceptor);
    return this;
  }

  /**
   * Make a GET request
   * @param url URL to request
   * @param options Request options
   * @returns Promise resolving to the response data
   */
  public async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
      useCache: options.useCache !== false, // Default to true for GET requests
    });
  }

  /**
   * Make a POST request
   * @param url URL to request
   * @param data Request body
   * @param options Request options
   * @returns Promise resolving to the response data
   */
  public async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  /**
   * Make a PUT request
   * @param url URL to request
   * @param data Request body
   * @param options Request options
   * @returns Promise resolving to the response data
   */
  public async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  /**
   * Make a DELETE request
   * @param url URL to request
   * @param options Request options
   * @returns Promise resolving to the response data
   */
  public async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Make a PATCH request
   * @param url URL to request
   * @param data Request body
   * @param options Request options
   * @returns Promise resolving to the response data
   */
  public async patch<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Make a request with the given options
   * @param url URL to request
   * @param options Request options
   * @returns Promise resolving to the response data
   */
  public async request<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = this.timeout,
      retries = this.retries,
      useCache = method === 'GET',
      cacheOptions = this.cacheOptions,
      signal,
    } = options;

    // Build full URL
    let fullUrl = this.buildUrl(url, params);

    // Apply request interceptors
    let interceptedOptions: RequestOptions = {
      ...options,
      method,
      headers: { ...this.defaultHeaders, ...headers },
      body,
    };

    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(fullUrl, interceptedOptions);
      fullUrl = result[0];
      interceptedOptions = result[1];
    }

    // Check cache for GET requests
    if (useCache && method === 'GET') {
      const cacheKey = `api:${fullUrl}`;
      const cachedResponse = CacheManager.get<ApiResponse<T>>(cacheKey);

      if (cachedResponse) {
        return {
          ...cachedResponse,
          fromCache: true,
        };
      }
    }

    // Create fetch options
    const fetchOptions: RequestInit = {
      method: interceptedOptions.method,
      headers: interceptedOptions.headers as HeadersInit,
      signal,
    };

    // Add body if present
    if (interceptedOptions.body) {
      if (typeof interceptedOptions.body === 'object' && !(interceptedOptions.body instanceof FormData)) {
        fetchOptions.body = JSON.stringify(interceptedOptions.body);
      } else {
        fetchOptions.body = interceptedOptions.body;
      }
    }

    // Create abort controller for timeout if not provided
    let timeoutId: NodeJS.Timeout | undefined;
    let abortController: AbortController | undefined;

    if (!signal && timeout > 0) {
      abortController = new AbortController();
      fetchOptions.signal = abortController.signal;

      timeoutId = setTimeout(() => {
        abortController?.abort();
      }, timeout);
    }

    try {
      // Make the request with retries
      let response: Response | null = null;
      let error: ApiError | null = null;
      let retryCount = 0;

      while (retryCount <= retries) {
        try {
          response = await fetch(fullUrl, fetchOptions);
          break;
        } catch (err) {
          if (retryCount === retries) {
            const apiError: ApiError = err instanceof Error ? err : new Error(String(err));
            apiError.isNetworkError = true;
            error = apiError;
            break;
          }

          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle error
      if (error) {
        // Apply error interceptors
        for (const interceptor of this.errorInterceptors) {
          error = await interceptor(error, fullUrl, interceptedOptions);
        }

        throw error;
      }

      if (!response) {
        throw new Error('No response received');
      }

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        data = await response.blob() as unknown as T;
      }

      // Create API response
      let apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        headers: response.headers,
        fromCache: false,
      };

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        apiResponse = await interceptor<T>(response, apiResponse.data);
      }

      // Cache successful GET responses
      if (useCache && method === 'GET' && response.ok) {
        const cacheKey = `api:${fullUrl}`;
        CacheManager.set<ApiResponse<T>>(cacheKey, apiResponse, cacheOptions);
      }

      // Handle error responses
      if (!response.ok) {
        let responseError: ApiError = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        responseError.status = response.status;
        responseError.data = data;

        // Apply error interceptors
        for (const interceptor of this.errorInterceptors) {
          responseError = await interceptor(responseError, fullUrl, interceptedOptions);
        }

        throw responseError;
      }

      return apiResponse;
    } catch (err) {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle abort errors
      if (err instanceof DOMException && err.name === 'AbortError') {
        let timeoutError: ApiError = new Error('Request timed out');
        timeoutError.isTimeout = true;

        // Apply error interceptors
        for (const interceptor of this.errorInterceptors) {
          timeoutError = await interceptor(timeoutError, fullUrl, interceptedOptions);
        }

        throw timeoutError;
      }

      // Handle other errors
      let finalError: ApiError = err instanceof Error ? err : new Error(String(err));

      // Apply error interceptors
      for (const interceptor of this.errorInterceptors) {
        finalError = await interceptor(finalError, fullUrl, interceptedOptions);
      }

      throw finalError;
    }
  }

  /**
   * Build a URL with query parameters
   * @param url Base URL
   * @param params Query parameters
   * @returns Full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    // Start with base URL if URL is relative
    let fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    // Add query parameters
    if (params) {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    return fullUrl;
  }

  /**
   * Clear the cache for a specific URL or all URLs
   * @param url URL to clear cache for, or undefined to clear all
   */
  public clearCache(url?: string): void {
    if (url) {
      const fullUrl = this.buildUrl(url);
      const cacheKey = `api:${fullUrl}`;
      CacheManager.remove(cacheKey);
    } else {
      // Clear all API cache entries
      // This is a simplification - in a real implementation, you might want to
      // only clear cache entries for this API client's base URL
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('darkswap_cache_api:')) {
          const cacheKey = key.replace('darkswap_cache_', '');
          CacheManager.remove(cacheKey);
        }
      });
    }
  }
}

// Create and export default instance
const apiClient = new ApiClient({
  baseUrl: process.env.REACT_APP_API_URL || '/api',
  cacheOptions: {
    ttl: 5 * 60 * 1000, // 5 minutes
    persist: true,
    version: process.env.REACT_APP_VERSION || '1',
  },
});

export default apiClient;