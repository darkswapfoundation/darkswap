/**
 * darkswap_wasm_loader.js - Loader for the DarkSwap WebAssembly module
 * 
 * This file provides utilities for loading the DarkSwap WebAssembly module
 * with streaming compilation and other optimizations.
 */

import * as darkswap from './darkswap_wasm.js';

/**
 * Load the DarkSwap WebAssembly module with streaming compilation
 * @param {string} url - URL of the WebAssembly module
 * @returns {Promise<typeof darkswap>} - Promise that resolves to the DarkSwap module
 */
export async function loadDarkSwapWasm(url = 'darkswap_wasm_bg.wasm') {
  // Check if streaming compilation is supported
  if (WebAssembly.instantiateStreaming) {
    try {
      // Use streaming compilation
      const { instance, module } = await WebAssembly.instantiateStreaming(
        fetch(url),
        darkswap.__wbg_get_imports()
      );
      
      // Initialize the module
      darkswap.__wbg_init(instance, module);
      
      return darkswap;
    } catch (e) {
      console.warn('Streaming compilation failed, falling back to ArrayBuffer instantiation:', e);
    }
  }
  
  // Fall back to ArrayBuffer instantiation
  const response = await fetch(url);
  const bytes = await response.arrayBuffer();
  const { instance, module } = await WebAssembly.instantiate(bytes, darkswap.__wbg_get_imports());
  
  // Initialize the module
  darkswap.__wbg_init(instance, module);
  
  return darkswap;
}

/**
 * Preload the DarkSwap WebAssembly module
 * @param {string} url - URL of the WebAssembly module
 * @returns {Promise<void>} - Promise that resolves when the module is preloaded
 */
export function preloadDarkSwapWasm(url = 'darkswap_wasm_bg.wasm') {
  // Create a link element for preloading
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  link.type = 'application/wasm';
  
  // Add the link element to the head
  document.head.appendChild(link);
}

/**
 * Initialize the DarkSwap WebAssembly module with memory management optimizations
 * @param {Object} options - Initialization options
 * @param {number} options.initialMemory - Initial memory size in pages (64KB per page)
 * @param {number} options.maximumMemory - Maximum memory size in pages (64KB per page)
 * @param {boolean} options.sharedMemory - Whether to use shared memory
 * @returns {Promise<typeof darkswap>} - Promise that resolves to the DarkSwap module
 */
export async function initDarkSwapWasm(options = {}) {
  const {
    initialMemory = 16, // 1MB
    maximumMemory = 256, // 16MB
    sharedMemory = false,
  } = options;
  
  // Create memory
  const memory = new WebAssembly.Memory({
    initial: initialMemory,
    maximum: maximumMemory,
    shared: sharedMemory,
  });
  
  // Set memory
  darkswap.__wbg_set_memory(memory);
  
  return darkswap;
}

/**
 * Default export
 */
export default {
  loadDarkSwapWasm,
  preloadDarkSwapWasm,
  initDarkSwapWasm,
};