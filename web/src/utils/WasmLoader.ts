/**
 * WebAssembly loader utility for DarkSwap
 * 
 * This utility provides functions for loading and initializing WebAssembly modules.
 */

import { logger } from '../../../src/utils/logger';
import { createCache } from '../../../src/utils/cache';

/**
 * WebAssembly module cache
 */
const wasmCache = createCache<WebAssembly.Module>({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * WebAssembly instance cache
 */
const instanceCache = createCache<WebAssembly.Instance>({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * WebAssembly feature detection
 */
export const wasmFeatures = {
  /**
   * Whether WebAssembly is supported
   */
  supported: typeof WebAssembly !== 'undefined',
  
  /**
   * Whether streaming compilation is supported
   */
  streaming: typeof WebAssembly !== 'undefined' && typeof WebAssembly.instantiateStreaming === 'function',
  
  /**
   * Whether shared memory is supported
   */
  sharedMemory: typeof SharedArrayBuffer !== 'undefined',
  
  /**
   * Whether threads are supported
   */
  threads: typeof WebAssembly !== 'undefined' && typeof WebAssembly.Memory !== 'undefined' && typeof SharedArrayBuffer !== 'undefined',
  
  /**
   * Whether SIMD is supported
   */
  simd: false,
  
  /**
   * Whether bulk memory operations are supported
   */
  bulkMemory: false,
  
  /**
   * Whether reference types are supported
   */
  referenceTypes: false,
};

/**
 * Detect WebAssembly features
 */
export async function detectWasmFeatures(): Promise<void> {
  try {
    // Detect SIMD support
    const simdTest = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60,
      0x00, 0x01, 0x7b, 0x03, 0x02, 0x01, 0x00, 0x07, 0x08, 0x01, 0x04, 0x74,
      0x65, 0x73, 0x74, 0x00, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00, 0xfd, 0x0f,
      0x00, 0x00, 0x00, 0x00, 0x0b
    ]);
    
    await WebAssembly.validate(simdTest)
      .then((valid) => {
        wasmFeatures.simd = valid;
      })
      .catch(() => {
        wasmFeatures.simd = false;
      });
    
    // Detect bulk memory operations support
    const bulkMemoryTest = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x04, 0x01, 0x60,
      0x00, 0x00, 0x03, 0x02, 0x01, 0x00, 0x05, 0x03, 0x01, 0x00, 0x01, 0x07,
      0x08, 0x01, 0x04, 0x74, 0x65, 0x73, 0x74, 0x00, 0x00, 0x0a, 0x09, 0x01,
      0x07, 0x00, 0x41, 0x00, 0x41, 0x00, 0xfc, 0x08, 0x0b
    ]);
    
    await WebAssembly.validate(bulkMemoryTest)
      .then((valid) => {
        wasmFeatures.bulkMemory = valid;
      })
      .catch(() => {
        wasmFeatures.bulkMemory = false;
      });
    
    // Detect reference types support
    const referenceTypesTest = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x04, 0x01, 0x60,
      0x00, 0x00, 0x03, 0x02, 0x01, 0x00, 0x07, 0x08, 0x01, 0x04, 0x74, 0x65,
      0x73, 0x74, 0x00, 0x00, 0x0a, 0x05, 0x01, 0x03, 0x00, 0xd0, 0x0b
    ]);
    
    await WebAssembly.validate(referenceTypesTest)
      .then((valid) => {
        wasmFeatures.referenceTypes = valid;
      })
      .catch(() => {
        wasmFeatures.referenceTypes = false;
      });
    
    logger.debug('Detected WebAssembly features', { wasmFeatures });
  } catch (error) {
    logger.error('Failed to detect WebAssembly features', { error });
  }
}

/**
 * Load a WebAssembly module
 * 
 * @param url The URL of the WebAssembly module
 * @param imports The imports for the WebAssembly module
 * @returns The WebAssembly instance and exports
 */
export async function loadWasm<T = any>(
  url: string,
  imports: WebAssembly.Imports = {}
): Promise<{
  instance: WebAssembly.Instance;
  exports: T;
}> {
  try {
    // Check if WebAssembly is supported
    if (!wasmFeatures.supported) {
      throw new Error('WebAssembly is not supported in this browser');
    }
    
    // Check if the module is cached
    const cachedInstance = instanceCache.get(url);
    
    if (cachedInstance) {
      logger.debug('Using cached WebAssembly instance', { url });
      
      return {
        instance: cachedInstance,
        exports: cachedInstance.exports as unknown as T,
      };
    }
    
    // Load the module
    let instance: WebAssembly.Instance;
    
    if (wasmFeatures.streaming) {
      // Use streaming compilation
      logger.debug('Using streaming WebAssembly compilation', { url });
      
      const response = await fetch(url);
      const result = await WebAssembly.instantiateStreaming(response, imports);
      
      instance = result.instance;
    } else {
      // Use regular compilation
      logger.debug('Using regular WebAssembly compilation', { url });
      
      const response = await fetch(url);
      const bytes = await response.arrayBuffer();
      const result = await WebAssembly.instantiate(bytes, imports);
      
      instance = result.instance;
    }
    
    // Cache the instance
    instanceCache.set(url, instance);
    
    return {
      instance,
      exports: instance.exports as unknown as T,
    };
  } catch (error) {
    logger.error('Failed to load WebAssembly module', { error, url });
    
    throw error;
  }
}

