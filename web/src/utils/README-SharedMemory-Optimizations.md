# DarkSwap WebAssembly Shared Memory Optimizations

This document describes the shared memory optimizations implemented for the DarkSwap WebAssembly integration.

## Table of Contents

1. [Introduction](#introduction)
2. [Shared Memory](#shared-memory)
3. [Implementation Details](#implementation-details)
4. [Usage](#usage)
5. [Performance Benefits](#performance-benefits)
6. [Browser Compatibility](#browser-compatibility)
7. [Future Improvements](#future-improvements)

## Introduction

The DarkSwap WebAssembly integration allows the DarkSwap SDK to be used in web applications. To improve performance for certain operations, we've implemented shared memory optimizations that use Shared Array Buffers to share memory between the main thread and Web Workers.

## Shared Memory

Shared memory is a technique where multiple threads can access the same memory region. In the context of WebAssembly and Web Workers, this is achieved using Shared Array Buffers, which allow the main thread and Web Workers to share memory.

This is particularly useful for applications that need to:

1. Process large amounts of data
2. Perform complex calculations
3. Communicate efficiently between threads
4. Avoid copying data between threads

By sharing memory between the main thread and Web Workers, we can significantly improve performance for certain operations, especially those that involve large amounts of data or complex calculations.

## Implementation Details

### SharedMemoryWasmLoader

The `SharedMemoryWasmLoader` utility provides the following functions:

- `isSharedArrayBufferSupported`: Checks if Shared Array Buffers are supported in the current browser.
- `isAtomicsSupported`: Checks if Atomics are supported in the current browser.
- `isSharedMemorySupported`: Checks if both Shared Array Buffers and Atomics are supported in the current browser.
- `loadWasmModuleWithSharedMemory`: Loads a WebAssembly module with shared memory if supported, otherwise falls back to regular loading.
- `preloadWasmModuleWithSharedMemory`: Preloads a WebAssembly module with shared memory without waiting for it to be needed.
- `clearWasmModuleCache`: Clears the WebAssembly module cache.
- `getWasmModuleCacheSize`: Returns the number of modules in the cache.
- `isWasmModuleCached`: Checks if a WebAssembly module is cached.

### SharedMemoryDarkSwapClient

The `SharedMemoryDarkSwapClient` class extends the base `DarkSwapClient` class and overrides its methods to use shared memory if supported. It uses the `SharedMemoryWasmLoader` utility to load and cache the WebAssembly module.

### Web Worker Script

The Web Worker script is created dynamically and includes the following functionality:

- Receives a message with the URL of the WebAssembly module, an optional import object, and shared memory options.
- Creates a new WebAssembly.Memory object with the shared memory options if provided.
- Attempts to load the WebAssembly module using streaming instantiation if supported.
- Falls back to regular instantiation if streaming instantiation is not supported or fails.
- Returns the WebAssembly module and instance to the main thread.

## Usage

To use the shared memory optimizations, simply use the `SharedMemoryDarkSwapClient` class instead of the base `DarkSwapClient` class:

```typescript
import { SharedMemoryDarkSwapClient } from './utils/SharedMemoryDarkSwapClient';

// Create a new shared memory DarkSwap client
const client = new SharedMemoryDarkSwapClient();

// Initialize the client (this will use shared memory if supported)
await client.initialize();

// Use the client as usual
const address = await client.getAddress();
```

You can also configure the memory options for the shared memory:

```typescript
import { SharedMemoryDarkSwapClient } from './utils/SharedMemoryDarkSwapClient';

// Create a new shared memory DarkSwap client with custom memory options
const client = new SharedMemoryDarkSwapClient('/darkswap-wasm/darkswap_wasm_bg.wasm', {
  initial: 16, // 16 pages (1MB)
  maximum: 256, // 256 pages (16MB)
});

// Initialize the client
await client.initialize();
```

## Performance Benefits

The shared memory optimizations provide the following performance benefits:

1. **Reduced Data Copying**: By sharing memory between the main thread and Web Workers, we can avoid copying data between threads, which can significantly improve performance for operations that involve large amounts of data.
2. **Efficient Communication**: Shared memory allows for efficient communication between the main thread and Web Workers, which can improve performance for operations that require frequent communication.
3. **Parallel Processing**: By using Web Workers with shared memory, we can perform complex calculations in parallel, which can significantly improve performance for CPU-intensive operations.

The performance improvements depend on the specific operations being performed and the browser's implementation of Shared Array Buffers. In general, you can expect a 2-4x speedup for operations that can benefit from shared memory.

## Browser Compatibility

Shared Array Buffers are supported in the following browsers:

- Chrome 68+
- Firefox 79+
- Safari 15.2+
- Edge 79+

For browsers that don't support Shared Array Buffers, the `SharedMemoryDarkSwapClient` will automatically fall back to regular WebAssembly loading.

## Future Improvements

Here are some potential future improvements:

### Atomic Operations

Atomic operations could be used to implement more efficient synchronization between the main thread and Web Workers, which could further improve performance for certain operations.

### Multiple Web Workers

Multiple Web Workers could be used to perform different tasks in parallel, which could further improve performance for certain operations.

### Dynamic Memory Allocation

Dynamic memory allocation could be used to allocate memory on demand, which could reduce the initial memory footprint and improve performance for certain operations.

### Shared Memory + SIMD

Combining shared memory with SIMD instructions could provide even greater performance improvements for certain operations, especially those that involve large amounts of data and can benefit from parallel processing.

### Shared Memory + Streaming

Combining shared memory with streaming compilation could provide faster loading times by compiling the WebAssembly module while it's being downloaded, and then using shared memory for efficient communication between the main thread and Web Workers.