/**
 * Unit tests for SimdWasmLoader
 */

import {
  isSimdSupported,
  loadWasmModuleWithSimd,
  preloadWasmModuleWithSimd,
  clearWasmModuleCache,
  getWasmModuleCacheSize,
  isWasmModuleCached,
} from '../SimdWasmLoader';

describe('SimdWasmLoader', () => {
  // Mock fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Mock WebAssembly.compile
  const mockCompile = jest.fn();
  global.WebAssembly = {
    ...global.WebAssembly,
    compile: mockCompile,
    instantiateStreaming: jest.fn(),
    instantiate: jest.fn(),
  };

  beforeEach(() => {
    // Clear the cache before each test
    clearWasmModuleCache();
    
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

  describe('isSimdSupported', () => {
    it('should return true if SIMD is supported', async () => {
      // Mock WebAssembly.compile to succeed
      mockCompile.mockResolvedValue({});
      
      // Check if SIMD is supported
      const result = await isSimdSupported();
      
      // Check that WebAssembly.compile was called
      expect(mockCompile).toHaveBeenCalled();
      
      // Check that the result is true
      expect(result).toBe(true);
    });
    
    it('should return false if SIMD is not supported', async () => {
      // Mock WebAssembly.compile to fail
      mockCompile.mockRejectedValue(new Error('SIMD not supported'));
      
      // Check if SIMD is supported
      const result = await isSimdSupported();
      
      // Check that WebAssembly.compile was called
      expect(mockCompile).toHaveBeenCalled();
      
      // Check that the result is false
      expect(result).toBe(false);
      
      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('SIMD is not supported:', expect.any(Error));
    });
  });

  describe('loadWasmModuleWithSimd', () => {
    it('should load a WebAssembly module with SIMD support if available', async () => {
      // Mock isSimdSupported to return true
      jest.spyOn(global, 'isSimdSupported' as any).mockResolvedValue(true);
      
      // Mock WebAssembly.instantiateStreaming
      const mockModule = {};
      const mockInstance = {};
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Load a module
      const result = await loadWasmModuleWithSimd('/simd-path', '/fallback-path');
      
      // Check that the module was loaded
      expect(result).toEqual({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Check that WebAssembly.instantiateStreaming was called with the SIMD path
      expect(global.WebAssembly.instantiateStreaming).toHaveBeenCalledWith(
        expect.any(Promise),
        {}
      );
      
      // Check that fetch was called with the SIMD path
      expect(mockFetch).toHaveBeenCalledWith('/simd-path');
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module with SIMD: /simd-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded in 100ms (SIMD: true)');
    });
    
    it('should load a WebAssembly module with fallback if SIMD is not supported', async () => {
      // Mock isSimdSupported to return false
      jest.spyOn(global, 'isSimdSupported' as any).mockResolvedValue(false);
      
      // Mock WebAssembly.instantiateStreaming
      const mockModule = {};
      const mockInstance = {};
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Load a module
      const result = await loadWasmModuleWithSimd('/simd-path', '/fallback-path');
      
      // Check that the module was loaded
      expect(result).toEqual({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Check that WebAssembly.instantiateStreaming was called with the fallback path
      expect(global.WebAssembly.instantiateStreaming).toHaveBeenCalledWith(
        expect.any(Promise),
        {}
      );
      
      // Check that fetch was called with the fallback path
      expect(mockFetch).toHaveBeenCalledWith('/fallback-path');
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module with SIMD: /simd-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded in 100ms (SIMD: false)');
    });
    
    it('should fall back to regular instantiation if streaming instantiation fails', async () => {
      // Mock isSimdSupported to return true
      jest.spyOn(global, 'isSimdSupported' as any).mockResolvedValue(true);
      
      // Mock WebAssembly.instantiateStreaming to fail
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockRejectedValue(new Error('Streaming instantiation failed'));
      
      // Mock WebAssembly.instantiate
      const mockModule = {};
      const mockInstance = {};
      (global.WebAssembly.instantiate as jest.Mock).mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Mock fetch
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      // Load a module
      const result = await loadWasmModuleWithSimd('/simd-path', '/fallback-path');
      
      // Check that the module was loaded
      expect(result).toEqual({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Check that WebAssembly.instantiateStreaming was called
      expect(global.WebAssembly.instantiateStreaming).toHaveBeenCalled();
      
      // Check that WebAssembly.instantiate was called
      expect(global.WebAssembly.instantiate).toHaveBeenCalled();
      
      // Check that fetch was called
      expect(mockFetch).toHaveBeenCalledWith('/simd-path');
      
      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Streaming instantiation failed, falling back to regular instantiation:', expect.any(Error));
    });
    
    it('should cache the module', async () => {
      // Mock isSimdSupported to return true
      jest.spyOn(global, 'isSimdSupported' as any).mockResolvedValue(true);
      
      // Mock WebAssembly.instantiateStreaming
      const mockModule = {};
      const mockInstance = {};
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Load a module
      const result1 = await loadWasmModuleWithSimd('/simd-path', '/fallback-path');
      
      // Reset the mocks
      jest.clearAllMocks();
      
      // Load the same module again
      const result2 = await loadWasmModuleWithSimd('/simd-path', '/fallback-path');
      
      // Check that the modules are the same
      expect(result1).toBe(result2);
      
      // Check that WebAssembly.instantiateStreaming was not called
      expect(global.WebAssembly.instantiateStreaming).not.toHaveBeenCalled();
      
      // Check that fetch was not called
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Check that the console.log was not called
      expect(console.log).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock isSimdSupported to return true
      jest.spyOn(global, 'isSimdSupported' as any).mockResolvedValue(true);
      
      // Mock WebAssembly.instantiateStreaming to fail
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockRejectedValue(new Error('Streaming instantiation failed'));
      
      // Mock WebAssembly.instantiate to fail
      (global.WebAssembly.instantiate as jest.Mock).mockRejectedValue(new Error('Instantiation failed'));
      
      // Mock fetch
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      mockFetch.mockResolvedValue(mockResponse);
      
      // Try to load a module
      await expect(loadWasmModuleWithSimd('/simd-path', '/fallback-path')).rejects.toThrow('Instantiation failed');
      
      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to load WebAssembly module: /simd-path', expect.any(Error));
    });
  });
});