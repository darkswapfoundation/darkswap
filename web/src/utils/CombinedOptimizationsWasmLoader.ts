/**
 * Combined Optimizations WebAssembly module loader
 * 
 * This module provides utilities for loading WebAssembly modules with combined optimizations,
 * including SIMD instructions, Web Workers, streaming compilation, and more. By combining
 * multiple optimizations, we can achieve even better performance than using each optimization
 * individually.
 */

import { isSimdSupported } from './SimdWasmLoader';
import { isSharedMemorySupported } from './SharedMemoryWasmLoader';

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
 * Check if Web Workers are supported
 * @returns Whether Web Workers are supported
 */
export function isWebWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Check if streaming instantiation is supported
 * @returns Whether streaming instantiation is supported
 */
export function isStreamingSupported(): boolean {
  return typeof WebAssembly.instantiateStreaming === 'function';
}

/**
 * Check if all optimizations are supported
 * @returns Promise that resolves to whether all optimizations are supported
 */
export async function areAllOptimizationsSupported(): Promise<boolean> {
  const simdSupported = await isSimdSupported();
  return isWebWorkerSupported() && isStreamingSupported() && simdSupported && isSharedMemorySupported();
}

/**
 * Get supported optimizations
 * @returns Promise that resolves to an object with supported optimizations
 */
export async function getSupportedOptimizations(): Promise<{
  webWorker: boolean;
  streaming: boolean;
  simd: boolean;
  sharedMemory: boolean;
}> {
  const simdSupported = await isSimdSupported();
  return {
    webWorker: isWebWorkerSupported(),
    streaming: isStreamingSupported(),
    simd: simdSupported,
    sharedMemory: isSharedMemorySupported(),
  };
}

/**
 * Web Worker script template for combined optimizations
 */
