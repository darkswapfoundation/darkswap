/**
 * WasmMemoryManager.ts - WebAssembly memory manager
 * 
 * This file provides utilities for managing WebAssembly memory usage.
 */

/**
 * Memory allocation
 */
interface MemoryAllocation {
  /**
   * Pointer
   */
  ptr: number;
  
  /**
   * Size
   */
  size: number;
  
  /**
   * Allocation ID
   */
  id: string;
  
  /**
   * Allocation timestamp
   */
  timestamp: number;
  
  /**
   * Whether the allocation is freed
   */
  freed: boolean;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  /**
   * Total allocated memory in bytes
   */
  totalAllocated: number;
  
  /**
   * Peak memory usage in bytes
   */
  peakMemoryUsage: number;
  
  /**
   * Number of allocations
   */
  allocations: number;
  
  /**
   * Memory size in bytes
   */
  memorySize: number;
}

/**
 * WebAssembly memory manager options
 */
export interface WasmMemoryManagerOptions {
  /**
   * Initial memory size in pages (64KB per page)
   */
  initialPages?: number;
  
  /**
   * Maximum memory size in pages (64KB per page)
   */
  maximumPages?: number;
  
  /**
   * Whether to track allocations
   */
  trackAllocations?: boolean;
  
  /**
   * Whether to track memory statistics
   */
  trackStats?: boolean;
  
  /**
   * Whether to enable memory growth
   */
  enableGrowth?: boolean;
}

/**
 * WebAssembly memory manager
 * 
 * This class provides utilities for managing WebAssembly memory usage.
 */
export class WasmMemoryManager {
  /**
   * Default options
   */
  private static readonly DEFAULT_OPTIONS: WasmMemoryManagerOptions = {
    initialPages: 16,
    maximumPages: 256,
    trackAllocations: true,
    trackStats: true,
    enableGrowth: true,
  };
  
  /**
   * WebAssembly memory
   */
  private memory: WebAssembly.Memory;
  
  /**
   * Memory view
   */
  private view: DataView;
  
  /**
   * Memory allocations
   */
  private allocations: Map<number, MemoryAllocation> = new Map();
  
  /**
   * Free list
   */
  private freeList: { ptr: number; size: number }[] = [];
  
  /**
   * Total allocated memory in bytes
   */
  private totalAllocated: number = 0;
  
  /**
   * Peak memory usage in bytes
   */
  private peakMemoryUsage: number = 0;
  
  /**
   * Number of allocations
   */
  private allocationCount: number = 0;
  
  /**
   * Options
   */
  private options: WasmMemoryManagerOptions;
  
  /**
   * Constructor
   * @param options - WebAssembly memory manager options
   */
  constructor(options: WasmMemoryManagerOptions = {}) {
    this.options = {
      ...WasmMemoryManager.DEFAULT_OPTIONS,
      ...options,
    };
    
    // Create memory
    this.memory = new WebAssembly.Memory({
      initial: this.options.initialPages || WasmMemoryManager.DEFAULT_OPTIONS.initialPages!,
      maximum: this.options.maximumPages || WasmMemoryManager.DEFAULT_OPTIONS.maximumPages!,
    });
    
    // Create view
    this.view = new DataView(this.memory.buffer);
  }
  
  /**
   * Get memory
   * @returns WebAssembly memory
   */
  getMemory(): WebAssembly.Memory {
    return this.memory;
  }
  
  /**
   * Get memory buffer
   * @returns Memory buffer
   */
  getBuffer(): ArrayBuffer {
    return this.memory.buffer;
  }
  
  /**
   * Get memory view
   * @returns Memory view
   */
  getView(): DataView {
    return this.view;
  }
  
  /**
   * Get memory size in bytes
   * @returns Memory size in bytes
   */
  getMemorySize(): number {
    return this.memory.buffer.byteLength;
  }
  
  /**
   * Get memory size in pages
   * @returns Memory size in pages
   */
  getMemorySizeInPages(): number {
    return this.memory.buffer.byteLength / 65536;
  }
  
  /**
   * Grow memory
   * @param pages - Number of pages to grow
   * @returns Previous memory size in pages
   */
  growMemory(pages: number): number {
    // Check if growth is enabled
    if (!this.options.enableGrowth) {
      throw new Error('Memory growth is disabled');
    }
    
    // Grow memory
    const previousPages = this.memory.grow(pages);
    
    // Update view
    this.view = new DataView(this.memory.buffer);
    
    return previousPages;
  }
  
  /**
   * Allocate memory
   * @param size - Size in bytes
   * @returns Pointer to allocated memory
   */
  allocate(size: number): number {
    // Check if size is valid
    if (size <= 0) {
      throw new Error('Invalid allocation size');
    }
    
    // Align size to 8 bytes
    size = Math.ceil(size / 8) * 8;
    
    // Try to find a free block
    let bestFitIndex = -1;
    let bestFitSize = Number.MAX_SAFE_INTEGER;
    
    for (let i = 0; i < this.freeList.length; i++) {
      const block = this.freeList[i];
      
      if (block.size >= size && block.size < bestFitSize) {
        bestFitIndex = i;
        bestFitSize = block.size;
      }
    }
    
    // Check if a free block was found
    if (bestFitIndex !== -1) {
      // Get free block
      const block = this.freeList[bestFitIndex];
      
      // Remove block from free list
      this.freeList.splice(bestFitIndex, 1);
      
      // Check if block is larger than needed
      if (block.size > size) {
        // Add remaining space to free list
        this.freeList.push({
          ptr: block.ptr + size,
          size: block.size - size,
        });
      }
      
      // Track allocation
      if (this.options.trackAllocations) {
        this.trackAllocation(block.ptr, size);
      }
      
      return block.ptr;
    }
    
    // Allocate at the end of memory
    const ptr = this.getMemorySize();
    
    // Check if memory needs to grow
    const requiredSize = ptr + size;
    const currentSize = this.getMemorySize();
    
    if (requiredSize > currentSize) {
      // Calculate required pages
      const requiredPages = Math.ceil((requiredSize - currentSize) / 65536);
      
      // Grow memory
      this.growMemory(requiredPages);
    }
    
    // Track allocation
    if (this.options.trackAllocations) {
      this.trackAllocation(ptr, size);
    }
    
    return ptr;
  }
  