/**
 * Compile a WebAssembly module
 * 
 * @param url The URL of the WebAssembly module
 * @returns The WebAssembly module
 */
export async function compileWasm(url: string): Promise<WebAssembly.Module> {
  try {
    // Check if WebAssembly is supported
    if (!wasmFeatures.supported) {
      throw new Error('WebAssembly is not supported in this browser');
    }
    
    // Check if the module is cached
    const cachedModule = wasmCache.get(url);
    
    if (cachedModule) {
      logger.debug('Using cached WebAssembly module', { url });
      
      return cachedModule;
    }
    
    // Compile the module
    let module: WebAssembly.Module;
    
    if (wasmFeatures.streaming) {
      // Use streaming compilation
      logger.debug('Using streaming WebAssembly compilation', { url });
      
      const response = await fetch(url);
      module = await WebAssembly.compileStreaming(response);
    } else {
      // Use regular compilation
      logger.debug('Using regular WebAssembly compilation', { url });
      
      const response = await fetch(url);
      const bytes = await response.arrayBuffer();
      module = await WebAssembly.compile(bytes);
    }
    
    // Cache the module
    wasmCache.set(url, module);
    
    return module;
  } catch (error) {
    logger.error('Failed to compile WebAssembly module', { error, url });
    
    throw error;
  }
}

/**
 * Instantiate a WebAssembly module
 * 
 * @param moduleOrUrl The WebAssembly module or URL
 * @param imports The imports for the WebAssembly module
 * @returns The WebAssembly instance and exports
 */
export async function instantiateWasm<T = any>(
  moduleOrUrl: WebAssembly.Module | string,
  imports: WebAssembly.Imports = {}
): Promise<{
  instance: WebAssembly.Instance;
  exports: T;
}> {
  try {
    // Check if WebAssembly is supported
    if (!wasmFeatures.supported) {
      throw new Error('WebAssembly is not supported in this browser');
    }
    
    // If moduleOrUrl is a string, compile the module
    const module = typeof moduleOrUrl === 'string'
      ? await compileWasm(moduleOrUrl)
      : moduleOrUrl;
    
    // Instantiate the module
    const instance = await WebAssembly.instantiate(module, imports);
    
    // Cache the instance if moduleOrUrl is a string
    if (typeof moduleOrUrl === 'string') {
      instanceCache.set(moduleOrUrl, instance);
    }
    
    return {
      instance,
      exports: instance.exports as unknown as T,
    };
  } catch (error) {
    logger.error('Failed to instantiate WebAssembly module', { error });
    
    throw error;
  }
}

/**
 * Create a WebAssembly memory
 * 
 * @param initial The initial memory size in pages (64KB per page)
 * @param maximum The maximum memory size in pages (64KB per page)
 * @param shared Whether to use shared memory
 * @returns The WebAssembly memory
 */
export function createWasmMemory(
  initial: number,
  maximum?: number,
  shared: boolean = false
): WebAssembly.Memory {
  try {
    // Check if shared memory is supported
    if (shared && !wasmFeatures.sharedMemory) {
      logger.warn('Shared memory is not supported, falling back to regular memory');
      shared = false;
    }
    
    // Create the memory
    return new WebAssembly.Memory({
      initial,
      maximum,
      shared,
    });
  } catch (error) {
    logger.error('Failed to create WebAssembly memory', { error, initial, maximum, shared });
    
    throw error;
  }
}

/**
 * Create a WebAssembly table
 * 
 * @param initial The initial table size
 * @param maximum The maximum table size
 * @returns The WebAssembly table
 */
export function createWasmTable(
  initial: number,
  maximum?: number
): WebAssembly.Table {
  try {
    // Create the table
    return new WebAssembly.Table({
      initial,
      maximum,
      element: 'anyfunc',
    });
  } catch (error) {
    logger.error('Failed to create WebAssembly table', { error, initial, maximum });
    
    throw error;
  }
}

// Detect WebAssembly features
detectWasmFeatures();

export default {
  wasmFeatures,
  detectWasmFeatures,
  loadWasm,
  compileWasm,
  instantiateWasm,
  createWasmMemory,
  createWasmTable,
};