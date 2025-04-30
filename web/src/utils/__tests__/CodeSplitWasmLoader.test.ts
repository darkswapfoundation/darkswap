/**
 * Unit tests for CodeSplitWasmLoader
 */

import {
  loadWasmModuleWithCodeSplitting,
  preloadWasmModuleWithCodeSplitting,
  clearWasmModuleCache,
  clearWasmChunkCache,
  getWasmModuleCacheSize,
  getWasmChunkCacheSize,
  isWasmModuleCached,
  isWasmChunkCached,
  splitWasmModule,
  createWasmManifest,
} from '../CodeSplitWasmLoader';

describe('CodeSplitWasmLoader', () => {
  // Mock fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Mock WebAssembly.instantiate
  const mockInstantiate = jest.fn();
  global.WebAssembly = {
    ...global.WebAssembly,
    instantiate: mockInstantiate,
  };

  beforeEach(() => {
    // Clear the cache before each test
    clearWasmModuleCache();
    clearWasmChunkCache();
    
    // Reset the mocks
    jest.clearAllMocks();
    
    // Mock the performance API
    global.performance = {
      now: jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(100),
    } as any;
    
    // Mock the console
    global.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;
  });

  describe('loadWasmModuleWithCodeSplitting', () => {
    it('should load a WebAssembly module using code splitting', async () => {
      // Mock the manifest response
      const mockManifest = {
        totalSize: 1000,
        chunkSize: 500,
        chunkCount: 2,
        chunks: [
          { index: 0, size: 500, url: 'chunk_0.wasm' },
          { index: 1, size: 500, url: 'chunk_1.wasm' },
        ],
      };
      
      // Mock the fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === '/test-path/manifest.json') {
          return Promise.resolve({
            json: () => Promise.resolve(mockManifest),
          });
        } else if (url === '/test-path/chunk_0.wasm') {
          return Promise.resolve({
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(500)),
          });
        } else if (url === '/test-path/chunk_1.wasm') {
          return Promise.resolve({
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(500)),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });
      
      // Mock the WebAssembly.instantiate function
      const mockModule = {};
      const mockInstance = {};
      mockInstantiate.mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Load a module
      const result = await loadWasmModuleWithCodeSplitting('/test-path', 2);
      
      // Check that the module was loaded
      expect(result).toEqual({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Check that fetch was called for the manifest and chunks
      expect(mockFetch).toHaveBeenCalledWith('/test-path/manifest.json');
      expect(mockFetch).toHaveBeenCalledWith('/test-path/chunk_0.wasm');
      expect(mockFetch).toHaveBeenCalledWith('/test-path/chunk_1.wasm');
      
      // Check that WebAssembly.instantiate was called
      expect(mockInstantiate).toHaveBeenCalled();
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module with code splitting: /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded in 100ms');
    });
    
    it('should cache the module', async () => {
      // Mock the manifest response
      const mockManifest = {
        totalSize: 1000,
        chunkSize: 500,
        chunkCount: 2,
        chunks: [
          { index: 0, size: 500, url: 'chunk_0.wasm' },
          { index: 1, size: 500, url: 'chunk_1.wasm' },
        ],
      };
      
      // Mock the fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === '/test-path/manifest.json') {
          return Promise.resolve({
            json: () => Promise.resolve(mockManifest),
          });
        } else if (url === '/test-path/chunk_0.wasm') {
          return Promise.resolve({
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(500)),
          });
        } else if (url === '/test-path/chunk_1.wasm') {
          return Promise.resolve({
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(500)),
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });
      
      // Mock the WebAssembly.instantiate function
      const mockModule = {};
      const mockInstance = {};
      mockInstantiate.mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Load a module
      const result1 = await loadWasmModuleWithCodeSplitting('/test-path', 2);
      
      // Reset the mocks
      jest.clearAllMocks();
      
      // Load the same module again
      const result2 = await loadWasmModuleWithCodeSplitting('/test-path', 2);
      
      // Check that the modules are the same
      expect(result1).toBe(result2);
      
      // Check that fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Check that WebAssembly.instantiate was not called
      expect(mockInstantiate).not.toHaveBeenCalled();
      
      // Check that the console.log was not called
      expect(console.log).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock the fetch function to throw an error
      mockFetch.mockRejectedValue(new Error('Test error'));
      
      // Try to load a module
      await expect(loadWasmModuleWithCodeSplitting('/test-path', 2)).rejects.toThrow('Test error');
      
      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to load WebAssembly module: /test-path', expect.any(Error));
    });
  });

  describe('splitWasmModule', () => {
    it('should split a WebAssembly module into chunks', () => {
      // Create a test buffer
      const buffer = new ArrayBuffer(1000);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < 1000; i++) {
        view[i] = i % 256;
      }
      
      // Split the buffer into chunks
      const chunks = splitWasmModule(buffer, 500);
      
      // Check that the chunks are correct
      expect(chunks.length).toBe(2);
      expect(chunks[0].byteLength).toBe(500);
      expect(chunks[1].byteLength).toBe(500);
      
      // Check that the chunks contain the correct data
      const chunk0View = new Uint8Array(chunks[0]);
      const chunk1View = new Uint8Array(chunks[1]);
      for (let i = 0; i < 500; i++) {
        expect(chunk0View[i]).toBe(i % 256);
        expect(chunk1View[i]).toBe((i + 500) % 256);
      }
    });
  });

  describe('createWasmManifest', () => {
    it('should create a manifest for a WebAssembly module', () => {
      // Create a test buffer
      const buffer = new ArrayBuffer(1000);
      
      // Create a manifest
      const manifest = createWasmManifest(buffer, 500);
      
      // Check that the manifest is correct
      expect(manifest).toEqual({
        totalSize: 1000,
        chunkSize: 500,
        chunkCount: 2,
        chunks: [
          { index: 0, size: 500, url: 'chunk_0.wasm' },
          { index: 1, size: 500, url: 'chunk_1.wasm' },
        ],
      });
    });
  });
});