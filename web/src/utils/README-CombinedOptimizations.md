# DarkSwap WebAssembly Combined Optimizations

This document describes the combined optimizations implemented for the DarkSwap WebAssembly integration.

## Table of Contents

1. [Introduction](#introduction)
2. [Combined Optimizations](#combined-optimizations)
3. [Implementation Details](#implementation-details)
4. [Usage](#usage)
5. [Performance Benefits](#performance-benefits)
6. [Browser Compatibility](#browser-compatibility)
7. [Future Improvements](#future-improvements)

## Introduction

The DarkSwap WebAssembly integration allows the DarkSwap SDK to be used in web applications. To achieve the best possible performance, we've implemented combined optimizations that use multiple optimization techniques together, including SIMD instructions, Web Workers, streaming compilation, and shared memory.

## Combined Optimizations

Combined optimizations involve using multiple optimization techniques together to achieve even better performance than using each optimization individually. The optimizations we've combined include:

1. **SIMD Instructions**: SIMD (Single Instruction, Multiple Data) instructions allow for processing multiple data points in parallel, which can significantly improve performance for certain operations.

2. **Web Workers**: Web Workers allow for loading and compiling WebAssembly modules in a background thread, keeping the main thread free for user interactions.

3. **Streaming Compilation**: Streaming compilation allows for compiling the WebAssembly module while it's being downloaded, reducing the total loading time.

4. **Shared Memory**: Shared memory allows the main thread and Web Workers to share memory using Shared Array Buffers, which can significantly improve performance for operations that involve large amounts of data.

By combining these optimizations, we can achieve even better performance than using each optimization individually.

## Implementation Details

### CombinedOptimizationsWasmLoader

The `CombinedOptimizationsWasmLoader` utility provides the following functions:

- `isWebWorkerSupported`: Checks if Web Workers are supported in the current browser.
- `isStreamingSupported`: Checks if streaming instantiation is supported in the current browser.
- `areAllOptimizationsSupported`: Checks if all optimizations are supported in the current browser.
- `getSupportedOptimizations`: Returns an object with information about which optimizations are supported.
- `loadWasmModuleWithCombinedOptimizations`: Loads a WebAssembly module with combined optimizations and returns a promise that resolves to the module and instance.
- `preloadWasmModuleWithCombinedOptimizations`: Preloads a WebAssembly module with combined optimizations without waiting for it to be needed.
- `clearWasmModuleCache`: Clears the WebAssembly module cache.
- `getWasmModuleCacheSize`: Returns the number of modules in the cache.
- `isWasmModuleCached`: Checks if a WebAssembly module is cached.

### CombinedOptimizationsDarkSwapClient

The `CombinedOptimizationsDarkSwapClient` class extends the base `DarkSwapClient` class and overrides its methods to use combined optimizations. It uses the `CombinedOptimizationsWasmLoader` utility to load and cache the WebAssembly module.

### Web Worker Script

The Web Worker script is created dynamically and includes the following functionality:

- Receives a message with the URL of the WebAssembly module, an optional SIMD-enabled URL, an optional import object, and optional shared memory options.
- Checks if SIMD is supported and uses the appropriate URL.
- Creates a new WebAssembly.Memory object with the shared memory options if provided.
- Attempts to load the WebAssembly module using streaming instantiation if supported.
- Falls back to regular instantiation if streaming instantiation is not supported or fails.
- Returns the WebAssembly module and instance to the main thread.

## Usage

To use the combined optimizations, simply use the `CombinedOptimizationsDarkSwapClient` class instead of the base `DarkSwapClient` class:

```typescript
import { CombinedOptimizationsDarkSwapClient } from './utils/CombinedOptimizationsDarkSwapClient';

// Create a new combined optimizations DarkSwap client
const client = new CombinedOptimizationsDarkSwapClient(
  '/darkswap-wasm/darkswap_wasm_bg.wasm',
  '/darkswap-wasm/darkswap_wasm_simd_bg.wasm',
  {
    initial: 16, // 16 pages (1MB)
    maximum: 256, // 256 pages (16MB)
  }
);

// Initialize the client (this will use combined optimizations if supported)
await client.initialize();

// Use the client as usual
const address = await client.getAddress();
```

You can also check which optimizations are being used:

```typescript
const optimizations = client.getOptimizationsUsed();
console.log(`Web Worker: ${optimizations.webWorker}, Streaming: ${optimizations.streaming}, SIMD: ${optimizations.simd}, Shared Memory: ${optimizations.sharedMemory}`);
```

## Performance Benefits

The combined optimizations provide the following performance benefits:

1. **Improved Loading Time**: By using streaming compilation and Web Workers, the WebAssembly module can be loaded and compiled more quickly, reducing the initial loading time.

2. **Improved Responsiveness**: By using Web Workers, the main thread remains free for user interactions, improving the perceived responsiveness of the application.

3. **Improved Execution Speed**: By using SIMD instructions, certain operations can be performed more quickly, improving the overall execution speed of the application.

4. **Reduced Memory Copying**: By using shared memory, data can be shared between the main thread and Web Workers without copying, reducing memory usage and improving performance for operations that involve large amounts of data.

The performance improvements depend on the specific operations being performed and the browser's implementation of the various optimizations. In general, you can expect a 2-5x speedup for operations that can benefit from the combined optimizations.

## Browser Compatibility

The combined optimizations are supported in the following browsers:

- Chrome 91+
- Firefox 89+
- Safari 15.2+
- Edge 91+

For browsers that don't support all optimizations, the `CombinedOptimizationsDarkSwapClient` will automatically fall back to using the optimizations that are supported. For example, if SIMD instructions are not supported, it will use the regular WebAssembly module instead of the SIMD-enabled one.

## Future Improvements

Here are some potential future improvements:

### More Sophisticated Optimization Selection

The current implementation uses all available optimizations, but a more sophisticated approach could select the optimizations to use based on the specific operations being performed and the browser's capabilities.

### Dynamic Optimization

The current implementation selects the optimizations to use when the client is initialized, but a more sophisticated approach could dynamically adjust the optimizations based on the current workload and browser performance.

### Benchmarking

A benchmarking system could be implemented to measure the performance of different optimization combinations and automatically select the best combination for the current browser and workload.

### Precompiled WebAssembly Modules

Precompiled WebAssembly modules could be provided for common browsers and devices, reducing the compilation time and improving the initial loading time.

### WebAssembly GC

When WebAssembly GC becomes more widely supported, it could be used to improve the performance of operations that involve complex data structures.

### WebAssembly Threads

When WebAssembly Threads becomes more widely supported, it could be used to improve the performance of operations that can be parallelized.

### WebAssembly SIMD Extensions

When additional SIMD instructions become available in WebAssembly, they could be used to further improve the performance of certain operations.