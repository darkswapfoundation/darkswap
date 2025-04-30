/**
 * Dynamic Chunk Size WebAssembly module loader
 * 
 * This module provides utilities for loading WebAssembly modules with dynamic chunk sizing
 * based on network conditions, which can significantly improve the initial page load time
 * by optimizing the chunk size for the current network conditions.
 */

/**
 * WebAssembly module cache
 */
interface WasmModuleCache {
  [key: string]: Promise<any> | undefined;
}

/**
 * WebAssembly module cache
 */
const wasmModuleCache: WasmModuleCache = {};

/**
 * WebAssembly chunk cache
 */
interface WasmChunkCache {
  [key: string]: ArrayBuffer | undefined;
}

/**
 * WebAssembly chunk cache
 */
const wasmChunkCache: WasmChunkCache = {};

/**
 * Network speed measurement
 */
interface NetworkSpeed {
  downloadSpeed: number; // bytes per second
  rtt: number; // milliseconds
  timestamp: number; // timestamp when the measurement was taken
}

/**
 * Network speed cache
 */
let networkSpeedCache: NetworkSpeed | null = null;

/**
 * Network speed measurement expiration time (5 minutes)
 */
const NETWORK_SPEED_EXPIRATION = 5 * 60 * 1000;

/**
 * Minimum chunk size (100KB)
 */
const MIN_CHUNK_SIZE = 100 * 1024;

/**
 * Maximum chunk size (5MB)
 */
const MAX_CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * Default chunk size (1MB)
 */
const DEFAULT_CHUNK_SIZE = 1 * 1024 * 1024;

/**
 * Measure network speed
 * @returns Promise that resolves to the network speed
 */
async function measureNetworkSpeed(): Promise<NetworkSpeed> {
  // Check if we have a recent network speed measurement
  if (networkSpeedCache && Date.now() - networkSpeedCache.timestamp < NETWORK_SPEED_EXPIRATION) {
    return networkSpeedCache;
  }

  // Measure network speed
  try {
    console.log('Measuring network speed...');
    const startTime = performance.now();

    // Create a test file URL (1MB)
    const testFileSize = 1 * 1024 * 1024;
    const testFileUrl = `https://speed.cloudflare.com/cdn-cgi/trace?size=${testFileSize}`;

    // Measure RTT
    const rttStartTime = performance.now();
    await fetch(testFileUrl, { method: 'HEAD' });
    const rtt = performance.now() - rttStartTime;

    // Measure download speed
    const downloadStartTime = performance.now();
    const response = await fetch(testFileUrl);
    const buffer = await response.arrayBuffer();
    const downloadTime = performance.now() - downloadStartTime;

    // Calculate download speed in bytes per second
    const downloadSpeed = buffer.byteLength / (downloadTime / 1000);

    // Cache the network speed
    networkSpeedCache = {
      downloadSpeed,
      rtt,
      timestamp: Date.now(),
    };

    // Log the network speed
    const endTime = performance.now();
    console.log(`Network speed measured in ${endTime - startTime}ms: ${downloadSpeed} bytes/s, RTT: ${rtt}ms`);

    return networkSpeedCache;
  } catch (error) {
    console.error('Failed to measure network speed:', error);
    
    // Return a default network speed
    return {
      downloadSpeed: 1 * 1024 * 1024, // 1MB/s
      rtt: 100, // 100ms
      timestamp: Date.now(),
    };
  }
}

/**
 * Calculate optimal chunk size based on network conditions
 * @param totalSize Total size of the WebAssembly module
 * @returns Promise that resolves to the optimal chunk size
 */
