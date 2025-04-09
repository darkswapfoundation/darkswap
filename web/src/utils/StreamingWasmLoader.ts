/**
 * Streaming WebAssembly module loader
 * 
 * This module provides utilities for streaming compilation of WebAssembly modules,
 * which can significantly improve loading times by compiling the module while it's
 * being downloaded.
 */

/**
 * WebAssembly module cache
 */
interface WasmModuleCache {
  [key: string]: Promise<WebAssembly.Module> | undefined;
}

/**
 * WebAssembly module cache
 */
const wasmModuleCache: WasmModuleCache = {};

/**
 * WebAssembly instance cache
 */
interface WasmInstanceCache {
  [key: string]: Promise<WebAssembly.Instance> | undefined;
}

/**
 * WebAssembly instance cache
 */
const wasmInstanceCache: WasmInstanceCache = {};

/**
 * Load a WebAssembly module using streaming compilation
 * @param url URL of the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module
 */
export async function loadWasmModuleStreaming(url: string): Promise<WebAssembly.Module> {
  // Check if the module is already in the cache
  if (wasmModuleCache[url] !== undefined) {
    return wasmModuleCache[url]!;
  }

  // Load the module using streaming compilation
  try {
    console.log(`Loading WebAssembly module streaming: ${url}`);
    const startTime = performance.now();

    // Use streaming compilation if supported
    const modulePromise = WebAssembly.compileStreaming(fetch(url))
      .catch(async (err) => {
        // Fallback to non-streaming compilation if streaming compilation fails
        console.warn(`Streaming compilation failed, falling back to non-streaming: ${err}`);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        return WebAssembly.compile(buffer);
      });

    // Store the module promise in the cache
    wasmModuleCache[url] = modulePromise;

    // Wait for the module to load
    const module = await modulePromise;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly module loaded in ${endTime - startTime}ms`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[url];
    
    console.error(`Failed to load WebAssembly module: ${url}`, error);
    throw error;
  }
}

/**
 * Instantiate a WebAssembly module using streaming instantiation
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly instance
 */
export async function instantiateWasmModuleStreaming(
  url: string,
  importObject: WebAssembly.Imports = {}
): Promise<WebAssembly.Instance> {
  // Create a cache key
  const cacheKey = `${url}:${JSON.stringify(importObject)}`;

  // Check if the instance is already in the cache
  if (wasmInstanceCache[cacheKey] !== undefined) {
    return wasmInstanceCache[cacheKey]!;
  }

  // Instantiate the module using streaming instantiation
  try {
    console.log(`Instantiating WebAssembly module streaming: ${url}`);
    const startTime = performance.now();

    // Use streaming instantiation if supported
    const instancePromise = WebAssembly.instantiateStreaming(fetch(url), importObject)
      .then(result => result.instance)
      .catch(async (err) => {
        // Fallback to non-streaming instantiation if streaming instantiation fails
        console.warn(`Streaming instantiation failed, falling back to non-streaming: ${err}`);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(buffer, importObject);
        return result.instance;
      });

    // Store the instance promise in the cache
    wasmInstanceCache[cacheKey] = instancePromise;

    // Wait for the instance to load
    const instance = await instancePromise;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly instance created in ${endTime - startTime}ms`);

    return instance;
  } catch (error) {
    // Remove the failed instance from the cache
    delete wasmInstanceCache[cacheKey];
    
    console.error(`Failed to instantiate WebAssembly module: ${url}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module using streaming compilation
 * @param url URL of the WebAssembly module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleStreaming(url: string): Promise<void> {
  try {
    await loadWasmModuleStreaming(url);
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
 * Clear the WebAssembly instance cache
 */
export function clearWasmInstanceCache(): void {
  Object.keys(wasmInstanceCache).forEach(key => {
    delete wasmInstanceCache[key];
  });
  console.log('WebAssembly instance cache cleared');
}

/**
 * Get the WebAssembly module cache size
 * @returns Number of modules in the cache
 */
export function getWasmModuleCacheSize(): number {
  return Object.keys(wasmModuleCache).length;
}

/**
 * Get the WebAssembly instance cache size
 * @returns Number of instances in the cache
 */
export function getWasmInstanceCacheSize(): number {
  return Object.keys(wasmInstanceCache).length;
}

/**
 * Check if a WebAssembly module is in the cache
 * @param url URL of the WebAssembly module
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(url: string): boolean {
  return wasmModuleCache[url] !== undefined;
}

/**
 * Check if a WebAssembly instance is in the cache
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Whether the instance is in the cache
 */
export function isWasmInstanceCached(url: string, importObject: WebAssembly.Imports = {}): boolean {
  const cacheKey = `${url}:${JSON.stringify(importObject)}`;
  return wasmInstanceCache[cacheKey] !== undefined;
}

/**
 * Check if streaming compilation is supported
 * @returns Whether streaming compilation is supported
 */
export function isStreamingCompilationSupported(): boolean {
  return typeof WebAssembly.compileStreaming === 'function';
}

/**
 * Check if streaming instantiation is supported
 * @returns Whether streaming instantiation is supported
 */
export function isStreamingInstantiationSupported(): boolean {
  return typeof WebAssembly.instantiateStreaming === 'function';
}