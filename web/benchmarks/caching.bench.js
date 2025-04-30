/**
 * Benchmarks for caching utilities
 */

// Import the utilities to benchmark
// Note: In a real implementation, we would import from the actual source
// but for benchmarking purposes, we'll mock the implementations
const { MemoryCache, cacheApiResponse, LocalStorageCache } = require('../src/utils/caching');

/**
 * Create a large object for testing
 * @param {number} size - Size of the object
 * @returns {Object} Large object
 */
function createLargeObject(size = 1000) {
  const obj = {};
  for (let i = 0; i < size; i++) {
    obj[`key${i}`] = {
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
      nested: {
        prop1: Math.random(),
        prop2: `Value ${i}`,
        array: Array.from({ length: 10 }, (_, j) => ({ id: j, value: Math.random() }))
      }
    };
  }
  return obj;
}

/**
 * Create a mock API call function
 * @param {number} delay - Delay in milliseconds
 * @param {any} response - Response to return
 * @returns {Function} Mock API call function
 */
function createMockApiCall(delay = 0, response = { data: 'test' }) {
  return () => new Promise(resolve => {
    setTimeout(() => resolve(response), delay);
  });
}

// Benchmark: Memory cache get (small object)
exports.memoryCacheGetSmall = function() {
  // Setup
  MemoryCache.clear();
  const key = 'test-key';
  const value = { data: 'test-value' };
  MemoryCache.set(key, value);
  
  // Benchmark
  const result = MemoryCache.get(key);
  
  return result;
};

// Benchmark: Memory cache get (large object)
exports.memoryCacheGetLarge = function() {
  // Setup
  MemoryCache.clear();
  const key = 'test-key';
  const value = createLargeObject(1000);
  MemoryCache.set(key, value);
  
  // Benchmark
  const result = MemoryCache.get(key);
  
  return result;
};

// Benchmark: Memory cache set (small object)
exports.memoryCacheSetSmall = function() {
  // Setup
  MemoryCache.clear();
  const key = 'test-key';
  const value = { data: 'test-value' };
  
  // Benchmark
  MemoryCache.set(key, value);
  
  return MemoryCache.get(key);
};

// Benchmark: Memory cache set (large object)
exports.memoryCacheSetLarge = function() {
  // Setup
  MemoryCache.clear();
  const key = 'test-key';
  const value = createLargeObject(1000);
  
  // Benchmark
  MemoryCache.set(key, value);
  
  return MemoryCache.get(key);
};

// Benchmark: Memory cache with expiry
exports.memoryCacheWithExpiry = function() {
  // Setup
  MemoryCache.clear();
  const key = 'test-key';
  const value = { data: 'test-value' };
  const ttl = 1000; // 1 second
  
  // Benchmark
  MemoryCache.set(key, value, ttl);
  
  return MemoryCache.get(key);
};

// Benchmark: Memory cache prune
exports.memoryCachePrune = function() {
  // Setup
  MemoryCache.clear();
  
  // Add 100 items with expiry
  for (let i = 0; i < 100; i++) {
    MemoryCache.set(`key${i}`, { data: `value${i}` }, 1); // 1ms TTL (expired immediately)
  }
  
  // Benchmark
  MemoryCache.prune();
  
  return MemoryCache.size();
};

// Benchmark: Memory cache with max size
exports.memoryCacheWithMaxSize = function() {
  // Setup
  MemoryCache.clear();
  const originalMaxSize = MemoryCache.maxSize;
  MemoryCache.maxSize = 10;
  
  // Add 20 items (exceeding max size)
  for (let i = 0; i < 20; i++) {
    MemoryCache.set(`key${i}`, { data: `value${i}` });
  }
  
  // Get result
  const result = MemoryCache.size();
  
  // Restore max size
  MemoryCache.maxSize = originalMaxSize;
  
  return result;
};