async function calculateOptimalChunkSize(totalSize: number): Promise<number> {
  try {
    // Measure network speed
    const networkSpeed = await measureNetworkSpeed();

    // Calculate optimal chunk size based on network conditions
    // We want to balance the overhead of multiple requests with the benefits of parallel loading
    // For slow connections, we want fewer, larger chunks
    // For fast connections, we want more, smaller chunks
    // For high latency connections, we want fewer, larger chunks
    // For low latency connections, we want more, smaller chunks

    // Calculate base chunk size based on download speed
    // We aim for chunks that take about 500ms to download
    const targetDownloadTime = 500; // milliseconds
    const baseChunkSize = networkSpeed.downloadSpeed * (targetDownloadTime / 1000);

    // Adjust chunk size based on RTT
    // For high latency connections, we increase the chunk size to reduce the number of requests
    // For low latency connections, we decrease the chunk size to increase parallelism
    const rttFactor = Math.max(0.5, Math.min(2, networkSpeed.rtt / 100));
    let chunkSize = baseChunkSize * rttFactor;

    // Ensure chunk size is within reasonable limits
    chunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, chunkSize));

    // Ensure chunk size is not larger than the total size
    chunkSize = Math.min(chunkSize, totalSize);

    // Ensure we have at least 2 chunks for parallelism
    const minChunks = 2;
    const maxChunkSize = totalSize / minChunks;
    chunkSize = Math.min(chunkSize, maxChunkSize);

    // Round chunk size to the nearest 10KB
    chunkSize = Math.round(chunkSize / (10 * 1024)) * (10 * 1024);

    console.log(`Calculated optimal chunk size: ${chunkSize} bytes`);
    return chunkSize;
  } catch (error) {
    console.error('Failed to calculate optimal chunk size:', error);
    return DEFAULT_CHUNK_SIZE;
  }
}

/**
 * Load a WebAssembly chunk
 * @param url URL of the WebAssembly chunk
 * @returns Promise that resolves to the chunk as an ArrayBuffer
 */
async function loadWasmChunk(url: string): Promise<ArrayBuffer> {
  // Check if the chunk is already in the cache
  if (wasmChunkCache[url] !== undefined) {
    return wasmChunkCache[url]!;
  }

  // Load the chunk
  try {
    console.log(`Loading WebAssembly chunk: ${url}`);
    const startTime = performance.now();

    // Fetch the chunk
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Store the chunk in the cache
    wasmChunkCache[url] = buffer;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly chunk loaded in ${endTime - startTime}ms`);

    return buffer;
  } catch (error) {
    console.error(`Failed to load WebAssembly chunk: ${url}`, error);
    throw error;
  }
}

/**
 * Load a WebAssembly module using dynamic chunk sizing
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module
 */
export async function loadWasmModuleWithDynamicChunkSize(
  url: string,
  importObject?: WebAssembly.Imports
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  // Create a cache key
  const cacheKey = `${url}:${JSON.stringify(importObject)}`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module with dynamic chunk size: ${url}`);
    const startTime = performance.now();

    // Get the module size
    const sizeResponse = await fetch(url, { method: 'HEAD' });
    const totalSize = parseInt(sizeResponse.headers.get('content-length') || '0', 10);

    // If we couldn't get the size, fall back to regular loading
    if (totalSize === 0) {
      console.warn('Could not determine module size, falling back to regular loading');
      return loadWasmModuleWithoutChunking(url, importObject);
    }

    // Calculate optimal chunk size
    const chunkSize = await calculateOptimalChunkSize(totalSize);

    // Calculate number of chunks
    const chunkCount = Math.ceil(totalSize / chunkSize);

    // Create chunk URLs
    const chunkUrls: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize - 1, totalSize - 1);
      chunkUrls.push(`${url}?range=${start}-${end}`);
    }

    // Load chunks in parallel
    const chunkPromises = chunkUrls.map(loadWasmChunk);
    const chunks = await Promise.all(chunkPromises);

    // Combine chunks
    const combinedBuffer = new ArrayBuffer(totalSize);
    const combinedView = new Uint8Array(combinedBuffer);
    let offset = 0;
    for (const chunk of chunks) {
      combinedView.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Instantiate the module
    const modulePromise = WebAssembly.instantiate(combinedBuffer, importObject || {});

    // Store the module promise in the cache
    wasmModuleCache[cacheKey] = modulePromise;

    // Wait for the module to load
    const module = await modulePromise;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly module loaded in ${endTime - startTime}ms with ${chunkCount} chunks of ${chunkSize} bytes each`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module with dynamic chunk size: ${url}`, error);
    
    // Fall back to regular loading
    console.warn('Falling back to regular loading');
    return loadWasmModuleWithoutChunking(url, importObject);
  }
}

