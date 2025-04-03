import ApiClient, { ApiResponse } from '../utils/ApiClient';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  const baseUrl = 'https://api.example.com';
  
  beforeEach(() => {
    apiClient = new ApiClient({ baseUrl });
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should create an instance with default options', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });
    
    it('should set custom headers', () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      const client = new ApiClient({ baseUrl, headers: customHeaders });
      
      // @ts-ignore - accessing private property for testing
      expect(client.headers['X-Custom-Header']).toBe('custom-value');
      // @ts-ignore - accessing private property for testing
      expect(client.headers['Content-Type']).toBe('application/json');
    });
    
    it('should set custom timeout', () => {
      const timeout = 5000;
      const client = new ApiClient({ baseUrl, timeout });
      
      // @ts-ignore - accessing private property for testing
      expect(client.timeout).toBe(timeout);
    });
  });
  
  describe('setAuthToken', () => {
    it('should set the Authorization header', () => {
      const token = 'test-token';
      apiClient.setAuthToken(token);
      
      // @ts-ignore - accessing private property for testing
      expect(apiClient.headers['Authorization']).toBe(`Bearer ${token}`);
    });
  });
  
  describe('clearAuthToken', () => {
    it('should remove the Authorization header', () => {
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();
      
      // @ts-ignore - accessing private property for testing
      expect(apiClient.headers['Authorization']).toBeUndefined();
    });
  });
  
  describe('get', () => {
    it('should make a GET request', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await apiClient.get<{ data: string }>('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      );
      
      expect(response).toEqual({
        success: true,
        data: { data: 'test' },
      });
    });
    
    it('should include query parameters', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      await apiClient.get('/test', { param1: 'value1', param2: 'value2' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test?param1=value1&param2=value2',
        expect.anything()
      );
    });
    
    it('should handle non-JSON responses', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
        text: jest.fn().mockResolvedValue('plain text response'),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await apiClient.get<string>('/test');
      
      expect(response).toEqual({
        success: true,
        data: 'plain text response',
      });
    });
    
    it('should handle error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await apiClient.get<any>('/test');
      
      expect(response).toEqual({
        success: false,
        error: 'Not found',
      });
    });
    
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const response = await apiClient.get<any>('/test');
      
      expect(response).toEqual({
        success: false,
        error: 'Network error',
      });
    });
    
    it('should handle timeouts', async () => {
      jest.useFakeTimers();
      
      const abortController = { abort: jest.fn(), signal: 'test-signal' };
      // @ts-ignore - mocking AbortController
      global.AbortController = jest.fn(() => abortController);
      
      const fetchPromise = new Promise(resolve => {
        // This promise never resolves, simulating a hanging request
        setTimeout(resolve, 100000);
      });
      
      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);
      
      const getPromise = apiClient.get<any>('/test');
      
      // Fast-forward time to trigger the timeout
      jest.advanceTimersByTime(30000); // Default timeout is 30000ms
      
      expect(abortController.abort).toHaveBeenCalled();
      
      const response = await getPromise;
      
      expect(response).toEqual({
        success: false,
        error: 'Request timed out',
      });
      
      jest.useRealTimers();
    });
  });
  
  describe('post', () => {
    it('should make a POST request with JSON body', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const data = { test: 'data' };
      const response = await apiClient.post<{ data: string }>('/test', data);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify(data),
        })
      );
      
      expect(response).toEqual({
        success: true,
        data: { data: 'test' },
      });
    });
  });
  
  describe('put', () => {
    it('should make a PUT request with JSON body', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const data = { test: 'data' };
      const response = await apiClient.put<{ data: string }>('/test', data);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.any(Object),
          body: JSON.stringify(data),
        })
      );
      
      expect(response).toEqual({
        success: true,
        data: { data: 'test' },
      });
    });
  });
  
  describe('delete', () => {
    it('should make a DELETE request', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await apiClient.delete<{ data: string }>('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.any(Object),
        })
      );
      
      expect(response).toEqual({
        success: true,
        data: { data: 'test' },
      });
    });
  });
});