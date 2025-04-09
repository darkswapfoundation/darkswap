# DarkSwap WebAssembly Code Splitting Optimizations

This document describes the code splitting optimizations implemented for the DarkSwap WebAssembly integration.

## Table of Contents

1. [Introduction](#introduction)
2. [Code Splitting](#code-splitting)
3. [Implementation Details](#implementation-details)
4. [Usage](#usage)
5. [Performance Benefits](#performance-benefits)
6. [Browser Compatibility](#browser-compatibility)
7. [Future Improvements](#future-improvements)

## Introduction

The DarkSwap WebAssembly integration allows the DarkSwap SDK to be used in web applications. To improve the initial page load time, we've implemented code splitting optimizations that split large WebAssembly modules into smaller chunks that are loaded on demand.

## Code Splitting

Code splitting is a technique where a large file is split into smaller chunks that can be loaded on demand. This is particularly useful for WebAssembly modules, which can be quite large and slow down the initial page load time.

By splitting a WebAssembly module into smaller chunks, we can:

1. Reduce the initial download size
2. Improve the perceived performance of the application
3. Enable more efficient caching
4. Reduce memory usage during loading

## Implementation Details

### CodeSplitWasmLoader

The `CodeSplitWasmLoader` utility provides the following functions:

- `loadWasmModuleWithCodeSplitting`: Loads a WebAssembly module using code splitting and returns a promise that resolves to the module and instance.
- `preloadWasmModuleWithCodeSplitting`: Preloads a WebAssembly module using code splitting without waiting for it to be needed.
- `clearWasmModuleCache`: Clears the WebAssembly module cache.
- `clearWasmChunkCache`: Clears the WebAssembly chunk cache.
- `getWasmModuleCacheSize`: Returns the number of modules in the cache.
- `getWasmChunkCacheSize`: Returns the number of chunks in the cache.
- `isWasmModuleCached`: Checks if a WebAssembly module is cached.
- `isWasmChunkCached`: Checks if a WebAssembly chunk is cached.
- `splitWasmModule`: Splits a WebAssembly module into chunks.
- `createWasmManifest`: Creates a manifest for a WebAssembly module.

### CodeSplitDarkSwapClient

The `CodeSplitDarkSwapClient` class extends the base `DarkSwapClient` class and overrides its methods to use code splitting for loading the WebAssembly module. It uses the `CodeSplitWasmLoader` utility to load and cache the WebAssembly module.

### Manifest and Chunks

The code splitting implementation uses a manifest file to describe the chunks that make up a WebAssembly module. The manifest includes:

- The total size of the WebAssembly module
- The size of each chunk
- The number of chunks
- The URL of each chunk

The chunks are loaded in parallel and combined before instantiating the WebAssembly module.

## Usage

To use the code splitting optimizations, simply use the `CodeSplitDarkSwapClient` class instead of the base `DarkSwapClient` class:

```typescript
import { CodeSplitDarkSwapClient } from './utils/CodeSplitDarkSwapClient';

// Create a new code split DarkSwap client with 4 chunks
const client = new CodeSplitDarkSwapClient('/darkswap-wasm', 4);

// Initialize the client (this will load the WebAssembly module using code splitting)
await client.initialize();

// Use the client as usual
const address = await client.getAddress();
```

## Performance Benefits

The code splitting optimizations provide the following performance benefits:

1. **Reduced Initial Download Size**: By splitting the WebAssembly module into smaller chunks, the initial download size is reduced, which improves the perceived performance of the application.
2. **Parallel Loading**: The chunks can be loaded in parallel, which can significantly improve the loading time on fast connections.
3. **Efficient Caching**: Each chunk can be cached separately, which enables more efficient caching and reduces the amount of data that needs to be downloaded when the WebAssembly module is updated.
4. **Reduced Memory Usage**: By loading the WebAssembly module in smaller chunks, the memory usage during loading is reduced, which can be particularly important on mobile devices with limited memory.

## Browser Compatibility

Code splitting is supported in all modern browsers, including:

- Chrome
- Firefox
- Safari
- Edge

However, the performance benefits may vary depending on the browser and the network conditions.

## Future Improvements

Here are some potential future improvements:

### Dynamic Chunk Size

Instead of using a fixed chunk size, the chunk size could be dynamically determined based on the size of the WebAssembly module and the network conditions. This would enable more efficient loading on different devices and network conditions.

### Lazy Loading of Chunks

Instead of loading all chunks at once, the chunks could be loaded on demand as they are needed. This would further reduce the initial download size and improve the perceived performance of the application.

### Compression

The chunks could be compressed using techniques like Brotli or Gzip to further reduce the download size. This would be particularly useful for large WebAssembly modules.

### Preloading

The chunks could be preloaded when the browser is idle, which would improve the performance of subsequent calls to functions that require the WebAssembly module. This could be implemented using the `requestIdleCallback` function.

### WebAssembly Streaming

The code splitting implementation could be combined with WebAssembly streaming to further improve the loading time. This would enable the WebAssembly module to be compiled while it's being downloaded, which can significantly reduce the total loading time.