/**
 * Load a WebAssembly module without chunking
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module
 */
async function loadWasmModuleWithoutChunking(
  url: string,
  importObject?: WebAssembly.Imports
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  // Create a cache key
  const cacheKey = `${url}:${JSON.stringify(importObject)}:no-chunking`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module without chunking: ${url}`);
    const startTime = performance.now();

    // Use streaming instantiation if supported
    let modulePromise: Promise<WebAssembly.WebAssemblyInstantiatedSource>;
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        modulePromise = WebAssembly.instantiateStreaming(fetch(url), importObject || {});
      } catch (error) {
        console.warn('Streaming instantiation failed, falling back to regular instantiation:', error);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        modulePromise = WebAssembly.instantiate(buffer, importObject || {});
      }
    } else {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      modulePromise = WebAssembly.instantiate(buffer, importObject || {});
    }

    // Store the module promise in the cache
    wasmModuleCache[cacheKey] = modulePromise;

    // Wait for the module to load
    const module = await modulePromise;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly module loaded without chunking in ${endTime - startTime}ms`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module without chunking: ${url}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module with dynamic chunk sizing
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleWithDynamicChunkSize(
  url: string,
  importObject?: WebAssembly.Imports
): Promise<void> {
  try {
    await loadWasmModuleWithDynamicChunkSize(url, importObject);
    console.log(`WebAssembly module preloaded: ${url}`);
  } catch (error) {
    console.error(`Failed to preload WebAssembly module: ${url}`, error);
  }
}

/**
 * Clear the WebAssembly module cache
 */
export function clearWasmModuleCache(): void {
  Object.keys(wasmModuleCache).forEach(key => {
    delete wasmModuleCache[key];
  });
  console.log('WebAssembly module cache cleared');
}

/**
 * Clear the WebAssembly chunk cache
 */
export function clearWasmChunkCache(): void {
  Object.keys(wasmChunkCache).forEach(key => {
    delete wasmChunkCache[key];
  });
  console.log('WebAssembly chunk cache cleared');
}

/**
 * Clear the network speed cache
 */
export function clearNetworkSpeedCache(): void {
  networkSpeedCache = null;
  console.log('Network speed cache cleared');
}

/**
 * Get the WebAssembly module cache size
 * @returns Number of modules in the cache
 */
export function getWasmModuleCacheSize(): number {
  return Object.keys(wasmModuleCache).length;
}

/**
 * Get the WebAssembly chunk cache size
 * @returns Number of chunks in the cache
 */
export function getWasmChunkCacheSize(): number {
  return Object.keys(wasmChunkCache).length;
}

/**
 * Check if a WebAssembly module is in the cache
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(
  url: string,
  importObject?: WebAssembly.Imports
): boolean {
  const cacheKey = `${url}:${JSON.stringify(importObject)}`;
  return wasmModuleCache[cacheKey] !== undefined;
}

/**
 * Check if a WebAssembly chunk is in the cache
 * @param url URL of the WebAssembly chunk
 * @returns Whether the chunk is in the cache
 */
export function isWasmChunkCached(url: string): boolean {
  return wasmChunkCache[url] !== undefined;
}

/**
 * Get the current network speed
 * @returns The current network speed, or null if no measurement has been taken
 */
export function getNetworkSpeed(): NetworkSpeed | null {
  return networkSpeedCache;
}