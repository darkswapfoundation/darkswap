/**
 * Unit tests for SharedMemoryWasmLoader
 */

import {
  isSharedArrayBufferSupported,
  isAtomicsSupported,
  isSharedMemorySupported,
  loadWasmModuleWithSharedMemory,
  preloadWasmModuleWithSharedMemory,
  clearWasmModuleCache,
  getWasmModuleCacheSize,
  isWasmModuleCached,
} from '../SharedMemoryWasmLoader';

describe('SharedMemoryWasmLoader', () => {
  // Mock fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Mock WebAssembly.instantiate
  const mockInstantiate = jest.fn();
  global.WebAssembly = {
    ...global.WebAssembly,
    instantiate: mockInstantiate,
    instantiateStreaming: jest.fn(),
    Memory: jest.fn(),
  };

  // Mock Worker
  const mockWorkerInstance = {
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: null as any,
    onerror: null as any,
  };
  
  const MockWorker = jest.fn(() => mockWorkerInstance);
  global.Worker = MockWorker as any;

  // Mock URL
  global.URL = {
    createObjectURL: jest.fn(() => 'blob-url'),
    revokeObjectURL: jest.fn(),
  } as any;

  // Mock Blob
  global.Blob = jest.fn(() => ({})) as any;

  beforeEach(() => {
    // Clear the cache before each test
    clearWasmModuleCache();
    
    // Reset the mocks
    jest.clearAllMocks();
    
    // Reset worker instance
    mockWorkerInstance.onmessage = null;
    mockWorkerInstance.onerror = null;
    
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

  describe('isSharedArrayBufferSupported', () => {
    it('should return true if SharedArrayBuffer is supported', () => {
      // Mock SharedArrayBuffer
      global.SharedArrayBuffer = jest.fn() as any;
      
      // Check if SharedArrayBuffer is supported
      const result = isSharedArrayBufferSupported();
      
      // Check that the result is true
      expect(result).toBe(true);
    });
    
    it('should return false if SharedArrayBuffer is not supported', () => {
      // Mock SharedArrayBuffer to be undefined
      global.SharedArrayBuffer = undefined as any;
      
      // Check if SharedArrayBuffer is supported
      const result = isSharedArrayBufferSupported();
      
      // Check that the result is false
      expect(result).toBe(false);
    });
  });

  describe('isAtomicsSupported', () => {
    it('should return true if Atomics is supported', () => {
      // Mock Atomics
      global.Atomics = {} as any;
      
      // Check if Atomics is supported
      const result = isAtomicsSupported();
      
      // Check that the result is true
      expect(result).toBe(true);
    });
    
    it('should return false if Atomics is not supported', () => {
      // Mock Atomics to be undefined
      global.Atomics = undefined as any;
      
      // Check if Atomics is supported
      const result = isAtomicsSupported();
      
      // Check that the result is false
      expect(result).toBe(false);
    });
  });

  describe('isSharedMemorySupported', () => {
    it('should return true if SharedArrayBuffer and Atomics are supported', () => {
      // Mock SharedArrayBuffer and Atomics
      global.SharedArrayBuffer = jest.fn() as any;
      global.Atomics = {} as any;
      
      // Check if shared memory is supported
      const result = isSharedMemorySupported();
      
      // Check that the result is true
      expect(result).toBe(true);
    });
    
    it('should return false if SharedArrayBuffer is not supported', () => {
      // Mock SharedArrayBuffer to be undefined and Atomics to be defined
      global.SharedArrayBuffer = undefined as any;
      global.Atomics = {} as any;
      
      // Check if shared memory is supported
      const result = isSharedMemorySupported();
      
      // Check that the result is false
      expect(result).toBe(false);
    });
    
    it('should return false if Atomics is not supported', () => {
      // Mock SharedArrayBuffer to be defined and Atomics to be undefined
      global.SharedArrayBuffer = jest.fn() as any;
      global.Atomics = undefined as any;
      
      // Check if shared memory is supported
      const result = isSharedMemorySupported();
      
      // Check that the result is false
      expect(result).toBe(false);
    });
  });

  describe('loadWasmModuleWithSharedMemory', () => {
    it('should load a WebAssembly module with shared memory if supported', async () => {
      // Mock isSharedMemorySupported to return true
      jest.spyOn(global, 'isSharedMemorySupported' as any).mockReturnValue(true);
      
      // Mock SharedArrayBuffer
      global.SharedArrayBuffer = jest.fn(() => ({})) as any;
      
      // Mock the worker onmessage event
      const mockModule = {};
      const mockInstance = {};
      
      // Create a promise that will be resolved when the test is ready
      const testReady = new Promise<void>((resolve) => {
        // Set up the worker onmessage handler
        mockWorkerInstance.onmessage = (event: any) => {
          // Simulate the worker response
          const messageEvent = {
            data: {
              id: event.data.id,
              success: true,
              module: mockModule,
              instance: mockInstance,
            }
          };
          
          // Call the original onmessage handler with the simulated response
          const onmessageHandler = loadWasmModuleWithSharedMemory as any;
          onmessageHandler(messageEvent);
          
          // Resolve the promise
          resolve();
        };
      });
      
      // Load a module
      const resultPromise = loadWasmModuleWithSharedMemory('/test-path', undefined, {
        initial: 16,
        maximum: 256,
      });
      
      // Wait for the test to be ready
      await testReady;
      
      // Wait for the result
      const result = await resultPromise;
      
      // Check that the module was loaded
      expect(result).toEqual({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Check that the worker was created
      expect(MockWorker).toHaveBeenCalled();
      
      // Check that the worker postMessage was called
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        url: '/test-path',
        importObject: undefined,
        sharedMemory: {
          initial: 16,
          maximum: 256,
          buffer: expect.any(Object),
        },
      });
      
      // Check that the worker was terminated
      expect(mockWorkerInstance.terminate).toHaveBeenCalled();
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module with shared memory: /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded with shared memory in 100ms');
    });
    
    it('should fall back to regular loading if shared memory is not supported', async () => {
      // Mock isSharedMemorySupported to return false
      jest.spyOn(global, 'isSharedMemorySupported' as any).mockReturnValue(false);
      
      // Mock WebAssembly.instantiateStreaming
      const mockModule = {};
      const mockInstance = {};
      (global.WebAssembly.instantiateStreaming as jest.Mock).mockResolvedValue({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Load a module
      const result = await loadWasmModuleWithSharedMemory('/test-path');
      
      // Check that the module was loaded
      expect(result).toEqual({
        module: mockModule,
        instance: mockInstance,
      });
      
      // Check that the worker was not created
      expect(MockWorker).not.toHaveBeenCalled();
      
      // Check that WebAssembly.instantiateStreaming was called
      expect(global.WebAssembly.instantiateStreaming).toHaveBeenCalled();
      
      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Shared memory is not supported, falling back to regular loading');
      
      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module without shared memory: /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded without shared memory in 100ms');
    });
    
    it('should handle worker errors', async () => {
      // Mock isSharedMemorySupported to return true
      jest.spyOn(global, 'isSharedMemorySupported' as any).mockReturnValue(true);
      
      // Mock SharedArrayBuffer
      global.SharedArrayBuffer = jest.fn(() => ({})) as any;
      
      // Create a promise that will be resolved when the test is ready
      const testReady = new Promise<void>((resolve) => {
        // Set up the worker onerror handler
        mockWorkerInstance.onerror = (error: any) => {
          // Call the original onerror handler with the error
          const onerrorHandler = loadWasmModuleWithSharedMemory as any;
          onerrorHandler(error);
          
          // Resolve the promise
          resolve();
        };
      });
      
      // Load a module
      const resultPromise = loadWasmModuleWithSharedMemory('/test-path');
      
      // Wait for the test to be ready
      await testReady;
      
      // Wait for the result
      await expect(resultPromise).rejects.toThrow();
      
      // Check that the worker was created
      expect(MockWorker).toHaveBeenCalled();
      
      // Check that the worker was terminated
      expect(mockWorkerInstance.terminate).toHaveBeenCalled();
    });
    
    it('should handle worker failure', async () => {
      // Mock isSharedMemorySupported to return true
      jest.spyOn(global, 'isSharedMemorySupported' as any).mockReturnValue(true);
      
      // Mock SharedArrayBuffer
      global.SharedArrayBuffer = jest.fn(() => ({})) as any;
      
      // Create a promise that will be resolved when the test is ready
      const testReady = new Promise<void>((resolve) => {
        // Set up the worker onmessage handler
        mockWorkerInstance.onmessage = (event: any) => {
          // Simulate the worker response
          const messageEvent = {
            data: {
              id: event.data.id,
              success: false,
              error: 'Worker error',
            }
          };
          
          // Call the original onmessage handler with the simulated response
          const onmessageHandler = loadWasmModuleWithSharedMemory as any;
          onmessageHandler(messageEvent);
          
          // Resolve the promise
          resolve();
        };
      });
      
      // Load a module
      const resultPromise = loadWasmModuleWithSharedMemory('/test-path');
      
      // Wait for the test to be ready
      await testReady;
      
      // Wait for the result
      await expect(resultPromise).rejects.toThrow('Worker error');
      
      // Check that the worker was created
      expect(MockWorker).toHaveBeenCalled();
      
      // Check that the worker was terminated
      expect(mockWorkerInstance.terminate).toHaveBeenCalled();
    });
  });
});