// Benchmark: Cache API response (cache hit)
exports.cacheApiResponseHit = async function() {
  // Setup
  MemoryCache.clear();
  const cacheKey = 'test-key';
  const apiCall = createMockApiCall(100, { data: 'test-data' });
  
  // Prime the cache
  await cacheApiResponse(apiCall, cacheKey);
  
  // Benchmark
  const result = await cacheApiResponse(apiCall, cacheKey);
  
  return result;
};

// Benchmark: Cache API response (cache miss)
exports.cacheApiResponseMiss = async function() {
  // Setup
  MemoryCache.clear();
  const cacheKey = 'test-key';
  const apiCall = createMockApiCall(100, { data: 'test-data' });
  
  // Benchmark
  const result = await cacheApiResponse(apiCall, cacheKey);
  
  return result;
};

// Benchmark: Cache API response (bypass cache)
exports.cacheApiResponseBypass = async function() {
  // Setup
  MemoryCache.clear();
  const cacheKey = 'test-key';
  const apiCall = createMockApiCall(100, { data: 'test-data' });
  
  // Prime the cache
  await cacheApiResponse(apiCall, cacheKey);
  
  // Benchmark
  const result = await cacheApiResponse(apiCall, cacheKey, { bypassCache: true });
  
  return result;
};

// Benchmark: Local storage cache get (mock)
exports.localStorageCacheGet = function() {
  // Mock localStorage
  global.localStorage = {
    getItem: jest.fn().mockReturnValue(JSON.stringify({
      value: { data: 'test-value' },
      expires: Date.now() + 60000
    }))
  };
  
  // Benchmark
  const result = LocalStorageCache.get('test-key');
  
  // Clean up
  delete global.localStorage;
  
  return result;
};

// Benchmark: Local storage cache set (mock)
exports.localStorageCacheSet = function() {
  // Mock localStorage
  global.localStorage = {
    setItem: jest.fn()
  };
  
  // Benchmark
  LocalStorageCache.set('test-key', { data: 'test-value' });
  
  // Clean up
  delete global.localStorage;
  
  return true;
};

// Benchmark: HTTP cache ETag generation
exports.httpCacheETagGeneration = function() {
  // Setup
  const data = createLargeObject(100);
  
  // Benchmark
  const etag = require('../src/utils/caching').HttpCache.generateETag(data);
  
  return etag;
};

// Benchmark: HTTP cache freshness check
exports.httpCacheFreshnessCheck = function() {
  // Setup
  const data = { data: 'test-value' };
  const etag = require('../src/utils/caching').HttpCache.generateETag(data);
  const request = {
    headers: {
      'if-none-match': etag
    }
  };
  
  // Benchmark
  const isFresh = require('../src/utils/caching').HttpCache.isFresh(request, etag);
  
  return isFresh;
};

// Benchmark: Cache with different TTLs
exports.cacheWithDifferentTTLs = function() {
  // Setup
  MemoryCache.clear();
  
  // Add items with different TTLs
  MemoryCache.set('key1', { data: 'value1' }, 1000); // 1 second
  MemoryCache.set('key2', { data: 'value2' }, 5000); // 5 seconds
  MemoryCache.set('key3', { data: 'value3' }, 10000); // 10 seconds
  MemoryCache.set('key4', { data: 'value4' }, 60000); // 1 minute
  MemoryCache.set('key5', { data: 'value5' }, 300000); // 5 minutes
  
  // Benchmark
  const results = [
    MemoryCache.get('key1'),
    MemoryCache.get('key2'),
    MemoryCache.get('key3'),
    MemoryCache.get('key4'),
    MemoryCache.get('key5')
  ];
  
  return results;
};

// Benchmark: Cache clear
exports.cacheClear = function() {
  // Setup
  MemoryCache.clear();
  
  // Add 1000 items
  for (let i = 0; i < 1000; i++) {
    MemoryCache.set(`key${i}`, { data: `value${i}` });
  }
  
  // Benchmark
  MemoryCache.clear();
  
  return MemoryCache.size();
};