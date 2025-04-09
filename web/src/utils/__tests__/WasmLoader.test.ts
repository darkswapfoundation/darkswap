/**
 * Unit tests for WasmLoader
 */

import {
  loadWasmModule,
  preloadWasmModule,
  clearWasmModuleCache,
  getWasmModuleCacheSize,
  isWasmModuleCached,
} from '../WasmLoader';

// Mock the dynamic import
jest.mock('test-import', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ test: 'module' }),
}), { virtual: true });

describe('WasmLoader', () => {
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
      error: jest.fn(),
    } as any;
  });

  describe('loadWasmModule', () => {
    it('should load a WebAssembly module', async () => {
      // Load a module
      const module = await loadWasmModule('/test-path', 'test-import');
      
      // Check that the module was loaded
      expect(module).toEqual({ test: 'module' });
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module: test-import from /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded in 100ms');
    });
    
    it('should cache the module', async () => {
      // Load a module
      const module1 = await loadWasmModule('/test-path', 'test-import');
      
      // Reset the mocks
      jest.clearAllMocks();
      
      // Load the same module again
      const module2 = await loadWasmModule('/test-path', 'test-import');
      
      // Check that the modules are the same
      expect(module1).toBe(module2);
      
      // Check that the console.log was not called
      expect(console.log).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock the dynamic import to throw an error
      jest.mock('error-import', () => {
        throw new Error('Test error');
      }, { virtual: true });
      
      // Try to load a module that will throw an error
      await expect(loadWasmModule('/test-path', 'error-import')).rejects.toThrow();
      
      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load WebAssembly module: error-import from /test-path',
        expect.any(Error)
      );
    });
  });

  describe('preloadWasmModule', () => {
    it('should preload a WebAssembly module', async () => {
      // Preload a module
      await preloadWasmModule('/test-path', 'test-import');
      
      // Check that the module was loaded
      expect(isWasmModuleCached('/test-path', 'test-import')).toBe(true);
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('WebAssembly module preloaded: test-import from /test-path');
    });
    
    it('should handle errors', async () => {
      // Mock the dynamic import to throw an error
      jest.mock('error-import', () => {
        throw new Error('Test error');
      }, { virtual: true });
      
      // Try to preload a module that will throw an error
      await preloadWasmModule('/test-path', 'error-import');
      
      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Failed to preload WebAssembly module: error-import from /test-path',
        expect.any(Error)
      );
    });
  });

  describe('clearWasmModuleCache', () => {
    it('should clear the WebAssembly module cache', async () => {
      // Load a module
      await loadWasmModule('/test-path', 'test-import');
      
      // Check that the module is cached
      expect(isWasmModuleCached('/test-path', 'test-import')).toBe(true);
      
      // Clear the cache
      clearWasmModuleCache();
      
      // Check that the module is no longer cached
      expect(isWasmModuleCached('/test-path', 'test-import')).toBe(false);
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('WebAssembly module cache cleared');
    });
  });

  describe('getWasmModuleCacheSize', () => {
    it('should return the size of the WebAssembly module cache', async () => {
      // Check that the cache is empty
      expect(getWasmModuleCacheSize()).toBe(0);
      
      // Load a module
      await loadWasmModule('/test-path', 'test-import');
      
      // Check that the cache has one module
      expect(getWasmModuleCacheSize()).toBe(1);
      
      // Load another module
      await loadWasmModule('/test-path-2', 'test-import');
      
      // Check that the cache has two modules
      expect(getWasmModuleCacheSize()).toBe(2);
    });
  });

  describe('isWasmModuleCached', () => {
    it('should return whether a WebAssembly module is cached', async () => {
      // Check that the module is not cached
      expect(isWasmModuleCached('/test-path', 'test-import')).toBe(false);
      
      // Load a module
      await loadWasmModule('/test-path', 'test-import');
      
      // Check that the module is cached
      expect(isWasmModuleCached('/test-path', 'test-import')).toBe(true);
      
      // Check that another module is not cached
      expect(isWasmModuleCached('/test-path-2', 'test-import')).toBe(false);
    });
  });
});