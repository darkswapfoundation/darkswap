import { Cache, createCache, CacheOptions } from './cache';

/**
 * API client options
 */
export interface ApiClientOptions {
  /** The base URL of the API */
  baseUrl: string;
  /** The request timeout in milliseconds */
  timeout?: number;
  /** Default headers to include in all requests */
  headers?: Record<string, string>;
  /** The credentials mode for requests */
  credentials?: RequestCredentials;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Cache options */
  cache?: {
    /** Whether to enable caching */
    enabled?: boolean;
    /** Cache options */
    options?: CacheOptions;
    /** Cache key prefix */
    keyPrefix?: string;
    /** Routes to exclude from caching (regex patterns) */
    excludeRoutes?: RegExp[];
    /** Routes to include in caching (regex patterns) */
    includeRoutes?: RegExp[];
    /** HTTP methods to cache */
    methods?: string[];
  };
}

/**
 * API response
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** The response data */
  data?: T;
  /** The error message */
  error?: string;
  /** The HTTP status code */
  status?: number;
  /** Whether the response was cached */
  cached?: boolean;
}

/**
 * Request options
 */
export interface RequestOptions {
  /** Headers to include in the request */
  headers?: Record<string, string>;
  /** The request body */
  body?: any;
  /** Query parameters to include in the request URL */
  params?: Record<string, string>;
  /** The request timeout in milliseconds */
  timeout?: number;
  /** The credentials mode for the request */
  credentials?: RequestCredentials;
  /** The cache mode for the request */
  cache?: RequestCache;
  /** The mode for the request */
  mode?: RequestMode;
  /** The redirect mode for the request */
  redirect?: RequestRedirect;
  /** The referrer for the request */
  referrer?: string;
  /** The referrer policy for the request */
  referrerPolicy?: ReferrerPolicy;
  /** The integrity value for the request */
  integrity?: string;
  /** Whether to keep the connection alive after the page is unloaded */
  keepalive?: boolean;
  /** An abort signal to abort the request */
  signal?: AbortSignal;
  /** Whether to skip caching for this request */
  skipCache?: boolean;
  /** The cache expiry time in milliseconds */
  cacheExpiry?: number;
}

/**
 * API client for making HTTP requests
 */
export class ApiClient {
  /** The base URL of the API */
  private baseUrl: string;
  /** The request timeout in milliseconds */
  private timeout: number;
  /** Default headers to include in all requests */
  private headers: Record<string, string>;
  /** The credentials mode for requests */
  private credentials: RequestCredentials;
  /** Whether to enable debug logging */
  private debug: boolean;
  /** The authentication token */
  private token: string | null = null;
  /** The cache instance */
  private cache: Cache<ApiResponse>;
  /** Cache options */
  private cacheOptions: Required<NonNullable<ApiClientOptions['cache']>>;

  /**
   * Create a new API client
   * @param options API client options
   */
  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {};
    this.credentials = options.credentials || 'same-origin';
    this.debug = options.debug || false;

    // Set default cache options
    const defaultCacheOptions = {
      enabled: true,
      options: {
        maxEntries: 100,
        defaultExpiry: 5 * 60 * 1000, // 5 minutes
        persistent: false,
        storagePrefix: 'darkswap_api_cache_',
      },
      keyPrefix: 'api:',
      excludeRoutes: [/\/auth\//],
      includeRoutes: [/.*/],
      methods: ['GET'],
    };

    // Merge with user-provided options
    this.cacheOptions = {
      ...defaultCacheOptions,
      ...options.cache,
      options: {
        ...defaultCacheOptions.options,
        ...options.cache?.options,
      },
    };

    // Create cache instance
    this.cache = createCache<ApiResponse>(this.cacheOptions.options);
  }

  /**
   * Set the authentication token
   * @param token The authentication token, or null to clear the token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Get the authentication token
   * @returns The authentication token, or null if no token is set
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Set a default header for all requests
   * @param name The header name
   * @param value The header value
   */
  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  /**
   * Remove a default header
   * @param name The header name
   */
  removeHeader(name: string): void {
    delete this.headers[name];
  }

  /**
   * Make a GET request to the API
   * @param endpoint The API endpoint
   * @param options Request options
   * @returns A promise that resolves to an API response
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * Make a POST request to the API
   * @param endpoint The API endpoint
   * @param data The request body
   * @param options Request options
   * @returns A promise that resolves to an API response
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: data,
    });
  }

  /**
   * Make a PUT request to the API
   * @param endpoint The API endpoint
   * @param data The request body
   * @param options Request options
   * @returns A promise that resolves to an API response
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: data,
    });
  }

  /**
   * Make a DELETE request to the API
   * @param endpoint The API endpoint
   * @param options Request options
   * @returns A promise that resolves to an API response
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }

  /**
   * Make a request to the API
   * @param method The HTTP method
   * @param endpoint The API endpoint
   * @param options Request options
   * @returns A promise that resolves to an API response
   */
  async request<T = any>(method: string, endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);
    const cacheKey = this.getCacheKey(method, url);
    const shouldCache = this.shouldCacheRequest(method, endpoint, options);

