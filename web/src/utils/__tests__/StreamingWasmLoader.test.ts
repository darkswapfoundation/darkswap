/**
 * Unit tests for StreamingWasmLoader
 */

import {
  loadWasmModuleStreaming,
  instantiateWasmModuleStreaming,
  preloadWasmModuleStreaming,
  clearWasmModuleCache,
  clearWasmInstanceCache,
  getWasmModuleCacheSize,
  getWasmInstanceCacheSize,
  isWasmModuleCached,
  isWasmInstanceCached,
  isStreamingCompilationSupported,
  isStreamingInstantiationSupported,
} from '../StreamingWasmLoader';

describe('StreamingWasmLoader', () => {
  // Mock fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Mock WebAssembly.compileStreaming
  const mockCompileStreaming = jest.fn();
  global.WebAssembly = {
    ...global.WebAssembly,
    compileStreaming: mockCompileStreaming,
    instantiateStreaming: jest.fn(),
    compile: jest.fn(),
    instantiate: jest.fn(),
  };

  beforeEach(() => {
    // Clear the cache before each test
    clearWasmModuleCache();
    clearWasmInstanceCache();
    
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

  describe('loadWasmModuleStreaming', () => {
    it('should load a WebAssembly module using streaming compilation', async () => {
      // Mock the WebAssembly.compileStreaming function
      const mockModule = {};
      mockCompileStreaming.mockResolvedValue(mockModule);
      
      // Load a module
      const module = await loadWasmModuleStreaming('/test-path');
      
      // Check that the module was loaded
      expect(module).toBe(mockModule);
      
      // Check that WebAssembly.compileStreaming was called
      expect(mockCompileStreaming).toHaveBeenCalledWith(expect.any(Promise));
      
      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledWith('/test-path');
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module streaming: /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded in 100ms');
    });
    
    it('should cache the module', async () => {
      // Mock the WebAssembly.compileStreaming function
      const mockModule = {};
      mockCompileStreaming.mockResolvedValue(mockModule);
      
      // Load a module
      const module1 = await loadWasmModuleStreaming('/test-path');
      
      // Reset the mocks
      jest.clearAllMocks();
      
      // Load the same module again
      const module2 = await loadWasmModuleStreaming('/test-path');
      
      // Check that the modules are the same
      expect(module1).toBe(module2);
      
      // Check that WebAssembly.compileStreaming was not called
      expect(mockCompileStreaming).not.toHaveBeenCalled();
      
      // Check that fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Check that the console.log was not called
      expect(console.log).not.toHaveBeenCalled();
    });
    
    it('should fall back to non-streaming compilation if streaming compilation fails', async () => {
      // Mock the WebAssembly.compileStreaming function to throw an error
      mockCompileStreaming.mockRejectedValue(new Error('Streaming compilation not supported'));
      
      // Mock the WebAssembly.compile function
      const mockModule = {};
      (global.WebAssembly.compile as jest.Mock).mockResolvedValue(mockModule);
      
      // Mock the fetch function
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      // Load a module
      const module = await loadWasmModuleStreaming('/test-path');
      
      // Check that the module was loaded
      expect(module).toBe(mockModule);
      
      // Check that WebAssembly.compileStreaming was called
      expect(mockCompileStreaming).toHaveBeenCalledWith(expect.any(Promise));
      
      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledWith('/test-path');
      
      // Check that WebAssembly.compile was called
      expect(global.WebAssembly.compile).toHaveBeenCalledWith(expect.any(ArrayBuffer));
      
      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith(
        'Streaming compilation failed, falling back to non-streaming: Error: Streaming compilation not supported'
      );
    });
  });

  describe('instantiateWasmModuleStreaming', () => {
    it('should instantiate a WebAssembly module using streaming instantiation', async () => {
      // Mock the WebAssembly.instantiateStreaming function
      const mockInstance = {};
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockResolvedValue({
        instance: mockInstance,
      });
      
      // Instantiate a module
      const instance = await instantiateWasmModuleStreaming('/test-path');
      
      // Check that the instance was created
      expect(instance).toBe(mockInstance);
      
      // Check that WebAssembly.instantiateStreaming was called
      expect(global.WebAssembly.instantiateStreaming).toHaveBeenCalledWith(
        expect.any(Promise),
        {}
      );
      
      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledWith('/test-path');
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Instantiating WebAssembly module streaming: /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly instance created in 100ms');
    });
  });

  describe('isStreamingCompilationSupported', () => {
    it('should return true if streaming compilation is supported', () => {
      // Check that streaming compilation is supported
      expect(isStreamingCompilationSupported()).toBe(true);
    });
    
    it('should return false if streaming compilation is not supported', () => {
      // Mock WebAssembly.compileStreaming to be undefined
      const originalCompileStreaming = global.WebAssembly.compileStreaming;
      global.WebAssembly.compileStreaming = undefined as any;
      
      // Check that streaming compilation is not supported
      expect(isStreamingCompilationSupported()).toBe(false);
      
      // Restore WebAssembly.compileStreaming
      global.WebAssembly.compileStreaming = originalCompileStreaming;
    });
  });

  describe('isStreamingInstantiationSupported', () => {
    it('should return true if streaming instantiation is supported', () => {
      // Check that streaming instantiation is supported
      expect(isStreamingInstantiationSupported()).toBe(true);
    });
    
    it('should return false if streaming instantiation is not supported', () => {
      // Mock WebAssembly.instantiateStreaming to be undefined
      const originalInstantiateStreaming = global.WebAssembly.instantiateStreaming;
      global.WebAssembly.instantiateStreaming = undefined as any;
      
      // Check that streaming instantiation is not supported
      expect(isStreamingInstantiationSupported()).toBe(false);
      
      // Restore WebAssembly.instantiateStreaming
      global.WebAssembly.instantiateStreaming = originalInstantiateStreaming;
    });
  });
});