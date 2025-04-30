/**
 * Web Worker WebAssembly module loader
 * 
 * This module provides utilities for loading WebAssembly modules in a background thread
 * using Web Workers, which can improve the responsiveness of the application.
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
 * Web Worker script template
 */
const workerScript = `
  self.onmessage = async function(e) {
    const { id, url, importObject } = e.data;
    
    try {
      // Try streaming instantiation first
      if (WebAssembly.instantiateStreaming) {
        try {
          const result = await WebAssembly.instantiateStreaming(fetch(url), importObject || {});
          self.postMessage({ id, success: true, module: result.module, instance: result.instance });
          return;
        } catch (err) {
          console.warn('Streaming instantiation failed, falling back to regular instantiation:', err);
        }
      }
      
      // Fall back to regular instantiation
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const result = await WebAssembly.instantiate(buffer, importObject || {});
      self.postMessage({ id, success: true, module: result.module, instance: result.instance });
    } catch (err) {
      self.postMessage({ id, success: false, error: err.message });
    }
  };
`;

/**
 * Create a Web Worker from a script
 * @param script Web Worker script
 * @returns Web Worker
 */
function createWorker(script: string): Worker {
  const blob = new Blob([script], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

/**
 * Load a WebAssembly module in a Web Worker
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module and instance
 */
export async function loadWasmModuleInWorker(
  url: string,
  importObject?: WebAssembly.Imports
): Promise<{ module: WebAssembly.Module; instance: WebAssembly.Instance }> {
  // Check if the module is already in the cache
  const cacheKey = `${url}:${JSON.stringify(importObject)}`;
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Create a promise that will be resolved when the worker completes
  const modulePromise = new Promise<{ module: WebAssembly.Module; instance: WebAssembly.Instance }>((resolve, reject) => {
    try {
      console.log(`Loading WebAssembly module in Web Worker: ${url}`);
      const startTime = performance.now();

      // Create a unique ID for this request
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a Web Worker
      const worker = createWorker(workerScript);

      // Handle messages from the worker
      worker.onmessage = (e) => {
        const { id: responseId, success, module, instance, error } = e.data;

        // Check if this is the response we're waiting for
        if (responseId !== id) {
          return;
        }

        // Terminate the worker
        worker.terminate();

        if (success) {
          // Log the loading time
          const endTime = performance.now();
          console.log(`WebAssembly module loaded in Web Worker in ${endTime - startTime}ms`);

          // Resolve the promise
          resolve({ module, instance });
        } else {
          // Reject the promise
          reject(new Error(error));
        }
      };

      // Handle errors from the worker
      worker.onerror = (error) => {
        // Terminate the worker
        worker.terminate();

        // Reject the promise
        reject(error);
      };

      // Send the request to the worker
      worker.postMessage({ id, url, importObject });
    } catch (error) {
      // Reject the promise
      reject(error);
    }
  });

  // Store the promise in the cache
  wasmModuleCache[cacheKey] = modulePromise;

  try {
    // Wait for the module to load
    return await modulePromise;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module in Web Worker: ${url}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module in a Web Worker
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleInWorker(
  url: string,
  importObject?: WebAssembly.Imports
): Promise<void> {
  try {
    await loadWasmModuleInWorker(url, importObject);
    console.log(`WebAssembly module preloaded in Web Worker: ${url}`);
  } catch (error) {
    console.error(`Failed to preload WebAssembly module in Web Worker: ${url}`, error);
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
 * Check if Web Workers are supported
 * @returns Whether Web Workers are supported
 */
export function isWebWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}