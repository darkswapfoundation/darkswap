/**
 * DarkSwapWasmModule.ts - WebAssembly module wrapper
 * 
 * This file provides a wrapper for the DarkSwap WebAssembly module with
 * optimizations for size, performance, and memory management.
 */

import {
  loadDarkSwapWasm,
  preloadDarkSwapWasm,
  initDarkSwapWasm,
  InitOptions,
} from '../wasm-bindings/darkswap_wasm_loader';
import { createMemoryManager, DarkSwapMemoryManager } from '../wasm-bindings/darkswap_wasm_memory';
import * as darkswap from '../wasm-bindings/darkswap_wasm';
import { WasmError, ErrorCode } from '../utils/ErrorHandling';

/**
 * DarkSwap WebAssembly module wrapper
 */
export class DarkSwapWasmModule {
  /**
   * WebAssembly module
   */
  private module: typeof darkswap | null = null;
  
  /**
   * Memory manager
   */
  private memoryManager: DarkSwapMemoryManager | null = null;
  
  /**
   * Whether the module is initialized
   */
  private _isInitialized = false;
  
  /**
   * Whether the module is initializing
   */
  private _isInitializing = false;
  
  /**
   * Get whether the module is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }
  
  /**
   * Get whether the module is initializing
   */
  get isInitializing(): boolean {
    return this._isInitializing;
  }
  
  /**
   * Create a new DarkSwap WebAssembly module wrapper
   */
  constructor() {
    // Preload the WebAssembly module
    preloadDarkSwapWasm();
  }
  
  /**
   * Initialize the WebAssembly module
   * @param options - Initialization options
   * @returns Promise that resolves when the module is initialized
   * @throws WasmError if initialization fails
   */
  async initialize(options: InitOptions = {}): Promise<void> {
    // Check if already initialized
    if (this._isInitialized) {
      throw new WasmError('WebAssembly module already initialized', ErrorCode.AlreadyInitialized);
    }
    
    // Check if already initializing
    if (this._isInitializing) {
      throw new WasmError('WebAssembly module already initializing', ErrorCode.AlreadyInitializing);
    }
    
    try {
      // Set initializing flag
      this._isInitializing = true;
      
      // Load the WebAssembly module
      this.module = await loadDarkSwapWasm();
      
      // Initialize the WebAssembly module
      await initDarkSwapWasm(options);
      
      // Create memory manager
      this.memoryManager = createMemoryManager(
        (this.module as any).__wbg_get_memory(),
        (this.module as any).__wbg_get_exports()
      );
      
      // Set initialized flag
      this._isInitialized = true;
    } catch (error) {
      // Throw WasmError
      throw new WasmError(
        `Failed to initialize WebAssembly module: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.WasmInitFailed,
        { originalError: error }
      );
    } finally {
      // Clear initializing flag
      this._isInitializing = false;
    }
  }
  
  /**
   * Shutdown the WebAssembly module
   * @returns Promise that resolves when the module is shut down
   * @throws WasmError if shutdown fails
   */
  async shutdown(): Promise<void> {
    // Check if initialized
    if (!this._isInitialized) {
      throw new WasmError('WebAssembly module not initialized', ErrorCode.NotInitialized);
    }
    
    try {
      // Clean up memory
      if (this.memoryManager) {
        // Free all allocations
        for (const [ptr] of this.memoryManager.allocations) {
          this.memoryManager.free(ptr);
        }
        
        // Clear memory manager
        this.memoryManager = null;
      }
      
      // Clear module
      this.module = null;
      
      // Clear initialized flag
      this._isInitialized = false;
    } catch (error) {
      // Throw WasmError
      throw new WasmError(
        `Failed to shutdown WebAssembly module: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.WasmShutdownFailed,
        { originalError: error }
      );
    }
  }
  
  /**
   * Get memory usage statistics
   * @returns Memory usage statistics
   * @throws WasmError if the module is not initialized
   */
  getMemoryStats(): {
    totalAllocated: number;
    peakMemoryUsage: number;
    allocations: number;
    memorySize: number;
  } {
    // Check if initialized
    if (!this._isInitialized || !this.memoryManager) {
      throw new WasmError('WebAssembly module not initialized', ErrorCode.NotInitialized);
    }
    
    return this.memoryManager.getMemoryStats();
  }
  
  /**
   * Get the WebAssembly module
   * @returns WebAssembly module
   * @throws WasmError if the module is not initialized
   */
  getModule(): typeof darkswap {
    // Check if initialized
    if (!this._isInitialized || !this.module) {
      throw new WasmError('WebAssembly module not initialized', ErrorCode.NotInitialized);
    }
    
    return this.module;
  }
  
  /**
   * Get the memory manager
   * @returns Memory manager
   * @throws WasmError if the module is not initialized
   */
  getMemoryManager(): DarkSwapMemoryManager {
    // Check if initialized
    if (!this._isInitialized || !this.memoryManager) {
      throw new WasmError('WebAssembly module not initialized', ErrorCode.NotInitialized);
    }
    
    return this.memoryManager;
  }
}

/**
 * Default export
 */
export default DarkSwapWasmModule;