/**
 * darkswap_wasm_loader.d.ts - TypeScript type definitions for the DarkSwap WebAssembly module loader
 */

import * as darkswap from './darkswap_wasm';

/**
 * Load the DarkSwap WebAssembly module with streaming compilation
 * @param url - URL of the WebAssembly module
 * @returns Promise that resolves to the DarkSwap module
 */
export function loadDarkSwapWasm(url?: string): Promise<typeof darkswap>;

/**
 * Preload the DarkSwap WebAssembly module
 * @param url - URL of the WebAssembly module
 * @returns Promise that resolves when the module is preloaded
 */
export function preloadDarkSwapWasm(url?: string): void;

/**
 * Initialization options for the DarkSwap WebAssembly module
 */
export interface InitOptions {
  /**
   * Initial memory size in pages (64KB per page)
   * @default 16 (1MB)
   */
  initialMemory?: number;
  
  /**
   * Maximum memory size in pages (64KB per page)
   * @default 256 (16MB)
   */
  maximumMemory?: number;
  
  /**
   * Whether to use shared memory
   * @default false
   */
  sharedMemory?: boolean;
}

/**
 * Initialize the DarkSwap WebAssembly module with memory management optimizations
 * @param options - Initialization options
 * @returns Promise that resolves to the DarkSwap module
 */
export function initDarkSwapWasm(options?: InitOptions): Promise<typeof darkswap>;

/**
 * Default export
 */
declare const _default: {
  loadDarkSwapWasm: typeof loadDarkSwapWasm;
  preloadDarkSwapWasm: typeof preloadDarkSwapWasm;
  initDarkSwapWasm: typeof initDarkSwapWasm;
};

export default _default;