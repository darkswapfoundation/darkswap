/**
 * WebAssembly module loader
 * 
 * This module provides utilities for lazy loading and caching WebAssembly modules.
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
 * Load a WebAssembly module
 * @param modulePath Path to the WebAssembly module
 * @param importName Import name for the module
 * @returns Promise that resolves to the WebAssembly module
 */
export async function loadWasmModule(modulePath: string, importName: string): Promise<any> {
  // Check if the module is already in the cache
  const cacheKey = `${importName}:${modulePath}`;
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey];
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module: ${importName} from ${modulePath}`);
    const startTime = performance.now();

    // Dynamically import the module
    const modulePromise = import(/* webpackIgnore: true */ importName).then(module => {
      return module.default(modulePath);
    });

    // Store the module promise in the cache
    wasmModuleCache[cacheKey] = modulePromise;

    // Wait for the module to load
    const module = await modulePromise;

    // Log the loading time
    const endTime = performance.now();
    console.log(`WebAssembly module loaded in ${endTime - startTime}ms`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module: ${importName} from ${modulePath}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module
 * @param modulePath Path to the WebAssembly module
 * @param importName Import name for the module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModule(modulePath: string, importName: string): Promise<void> {
  try {
    await loadWasmModule(modulePath, importName);
    console.log(`WebAssembly module preloaded: ${importName} from ${modulePath}`);
  } catch (error) {
    console.error(`Failed to preload WebAssembly module: ${importName} from ${modulePath}`, error);
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
 * @param modulePath Path to the WebAssembly module
 * @param importName Import name for the module
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(modulePath: string, importName: string): boolean {
  const cacheKey = `${importName}:${modulePath}`;
  return wasmModuleCache[cacheKey] !== undefined;
}