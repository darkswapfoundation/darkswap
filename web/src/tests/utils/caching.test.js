import { cacheApiResponse, MemoryCache } from '../../utils/caching';

// Mock the API call function
const mockApiCall = jest.fn();

describe('Caching Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the cache
    MemoryCache.clear();
  });
  
  describe('MemoryCache', () => {
    test('should store and retrieve values', () => {
      // Setup
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      // Execute
      MemoryCache.set(key, value);
      const result = MemoryCache.get(key);
      
      // Verify
      expect(result).toEqual(value);
    });
    
    test('should return null for non-existent keys', () => {
      // Execute
      const result = MemoryCache.get('non-existent-key');
      
      // Verify
      expect(result).toBeNull();
    });
    
    test('should respect TTL', () => {
      // Setup
      jest.useFakeTimers();
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 1000; // 1 second
      
      // Execute
      MemoryCache.set(key, value, ttl);
      
      // Verify value exists
      expect(MemoryCache.get(key)).toEqual(value);
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(ttl + 100);
      
      // Verify value is expired
      expect(MemoryCache.get(key)).toBeNull();
      
      // Restore timers
      jest.useRealTimers();
    });
    
    test('should respect max size', () => {
      // Setup
      const originalMaxSize = MemoryCache.maxSize;
      MemoryCache.maxSize = 2;
      
      // Execute
      MemoryCache.set('key1', 'value1');
      MemoryCache.set('key2', 'value2');
      
      // Verify both values exist
      expect(MemoryCache.get('key1')).toBe('value1');
      expect(MemoryCache.get('key2')).toBe('value2');
      
      // Add a third item, which should evict the oldest
      MemoryCache.set('key3', 'value3');
      
      // Verify key1 was evicted
      expect(MemoryCache.get('key1')).toBeNull();
      expect(MemoryCache.get('key2')).toBe('value2');
      expect(MemoryCache.get('key3')).toBe('value3');
      
      // Restore max size
      MemoryCache.maxSize = originalMaxSize;
    });
    
    test('should clear all items', () => {
      // Setup
      MemoryCache.set('key1', 'value1');
      MemoryCache.set('key2', 'value2');
      
      // Execute
      MemoryCache.clear();
      
      // Verify
      expect(MemoryCache.get('key1')).toBeNull();
      expect(MemoryCache.get('key2')).toBeNull();
    });
  });
  
  describe('cacheApiResponse', () => {
    test('should cache API responses', async () => {
      // Setup
      const apiResponse = { data: 'test-data' };
      mockApiCall.mockResolvedValue(apiResponse);
      
      // Execute - first call
      const result1 = await cacheApiResponse(mockApiCall, 'test-key');
      
      // Verify first call
      expect(result1).toEqual(apiResponse);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      
      // Execute - second call with same key
      const result2 = await cacheApiResponse(mockApiCall, 'test-key');
      
      // Verify second call uses cache
      expect(result2).toEqual(apiResponse);
      expect(mockApiCall).toHaveBeenCalledTimes(1); // Still only called once
    });
    
    test('should bypass cache when requested', async () => {
      // Setup
      const apiResponse1 = { data: 'test-data-1' };
      const apiResponse2 = { data: 'test-data-2' };
      
      mockApiCall.mockResolvedValueOnce(apiResponse1);
      mockApiCall.mockResolvedValueOnce(apiResponse2);
      
      // Execute - first call
      const result1 = await cacheApiResponse(mockApiCall, 'test-key');
      
      // Verify first call
      expect(result1).toEqual(apiResponse1);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      
      // Execute - second call with bypassCache
      const result2 = await cacheApiResponse(mockApiCall, 'test-key', { bypassCache: true });
      
      // Verify second call bypasses cache
      expect(result2).toEqual(apiResponse2);
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
    
    test('should respect custom TTL', async () => {
      // Setup
      jest.useFakeTimers();
      const apiResponse1 = { data: 'test-data-1' };
      const apiResponse2 = { data: 'test-data-2' };
      
      mockApiCall.mockResolvedValueOnce(apiResponse1);
      mockApiCall.mockResolvedValueOnce(apiResponse2);
      
      const ttl = 1000; // 1 second
      
      // Execute - first call with custom TTL
      const result1 = await cacheApiResponse(mockApiCall, 'test-key', { ttl });
      
      // Verify first call
      expect(result1).toEqual(apiResponse1);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(ttl + 100);
      
      // Execute - second call after TTL expired
      const result2 = await cacheApiResponse(mockApiCall, 'test-key');
      
      // Verify second call doesn't use cache
      expect(result2).toEqual(apiResponse2);
      expect(mockApiCall).toHaveBeenCalledTimes(2);
      
      // Restore timers
      jest.useRealTimers();
    });
    
    test('should handle API errors', async () => {
      // Setup
      const apiError = new Error('API error');
      mockApiCall.mockRejectedValue(apiError);
      
      // Execute and verify
      await expect(cacheApiResponse(mockApiCall, 'test-key')).rejects.toThrow('API error');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      
      // Verify error wasn't cached
      mockApiCall.mockResolvedValue({ data: 'success' });
      
      // Execute again
      const result = await cacheApiResponse(mockApiCall, 'test-key');
      
      // Verify second call doesn't use cache
      expect(result).toEqual({ data: 'success' });
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });
});