const workerScript = `
  self.onmessage = async function(e) {
    const { id, url, simdUrl, importObject, sharedMemory } = e.data;
    
    try {
      // Check if SIMD is supported
      let simdSupported = false;
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
        simdSupported = true;
      } catch (err) {
        simdSupported = false;
      }
      
      // Use the appropriate URL based on SIMD support
      const moduleUrl = simdSupported && simdUrl ? simdUrl : url;
      
      // Create import object with shared memory if provided
      let finalImportObject = importObject || {};
      if (sharedMemory) {
        finalImportObject = {
          ...finalImportObject,
          env: {
            ...finalImportObject.env,
            memory: new WebAssembly.Memory({
              initial: sharedMemory.initial,
              maximum: sharedMemory.maximum,
              shared: true
            })
          }
        };
      }
      
      // Try streaming instantiation first
      if (WebAssembly.instantiateStreaming) {
        try {
          const result = await WebAssembly.instantiateStreaming(fetch(moduleUrl), finalImportObject);
          self.postMessage({ id, success: true, module: result.module, instance: result.instance, simdSupported });
          return;
        } catch (err) {
          console.warn('Streaming instantiation failed, falling back to regular instantiation:', err);
        }
      }
      
      // Fall back to regular instantiation
      const response = await fetch(moduleUrl);
      const buffer = await response.arrayBuffer();
      const result = await WebAssembly.instantiate(buffer, finalImportObject);
      self.postMessage({ id, success: true, module: result.module, instance: result.instance, simdSupported });
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
 * Load a WebAssembly module with combined optimizations
 * @param url URL of the WebAssembly module
 * @param options Options for loading the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module and instance
 */
export async function loadWasmModuleWithCombinedOptimizations(
  url: string,
  options?: {
    simdUrl?: string;
    importObject?: WebAssembly.Imports;
    sharedMemory?: {
      initial: number;
      maximum?: number;
    };
  }
): Promise<{
  module: WebAssembly.Module;
  instance: WebAssembly.Instance;
  optimizations: {
    webWorker: boolean;
    streaming: boolean;
    simd: boolean;
    sharedMemory: boolean;
  };
}> {
  // Create a cache key
  const cacheKey = `${url}:${options?.simdUrl || ''}:${JSON.stringify(options?.importObject)}:${JSON.stringify(options?.sharedMemory)}`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module with combined optimizations: ${url}`);
    const startTime = performance.now();

    // Check which optimizations are supported
    const webWorkerSupported = isWebWorkerSupported();
    const streamingSupported = isStreamingSupported();
    const simdSupported = await isSimdSupported();
    const sharedMemorySupported = isSharedMemorySupported();

    // Log supported optimizations
    console.log(`Supported optimizations: Web Worker: ${webWorkerSupported}, Streaming: ${streamingSupported}, SIMD: ${simdSupported}, Shared Memory: ${sharedMemorySupported}`);

    // Create shared memory buffer if supported
    const sharedMemoryBuffer = sharedMemorySupported && options?.sharedMemory ? {
      initial: options.sharedMemory.initial,
      maximum: options.sharedMemory.maximum,
      buffer: new SharedArrayBuffer(options.sharedMemory.initial * 64 * 1024) // 64KB pages
    } : undefined;

    // Use Web Worker if supported
    if (webWorkerSupported) {
      // Create a promise that will be resolved when the worker completes
      const modulePromise = new Promise<{
        module: WebAssembly.Module;
        instance: WebAssembly.Instance;
        optimizations: {
          webWorker: boolean;
          streaming: boolean;
          simd: boolean;
          sharedMemory: boolean;
        };
      }>((resolve, reject) => {
        try {
          // Create a unique ID for this request
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create a Web Worker
          const worker = createWorker(workerScript);

          // Handle messages from the worker
          worker.onmessage = (e) => {
            const { id: responseId, success, module, instance, error, simdSupported } = e.data;

            // Check if this is the response we're waiting for
            if (responseId !== id) {
              return;
            }

            // Terminate the worker
            worker.terminate();

            if (success) {
              // Log the loading time
              const endTime = performance.now();
              console.log(`WebAssembly module loaded in ${endTime - startTime}ms with optimizations: Web Worker: ${webWorkerSupported}, Streaming: ${streamingSupported}, SIMD: ${simdSupported}, Shared Memory: ${sharedMemorySupported}`);

              // Resolve the promise
              resolve({
                module,
                instance,
                optimizations: {
                  webWorker: webWorkerSupported,
                  streaming: streamingSupported,
                  simd: simdSupported,
                  sharedMemory: sharedMemorySupported,
                },
              });
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
          worker.postMessage({
            id,
            url,
            simdUrl: options?.simdUrl,
            importObject: options?.importObject,
            sharedMemory: sharedMemoryBuffer,
          });
        } catch (error) {
          // Reject the promise
          reject(error);
        }
      });

      // Store the promise in the cache
      wasmModuleCache[cacheKey] = modulePromise;

      // Wait for the module to load
      return await modulePromise;
    } else {
      // Use streaming instantiation if supported
      let modulePromise: Promise<{
        module: WebAssembly.Module;
        instance: WebAssembly.Instance;
        optimizations: {
          webWorker: boolean;
          streaming: boolean;
          simd: boolean;
          sharedMemory: boolean;
        };
      }>;

      // Use the appropriate URL based on SIMD support
      const moduleUrl = simdSupported && options?.simdUrl ? options.simdUrl : url;

      // Create import object with shared memory if supported
      let finalImportObject = options?.importObject || {};
      if (sharedMemorySupported && options?.sharedMemory) {
        finalImportObject = {
          ...finalImportObject,
          env: {
            ...finalImportObject.env,
            memory: new WebAssembly.Memory({
              initial: options.sharedMemory.initial,
              maximum: options.sharedMemory.maximum,
              shared: true
            })
          }
        };
      }

      if (streamingSupported) {
        try {
          const streamingPromise = WebAssembly.instantiateStreaming(fetch(moduleUrl), finalImportObject);
          modulePromise = streamingPromise.then((result) => ({
            module: result.module,
            instance: result.instance,
            optimizations: {
              webWorker: webWorkerSupported,
              streaming: streamingSupported,
              simd: simdSupported,
              sharedMemory: sharedMemorySupported,
            },
          }));
        } catch (error) {
          console.warn('Streaming instantiation failed, falling back to regular instantiation:', error);
          const response = await fetch(moduleUrl);
          const buffer = await response.arrayBuffer();
          const regularPromise = WebAssembly.instantiate(buffer, finalImportObject);
          modulePromise = regularPromise.then((result) => ({
            module: result.module,
            instance: result.instance,
            optimizations: {
              webWorker: webWorkerSupported,
              streaming: false,
              simd: simdSupported,
              sharedMemory: sharedMemorySupported,
            },
          }));
        }
      } else {
        const response = await fetch(moduleUrl);
        const buffer = await response.arrayBuffer();
        const regularPromise = WebAssembly.instantiate(buffer, finalImportObject);
        modulePromise = regularPromise.then((result) => ({
          module: result.module,
          instance: result.instance,
          optimizations: {
            webWorker: webWorkerSupported,
            streaming: false,
            simd: simdSupported,
            sharedMemory: sharedMemorySupported,
          },
        }));
      }

      // Store the promise in the cache
      wasmModuleCache[cacheKey] = modulePromise;

      // Wait for the module to load
      const result = await modulePromise;

      // Log the loading time
      const endTime = performance.now();
      console.log(`WebAssembly module loaded in ${endTime - startTime}ms with optimizations: Web Worker: ${webWorkerSupported}, Streaming: ${streamingSupported}, SIMD: ${simdSupported}, Shared Memory: ${sharedMemorySupported}`);

      return result;
    }
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module with combined optimizations: ${url}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module with combined optimizations
 * @param url URL of the WebAssembly module
 * @param options Options for loading the WebAssembly module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleWithCombinedOptimizations(
  url: string,
  options?: {
    simdUrl?: string;
    importObject?: WebAssembly.Imports;
    sharedMemory?: {
      initial: number;
      maximum?: number;
    };
  }
): Promise<void> {
  try {
    await loadWasmModuleWithCombinedOptimizations(url, options);
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
 * @param options Options for loading the WebAssembly module
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(
  url: string,
  options?: {
    simdUrl?: string;
    importObject?: WebAssembly.Imports;
    sharedMemory?: {
      initial: number;
      maximum?: number;
    };
  }
): boolean {
  const cacheKey = `${url}:${options?.simdUrl || ''}:${JSON.stringify(options?.importObject)}:${JSON.stringify(options?.sharedMemory)}`;
  return wasmModuleCache[cacheKey] !== undefined;
}