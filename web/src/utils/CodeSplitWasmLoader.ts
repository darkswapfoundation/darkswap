/**
 * Code Split WebAssembly module loader
 * 
 * This module provides utilities for loading WebAssembly modules using code splitting,
 * which can significantly improve the initial page load time by splitting large WebAssembly
 * modules into smaller chunks that are loaded on demand.
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
 * Load a WebAssembly module using code splitting
 * @param baseUrl Base URL of the WebAssembly module
 * @param chunkCount Number of chunks
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves to the WebAssembly module
 */
export async function loadWasmModuleWithCodeSplitting(
  baseUrl: string,
  chunkCount: number,
  importObject?: WebAssembly.Imports
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  // Create a cache key
  const cacheKey = `${baseUrl}:${chunkCount}:${JSON.stringify(importObject)}`;

  // Check if the module is already in the cache
  if (wasmModuleCache[cacheKey] !== undefined) {
    return wasmModuleCache[cacheKey]!;
  }

  // Load the module
  try {
    console.log(`Loading WebAssembly module with code splitting: ${baseUrl}`);
    const startTime = performance.now();

    // Load the manifest
    const manifestResponse = await fetch(`${baseUrl}/manifest.json`);
    const manifest = await manifestResponse.json();

    // Load the chunks in parallel
    const chunkPromises: Promise<ArrayBuffer>[] = [];
    for (let i = 0; i < chunkCount; i++) {
      chunkPromises.push(loadWasmChunk(`${baseUrl}/chunk_${i}.wasm`));
    }
    const chunks = await Promise.all(chunkPromises);

    // Combine the chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
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
    console.log(`WebAssembly module loaded in ${endTime - startTime}ms`);

    return module;
  } catch (error) {
    // Remove the failed module from the cache
    delete wasmModuleCache[cacheKey];
    
    console.error(`Failed to load WebAssembly module: ${baseUrl}`, error);
    throw error;
  }
}

/**
 * Preload a WebAssembly module using code splitting
 * @param baseUrl Base URL of the WebAssembly module
 * @param chunkCount Number of chunks
 * @param importObject Import object for the WebAssembly module
 * @returns Promise that resolves when the module is loaded
 */
export async function preloadWasmModuleWithCodeSplitting(
  baseUrl: string,
  chunkCount: number,
  importObject?: WebAssembly.Imports
): Promise<void> {
  try {
    await loadWasmModuleWithCodeSplitting(baseUrl, chunkCount, importObject);
    console.log(`WebAssembly module preloaded: ${baseUrl}`);
  } catch (error) {
    console.error(`Failed to preload WebAssembly module: ${baseUrl}`, error);
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
 * @param baseUrl Base URL of the WebAssembly module
 * @param chunkCount Number of chunks
 * @param importObject Import object for the WebAssembly module
 * @returns Whether the module is in the cache
 */
export function isWasmModuleCached(
  baseUrl: string,
  chunkCount: number,
  importObject?: WebAssembly.Imports
): boolean {
  const cacheKey = `${baseUrl}:${chunkCount}:${JSON.stringify(importObject)}`;
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
 * Split a WebAssembly module into chunks
 * @param wasmBuffer WebAssembly module as an ArrayBuffer
 * @param chunkSize Size of each chunk in bytes
 * @returns Array of chunks as ArrayBuffers
 */
export function splitWasmModule(wasmBuffer: ArrayBuffer, chunkSize: number): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  const wasmView = new Uint8Array(wasmBuffer);
  
  for (let i = 0; i < wasmView.length; i += chunkSize) {
    const chunkView = wasmView.slice(i, i + chunkSize);
    const chunkBuffer = chunkView.buffer.slice(chunkView.byteOffset, chunkView.byteOffset + chunkView.byteLength);
    chunks.push(chunkBuffer);
  }
  
  return chunks;
}

/**
 * Create a manifest for a WebAssembly module
 * @param wasmBuffer WebAssembly module as an ArrayBuffer
 * @param chunkSize Size of each chunk in bytes
 * @returns Manifest object
 */
export function createWasmManifest(wasmBuffer: ArrayBuffer, chunkSize: number): any {
  const chunks = splitWasmModule(wasmBuffer, chunkSize);
  
  return {
    totalSize: wasmBuffer.byteLength,
    chunkSize,
    chunkCount: chunks.length,
    chunks: chunks.map((chunk, index) => ({
      index,
      size: chunk.byteLength,
      url: `chunk_${index}.wasm`,
    })),
  };
}