/**
 * SIMD-enabled WebAssembly module loader
 * 
 * This module provides utilities for loading WebAssembly modules with SIMD support,
 * which can significantly improve performance for certain operations by using
 * Single Instruction, Multiple Data (SIMD) instructions.
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
 * Check if SIMD is supported
 * @returns Whether SIMD is supported
 */
export async function isSimdSupported(): Promise<boolean> {
  // Check if WebAssembly is supported
  if (typeof WebAssembly !== 'object') {
    return false;
  }

  // Check if SIMD is supported
  try {
    // Create a small WebAssembly module with SIMD instructions
    const simdTest = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, // magic bytes
      0x01, 0x00, 0x00, 0x00, // version
      0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, // type section
      0x03, 0x02, 0x01, 0x00, // function section
      0x07, 0x05, 0x01, 0x01, 0x66, 0x00, 0x00, // export section
      0x0a, 0x09, 0x01, 0x07, 0x00, 0xfd, 0x0f, 0x00, 0x00, 0x0b, // code section
    ]);

    // Try to compile the module
    await WebAssembly.compile(simdTest);
    return true;
  } catch (error) {
    console.warn('SIMD is not supported:', error);
    return false;
  }
}

/**
 * Load a WebAssembly module with SIMD support
 * @param url URL of the WebAssembly module
 * @param fallbackUrl URL of the fallback WebAssembly module without SIMD
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module
 */
export async function loadWasmModuleWithSimd(
  url: string,
  fallbackUrl: string,
  importObject?: WebAssembly.Imports
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  // Create a cache key
  const cacheKey = `${url}:${fallbackUrl}:${JSON.stringify(importObject)}`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module with SIMD: ${url}`);
    const startTime = performance.now();

    // Check if SIMD is supported
    const simdSupported = await isSimdSupported();
    const moduleUrl = simdSupported ? url : fallbackUrl;

    // Use streaming instantiation if supported
    let modulePromise: Promise<WebAssembly.WebAssemblyInstantiatedSource>;
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        modulePromise = WebAssembly.instantiateStreaming(fetch(moduleUrl), importObject || {});
      } catch (error) {
        console.warn('Streaming instantiation failed, falling back to regular instantiation:', error);
        const response = await fetch(moduleUrl);
        const buffer = await response.arrayBuffer();
        modulePromise = WebAssembly.instantiate(buffer, importObject || {});
      }
    } else {
      const response = await fetch(moduleUrl);
      const buffer = await response.arrayBuffer();
      modulePromise = WebAssembly.instantiate(buffer, importObject || {});
    }

    // Store the module promise in the cache
    wasmModuleCache[cacheKey] = modulePromise;

    // Wait for the module to load
    const module = await modulePromise;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly module loaded in ${endTime - startTime}ms (SIMD: ${simdSupported})`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module: ${url}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module with SIMD support
 * @param url URL of the WebAssembly module
 * @param fallbackUrl URL of the fallback WebAssembly module without SIMD
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleWithSimd(
  url: string,
  fallbackUrl: string,
  importObject?: WebAssembly.Imports
): Promise<void> {
  try {
    await loadWasmModuleWithSimd(url, fallbackUrl, importObject);
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
 * Get the WebAssembly module cache size
 * @returns Number of modules in the cache
 */
export function getWasmModuleCacheSize(): number {
  return Object.keys(wasmModuleCache).length;
}

/**
 * Check if a WebAssembly module is in the cache
 * @param url URL of the WebAssembly module
 * @param fallbackUrl URL of the fallback WebAssembly module without SIMD
 * @param importObject Import object for the WebAssembly module
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(
  url: string,
  fallbackUrl: string,
  importObject?: WebAssembly.Imports
): boolean {
  const cacheKey = `${url}:${fallbackUrl}:${JSON.stringify(importObject)}`;
  return wasmModuleCache[cacheKey] !== undefined;
}