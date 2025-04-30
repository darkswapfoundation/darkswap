/**
 * Shared Memory WebAssembly module loader
 * 
 * This module provides utilities for loading WebAssembly modules with shared memory
 * between the main thread and Web Workers using Shared Array Buffers, which can
 * significantly improve performance for certain operations.
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
 * Check if Shared Array Buffers are supported
 * @returns Whether Shared Array Buffers are supported
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * Check if Atomics are supported
 * @returns Whether Atomics are supported
 */
export function isAtomicsSupported(): boolean {
  return typeof Atomics !== 'undefined';
}

/**
 * Check if shared memory is supported
 * @returns Whether shared memory is supported
 */
export function isSharedMemorySupported(): boolean {
  return isSharedArrayBufferSupported() && isAtomicsSupported();
}

/**
 * Web Worker script template for shared memory
 */
const workerScript = `
  self.onmessage = async function(e) {
    const { id, url, importObject, sharedMemory } = e.data;
    
    try {
      // Check if shared memory is provided
      if (sharedMemory) {
        // Get the shared memory buffer
        const sharedBuffer = sharedMemory.buffer;
        
        // Create a new import object with the shared memory
        const importObjectWithMemory = {
          ...importObject,
          env: {
            ...importObject?.env,
            memory: new WebAssembly.Memory({
              initial: sharedMemory.initial,
              maximum: sharedMemory.maximum,
              shared: true
            })
          }
        };
        
        // Try streaming instantiation first
        if (WebAssembly.instantiateStreaming) {
          try {
            const result = await WebAssembly.instantiateStreaming(fetch(url), importObjectWithMemory);
            self.postMessage({ id, success: true, module: result.module, instance: result.instance });
            return;
          } catch (err) {
            console.warn('Streaming instantiation failed, falling back to regular instantiation:', err);
          }
        }
        
        // Fall back to regular instantiation
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const result = await WebAssembly.instantiate(buffer, importObjectWithMemory);
        self.postMessage({ id, success: true, module: result.module, instance: result.instance });
      } else {
        // No shared memory, use regular instantiation
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
      }
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
 * Load a WebAssembly module with shared memory
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @param memoryOptions Memory options for the shared memory
 * @returns Promise that resolves to the WebAssembly module and instance
 */
export async function loadWasmModuleWithSharedMemory(
  url: string,
  importObject?: WebAssembly.Imports,
  memoryOptions?: {
    initial: number;
    maximum?: number;
  }
): Promise<{ module: WebAssembly.Module; instance: WebAssembly.Instance }> {
  // Check if shared memory is supported
  if (!isSharedMemorySupported()) {
    console.warn('Shared memory is not supported, falling back to regular loading');
    return loadWasmModuleWithoutSharedMemory(url, importObject);
  }

  // Create a cache key
  const cacheKey = `${url}:${JSON.stringify(importObject)}:${JSON.stringify(memoryOptions)}`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Create a promise that will be resolved when the worker completes
  const modulePromise = new Promise<{ module: WebAssembly.Module; instance: WebAssembly.Instance }>((resolve, reject) => {
    try {
      console.log(`Loading WebAssembly module with shared memory: ${url}`);
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
          console.log(`WebAssembly module loaded with shared memory in ${endTime - startTime}ms`);

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

      // Create shared memory options
      const sharedMemory = memoryOptions ? {
        initial: memoryOptions.initial,
        maximum: memoryOptions.maximum,
        buffer: new SharedArrayBuffer(memoryOptions.initial * 64 * 1024) // 64KB pages
      } : undefined;

      // Send the request to the worker
      worker.postMessage({ id, url, importObject, sharedMemory });
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
    
    console.error(`Failed to load WebAssembly module with shared memory: ${url}`, error);
    throw error;
  }
}

/**
 * Load a WebAssembly module without shared memory
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module and instance
 */
async function loadWasmModuleWithoutSharedMemory(
  url: string,
  importObject?: WebAssembly.Imports
): Promise<{ module: WebAssembly.Module; instance: WebAssembly.Instance }> {
  // Create a cache key
  const cacheKey = `${url}:${JSON.stringify(importObject)}`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module without shared memory: ${url}`);
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
    console.log(`WebAssembly module loaded without shared memory in ${endTime - startTime}ms`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module without shared memory: ${url}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module with shared memory
 * @param url URL of the WebAssembly module
 * @param importObject Import object for the WebAssembly module
 * @param memoryOptions Memory options for the shared memory
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleWithSharedMemory(
  url: string,
  importObject?: WebAssembly.Imports,
  memoryOptions?: {
    initial: number;
    maximum?: number;
  }
): Promise<void> {
  try {
    await loadWasmModuleWithSharedMemory(url, importObject, memoryOptions);
    console.log(`WebAssembly module preloaded with shared memory: ${url}`);
  } catch (error) {
    console.error(`Failed to preload WebAssembly module with shared memory: ${url}`, error);
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
 * @param memoryOptions Memory options for the shared memory
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(
  url: string,
  importObject?: WebAssembly.Imports,
  memoryOptions?: {
    initial: number;
    maximum?: number;
  }
): boolean {
  const cacheKey = `${url}:${JSON.stringify(importObject)}:${JSON.stringify(memoryOptions)}`;
  return wasmModuleCache[cacheKey] !== undefined;
}