  /**
   * Free memory
   * @param ptr - Pointer to allocated memory
   */
  free(ptr: number): void {
    // Check if pointer is valid
    if (ptr < 0 || ptr >= this.getMemorySize()) {
      throw new Error('Invalid pointer');
    }
    
    // Check if allocation is tracked
    if (this.options.trackAllocations) {
      // Get allocation
      const allocation = this.allocations.get(ptr);
      
      // Check if allocation exists
      if (!allocation) {
        throw new Error('Invalid pointer');
      }
      
      // Check if allocation is already freed
      if (allocation.freed) {
        throw new Error('Double free');
      }
      
      // Mark allocation as freed
      allocation.freed = true;
      
      // Update total allocated memory
      this.totalAllocated -= allocation.size;
      
      // Add to free list
      this.freeList.push({
        ptr: allocation.ptr,
        size: allocation.size,
      });
      
      // Merge adjacent free blocks
      this.mergeFreeBlocks();
    } else {
      throw new Error('Allocation tracking is disabled');
    }
  }
  
  /**
   * Track allocation
   * @param ptr - Pointer to allocated memory
   * @param size - Size in bytes
   */
  private trackAllocation(ptr: number, size: number): void {
    // Create allocation
    const allocation: MemoryAllocation = {
      ptr,
      size,
      id: `alloc-${this.allocationCount++}`,
      timestamp: Date.now(),
      freed: false,
    };
    
    // Add to allocations
    this.allocations.set(ptr, allocation);
    
    // Update total allocated memory
    this.totalAllocated += size;
    
    // Update peak memory usage
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, this.totalAllocated);
  }
  
  /**
   * Merge adjacent free blocks
   */
  private mergeFreeBlocks(): void {
    // Sort free list by pointer
    this.freeList.sort((a, b) => a.ptr - b.ptr);
    
    // Merge adjacent blocks
    for (let i = 0; i < this.freeList.length - 1; i++) {
      const current = this.freeList[i];
      const next = this.freeList[i + 1];
      
      if (current.ptr + current.size === next.ptr) {
        // Merge blocks
        current.size += next.size;
        
        // Remove next block
        this.freeList.splice(i + 1, 1);
        
        // Decrement index to check for more merges
        i--;
      }
    }
  }
  
  /**
   * Get memory statistics
   * @returns Memory statistics
   */
  getStats(): MemoryStats {
    return {
      totalAllocated: this.totalAllocated,
      peakMemoryUsage: this.peakMemoryUsage,
      allocations: this.allocationCount,
      memorySize: this.getMemorySize(),
    };
  }
  
  /**
   * Reset memory manager
   */
  reset(): void {
    // Clear allocations
    this.allocations.clear();
    
    // Clear free list
    this.freeList = [];
    
    // Reset statistics
    this.totalAllocated = 0;
    this.peakMemoryUsage = 0;
    this.allocationCount = 0;
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getUint8Array(ptr: number, length: number): Uint8Array {
    return new Uint8Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getInt8Array(ptr: number, length: number): Int8Array {
    return new Int8Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getUint16Array(ptr: number, length: number): Uint16Array {
    return new Uint16Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getInt16Array(ptr: number, length: number): Int16Array {
    return new Int16Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getUint32Array(ptr: number, length: number): Uint32Array {
    return new Uint32Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getInt32Array(ptr: number, length: number): Int32Array {
    return new Int32Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getFloat32Array(ptr: number, length: number): Float32Array {
    return new Float32Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Create a typed array view of memory
   * @param ptr - Pointer to memory
   * @param length - Length of array
   * @returns Typed array view
   */
  getFloat64Array(ptr: number, length: number): Float64Array {
    return new Float64Array(this.memory.buffer, ptr, length);
  }
  
  /**
   * Write a string to memory
   * @param str - String to write
   * @returns Pointer to string in memory
   */
  writeString(str: string): number {
    // Encode string
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    
    // Allocate memory
    const ptr = this.allocate(bytes.length + 1);
    
    // Write string
    const view = this.getUint8Array(ptr, bytes.length + 1);
    view.set(bytes);
    view[bytes.length] = 0; // Null terminator
    
    return ptr;
  }
  
  /**
   * Read a string from memory
   * @param ptr - Pointer to string in memory
   * @returns String
   */
  readString(ptr: number): string {
    // Find null terminator
    let end = ptr;
    while (this.view.getUint8(end) !== 0) {
      end++;
    }
    
    // Read string
    const bytes = this.getUint8Array(ptr, end - ptr);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
}

/**
 * Default export
 */
export default WasmMemoryManager;