    // Check cache first if caching is enabled and this is a cacheable request
    if (shouldCache && !options?.skipCache) {
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        if (this.debug) {
          console.log(`[ApiClient] Cache hit for ${method} ${url}`);
        }
        return {
          ...cachedResponse,
          cached: true,
        };
      }
    }

    try {
      // Prepare headers
      const headers = new Headers({
        'Content-Type': 'application/json',
        ...this.headers,
        ...options?.headers,
      });

      // Add authorization header if token is set
      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      // Prepare request body
      let body: string | FormData | undefined;
      if (options?.body !== undefined) {
        if (options.body instanceof FormData) {
          body = options.body;
          // Remove Content-Type header to let the browser set it with the boundary
          headers.delete('Content-Type');
        } else if (typeof options.body === 'object') {
          body = JSON.stringify(options.body);
        } else {
          body = String(options.body);
        }
      }

      // Create request
      const request = new Request(url, {
        method,
        headers,
        body,
        credentials: options?.credentials || this.credentials,
        cache: options?.cache || 'no-cache',
        mode: options?.mode || 'cors',
        redirect: options?.redirect || 'follow',
        referrer: options?.referrer,
        referrerPolicy: options?.referrerPolicy,
        integrity: options?.integrity,
        keepalive: options?.keepalive,
        signal: options?.signal,
      });

      // Set up timeout
      const timeout = options?.timeout || this.timeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Make request
      const response = await fetch(request.clone());
      clearTimeout(timeoutId);

      // Parse response
      const status = response.status;
      const success = response.ok;
      let data: T | undefined;
      let error: string | undefined;

      try {
        // Try to parse response as JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          data = json.data || json;
          error = json.error || (success ? undefined : 'Unknown error');
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          data = text as unknown as T;
          error = success ? undefined : text || 'Unknown error';
        }
      } catch (e) {
        // Handle parsing errors
        error = e instanceof Error ? e.message : 'Failed to parse response';
      }

      // Create response object
      const apiResponse: ApiResponse<T> = {
        success,
        data,
        error,
        status,
      };

      // Cache successful GET responses
      if (shouldCache && success) {
        const cacheExpiry = options?.cacheExpiry || this.cacheOptions.options.defaultExpiry;
        this.cache.set(cacheKey, apiResponse, cacheExpiry);
        if (this.debug) {
          console.log(`[ApiClient] Cached response for ${method} ${url}`);
        }
      }

      return apiResponse;
    } catch (error) {
      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      const apiResponse: ApiResponse<T> = {
        success: false,
        error: errorMessage,
      };

      if (this.debug) {
        console.error(`[ApiClient] Error for ${method} ${url}:`, error);
      }

      return apiResponse;
    }
  }

  /**
   * Build a URL with query parameters
   * @param endpoint The API endpoint
   * @param params Query parameters
   * @returns The full URL
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${normalizedEndpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Get a cache key for a request
   * @param method The HTTP method
   * @param url The request URL
   * @returns The cache key
   */
  private getCacheKey(method: string, url: string): string {
    return `${this.cacheOptions.keyPrefix}${method}:${url}`;
  }

  /**
   * Check if a request should be cached
   * @param method The HTTP method
   * @param endpoint The API endpoint
   * @param options Request options
   * @returns True if the request should be cached, false otherwise
   */
  private shouldCacheRequest(method: string, endpoint: string, options?: RequestOptions): boolean {
    // Skip cache if disabled
    if (!this.cacheOptions.enabled) {
      return false;
    }

    // Skip cache if explicitly requested
    if (options?.skipCache) {
      return false;
    }

    // Only cache specified methods
    if (!this.cacheOptions.methods.includes(method)) {
      return false;
    }

    // Check exclude routes
    for (const pattern of this.cacheOptions.excludeRoutes) {
      if (pattern.test(endpoint)) {
        return false;
      }
    }

    // Check include routes
    for (const pattern of this.cacheOptions.includeRoutes) {
      if (pattern.test(endpoint)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.debug) {
      console.log('[ApiClient] Cache cleared');
    }
  }

  /**
   * Clear a specific cache entry
   * @param method The HTTP method
   * @param endpoint The API endpoint
   * @param params Query parameters
   */
  clearCacheEntry(method: string, endpoint: string, params?: Record<string, string>): void {
    const url = this.buildUrl(endpoint, params);
    const cacheKey = this.getCacheKey(method, url);
    this.cache.delete(cacheKey);
    if (this.debug) {
      console.log(`[ApiClient] Cache entry cleared for ${method} ${url}`);
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: this.cache.keys(),
    };
  }
}

/**
 * Create a new API client
 * @param options API client options
 * @returns A new API client instance
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}