/**
 * darkswap_wasm_memory.js - Memory management utilities for the DarkSwap WebAssembly module
 * 
 * This file provides utilities for managing memory in the DarkSwap WebAssembly module.
 */

/**
 * Memory manager for the DarkSwap WebAssembly module
 */
export class DarkSwapMemoryManager {
  /**
   * Create a new memory manager
   * @param {WebAssembly.Memory} memory - WebAssembly memory
   * @param {Object} exports - WebAssembly exports
   */
  constructor(memory, exports) {
    this.memory = memory;
    this.exports = exports;
    this.allocations = new Map();
    this.totalAllocated = 0;
    this.peakMemoryUsage = 0;
  }
  
  /**
   * Allocate memory
   * @param {number} size - Size in bytes
   * @returns {number} - Pointer to allocated memory
   */
  allocate(size) {
    // Call the allocate function from the WebAssembly module
    const ptr = this.exports.__wbindgen_malloc(size);
    
    // Track allocation
    this.allocations.set(ptr, size);
    this.totalAllocated += size;
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, this.totalAllocated);
    
    return ptr;
  }
  
  /**
   * Free memory
   * @param {number} ptr - Pointer to allocated memory
   */
  free(ptr) {
    // Get allocation size
    const size = this.allocations.get(ptr);
    
    if (size === undefined) {
      throw new Error(`Attempt to free unallocated memory at ${ptr}`);
    }
    
    // Call the free function from the WebAssembly module
    this.exports.__wbindgen_free(ptr, size);
    
    // Track deallocation
    this.allocations.delete(ptr);
    this.totalAllocated -= size;
  }
  
  /**
   * Get memory usage statistics
   * @returns {Object} - Memory usage statistics
   */
  getMemoryStats() {
    return {
      totalAllocated: this.totalAllocated,
      peakMemoryUsage: this.peakMemoryUsage,
      allocations: this.allocations.size,
      memorySize: this.memory.buffer.byteLength,
    };
  }
  
  /**
   * Create a typed array view of a region of memory
   * @param {number} ptr - Pointer to memory
   * @param {number} size - Size in bytes
   * @returns {Uint8Array} - Typed array view
   */
  getUint8Array(ptr, size) {
    return new Uint8Array(this.memory.buffer, ptr, size);
  }
  
  /**
   * Create a string from a region of memory
   * @param {number} ptr - Pointer to memory
   * @param {number} size - Size in bytes
   * @returns {string} - String
   */
  getString(ptr, size) {
    const bytes = this.getUint8Array(ptr, size);
    return new TextDecoder().decode(bytes);
  }
  
  /**
   * Create a pointer to a string
   * @param {string} str - String
   * @returns {Object} - Object with pointer and size
   */
  createString(str) {
    const bytes = new TextEncoder().encode(str);
    const ptr = this.allocate(bytes.length);
    this.getUint8Array(ptr, bytes.length).set(bytes);
    return { ptr, size: bytes.length };
  }
}

/**
 * Create a memory manager for the DarkSwap WebAssembly module
 * @param {WebAssembly.Memory} memory - WebAssembly memory
 * @param {Object} exports - WebAssembly exports
 * @returns {DarkSwapMemoryManager} - Memory manager
 */
export function createMemoryManager(memory, exports) {
  return new DarkSwapMemoryManager(memory, exports);
}

/**
 * Default export
 */
export default {
  DarkSwapMemoryManager,
  createMemoryManager,
};