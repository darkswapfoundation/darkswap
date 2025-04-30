/**
 * darkswap_wasm_memory.d.ts - TypeScript type definitions for memory management utilities
 */

/**
 * Memory manager for the DarkSwap WebAssembly module
 */
export class DarkSwapMemoryManager {
  /**
   * Create a new memory manager
   * @param memory - WebAssembly memory
   * @param exports - WebAssembly exports
   */
  constructor(memory: WebAssembly.Memory, exports: any);
  
  /**
   * WebAssembly memory
   */
  memory: WebAssembly.Memory;
  
  /**
   * WebAssembly exports
   */
  exports: any;
  
  /**
   * Map of allocations (pointer -> size)
   */
  allocations: Map<number, number>;
  
  /**
   * Total allocated memory in bytes
   */
  totalAllocated: number;
  
  /**
   * Peak memory usage in bytes
   */
  peakMemoryUsage: number;
  
  /**
   * Allocate memory
   * @param size - Size in bytes
   * @returns Pointer to allocated memory
   */
  allocate(size: number): number;
  
  /**
   * Free memory
   * @param ptr - Pointer to allocated memory
   */
  free(ptr: number): void;
  
  /**
   * Get memory usage statistics
   * @returns Memory usage statistics
   */
  getMemoryStats(): {
    totalAllocated: number;
    peakMemoryUsage: number;
    allocations: number;
    memorySize: number;
  };
  
  /**
   * Create a typed array view of a region of memory
   * @param ptr - Pointer to memory
   * @param size - Size in bytes
   * @returns Typed array view
   */
  getUint8Array(ptr: number, size: number): Uint8Array;
  
  /**
   * Create a string from a region of memory
   * @param ptr - Pointer to memory
   * @param size - Size in bytes
   * @returns String
   */
  getString(ptr: number, size: number): string;
  
  /**
   * Create a pointer to a string
   * @param str - String
   * @returns Object with pointer and size
   */
  createString(str: string): { ptr: number; size: number };
}

/**
 * Create a memory manager for the DarkSwap WebAssembly module
 * @param memory - WebAssembly memory
 * @param exports - WebAssembly exports
 * @returns Memory manager
 */
export function createMemoryManager(memory: WebAssembly.Memory, exports: any): DarkSwapMemoryManager;

/**
 * Default export
 */
declare const _default: {
  DarkSwapMemoryManager: typeof DarkSwapMemoryManager;
  createMemoryManager: typeof createMemoryManager;
};

export default _default;